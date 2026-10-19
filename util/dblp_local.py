"""
Offline DBLP name lookups against the repository's own DBLP snapshot.

dblp.org and its mirrors now sit behind an Anubis proof-of-work bot check that
answers every API request with an HTTP 202 challenge page, so the live author
search can no longer be used from CI. The repository already carries a
filtered DBLP snapshot (dblp.xml.xz, refreshed monthly) containing every paper
in a CSRankings-tracked venue, so names can be checked locally instead.

The snapshot only covers tracked venues: a correct name with no tracked papers
yet (common for new faculty) is absent from it. Absence is therefore weaker
evidence than the live search was, and callers should treat it as a warning
unless the snapshot points at a better name (an alias target, or the name that
carries the submitted ORCID).
"""

import csv
import difflib
import html
import lzma
import os
import re
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SNAPSHOT = os.path.join(REPO_ROOT, "dblp.xml.xz")
DEFAULT_ALIASES = os.path.join(REPO_ROOT, "dblp-aliases.csv")

PLACEHOLDER_ORCID = "0000-0000-0000-0000"

_AUTHOR_RE = re.compile(rb'<author(?: orcid="([^"]+)")?[^>]*>([^<]+)</author>')
_SUFFIX_RE = re.compile(r" \d{4}$")


def _normalize(name: str) -> str:
    return unicodedata.normalize("NFC", name.strip())


def base_name(name: str) -> str:
    """Name without its DBLP disambiguation suffix ("Kun Zhang 0001" -> "Kun Zhang")."""
    return _SUFFIX_RE.sub("", name)


def spelling_key(name: str) -> str:
    """Key that ignores case, periods and spacing ("S M Ferdous" ~ "S. M. Ferdous")."""
    return " ".join(name.replace(".", " ").split()).casefold()


def has_suffix(name: str) -> bool:
    return bool(_SUFFIX_RE.search(name))


@dataclass
class DblpLookup:
    name: str
    papers: int                     # tracked-venue papers under exactly this name
    alias_of: Optional[str] = None  # canonical DBLP name, if `name` is an alias
    # Other names sharing the same base name, as (name, papers), most papers first.
    variants: List[Tuple[str, int]] = field(default_factory=list)
    # Names that differ only in case, periods or spacing, as (name, papers).
    similar: List[Tuple[str, int]] = field(default_factory=list)
    # Likely misspellings: close names sharing a first or last name, as (name, papers).
    close: List[Tuple[str, int]] = field(default_factory=list)
    # Names the submitted ORCID is attached to in DBLP, as (name, papers).
    orcid_names: List[Tuple[str, int]] = field(default_factory=list)

    @property
    def found(self) -> bool:
        return self.papers > 0

    @property
    def orcid_elsewhere(self) -> List[Tuple[str, int]]:
        """Names other than `name` carrying the submitted ORCID, if `name` itself does not."""
        if any(n == self.name for n, _ in self.orcid_names):
            return []
        return self.orcid_names


class DblpIndex:
    def __init__(self, snapshot: str = DEFAULT_SNAPSHOT, aliases: str = DEFAULT_ALIASES):
        self.papers: Dict[str, int] = defaultdict(int)
        self.orcids_by_name: Dict[str, Set[str]] = defaultdict(set)
        self.names_by_orcid: Dict[str, Set[str]] = defaultdict(set)
        self.names_by_base: Dict[str, Set[str]] = defaultdict(set)
        self.names_by_key: Dict[str, Set[str]] = defaultdict(set)
        self.names_by_token: Dict[str, Set[str]] = defaultdict(set)
        self.aliases: Dict[str, str] = {}

        with lzma.open(snapshot) as f:
            data = f.read()
        for m in _AUTHOR_RE.finditer(data):
            raw = m.group(2).decode("utf-8")
            name = _normalize(html.unescape(raw) if "&" in raw else raw)
            self.papers[name] += 1
            if m.group(1):
                orcid = m.group(1).decode("ascii")
                self.orcids_by_name[name].add(orcid)
                self.names_by_orcid[orcid].add(name)
        for name in self.papers:
            self.names_by_base[base_name(name)].add(name)
            self.names_by_key[spelling_key(name)].add(name)
            tokens = base_name(name).split()
            if tokens:
                self.names_by_token[tokens[0]].add(name)
                self.names_by_token[tokens[-1]].add(name)

        if os.path.exists(aliases):
            with open(aliases, encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    self.aliases[_normalize(row["alias"])] = _normalize(row["name"])

    def lookup(self, name: str, orcid: Optional[str] = None) -> DblpLookup:
        name = _normalize(name)
        variants = sorted(
            ((n, self.papers[n]) for n in self.names_by_base.get(base_name(name), ()) if n != name),
            key=lambda x: -x[1],
        )
        similar = sorted(
            ((n, self.papers[n]) for n in self.names_by_key.get(spelling_key(name), ()) if n != name),
            key=lambda x: -x[1],
        )
        close: List[Tuple[str, int]] = []
        tokens = base_name(name).split()
        if tokens and name not in self.papers:
            pool = self.names_by_token.get(tokens[0], set()) | self.names_by_token.get(tokens[-1], set())
            pool -= {n for n, _ in variants} | {n for n, _ in similar}
            close = [(n, self.papers[n]) for n in difflib.get_close_matches(name, pool, n=3, cutoff=0.88)]
        orcid_names: List[Tuple[str, int]] = []
        if orcid and orcid != PLACEHOLDER_ORCID:
            orcid_names = sorted(
                ((n, self.papers[n]) for n in self.names_by_orcid.get(orcid.strip(), ())),
                key=lambda x: -x[1],
            )
        return DblpLookup(
            name=name,
            papers=self.papers.get(name, 0),
            alias_of=self.aliases.get(name),
            variants=variants,
            similar=similar,
            close=close,
            orcid_names=orcid_names,
        )


_INDEX: Optional[DblpIndex] = None


def get_index() -> Optional[DblpIndex]:
    """Shared index, built on first use (a few seconds). None if the snapshot is missing."""
    global _INDEX
    if _INDEX is None and os.path.exists(DEFAULT_SNAPSHOT):
        _INDEX = DblpIndex()
    return _INDEX


def format_names(names: List[Tuple[str, int]], limit: int = 3) -> str:
    shown = ", ".join(f"`{n}` ({p} papers)" for n, p in names[:limit])
    if len(names) > limit:
        shown += f", and {len(names) - limit} more"
    return shown


if __name__ == "__main__":
    import sys
    idx = DblpIndex()
    for arg in sys.argv[1:]:
        name, _, orcid = arg.partition(",")
        print(idx.lookup(name, orcid or None))
