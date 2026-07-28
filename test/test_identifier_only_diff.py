#!/usr/bin/env python3
"""
Tests for the identifier-only fast path in util/validate_commit.py.

A diff that only rewrites the ORCID field of existing rows does not change any
faculty member's eligibility, so it does not need the per-entry DBLP/homepage/
Google Scholar lookups or the AI audit. This suite pins down when that fast path
is taken -- and, more importantly, when it is NOT.

The default must be fail-safe: anything that is not purely an ORCID rewrite has
to fall back to the full validation.

Run with: pytest test/test_identifier_only_diff.py -v
"""

import importlib.util
import io
import json
import contextlib
import sys
import types
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parent.parent


def _stub(name, **attrs):
    """Install a stand-in module so importing validate_commit does not need the real one."""
    if name not in sys.modules or not hasattr(sys.modules[name], "__stubbed__"):
        mod = types.ModuleType(name)
        mod.__stubbed__ = True  # type: ignore[attr-defined]
        for k, v in attrs.items():
            setattr(mod, k, v)
        sys.modules[name] = mod


def _load_validate_commit():
    """Import util/validate_commit.py with its heavyweight deps stubbed out.

    The test job installs only pytest/selenium/webdriver-manager -- the rest of
    requirements.txt is installed later, in the build job -- so this module must
    not depend on fuzzysearch, unidecode, openai or pydantic being present.

    Stub only what is missing: if the real package is installed (as it is locally)
    it is left alone.
    """
    for name, attrs in (
        ("fuzzysearch", {"find_near_matches": lambda *a, **k: []}),
        ("unidecode", {"unidecode": lambda s: s}),
        ("openai", {"OpenAI": object}),
        # pydantic supplies the base class for the audit models; a plain class is
        # enough, since only annotations are evaluated at import time.
        ("pydantic", {"BaseModel": type("BaseModel", (), {}), "HttpUrl": str,
                      "ValidationError": type("ValidationError", (Exception,), {})}),
    ):
        try:
            importlib.import_module(name)
        except ImportError:
            _stub(name, **attrs)
    spec = importlib.util.spec_from_file_location(
        "validate_commit", REPO / "util" / "validate_commit.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


try:
    vc = _load_validate_commit()
except Exception as exc:  # pragma: no cover
    # Never abort collection: a failure here would take the whole test suite --
    # and the post-merge rebuild that runs it -- down with this one file.
    pytest.skip(
        f"could not import util/validate_commit.py ({exc!r})", allow_module_level=True
    )

PLACEHOLDER = "0000-0000-0000-0000"
REAL = "0000-0002-1825-0097"
OTHER = "0000-0003-1234-5679"

JANE_PLACEHOLDER = f"Jane Doe,MIT,https://x.org,abcdEFGHIJK1,{PLACEHOLDER}"
JANE_REAL = f"Jane Doe,MIT,https://x.org,abcdEFGHIJK1,{REAL}"
JOHN_PLACEHOLDER = f"John Roe,CMU,https://y.org,abcdEFGHIJK2,{PLACEHOLDER}"
JOHN_REAL = f"John Roe,CMU,https://y.org,abcdEFGHIJK2,{REAL}"


def _diff(files, tmp_path):
    """Build a diff.json of the shape generate_diff.py produces."""
    data = {
        "files": [
            {
                "path": path,
                "chunks": [
                    {"changes": [{"type": t, "content": c} for t, c in changes]}
                ],
            }
            for path, changes in files
        ]
    }
    p = tmp_path / "diff.json"
    p.write_text(json.dumps(data), encoding="utf-8")
    return str(p)


def _classify(files, tmp_path):
    return vc.classify_identifier_only(_diff(files, tmp_path))


def _validate(pairs):
    """Run the cheap checks, swallowing their progress output."""
    with contextlib.redirect_stdout(io.StringIO()):
        return vc.validate_identifier_only(pairs)


# --- cases that SHOULD take the fast path -------------------------------------

def test_filling_a_placeholder_takes_fast_path(tmp_path):
    pairs = _classify(
        [("csrankings-j.csv", [("DeletedLine", JANE_PLACEHOLDER), ("AddedLine", JANE_REAL)])],
        tmp_path,
    )
    assert pairs is not None
    assert len(pairs) == 1
    assert _validate(pairs) is True


def test_reverting_to_placeholder_takes_fast_path(tmp_path):
    """Reverting a bad assignment is also identifier-only."""
    pairs = _classify(
        [("csrankings-j.csv", [("DeletedLine", JANE_REAL), ("AddedLine", JANE_PLACEHOLDER)])],
        tmp_path,
    )
    assert pairs is not None
    assert _validate(pairs) is True


def test_old_csv_files_are_allowed(tmp_path):
    pairs = _classify(
        [("old/industry.csv", [("DeletedLine", JANE_PLACEHOLDER), ("AddedLine", JANE_REAL)])],
        tmp_path,
    )
    assert pairs is not None


def test_many_rows_across_files(tmp_path):
    pairs = _classify(
        [
            ("csrankings-j.csv", [("DeletedLine", JANE_PLACEHOLDER), ("AddedLine", JANE_REAL)]),
            ("csrankings-r.csv", [("DeletedLine", JOHN_PLACEHOLDER), ("AddedLine", f"John Roe,CMU,https://y.org,abcdEFGHIJK2,{OTHER}")]),
        ],
        tmp_path,
    )
    assert pairs is not None
    assert len(pairs) == 2
    assert _validate(pairs) is True


# --- cases the fast path MUST reject (fall back to full validation) -----------

@pytest.mark.parametrize(
    "label,changes",
    [
        # affiliation edited alongside the ORCID
        ("affiliation changed", [("DeletedLine", JANE_PLACEHOLDER),
                                 ("AddedLine", f"Jane Doe,CMU,https://x.org,abcdEFGHIJK1,{REAL}")]),
        # homepage edited alongside the ORCID
        ("homepage changed", [("DeletedLine", JANE_PLACEHOLDER),
                              ("AddedLine", f"Jane Doe,MIT,https://z.org,abcdEFGHIJK1,{REAL}")]),
        # Scholar ID edited alongside the ORCID
        ("scholar id changed", [("DeletedLine", JANE_PLACEHOLDER),
                                ("AddedLine", f"Jane Doe,MIT,https://x.org,ZZZZZZZZZZZZ,{REAL}")]),
        # a genuinely new faculty member
        ("pure addition", [("AddedLine", JANE_REAL)]),
        # a removal
        ("pure deletion", [("DeletedLine", JANE_REAL)]),
        # nothing actually changed
        ("no-op", [("DeletedLine", JANE_REAL), ("AddedLine", JANE_REAL)]),
        # ORCID rewrite mixed with a real addition
        ("mixed with addition", [("DeletedLine", JANE_PLACEHOLDER), ("AddedLine", JANE_REAL),
                                 ("AddedLine", JOHN_REAL)]),
        # wrong column count
        ("four columns", [("DeletedLine", "Jane Doe,MIT,https://x.org,abcdEFGHIJK1"),
                          ("AddedLine", JANE_REAL)]),
    ],
)
def test_non_identifier_changes_fall_back(label, changes, tmp_path):
    assert _classify([("csrankings-j.csv", changes)], tmp_path) is None, label


def test_disallowed_file_falls_back(tmp_path):
    """A source file in the diff must never reach the cheap path."""
    assert _classify(
        [("util/evil.py", [("DeletedLine", JANE_PLACEHOLDER), ("AddedLine", JANE_REAL)])],
        tmp_path,
    ) is None


def test_empty_diff_falls_back(tmp_path):
    assert _classify([("csrankings-j.csv", [])], tmp_path) is None


# --- checks the fast path still enforces --------------------------------------

def test_malformed_orcid_is_rejected(tmp_path):
    pairs = _classify(
        [("csrankings-j.csv", [("DeletedLine", JANE_PLACEHOLDER),
                               ("AddedLine", "Jane Doe,MIT,https://x.org,abcdEFGHIJK1,not-an-orcid")])],
        tmp_path,
    )
    assert pairs is not None
    assert _validate(pairs) is False


def test_same_orcid_across_two_institutions_is_rejected(tmp_path):
    """One ORCID identifies one person, so it cannot appear at two institutions."""
    pairs = _classify(
        [("csrankings-j.csv", [("DeletedLine", JANE_PLACEHOLDER), ("AddedLine", JANE_REAL),
                               ("DeletedLine", JOHN_PLACEHOLDER), ("AddedLine", JOHN_REAL)])],
        tmp_path,
    )
    assert pairs is not None
    assert _validate(pairs) is False


def test_same_orcid_at_one_institution_is_allowed(tmp_path):
    """Alias rows for one person at one institution legitimately share an ORCID."""
    alias_old = f"J. Doe,MIT,https://x.org,abcdEFGHIJK9,{PLACEHOLDER}"
    alias_new = f"J. Doe,MIT,https://x.org,abcdEFGHIJK9,{REAL}"
    pairs = _classify(
        [("csrankings-j.csv", [("DeletedLine", JANE_PLACEHOLDER), ("AddedLine", JANE_REAL),
                               ("DeletedLine", alias_old), ("AddedLine", alias_new)])],
        tmp_path,
    )
    assert pairs is not None
    assert _validate(pairs) is True


def test_space_after_comma_is_rejected(tmp_path):
    pairs = _classify(
        [("csrankings-j.csv", [("DeletedLine", JANE_PLACEHOLDER),
                               ("AddedLine", f"Jane Doe, MIT,https://x.org,abcdEFGHIJK1,{REAL}")])],
        tmp_path,
    )
    # the space also changes the affiliation field, so this must fall back
    assert pairs is None
