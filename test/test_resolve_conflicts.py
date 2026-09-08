#!/usr/bin/env python3
"""
Tests for the conflict-replay helpers in util/validate_prs.py.

`resolve_conflicts` replays a PR's net CSV changes onto current gh-pages when
the branch has gone stale. Three defects made that replay untrustworthy:

  1. It read every row into a set and rewrote the file with `sorted()` and
     "\n" endings. The faculty CSVs are CRLF and are ordered by the normalized
     key, so a one-row change came back as a whole-file rewrite in the wrong
     order -- PR #14135 landed as a 2,271-line diff on csrankings-l.csv, none
     of it the contributor's change.
  2. It force-pushed to `origin` regardless of where the PR head lived. For a
     fork PR that created a same-named branch in the *base* repo and reported
     success while the PR head never moved.
  3. A removal whose line no longer matched gh-pages byte-for-byte was dropped
     in silence, so a partly-applied PR reported as fully resolved.

Run with: pytest test/test_resolve_conflicts.py -v
"""

import os
import shutil
import subprocess
import sys

import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, "util"))

import validate_prs as V  # noqa: E402

HEADER = "name,affiliation,homepage,scholarid,orcid"
PLACEHOLDER = "0000-0000-0000-0000"


def write(path, rows, nl="\r\n"):
    with open(path, "w", newline="", encoding="utf-8") as f:
        f.write(HEADER + nl)
        for r in rows:
            f.write(r + nl)


def read_bytes(path):
    with open(path, "rb") as f:
        return f.read()


def row(name):
    return f"{name},Test Univ.,http://example.org/{name.replace(' ', '')}/,,{PLACEHOLDER}"


@pytest.fixture
def csv_file(tmp_path):
    p = tmp_path / "csrankings-t.csv"
    write(p, [row(n) for n in ["Alice A", "Bob B", "Carol C", "Dave D"]])
    return p


def test_crlf_is_preserved(csv_file):
    """The faculty CSVs are CRLF; a replay must not convert them to LF."""
    V._apply_csv_changes(csv_file, {row("Eve E")}, set())
    raw = read_bytes(csv_file)
    assert b"\r\n" in raw
    assert raw.replace(b"\r\n", b"").count(b"\n") == 0, "file gained bare LF endings"


def test_only_changed_rows_appear_in_the_diff(csv_file):
    """A one-row change must not rewrite untouched rows.

    This is the #14135 regression: the whole file came back reformatted.
    """
    before = read_bytes(csv_file).decode().split("\r\n")
    V._apply_csv_changes(csv_file, {row("Eve E")}, {row("Bob B")})
    after = read_bytes(csv_file).decode().split("\r\n")

    unchanged_before = [r for r in before if r and "Bob B" not in r]
    unchanged_after = [r for r in after if r and "Eve E" not in r]
    assert unchanged_before == unchanged_after


def test_addition_lands_at_the_position_ci_expects(tmp_path):
    """Insertion uses the normalized key, matching validate_commit.py.

    A raw byte sort puts an accented or capitalized name where CI then
    rejects it, and the failure is reported against the contributor's PR.
    """
    p = tmp_path / "csrankings-z.csv"
    write(p, [row(n) for n in ["Zach Aa", "Zoe Cc"]])
    V._apply_csv_changes(p, {row("Zoë Bb")}, set())
    names = [r.split(",")[0] for r in read_bytes(p).decode().split("\r\n") if r][1:]
    assert names == ["Zach Aa", "Zoë Bb", "Zoe Cc"]
    keys = [V.normalize_name_for_sorting(n) for n in names]
    assert keys == sorted(keys)


def test_unmatched_removal_is_reported_not_swallowed(csv_file):
    """A removal that no longer matches gh-pages must surface.

    Silently ignoring it means the PR is reported resolved while part of its
    change never landed.
    """
    stale_line = row("Bob B").replace("Test Univ.", "Old Univ.")
    _, unmatched = V._apply_csv_changes(csv_file, set(), {stale_line})
    assert unmatched == [stale_line]
    assert "Bob B" in read_bytes(csv_file).decode(), "row should be left alone"


def test_matched_removal_reports_nothing_unmatched(csv_file):
    changed, unmatched = V._apply_csv_changes(csv_file, set(), {row("Bob B")})
    assert changed and unmatched == []
    assert "Bob B" not in read_bytes(csv_file).decode()


def test_replay_is_idempotent(csv_file):
    """Re-applying an already-applied change is a no-op, not a duplicate row."""
    V._apply_csv_changes(csv_file, {row("Eve E")}, set())
    first = read_bytes(csv_file)
    changed, _ = V._apply_csv_changes(csv_file, {row("Eve E")}, set())
    assert changed is False
    assert read_bytes(csv_file) == first


def test_lf_file_stays_lf(tmp_path):
    """old/other.csv is LF; preserve whatever the file already uses."""
    p = tmp_path / "other.csv"
    write(p, [row("Alice A"), row("Carol C")], nl="\n")
    V._apply_csv_changes(p, {row("Bob B")}, set())
    assert b"\r\n" not in read_bytes(p)


def test_push_target_follows_the_pr_head(monkeypatch):
    """A fork PR must be pushed to the fork, not to origin.

    Pushing to origin created a stray branch in the base repo and reported
    success while the PR head was untouched.
    """
    src = open(os.path.join(REPO_ROOT, "util", "validate_prs.py"), encoding="utf-8").read()
    assert 'run_git(["push", push_remote,' in src, (
        "resolve_conflicts must push to the resolved `push_remote`, not a literal"
    )
    assert '"push", "origin", f"_resolve-' not in src, (
        "resolve_conflicts still hardcodes origin as the push target"
    )


def test_refuses_when_maintainer_edits_are_off(monkeypatch, tmp_path):
    """Without maintainer push rights, say so rather than reporting success."""
    monkeypatch.setattr(V, "get_pr_head", lambda n: {
        "branch": "feature", "repo": "someone/CSrankings",
        "maintainer_can_modify": False})
    monkeypatch.setattr(V, "get_pr_files", lambda n: ["csrankings-a.csv"])
    monkeypatch.setattr(V, "get_diff_net_changes",
                        lambda n: {"csrankings-a.csv": ({row("Eve E")}, set())})

    ok, msg = V.resolve_conflicts(999999)
    assert ok is False
    assert "Allow edits by maintainers" in msg
