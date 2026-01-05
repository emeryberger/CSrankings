# CLAUDE.md - CSRankings Project Guide

## Project Overview
CSRankings is a metrics-based ranking of top computer science institutions. The frontend is a single-page application built with TypeScript that displays publication-based rankings with interactive filtering by research area, year, and region.

See [optimizations.md](optimizations.md) for performance optimization strategies and benchmarks.

See [docs/ui-learnings.md](docs/ui-learnings.md) for CSS patterns, table structure, and UI modification guidelines.

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
- `src/` - TypeScript source files (modular architecture):
  - `app.ts` - Main application entry point, CSRankings singleton class
  - `checkbox.ts` - Checkbox state management and caching
  - `computation.ts` - Ranking computation and incremental updates
  - `config.ts` - Area maps, parent/child relationships, configuration
  - `data-loader.ts` - CSV loading (parallel via Promise.all)
  - `event-handlers.ts` - UI event listeners
  - `navigation.ts` - Client-side routing (Navigo)
  - `rendering.ts` - HTML generation for tables and dropdowns
  - `region.ts` - Region/continent filtering
  - `types.ts` - TypeScript type definitions
  - `utils.ts` - Utility functions
  - `verification.ts` - Incremental computation verification
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

### Native DOM (No jQuery)
The application uses native DOM APIs exclusively (jQuery was removed):
```typescript
// Checkbox operations
const element = document.getElementById(id) as HTMLInputElement;
element.checked = true;

// Select/dropdown operations
const select = document.getElementById("regions") as HTMLSelectElement;
const value = select.value;                          // Get value
select.value = "world";                              // Set value
const text = select.selectedOptions[0].text;         // Get selected text
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
4. **Checkbox state caching**: Native DOM APIs (no jQuery)
5. **Optimized countAuthorAreas**: Pre-computed area list, indexed array access
6. **No loading overlay**: Page loads fast enough (~900ms) that progress messages are unnecessary

## CI/CD

GitHub Actions workflow (`.github/workflows/post-merge-rebuild.yml`) runs on push to `gh-pages`:
1. **test job**: Compiles TypeScript, runs pytest with Selenium/Chrome
2. **build-and-commit job**: Runs `make` and auto-commits results (only after tests pass)

### Race Condition Protection
All workflows that push changes include retry logic to handle concurrent pushes:
- **Max retries**: 3 attempts
- **Retry mechanism**: `git pull --rebase` to integrate remote changes before retrying
- **Exponential backoff**: 5s, 10s, 15s delays between retries
- **Workflows protected**: `post-merge-rebuild.yml`, `monthly-dblp-update.yml`, `update-sponsors.yml`

This prevents data loss when multiple PRs are merged in quick succession, ensuring all changes are preserved even if concurrent CI runs occur.

## PR Validation System

The `commit_validation.yml` workflow validates PRs automatically using `validate_commit.py`.

### PR Template

`.github/PULL_REQUEST_TEMPLATE.md` provides a checklist that populates new PR descriptions. Key learnings:

- **Use absolute URLs**: Links in PR templates don't resolve correctly with relative paths. Use full URLs like `https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#anchor`
- **GitHub doesn't support PR forms**: Unlike Issue Forms (YAML-based with required fields), PR templates are markdown-only. Checkboxes are just text that users can ignore.
- **Trigger on `edited`**: The workflow must include `edited` in triggers so validation re-runs when contributors check boxes after initial submission:
  ```yaml
  on:
    pull_request_target:
      types: [opened, synchronize, edited]
  ```

### Programmatic Validation

`validate_commit.py` validates PRs programmatically rather than trusting checkboxes:

| Check | Implementation |
|-------|----------------|
| Author profile | GitHub API check for non-empty `user.name` |
| PR title | Reject generic titles like "Update csrankings-x.csv" |
| One PR per institution | Collect affiliations, fail if >1 (excludes affiliation changes) |
| Allowed files | Only `csrankings-[a-z].csv` or `old/*.csv` |
| Excel corruption | Detect `#NAME?`, `#REF?`, `#VALUE?`, etc. |
| CSV format | No spaces after commas |
| Alphabetical order | Check new entries against neighbors in file |
| DBLP match | Query DBLP API for name |
| Homepage | Fetch and check for name/affiliation |
| Google Scholar | Validate 12-char ID format, fetch page |
| New institution | Provide guidance to open issue first |

