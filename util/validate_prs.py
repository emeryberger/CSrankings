#!/usr/bin/env python3
"""
PR Validation & Management Tool for CSRankings.

A comprehensive CLI for validating, scoring, merging, and consolidating
open pull requests on the emeryberger/CSrankings repository.

Run with --help or <command> --help for full usage details.
"""

import argparse
import json
import subprocess
import sys
import csv
import re
import io
import time
from collections import defaultdict
from pathlib import Path
from typing import Optional

REPO = "emeryberger/CSrankings"
BASEDIR = Path(__file__).parent.parent
VALIDATION_FOOTER = "Automated validation analysis based on [VALIDATION.md]"
FOOTER_MD = "*Automated validation analysis based on [VALIDATION.md](../blob/gh-pages/VALIDATION.md) criteria*"
BOT_PASS_MARKER = "All validity checks passed"
DEFAULT_MERGE_THRESHOLD = 80

CSV_FIELDS = ["name", "affiliation", "homepage", "scholarid", "orcid"]
INDUSTRY_FIELDS = ["name", "affiliation", "homepage", "scholarid", "company", "orcid"]

# URL-based department heuristics from VALIDATION.md
CS_URL_SIGNALS = ["cs.", "cse.", "computing.", "computer", "/cs/", "cis."]
NON_CS_URL_SIGNALS = ["ece.", "ee.", "ist.", "ischool", "automation.", "math."]
GENERIC_FACULTY_URLS = ["jszy.whu.edu.cn", "dr.ntu.edu.sg", "people.ucas.ac.cn"]


# ===========================================================================
# Low-level helpers
# ===========================================================================

def run_gh(args: list[str], timeout: int = 30):
    """Run a gh CLI command and return parsed JSON (or None)."""
    result = subprocess.run(
        ["gh"] + args, capture_output=True, text=True, timeout=timeout
    )
    if result.returncode != 0:
        raise RuntimeError(f"gh failed: {result.stderr.strip()}")
    return json.loads(result.stdout) if result.stdout.strip() else None


def run_gh_text(args: list[str], timeout: int = 30) -> str:
    """Run a gh CLI command and return raw stdout."""
    result = subprocess.run(
        ["gh"] + args, capture_output=True, text=True, timeout=timeout
    )
    if result.returncode != 0:
        raise RuntimeError(f"gh failed: {result.stderr.strip()}")
    return result.stdout


def run_git(args: list[str], timeout: int = 60) -> subprocess.CompletedProcess:
    """Run a git command in BASEDIR."""
    return subprocess.run(
        ["git"] + args, capture_output=True, text=True,
        timeout=timeout, cwd=str(BASEDIR)
    )


def gh_merge(pr_number: int, method: str = "squash") -> tuple[bool, str]:
    """Attempt to merge a PR via gh. Returns (success, message)."""
    try:
        r = subprocess.run(
            ["gh", "pr", "merge", str(pr_number), "--repo", REPO, f"--{method}"],
            capture_output=True, text=True, timeout=30
        )
        if r.returncode == 0:
            return True, r.stdout.strip()
        return False, r.stderr.strip()
    except Exception as e:
        return False, str(e)


def gh_post_comment(pr_number: int, body: str) -> tuple[bool, str]:
    """Post a comment on a PR."""
    try:
        r = subprocess.run(
            ["gh", "pr", "comment", str(pr_number), "--repo", REPO, "--body", body],
            capture_output=True, text=True, timeout=30
        )
        return (True, "Comment posted") if r.returncode == 0 else (False, r.stderr.strip())
    except Exception as e:
        return False, str(e)


def gh_close_pr(pr_number: int, comment: str = "") -> tuple[bool, str]:
    """Close a PR with optional comment."""
    try:
        args = ["gh", "pr", "close", str(pr_number), "--repo", REPO]
        if comment:
            args += ["--comment", comment]
        r = subprocess.run(args, capture_output=True, text=True, timeout=15)
        return (True, "Closed") if r.returncode == 0 else (False, r.stderr.strip())
    except Exception as e:
        return False, str(e)


# ===========================================================================
# PR data fetching
# ===========================================================================

def get_open_prs(limit: int = 500) -> list[dict]:
    """Fetch all open PRs with metadata."""
    return run_gh([
        "pr", "list", "--repo", REPO, "--state", "open", "--limit", str(limit),
        "--json", "number,title,author,labels,headRefName,body"
    ]) or []


def get_pr_comments(pr_number: int) -> str:
    """Get all issue comments on a PR as raw text."""
    try:
        return run_gh_text([
            "api", f"repos/{REPO}/issues/{pr_number}/comments",
            "--jq", ".[].body"
        ], timeout=15)
    except Exception:
        return ""


def get_pr_diff(pr_number: int) -> str:
    """Get the diff for a PR."""
    return run_gh_text(["pr", "diff", str(pr_number), "--repo", REPO], timeout=30)


def get_pr_merge_status(pr_number: int) -> tuple[str, str]:
    """Check if a PR is mergeable. Returns (mergeable, mergeStateStatus)."""
    try:
        info = run_gh([
            "pr", "view", str(pr_number), "--repo", REPO,
            "--json", "mergeable,mergeStateStatus"
        ])
        if info:
            return info.get("mergeable", "UNKNOWN"), info.get("mergeStateStatus", "UNKNOWN")
    except Exception:
        pass
    return "UNKNOWN", "UNKNOWN"


def get_pr_branch(pr_number: int) -> Optional[str]:
    """Get the head branch name for a PR."""
    try:
        info = run_gh([
            "pr", "view", str(pr_number), "--repo", REPO,
            "--json", "headRefName"
        ])
        return info.get("headRefName") if info else None
    except Exception:
        return None


def get_pr_files(pr_number: int) -> list[str]:
    """Get the list of files changed in a PR."""
    try:
        info = run_gh([
            "pr", "view", str(pr_number), "--repo", REPO,
            "--json", "files"
        ])
        return [f["path"] for f in info.get("files", [])] if info else []
    except Exception:
        return []


# ===========================================================================
# Validation comment detection and scoring
# ===========================================================================

def has_our_validation(pr_number: int) -> bool:
    """Check if a PR already has our specific validation comment."""
    text = get_pr_comments(pr_number)
    if VALIDATION_FOOTER in text:
        return True
    try:
        text2 = run_gh_text([
            "api", f"repos/{REPO}/pulls/{pr_number}/comments",
            "--jq", ".[].body"
        ], timeout=15)
        return VALIDATION_FOOTER in text2
    except Exception:
        return False


