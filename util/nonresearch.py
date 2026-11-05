"""Recognize DBLP records that are not peer-reviewed research contributions.

DBLP lists everything a venue publishes under the venue's own name, so position
papers, invited papers, front matter, keynotes and the like are indistinguishable
from research papers by venue alone. The page-count threshold in countPaper() catches
many of them, but not all: it does not apply to records without page numbers
(recent NeurIPS, and nearly all of ICLR and NDSS), it is waived for venue-years whose
page numbers are unreliable, and some of these contributions are simply long.

The rules here rely only on what a record explicitly says about itself. They are
deliberately high precision, because a false positive silently costs an author
a real paper. In particular, a topic word alone is never enough: "Position-Based
Dynamics", "Perspective: A Sensible Approach to..." (a system called Perspective)
and "DeMo: Decoupled..." are research papers. test/test_nonresearch.py pins these
cases, so please add to it when changing a rule.

Most tracks leave no trace in a DBLP record at all, so non-research-papers.csv lists
those papers by DBLP key, built from each venue's own per-track proceedings or
accepted-paper lists (see docs/dblp.md).

Venues that need numeric rules (page or article ranges) keep them alongside the
other venue-specific tables in csrankings.py.
"""

import csv
import os
import re
from typing import Dict, Iterable, Optional, Tuple

_IGNORE_CASE = re.IGNORECASE

# Each rule is matched against the title with surrounding whitespace and any
# trailing periods removed (DBLP ends most titles with a period).
_TITLE_RULES: Tuple[Tuple[str, "re.Pattern[str]"], ...] = (
    (
        "position paper",
        re.compile(
            r"^position\s*:\s"
            r"|\b(?:position|vision|perspective) paper\b"
            r"|\((?:vision|perspective)\)$",
            _IGNORE_CASE,
        ),
    ),
    (
        "front matter",
        re.compile(
            r"^(?:front matter|editorial|preface|foreword|introduction|sponsors|awards"
            r"|conference committees|\w+ organization|\w+-\d+ preface|opening remarks)$"
            r"|^editorial\s*:\s"
            r"|^preface\s+-\s"
            r"|^session details\s*:"
            r"|^(?:welcome )?messages?(?:\s*:\s*message)?\s+from\s+the\b"
            r"|\bchairs?'? message$"
            r"|^letter from the\b",
            _IGNORE_CASE,
        ),
    ),
    (
        "invited talk",
        re.compile(
            r"\bkeynote (?:address|speech|speaker|talk|presentation|lecture)\b"
            r"|\(keynote(?: \w+)?\)"
            r"|\binvited (?:talk|lecture|speaker|address)s?\b"
            r"|\bplenary address\b"
            r"|\bcapstone (?:address|presentation)\b"
            r"|^(?:banquet|dinner) (?:talk|presentation)\b"
            r"|\b(?:career|technical achievement) award$"
            r"|\(outstanding research award\)$",
            _IGNORE_CASE,
        ),
    ),
    # Case sensitive, to spare a paper about the KeyNote trust management system.
    ("invited talk", re.compile(r"^Keynote(?:\s*[:\-–]\s|$)")),
    (
        "panel",
        re.compile(
            r"^panel\s*[:\-–]\s"
            r"|\(panel\b"
            r"|\bpanel (?:discussion|session)\b",
            _IGNORE_CASE,
        ),
    ),
    (
        "tutorial",
        re.compile(
            r"^(?:embedded )?tutorial\s*:\s"
            r"|\((?:invited |embedded |a )?tutorial(?: session)?\)"
            r"|\bextended abstract of a tutorial\b"
            r"|\b(?:invited tutorial|tutorial session|tutorial notes)\b"
            r"|\s[:\-–]?\s*a tutorial$"
            r"|^a tutorial (?:on|introduction)\b"
            r"|\bprocessing tutorial$",
            _IGNORE_CASE,
        ),
    ),
    (
        "correction",
        re.compile(
            r"^(?:erratum|errata|corrigendum|corrigenda|retraction|addendum)\s*[:\-–]\s"
            r"|^(?:erratum|errata|corrigendum|corrigenda|addendum) (?:to|for)\b"
            r"|^correction to\b",
            _IGNORE_CASE,
        ),
    ),
    (
        "poster",
        re.compile(r"^poster(?: paper| reception| session)?\s*[:\-–]\s", _IGNORE_CASE),
    ),
    (
        "contest report",
        re.compile(r"\bCAD contest\b|^report on the\b.*\bcontest\b", _IGNORE_CASE),
    ),
    # Invited and special session papers are not selected by the venue's peer
    # review. DAC requires the "Invited" label, and describes reviewing invited
    # content as "a much different process than the blind peer review of research
    # papers"; ICCAD uses the two labels interchangeably. These titles differ from
    # those of invited talks, which are in the rule above. The word must be a label:
    # "Uninvited Guests" and "...I am Invited to Communicate" are research papers.
    (
        "invited paper",
        re.compile(
            r"\binvited (?:review )?papers?\b"
            r"|^\(?invited\)?\s*[:\-\u2013]\s"
            r"|\(invited\b"
            r"|\sinvited$"
            r"|\bspecial session\b",
            _IGNORE_CASE,
        ),
    ),
)

