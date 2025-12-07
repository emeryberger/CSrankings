# CLAUDE.md - CSRankings Project Guide

## Project Overview
CSRankings is a metrics-based ranking of top computer science institutions. The frontend is a single-page application built with TypeScript that displays publication-based rankings with interactive filtering by research area, year, and region.

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

### Data Flow on Checkbox Click
1. Event listener fires → `invalidateCheckboxCache()`
2. Parent/child checkbox synchronization (native DOM)
3. `rank(updateURL)` called
4. `updateWeights()` reads checkbox cache
5. `buildDepartments()` iterates author data
6. `computeStats()` calculates geometric means
7. `buildDropDown()` generates faculty HTML
8. `buildOutputString()` generates ranking table
9. DOM update via `innerHTML`
10. `updatedURL()` updates browser history

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

### Scroll Listener
The scroll listener for lazy loading is added only once using `scrollListenerAdded` flag. Never add scroll listeners inside `rank()` without this guard.

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

### Adding a New Area
1. Add to `areaMap` array
2. Add to appropriate category array (aiAreas, systemsAreas, theoryAreas, interdisciplinaryAreas)
3. Create `childMap` entry if it has child conferences
4. Add UI elements in `index.html`

### Debugging Performance
Console logs show timing:
```
Before render: rank took X milliseconds.
Rank took Y milliseconds.
```
The difference (Y-X) is DOM rendering time.

## File Structure
```
csrankings.ts          # Main TypeScript source
csrankings.js          # Compiled JavaScript
csrankings.min.js      # Minified for production
index.html             # Main page
tsconfig.json          # TypeScript config
Makefile               # Build automation
generated-author-info.csv  # Publication data
institutions.csv       # Institution regions
countries.csv          # Country codes
turing.csv            # Turing award winners
acm-fellows.csv       # ACM Fellows
typescript/           # Type definitions
  jquery.d.ts
  navigo.d.ts
  papaparse.d.ts
  vega-embed.d.ts
  continents.d.ts
  he/index.d.ts
```

## Dependencies
- jQuery (DOM manipulation, some remaining uses)
- Papa Parse (CSV parsing)
- Navigo (client-side routing)
- Vega-Lite (charts)
- he (HTML entity encoding)
