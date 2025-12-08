# CLAUDE.md - CSRankings Project Guide

## Project Overview
CSRankings is a metrics-based ranking of top computer science institutions. The frontend is a single-page application built with TypeScript that displays publication-based rankings with interactive filtering by research area, year, and region.

See [optimizations.md](optimizations.md) for performance optimization strategies and benchmarks.

## Build Commands
```bash
# Compile TypeScript
tsc --project tsconfig.json

# Build everything (JS + minified + data)
make all

# Just rebuild JavaScript
make csrankings.js

# Minify (requires google-closure-compiler)
make csrankings.min.js
```

## Architecture

### Main Files
- `csrankings.ts` - Main TypeScript application (~2100 lines)
- `index.html` - Single page with checkbox controls and result container
- `tsconfig.json` - TypeScript configuration (ES6 target, strict mode)

### Key Classes and Patterns
- `CSRankings` - Singleton class managing all ranking logic
- Static maps: `parentMap`, `childMap`, `nextTier`, `areas`, `topLevelAreas`, `topTierAreas`
- Instance accessed via `CSRankings.getInstance()`

### Data Flow on Checkbox Click (Incremental)
1. Event listener fires → `invalidateCheckboxCache()`
2. Parent/child checkbox synchronization (native DOM)
3. `rank(updateURL)` → `doRank()` called
4. `updateWeights()` reads checkbox cache
5. `buildIncrementalCache()` - only rebuilds if year/region changed
6. `buildDepartmentsIncremental()` - uses cached per-area data (fast!)
7. `computeStats()` calculates geometric means
8. If `VERIFY_INCREMENTAL` is true, runs full computation to verify
9. `buildDropDown()` generates faculty HTML
10. `buildOutputString()` generates ranking table
11. DOM update via `innerHTML`
12. `updatedURL()` updates browser history

### Checkbox Hierarchy
- **Parent checkboxes**: Top-level areas (ai, vision, mlmining, etc.)
- **Child checkboxes**: Individual conferences (aaai, ijcai, cvpr, etc.)
- **Next tier**: Lower-tier conferences that are off by default (defined in `CSRankings.nextTier`)

## Performance Considerations

### Checkbox State Caching
The `checkboxCache` object caches all checkbox states to avoid repeated DOM queries:
```typescript
private checkboxCache: { [key: string]: boolean } = {};
private checkboxCacheValid: boolean = false;
```
- Call `invalidateCheckboxCache()` when any checkbox changes
- Cache is refreshed once per `rank()` call via `refreshCheckboxCache()`
- Use `getCheckboxState(area)` to read from cache

### Native DOM vs jQuery
Prefer native DOM APIs for checkbox operations:
```typescript
// Good - native DOM (5-10x faster)
const element = document.getElementById(id) as HTMLInputElement;
element.checked = true;

// Avoid - jQuery overhead
$(`input[name=${id}]`).prop('checked', true);
```

### All Entries Displayed
CSRankings now displays all entries on initial load (no progressive scroll loading). This is possible due to lazy faculty rendering - the page loads fast because faculty HTML is only generated when a department row is expanded.

### Incremental Update System
The incremental update system caches data that only changes when year/region changes:

```typescript
private incrementalCache: {
    valid: boolean;
    startyear: number;
    endyear: number;
    regions: string;
    areaData: { [area: string]: { [dept: string]: number } };  // Per-area dept counts
    deptNames: { [dept: string]: Array<string> };              // Faculty per dept
    deptCounts: { [dept: string]: number };                    // Faculty count per dept
    facultyAreaData: { [area: string]: { [name: string]: {...} } };  // Per-area faculty stats
    allFaculty: { [name: string]: { dept: string } };          // All faculty
}
```

**Cache invalidation:**
- `invalidateIncrementalCache()` - Called when year/region dropdown changes
- Cache auto-rebuilds on next `rank()` call if parameters changed