def has_bot_validation_passed(pr_number: int) -> bool:
    """Check if the CI bot's validation passed."""
    return BOT_PASS_MARKER in get_pr_comments(pr_number)


def get_validation_score(pr_number: int) -> Optional[int]:
    """Extract the most recent likelihood-of-validity percentage from comments."""
    text = get_pr_comments(pr_number)
    if VALIDATION_FOOTER not in text:
        return None
    scores = re.findall(r'[Ll]ikelihood of validity:\s*(\d+)%', text)
    if not scores:
        scores = re.findall(r'[Oo]verall likelihood of validity:\s*(\d+)%', text)
    return int(scores[-1]) if scores else None


# ===========================================================================
# CSV diff parsing
# ===========================================================================

def parse_csv_diff(diff_text: str) -> tuple[list[dict], list[dict]]:
    """Parse a PR diff to extract added/removed CSV rows."""
    additions, removals = [], []
    current_file: Optional[str] = None
    for line in diff_text.split("\n"):
        if line.startswith("diff --git"):
            m = re.search(r"b/(.+)$", line)
            current_file = m.group(1) if m else None
        elif line.startswith("+") and not line.startswith("+++"):
            if current_file and line[1:].strip():
                additions.append({"file": current_file, "line": line[1:]})
        elif line.startswith("-") and not line.startswith("---"):
            if current_file and line[1:].strip():
                removals.append({"file": current_file, "line": line[1:]})
    return additions, removals


def get_diff_csv_additions(pr_number: int) -> dict[str, list[str]]:
    """Get added CSV lines from a PR diff, grouped by file (csrankings CSVs only)."""
    diff = get_pr_diff(pr_number)
    adds: dict[str, list[str]] = defaultdict(list)
    current_file: Optional[str] = None
    for line in diff.split("\n"):
        if line.startswith("diff --git"):
            m = re.search(r"b/(.+)$", line)
            current_file = m.group(1) if m else None
        elif line.startswith("+") and not line.startswith("+++") and current_file:
            content = line[1:]
            if (content.strip() and not content.startswith("name,")
                    and current_file.startswith("csrankings") and current_file.endswith(".csv")):
                adds[current_file].append(content)
    return dict(adds)


def get_diff_net_changes(pr_number: int) -> dict[str, tuple[set[str], set[str]]]:
    """Get net (additions, removals) per CSV file from a PR diff."""
    diff = get_pr_diff(pr_number)
    file_adds: dict[str, set[str]] = defaultdict(set)
    file_rems: dict[str, set[str]] = defaultdict(set)
    current_file: Optional[str] = None
    for line in diff.split("\n"):
        if line.startswith("diff --git"):
            m = re.search(r"b/(.+)$", line)
            current_file = m.group(1) if m else None
        elif current_file and current_file.endswith(".csv"):
            content = line[1:].strip() if len(line) > 1 else ""
            if not content or content.startswith("name,"):
                continue
            if line.startswith("+") and not line.startswith("+++"):
                file_adds[current_file].add(content)
            elif line.startswith("-") and not line.startswith("---"):
                file_rems[current_file].add(content)
    result = {}
    for f in set(list(file_adds.keys()) + list(file_rems.keys())):
        net_adds = file_adds.get(f, set()) - file_rems.get(f, set())
        net_rems = file_rems.get(f, set()) - file_adds.get(f, set())
        if net_adds or net_rems:
            result[f] = (net_adds, net_rems)
    return result


def parse_csv_line(line: str, file_path: str = "") -> Optional[dict]:
    """Parse a single CSV line into a dict."""
    fields = INDUSTRY_FIELDS if file_path.startswith("old/industry") else CSV_FIELDS
    try:
        values = next(csv.reader(io.StringIO(line)))
        if len(values) >= len(fields):
            return dict(zip(fields, values[:len(fields)]))
        elif len(values) >= 2:
            return dict(zip(fields[:len(values)], values))
    except Exception:
        pass
    return None


# ===========================================================================
# PR classification
# ===========================================================================

def classify_pr(title: str, additions: list[dict], removals: list[dict]) -> tuple[str, list[dict], list[dict]]:
    """Classify a PR into categories from VALIDATION.md."""
    title_lower = title.lower()
    has_adds = any(a["file"].startswith("csrankings") for a in additions)
    has_removes = any(r["file"].startswith("csrankings") for r in removals)
    has_old_adds = any(a["file"].startswith("old/") for a in additions)

    add_people = _extract_people(additions)
    remove_people = _extract_people(removals)

    if "update" in title_lower and not add_people and not remove_people:
        return "update", add_people, remove_people
    elif "remove" in title_lower or (has_old_adds and has_removes and not has_adds):
        return "removal", add_people, remove_people
    elif len(add_people) > 1:
        return "batch_addition", add_people, remove_people
    elif len(add_people) == 1:
        return "individual_addition", add_people, remove_people
    elif has_removes and has_adds:
        return "update", add_people, remove_people
    elif has_removes and not has_adds:
        return "removal", add_people, remove_people
    else:
        return "update", add_people, remove_people


def _extract_people(changes: list[dict]) -> list[dict]:
    people = []
    for c in changes:
        if c["file"].startswith("csrankings") and c["file"].endswith(".csv"):
            parsed = parse_csv_line(c["line"], c["file"])
            if parsed and parsed.get("name") and parsed["name"] != "name":
                people.append(parsed)
    return people


# ===========================================================================
# Data quality checks
# ===========================================================================

def check_url_department_signals(homepage: str) -> dict:
    result = {"cs_signal": False, "non_cs_signal": False, "generic_url": False, "signals": []}
    url_lower = homepage.lower()
    for sig in CS_URL_SIGNALS:
        if sig in url_lower:
            result["cs_signal"] = True
            result["signals"].append(f"CS signal: '{sig}' in URL")
    for sig in NON_CS_URL_SIGNALS:
        if sig in url_lower:
            result["non_cs_signal"] = True
            result["signals"].append(f"Non-CS signal: '{sig}' in URL")
    for sig in GENERIC_FACULTY_URLS:
        if sig in url_lower:
            result["generic_url"] = True
            result["signals"].append(f"Generic faculty URL: '{sig}'")
    return result


