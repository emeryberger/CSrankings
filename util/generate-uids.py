import csv
import gzip
import re
import sys
from typing import Dict, Iterable, Tuple, Optional

from lxml import etree as ET

# Matches lines like: <!ENTITY eacute  "&#233;" >  or  <!ENTITY Eacute "&#x00C9;" >
_DTD_ENTITY_RE = re.compile(r'<!ENTITY\s+([A-Za-z][A-Za-z0-9]+)\s+"&#(x?[0-9A-Fa-f]+);"')
# Matches &Name; occurrences in text
_ENTITY_USE_RE = re.compile(r"&([A-Za-z][A-Za-z0-9]+);")

def load_dtd_entities(path: str) -> Dict[str, str]:
    """Return {entity_name -> unicode_char} from dblp.dtd (decimal and hex)."""
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
    # Ensure XML core entities are present (usually redundant, harmless if unused)
    ent.setdefault("amp", "&")
    ent.setdefault("lt", "<")
    ent.setdefault("gt", ">")
    ent.setdefault("quot", '"')
    ent.setdefault("apos", "'")
    return ent

def _unescape_with_dtd(s: str, entmap: Dict[str, str]) -> str:
    """Replace &Name; using entmap, leave unknown entities unchanged."""
    if not s or "&" not in s:
        return s
    return _ENTITY_USE_RE.sub(lambda m: entmap.get(m.group(1), m.group(0)), s)

def _normalize_ws(s: str) -> str:
    """Collapse internal whitespace, trim edges."""
    return " ".join(s.split())

def load_faculty_affiliations(path: str) -> Dict[str, str]:
    m: Dict[str, str] = {}
    with open(path, newline="", encoding="utf-8") as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            name = (row.get("name") or "").strip()
            aff = (row.get("affiliation") or "").strip()
            if name:
                m[name] = aff
    return m

def _free_node_memory(node: ET._Element) -> None:
    """Standard lxml streaming GC pattern: clear node + drop left siblings."""
    # Remove already-parsed siblings to keep the tree from growing.
    while node.getprevious() is not None:
        try:
            del node.getparent()[0]
        except Exception:
            break
    node.clear()

def parse_dblp_homepages(
    gz_path: str,
    entmap: Dict[str, str],
    *,
    filter_names: Optional[Dict[str, str]] = None,
) -> Iterable[Tuple[str, str]]:
    """
    Yield (uid, author_name) for each <www key="homepages/..."> in dblp-original.xml.gz.
    - Uses itertext() to capture full mixed content (e.g., <sup>0001</sup>).
    - Expands named entities via dblp.dtd without network/DTD fetching.
    """
    with gzip.open(gz_path, "rb") as f:
        seen_uids = set()
        context = ET.iterparse(
            f,
            events=("end",),
            tag="www",
            load_dtd=False,         # stay offline
            no_network=True,
            recover=True,           # be tolerant of minor issues
            huge_tree=True,
            encoding="utf-8",
            resolve_entities=False, # we expand &name; ourselves
        )
        for _, node in context:
            try:
                key = node.get("key") or ""
                if not key.startswith("homepages/"):
                    continue
                uid = key[len("homepages/"):]  # strip "homepages/"

                for a in node.iterfind("author"):
                    # Capture FULL textual content, including inside <sup> etc.
                    raw_full = "".join(a.itertext())
                    raw_full = raw_full.strip()
                    if not raw_full:
                        continue

                    # Expand &Name; using entities from dblp.dtd, then normalize spaces.
                    name = _normalize_ws(_unescape_with_dtd(raw_full, entmap))

                    # Filter (optional)
                    if filter_names is not None and name not in filter_names:
                        continue

                    if uid not in seen_uids:
                        seen_uids.add(uid)
                        yield uid, name
            finally:
                _free_node_memory(node)

def main() -> None:
    entmap = load_dtd_entities("dblp.dtd")
    facultydict = load_faculty_affiliations("faculty-affiliations.csv")

    writer = csv.writer(sys.stdout)
    writer.writerow(["uid", "name"])
    # Set filter_names=facultydict to restrict to known names; None for all.
    for uid, name in parse_dblp_homepages(
        "dblp-original.xml.gz",
        entmap,
        filter_names=None,
    ):
        writer.writerow([uid, name])

if __name__ == "__main__":
    main()
