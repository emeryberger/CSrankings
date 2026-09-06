#!/usr/bin/env python3
"""
Test suite for the alphabetical ordering of the faculty CSV files.

Three components have to agree on what "alphabetical order" means:

  1. util/sort-csv-files.py     -- writes the order, run by `make`
  2. util/validate_commit.py    -- enforces the order on new entries in CI
  3. .github/workflows/process-submission.yml
                                -- picks the insertion point for a new row

They drifted apart once already: the files were sorted case-sensitively while
the CI bot checked with unidecode+lowercase, so 475 adjacent pairs were sites
where a correctly-placed entry got rejected. These tests pin the invariant.

Run with: pytest test/test_sort_order.py -v
"""

import csv
import glob
import json
import os
import re
import subprocess
import sys

import pytest
import unidecode

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, "util"))

from validate_commit import normalize_name_for_sorting  # noqa: E402

# Files whose name column is sorted with the normalized key. Must stay in step
# with the "sort_key": "unidecode_lower" directives in sort_directives.json.
NAME_SORTED_GLOBS = ["csrankings-[a-z].csv", "old/industry.csv",
                     "old/rip.csv", "old/emeritus.csv"]


def name_sorted_files():
    out = []
    for pattern in NAME_SORTED_GLOBS:
        out.extend(sorted(glob.glob(os.path.join(REPO_ROOT, pattern))))
    return out


def names_in(path):
    with open(path, newline="", encoding="utf-8") as f:
        return [r[0] for r in csv.reader(f) if r and r[0] != "name"]


@pytest.mark.parametrize("path", name_sorted_files(),
                         ids=lambda p: os.path.relpath(p, REPO_ROOT))
def test_file_is_sorted_by_validator_key(path):
    """Every file is in the order validate_commit.py enforces.

    A violation here means CI will reject correctly-placed new entries in that
    neighbourhood -- the failure is reported against the contributor's PR, not
    against the file that actually caused it.
    """
    names = names_in(path)
    bad = [
        (names[i - 1], names[i])
        for i in range(1, len(names))
        if normalize_name_for_sorting(names[i - 1]) > normalize_name_for_sorting(names[i])
    ]
    assert not bad, (
        f"{os.path.relpath(path, REPO_ROOT)} has {len(bad)} out-of-order pair(s); "
        f"first: {bad[0][0]!r} sorts after {bad[0][1]!r}. Run `make clean-csrankings`."
    )


def test_sort_directives_use_the_normalized_key():
    """The name-sorted directives request the key that matches the validator."""
    with open(os.path.join(REPO_ROOT, "sort_directives.json"), encoding="utf-8") as f:
        directives = json.load(f)
    for directive in directives:
        files = directive["files"]
        if any(f.startswith("csrankings-") or f.startswith("old/") for f in files):
            assert directive.get("sort_key") == "unidecode_lower", (
                f"directive for {files} must set \"sort_key\": \"unidecode_lower\" so the "
                f"build writes the same order util/validate_commit.py enforces"
            )


def test_sorter_uses_a_stable_sort():
    """Ties must not reshuffle between runs.

    The normalized key creates ties the raw values never had (accent-alias pairs
    such as "Eray Tuzun"/"Eray Tuzun" with a diaeresis share a key). Without a
    stable sort those rows swap on every `make`, producing a spurious diff each
    time.
    """
    src = open(os.path.join(REPO_ROOT, "util", "sort-csv-files.py"), encoding="utf-8").read()
    assert "kind='stable'" in src or 'kind="stable"' in src, (
        "sort_values() on the derived key columns must pass kind='stable'"
    )


def test_workflow_sort_key_matches_the_validator():
    """The submission workflow's JS sortKey reproduces the Python normalization.

    Checked against every name in the data, so any character where the two
    disagree shows up here rather than as a mis-placed row in a generated PR.
    """
    workflow = os.path.join(REPO_ROOT, ".github", "workflows", "process-submission.yml")
    text = open(workflow, encoding="utf-8").read()

    start = text.find("const transliterate")
    assert start != -1, "process-submission.yml no longer defines `transliterate`"
    end = text.find(".trim();", start)
    assert end != -1, "process-submission.yml no longer defines `sortKey`"
    snippet = text[start:end + len(".trim();")]
    # The workflow body is indented inside the YAML; strip it so node can parse.
    snippet = "\n".join(line.strip() for line in snippet.splitlines())

    names = []
    for path in name_sorted_files():
        names.extend(names_in(path))
    assert names, "no names found to compare"

    script = (
        snippet
        # node's argv is [execPath, scriptPath, ...args], so the data file is argv[2].
        + "\nconst names = JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));"
        + "\nconsole.log(JSON.stringify(names.map(sortKey)));"
    )
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        js_path = os.path.join(tmp, "sortkey.js")
        names_path = os.path.join(tmp, "names.json")
        open(js_path, "w", encoding="utf-8").write(script)
        json.dump(names, open(names_path, "w", encoding="utf-8"))
        try:
            proc = subprocess.run([ "node", js_path, names_path ],
                                  capture_output=True, text=True, timeout=300)
        except FileNotFoundError:
            pytest.skip("node is not available")
        assert proc.returncode == 0, f"node failed: {proc.stderr[:500]}"
        js_keys = json.loads(proc.stdout)

    mismatches = [
        (n, js, normalize_name_for_sorting(n))
        for n, js in zip(names, js_keys)
        if js != normalize_name_for_sorting(n)
    ]
    assert not mismatches, (
        f"{len(mismatches)} name(s) where the workflow's sortKey disagrees with "
        f"normalize_name_for_sorting; first: {mismatches[0][0]!r} -> "
        f"js={mismatches[0][1]!r} python={mismatches[0][2]!r}. "
        f"Add the offending character to the `transliterate` table."
    )


def test_industry_csv_row_width():
    """old/industry.csv carries a `company` column the other old/ files lack.

    Removals used to copy the 5-field csrankings row across verbatim, which put
    the ORCID in the company column and left orcid empty.
    """
    path = os.path.join(REPO_ROOT, "old", "industry.csv")
    with open(path, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.reader(f) if r]
    header = rows[0]
    assert header == ["name", "affiliation", "homepage", "scholarid", "company", "orcid"]
    bad = [r for r in rows[1:] if len(r) != len(header)]
    assert not bad, (
        f"{len(bad)} row(s) in old/industry.csv do not have {len(header)} fields; "
        f"first: {bad[0]}"
    )
    # An ORCID sitting in the company column is the specific corruption to catch.
    orcid_re = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$")
    misplaced = [r for r in rows[1:] if orcid_re.match(r[4])]
    assert not misplaced, (
        f"{len(misplaced)} row(s) have an ORCID in the `company` column; "
        f"first: {misplaced[0]}"
    )