### Checkbox References

Error messages include footnote references (e.g., `[^5]`) that map to the PR template, helping contributors understand which requirement failed:
```
❌  [^5] Excel corruption detected: found '#NAME?' in line.
❌  [^7] 'Jane Smith' should come before 'John Doe' (alphabetically)
```

### Affiliation Changes

The one-PR-per-institution check correctly handles affiliation changes by detecting when a name appears in both deleted and added lines:
```python
if name_normalized in deleted_names:
    affiliation_changes.append(name)  # Don't count toward institution check
else:
    all_affiliations.add(affiliation)
```

### Files Involved

- `.github/PULL_REQUEST_TEMPLATE.md` - Checklist with footnotes
- `CONTRIBUTING.md` - Detailed explanations with anchor IDs
- `validate_commit.py` - Programmatic validation logic
- `generate_diff.py` - Fetches PR metadata including author info

## Faculty Submission Form

A self-service web form at `/submit/` allows faculty to submit CSRankings entries without manual PR creation.

### Architecture

```
User fills form → GitHub Issue → GitHub Action → Pull Request
      ↓                               ↓
 Client-side validation        Server-side validation
 - DBLP name check             - validate_submission.py
 - Homepage accessibility      - Full DBLP verification
 - Institution autocomplete    - Homepage content check
 - Scholar ID format           - Duplicate detection
```

**No OAuth required** - uses GitHub Issue creation which requires only a GitHub login.

### Files

| File | Purpose |
|------|---------|
| `src/submit.ts` | TypeScript form implementation (~1800 lines) |
| `submit/submit.js` | Compiled JavaScript |
| `submit/index.html` | Form page (Bootstrap 3) |
| `submit/submit.css` | Form styles |
| `util/validate_submission.py` | Server-side validation |
| `.github/workflows/process-submission.yml` | Issue → PR automation |
| `.github/ISSUE_TEMPLATE/new-institution.md` | New institution request template |

### Three Action Modes

- **Add**: New faculty with eligibility checkboxes
- **Update**: Search existing entry, modify institution/homepage/scholar ID/DBLP name
- **Remove**: Search existing entry, select reason (retired, industry, deceased, etc.)

### DBLP Disambiguation Suffixes

When DBLP has multiple authors with the same name, they add numeric suffixes like "0001". The update workflow supports adding these:

- **"New DBLP Name" field**: Only appears in update mode when selected entry lacks a 4-digit suffix
- **Validation**: New name is checked against DBLP API before submission
- **Detection**: `hasDisambiguationSuffix()` checks for 4-digit suffix at end of name

```typescript
function hasDisambiguationSuffix(name: string): boolean {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return false;
    const lastPart = parts[parts.length - 1];
    return /^\d{4}$/.test(lastPart);
}
```

Example: User selects "Christian Schilling", enters "Christian Schilling 0001" as new name.

### Institution Autocomplete Features

- **Fuzzy matching**: `University` ↔ `Univ.`, `Institute` ↔ `Inst.`, etc.
- **Acronym support**: 150+ acronyms including:
  - Generic U? two-letter (UA-UZ): `UT` → all UT schools, `UC` → all UC schools
  - Specific: MIT, CMU, UIUC, UCLA, ETH, EPFL, NUS, etc.
- **Priority ordering**: Primary institution shown first (e.g., UT → UT Austin first)
- **Country flags**: Shows flag emoji based on institution's country code

**Acronym configuration** in `src/submit.ts`:
```typescript
// Two-letter acronyms match multiple institutions
const ACRONYM_MAP: Record<string, string[]> = {
    'ut': ['university of texas', 'texas at', 'university of tennessee', ...],
    'uc': ['univ. of california', 'california -', ...],
    ...
};

// Primary institution shown first in results
const ACRONYM_PRIMARY: Record<string, string | string[]> = {
    'ut': 'University of Texas at Austin',
    'uc': 'california -',  // Pattern matches all UC schools
    'uw': ['University of Washington', 'Wisconsin'],  // Multiple primaries
    ...
};
```

### Key Implementation Notes

**Issue body format** - The GitHub Action parses the `### Action` field:
```markdown
### Action
Add new faculty entry

### Name (as it appears in DBLP)
...
```
**Critical**: Don't use GitHub issue templates with the `template` URL parameter - it overrides the `body` parameter and the Action field gets lost.

