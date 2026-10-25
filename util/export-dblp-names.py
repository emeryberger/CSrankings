"""
Export the DBLP author names in dblp.xml.xz as static shards for the
submission form (/submit/), which can no longer query dblp.org from the
browser: dblp.org sits behind an Anubis bot check.

Writes dblp-names/<k>.txt, one "name<TAB>papers" line per author, sorted.
The shard key <k> is the lowercased first letter of the author's last name
(ignoring any " 0001" suffix), or "_" for anything outside a-z. src/submit.ts
computes the same key, so keep shard_key() and dblpShardKey() in sync.

Usage: python3 util/export-dblp-names.py [output-dir]
"""

import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dblp_local import REPO_ROOT, DblpIndex, base_name  # noqa: E402


def shard_key(name: str) -> str:
    tokens = base_name(name).split()
    c = tokens[-1].lower()[0] if tokens else "_"
    return c if "a" <= c <= "z" else "_"


def main() -> None:
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO_ROOT, "dblp-names")
    os.makedirs(out_dir, exist_ok=True)
    shards = defaultdict(list)
    for name, papers in DblpIndex().papers.items():
        shards[shard_key(name)].append(f"{name}\t{papers}")
    for key, lines in sorted(shards.items()):
        with open(os.path.join(out_dir, f"{key}.txt"), "w", encoding="utf-8", newline="\n") as f:
            f.write("\n".join(sorted(lines)) + "\n")
    print(f"Wrote {sum(map(len, shards.values()))} names in {len(shards)} shards to {out_dir}")


if __name__ == "__main__":
    main()
