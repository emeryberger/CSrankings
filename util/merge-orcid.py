#!/usr/bin/env python3
"""
Merge orcid.csv data into csrankings-*.csv files.

Adds an 'orcid' column to each csrankings-*.csv file.
Uses the placeholder 'NOORCID' for entries without an ORCID.
"""

import csv
import string
import os

ORCID_PLACEHOLDER = "0000-0000-0000-0000"

def load_orcid_data(filename="orcid.csv"):
    """Load ORCID data into a dictionary keyed by name."""
    orcid_map = {}
    with open(filename, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["name"].strip()
            orcid = row["orcid"].strip()
            orcid_map[name] = orcid
    return orcid_map


def merge_orcid_into_file(filename, orcid_map):
    """Add ORCID column to a csrankings-*.csv file."""
    rows = []
    with open(filename, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        # Check if orcid column already exists
        if "orcid" in fieldnames:
            print(f"  {filename}: orcid column already exists, skipping")
            return False

        for row in reader:
            name = row["name"].strip()
            # Look up ORCID, default to placeholder
            orcid = orcid_map.get(name, ORCID_PLACEHOLDER)
            row["orcid"] = orcid
            rows.append(row)

    # Write back with new column
    new_fieldnames = list(fieldnames) + ["orcid"]
    with open(filename, mode="w", encoding="utf-8", newline="\r\n") as f:
        writer = csv.DictWriter(f, fieldnames=new_fieldnames, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)

    # Count stats
    with_orcid = sum(1 for r in rows if r["orcid"] != ORCID_PLACEHOLDER)
    print(f"  {filename}: {len(rows)} entries, {with_orcid} with ORCID")
    return True


def main():
    print("Loading ORCID data...")
    orcid_map = load_orcid_data("orcid.csv")
    print(f"Loaded {len(orcid_map)} ORCID entries")

    print("\nMerging into csrankings-*.csv files...")
    for letter in string.ascii_lowercase:
        filename = f"csrankings-{letter}.csv"
        if os.path.exists(filename):
            merge_orcid_into_file(filename, orcid_map)

    print("\nMerging into old/*.csv files...")
    old_files = ["old/emeritus.csv", "old/industry.csv", "old/other.csv", "old/research.csv", "old/rip.csv"]
    for filename in old_files:
        if os.path.exists(filename):
            merge_orcid_into_file(filename, orcid_map)

    print("\nDone!")


if __name__ == "__main__":
    main()
