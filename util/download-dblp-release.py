#!/usr/bin/env python3
"""Download a DBLP XML release from the Dagstuhl DROPS archive.

The rolling dump at https://dblp.org/xml/dblp.xml.gz (and the uni-trier.de
mirror) sits behind an Anubis proof-of-work bot check as of September 2026.
Plain curl gets a 200 with a 7 KB HTML challenge page instead of the data, and
the monthly update then fails several steps later with "not in gzip format".
The dated monthly releases on drops.dagstuhl.de are the sanctioned bulk
download path and are served directly.

Releases are named dblp-YYYY-MM-01.xml.gz and appear within a few days of the
first of the month. With no --release given, this script tries the current
month first and falls back to the previous month, so a run early in the month
still finds something.

Every download is checked for the gzip magic bytes before it is accepted, so a
challenge page or error page can never masquerade as data again.

Usage:
    download-dblp-release.py                       # latest release -> dblp-original.xml.gz
    download-dblp-release.py --release 2026-08-01  # a specific release
    download-dblp-release.py --dry-run             # print the URL that would be used
    download-dblp-release.py --print-month         # "September 2026" for the last download

The release date of the last download is recorded in dblp-release-date.txt
(gitignored) so `make update-dblp-date` can stamp index.html with the month
of the data actually used rather than the month the job happened to run.
"""

import argparse
import datetime
import os
import subprocess
import sys
import urllib.error
import urllib.request

RELEASE_BASE = "https://drops.dagstuhl.de/storage/artifacts/dblp/xml"
STAMP_FILE = "dblp-release-date.txt"
GZIP_MAGIC = b"\x1f\x8b"


def release_url(release: datetime.date) -> str:
    return f"{RELEASE_BASE}/{release.year}/dblp-{release.isoformat()}.xml.gz"


def first_of_month(d: datetime.date) -> datetime.date:
    return d.replace(day=1)


def previous_month(d: datetime.date) -> datetime.date:
    first = first_of_month(d)
    return (first - datetime.timedelta(days=1)).replace(day=1)


def exists(url: str) -> bool:
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            ctype = resp.headers.get("Content-Type", "")
            # A bot-check or error page is text/html; the release is x-gzip.
            return resp.status == 200 and not ctype.startswith("text/html")
    except urllib.error.HTTPError:
        return False


def resolve_release(explicit: str | None) -> datetime.date:
    if explicit:
        return datetime.date.fromisoformat(explicit)
    today = datetime.date.today()
    candidates = [first_of_month(today), previous_month(today)]
    for candidate in candidates:
        if exists(release_url(candidate)):
            return candidate
    tried = ", ".join(c.isoformat() for c in candidates)
    sys.exit(f"Error: no DBLP release found on {RELEASE_BASE} (tried {tried})")


def is_gzip(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            return f.read(2) == GZIP_MAGIC
    except OSError:
        return False


def download(url: str, output: str) -> None:
    # curl rather than urllib: 1 GB transfer, and curl gives a progress meter
    # and handles retries/resume sensibly. -f turns HTTP errors into failures
    # instead of saving the error page as the output file.
    cmd = ["curl", "-f", "-L", "--retry", "3", "-o", output, url]
    print(" ".join(cmd), flush=True)
    result = subprocess.run(cmd)
    if result.returncode != 0:
        if os.path.exists(output):
            os.remove(output)
        sys.exit(f"Error: download failed (curl exit {result.returncode}): {url}")
    if not is_gzip(output):
        with open(output, "rb") as f:
            head = f.read(200)
        os.remove(output)
        sys.exit(
            f"Error: {url} did not return gzip data; removed {output}.\n"
            f"First bytes: {head!r}"
        )


def print_month() -> None:
    """Print the month/year of the last downloaded release, e.g. 'September 2026'.

    Falls back to the current month when there is no stamp file, which keeps
    `make update-dblp-date` working when run on its own.
    """
    try:
        with open(STAMP_FILE) as f:
            release = datetime.date.fromisoformat(f.read().strip())
    except (OSError, ValueError):
        release = datetime.date.today()
    print(release.strftime("%B %Y"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--release", help="release date, YYYY-MM-01 (default: latest available)")
    parser.add_argument("--output", default="dblp-original.xml.gz", help="where to save the file")
    parser.add_argument("--dry-run", action="store_true", help="resolve and print the URL only")
    parser.add_argument("--print-month", action="store_true",
                        help=f"print the month of the release recorded in {STAMP_FILE} and exit")
    args = parser.parse_args()

    if args.print_month:
        print_month()
        return

    release = resolve_release(args.release)
    url = release_url(release)
    if args.dry_run:
        print(url)
        return

    print(f"Downloading DBLP release {release.isoformat()} -> {args.output}", flush=True)
    download(url, args.output)
    size_mb = os.path.getsize(args.output) / (1024 * 1024)
    print(f"Saved {args.output} ({size_mb:.0f} MB, release {release.isoformat()})")

    if not args.release:
        with open(STAMP_FILE, "w") as f:
            f.write(release.isoformat() + "\n")


if __name__ == "__main__":
    main()