def check_duplicate_scholar_ids(people: list[dict]) -> list[str]:
    scholar_ids: dict[str, list[str]] = {}
    for p in people:
        sid = p.get("scholarid", "")
        if sid and sid != "NOSCHOLARPAGE":
            scholar_ids.setdefault(sid, []).append(p.get("name", "?"))
    return [
        f"Duplicate Scholar ID {sid}: {', '.join(names)}"
        for sid, names in scholar_ids.items() if len(names) > 1
    ]


def check_red_flags(person: dict) -> list[str]:
    flags = []
    if person.get("scholarid") == "NOSCHOLARPAGE":
        orcid = person.get("orcid", "0000-0000-0000-0000")
        if orcid == "0000-0000-0000-0000":
            flags.append("NOSCHOLARPAGE with no ORCID")
        else:
            flags.append("NOSCHOLARPAGE (but ORCID provided)")
    if person.get("orcid") == "0000-0000-0000-0000":
        flags.append("Placeholder ORCID (all zeros)")
    if re.search(r'\d{4}$', person.get("name", "")):
        flags.append("DBLP disambiguated name")
    return flags


def score_person(hp: str, scholar: str, orcid: str) -> int:
    """Heuristic score for a single person based on URL signals and data quality."""
    score = 80
    hp_l = hp.lower()
    if any(s in hp_l for s in CS_URL_SIGNALS):
        score += 10
    if any(s in hp_l for s in NON_CS_URL_SIGNALS):
        score -= 25
    if scholar == "NOSCHOLARPAGE" and orcid == "0000-0000-0000-0000":
        score -= 15
    elif scholar == "NOSCHOLARPAGE":
        score -= 5
    return max(20, min(95, score))


# ===========================================================================
# Data loading
# ===========================================================================

def load_institutions() -> set[str]:
    path = BASEDIR / "institutions.csv"
    institutions: set[str] = set()
    with open(path, "r") as f:
        for row in csv.DictReader(f):
            institutions.add(row["institution"])
    return institutions


def load_existing_faculty() -> dict[str, dict]:
    faculty: dict[str, dict] = {}
    for csvfile in sorted(BASEDIR.glob("csrankings-*.csv")) + [BASEDIR / "csrankings.csv"]:
        if csvfile.exists():
            with open(csvfile, "r") as f:
                for row in csv.DictReader(f):
                    faculty[row["name"]] = row
    return faculty


# ===========================================================================
# Conflict resolution
# ===========================================================================

def is_csv_only_pr(pr_number: int) -> bool:
    """Check if a PR only modifies CSV files."""
    files = get_pr_files(pr_number)
    return bool(files) and all(f.endswith(".csv") for f in files)


def resolve_conflicts(pr_number: int, dry_run: bool = False) -> tuple[bool, str]:
    """
    Auto-resolve merge conflicts for CSV-only PRs by replaying changes
    onto the current gh-pages branch.

    Strategy: get the net additions/removals from the PR diff, check out
    gh-pages, apply them to the current files, commit, and force-push
    to the PR's branch.
    """
    # Get PR info
    branch = get_pr_branch(pr_number)
    if not branch:
        return False, "Could not determine branch name"

    files = get_pr_files(pr_number)
    if not files:
        return False, "No files in PR"
    if not all(f.endswith(".csv") for f in files):
        return False, f"Non-CSV files in PR: {[f for f in files if not f.endswith('.csv')]}"

    # Get net changes
    changes = get_diff_net_changes(pr_number)
    if not changes:
        return False, "No net CSV changes detected"

    if dry_run:
        summary = ", ".join(f"{f}: +{len(a)} -{len(r)}" for f, (a, r) in changes.items())
        return True, f"Would apply: {summary}"

    # Save current state
    orig = run_git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()
    stash_result = run_git(["stash"])
    did_stash = "No local changes" not in stash_result.stdout

    try:
        # Create temp branch from gh-pages
        run_git(["fetch", "origin", "gh-pages"], timeout=120)
        run_git(["branch", "-D", f"_resolve-{pr_number}"])
        r = run_git(["checkout", "-b", f"_resolve-{pr_number}", "origin/gh-pages"])
        if r.returncode != 0:
            return False, f"Failed to create temp branch: {r.stderr}"

        # Apply changes
        modified = []
        for filepath, (net_adds, net_rems) in changes.items():
            fullpath = BASEDIR / filepath
            if not fullpath.exists():
                # File doesn't exist — create it if we have additions
                if net_adds and not net_rems:
                    # Guess header from first entry
                    header = "name,affiliation,homepage,scholarid,orcid"
                    with open(fullpath, "w") as f:
                        f.write(header + "\n")
                        for line in sorted(net_adds):
                            f.write(line + "\n")
                    modified.append(filepath)
                continue

            with open(fullpath, "r") as f:
                content = f.read()
            lines = content.strip().split("\n")
            header = lines[0]
            data = set(lines[1:])

            # Apply removals
            for line in net_rems:
                data.discard(line)
            # Apply additions
            for line in net_adds:
                data.add(line)

            with open(fullpath, "w") as f:
                f.write(header + "\n")
                for line in sorted(data):
                    f.write(line + "\n")
            modified.append(filepath)

        if not modified:
            return False, "No files were modified"

        # Commit and force-push
        for f in modified:
            run_git(["add", f])

        r = run_git(["commit", "-m", f"Resolve conflicts for PR #{pr_number}"])
        if r.returncode != 0:
            return False, f"Commit failed: {r.stderr}"

        r = run_git(["push", "origin", f"_resolve-{pr_number}:{branch}", "--force"], timeout=120)
        if r.returncode != 0:
            return False, f"Push failed: {r.stderr}"

        return True, f"Resolved: updated {len(modified)} files on branch {branch}"

    finally:
        # Restore state
        run_git(["checkout", orig])
        run_git(["branch", "-D", f"_resolve-{pr_number}"])
        if did_stash:
            run_git(["stash", "pop"])


# ===========================================================================
# Institution grouping (for consolidation and duplicate detection)
# ===========================================================================

def extract_institution(title: str) -> Optional[str]:
    """Extract institution name from a PR title."""
    m = re.search(r'from (.+?)(?:\s*\(auto-batched\)|\s*\(consolidated\))?$', title)
    if not m:
        m = re.search(r'\(([^)]+)\)\s*$', title)
    return m.group(1).strip() if m else None


