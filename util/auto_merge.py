#!/usr/bin/env python3
"""
Decide whether a PR may be merged automatically, and merge it if so.

The score comes from an AI assessment, and its inputs (PR text, comments, web
pages) can be written by anyone. So a high score alone is never enough: each
gate below is checked mechanically, outside the model's reach. In particular,
the evidence for the criteria that matter must be text actually found on a page
hosted by the person's own institution, which a submitter cannot normally edit.

Set the repository variable AUTO_MERGE to "off" to report decisions without
merging.
"""
import csv
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate_prs import DEFAULT_MERGE_THRESHOLD, REPO, get_validation_score

ROOT = Path(__file__).parent.parent
BLOCKING_LABELS = {"hold", "stale"}
REQUIRED_CRITERIA = ("tenure_track", "phd_advising", "cs_department")
CSV_FILE = re.compile(r"^csrankings-[a-z]\.csv$")
# Second-level labels under a country code: cs.ox.ac.uk belongs to ox.ac.uk.
SECOND_LEVEL = {"ac", "co", "com", "edu", "go", "gov", "net", "or", "org", "re"}


def site_of(url: str) -> str:
    """Return the registrable part of a URL's host: https://cse.x.edu.cn/a -> x.edu.cn."""
    host = (urlparse(url).hostname or "").lower()
    labels = host.split(".")
    if len(labels) >= 3 and len(labels[-1]) == 2 and labels[-2] in SECOND_LEVEL:
        return ".".join(labels[-3:])
    return ".".join(labels[-2:])


def load_institution_sites(path: Path = ROOT / "institutions.csv") -> dict:
    with open(path, encoding="utf-8") as f:
        return {row["institution"]: site_of(row["homepage"]) for row in csv.DictReader(f)}


def merge_blockers(assessment: Optional[dict], score: Optional[int], labels: List[str],
                   files: List[str], sites: dict, mechanical_passed: bool,
                   threshold: int = DEFAULT_MERGE_THRESHOLD,
                   industry_names: frozenset = frozenset()) -> List[str]:
    """Return every reason this PR may not be auto-merged; empty means it may."""
    if not assessment:
        return ["no assessment was produced for this version of the PR"]
    blockers = []
    if not mechanical_passed:
        blockers.append("the mechanical checks did not pass")
    if score is None or score < threshold:
        blockers.append(f"score {score} is below {threshold}%")
    blockers += [f"it has the `{name}` label" for name in sorted(BLOCKING_LABELS & set(labels))]
    outside = [name for name in files if not CSV_FILE.match(name)]
    if outside or not files:
        blockers.append(f"it does not only change csrankings-?.csv files ({', '.join(outside)})")
    if assessment.get("removals"):
        blockers.append(f"it removes faculty ({', '.join(assessment['removals'])})")
    if not assessment.get("entries"):
        blockers.append("the assessment has no entries")
    affiliations = assessment.get("affiliations") or {}
    for entry in assessment.get("entries", []):
        name = entry.get("name", "?")
        if not entry.get("person_on_evidence_page"):
            blockers.append(f"{name}: the page cited for their rank does not name them")
        if entry.get("current_industry_roles"):
            blockers.append(f"{name}: current industry roles were mentioned")
        site = sites.get(affiliations.get(name))
        if not site:
            blockers.append(f"{name}: institution is not in institutions.csv")
            continue
        for field in REQUIRED_CRITERIA:
            evidence = (entry.get("criteria") or {}).get(field) or {}
            if evidence.get("status") != "confirmed" or evidence.get("verdict") != "pass":
                blockers.append(f"{name}: {field} is not a confirmed pass")
            elif site_of(evidence.get("source_url", "")) != site:
                blockers.append(f"{name}: {field} evidence is not hosted by {site}")
        full_time = (entry.get("criteria") or {}).get("full_time") or {}
        if full_time.get("verdict") == "fail":
            blockers.append(f"{name}: full_time failed")
    listed = sorted(industry_names & set(affiliations))
    if listed:
        blockers.append(f"listed in old/industry.csv: {', '.join(listed)}")
    return blockers


def load_industry_names(path: Path = ROOT / "old" / "industry.csv") -> frozenset:
    with open(path, encoding="utf-8") as f:
        return frozenset(row["name"] for row in csv.DictReader(f))


def gh(*args: str) -> str:
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout


def main() -> int:
    pr, assessment_path, status_path = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    assessment = json.loads(assessment_path.read_text()) if assessment_path.exists() else None
    mechanical_passed = status_path.exists() and "true" in status_path.read_text()
    info = json.loads(gh("pr", "view", pr, "--repo", REPO, "--json",
                         "files,labels,headRefOid,state"))
    blockers = merge_blockers(
        assessment, get_validation_score(int(pr)),
        [label["name"] for label in info["labels"]],
        [file["path"] for file in info["files"]],
        load_institution_sites(), mechanical_passed,
        industry_names=load_industry_names())
    if assessment and assessment.get("head_sha") != info["headRefOid"]:
        blockers.append("the PR changed after it was assessed")
    if info["state"] != "OPEN":
        blockers.append("the PR is not open")
    if blockers:
        print(f"PR #{pr} not auto-merged:")
        for blocker in blockers:
            print(f"  - {blocker}")
        return 0
    if os.environ.get("AUTO_MERGE") == "off":
        print(f"PR #{pr} qualifies, but AUTO_MERGE is off.")
        return 0
    # --match-head-commit refuses the merge if anything was pushed since the assessment.
    gh("pr", "merge", pr, "--repo", REPO, "--squash", "--match-head-commit", info["headRefOid"])
    # A merge made with GITHUB_TOKEN does not fire push workflows, so start the rebuild.
    gh("workflow", "run", "post-merge-rebuild.yml", "--repo", REPO, "--ref", "gh-pages")
    print(f"PR #{pr} merged automatically.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
