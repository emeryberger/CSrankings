"""Tests for venue-coverage safeguards: joint IJCAI-ECAI, venue drift, IJCAI tracks.

IJCAI 2026 went uncounted because DBLP labels the joint IJCAI-ECAI papers
"IJCAI/ECAI"; these tests pin the fix and the checks that should catch the next
such rename.
"""

import collections
import csv
import importlib.util
import lzma
import os
import subprocess
import sys

import pytest

UTIL = os.path.join(os.path.dirname(__file__), "..", "util")
sys.path.insert(0, UTIL)


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, os.path.join(UTIL, filename))
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


filter_dblp = _load("filter_dblp", "filter-dblp.py")
ijcai_tracks = _load("ijcai_tracks", "ijcai_tracks.py")

try:
    from csrankings import countPaper  # noqa: E402
except ImportError:  # pragma: no cover - csrankings needs its data files
    countPaper = None


# --- Joint IJCAI-ECAI is counted as IJCAI, ECAI's own proceedings are not ---

def test_joint_venue_names_are_kept_by_the_filter():
    assert "IJCAI/ECAI" in filter_dblp.BOOKTITLES
    assert "ECAI" not in filter_dblp.BOOKTITLES
    assert "CAV (4)" in filter_dblp.BOOKTITLES


@pytest.mark.skipif(countPaper is None, reason="csrankings not importable")
@pytest.mark.parametrize("key,url,counted", [
    ("conf/ijcai/XiangXJCZ26", "db/conf/ijcai/ijcai2026.html#XiangXJCZ26", True),
    ("conf/ecai/Smith26", "db/conf/ecai/ecai2026.html#Smith26", False),
    ("", "", False),
])
def test_ijcai_ecai_counts_only_the_ijcai_stream(key, url, counted):
    args = dict(year=2026, volume="0", number="0", pages="6573-6581", startPage=6573,
                pageCount=9, url=url, title="A Research Paper.", key=key)
    assert countPaper("IJCAI/ECAI", **args) is counted


# --- Venue drift detector ---

def _years(**counts):
    return collections.Counter({int(y[1:]): n for y, n in counts.items()})


def test_drift_flags_a_new_name_in_a_tracked_stream():
    dropped = {
        ("conf/ijcai", "IJCAI/ECAI"): _years(y2026=972),
        # Recurring workshop name: seen before min_year, so not news.
        ("conf/ijcai", "IJCAI Workshop"): _years(y2019=30, y2026=40),
        # New name, but the stream is not one we track.
        ("conf/ecai", "ECAI 2026"): _years(y2026=500),
        # New name below the size threshold.
        ("conf/ijcai", "IJCAI Tiny"): _years(y2026=3),
        # Reviewed and deliberately ignored.
        ("conf/iccv", "ICCVW"): _years(y2025=794),
        # arXiv is never counted.
        ("journals/corr", "AiML"): _years(y2026=42),
    }
    rows = filter_dblp.venue_drift_report({"conf/ijcai", "conf/iccv", "journals/corr"}, dropped, 2025, 20)
    assert rows == [("conf/ijcai", "IJCAI/ECAI", 2026, 972)]


def test_stream_of():
    assert filter_dblp.stream_of("conf/ijcai/XiangXJCZ26") == "conf/ijcai"
    assert filter_dblp.stream_of("journals/pacmpl/Foo26") == "journals/pacmpl"
    assert filter_dblp.stream_of("homepages/x") is None


def test_filter_end_to_end_reports_the_ijcai_ecai_rename(tmp_path):
    """Run the real filter on a tiny dump with IJCAI/ECAI removed from the list."""
    records = ['<inproceedings key="conf/ijcai/A%d"><booktitle>IJCAI</booktitle><year>2019</year></inproceedings>' % i
               for i in range(3)]
    records += ['<inproceedings key="conf/ijcai/B%d"><booktitle>IJCAI/ECAI</booktitle><year>2026</year></inproceedings>' % i
                for i in range(25)]
    dump = "<?xml version=\"1.0\"?><dblp>" + "".join(records) + "</dblp>"
    script = tmp_path / "filter.py"
    source = open(os.path.join(UTIL, "filter-dblp.py"), encoding="utf-8").read()
    script.write_text(source.replace('"IJCAI/ECAI",', ""), encoding="utf-8")
    report = tmp_path / "drift.md"
    result = subprocess.run(
        [sys.executable, str(script), "--drift-report", str(report), "--drift-min-year", "2025"],
        input=dump.encode(), capture_output=True, cwd=tmp_path, check=True)
    assert result.stdout.decode().count("<inproceedings") == 3
    assert "| `conf/ijcai` | `IJCAI/ECAI` | 2026 | 25 |" in report.read_text()