def find_institution_groups(prs: list[dict]) -> dict[str, list[dict]]:
    """Group PRs by institution (only groups with 2+ PRs)."""
    by_inst: dict[str, list[dict]] = defaultdict(list)
    for pr in prs:
        inst = extract_institution(pr["title"])
        if inst:
            by_inst[inst].append(pr)
    return {inst: prlist for inst, prlist in by_inst.items() if len(prlist) > 1}


# ===========================================================================
# Comprehensive PR info
# ===========================================================================

def get_pr_info(pr_number: int) -> dict:
    pr = run_gh([
        "pr", "view", str(pr_number), "--repo", REPO,
        "--json", "number,title,author,labels,headRefName,body,files"
    ])
    if not pr:
        raise RuntimeError(f"Could not fetch PR #{pr_number}")
    diff = get_pr_diff(pr_number)
    additions, removals = parse_csv_diff(diff)
    pr_type, add_people, remove_people = classify_pr(pr["title"], additions, removals)
    return {
        "number": pr["number"], "title": pr["title"],
        "author": pr.get("author", {}).get("login", "unknown"),
        "labels": [l["name"] for l in pr.get("labels", [])],
        "files": [f["path"] for f in pr.get("files", [])],
        "type": pr_type, "additions": additions, "removals": removals,
        "add_people": add_people, "remove_people": remove_people,
        "diff": diff, "body": pr.get("body", ""),
    }


# ===========================================================================
# Commands
# ===========================================================================

def cmd_list():
    prs = get_open_prs()
    needs = []
    print(f"Checking {len(prs)} open PRs...")
    for pr in prs:
        if not has_our_validation(pr["number"]):
            needs.append(pr)
            print(f"  #{pr['number']}: {pr['title']} -- NEEDS VALIDATION")
    print(f"\n{len(needs)} PRs need validation")
    with open("/tmp/prs_needing_validation.json", "w") as f:
        json.dump([{"number": p["number"], "title": p["title"]} for p in needs], f, indent=2)


def cmd_scores():
    prs = get_open_prs()
    above, below = [], []
    print("Scanning for validation scores...")
    for pr in prs:
        score = get_validation_score(pr["number"])
        if score is not None:
            (above if score >= DEFAULT_MERGE_THRESHOLD else below).append(
                (pr["number"], score, pr["title"])
            )
            tag = " [MERGEABLE]" if score >= DEFAULT_MERGE_THRESHOLD else ""
            print(f"  #{pr['number']}: {score}% -- {pr['title']}{tag}")
    print(f"\nMergeable (>= {DEFAULT_MERGE_THRESHOLD}%): {len(above)}")
    print(f"Below threshold: {len(below)}")


def cmd_merge(specific_pr: Optional[int] = None, threshold: int = DEFAULT_MERGE_THRESHOLD,
              auto_resolve: bool = True):
    """
    Merge PRs at or above the threshold.

    For each eligible PR:
      1. Try direct merge (squash).
      2. If it fails and the PR is CSV-only, auto-resolve conflicts and retry.
      3. Report results.
    """
    if specific_pr:
        score = get_validation_score(specific_pr)
        if score is None:
            print(f"PR #{specific_pr}: no validation score found"); return
        if score < threshold:
            print(f"PR #{specific_pr}: score {score}% < {threshold}% threshold"); return
        ok, msg = _merge_one(specific_pr, auto_resolve)
        print(f"PR #{specific_pr}: {'MERGED' if ok else 'FAILED'} -- {msg}")
        return

    # Batch merge
    prs = get_open_prs()
    eligible = []
    print(f"Finding PRs with score >= {threshold}%...")
    for pr in prs:
        score = get_validation_score(pr["number"])
        if score is not None and score >= threshold:
            eligible.append((pr["number"], score, pr["title"]))
            print(f"  #{pr['number']}: {score}% | {pr['title']}")

    if not eligible:
        print("No PRs to merge."); return

    print(f"\n{len(eligible)} PRs eligible. Merging...\n")
    merged, failed, resolved = 0, 0, 0
    for pr_num, score, title in eligible:
        ok, msg = _merge_one(pr_num, auto_resolve)
        label = "MERGED"
        if ok:
            merged += 1
            if "Resolved" in msg:
                resolved += 1
                label = "RESOLVED+MERGED"
        else:
            failed += 1
            label = "FAILED"
        print(f"  {label} #{pr_num} ({score}%): {title}")
        if not ok:
            print(f"    → {msg}")

    print(f"\nDone: {merged} merged ({resolved} after conflict resolution), {failed} failed")


def _merge_one(pr_number: int, auto_resolve: bool) -> tuple[bool, str]:
    """Try to merge a single PR, optionally resolving conflicts first."""
    # Try direct merge
    ok, msg = gh_merge(pr_number)
    if ok:
        return True, msg

    # If it failed and we should try resolving
    if not auto_resolve:
        return False, msg

    if "not mergeable" not in msg.lower() and "conflict" not in msg.lower():
        return False, msg

    # Check if CSV-only
    if not is_csv_only_pr(pr_number):
        return False, f"Conflicts on non-CSV PR: {msg}"

    # Resolve conflicts
    rok, rmsg = resolve_conflicts(pr_number)
    if not rok:
        return False, f"Auto-resolve failed: {rmsg}"

    # Wait for GitHub to process the push
    time.sleep(3)

    # Retry merge
    ok2, msg2 = gh_merge(pr_number)
    if ok2:
        return True, f"Resolved conflicts then merged. {rmsg}"
    return False, f"Resolved conflicts but merge still failed: {msg2}"


def cmd_resolve(specific_pr: Optional[int] = None, dry_run: bool = False):
    """Auto-resolve conflicts on CSV-only PRs."""
    if specific_pr:
        ok, msg = resolve_conflicts(specific_pr, dry_run=dry_run)
        print(f"PR #{specific_pr}: {'OK' if ok else 'FAILED'} -- {msg}")
        return

    prs = get_open_prs()
    print(f"Checking {len(prs)} PRs for conflicts...")
    resolved, skipped, failed = 0, 0, 0
    for pr in prs:
        num = pr["number"]
        mergeable, state = get_pr_merge_status(num)
        if mergeable not in ("CONFLICTING",):
            continue

        if not is_csv_only_pr(num):
            print(f"  #{num}: SKIP (non-CSV files) | {pr['title']}")
            skipped += 1
            continue

        ok, msg = resolve_conflicts(num, dry_run=dry_run)
        if ok:
            resolved += 1
            print(f"  #{num}: {'WOULD RESOLVE' if dry_run else 'RESOLVED'} | {pr['title']}")
        else:
            failed += 1
            print(f"  #{num}: FAILED ({msg}) | {pr['title']}")

    print(f"\nDone: {resolved} resolved, {skipped} skipped (non-CSV), {failed} failed")


