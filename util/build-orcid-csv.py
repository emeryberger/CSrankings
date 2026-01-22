#!/usr/bin/env python3
"""
Build orcid.csv mapping CSRankings faculty names to ORCIDs.

Usage:
    python3 util/build-orcid-csv.py

This script:
1. Extracts ORCIDs from DBLP XML (dblp.xml.gz)
2. Queries ORCID API for remaining faculty (with affiliation verification)
3. Includes faculty from old/*.csv files
4. Outputs orcid.csv with all faculty (placeholder for those without ORCID)

Takes ~45 minutes due to ORCID API rate limiting.
"""

import argparse
import csv
import lzma
import re
import urllib.request
import urllib.parse
import json
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, Dict, List, Tuple

# Configuration
MAX_WORKERS = 5  # Concurrent API requests
API_DELAY = 0.1  # Seconds between requests per thread
PLACEHOLDER_ORCID = "0000-0000-0000-0000"


def extract_dblp_orcids(dblp_path: str) -> Dict[str, str]:
    """Extract name -> ORCID mapping from DBLP XML."""
    print("Extracting ORCIDs from DBLP...", file=sys.stderr)
    orcids = {}
    pattern = re.compile(r'<author orcid="([^"]+)">([^<]+)</author>')

    with lzma.open(dblp_path, 'rt', encoding='utf-8') as f:
        for line in f:
            for match in pattern.finditer(line):
                orcid = match.group(1)
                name = match.group(2).strip()
                if name not in orcids:
                    orcids[name] = orcid

    print(f"  Found {len(orcids)} unique name->ORCID mappings in DBLP", file=sys.stderr)
    return orcids


