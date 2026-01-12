# DBLP Processing

The `make update-dblp` target downloads and filters the DBLP database:
1. Downloads ~3GB compressed XML from dblp.uni-trier.de
2. Filters to only CSRankings-relevant venues using lxml iterparse
3. Output: ~53MB compressed (~450k publications)

## Streaming Filter (lxml)

The filter uses lxml's iterparse (`util/filter-dblp.py`) for efficient streaming XML processing:
- **Memory usage**: ~100MB constant (streaming, clears elements after processing)
- **Processing time**: ~70 seconds (2.7x faster than expat SAX)
- **Entity resolution**: Handled via DTD loading for proper diacritics
- **Requires**: `pip install lxml`

The streaming approach reads from stdin and writes to stdout, enabling pipeline usage:
```bash
gunzip -dc dblp-original.xml.gz | python3 util/filter-dblp.py | gzip > dblp.xml.gz
```

## Performance Notes

Profiling shows XML parsing is the bottleneck (~98% of time in libxml2/expat), not Python code:
- **lxml (libxml2)**: ~70 seconds - current implementation
- **expat (SAX)**: ~180 seconds - 2.7x slower
- **Cython**: No benefit since bottleneck is C-based XML parser, not Python

## Entity Resolution

lxml with DTD loading correctly resolves XML entities to UTF-8 characters. This is critical for matching faculty names with diacritics:
- `&Eacute;va Tardos` -> `Eva Tardos`
- `&Uuml;mit V. &Ccedil;atalyyurek` -> `Umit V. Catalyurek`

The `dblp.dtd` file must be present in the working directory for entity resolution.

## Venue Configuration

Venues are defined in `util/filter-dblp.py`:
- `BOOKTITLES` - Conference proceedings (AAAI, ICML, CVPR, etc.)
- `JOURNALS` - Journal articles (ACM Trans. Graph., PVLDB, Bioinform., etc.)

When adding a new venue, update the appropriate set in `util/filter-dblp.py` with the exact booktitle/journal name as it appears in DBLP.

## Fully Automated DBLP Update

Use `make update-dblp-full` to run the complete update pipeline with one command:

```bash
make update-dblp-full
```

This performs all 7 steps automatically:
1. **Backup** - Saves current `dblp-original.xml.gz` to `prev-dblp.xml.gz`
2. **Download** - Fetches new DBLP dump from dblp.uni-trier.de (~3GB)
3. **Filter** - Shrinks to CSRankings venues via streaming SAX parser (~53MB)
4. **Aliases** - Generates `dblp-aliases.csv`
5. **Name changes** - Detects and applies author name changes to `csrankings-*.csv`
6. **Regenerate** - Rebuilds `generated-author-info.csv`
7. **Update date** - Updates "last update" date in `index.html`

## Manual DBLP Update (Step-by-Step)

If you prefer to review changes before applying:

```bash
# 1. Backup current DBLP
make backup-dblp

# 2. Download new DBLP
make download-dblp

# 3. Filter to CSRankings venues
make shrink-dblp

# 4. Preview name changes (dry-run)
make update-author-names

# 5. Apply name changes if preview looks correct
make apply-author-names

# 6. Regenerate publication data
make generated-author-info.csv

# 7. Update date in index.html
make update-dblp-date
```

## Updating Author Names

DBLP occasionally changes canonical author names (e.g., adding disambiguation numbers like "0001"). The automated pipeline handles this, but you can also run manually:

- `make update-author-names` - Detect changes (dry-run preview)
- `make apply-author-names` - Apply changes from `name-changes.csv`

Tools involved:
- `util/new-name-detector.py` - Compares old/new DBLP dumps for canonical name changes, includes ORCID for matching
- `util/update-new-names.py` - Applies name changes to csrankings-*.csv files, uses ORCID-based matching when available

## See Also

- [orcid.md](orcid.md) - ORCID integration for name matching
- [../optimizations.md](../optimizations.md) - XML processing optimization details
