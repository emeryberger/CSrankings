"""Tests for util/dblp_local.py (offline DBLP name lookups)."""

import lzma
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "util"))
from dblp_local import DblpIndex, base_name, spelling_key  # noqa: E402

SNAPSHOT = """<dblp>
<inproceedings key="a"><author orcid="0000-0003-0034-0358">Yanan Guo 0002</author><author>Emery D. Berger</author></inproceedings>
<inproceedings key="b"><author orcid="0000-0003-0034-0358">Yanan Guo 0002</author><author>Yanan Guo</author></inproceedings>
<inproceedings key="c"><author>S. M. Ferdous</author><author>XiaoFeng Wang 0001</author></inproceedings>
<inproceedings key="d"><author>Dmitriy Drusvyatskiy</author><author>Alexander Cloninger</author></inproceedings>
<inproceedings key="e"><author>J&#252;rgen M&#252;ller</author><author>Xiaofeng Wang 0001</author></inproceedings>
</dblp>
"""


@pytest.fixture(scope="module")
def index(tmp_path_factory):
    d = tmp_path_factory.mktemp("dblp")
    snap = d / "dblp.xml.xz"
    with lzma.open(snap, "wb") as f:
        f.write(SNAPSHOT.encode("utf-8"))
    aliases = d / "dblp-aliases.csv"
    aliases.write_text("alias,name\nAlex Cloninger,Alexander Cloninger\n", encoding="utf-8")
    return DblpIndex(str(snap), str(aliases))


def test_helpers():
    assert base_name("Kun Zhang 0001") == "Kun Zhang"
    assert base_name("Kun Zhang") == "Kun Zhang"
    assert spelling_key("S M Ferdous") == spelling_key("S. M. Ferdous")


def test_exact_match_counts_papers(index):
    hit = index.lookup("Yanan Guo 0002", "0000-0003-0034-0358")
    assert hit.found and hit.papers == 2
    assert hit.orcid_elsewhere == []


def test_orcid_points_to_suffixed_name(index):
    hit = index.lookup("Yanan Guo", "0000-0003-0034-0358")
    assert hit.papers == 1
    assert hit.orcid_elsewhere == [("Yanan Guo 0002", 2)]
    assert ("Yanan Guo 0002", 2) in hit.variants


def test_placeholder_orcid_ignored(index):
    assert index.lookup("Yanan Guo", "0000-0000-0000-0000").orcid_names == []


def test_alias(index):
    hit = index.lookup("Alex Cloninger")
    assert hit.alias_of == "Alexander Cloninger"


def test_punctuation_variant(index):
    hit = index.lookup("S M Ferdous")
    assert not hit.found
    assert hit.similar == [("S. M. Ferdous", 1)]


def test_case_is_significant(index):
    hit = index.lookup("Xiaofeng Wang 0001")
    assert hit.papers == 1
    assert hit.similar == [("XiaoFeng Wang 0001", 1)]


def test_misspelling_suggests_close_name(index):
    hit = index.lookup("Dmitiy Drusvyatskiy")
    assert not hit.found
    assert hit.close == [("Dmitriy Drusvyatskiy", 1)]


def test_entities_decoded(index):
    assert index.lookup("Jürgen Müller").found


def test_unknown_name(index):
    hit = index.lookup("Qianfang Liao")
    assert not hit.found
    assert not (hit.variants or hit.similar or hit.close or hit.alias_of)
