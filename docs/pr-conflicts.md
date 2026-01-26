# Resolving PR Conflicts

PRs that add faculty entries may have merge conflicts when the target CSV files have been modified. Here's how to resolve them manually.

## CSV File Format

Faculty entries are stored in alphabetically-split CSV files:
- `csrankings-a.csv` through `csrankings-z.csv` (by first letter of first name)
- Format: `name,affiliation,homepage,scholarid,orcid` (5 columns)
- Example: `John Smith,MIT,https://example.com/jsmith,abc123AAAAJ,0000-0002-1234-5678`
- ORCID placeholder: `0000-0000-0000-0000` for faculty without known ORCIDs

**Special case - old/industry.csv**: Has 6 columns with an extra `company` field:
- Format: `name,affiliation,homepage,scholarid,company,orcid`

## Alphabetical Ordering Rules

- Entries are sorted alphabetically by **full name** (first name, then last name)
- Sorting is case-sensitive ASCII order
- Disambiguation numbers (e.g., "0001") are part of the name
- Example order: `Ali Ahmad` < `Ali Ismail` < `Amir Abbas`

## Resolving Batch Faculty Additions

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

## Handling Affiliation Changes

When a faculty member changes institutions:
- **REPLACE** the old entry with the new one (same name, new institution/URL)
- **DO NOT** create duplicate entries for the same person
- The name must match exactly (including disambiguation numbers)

## Common Issues

- **Non-breaking spaces**: Some entries may contain UTF-8 non-breaking spaces (0xC2 0xA0) instead of regular spaces. Use `sed` if Edit tool fails to match.
- **Push rejected**: If remote has new commits, use `git pull --rebase origin gh-pages` before pushing.
- **Corrupted PR diffs**: If diff shows entire file rewrite, extract entries by grepping for institution name.

## Workflow Summary

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

## See Also

- [institutions.md](institutions.md) - Adding new institutions
- [pr-validation.md](pr-validation.md) - PR validation system