**Hidden required fields** - When switching between Add/Update/Remove modes, toggle `required` attribute on hidden fields (like eligibility checkboxes) to prevent browser validation errors:
```typescript
document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
    (cb as HTMLInputElement).required = action === 'add';
});
```

**Name validation on blur** - For Update/Remove modes, auto-select entry if typed name exactly matches:
```typescript
nameInput.addEventListener('blur', () => {
    if (currentAction !== 'add') {
        validateNameForUpdateRemove();  // Auto-selects if exact match
    }
});
```

**Unicode symbols** - Using Unicode instead of Bootstrap glyphicons for status indicators:
- ✓ (`&#10003;`) - Valid/success
- ✗ (`&#10007;`) - Error
- ⚠ (`&#9888;`) - Warning
- ↻ (`&#8635;`) - Loading/spinning

**Fuzzy matching regex** - Abbreviations ending with `.` need special handling:
```typescript
// \b word boundary doesn't work after punctuation
// Use lookahead instead: (?=\s|$)
const regex = abbrev.endsWith('.')
    ? new RegExp(`\\b${escapedAbbrev}(?=\\s|$)`, 'gi')
    : new RegExp(`\\b${escapedAbbrev}\\b`, 'gi');
```

**DBLP API**:
- Endpoint: `https://dblp.org/search/author/api?q=author%3A{query}$%3A&format=json`
- Debounced at 500ms to avoid rate limiting

**Homepage CORS**: Most academic sites block CORS. Show warning but don't block submission - server-side validation will verify.

**Google Scholar ID format**: 12 characters, or `NOSCHOLARPAGE`.

### Build Commands

```bash
# Compile submit form only
make submit/submit.js

# Or manually
tsc src/submit.ts --target es6 --lib es2017,dom --outDir submit --skipLibCheck
```

### Workflow Processing

The `process-submission.yml` workflow:
1. Runs hourly via cron (also manual trigger)
2. Finds issues with title prefix `[CSrankings form submission]`
3. Parses `### Action` field to determine action type (add/update/remove/reinstate)
4. Validates fields and checks institution exists
5. Creates branch, commits CSV change, opens PR
6. Triggers `commit_validation.yml` on the new PR
7. Comments on issue with result

**Required permissions**:
```yaml
permissions:
  contents: write      # Create branches and commits
  issues: write        # Comment on issues, add labels
  pull-requests: write # Create PRs
  actions: write       # Trigger validation workflow
```

**Triggering validation**: PRs created by `GITHUB_TOKEN` don't trigger other workflows automatically. The workflow explicitly calls `workflow_dispatch`:
```javascript
await github.rest.actions.createWorkflowDispatch({
    workflow_id: 'commit_validation.yml',
    ref: 'gh-pages',
    inputs: { pr_number: String(pr.number) }
});
```

### Update Action Logic

For update submissions, the workflow must find the existing entry to replace it. **Critical**: When the name is changing (e.g., adding a DBLP disambiguation suffix), the workflow searches using the **old name** from the `### Old Entry` field, not the `### Name` field.

```javascript
// Extract old name from Old Entry field (for DBLP name changes)
let searchName = name;  // Default to Name field
if (oldEntryText) {
    const [oldName] = oldEntryText.split(',').map(s => s.trim());
    if (oldName) searchName = oldName;  // Use old name for search
}
```

This is essential for DBLP disambiguation suffix updates like:
- Old: `Christian Schilling,Aalborg University,...`
- New: `Christian Schilling 0001,Aalborg University,...`

