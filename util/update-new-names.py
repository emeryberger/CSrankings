#!/usr/bin/env python3
import argparse
import csv
import os
import shutil
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

LETTERS = [chr(c) for c in range(ord("a"), ord("z") + 1)]
FILENAME_TPL = "csrankings-{}.csv"


def read_diff_map(diff_csv: Path) -> Dict[str, str]:
    """Return {old_name -> new_name} from the diff CSV (uid,old_name,new_name)."""
    mapping: Dict[str, str] = {}
    with diff_csv.open("r", encoding="utf-8", newline="") as f:
        rdr = csv.DictReader(f)
        missing = {"uid", "old_name", "new_name"} - set(rdr.fieldnames or [])
        if missing:
            raise SystemExit(f"diff CSV is missing columns: {sorted(missing)}")
        for row in rdr:
            old = (row["old_name"] or "").strip()
            new = (row["new_name"] or "").strip()
            if old and new and old != new:
                mapping[old] = new
    return mapping


def strip_accents(s: str) -> str:
    """ASCII fold for initial-letter routing; keeps base letters (É→E)."""
    nkfd = unicodedata.normalize("NFKD", s)
    return "".join(ch for ch in nkfd if not unicodedata.combining(ch))


def first_name_initial(name: str) -> str:
    """Return the a–z file key from the first character of the first token."""
    first = (name.strip().split() or [""])[0]
    if not first:
        return ""
    base = strip_accents(first)[0:1].lower()
    return base if base and "a" <= base <= "z" else ""


def load_csv(path: Path) -> Tuple[List[str], List[Dict[str, str]]]:
    """Load a csrankings-?.csv preserving field order."""
    with path.open("r", encoding="utf-8", newline="") as f:
        rdr = csv.DictReader(f)
        if not rdr.fieldnames:
            return ([], [])
        rows = [dict(row) for row in rdr]
        return (list(rdr.fieldnames), rows)


def write_csv(path: Path, header: List[str], rows: List[Dict[str, str]]) -> None:
    """Write rows with given header."""
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def index_by_name(rows: List[Dict[str, str]]) -> Dict[str, int]:
    """Map author name -> first index in rows (exact match)."""
    idx: Dict[str, int] = {}
    for i, r in enumerate(rows):
        nm = (r.get("name") or "").strip()
        if nm and nm not in idx:
            idx[nm] = i
    return idx


