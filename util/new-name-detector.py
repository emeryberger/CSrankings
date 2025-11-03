#!/usr/bin/env python3
import argparse
import csv
import gzip
import re
import sys
from typing import Dict, Optional, Tuple

from lxml import etree as ET

# --- DTD entity support -------------------------------------------------------

# <!ENTITY eacute "&#233;">   or   <!ENTITY Eacute "&#x00C9;">
_DTD_ENTITY_RE = re.compile(r'<!ENTITY\s+([A-Za-z][A-Za-z0-9]+)\s+"&#(x?[0-9A-Fa-f]+);"')
# &Name; occurrences in text
_ENTITY_USE_RE = re.compile(r"&([A-Za-z][A-Za-z0-9]+);")


def load_dtd_entities(path: str) -> Dict[str, str]:
    """Return {entity_name -> unicode_char} from dblp.dtd (supports dec and hex)."""
    ent: Dict[str, str] = {}
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            m = _DTD_ENTITY_RE.search(line)
            if not m:
                continue
            name, code = m.group(1), m.group(2)
            try:
                cp = int(code[1:], 16) if code.lower().startswith("x") else int(code, 10)
                ent[name] = chr(cp)
            except Exception:
                continue
    # XML core entities (defensive; lxml usually handles these)
    ent.setdefault("amp", "&")
    ent.setdefault("lt", "<")
    ent.setdefault("gt", ">")
    ent.setdefault("quot", '"')
    ent.setdefault("apos", "'")
    return ent


def _unescape_with_dtd(s: str, entmap: Dict[str, str]) -> str:
    """Replace &Name; using entmap; leave unknown entities unchanged."""
    if not s or "&" not in s:
        return s
    return _ENTITY_USE_RE.sub(lambda m: entmap.get(m.group(1), m.group(0)), s)


def _normalize_ws(s: str) -> str:
    """Collapse internal whitespace and trim edges."""
    return " ".join(s.split())


# --- CSV helpers --------------------------------------------------------------

def load_faculty_affiliations(path: str) -> Dict[str, str]:
    """name -> affiliation"""
    m: Dict[str, str] = {}
    with open(path, newline="", encoding="utf-8") as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            name = (row.get("name") or "").strip()
            aff = (row.get("affiliation") or "").strip()
            if name:
                m[name] = aff
    return m


# --- Streaming parse of DBLP homepages (canonical name only) ------------------

def _free_node_memory(node: ET._Element) -> None:
    """Clear node and drop left siblings to keep memory use flat while streaming."""
    # Drop already-parsed siblings
    while node.getprevious() is not None:
        try:
            del node.getparent()[0]
        except Exception:
            break
    node.clear()


def parse_canonical_names(
    gz_path: str,
    entmap: Dict[str, str],
) -> Dict[str, str]:
    """
    Parse dblp-original.xml.gz and return {uid -> canonical_name}, where canonical_name
    is the FIRST <author> (full mixed content) under <www key="homepages/...">.
    """
    result: Dict[str, str] = {}
    with gzip.open(gz_path, "rb") as f:
        context = ET.iterparse(
            f,
            events=("end",),
            tag="www",
            load_dtd=False,          # offline
            no_network=True,
            recover=True,            # tolerant of minor issues
            huge_tree=True,
            encoding="utf-8",
            resolve_entities=False,  # expand entities ourselves via entmap
        )
        for _, node in context:
            try:
                key = node.get("key") or ""
                if not key.startswith("homepages/"):
                    continue
                uid = key[len("homepages/"):]  # strip "homepages/"

                # If we've already recorded a canonical for this uid, skip (keep first seen).
                if uid in result:
                    continue

                # Find the FIRST author only.
                a = node.find("author")
                if a is None:
                    continue

                # Capture FULL mixed content (handles <sup>0001</sup>, etc.)
                raw_full = "".join(a.itertext()).strip()
                if not raw_full:
                    continue

                name = _normalize_ws(_unescape_with_dtd(raw_full, entmap))
                if name:
                    result[uid] = name
            finally:
                _free_node_memory(node)
    return result


# --- Diff logic ---------------------------------------------------------------

def diff_canonical_names(
    old_map: Dict[str, str],
    new_map: Dict[str, str],
    faculty_names: Dict[str, str],
) -> Tuple[Tuple[str, str, str], ...]:
    """
    Return tuples (uid, old_name, new_name) where:
      - uid is present in both maps
      - old_name == old_map[uid]
      - new_name == new_map[uid]
      - old_name != new_name
      - old_name is present in faculty-affiliations.csv (as a key)
    """
    rows = []
    for uid in sorted(set(old_map.keys()) & set(new_map.keys())):
        old_name = old_map[uid]
        new_name = new_map[uid]
        if old_name != new_name and old_name in faculty_names:
            rows.append((uid, old_name, new_name))
    return tuple(rows)


# --- CLI ----------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Compare canonical DBLP homepage names (first author only) between two dumps."
    )
    ap.add_argument("--old", required=True, help="Path to old dblp-original.xml.gz")
    ap.add_argument("--new", required=True, help="Path to new dblp-original.xml.gz")
    ap.add_argument("--dtd", default="dblp.dtd", help="Path to dblp.dtd (entities)")
    ap.add_argument("--faculty", default="faculty-affiliations.csv",
                    help="Path to faculty-affiliations.csv")
    args = ap.parse_args()

    entmap = load_dtd_entities(args.dtd)
    faculty = load_faculty_affiliations(args.faculty)

    old_map = parse_canonical_names(args.old, entmap)
    new_map = parse_canonical_names(args.new, entmap)

    writer = csv.writer(sys.stdout)
    writer.writerow(["uid", "old_name", "new_name"])
    for uid, old_name, new_name in diff_canonical_names(old_map, new_map, faculty):
        writer.writerow([uid, old_name, new_name])


if __name__ == "__main__":
    main()
