#!/usr/bin/env python3
"""
Reconcile orcid.csv against the faculty CSVs.

orcid.csv is a name -> ORCID lookup table used by util/new-name-detector.py and
util/update-new-names.py. It is built by util/build-orcid-csv.py, which queries
the ORCID API and takes ~45 minutes, so it cannot run on every build -- and as a
result it drifted badly: 916 names whose csrankings-*.csv row carried a real
ORCID were still recorded here as the placeholder, 1,767 faculty were missing
entirely, and 142 entries referred to people no longer in the data.

That drift needs no API access to repair, because the faculty CSVs already hold
the answer. This script does the cheap local half of the job so `make` can keep
the table honest, and leaves ORCID *discovery* to build-orcid-csv.py.

Union semantics: a known ORCID is never dropped. If the CSV row has a real ORCID
it wins; if the CSV row has the placeholder but the table already knows one, the
table's value is kept. Where both are real and they disagree, nothing is changed
and the conflict is reported -- guessing between two plausible identifiers is
exactly the kind of silent error this file should not introduce.

Usage:
    python3 util/sync-orcid-csv.py            # rewrite orcid.csv
    python3 util/sync-orcid-csv.py --check    # report drift, exit 1 if any
"""

import argparse
import csv
import glob
import os
import sys
from typing import Dict, List, Tuple

PLACEHOLDER = "0000-0000-0000-0000"
ORCID_FILE = "orcid.csv"
HEADER = ["name", "orcid"]

# Faculty rows live in csrankings-[a-z].csv; departed faculty keep their ORCID in
# old/*.csv. Both are authoritative for names that appear in them.
FACULTY_GLOB = "csrankings-*.csv"
OLD_FILES = ["old/industry.csv", "old/emeritus.csv", "old/rip.csv",
             "old/other.csv", "old/research.csv"]


def is_real(orcid: str) -> bool:
    return bool(orcid) and orcid != PLACEHOLDER


def line_ending(path: str) -> str:
    """Preserve whatever the file already uses; these CSVs are CRLF."""
    try:
        with open(path, "rb") as f:
            return "\r\n" if b"\r\n" in f.readline() else "\n"
    except FileNotFoundError:
        return "\r\n"


def load_faculty() -> Dict[str, str]:
    """name -> ORCID from the authoritative CSVs (placeholder when unknown)."""
    faculty: Dict[str, str] = {}
    for path in sorted(glob.glob(FACULTY_GLOB)) + OLD_FILES:
        if not os.path.exists(path):
            continue
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames or "orcid" not in reader.fieldnames:
                continue
            for row in reader:
                name = (row.get("name") or "").strip()
                if not name:
                    continue
                orcid = (row.get("orcid") or "").strip()
                # A real ORCID anywhere beats a placeholder seen elsewhere; the
                # alias rows for one person should all agree, but if they don't
                # yet, prefer the informative value.
                if name not in faculty or (is_real(orcid) and not is_real(faculty[name])):
                    faculty[name] = orcid or PLACEHOLDER
    return faculty


def load_table() -> Dict[str, str]:
    if not os.path.exists(ORCID_FILE):
        return {}
    out: Dict[str, str] = {}
    with open(ORCID_FILE, newline="", encoding="utf-8") as f:
        for row in csv.reader(f):
            if len(row) >= 2 and row[0] != "name":
                out[row[0]] = row[1]
    return out


def reconcile(faculty: Dict[str, str], table: Dict[str, str]):
    """Return (merged, added, updated, removed, conflicts, csv_could_gain)."""
    merged: Dict[str, str] = {}
    added, updated, conflicts, csv_could_gain = [], [], [], []

    for name, csv_orcid in faculty.items():
        known = table.get(name)
        if is_real(csv_orcid) and is_real(known) and csv_orcid != known:
            # Do not guess. Leave the table as-is and surface it.
            conflicts.append((name, known, csv_orcid))
            merged[name] = known
            continue
        if is_real(csv_orcid):
            merged[name] = csv_orcid
        elif is_real(known):
            # The table knows an ORCID the faculty row is missing. Keep it here,
            # and report it -- propagating it into the faculty row is a change to
            # ranked data and belongs in an explicit, reviewed step.
            merged[name] = known
            csv_could_gain.append((name, known))
        else:
            merged[name] = PLACEHOLDER

        if name not in table:
            added.append(name)
        elif table[name] != merged[name]:
            updated.append((name, table[name], merged[name]))

    # Entries for names no longer in the data are dropped only when they carry no
    # information. A real ORCID is kept even for a name that has left the faculty
    # files: many such names are DBLP aliases of people who are still here
    # (e.g. "Gul Calikli" for "Gül Çalikli"), and resolving those variants is the
    # reason this lookup table exists. Deleting them would quietly narrow it.
    gone = set(table) - set(faculty)
    removed = sorted(n for n in gone if not is_real(table[n]))
    for name in sorted(gone - set(removed)):
        merged[name] = table[name]

    return merged, added, updated, removed, conflicts, csv_could_gain


def write_table(merged: Dict[str, str], nl: str) -> None:
    # orcid.csv is sorted by raw name; it is a lookup table and is not subject to
    # the normalized ordering util/validate_commit.py enforces on the faculty
    # files, so preserve its existing convention rather than churn 31k lines.
    rows = [HEADER] + [[n, merged[n]] for n in sorted(merged)]
    with open(ORCID_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, lineterminator=nl)
        writer.writerows(rows)


def main() -> int:
    ap = argparse.ArgumentParser(description="Reconcile orcid.csv with the faculty CSVs")
    ap.add_argument("--check", action="store_true",
                    help="report drift without writing; exit 1 if out of sync")
    args = ap.parse_args()

    faculty = load_faculty()
    if not faculty:
        print("No faculty CSVs found; refusing to rewrite orcid.csv.", file=sys.stderr)
        return 1
    table = load_table()

    merged, added, updated, removed, conflicts, csv_could_gain = reconcile(faculty, table)

    drift = len(added) + len(updated) + len(removed)
    print(f"orcid.csv: {len(table)} entries -> {len(merged)} "
          f"(+{len(added)} added, {len(updated)} updated, -{len(removed)} removed)")

    if conflicts:
        print(f"  WARNING: {len(conflicts)} name(s) have a different real ORCID in "
              f"orcid.csv and the faculty CSV; left unchanged, resolve by hand:")
        for name, tbl, csv_val in conflicts[:10]:
            print(f"    {name}: orcid.csv={tbl} csv={csv_val}")

    if csv_could_gain:
        print(f"  NOTE: {len(csv_could_gain)} faculty row(s) still carry the placeholder "
              f"while orcid.csv knows an ORCID:")
        for name, orcid in csv_could_gain[:10]:
            print(f"    {name}: {orcid}")

    if args.check:
        if drift:
            print(f"  orcid.csv is OUT OF SYNC ({drift} change(s) pending). "
                  f"Run: python3 util/sync-orcid-csv.py", file=sys.stderr)
            return 1
        print("  orcid.csv is in sync.")
        return 0

    if drift:
        write_table(merged, line_ending(ORCID_FILE))
        print("  orcid.csv rewritten.")
    else:
        print("  orcid.csv already in sync; unchanged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
