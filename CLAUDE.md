# CLAUDE.md - CSRankings Project Guide

## Project Overview

CSRankings is a metrics-based ranking of top computer science institutions. The frontend is a single-page application built with TypeScript that displays publication-based rankings with interactive filtering by research area, year, and region.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | Data flow, performance, caching, debugging |
| [docs/ci-cd.md](docs/ci-cd.md) | GitHub Actions workflows, race condition protection |
| [docs/pr-validation.md](docs/pr-validation.md) | PR validation system, template, programmatic checks |
| [docs/submission-form.md](docs/submission-form.md) | Faculty submission form (`/submit/`) |
| [docs/dblp.md](docs/dblp.md) | DBLP processing, filtering, automation |
| [docs/orcid.md](docs/orcid.md) | ORCID integration for name matching |
| [docs/pr-conflicts.md](docs/pr-conflicts.md) | Resolving PR conflicts, CSV format |
| [docs/institutions.md](docs/institutions.md) | Institution management, adding new institutions |
| [docs/ui-learnings.md](docs/ui-learnings.md) | CSS patterns, table structure, UI guidelines |
| [optimizations.md](optimizations.md) | Performance optimization strategies and benchmarks |

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

## Testing

Start a local server:
```bash
python3 -m http.server 8000
# Open http://localhost:8000/index.html
# Open browser console (F12) to see timing logs
```

**Automated testing with pytest:**
```bash
# Run all tests
pytest test/ -v

# Run just the incremental computation tests
pytest test/test_incremental.py -v
```

**Requirements for testing:**
```bash
pip3 install pytest selenium webdriver-manager
```

## File Structure

```
src/                   # TypeScript source (modular)
submit/                # Faculty submission form
csrankings.js          # Compiled JavaScript (bundled)
csrankings.min.js      # Minified for production
index.html             # Main page
tsconfig.json          # TypeScript config
Makefile               # Build automation
generated-author-info.csv  # Publication data (~15MB, ~50k records)
orcid.csv              # Faculty name -> ORCID mapping (~31k entries)
institutions.csv       # Institution regions and homepages
countries.csv          # Country codes
turing.csv             # Turing award winners
acm-fellows.csv        # ACM Fellows
test/                  # Pytest test suite
filter.xq              # XQuery filter for DBLP (venue definitions)
util/                  # Utility scripts
typescript/            # Type definitions
.github/workflows/     # CI/CD workflows
docs/                  # Documentation
```

## Dependencies

### Frontend (JavaScript)

- Papa Parse (CSV parsing)
- Navigo (client-side routing)
- Vega-Lite (charts)
- he (HTML entity encoding)

### Backend/Build (Python)

- **Python 3.13+ recommended** - `util/regenerate_data.py` may crash (exit 139) on older versions
- lxml (`pip install lxml`) - DBLP XML filtering, 2.7x faster than expat

## Repository Size Management

The repository history was cleaned to reduce clone size from ~5GB to ~140MB.

- **Git LFS**: `dblp.xml.gz` tracked via LFS (`.gitattributes`)
- **`.gitignore`**: `articles.json`, `dblp-original.xml.gz`, `homepages.csv`, etc.
- **CI regenerates**: `generated-author-info.csv` rebuilt by `make` in CI

Institution names must not exceed 37 characters (length of "Univ. of Illinois at Urbana-Champaign"). Abbreviate as needed:
- `University` -> `Univ.`
- `Institute` -> `Inst.`
- `Technology` -> `Tech.`
- `Information` -> `Info.`