def ensure_backup(src: Path) -> None:
    backup = src.with_suffix(src.suffix + ".bak")
    if not backup.exists():
        shutil.copy2(src, backup)


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Replace author names in csrankings-[a–z].csv using a diff CSV."
    )
    ap.add_argument("--diff", required=True, type=Path,
                    help="CSV with columns uid,old_name,new_name")
    ap.add_argument("--dir", default=".", type=Path,
                    help="Directory containing csrankings-[a–z].csv (default: .)")
    ap.add_argument("--in-place", action="store_true",
                    help="Apply changes to files. Default is dry-run (just show changes).")
    ap.add_argument("--no-backup", action="store_true",
                    help="Do not create .bak backups when --in-place is used.")
    args = ap.parse_args()

    diff_map = read_diff_map(args.diff)
    if not diff_map:
        print("No changes to apply (diff map empty).", file=sys.stderr)
        return

    # Load all files
    headers: Dict[str, List[str]] = {}
    tables: Dict[str, List[Dict[str, str]]] = {}
    name_index: Dict[str, Dict[str, int]] = {}  # letter -> {name -> row_index}

    for letter in LETTERS:
        path = args.dir / FILENAME_TPL.format(letter)
        if not path.exists():
            continue
        hdr, rows = load_csv(path)
        if not hdr:
            continue
        headers[letter] = hdr
        tables[letter] = rows
        name_index[letter] = index_by_name(rows)

    if not tables:
        raise SystemExit(f"No csrankings-[a–z].csv files found in {args.dir}")

    # Plan changes: updates & moves
    changes: List[Tuple[str, str, str, str, str]] = []
    # (letter_from, letter_to, old_name, new_name, status)

    # Track additions queued by destination letter
    to_add: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    # Track deletions by source letter and row indices
    to_delete: Dict[str, List[int]] = defaultdict(list)

    # Process every row in every file; if name matches old_name, update/move.
    for letter_from, rows in tables.items():
        idx_map = name_index[letter_from]
        # Iterate over a snapshot of names so that updates don't confuse index map
        for old_name, new_name in diff_map.items():
            if old_name not in idx_map:
                continue
            row_i = idx_map[old_name]
            row = rows[row_i].copy()

            # Prepare updated row
            updated = row.copy()
            updated["name"] = new_name

            # Determine destination file based on *new* first-name initial
            dest_letter = first_name_initial(new_name) or letter_from  # fallback: stay put
            # If destination file doesn't exist yet, we will create it with the same header
            if dest_letter not in headers:
                headers[dest_letter] = headers[letter_from].copy()
                tables[dest_letter] = tables.get(dest_letter, [])
                name_index[dest_letter] = index_by_name(tables[dest_letter])

            # If the name already exists in the destination, we treat as dedupe: delete source row, no add.
            dest_idx = name_index[dest_letter].get(new_name)
            if dest_idx is not None:
                # Mark deletion of the source (if different row)
                to_delete[letter_from].append(row_i)
                changes.append((letter_from, dest_letter, old_name, new_name, "dedup-dropped-source"))
            else:
                # Queue add to destination
                to_add[dest_letter].append(updated)
                # Mark deletion from source
                to_delete[letter_from].append(row_i)
                status = "move" if dest_letter != letter_from else "rename"
                changes.append((letter_from, dest_letter, old_name, new_name, status))

    # Dry-run output
    if not args.in_place:
        out = csv.writer(sys.stdout)
        out.writerow(["from_file", "to_file", "old_name", "new_name", "status"])
        for src, dst, old, new, status in changes:
            out.writerow([FILENAME_TPL.format(src), FILENAME_TPL.format(dst), old, new, status])
        print(f"# planned changes: {len(changes)}", file=sys.stderr)
        return

    # Apply changes: delete marked rows (highest index first), then append queued adds
    for letter_from, del_indices in to_delete.items():
        if not del_indices:
            continue
        # Make a backup unless disabled
        path_from = args.dir / FILENAME_TPL.format(letter_from)
        if path_from.exists() and not args.no_backup:
            ensure_backup(path_from)
        # Delete rows by descending index
        rows = tables[letter_from]
        for i in sorted(set(del_indices), reverse=True):
            if 0 <= i < len(rows):
                rows.pop(i)
        # Rebuild name index for the source after deletions
        name_index[letter_from] = index_by_name(rows)

    # Apply additions
    for letter_to, new_rows in to_add.items():
        if not new_rows:
            continue
        path_to = args.dir / FILENAME_TPL.format(letter_to)
        # Ensure header exists
        if letter_to not in headers or not headers[letter_to]:
            # If somehow no header known, default to header from an existing file
            # Prefer 'a' file header if present
            fallback_hdr = next(iter(headers.values()))
            headers[letter_to] = list(fallback_hdr)
        # Backup destination (existing)
        if path_to.exists() and not args.no_backup:
            ensure_backup(path_to)
        # Append rows
        tables[letter_to].extend(new_rows)
        # Rebuild destination index
        name_index[letter_to] = index_by_name(tables[letter_to])

    # Write all touched files back
    touched_letters = set(to_delete.keys()) | set(to_add.keys())
    for letter in sorted(touched_letters):
        path = args.dir / FILENAME_TPL.format(letter)
        path.parent.mkdir(parents=True, exist_ok=True)
        write_csv(path, headers[letter], tables[letter])

    print(f"Applied {len(changes)} change(s).")


if __name__ == "__main__":
    main()