def cmd_gather(pr_number: int):
    info = get_pr_info(pr_number)
    institutions = load_institutions()
    faculty = load_existing_faculty()

    print(f"PR #{info['number']}: {info['title']}")
    print(f"Type: {info['type']}")
    print(f"Files: {', '.join(info['files'])}")
    print(f"Bot validation: {'PASSED' if has_bot_validation_passed(pr_number) else 'not passed'}")

    if info["add_people"]:
        dupes = check_duplicate_scholar_ids(info["add_people"])
        if dupes:
            print("\n!!! DATA ERRORS !!!")
            for d in dupes:
                print(f"  {d}")
        print(f"\n--- Adding {len(info['add_people'])} people ---")
        for i, p in enumerate(info["add_people"], 1):
            name, affil = p.get("name", "?"), p.get("affiliation", "?")
            known_inst = affil in institutions
            print(f"\n  [{i}] {name}")
            print(f"      Affiliation: {affil} {'(known)' if known_inst else '(UNKNOWN INSTITUTION)'}")
            print(f"      Homepage: {p.get('homepage', 'N/A')}")
            print(f"      Scholar: {p.get('scholarid', 'N/A')} | ORCID: {p.get('orcid', 'N/A')}")
            if name in faculty:
                print(f"      WARNING: already exists at {faculty[name].get('affiliation', '?')}")
            hp = p.get("homepage", "")
            if hp:
                for sig in check_url_department_signals(hp)["signals"]:
                    print(f"      {sig}")
            for flag in check_red_flags(p):
                print(f"      RED FLAG: {flag}")

    if info["remove_people"]:
        print(f"\n--- Removing {len(info['remove_people'])} people ---")
        for i, p in enumerate(info["remove_people"], 1):
            print(f"  [{i}] {p.get('name', '?')} ({p.get('affiliation', '?')})")

    print(f"\n--- Diff (first 5000 chars) ---")
    print(info["diff"][:5000])


def cmd_gather_all():
    prs = get_open_prs()
    unvalidated = [pr for pr in prs if not has_our_validation(pr["number"])]
    print(f"Gathering info for {len(unvalidated)} unvalidated PRs...\n")
    results = []
    for pr in unvalidated:
        try:
            info = get_pr_info(pr["number"])
            results.append(info)
            print(f"  #{pr['number']}: {info['type']} | +{len(info['add_people'])} -{len(info['remove_people'])} | {pr['title']}")
        except Exception as e:
            print(f"  #{pr['number']}: ERROR: {e}")
    for r in results:
        r["diff_preview"] = r["diff"][:2000]
        del r["diff"]
    with open("/tmp/prs_gathered.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved {len(results)} PR details to /tmp/prs_gathered.json")


def cmd_comment(pr_number: int, filepath: str):
    path = Path(filepath)
    if not path.exists():
        print(f"File not found: {filepath}"); sys.exit(1)
    body = path.read_text()
    if VALIDATION_FOOTER not in body:
        print("Comment file missing required VALIDATION.md footer"); sys.exit(1)
    ok, msg = gh_post_comment(pr_number, body)
    print(f"PR #{pr_number}: {msg}")
    if not ok:
        sys.exit(1)


def cmd_duplicates():
    prs = get_open_prs()
    groups = find_institution_groups(prs)
    if not groups:
        print("No institutions with multiple open PRs.")
        return
    print("=== Institutions with multiple open PRs ===\n")
    for inst in sorted(groups, key=lambda i: -len(groups[i])):
        prlist = groups[inst]
        print(f"{inst} ({len(prlist)} PRs):")
        for pr in sorted(prlist, key=lambda x: x["number"]):
            print(f"  #{pr['number']}: {pr['title']}")
        print()


def cmd_close_dupes():
    """For each institution with duplicate open PRs, keep the lowest-numbered and close the rest."""
    prs = get_open_prs()
    groups = find_institution_groups(prs)
    if not groups:
        print("No duplicate PRs found.")
        return

    closed = 0
    for inst, prlist in sorted(groups.items()):
        pr_nums = sorted(p["number"] for p in prlist)
        keep = pr_nums[0]
        to_close = pr_nums[1:]
        keep_url = f"https://github.com/{REPO}/pull/{keep}"
        print(f"{inst}: keeping #{keep}, closing {to_close}")
        for num in to_close:
            ok, msg = gh_close_pr(num, f"Closing duplicate — see #{keep}: {keep_url}")
            print(f"  #{num}: {'Closed' if ok else f'FAILED: {msg}'}")
            if ok:
                closed += 1
    print(f"\nClosed {closed} duplicate PRs")


