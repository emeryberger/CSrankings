# Architecture and Performance

This document covers the detailed architecture, data flow, and performance characteristics of CSRankings.

## Data Flow on Checkbox Click (Incremental)

1. Event listener fires -> `invalidateCheckboxCache()`
2. Parent/child checkbox synchronization (native DOM)
3. `rank(updateURL)` -> `doRank()` called
4. `updateWeights()` reads checkbox cache
5. `buildIncrementalCache()` - only rebuilds if year/region changed
6. `buildDepartmentsIncremental()` - uses cached per-area data (fast!)
7. `computeStats()` calculates geometric means
8. If `VERIFY_INCREMENTAL` is true, runs full computation to verify
9. `buildDropDown()` generates faculty HTML
10. `buildOutputString()` generates ranking table
11. DOM update via `innerHTML`
12. `updatedURL()` updates browser history

## Checkbox Hierarchy

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
- Logs "Incremental computation verified" on success
- Logs detailed errors if mismatch detected
- Set to `false` for production to skip verification overhead

### Key Data Structures

- `this.authors` - Array of ~50k author publication records
- `this.authorAreas` - Map of author/dept -> area -> publication count
- `this.stats` - Computed geometric mean scores per department
- `this.areaDeptAdjustedCount` - Area+dept adjusted publication counts

## Debugging Performance

Console logs show timing:

```
Building incremental cache...           # Only on first load or year/region change
Incremental cache built in X.Xms
Incremental computation took X.Xms      # Fast path using cache
Full computation took X.Xms             # Only if VERIFY_INCREMENTAL=true
Incremental computation verified        # Verification passed
Before render: rank took Xms
Rank took Xms
```

- First number is incremental time, second is full (verification only)
- After cache is built, checkbox clicks should show incremental << full
- The difference between final two is DOM rendering time

**Manual verification from browser console:**
```javascript
csr.setVerifyIncremental(true);  // Enable verification
// Click checkboxes - console will show verification results
csr.setVerifyIncremental(false); // Disable for production
```

## Performance Results

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

## Dynamic Year Slider

The year range slider automatically updates to show a 10-year range ending with the current year.

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

## See Also

- [optimizations.md](../optimizations.md) - Detailed optimization strategies and benchmarks
- [ui-learnings.md](ui-learnings.md) - CSS patterns and UI modification guidelines
