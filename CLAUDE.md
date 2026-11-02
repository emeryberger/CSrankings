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

## Common Tasks

To add a venue or area, use the `add-venue` skill (`.claude/skills/add-venue/`).

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

## Dependencies

### Backend/Build (Python)

- **Python 3.13+ recommended** - `util/regenerate_data.py` may crash (exit 139) on older versions
- lxml (`pip install lxml`) - DBLP XML filtering, 2.7x faster than expat

## Repository Size Management

The repository history was cleaned (2026-04-14) to reduce clone size from ~11GB to ~400MB. DBLP data is now stored as `dblp.xml.xz` (no LFS); historical versions of large generated files were purged.

- **`.gitignore`**: `articles.json`, `dblp-original.xml.gz`, `homepages.csv`, `faculty-affiliations.csv`, etc. — must never be committed
- **Current DBLP data**: `dblp.xml.xz` (xz-compressed, ~30MB, tracked directly in git)
- **CI regenerates**: `generated-author-info.csv` rebuilt by `make` in CI; only the latest version is retained in history

Institution names must not exceed 37 characters (length of "Univ. of Illinois at Urbana-Champaign"). Abbreviate as needed:
- `University` -> `Univ.`
- `Institute` -> `Inst.`
- `Technology` -> `Tech.`
- `Information` -> `Info.`
