#!/usr/bin/env python3
"""
Concatenate the per-file JavaScript emitted by `tsc` into a single
`csrankings.js`, in the order declared by `tsconfig.json`'s `files` list.

Background: the CSRankings frontend is written as global-scope TypeScript
(no `import`/`export`) and shipped as one plain `<script>`. This used to be
produced by tsc's `outFile`, which was removed in TypeScript 6.0. We now
compile each file to `build/js/` (via `outDir`) and concatenate here.

Because each file is emitted independently, tsc inlines its runtime helpers
(`"use strict";`, `var __awaiter = ...`) into every file that needs them.
This script keeps only the first occurrence of each and hoists the helpers to
the top (right after `"use strict";`) so the output matches the single-helper
form that `outFile` produced.
"""

import json
import re
from pathlib import Path

BASEDIR = Path(__file__).parent.parent
TSCONFIG = BASEDIR / "tsconfig.json"
BUILD_DIR = BASEDIR / "build" / "js"
OUTPUT = BASEDIR / "csrankings.js"

# tsc runtime helpers that get inlined per-file; emit each only once.
HELPER_VAR_RE = re.compile(r"^var (__[A-Za-z]+) = \(this && this\.\1\)")


def main() -> None:
    files = json.loads(TSCONFIG.read_text())["files"]
    seen_use_strict = False
    seen_helpers: set[str] = set()
    helper_blocks: list[str] = []
    body_lines: list[str] = []

    for src in files:
        js_path = BUILD_DIR / (Path(src).stem + ".js")
        lines = js_path.read_text().splitlines()
        i = 0
        n = len(lines)
        while i < n:
            line = lines[i]

            if line.strip() == '"use strict";':
                seen_use_strict = True
                i += 1
                continue

            m = HELPER_VAR_RE.match(line)
            if m:
                # Consume the whole helper block up to the closing "};".
                start = i
                while i < n and lines[i].rstrip() != "};":
                    i += 1
                i += 1  # include the "};" line
                if m.group(1) not in seen_helpers:
                    seen_helpers.add(m.group(1))
                    helper_blocks.extend(lines[start:i])
                continue

            body_lines.append(line)
            i += 1

    # Emit "use strict" and the deduped helpers first (matching outFile output),
    # then the concatenated module bodies.
    out_lines: list[str] = []
    if seen_use_strict:
        out_lines.append('"use strict";')
    out_lines.extend(helper_blocks)
    out_lines.extend(body_lines)

    OUTPUT.write_text("\n".join(out_lines) + "\n")
    print(f"Wrote {OUTPUT.name} ({len(out_lines)} lines) from {len(files)} modules.")


if __name__ == "__main__":
    main()
