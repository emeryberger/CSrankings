#!/usr/bin/env python3
"""
Report faculty whose DBLP name has drifted away from their papers.

DBLP's monthly releases keep splitting shared names into numbered profiles
("Kang Chen" -> "Kang Chen 0001", ...). util/new-name-detector.py follows a
profile that is *renamed*, but not a person who is *split off* a shared name
into a new profile: their papers move to the new name and their CSRankings row
is left on the old one. Two checks catch that:

  orcid-elsewhere   The row's ORCID is carried by a DBLP name that none of the
                    person's rows (or their DBLP aliases) cover, on >= 2 tracked
                    papers and >= 90% of that name's ORCID-tagged papers. If the
                    person's own names carry the ORCID on no paper, the row
                    probably needs renaming ("rename?"); otherwise the person
                    has a second DBLP profile ("second-profile?"). A person never
                    gets two DBLP names that differ only in their numeric suffix
                    ("Jing He 0001" and "Jing He 0002"): DBLP's suffix says those
                    are different people, so that case is reported as a
                    "suffix-conflict" to resolve, not as a second profile.

  disambiguation    The row's name is a DBLP disambiguation page: a bucket of
                    papers DBLP has not assigned to anyone, which can mix several
                    people. Listed with any numbered profiles of the same name.
                    Needs dblp-original.xml.gz (the full release).

The report is advisory. A DBLP name carrying an ORCID is strong evidence but
not proof (publisher metadata can attach the wrong ORCID, and the CSV's ORCID
can itself be wrong), so confirm against the ORCID record and the papers before
renaming anyone.

Usage:
    python3 util/orcid-name-check.py [--original dblp-original.xml.gz] > name-check.csv
"""

import argparse
import csv
import glob
import gzip
import html
import lzma
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from typing import Dict, Set

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLACEHOLDER = "0000-0000-0000-0000"
MIN_PAPERS = 2
MIN_SHARE = 0.9

_AUTHOR_RE = re.compile(rb'<author(?: orcid="([^"]+)")?[^>]*>([^<]+)</author>')
_HOMEPAGE_RE = re.compile(r'<www ([^>]*key="homepages/[^"]+"[^>]*)>(.*?)</www>', re.S)
_NAME_RE = re.compile(r"<author[^>]*>([^<]+)</author>")
_SUFFIX_RE = re.compile(r" \d{4}$")


def norm(name: str) -> str:
    return unicodedata.normalize("NFC", html.unescape(name).strip())


def scan_snapshot(path: str):
    """Tracked-venue paper counts per name and per (name, ORCID)."""
    papers: Counter = Counter()
    tagged: Dict[str, Counter] = defaultdict(Counter)
    with lzma.open(path) as f:
        data = f.read()
    for m in _AUTHOR_RE.finditer(data):
        name = norm(m.group(2).decode("utf-8"))
        papers[name] += 1
        if m.group(1):
            tagged[name][m.group(1).decode("ascii")] += 1
    return papers, tagged


