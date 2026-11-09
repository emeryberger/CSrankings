# DBLP Processing

The `make update-dblp` target downloads and filters the DBLP database:
1. Downloads the latest monthly DBLP release (~1GB compressed XML) from the Dagstuhl DROPS archive
2. Filters to only CSRankings-relevant venues using lxml iterparse
3. Output: ~53MB compressed (~450k publications)

## Where the Data Comes From

Downloads use the dated monthly releases at
`https://drops.dagstuhl.de/storage/artifacts/dblp/xml/YYYY/dblp-YYYY-MM-DD.xml.gz`,
via `util/download-dblp-release.py`. The rolling dump at `dblp.org/xml/dblp.xml.gz`
(and the `dblp.uni-trier.de` mirror) has sat behind an Anubis proof-of-work bot
check since September 2026: curl gets a 200 with a small HTML challenge page
instead of the data, which is what broke the monthly update.

The script:
- tries the current month's release, then the previous month's (releases appear
  within a few days of the 1st; the workflow runs on the 28th). The day in the
  file name is usually `01` but not always (October 2026 was `dblp-2026-10-03`),
  so each month is found by probing days 1-10; `--month YYYY-MM` does the same
  for a specific month (used by `make download-prev-dblp`)
- fails if the newest release it finds is more than 45 days old
  (`--max-age-days`), so a missing or renamed release triggers the workflow's
  failure issue instead of a "successful" run that commits nothing. That silent
  mode is how October 2026 was missed: the job re-processed September's data
  and reported success.
- downloads with `curl -f` and refuses anything that does not start with the
  gzip magic bytes, so an HTML page can never masquerade as data again
- records the release date in `dblp-release-date.txt` (gitignored), which
  `make update-dblp-date` uses to stamp `index.html` with the month of the data
  actually used

The releases declare a dated DTD (e.g. `dblp-2023-06-28.dtd`) rather than
`dblp.dtd`. `util/filter-dblp.py` and `util/generate-aliases.py` register an
lxml resolver that maps any `dblp*.dtd` to the local `dblp.dtd`; without it,
entity references such as `&Eacute;` are hard parse errors.

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

## Excluding Non-Research Contributions

Only peer-reviewed research contributions count. DBLP lists everything a venue
publishes under the venue's name, so position papers, invited papers, front matter,
keynotes and so on look like research papers unless a rule says otherwise. `countPaper()` in `util/csrankings.py` rejects them using:

- `util/nonresearch.py` - rules based on what a record says about itself: its
  title (`Position: ...`, `Front Matter.`, `Session details: ...`, `(Panel)`), its
  `<ee>` URLs (`-Abstract-Position_Paper_Track.html` on NeurIPS, the AAAI Doctoral
  Consortium path) and its `<url>` table of contents (`siggrapha2019courses`).
- `non-research-papers.csv` - DBLP keys of papers in tracks that leave no trace in
  the DBLP record, with the track and its source. **This needs updating for each new
  year of a listed venue**, or that year's non-research tracks will count.
  Covered so far: AAAI, IJCAI 2017-, KDD 2000-2026, SIGIR 2019-2025,
  PVLDB (conference years 2019, 2021-2023, 2025), WWW 2022, 2024, 2026, ASE 2019-2025,
  ISSTA 2017-2022, USENIX sessions 2016-, and the ISCA and HPCA 2025 industry tracks.
- Venue tables in `util/csrankings.py` where only numbers separate the tracks, such
  as `SC_2006_ResearchArticles` and `SIGMOD_NonResearchPaperStart`.

The 6-page threshold is not enough: it does not apply to records without page
numbers, which includes recent NeurIPS and nearly all of ICLR and NDSS.

Venues differ in how DBLP records a position track. ICML 2025's has its own
booktitle, `ICML (Position Papers)`, so `util/filter-dblp.py` drops it, while ICML
2024's uses plain `ICML` and only the title prefix identifies it. NeurIPS 2025's is
identifiable only by its URL.

At NeurIPS, only the main track counts. The rule is an allowlist on the URL, so new
or renamed tracks are excluded by default: Datasets and Benchmarks (2022-2025), which
became Evaluations and Datasets in 2026, Creative AI, and so on. If the main track's
URL ever stops using `-Abstract-Conference`, this rule must be updated or that year's
NeurIPS papers will not count.

**When another venue adds a track, check how DBLP records it** and add a rule if it
is not peer-reviewed research. Add the new title or URL to
`test/test_nonresearch.py`, including near misses that must keep counting.

Other conferences can share a tracked booktitle. `WrongVenueTablesOfContents` in
`util/csrankings.py` lists them. To confirm one, follow a record's `<crossref>` to its
`<proceedings>` record in the full dump (the filtered snapshot omits those), and
exclude by DBLP table of contents, never by title.

Rules must stay high precision, since a false positive silently costs an author a
real paper. Records that carry no marker at all (such as ICRA 2011's unpaginated
entries) are deliberately left alone.

## Fully Automated DBLP Update

Use `make update-dblp-full` to run the complete update pipeline with one command:

```bash
make update-dblp-full
```

This performs all 7 steps automatically:
1. **Backup** - Saves current `dblp-original.xml.gz` to `prev-dblp.xml.gz`
2. **Download** - Fetches the latest monthly DBLP release from drops.dagstuhl.de (~1GB)
3. **Filter** - Shrinks to CSRankings venues via streaming SAX parser (~53MB)
4. **Aliases** - Generates `dblp-aliases.csv`
5. **Name changes** - Detects and applies author name changes to `csrankings-*.csv`, then writes `name-check.csv`: rows whose ORCID DBLP now puts on a different name, and rows on a DBLP disambiguation page (advisory; review before renaming)
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
- `util/orcid-name-check.py` - Reports people DBLP split off a shared name into a new numbered profile, which `new-name-detector.py` cannot see (it follows renamed profiles only)

## See Also

- [orcid.md](orcid.md) - ORCID integration for name matching
- [../optimizations.md](../optimizations.md) - XML processing optimization details