**Verification mode:**
- Set `VERIFY_INCREMENTAL = true` to compare incremental vs full computation
- Logs "✓ Incremental computation verified" on success
- Logs detailed errors if mismatch detected
- Set to `false` for production to skip verification overhead

### Key Data Structures
- `this.authors` - Array of ~50k author publication records
- `this.authorAreas` - Map of author/dept → area → publication count
- `this.stats` - Computed geometric mean scores per department
- `this.areaDeptAdjustedCount` - Area+dept adjusted publication counts

## Common Tasks

### Adding a New Conference
1. Add to `parentMap` with parent area
2. Add to `areaMap` array with display title
3. If next-tier, add to `nextTier` object
4. Add checkbox in `index.html` under appropriate parent
5. Add venue to `filter.xq` ($booktitles for conferences, $journals for journal articles)

### Adding a New Area
1. Add to `areaMap` array
2. Add to appropriate category array (aiAreas, systemsAreas, theoryAreas, interdisciplinaryAreas)
3. Create `childMap` entry if it has child conferences
4. Add UI elements in `index.html`

### Debugging Performance
Console logs show timing:
```
Building incremental cache...           # Only on first load or year/region change
Incremental cache built in X.Xms
Incremental computation took X.Xms      # Fast path using cache
Full computation took X.Xms             # Only if VERIFY_INCREMENTAL=true
✓ Incremental computation verified      # Verification passed
Before render: rank took Xms
Rank took Xms
```
- First number is incremental time, second is full (verification only)
- After cache is built, checkbox clicks should show incremental << full
- The difference between final two is DOM rendering time

### Testing
Start a local server:
```bash
python3 -m http.server 8000
# Open http://localhost:8000/index.html
# Open browser console (F12) to see timing logs
# Click checkboxes and observe performance
```

**Automated testing with pytest:**
```bash
# Run all tests
pytest test/ -v

# Run just the incremental computation tests
pytest test/test_incremental.py -v

# Run a specific test
pytest test/test_incremental.py::TestIncrementalComputation::test_toggle_ai_checkbox_off -v
```

**Requirements for testing:**
```bash
pip3 install pytest selenium webdriver-manager
```

**Manual verification from browser console:**
```javascript
csr.setVerifyIncremental(true);  // Enable verification
// Click checkboxes - console will show verification results
csr.setVerifyIncremental(false); // Disable for production
```

### Performance Results
Typical timing with optimizations:
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial CSV load | Sequential | ~350ms parallel | ~3x |
| Incremental computation | ~50ms | ~10ms | 5x |
| Full computation | ~50ms | ~40ms | - |
| Render time | ~700ms | ~4ms | **175x** |
| Total rank() time | ~750ms | ~65ms | **12x** |
| Initial page load | ~2-3s | ~900ms | **2-3x** |

Key optimizations:
1. **Parallel CSV loading**: All 6 CSV files load concurrently via `Promise.all()`
2. **Incremental computation**: Only recomputes what changed based on checkbox state
3. **Lazy faculty rendering**: Faculty HTML generated on-demand when department expanded
4. **Checkbox state caching**: Native DOM instead of jQuery
5. **Optimized countAuthorAreas**: Pre-computed area list, indexed array access
6. **No loading overlay**: Page loads fast enough (~900ms) that progress messages are unnecessary

## CI/CD

GitHub Actions workflow (`.github/workflows/post-merge-rebuild.yml`) runs on push to `gh-pages`:
1. **test job**: Compiles TypeScript, runs pytest with Selenium/Chrome
2. **build-and-commit job**: Runs `make` and auto-commits results (only after tests pass)

## DBLP Processing

The `make update-dblp` target downloads and filters the DBLP database:
1. Downloads ~3GB compressed XML from dblp.uni-trier.de
2. Filters to only CSRankings-relevant venues using lxml iterparse
3. Output: ~53MB compressed (~450k publications)