# Tracks that are visible only in the URL of the published paper (DBLP's <ee>).
_URL_RULES: Tuple[Tuple[str, "re.Pattern[str]"], ...] = (
    # NeurIPS proceedings encode the track in the URL, as in
    # https://papers.nips.cc/paper_files/paper/2025/hash/...-Abstract-Position_Paper_Track.html
    # Only the main track counts, so this is an allowlist: the main track is
    # -Abstract-Conference (or plain -Abstract before 2022), and tracks are added and
    # renamed often. Datasets and Benchmarks (now Evaluations and Datasets) has its
    # own criteria and optional single-blind review, and does not require original
    # research results.
    ("position paper", re.compile(r"-Abstract-Position_Paper\w*\.html", _IGNORE_CASE)),
    (
        "non-main track",
        re.compile(r"(?:nips|neurips)\.cc/.*-Abstract-(?!Conference\.html)\w+\.html", _IGNORE_CASE),
    ),
    # AAAI Doctoral Consortium abstracts, listed in DBLP alongside AAAI papers.
    ("doctoral consortium", re.compile(r"aaai\.org/ocs/index\.php/DC/", _IGNORE_CASE)),
    # USENIX keynotes and panels are often titled only with a topic or a speaker
    # ("Susan Landau, Tufts University").
    (
        "invited talk",
        re.compile(r"usenix\.org/.*/presentation/(?:\w+-)?keynote(?:-|$)", _IGNORE_CASE),
    ),
    ("panel", re.compile(r"usenix\.org/.*/presentation/panel(?:-|$)", _IGNORE_CASE)),
)

# DBLP sometimes files a venue's satellite events on their own table of contents
# (the record's <url>) while keeping the main venue as the booktitle, as in
# db/conf/siggrapha/siggrapha2019courses.html and db/conf/ijcai/ijcai2019w.html.
_DBLP_TOC_RULES: Tuple[Tuple[str, "re.Pattern[str]"], ...] = (
    ("course", re.compile(r"^db/conf/[^/]+/[a-z]+\d{4}courses\.html")),
    ("workshop", re.compile(r"^db/conf/[^/]+/[a-z]+\d{4}w\.html")),
)

_TRACK_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "non-research-papers.csv"
)
_tracksByKey: Optional[Dict[str, str]] = None


def _nonResearchTrack(key: str) -> Optional[str]:
    """Return the non-research track that lists this DBLP key, if any."""
    global _tracksByKey
    if _tracksByKey is None:
        with open(_TRACK_FILE, encoding="utf-8", newline="") as f:
            _tracksByKey = {row["key"]: row["track"] for row in csv.DictReader(f)}
    return _tracksByKey.get(key)


def nonResearchCategory(
    title: str, urls: Iterable[str] = (), dblpUrl: str = "", key: str = ""
) -> Optional[str]:
    """Return why a record is not a research contribution, or None if it may be one.

    `title` is the DBLP title, `urls` holds the contents of its <ee> elements,
    `dblpUrl` is the contents of its <url> element, and `key` is its DBLP key.
    """
    track = _nonResearchTrack(key)
    if track is not None:
        return track
    normalized = title.strip().rstrip(". ")
    for category, pattern in _TITLE_RULES:
        if pattern.search(normalized):
            return category
    for url in urls:
        for category, pattern in _URL_RULES:
            if pattern.search(url):
                return category
    for category, pattern in _DBLP_TOC_RULES:
        if pattern.search(dblpUrl):
            return category
    return None
