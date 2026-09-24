#!/usr/bin/env python3
"""
Invisible look-alike characters in the faculty CSVs.

A NO-BREAK SPACE in "Jun Wen 0001" looks identical to a space, but the name
then matches no DBLP author and the person silently vanishes from the rankings
(PR #13468). These tests pin down every layer that keeps them out:

  - util/csv_text.py clean_field()   -- used by `make` to self-heal the tree
  - util/validate_commit.py          -- rejects them in contributor PRs
  - the data itself                  -- checked after `make`

Run with: pytest test/test_csv_text.py -v
"""

import csv
import glob
import json
import os
import sys

import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, "util"))

from csv_text import clean_field, find_bad_chars  # noqa: E402


@pytest.mark.parametrize("raw,expected", [
    ("Jun Wen 0001", "Jun Wen 0001"),
    ("Badri N. Vellambi", "Badri N. Vellambi"),
    ("Doo­Hwan Bae", "Doo-Hwan Bae"),
    ("Zero​Width", "ZeroWidth"),
    ("﻿BOM Name", "BOM Name"),
    ("Thin Space Narrow", "Thin Space Narrow"),
    ("Two  Spaces", "Two Spaces"),
    (" padded ", "padded"),
    ("Café", "Café"),  # decomposed accent -> NFC
    ("Jörg Müller", "Jörg Müller"),  # unchanged
])
def test_clean_field(raw, expected):
    assert clean_field(raw) == expected
    assert find_bad_chars(clean_field(raw)) == []


def test_find_bad_chars_names_the_character():
    assert find_bad_chars("Jun Wen 0001") == ["U+00A0 NO-BREAK SPACE"]
    assert find_bad_chars("Jun Wen 0001") == []


def test_validate_commit_rejects_nbsp(monkeypatch, capsys):
    from validate_commit import process_csv_diff
    monkeypatch.chdir(REPO_ROOT)
    line = ("Jun Wen 0001,MBZUAI,https://mbzuai.ac.ae/study/faculty/jun-wen,"
            "Gw2ekPsAAAAJ,0000-0001-5067-2647")
    diff = {"files": [{"path": "csrankings-j.csv", "chunks": [
        {"changes": [{"type": "AddedLine", "content": line}]}]}]}
    path = os.path.join(REPO_ROOT, "test", "_nbsp_diff.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(diff, f)
    try:
        assert process_csv_diff(path) is False
    finally:
        os.remove(path)
    assert "U+00A0 NO-BREAK SPACE" in capsys.readouterr().out


def _data_files():
    # Only files `make clean-csrankings` rewrites through clean_field(); a
    # postmake check on anything else could fail with no way for `make` to fix it.
    files = sorted(glob.glob(os.path.join(REPO_ROOT, "csrankings-[a-z].csv")))
    return files + [os.path.join(REPO_ROOT, "orcid.csv")]


@pytest.mark.postmake
def test_no_invisible_characters_in_data():
    problems = []
    for path in _data_files():
        with open(path, encoding="utf-8", newline="") as f:
            for lineno, row in enumerate(csv.reader(f), 1):
                for value in row:
                    bad = find_bad_chars(value)
                    if bad or value != clean_field(value):
                        problems.append(f"{os.path.relpath(path, REPO_ROOT)}:{lineno}: "
                                        f"{value!r} {bad}")
    assert not problems, (
        "Fields contain invisible/non-standard characters or stray whitespace "
        "(run `make clean-csrankings`):\n" + "\n".join(problems[:50]))
