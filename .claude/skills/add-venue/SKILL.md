---
name: add-venue
description: Add a new conference or research area to CSRankings. Use when adding a venue to an existing area, adding a brand-new area, or wiring a venue into parentMap/areaMap/nextTier, the index.html checkboxes, and filter.xq.
---

# Adding a conference or area to CSRankings

Both procedures touch several files that must stay in sync. Missing one leaves
the venue half-registered: it may appear in the UI but contribute no
publications, or count publications but never show up as a filter.

## Adding a New Conference

1. Add to `parentMap` with parent area
2. Add to `areaMap` array with display title
3. If next-tier, add to `nextTier` object
4. Add checkbox in `index.html` under appropriate parent
5. Add venue to `filter.xq` ($booktitles for conferences, $journals for journal articles)

## Adding a New Area

1. Add to `areaMap` array
2. Add to appropriate category array (aiAreas, systemsAreas, theoryAreas, interdisciplinaryAreas)
3. Create `childMap` entry if it has child conferences
4. Add UI elements in `index.html`

## Notes

- The area/venue maps live in `src/config.ts`; `filter.xq` is the DBLP-side
  venue filter, so a venue missing there yields zero publications no matter how
  the UI is configured.
- After changing `filter.xq`, publication data must be regenerated for the
  change to take effect — see [docs/dblp.md](../../../docs/dblp.md).
