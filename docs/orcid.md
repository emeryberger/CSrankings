# ORCID Integration

ORCID (Open Researcher and Contributor ID) provides unique identifiers for researchers. CSRankings uses ORCIDs for reliable faculty identification.

## orcid.csv

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

## Data Sources

ORCIDs are collected from two sources:
1. **DBLP** (primary): Extracted from `<author orcid="...">` tags in DBLP XML
2. **ORCID API** (secondary): Queried for faculty not in DBLP, verified by affiliation matching

## ORCID-Based Name Matching

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

## Output Format

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

## Maintaining orcid.csv

When names change, `util/update-new-names.py` automatically updates `orcid.csv`:
- Renames entry from old name to new name
- Preserves the ORCID value
- Creates backup before modifying

## Building orcid.csv from Scratch

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

## See Also

- [dblp.md](dblp.md) - DBLP processing and name updates