### Streaming Filter (lxml)
The filter uses lxml's iterparse (`util/filter-dblp.py`) for efficient streaming XML processing:
- **Memory usage**: ~100MB constant (streaming, clears elements after processing)
- **Processing time**: ~70 seconds (2.7x faster than expat SAX)
- **Entity resolution**: Handled via DTD loading for proper diacritics
- **Requires**: `pip install lxml`

The streaming approach reads from stdin and writes to stdout, enabling pipeline usage:
```bash
gunzip -dc dblp-original.xml.gz | python3 util/filter-dblp.py | gzip > dblp.xml.gz
```

### Performance Notes
Profiling shows XML parsing is the bottleneck (~98% of time in libxml2/expat), not Python code:
- **lxml (libxml2)**: ~70 seconds - current implementation
- **expat (SAX)**: ~180 seconds - 2.7x slower
- **Cython**: No benefit since bottleneck is C-based XML parser, not Python

### Entity Resolution
lxml with DTD loading correctly resolves XML entities to UTF-8 characters. This is critical for matching faculty names with diacritics:
- `&Eacute;va Tardos` → `Éva Tardos`
- `&Uuml;mit V. &Ccedil;ataly&uuml;rek` → `Ümit V. Çatalyürek`

The `dblp.dtd` file must be present in the working directory for entity resolution.

### Venue Configuration
Venues are defined in `util/filter-dblp.py`:
- `BOOKTITLES` - Conference proceedings (AAAI, ICML, CVPR, etc.)
- `JOURNALS` - Journal articles (ACM Trans. Graph., PVLDB, Bioinform., etc.)

When adding a new venue, update the appropriate set in `util/filter-dblp.py` with the exact booktitle/journal name as it appears in DBLP.

### Fully Automated DBLP Update
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

### Manual DBLP Update (Step-by-Step)
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

### Updating Author Names
DBLP occasionally changes canonical author names (e.g., adding disambiguation numbers like "0001"). The automated pipeline handles this, but you can also run manually:

- `make update-author-names` - Detect changes (dry-run preview)
- `make apply-author-names` - Apply changes from `name-changes.csv`

Tools involved:
- `util/new-name-detector.py` - Compares old/new DBLP dumps for canonical name changes
- `util/update-new-names.py` - Applies name changes to csrankings-*.csv files

## File Structure
```
csrankings.ts          # Main TypeScript source
csrankings.js          # Compiled JavaScript
csrankings.min.js      # Minified for production
index.html             # Main page
tsconfig.json          # TypeScript config
Makefile               # Build automation
generated-author-info.csv  # Publication data (~15MB, ~50k records)
csrankings.csv         # Author info (~2.9MB)
institutions.csv       # Institution regions
countries.csv          # Country codes
turing.csv             # Turing award winners
acm-fellows.csv        # ACM Fellows
test/                  # Pytest test suite
  __init__.py
  test_incremental.py  # Selenium-based tests (16 tests)
filter.xq              # XQuery filter for DBLP (venue definitions)
util/                  # Utility scripts
  regenerate_data.py   # Generate author publication data
  split-csv.py         # Split combined CSV files
  ...                  # Other data processing scripts
typescript/            # Type definitions
  jquery.d.ts
  navigo.d.ts
  papaparse.d.ts
  vega-embed.d.ts
  continents.d.ts
  he/index.d.ts
.github/workflows/     # CI/CD
  post-merge-rebuild.yml  # Test + build on push
  commit_validation.yml   # PR validation
  stale.yml               # Stale PR management
```

## Dependencies

### Frontend (JavaScript)
- jQuery (DOM manipulation, some remaining uses)
- Papa Parse (CSV parsing)
- Navigo (client-side routing)
- Vega-Lite (charts)
- he (HTML entity encoding)

### Backend/Build (Python)
- lxml (`pip install lxml`) - DBLP XML filtering, 2.7x faster than expat
