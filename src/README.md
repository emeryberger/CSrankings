# CSRankings Source Files

This directory contains the modular TypeScript source files for CSRankings. All files use the `CSRankings` namespace and are compiled into a single `csrankings.js` output file.

## File Structure

| File | Lines | Purpose |
|------|-------|---------|
| `types.ts` | ~110 | Interface definitions (AuthorInfo, Author, AreaMap, IncrementalCache, LazyRenderData, etc.) |
| `config.ts` | ~280 | Static configuration maps (parentMap, childMap, nextTier, areaMap, regions, noteMap) and constants |
| `utils.ts` | ~115 | Pure utility functions (sum, average, stddev, translateNameToDBLP, compareNames, makePrologue) |
| `data-loader.ts` | ~130 | CSV loading functions (loadTuring, loadACMFellow, loadCountryInfo, loadAuthors, etc.) |
| `region.ts` | ~60 | Region filtering (inRegion function for geographic filtering) |
| `computation.ts` | ~350 | Core ranking algorithms (buildIncrementalCache, buildDepartments, computeStats, countAuthorAreas) |
| `verification.ts` | ~95 | Debug helpers (deepEqual, verifyIncrementalResults) |
| `rendering.ts` | ~370 | HTML generation (buildFacultyHTML, buildOutputString, makeChart with Vega specs) |
| `continents.ts` | ~70 | Continent/country data for region filtering |
| `checkbox.ts` | ~170 | Checkbox state management (refreshCheckboxCache, updateWeightsFromCache, activateFieldSet, handleParentCheckboxClick, handleChildCheckboxClick) |
| `navigation.ts` | ~260 | URL handling and routing (buildURLString, buildFullURL, handleNavigation, clearNonSubsetted, subsetting, geoCheck) |
| `event-handlers.ts` | ~115 | DOM event listener setup (addDropdownListeners, addAreaWidgetListeners, addCheckboxListeners, addGroupSelectorListeners) |
| `app.ts` | ~680 | Main App class with instance state and public API methods |

## Build

All files are compiled together using TypeScript namespaces:

```bash
tsc --project tsconfig.json
```

This produces a single `csrankings.js` file in the project root.

## Module Pattern

Each file follows the namespace pattern:

```typescript
namespace CSRankings {
    export interface SomeInterface { ... }
    export function someFunction() { ... }
    export const someConstant = ...;
}
```

The App class (in `app.ts`) is the main entry point:

```typescript
namespace CSRankings {
    export class App { ... }
}

var csr: CSRankings.App = new CSRankings.App();
```

## Dependencies Between Files

Files must be listed in dependency order in `tsconfig.json`:

1. `types.ts` - No dependencies (interfaces only)
2. `config.ts` - Depends on types
3. `utils.ts` - Depends on config (for areaMap, parentMap)
4. `data-loader.ts` - Depends on types, config, utils
5. `region.ts` - Depends on types, config
6. `computation.ts` - Depends on types, config, region
7. `verification.ts` - Depends on types
8. `rendering.ts` - Depends on types, config, utils, computation
9. `continents.ts` - Standalone data
10. `checkbox.ts` - Depends on config (for areas, parentMap, childMap, nextTier)
11. `navigation.ts` - Depends on config, checkbox, continents
12. `event-handlers.ts` - Depends on config, checkbox
13. `app.ts` - Depends on all above modules