def load_csrankings_faculty() -> Dict[str, str]:
    """Load faculty name -> institution mapping from csrankings-*.csv."""
    print("Loading CSRankings faculty...", file=sys.stderr)
    faculty = {}
    for letter in "abcdefghijklmnopqrstuvwxyz":
        try:
            with open(f"csrankings-{letter}.csv", "r", encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row["name"].strip()
                    institution = row["affiliation"].strip()
                    faculty[name] = institution
        except FileNotFoundError:
            pass

    print(f"  Loaded {len(faculty)} faculty members", file=sys.stderr)
    return faculty


def load_old_faculty() -> Dict[str, str]:
    """Load faculty from old/*.csv files."""
    print("Loading old faculty (industry/emeritus/rip)...", file=sys.stderr)
    faculty = {}
    for filename in ["old/industry.csv", "old/emeritus.csv", "old/rip.csv"]:
        try:
            with open(filename, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row["name"].strip()
                    affiliation = row["affiliation"].strip()
                    if name not in faculty:
                        faculty[name] = affiliation
        except FileNotFoundError:
            print(f"  Warning: {filename} not found", file=sys.stderr)

    print(f"  Loaded {len(faculty)} old faculty members", file=sys.stderr)
    return faculty


def normalize_institution(inst: str) -> str:
    """Normalize institution name for fuzzy matching."""
    inst = inst.lower()
    inst = re.sub(r'\buniv\.?\b', 'university', inst)
    inst = re.sub(r'\binst\.?\b', 'institute', inst)
    inst = re.sub(r'\btech\.?\b', 'technology', inst)
    inst = re.sub(r'\bu\.?\s*of\b', 'university of', inst)
    inst = re.sub(r'\buc\s+', 'university of california ', inst)
    inst = re.sub(r'\bmit\b', 'massachusetts institute of technology', inst)
    inst = re.sub(r'\bcmu\b', 'carnegie mellon university', inst)
    inst = re.sub(r'\beth\b', 'eth zurich', inst)
    inst = re.sub(r'\bepfl\b', 'ecole polytechnique federale de lausanne', inst)
    inst = re.sub(r'[^\w\s]', ' ', inst)
    inst = re.sub(r'\s+', ' ', inst).strip()
    return inst


def institutions_match(inst1: str, inst2: str) -> bool:
    """Check if two institution names likely refer to the same place."""
    n1 = normalize_institution(inst1)
    n2 = normalize_institution(inst2)

    if n1 == n2:
        return True
    if n1 in n2 or n2 in n1:
        return True

    words1 = set(n1.split())
    words2 = set(n2.split())
    stopwords = {'of', 'the', 'and', 'at', 'for', 'in', 'de', 'la', 'del', 'di'}
    words1 -= stopwords
    words2 -= stopwords

    if not words1 or not words2:
        return False

    overlap = len(words1 & words2)
    min_len = min(len(words1), len(words2))
    if overlap >= min_len * 0.5 and overlap >= 2:
        return True

    return False


def parse_name(full_name: str) -> Tuple[str, str]:
    """Parse full name into (given, family) names."""
    parts = full_name.strip().split()
    if parts[-1].isdigit() and len(parts[-1]) == 4:
        parts = parts[:-1]
    if len(parts) < 2:
        return (parts[0] if parts else "", "")
    return " ".join(parts[:-1]), parts[-1]


def api_request(url: str, headers: dict) -> Optional[dict]:
    """Make an API request with error handling."""
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return None


def search_and_verify(name: str, institution: str) -> Tuple[str, Optional[str]]:
    """Search ORCID and verify affiliation. Returns (name, orcid or None)."""
    given, family = parse_name(name)
    if not family or len(family) < 2:
        return (name, None)

    # Search ORCID
    query = f'family-name:"{family}" AND given-names:"{given}"'
    url = f"https://pub.orcid.org/v3.0/search/?q={urllib.parse.quote(query)}&rows=10"

    data = api_request(url, {"Accept": "application/json"})
    if not data:
        return (name, None)

    result_list = data.get("result") or []
    candidates = []
    for item in result_list:
        if item:
            orcid_identifier = item.get("orcid-identifier")
            if orcid_identifier:
                orcid_id = orcid_identifier.get("path")
                if orcid_id:
                    candidates.append(orcid_id)

    if not candidates:
        return (name, None)

    time.sleep(API_DELAY)

    # Check affiliations for each candidate
    for orcid_id in candidates[:5]:  # Limit to top 5
        aff_url = f"https://pub.orcid.org/v3.0/{orcid_id}/employments"
        aff_data = api_request(aff_url, {"Accept": "application/json"})

        if aff_data:
            groups = aff_data.get("affiliation-group", [])
            for group in groups:
                summaries = group.get("summaries", [])
                for summary in summaries:
                    emp = summary.get("employment-summary", {})
                    org = emp.get("organization", {})
                    org_name = org.get("name", "")
                    if org_name and institutions_match(org_name, institution):
                        return (name, orcid_id)

        time.sleep(API_DELAY)

    return (name, None)


def main():
    parser = argparse.ArgumentParser(description="Build orcid.csv from DBLP and ORCID API")
    parser.add_argument("--dblp", default="dblp.xml.xz", help="Path to DBLP XML (default: dblp.xml.xz)")
    parser.add_argument("--output", default="orcid.csv", help="Output file (default: orcid.csv)")
    parser.add_argument("--skip-api", action="store_true", help="Skip ORCID API queries (DBLP only)")
    parser.add_argument("--include-old", action="store_true", help="Include old/*.csv faculty")
    args = parser.parse_args()

    # Step 1: Extract ORCIDs from DBLP
    dblp_orcids = extract_dblp_orcids(args.dblp)

    # Step 2: Load CSRankings faculty
    faculty = load_csrankings_faculty()

    # Step 2b: Optionally include old faculty
    if args.include_old:
        old_faculty = load_old_faculty()
        for name, inst in old_faculty.items():
            if name not in faculty:
                faculty[name] = inst

    # Step 3: Build the mapping
    print("\nBuilding ORCID mapping...", file=sys.stderr)
    orcid_map: Dict[str, str] = {}

    # First pass: use DBLP ORCIDs
    dblp_found = 0
    for name in faculty:
        if name in dblp_orcids:
            orcid_map[name] = dblp_orcids[name]
            dblp_found += 1

    print(f"  Found {dblp_found} ORCIDs from DBLP ({dblp_found/len(faculty)*100:.1f}%)", file=sys.stderr)

    # Second pass: query ORCID API concurrently (unless skipped)
    remaining = [(n, faculty[n]) for n in faculty if n not in orcid_map]

    if args.skip_api:
        print(f"  Skipping ORCID API queries (--skip-api)", file=sys.stderr)
        api_found = 0
    else:
        print(f"  Querying ORCID API for {len(remaining)} remaining faculty ({MAX_WORKERS} workers)...", file=sys.stderr)

        api_found = 0
        processed = 0
        start_time = time.time()

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {
                executor.submit(search_and_verify, name, inst): name
                for name, inst in remaining
            }

            for future in as_completed(futures):
                name, orcid_id = future.result()
                processed += 1

                if orcid_id:
                    orcid_map[name] = orcid_id
                    api_found += 1
                    print(f"  ✓ {name} -> {orcid_id}", file=sys.stderr)

                # Progress every 200
                if processed % 200 == 0:
                    elapsed = time.time() - start_time
                    rate = processed / elapsed * 60
                    eta = (len(remaining) - processed) / (processed / elapsed) / 60
                    total_found = dblp_found + api_found
                    print(f"\n  Progress: {processed}/{len(remaining)} ({rate:.0f}/min, ETA: {eta:.1f} min) "
                          f"- Total found: {total_found} ({total_found/len(faculty)*100:.1f}%)\n",
                          file=sys.stderr)

    # Add placeholder for remaining faculty
    for name in faculty:
        if name not in orcid_map:
            orcid_map[name] = PLACEHOLDER_ORCID

    # Step 4: Write output
    print(f"\n=== SUMMARY ===", file=sys.stderr)
    print(f"Total faculty: {len(faculty)}", file=sys.stderr)
    print(f"ORCIDs from DBLP: {dblp_found}", file=sys.stderr)
    print(f"ORCIDs from API (verified): {api_found}", file=sys.stderr)
    real_orcids = sum(1 for o in orcid_map.values() if o != PLACEHOLDER_ORCID)
    print(f"Total with real ORCID: {real_orcids} ({real_orcids/len(faculty)*100:.1f}%)", file=sys.stderr)
    print(f"Placeholder ORCIDs: {len(faculty) - real_orcids}", file=sys.stderr)

    print(f"\nWriting {args.output}...", file=sys.stderr)
    with open(args.output, "w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["name", "orcid"])
        for name in sorted(orcid_map.keys()):
            writer.writerow([name, orcid_map[name]])

    print(f"Done! Wrote {len(orcid_map)} entries to {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
