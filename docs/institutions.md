# Institution Management

This document covers managing institutions in CSRankings, including homepage URLs, adding new institutions, and processing institution requests.

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
- Jacobs University Bremen -> Constructor University
- ENS Cachan -> ENS Paris-Saclay
- Tokyo Institute of Technology -> Science Tokyo (transition ongoing)

**Multi-campus systems** (ensure correct campus CS page):
- University of California system
- BITS Pilani (Pilani, Goa, Hyderabad campuses)
- IIT system in India

**Research institutes** (may not have traditional department pages):
- INRIA (France) - use team/center pages
- CWI (Netherlands) - use main institute page
- Max Planck Institutes (Germany)

## Adding New Institutions

Institution names must not exceed 37 characters (length of "Univ. of Illinois at Urbana-Champaign"). Abbreviate as needed:
- `University` -> `Univ.`
- `Institute` -> `Inst.`
- `Technology` -> `Tech.`
- `Information` -> `Info.`

## Processing "Add Institution" Issues

This workflow processes GitHub issues requesting new institutions be added to `institutions.csv`.

### Quick Command

```
Process institution issues
```

### Step-by-Step Workflow

**1. List open institution request issues:**
```bash
gh issue list --search "to the list of institutions" --state open --json number,title
```

**2. For each issue, view the details:**
```bash
gh issue view <NUMBER> --json body,title,number
```

**3. Extract required fields from issue body:**
- **Institution name**: From "Full institution name" field
- **Region**: From "Region" field (lowercase: northamerica, southamerica, europe, asia, australasia, africa)
- **Country**: From "Country" field - convert to 2-letter ISO code (lookup in `countries.csv`)
- **Homepage**: From "CS Department homepage URL" field

**4. Look up country code:**
```bash
grep -i "CountryName" countries.csv
# Use the alpha_2 column (lowercase)
```

Common country codes:
| Country | Code |
|---------|------|
| China | cn |
| Taiwan | tw |
| USA | us |
| UK | gb |
| Germany | de |
| France | fr |
| Japan | jp |
| South Korea | kr |
| India | in |
| Canada | ca |
| Australia | au |
| Brazil | br |
| Israel | il |
| Singapore | sg |
| Netherlands | nl |
| Switzerland | ch |
| Spain | es |
| Italy | it |

**5. Check if institution already exists:**
```bash
grep -i "PartOfInstitutionName" institutions.csv
```

**6. Find alphabetical insertion point:**
```bash
# Find where the new entry should go alphabetically
grep -n "^[A-Za-z]" institutions.csv | grep -i "^.*:S"  # For names starting with 'S'
```

**7. Abbreviate name if > 37 characters:**
- `University` -> `Univ.`
- `Institute` -> `Inst.`
- `Technology` -> `Tech.`
- `Information` -> `Info.`

**8. Add entry to institutions.csv:**
Format: `name,region,countrycode,homepage`

Example:
```
South China Univ. of Technology,asia,cn,https://www2.scut.edu.cn/ft/
```

**9. Verify alphabetical order:**
```bash
# Check surrounding entries
grep -n -B2 -A2 "NewInstitutionName" institutions.csv
```

**10. Comment and close the issue:**
```bash
gh issue comment <NUMBER> --body "Added to institutions.csv. You may now submit a PR with the CS faculty."
gh issue close <NUMBER>
```

**11. Commit changes:**
```bash
git add institutions.csv
git commit -m "Add [Institution Name] to institutions (#ISSUE_NUMBER)"
git pull --rebase origin gh-pages
git push origin gh-pages
```

### Batch Processing Example

Process multiple issues at once:

```bash
# List all open issues
gh issue list --search "to the list of institutions" --state open --json number,title

# Process each (Claude will iterate through these)
# For each issue: extract info, add to CSV, comment, close

# Single commit for all additions
git add institutions.csv
git commit -m "Add institutions: [List] (closes #N1, #N2, #N3)"
git pull --rebase origin gh-pages
git push origin gh-pages
```

### Validation Checklist

- [ ] Institution name <= 37 characters (abbreviate if needed)
- [ ] Region is valid (northamerica, southamerica, europe, asia, australasia, africa)
- [ ] Country code is 2-letter lowercase ISO code
- [ ] Homepage URL is CS department page (not main university page)
- [ ] Entry is inserted in alphabetical order
- [ ] No duplicate entry exists

## See Also

- [pr-conflicts.md](pr-conflicts.md) - Resolving PR conflicts
- [submission-form.md](submission-form.md) - Faculty submission form