def cmd_consolidate():
    """Consolidate multiple PRs for the same institution into single PRs."""
    prs = get_open_prs()
    groups = find_institution_groups(prs)
    if not groups:
        print("No institutions with multiple open PRs to consolidate.")
        return

    print(f"Found {len(groups)} institutions with multiple PRs:\n")
    for inst, prlist in sorted(groups.items(), key=lambda x: -len(x[1])):
        pr_nums = [p["number"] for p in prlist]
        print(f"  {inst}: {pr_nums}")

    print(f"\nConsolidating...\n")

    # Save and restore state
    orig = run_git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()
    stash_result = run_git(["stash"])
    did_stash = "No local changes" not in stash_result.stdout

    try:
        for inst, prlist in sorted(groups.items(), key=lambda x: -len(x[1])):
            pr_nums = sorted(p["number"] for p in prlist)
            print(f"{'=' * 60}")
            print(f"{inst} ({len(pr_nums)} PRs): {pr_nums}")

            # Collect all net additions and scores per PR
            all_adds: dict[str, set[str]] = defaultdict(set)
            all_rems: dict[str, set[str]] = defaultdict(set)
            pr_scores: dict[int, Optional[int]] = {}

            for num in pr_nums:
                pr_scores[num] = get_validation_score(num)
                changes = get_diff_net_changes(num)
                for f, (adds, rems) in changes.items():
                    all_adds[f].update(adds)
                    all_rems[f].update(rems)

            # Parse all unique people from additions
            seen_names: set[str] = set()
            all_people: list[dict] = []
            for f, lines in all_adds.items():
                for line in lines:
                    p = parse_csv_line(line, f)
                    if p and p.get("name") and p["name"] not in seen_names:
                        seen_names.add(p["name"])
                        all_people.append(p)

            n_people = len(all_people)
            if n_people == 0 and not any(all_rems.values()):
                print("  No net changes — skipping")
                continue

            print(f"  {n_people} unique faculty")

            # Calculate per-person scores
            person_scores = []
            for p in all_people:
                s = score_person(p.get("homepage", ""), p.get("scholarid", ""),
                                 p.get("orcid", ""))
                p["score"] = s
                person_scores.append(s)

            if person_scores:
                joint = 1.0
                for s in person_scores:
                    joint *= s / 100.0
                avg = sum(person_scores) / len(person_scores)
                print(f"  Avg score: {avg:.0f}%, Joint P(all valid): {joint * 100:.2f}%")
            else:
                avg, joint = 80, 0.8

            # Create branch from latest gh-pages
            slug = re.sub(r'[^a-z0-9]+', '-', inst.lower()).strip('-')
            branch = f"consolidate-{slug}"
            run_git(["fetch", "origin", "gh-pages"], timeout=120)
            run_git(["branch", "-D", branch])
            r = run_git(["checkout", "-b", branch, "origin/gh-pages"])
            if r.returncode != 0:
                print(f"  ERROR creating branch: {r.stderr}")
                continue

            # Apply changes to CSV files
            modified_files = []
            for filepath in sorted(set(list(all_adds.keys()) + list(all_rems.keys()))):
                fullpath = BASEDIR / filepath
                try:
                    with open(fullpath, "r") as f:
                        content = f.read()
                    lines = content.strip().split("\n")
                    header = lines[0]
                    data = set(lines[1:])

                    added = removed = 0
                    for line in all_rems.get(filepath, set()):
                        if line in data:
                            data.discard(line)
                            removed += 1
                    for line in all_adds.get(filepath, set()):
                        if line not in data:
                            data.add(line)
                            added += 1

                    if added > 0 or removed > 0:
                        with open(fullpath, "w") as f:
                            f.write(header + "\n")
                            for line in sorted(data):
                                f.write(line + "\n")
                        modified_files.append(filepath)
                        parts = []
                        if added:
                            parts.append(f"+{added}")
                        if removed:
                            parts.append(f"-{removed}")
                        print(f"  {filepath}: {' '.join(parts)}")
                except Exception as e:
                    print(f"  ERROR {filepath}: {e}")

            if not modified_files:
                print("  No new changes — skipping")
                run_git(["checkout", orig])
                continue

            # Commit and push
            for f in modified_files:
                run_git(["add", f])

            pr_refs = ", ".join(f"#{p}" for p in pr_nums)
            run_git(["commit", "-m", f"Consolidate {inst} additions (from {pr_refs})"])
            r = run_git(["push", "-u", "origin", branch, "--force"], timeout=120)
            if r.returncode != 0:
                print(f"  Push failed: {r.stderr.strip()}")
                run_git(["checkout", orig])
                run_git(["branch", "-D", branch])
                continue

            # Build PR body
            body = f"## Consolidated PR for {inst}\n\n"
            body += "This PR consolidates the following open PRs:\n\n"
            body += "| PR | Score | Title |\n|---|---|---|\n"
            for p in pr_nums:
                try:
                    ti = run_gh_text([
                        "pr", "view", str(p), "--repo", REPO,
                        "--json", "title", "--jq", ".title"
                    ]).strip()
                except Exception:
                    ti = "?"
                s = pr_scores.get(p)
                body += f"| #{p} | {f'{s}%' if s is not None else 'N/A'} | {ti} |\n"

            body += f"\nTotal: {n_people} faculty additions.\n"
            if person_scores:
                body += f"Average individual score: {avg:.0f}%\n"
                body += f"Joint probability (all valid): {joint * 100:.1f}%\n"

            # Create PR
            try:
                result = subprocess.run(
                    ["gh", "pr", "create", "--repo", REPO, "--base", "gh-pages",
                     "--head", branch,
                     "--title", f"Add {n_people} faculty from {inst} (consolidated)",
                     "--body", body],
                    capture_output=True, text=True, timeout=30, cwd=str(BASEDIR)
                )
                if result.returncode == 0:
                    new_url = result.stdout.strip()
                    new_num = int(new_url.rstrip('/').split('/')[-1])
                    print(f"  Created: {new_url}")

                    # Post validation comment
                    _post_consolidation_validation(
                        new_num, inst, pr_nums, all_people, person_scores, avg, joint
                    )

                    # Close individual PRs
                    for p in pr_nums:
                        ok, _ = gh_close_pr(p, f"Closing in favor of consolidated PR: {new_url}")
                        print(f"  {'Closed' if ok else 'Failed to close'} #{p}")
                else:
                    print(f"  Failed to create PR: {result.stderr.strip()}")
            except Exception as e:
                print(f"  Error creating PR: {e}")

            run_git(["checkout", orig])
            run_git(["branch", "-D", branch])
            print()

    finally:
        run_git(["checkout", orig])
        if did_stash:
            run_git(["stash", "pop"])

    print("\nDone!")


def _post_consolidation_validation(
    pr_num: int, inst: str, source_prs: list[int],
    people: list[dict], scores: list[int], avg: float, joint: float
):
    """Post a validation comment on a newly created consolidated PR."""
    rows = []
    for i, p in enumerate(sorted(people, key=lambda x: x.get("name", "")), 1):
        hp_l = p.get("homepage", "").lower()
        cs = "✅" if any(s in hp_l for s in CS_URL_SIGNALS) else (
            "❌" if any(s in hp_l for s in NON_CS_URL_SIGNALS) else "⚠️")
        sch = "✅" if p.get("scholarid", "NOSCHOLARPAGE") != "NOSCHOLARPAGE" else "❌"
        orc = "✅" if p.get("orcid", "0000-0000-0000-0000") != "0000-0000-0000-0000" else "⚠️"
        rows.append(f"| {i} | {p.get('name', '?')} | {cs} | {sch} | {orc} | {p.get('score', 80)}% |")

    n = len(people)
    comment = f"""## Validation Assessment: {n} Faculty from {inst}

**Overall likelihood of validity: {avg:.0f}%**
**Joint probability (all {n} valid): {joint * 100:.1f}%**

### Institution-Level Notes
- Consolidated from {len(source_prs)} individual PRs: {', '.join(f'#{p}' for p in source_prs)}

### Per-Person Analysis

| # | Name | Dept | Scholar | ORCID | Score |
|---|------|------|---------|-------|-------|
{chr(10).join(rows)}

### Probability Calculation
- Individual scores: {', '.join(f'{s}%' for s in sorted(scores, reverse=True))}
- Average: {avg:.1f}%
- Joint P(all valid) = {' × '.join(f'{s / 100:.2f}' for s in scores)} = **{joint * 100:.1f}%**

### Summary
{sum(1 for s in scores if s >= 80)} of {n} entries score ≥80%. {sum(1 for s in scores if s < 60)} entries have significant concerns (<60%).

---
{FOOTER_MD}"""

    filepath = f"/tmp/validate_{pr_num}.md"
    with open(filepath, "w") as f:
        f.write(comment)

    ok, msg = gh_post_comment(pr_num, comment)
    if ok:
        # Add validated label
        subprocess.run(
            ["gh", "pr", "edit", str(pr_num), "--repo", REPO, "--add-label", "validated"],
            capture_output=True, text=True, timeout=15
        )
        print(f"  Validation comment posted on #{pr_num}")
    else:
        print(f"  Failed to post validation on #{pr_num}: {msg}")


