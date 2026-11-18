#!/usr/bin/env python3
"""Keep IJCAI's non-research tracks in non-research-papers.csv up to date.

IJCAI publishes its survey, journal, sister-conference and early-career papers
in the same proceedings as its research papers, and DBLP's records carry no
trace of the track. The only place the track is recorded is the table of
contents on ijcai.org, so this script reads it, matches each paper to its DBLP
record by DOI (10.24963/ijcai.YYYY/N), and appends the DBLP keys of papers in
excluded tracks to non-research-papers.csv.

Each year this used to be done by hand; IJCAI 2026 was missed, so 45 survey and
other non-research papers were briefly counted.

Section names on the table of contents change from year to year. Any section
this script does not know is reported (see --report) rather than guessed at:
add it to EXCLUDED_TRACKS or COUNTED_TRACKS below.

Usage:
    python3 util/ijcai_tracks.py                      # this year and last year
    python3 util/ijcai_tracks.py --year 2026 --dry-run
    python3 util/ijcai_tracks.py --year 2026 --toc-file toc.html
"""

import argparse
import csv
import datetime
import html
import io
import lzma
import os
import re
import ssl
import sys
import unicodedata
import urllib.error
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Table-of-contents section -> track label used in non-research-papers.csv.
EXCLUDED_TRACKS = {
    "Survey Track": "IJCAI Survey Track",
    "Sister Conferences Best Papers": "IJCAI Sister Conferences Best Papers",
    "Journal Track": "IJCAI Journal Track",
    "Early Career": "IJCAI Early Career",
    "Early Career Spotlight": "IJCAI Early Career",
}

# Sections whose papers count, or that the 6-page minimum already removes
# (Doctoral Consortium and Demo papers are 2-5 pages).
COUNTED_TRACKS = frozenset([
    "Main Track",
    "Late Papers",
    "Special Track on AI, the Arts and Creativity",
    "Special Track on AI for Good",
    "AI and Arts",
    "AI, Arts & Creativity",
    "AI for Good",
    "AI for Good - Projects",
    "AI and Social Good",
    "AI and Health",
    "AI and Robotics",
    "AI4Tech: AI Enabling Technologies",
    "Human-Centred AI",
    "Search",
    "Uncertainty in AI",
    "Doctoral Consortium",
    "Demo Track",
])

TOC_URL = "https://www.ijcai.org/proceedings/{year}/"


def _ssl_context():
    """Verify against certifi's CA bundle when installed (python.org macOS builds lack system CAs)."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def fetch_toc(year):
    """The table of contents for `year`, or None if it is not published yet."""
    req = urllib.request.Request(TOC_URL.format(year=year), headers={"User-Agent": "Mozilla/5.0 (CSRankings)"})
    try:
        with urllib.request.urlopen(req, timeout=60, context=_ssl_context()) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def parse_toc(page, year):
    """Map paper number -> (section, title) from an ijcai.org table of contents."""
    papers = {}
    parts = re.split(r'class="section_title"><h3>([^<]*)', page)
    for i in range(1, len(parts), 2):
        section = html.unescape(parts[i]).strip()
        for m in re.finditer(r'<a class="title" href="/proceedings/%d/(\d+)">(.*?)</a>' % year, parts[i + 1], re.S):
            title = html.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip()
            papers[int(m.group(1))] = (section, title)
    return papers


def dblp_records(dblp_path, year):
    """Map paper number -> (DBLP key, title) for IJCAI `year` records in the filtered DBLP."""
    doi = re.compile(r"10\.24963/ijcai\.%d/(\d+)" % year)
    with lzma.open(dblp_path, "rb") as f:
        text = f.read().decode("utf-8")
    records = {}
    for key, body in re.findall(r'<inproceedings[^>]*key="(conf/ijcai/[^"]*)"[^>]*>(.*?)</inproceedings>', text, re.S):
        m = doi.search(body)
        if m is None or "<crossref>conf/ijcai/%d</crossref>" % year not in body:
            continue
        t = re.search(r"<title>(.*?)</title>", body, re.S)
        records[int(m.group(1))] = (key, re.sub(r"<[^>]+>", "", t.group(1)) if t else "")
    return records


def normalize(title):
    t = unicodedata.normalize("NFKD", html.unescape(title)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", t.lower())


def plain(text):
    """Untrusted page text, made safe to put in a Markdown issue body."""
    return re.sub(r"[^\w &:,.()-]", "", text)[:80]


def plan(toc, records, year):
    """Return (rows to exclude, problems) for one year."""
    rows, problems, unknown = [], [], {}
    for number, (section, toc_title) in sorted(toc.items()):
        if section in COUNTED_TRACKS:
            continue
        if section not in EXCLUDED_TRACKS:
            unknown[section] = unknown.get(section, 0) + 1
            continue
        if number not in records:
            continue  # Not in DBLP yet; picked up by a later run.
        key, dblp_title = records[number]
        if normalize(toc_title).rstrip(".") != normalize(dblp_title).rstrip("."):
            problems.append(f"IJCAI {year} paper {number}: ijcai.org title does not match DBLP `{key}`; not excluded.")
            continue
        rows.append([key, EXCLUDED_TRACKS[section], TOC_URL.format(year=year)])
    for section, n in sorted(unknown.items()):
        problems.append(f"IJCAI {year}: unknown table-of-contents section \"{plain(section)}\" ({n} papers). "
                        f"Add it to EXCLUDED_TRACKS or COUNTED_TRACKS in util/ijcai_tracks.py.")
    return rows, problems


def update_csv(csv_path, new_rows):
    """Add rows whose key is not already listed; keep the file sorted by key. Returns rows added."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        raw = f.read()
    newline = "\r\n" if "\r\n" in raw else "\n"
    rows = list(csv.reader(io.StringIO(raw)))
    header, body = rows[0], rows[1:]
    have = {r[0] for r in body}
    added = [r for r in new_rows if r[0] not in have]
    if added:
        out = io.StringIO()
        w = csv.writer(out, lineterminator=newline)
        w.writerow(header)
        w.writerows(sorted(body + added, key=lambda r: r[0]))
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            f.write(out.getvalue())
    return added