def scan_disambiguation(path: str) -> Set[str]:
    """Names whose DBLP person record is a disambiguation page.

    Matched over a buffer rather than line by line: DBLP often starts a record on
    the line that ends the previous one, which a line-based scan silently drops.
    """
    pages: Set[str] = set()
    buf = ""
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
        while True:
            chunk = f.read(1 << 24)
            if not chunk:
                break
            buf += chunk
            end = 0
            for m in _HOMEPAGE_RE.finditer(buf):
                if 'publtype="disambiguation"' in m.group(1):
                    pages.update(norm(n) for n in _NAME_RE.findall(m.group(2)))
                end = m.end()
            buf = buf[end:]
    return pages


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Report faculty whose DBLP name has drifted away from their papers.")
    ap.add_argument("--snapshot", default=os.path.join(REPO_ROOT, "dblp.xml.xz"))
    ap.add_argument("--aliases", default=os.path.join(REPO_ROOT, "dblp-aliases.csv"))
    ap.add_argument("--original", default=os.path.join(REPO_ROOT, "dblp-original.xml.gz"),
                    help="full DBLP release, for the disambiguation check (skipped if missing)")
    args = ap.parse_args()

    rows = []
    for path in sorted(glob.glob(os.path.join(REPO_ROOT, "csrankings-*.csv"))):
        with open(path, encoding="utf-8", newline="") as f:
            rows += [{k: (v or "").strip() for k, v in r.items()} for r in csv.DictReader(f)]
    faculty = {r["name"] for r in rows}

    linked: Dict[str, Set[str]] = defaultdict(set)
    with open(args.aliases, encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            a, b = norm(r["alias"]), norm(r["name"])
            linked[a].add(b)
            linked[b].add(a)

    # A person is everyone sharing an affiliation and homepage (alias rows).
    people: Dict[tuple, Set[str]] = defaultdict(set)
    for r in rows:
        people[(r["affiliation"], r["homepage"])].add(r["name"])

    papers, tagged = scan_snapshot(args.snapshot)
    names_by_orcid: Dict[str, Counter] = defaultdict(Counter)
    for name, counts in tagged.items():
        for orcid, n in counts.items():
            names_by_orcid[orcid][name] += n

    pages = scan_disambiguation(args.original) if os.path.exists(args.original) else None

    out = csv.writer(sys.stdout, lineterminator="\n")
    out.writerow(["check", "name", "affiliation", "orcid", "dblp_name", "detail"])
    found = Counter()
    seen = set()
    for r in rows:
        name, orcid = r["name"], r["orcid"]
        names = people[(r["affiliation"], r["homepage"])]
        if orcid and orcid != PLACEHOLDER and (orcid, frozenset(names)) not in seen:
            seen.add((orcid, frozenset(names)))
            covered = set(names) | {x for n in names for x in linked[n]}
            own = sum(tagged[n][orcid] for n in names)
            for other, n in names_by_orcid[orcid].items():
                if other in covered or other in faculty or (pages and other in pages):
                    continue
                if n >= MIN_PAPERS and n >= MIN_SHARE * sum(tagged[other].values()):
                    kind = "second-profile?" if own else "rename?"
                    # Never list two DBLP names that differ only in their numeric
                    # suffix for one person: DBLP's suffix says they are different
                    # people, so this is a DBLP split or a wrong ORCID to resolve.
                    if own and _SUFFIX_RE.search(other) and any(
                            _SUFFIX_RE.search(x) and _SUFFIX_RE.sub("", x) == _SUFFIX_RE.sub("", other)
                            for x in names):
                        kind = "suffix-conflict (DBLP split or wrong ORCID; do not add a row)"
                    out.writerow(["orcid-elsewhere", name, r["affiliation"], orcid, other,
                                  f"{kind} {n} of {papers[other]} papers carry the ORCID; "
                                  f"the person's own names carry it on {own}"])
                    found["orcid-elsewhere"] += 1
        if pages is not None and name in pages and papers[name]:
            base = _SUFFIX_RE.sub("", name)
            numbered = sorted((v for v in papers if v.startswith(base + " ") and _SUFFIX_RE.search(v)
                               and _SUFFIX_RE.sub("", v) == base and v not in faculty),
                              key=lambda v: -papers[v])
            listed = "; ".join(f"{v} ({papers[v]})" for v in numbered[:5]) or "none"
            out.writerow(["disambiguation", name, r["affiliation"], orcid, "",
                          f"{papers[name]} tracked papers on a DBLP disambiguation page; "
                          f"unclaimed numbered profiles: {listed}"])
            found["disambiguation"] += 1

    summary = ", ".join(f"{v} {k}" for k, v in sorted(found.items())) or "nothing"
    note = "" if pages is not None else " (disambiguation check skipped: no full DBLP release)"
    print(f"orcid-name-check: {summary}{note}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