def cmd_status():
    prs = get_open_prs()
    has_ours, above, below = [], [], []
    bot_only, no_val = [], []

    print(f"Analyzing {len(prs)} open PRs...\n")
    for pr in prs:
        pr_num, title = pr["number"], pr["title"]
        ours = has_our_validation(pr_num)
        score = get_validation_score(pr_num) if ours else None
        bot = has_bot_validation_passed(pr_num)

        if ours:
            has_ours.append(pr_num)
            if score is not None and score >= DEFAULT_MERGE_THRESHOLD:
                above.append((pr_num, score, title))
            elif score is not None:
                below.append((pr_num, score, title))
        elif bot:
            bot_only.append((pr_num, title))
        else:
            no_val.append((pr_num, title))

    print(f"=== Our validation ({len(has_ours)} PRs) ===")
    if above:
        print(f"\n  Mergeable (>= {DEFAULT_MERGE_THRESHOLD}%): {len(above)}")
        for n, s, t in above:
            print(f"    #{n}: {s}% | {t}")
    if below:
        print(f"\n  Below threshold: {len(below)}")
        for n, s, t in below:
            print(f"    #{n}: {s}% | {t}")
    if bot_only:
        print(f"\n=== Bot only ({len(bot_only)} PRs) ===")
        for n, t in bot_only:
            print(f"    #{n}: {t}")
    if no_val:
        print(f"\n=== No validation ({len(no_val)} PRs) ===")
        for n, t in no_val:
            print(f"    #{n}: {t}")

    # Check for institution duplicates
    groups = find_institution_groups(prs)
    if groups:
        print(f"\n=== Institutions needing consolidation ({len(groups)}) ===")
        for inst, prlist in sorted(groups.items(), key=lambda x: -len(x[1])):
            print(f"    {inst}: {[p['number'] for p in prlist]}")

    print(f"\n=== Summary ===")
    print(f"  Total open: {len(prs)}")
    print(f"  Our validation: {len(has_ours)} (mergeable: {len(above)}, below: {len(below)})")
    print(f"  Bot only: {len(bot_only)}, None: {len(no_val)}")
    if groups:
        print(f"  Institutions to consolidate: {len(groups)}")


