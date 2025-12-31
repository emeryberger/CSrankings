#!/usr/bin/env python3
"""
Update sponsors.json from GitHub Sponsors CSV export.

Usage:
    python3 util/update-sponsors-from-csv.py sponsors-export.csv

The CSV should be exported from GitHub Sponsors dashboard.
Only public sponsors (Is Public? = TRUE) will be included.
"""

import csv
import json
import sys
from datetime import datetime

SPONSORS_FILE = "sponsors.json"

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 util/update-sponsors-from-csv.py <sponsors-export.csv>")
        sys.exit(1)

    csv_file = sys.argv[1]

    # Read CSV and extract unique public sponsors
    sponsors_dict = {}  # Use dict to deduplicate by handle

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=',')

        for row in reader:
            handle = row.get('Sponsor Handle', '').strip()
            is_public = row.get('Is Public?', '').strip().upper()

            if not handle:
                continue

            # Only include public sponsors
            if is_public != 'TRUE':
                continue

            # Skip if already added (keep first occurrence)
            if handle in sponsors_dict:
                continue

            sponsors_dict[handle] = {
                "login": handle,
                "avatar_url": f"https://avatars.githubusercontent.com/{handle}?s=60",
                "html_url": f"https://github.com/{handle}"
            }

    sponsors = list(sponsors_dict.values())

    print(f"Found {len(sponsors)} unique public sponsors")

    if len(sponsors) == 0:
        print("WARNING: No public sponsors found in CSV")
        sys.exit(1)

    # Sort by login for consistent ordering
    sponsors.sort(key=lambda x: x['login'].lower())

    # Print sponsors
    for s in sponsors:
        print(f"  - {s['login']}")

    # Save to file
    output = {
        "sponsors": sponsors,
        "lastUpdated": datetime.now().strftime("%Y-%m-%d")
    }

    with open(SPONSORS_FILE, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved {len(sponsors)} sponsors to {SPONSORS_FILE}")

if __name__ == "__main__":
    main()