The workflow correctly searches for "Christian Schilling" (old name) rather than "Christian Schilling 0001" (new name that doesn't exist yet).

### Reprocessing Failed Submissions

If a submission fails validation and needs reprocessing after a fix:
1. Remove the `validation-failed` label: `gh issue edit <num> --remove-label validation-failed`
2. Reopen if closed: `gh issue reopen <num>`
3. Trigger workflow: `gh workflow run process-submission.yml`

The workflow only processes issues that are:
- Open (state = open)
- Have title starting with `[CSrankings form submission]`
- Don't have labels: `processed`, `pr-created`, or `validation-failed`

### CSV Line Endings

CSRankings CSV files use CRLF (`\r\n`) line endings. The workflow:
- Reads with `.split(/\r?\n/)` to handle both formats
- Writes with `.join('\r\n')` to maintain CRLF

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
- `util/new-name-detector.py` - Compares old/new DBLP dumps for canonical name changes, includes ORCID for matching
- `util/update-new-names.py` - Applies name changes to csrankings-*.csv files, uses ORCID-based matching when available

## ORCID Integration

ORCID (Open Researcher and Contributor ID) provides unique identifiers for researchers. CSRankings uses ORCIDs for reliable faculty identification.

### orcid.csv

Maps faculty names to ORCIDs:
```csv
name,orcid
Emery D. Berger,0000-0002-3222-3271
John Smith 0001,0000-0001-2345-6789
Jane Doe,0000-0000-0000-0000
```

- **Real ORCIDs**: 16-digit format like `0000-0002-3222-3271`
- **Placeholder**: `0000-0000-0000-0000` for faculty without known ORCIDs
- **Coverage**: ~49% have real ORCIDs, ~51% have placeholders

### Data Sources

ORCIDs are collected from two sources:
1. **DBLP** (primary): Extracted from `<author orcid="...">` tags in DBLP XML
2. **ORCID API** (secondary): Queried for faculty not in DBLP, verified by affiliation matching

### ORCID-Based Name Matching

When DBLP changes a faculty member's canonical name (e.g., adding "0001" suffix), the name update scripts use ORCID for reliable matching:

```python
# util/update-new-names.py matching logic
1. If ORCID available (not placeholder):
   - Search all csrankings-*.csv files by ORCID
   - More reliable than name matching
2. Fall back to name-based matching if no ORCID
```

**Benefits:**
- Handles name changes without manual intervention
- Avoids false matches for common names
- Works even when old name no longer exists in file

### Output Format

The name change detection (`util/new-name-detector.py`) outputs:
```csv
uid,old_name,new_name,orcid
homepages/123/4567,John Smith,John Smith 0001,0000-0001-2345-6789
```

The update script (`util/update-new-names.py`) shows match method:
```
from_file,to_file,old_name,new_name,status,match_method
csrankings-j.csv,csrankings-j.csv,John Smith,John Smith 0001,rename,orcid
```

### Maintaining orcid.csv

When names change, `util/update-new-names.py` automatically updates `orcid.csv`:
- Renames entry from old name to new name
- Preserves the ORCID value
- Creates backup before modifying

### Building orcid.csv from Scratch

```bash
# Full rebuild (DBLP + ORCID API, ~45 minutes)
python3 util/build-orcid-csv.py --include-old

# Quick rebuild (DBLP only, ~1 minute)
python3 util/build-orcid-csv.py --skip-api --include-old
```

The build process:
1. Extracts ORCIDs from DBLP XML (~42% of faculty)
2. Queries ORCID API for remaining faculty
3. Verifies API results by matching affiliation to institution
4. Adds placeholder for unverified/unfound faculty

## File Structure
```
src/                   # TypeScript source (modular)
  app.ts               # Main entry point
  checkbox.ts          # Checkbox management
  computation.ts       # Ranking computation
  config.ts            # Area configuration
  data-loader.ts       # CSV loading
  event-handlers.ts    # UI events
  navigation.ts        # Routing
  rendering.ts         # HTML generation
  region.ts            # Region filtering
  submit.ts            # Faculty submission form
  types.ts             # Type definitions
  utils.ts             # Utilities
  verification.ts      # Incremental verification
submit/                # Faculty submission form
  index.html           # Form page
  submit.js            # Compiled from src/submit.ts
  submit.css           # Form styles
csrankings.js          # Compiled JavaScript (bundled)
csrankings.min.js      # Minified for production
index.html             # Main page
tsconfig.json          # TypeScript config
Makefile               # Build automation
generated-author-info.csv  # Publication data (~15MB, ~50k records)
csrankings.csv         # Author info (~2.9MB)
orcid.csv              # Faculty name -> ORCID mapping (~31k entries)
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
  new-name-detector.py # Detect DBLP name changes (with ORCID)
  update-new-names.py  # Apply name changes (ORCID-based matching)
  build-orcid-csv.py   # Build orcid.csv from DBLP + ORCID API
  filter-dblp.py       # Filter DBLP XML to CSRankings venues
  ...                  # Other data processing scripts
typescript/            # Type definitions
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

## Resolving PR Conflicts

PRs that add faculty entries may have merge conflicts when the target CSV files have been modified. Here's how to resolve them manually.

### CSV File Format
Faculty entries are stored in alphabetically-split CSV files:
- `csrankings-a.csv` through `csrankings-z.csv` (by first letter of first name)
- Format: `Name,Institution,URL,GoogleScholarID`
- Example: `John Smith,MIT,https://example.com/jsmith,abc123AAAAJ`

### Alphabetical Ordering Rules
- Entries are sorted alphabetically by **full name** (first name, then last name)
- Sorting is case-sensitive ASCII order
- Disambiguation numbers (e.g., "0001") are part of the name
- Example order: `Ali Ahmad` < `Ali Ismail` < `Amir Abbas`

### Resolving Batch Faculty Additions
1. **Extract new entries from PR diff:**
   ```bash
   gh pr diff <PR_NUMBER> | grep "^+" | grep -v "^+++" | sed 's/^+//'
   ```

2. **Check for existing entries** (to avoid duplicates):
   ```bash
   grep "InstitutionName" csrankings-*.csv
   ```

3. **Verify institution exists** in `institutions.csv`:
   ```bash
   grep "InstitutionAbbrev" institutions.csv
   ```
   - If not present, the institution must be added first (format: `Name,region,countrycode`)

4. **Add entries alphabetically** to appropriate `csrankings-X.csv` files:
   - Use `grep -n "^FirstFewChars" csrankings-X.csv` to find insertion point
   - Read context around insertion point to verify correct position
   - Insert new entry maintaining alphabetical order

5. **Commit and close PR:**
   ```bash
   git add csrankings-*.csv
   git commit -m "Add [Institution] faculty (#PR_NUMBER)"
   git pull --rebase origin gh-pages
   git push origin gh-pages
   gh pr close <PR_NUMBER>
   ```

### Handling Affiliation Changes
When a faculty member changes institutions:
- **REPLACE** the old entry with the new one (same name, new institution/URL)
- **DO NOT** create duplicate entries for the same person
- The name must match exactly (including disambiguation numbers)

### Common Issues
- **Non-breaking spaces**: Some entries may contain UTF-8 non-breaking spaces (0xC2 0xA0) instead of regular spaces. Use `sed` if Edit tool fails to match.
- **Push rejected**: If remote has new commits, use `git pull --rebase origin gh-pages` before pushing.
- **Corrupted PR diffs**: If diff shows entire file rewrite, extract entries by grepping for institution name.

### Workflow Summary
```bash
# 1. View PR diff
gh pr diff <PR_NUMBER>

# 2. Check for conflicts/existing entries
grep "InstitutionName" csrankings-*.csv

# 3. Add entries to appropriate files (manually or via Edit)

# 4. Commit, sync, and close
git add csrankings-*.csv
git commit -m "Add [description] (#PR_NUMBER)"
git pull --rebase origin gh-pages
git push origin gh-pages
gh pr close <PR_NUMBER>
```

## Maintaining Institution Homepages

The `institutions.csv` file contains CS department homepage URLs for each institution. These URLs are displayed when users click on institution names.

### File Format
```csv
institution,region,countryabbrv,homepage
MIT,northamerica,us,https://www.eecs.mit.edu/
University of Oxford,europe,gb,https://www.cs.ox.ac.uk/
```

### Common URL Issues

**Problem**: Many entries point to main university homepages instead of CS department pages.

**Signs of incorrect URLs:**
- URL is just `https://www.university.edu` (no path)
- URL contains `staff.`, `people.`, `homepage.`, or `avesis.`
- URL points to a different department (e.g., ECE instead of CS)

**Correct URLs should point to:**
- Department of Computer Science
- School of Computing
- Faculty of Informatics
- College of Computing
- Or equivalent CS-specific page

### Finding Correct URLs

Search for: `"[University Name] computer science department homepage"`

Common patterns by country:
- **US**: `cs.university.edu` or `www.cs.university.edu`
- **UK**: `www.university.ac.uk/computer-science` or `cs.university.ac.uk`
- **Germany**: `informatik.uni-xxx.de` or `www.uni-xxx.de/informatik`
- **India (IITs)**: `cse.iitX.ac.in` or `www.cse.iitX.ac.in`
- **China**: `cs.university.edu.cn`
- **Japan**: `www.cs.university.ac.jp`

### Preserving Homepage Column

**IMPORTANT**: The `util/clean-csrankings.py` script processes `institutions.csv`. It was updated to preserve the `homepage` column. If the column gets stripped, check that the script includes:

```python
# In clean-csrankings.py around line 98
countryinfo[row["institution"]] = {
    "region": row["region"],
    "countryabbrv": row["countryabbrv"],
    "homepage": row.get("homepage", ""),  # Must include this!
}

# And in the write section around line 106
sfieldnames = ["institution", "region", "countryabbrv", "homepage"]  # Must include homepage!
```

### Batch URL Updates

When updating many URLs, use parallel web searches to find correct CS department pages:
1. Group institutions by region/country
2. Search for official CS department homepages
3. Verify URLs actually work and point to CS departments
4. Update `institutions.csv` with correct URLs

### Universities That Commonly Need Updates

**Renamed/Restructured:**
- Jacobs University Bremen → Constructor University
- ENS Cachan → ENS Paris-Saclay
- Tokyo Institute of Technology → Science Tokyo (transition ongoing)

**Multi-campus systems** (ensure correct campus CS page):
- University of California system
- BITS Pilani (Pilani, Goa, Hyderabad campuses)
- IIT system in India

**Research institutes** (may not have traditional department pages):
- INRIA (France) - use team/center pages
- CWI (Netherlands) - use main institute page
- Max Planck Institutes (Germany)

## Dependencies

### Frontend (JavaScript)
- Papa Parse (CSV parsing)
- Navigo (client-side routing)
- Vega-Lite (charts)
- he (HTML entity encoding)

### Backend/Build (Python)
- **Python 3.13+ recommended** - `util/regenerate_data.py` may crash (exit 139) on older versions
- lxml (`pip install lxml`) - DBLP XML filtering, 2.7x faster than expat

## Dynamic Year Slider

The year range slider automatically updates to show a 10-year range ending with the current year.

### Implementation

Year options are generated dynamically in JavaScript rather than hardcoded in HTML:

```typescript
// src/year-slider.ts
const MAX_YEAR = new Date().getFullYear();
const DEFAULT_FROM_YEAR = MAX_YEAR - 10;
const DEFAULT_TO_YEAR = MAX_YEAR;

export function populateYearSelects(): void {
    // Generates options from 1970 to current year
    // Sets default selection to 10-year range
}
```

**Key files:**
- `src/year-slider.ts` - `populateYearSelects()` generates options dynamically
- `src/app.ts` - Calls `populateYearSelects()` before URL resolution
- `index.html` - Hidden selects are empty, populated by JS

**Why dynamic:**
- Eliminates need to update HTML every January
- In 2026 shows 2016-2026, in 2027 shows 2017-2027 automatically

### URL Parameter Handling

When URL contains year params (e.g., `/fromyear/2020/toyear/2024/index`):
1. `populateYearSelects()` runs first to create `<option>` elements
2. `handleNavigation()` sets select values from URL params
3. `navigation()` triggers `rank()` to recompute with new years

## Repository Size Management

The repository history was cleaned to reduce clone size from ~5GB to ~140MB.

### Files Removed from History

Using `git-filter-repo`:
```bash
git filter-repo --path articles.json --path dblp.xml.gz --path dblp-original.xml.gz \
    --path generated-author-info.csv --path csrankings.csv --invert-paths --force
```

| File | Raw Size in History | Reason |
|------|---------------------|--------|
| `articles.json` | 43 GB | Generated, regenerated monthly |
| `generated-author-info.csv` | 18 GB | Generated from DBLP |
| `csrankings.csv` | 8 GB | Old combined file (now split) |
| `dblp*.xml.gz` | 3 GB | Large data files |

### Current Configuration

- **Git LFS**: `dblp.xml.gz` tracked via LFS (`.gitattributes`)
- **`.gitignore`**: `articles.json`, `dblp-original.xml.gz`, `homepages.csv`, etc.
- **CI regenerates**: `generated-author-info.csv` rebuilt by `make` in CI

### After History Rewrite

All collaborators must re-clone or run:
```bash
git fetch origin
git reset --hard origin/gh-pages
```

### Adding New Institutions

Institution names must not exceed 37 characters (length of "Univ. of Illinois at Urbana-Champaign"). Abbreviate as needed:
- `University` → `Univ.`
- `Institute` → `Inst.`
- `Technology` → `Tech.`
- `Information` → `Info.`