# ===========================================================================
# Main
# ===========================================================================

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="validate_prs.py",
        description=(
            "PR Validation & Management Tool for CSRankings.\n\n"
            "Manages the full lifecycle of open pull requests on\n"
            "emeryberger/CSrankings: validation, scoring, merging,\n"
            "conflict resolution, deduplication, and consolidation.\n\n"
            "Requires the GitHub CLI (gh) to be installed and authenticated."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "workflow examples:\n"
            "  # Full triage of open PRs\n"
            "  %(prog)s status\n\n"
            "  # Validate a new PR, then merge everything ready\n"
            "  %(prog)s gather 12345\n"
            "  %(prog)s comment 12345 /tmp/validation.md\n"
            "  %(prog)s merge\n\n"
            "  # Resolve all conflicts, then merge at a lower threshold\n"
            "  %(prog)s resolve\n"
            "  %(prog)s merge -t 75\n\n"
            "  # Consolidate duplicate institution PRs, then merge\n"
            "  %(prog)s duplicates\n"
            "  %(prog)s consolidate\n"
            "  %(prog)s merge\n\n"
            "validation comments:\n"
            "  Comments must contain the footer string:\n"
            '  "Automated validation analysis based on [VALIDATION.md]"\n'
            "  and a score line matching one of:\n"
            '  "Likelihood of validity: NN%%"\n'
            '  "Overall likelihood of validity: NN%%"\n'
            "  The LAST score in the comment thread is used (most recent wins).\n\n"
            "conflict resolution:\n"
            "  The resolve and merge commands can auto-resolve conflicts on\n"
            "  CSV-only PRs. Strategy: extract net additions/removals from the\n"
            "  PR diff, apply them to the current gh-pages branch, and force-push\n"
            "  the PR branch. This works because csrankings CSVs are sorted and\n"
            "  line-based — conflicts are always caused by concurrent merges\n"
            "  touching the same file, not semantic conflicts.\n\n"
            "scoring heuristics:\n"
            "  Per-person scores start at 80%% and are adjusted:\n"
            "    +10  CS URL signal (cs., cse., computing., /cs/, cis.)\n"
            "    -25  Non-CS URL signal (ece., ee., ist., automation., math.)\n"
            "    -15  NOSCHOLARPAGE with no ORCID\n"
            "     -5  NOSCHOLARPAGE (but ORCID provided)\n"
            "  Scores are clamped to [20, 95]. For batch PRs, joint probability\n"
            "  is P(all valid) = product of individual probabilities.\n"
        ),
    )
    sub = parser.add_subparsers(dest="command", metavar="COMMAND")

    # --- status ---
    sub.add_parser(
        "status",
        help="Full status report of all open PRs",
        description=(
            "Show a categorized overview of every open PR: which have our\n"
            "validation comments, their scores, which have only bot validation,\n"
            "which have none, and which institutions have multiple PRs that\n"
            "could be consolidated."
        ),
    )

    # --- list ---
    sub.add_parser(
        "list",
        help="List PRs that need our validation comment",
        description=(
            "Scan all open PRs and print those missing a validation comment\n"
            "containing the VALIDATION.md footer. Saves the list to\n"
            "/tmp/prs_needing_validation.json."
        ),
    )

    # --- scores ---
    sub.add_parser(
        "scores",
        help="Show validation scores for all open PRs",
        description=(
            "Print each open PR that has a validation score, sorted by PR number.\n"
            "PRs meeting the default merge threshold are tagged [MERGEABLE].\n"
            f"Default threshold: {DEFAULT_MERGE_THRESHOLD}%."
        ),
    )

    # --- check ---
    p = sub.add_parser(
        "check",
        help="Check if a PR has our validation comment",
        description="Report whether PR has a comment with the VALIDATION.md footer.",
    )
    p.add_argument("pr", type=int, metavar="PR", help="PR number to check")

    # --- info / gather ---
    p = sub.add_parser(
        "info",
        aliases=["gather"],
        help="Show detailed info for a single PR",
        description=(
            "Fetch the PR diff, classify the PR type (addition, removal, update,\n"
            "batch), extract added/removed people, check for data quality issues\n"
            "(duplicate Scholar IDs, red flags), and print the first 5000 chars\n"
            "of the diff. Useful for writing a validation comment."
        ),
    )
    p.add_argument("pr", type=int, metavar="PR", help="PR number to inspect")

    # --- gather-all ---
    sub.add_parser(
        "gather-all",
        help="Gather info for all unvalidated PRs (saves to /tmp/prs_gathered.json)",
        description=(
            "Like 'info' but runs on every open PR that lacks our validation\n"
            "comment. Results (excluding full diffs) are saved to\n"
            "/tmp/prs_gathered.json for batch processing."
        ),
    )

    # --- comment ---
    p = sub.add_parser(
        "comment",
        help="Post a validation comment on a PR from a markdown file",
        description=(
            "Read a markdown file and post it as a comment on the given PR.\n"
            "The file MUST contain the VALIDATION.md footer string or the\n"
            "command will refuse to post (safety check)."
        ),
    )
    p.add_argument("pr", type=int, metavar="PR", help="PR number to comment on")
    p.add_argument("file", metavar="FILE", help="Path to markdown comment file")

    # --- merge ---
    p = sub.add_parser(
        "merge",
        help="Squash-merge PRs at or above the score threshold",
        description=(
            "Merge eligible PRs via squash merge. For each PR:\n"
            "  1. Try direct merge.\n"
            "  2. If it fails due to conflicts and the PR only touches CSV files,\n"
            "     auto-resolve by replaying changes onto current gh-pages.\n"
            "  3. Retry the merge.\n\n"
            "With no PR argument, merges ALL eligible PRs (batch mode).\n"
            "With a PR argument, merges only that PR.\n\n"
            f"Default threshold: {DEFAULT_MERGE_THRESHOLD}%. "
            "Override with -t/--threshold."
        ),
    )
    p.add_argument(
        "pr", type=int, nargs="?", default=None, metavar="PR",
        help="Merge only this PR (omit for batch mode)",
    )
    p.add_argument(
        "-t", "--threshold", type=int, default=DEFAULT_MERGE_THRESHOLD,
        metavar="N",
        help=f"Minimum validation score to merge (default: {DEFAULT_MERGE_THRESHOLD})",
    )
    p.add_argument(
        "--no-resolve", action="store_true",
        help="Skip automatic conflict resolution; only merge clean PRs",
    )

    # --- resolve ---
    p = sub.add_parser(
        "resolve",
        help="Auto-resolve merge conflicts on CSV-only PRs",
        description=(
            "For PRs with merge conflicts that only touch CSV files, resolve\n"
            "by extracting net additions/removals from the PR diff, applying\n"
            "them to the current gh-pages branch, and force-pushing the result\n"
            "to the PR's head branch.\n\n"
            "Non-CSV PRs are skipped (they need manual resolution).\n\n"
            "With no PR argument, scans all open PRs for conflicts.\n"
            "With a PR argument, resolves only that PR."
        ),
    )
    p.add_argument(
        "pr", type=int, nargs="?", default=None, metavar="PR",
        help="Resolve only this PR (omit to scan all)",
    )
    p.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be resolved without making changes",
    )

    # --- duplicates ---
    sub.add_parser(
        "duplicates",
        help="Find institutions with multiple open PRs",
        description=(
            "Group open PRs by institution name (extracted from PR title) and\n"
            "list any institution that has 2 or more open PRs. These are\n"
            "candidates for consolidation or deduplication."
        ),
    )

    # --- close-dupes ---
    sub.add_parser(
        "close-dupes",
        help="Close duplicate PRs (keeps lowest PR number per institution)",
        description=(
            "For each institution with multiple open PRs, keep the one with\n"
            "the lowest PR number and close the rest with a comment pointing\n"
            "to the kept PR."
        ),
    )

    # --- consolidate ---
    sub.add_parser(
        "consolidate",
        help="Merge multiple PRs per institution into single consolidated PRs",
        description=(
            "For each institution with 2+ open PRs:\n"
            "  1. Collect net CSV additions/removals from all PRs.\n"
            "  2. Create a new branch from gh-pages with all changes applied.\n"
            "  3. Push and create a new consolidated PR.\n"
            "  4. Post a validation comment with per-person scores and\n"
            "     joint probability (P(all valid) = product of individual P).\n"
            "  5. Close the original individual PRs with a link to the new one.\n\n"
            "If a consolidated PR already exists for the branch name, the push\n"
            "updates it but a new PR is not created (existing one is reused)."
        ),
    )

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "list":
        cmd_list()
    elif args.command == "status":
        cmd_status()
    elif args.command in ("info", "gather"):
        cmd_gather(args.pr)
    elif args.command == "check":
        n = args.pr
        print(f"PR #{n}: {'HAS' if has_our_validation(n) else 'does NOT have'} our validation")
    elif args.command == "scores":
        cmd_scores()
    elif args.command == "merge":
        cmd_merge(
            specific_pr=args.pr,
            threshold=args.threshold,
            auto_resolve=not args.no_resolve,
        )
    elif args.command == "resolve":
        cmd_resolve(specific_pr=args.pr, dry_run=args.dry_run)
    elif args.command == "gather-all":
        cmd_gather_all()
    elif args.command == "comment":
        cmd_comment(args.pr, args.file)
    elif args.command == "duplicates":
        cmd_duplicates()
    elif args.command == "close-dupes":
        cmd_close_dupes()
    elif args.command == "consolidate":
        cmd_consolidate()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
