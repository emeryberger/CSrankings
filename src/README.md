# CSRankings Source Files

This directory contains the modular TypeScript source files for CSRankings. All files use the `CSRankings` namespace and are compiled into a single `csrankings.js` output file.

## File Structure

| File | Lines | Purpose |
|------|-------|---------|
| `types.ts` | ~70 | Interface definitions (AuthorInfo, Author, AreaMap, IncrementalCache, etc.) |
| `config.ts` | ~350 | Static configuration maps (parentMap, childMap, nextTier, areaMap, regions, noteMap) and constants |
| `utils.ts` | ~170 | Pure utility functions (sum, average, stddev, translateNameToDBLP, compareNames, makePrologue) |
| `data-loader.ts` | ~110 | CSV loading functions (loadTuring, loadACMFellow, loadCountryInfo, loadAuthors, etc.) |
| `region.ts` | ~45 | Region filtering (inRegion function for geographic filtering) |
| `computation.ts` | ~400 | Core ranking algorithms (buildIncrementalCache, buildDepartments, computeStats, countAuthorAreas) |
| `verification.ts` | ~85 | Debug helpers (deepEqual, verifyIncrementalResults, setVerifyIncremental) |
| `rendering.ts` | ~400 | HTML generation (buildFacultyHTML, buildOutputString, makeChart with Vega specs) |
| `continents.ts` | ~70 | Continent/country data for region filtering |
| `app.ts` | ~850 | Main App class with instance state, event handlers, and public API methods |

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
4. `data-loader.ts` - Depends on types, config
5. `region.ts` - Depends on types, config
6. `computation.ts` - Depends on types, config, utils
7. `verification.ts` - Depends on types
8. `rendering.ts` - Depends on types, config, utils
9. `continents.ts` - Standalone data
10. `app.ts` - Depends on all above modules
