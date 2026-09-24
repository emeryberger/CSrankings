"""
Normalize invisible / look-alike characters in faculty CSV fields.

Names are matched against DBLP by exact string equality. A name copied from a
web page often carries a NO-BREAK SPACE (U+00A0) or SOFT HYPHEN (U+00AD) that
renders identically to the ASCII character, so the row looks right but matches
no DBLP author and the person silently gets zero publications (e.g.
"Jun Wen\\u00a00001", PR #13468).

clean_field() is applied by `make` (util/clean-csrankings.py,
util/sync-orcid-csv.py) so the tree self-heals, and find_bad_chars() is used by
util/validate_commit.py and the test suite to reject/flag them.
.github/workflows/process-submission.yml has a JavaScript mirror of this
table (cleanField) -- keep the two in step.
"""

import re
import unicodedata
from typing import List

# Characters that must never appear in a field, and what they become.
# SOFT HYPHEN becomes "-" because in practice it stands in for a real hyphen in
# a hyphenated given name ("Doo­Hwan Bae" is "Doo-Hwan Bae" in DBLP).
_REPLACEMENTS = {
    "­": "-",   # SOFT HYPHEN
    "​": "",    # ZERO WIDTH SPACE
    "‌": "",    # ZERO WIDTH NON-JOINER
    "‍": "",    # ZERO WIDTH JOINER
    "⁠": "",    # WORD JOINER
    "﻿": "",    # ZERO WIDTH NO-BREAK SPACE / BOM
}

# Any whitespace other than an ASCII space (NBSP, narrow NBSP, thin space,
# ideographic space, tabs, ...) becomes an ASCII space.
_ODD_SPACE = re.compile(r"[^\S ]")

BAD_CHARS = re.compile("[" + "".join(_REPLACEMENTS) + r"]|[^\S ]")


def clean_field(s: str) -> str:
    """Return s with invisible characters fixed, NFC-normalized, spaces collapsed."""
    for bad, good in _REPLACEMENTS.items():
        s = s.replace(bad, good)
    s = _ODD_SPACE.sub(" ", s)
    s = re.sub(r" {2,}", " ", s)
    return unicodedata.normalize("NFC", s).strip()


def find_bad_chars(s: str) -> List[str]:
    """Describe each disallowed character in s, e.g. 'U+00A0 NO-BREAK SPACE'."""
    return [
        f"U+{ord(c):04X} {unicodedata.name(c, 'UNKNOWN')}"
        for c in dict.fromkeys(m.group() for m in BAD_CHARS.finditer(s))
    ]