def main():
    this_year = datetime.date.today().year
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--year", type=int, action="append", help="proceedings year (repeatable; default: this year and last)")
    ap.add_argument("--dblp", default=os.path.join(REPO_ROOT, "dblp.xml.xz"))
    ap.add_argument("--csv", default=os.path.join(REPO_ROOT, "non-research-papers.csv"))
    ap.add_argument("--toc-file", help="read the table of contents from this file instead of ijcai.org (one --year only)")
    ap.add_argument("--report", metavar="PATH", help="write problems needing a human as Markdown")
    ap.add_argument("--dry-run", action="store_true", help="show what would be added without changing the CSV")
    args = ap.parse_args()
    years = args.year or [this_year - 1, this_year]
    if args.toc_file and len(years) != 1:
        ap.error("--toc-file needs exactly one --year")

    all_rows, problems = [], []
    for year in years:
        if args.toc_file:
            with open(args.toc_file, encoding="utf-8") as f:
                page = f.read()
        else:
            try:
                page = fetch_toc(year)
            except (urllib.error.URLError, OSError) as e:
                problems.append(f"IJCAI {year}: could not fetch {TOC_URL.format(year=year)} ({plain(str(e))}).")
                continue
        if page is None:
            print(f"IJCAI {year}: proceedings not published yet.", file=sys.stderr)
            continue
        toc = parse_toc(page, year)
        if not toc:
            problems.append(f"IJCAI {year}: no papers found on {TOC_URL.format(year=year)}; has the page layout changed?")
            continue
        rows, year_problems = plan(toc, dblp_records(args.dblp, year), year)
        all_rows += rows
        problems += year_problems

    if args.dry_run:
        with open(args.csv, newline="", encoding="utf-8") as f:
            have = {row[0] for row in csv.reader(f)}
        added = [r for r in all_rows if r[0] not in have]
    else:
        added = update_csv(args.csv, all_rows)
    for r in added:
        print(("Would add " if args.dry_run else "Added ") + ",".join(r), file=sys.stderr)
    print(f"{len(added)} IJCAI non-research paper(s) {'to add' if args.dry_run else 'added'}.", file=sys.stderr)
    for p in problems:
        print("WARNING: " + p, file=sys.stderr)
    if args.report:
        with open(args.report, "w", encoding="utf-8") as f:
            f.writelines(f"- {p}\n" for p in problems)


if __name__ == "__main__":
    main()