# --- IJCAI non-research tracks from the ijcai.org table of contents ---

TOC = """
<div class="section_title"><h3>Main Track</h3></div>
<a class="title" href="/proceedings/2026/1">A Main Paper</a>
<div class="section_title"><h3>Survey Track</h3></div>
<a class="title" href="/proceedings/2026/858">A Survey of Things</a>
<a class="title" href="/proceedings/2026/859">Not In DBLP Yet</a>
<a class="title" href="/proceedings/2026/860">Renamed &amp; Retitled</a>
<div class="section_title"><h3>Early Career Spotlight</h3></div>
<a class="title" href="/proceedings/2026/903">My Research Agenda</a>
<div class="section_title"><h3>Brand New Track @someone</h3></div>
<a class="title" href="/proceedings/2026/990">Mystery</a>
"""

DBLP = """<dblp>
<inproceedings key="conf/ijcai/Main26"><title>A Main Paper.</title><ee>https://doi.org/10.24963/ijcai.2026/1</ee><crossref>conf/ijcai/2026</crossref></inproceedings>
<inproceedings key="conf/ijcai/Survey26"><title>A Survey of Things.</title><ee>https://doi.org/10.24963/ijcai.2026/858</ee><crossref>conf/ijcai/2026</crossref></inproceedings>
<inproceedings key="conf/ijcai/Other26"><title>Something Else Entirely.</title><ee>https://doi.org/10.24963/ijcai.2026/860</ee><crossref>conf/ijcai/2026</crossref></inproceedings>
<inproceedings key="conf/ijcai/Career26"><title>My Research Agenda.</title><ee>https://doi.org/10.24963/ijcai.2026/903</ee><crossref>conf/ijcai/2026</crossref></inproceedings>
<inproceedings key="conf/ijcai/Mystery26"><title>Mystery.</title><ee>https://doi.org/10.24963/ijcai.2026/990</ee><crossref>conf/ijcai/2026</crossref></inproceedings>
<inproceedings key="conf/ijcai/Last25"><title>A Survey of Things.</title><ee>https://doi.org/10.24963/ijcai.2025/858</ee><crossref>conf/ijcai/2025</crossref></inproceedings>
</dblp>"""


@pytest.fixture
def dblp_path(tmp_path):
    path = tmp_path / "dblp.xml.xz"
    with lzma.open(path, "wb") as f:
        f.write(DBLP.encode())
    return str(path)


def test_ijcai_tracks_plan(dblp_path):
    toc = ijcai_tracks.parse_toc(TOC, 2026)
    assert toc[860] == ("Survey Track", "Renamed & Retitled")
    rows, problems = ijcai_tracks.plan(toc, ijcai_tracks.dblp_records(dblp_path, 2026), 2026)
    src = "https://www.ijcai.org/proceedings/2026/"
    assert rows == [["conf/ijcai/Survey26", "IJCAI Survey Track", src],
                    ["conf/ijcai/Career26", "IJCAI Early Career", src]]
    assert any("paper 860" in p and "does not match" in p for p in problems)
    unknown = [p for p in problems if "unknown table-of-contents section" in p]
    assert len(unknown) == 1 and "@" not in unknown[0]  # untrusted text cannot @mention


def test_ijcai_tracks_update_is_idempotent_and_sorted(tmp_path, dblp_path):
    path = tmp_path / "non-research-papers.csv"
    path.write_bytes(b"key,track,source\r\nconf/aaai/X,AAAI Student Abstract,https://aaai.org\r\n"
                     b"conf/kdd/Y,KDD Applied Data Science,https://kdd.org\r\n")
    toc = tmp_path / "toc.html"
    toc.write_text(TOC, encoding="utf-8")
    cmd = [sys.executable, os.path.join(UTIL, "ijcai_tracks.py"), "--year", "2026",
           "--toc-file", str(toc), "--dblp", dblp_path, "--csv", str(path)]
    subprocess.run(cmd, check=True, capture_output=True)
    first = path.read_bytes()
    subprocess.run(cmd, check=True, capture_output=True)
    assert path.read_bytes() == first
    assert b"\r\n" in first and b"\n" not in first.replace(b"\r\n", b"")
    keys = [r["key"] for r in csv.DictReader(open(path, newline="", encoding="utf-8"))]
    assert keys == sorted(keys)
    assert "conf/ijcai/Survey26" in keys and "conf/ijcai/Main26" not in keys


def test_every_excluded_ijcai_track_has_a_known_label():
    labels = {row["track"] for row in csv.DictReader(open(
        os.path.join(UTIL, "..", "non-research-papers.csv"), newline="", encoding="utf-8"))}
    assert set(ijcai_tracks.EXCLUDED_TRACKS.values()) <= labels
