# Faculty Submission Form

A self-service web form at `/submit/` allows faculty to submit CSRankings entries without manual PR creation.

## Architecture

```
User fills form -> GitHub Issue -> GitHub Action -> Pull Request
      |                               |
 Client-side validation        Server-side validation
 - DBLP name check             - validate_submission.py
 - Homepage accessibility      - Full DBLP verification
 - Institution autocomplete    - Homepage content check
 - Scholar ID format           - Duplicate detection
 - ORCID format                - ORCID validation
```

**No OAuth required** - uses GitHub Issue creation which requires only a GitHub login.

## Files

| File | Purpose |
|------|---------|
| `src/submit.ts` | TypeScript form implementation (~1800 lines) |
| `submit/submit.js` | Compiled JavaScript |
| `submit/index.html` | Form page (Bootstrap 3) |
| `submit/submit.css` | Form styles |
| `util/validate_submission.py` | Server-side validation |
| `.github/workflows/process-submission.yml` | Issue -> PR automation |
| `.github/ISSUE_TEMPLATE/new-institution.md` | New institution request template |

## Three Action Modes

- **Add**: New faculty with eligibility checkboxes, optional ORCID
- **Update**: Search existing entry, modify institution/homepage/scholar ID/ORCID/DBLP name
- **Remove**: Search existing entry, select reason (retired, industry, deceased, etc.)

## ORCID Field

The form includes an optional ORCID field:
- **Format**: `0000-0000-0000-0000` (16 digits with dashes)
- **Placeholder**: `0000-0000-0000-0000` used when no ORCID is provided
- **Search link**: "Search ORCID for your name" link appears when name is entered
- **Validation**: Format validated client-side and server-side

## DBLP Disambiguation Suffixes

When DBLP has multiple authors with the same name, they add numeric suffixes like "0001". The update workflow supports adding these:

- **"New DBLP Name" field**: Only appears in update mode when selected entry lacks a 4-digit suffix
- **Validation**: New name is checked against DBLP API before submission
- **Detection**: `hasDisambiguationSuffix()` checks for 4-digit suffix at end of name

```typescript
function hasDisambiguationSuffix(name: string): boolean {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return false;
    const lastPart = parts[parts.length - 1];
    return /^\d{4}$/.test(lastPart);
}
```

Example: User selects "Christian Schilling", enters "Christian Schilling 0001" as new name.

## Institution Autocomplete Features

- **Fuzzy matching**: `University` <-> `Univ.`, `Institute` <-> `Inst.`, etc.
- **Acronym support**: 150+ acronyms including:
  - Generic U? two-letter (UA-UZ): `UT` -> all UT schools, `UC` -> all UC schools
  - Specific: MIT, CMU, UIUC, UCLA, ETH, EPFL, NUS, etc.
- **Priority ordering**: Primary institution shown first (e.g., UT -> UT Austin first)
- **Country flags**: Shows flag emoji based on institution's country code

**Acronym configuration** in `src/submit.ts`:
```typescript
// Two-letter acronyms match multiple institutions
const ACRONYM_MAP: Record<string, string[]> = {
    'ut': ['university of texas', 'texas at', 'university of tennessee', ...],
    'uc': ['univ. of california', 'california -', ...],
    ...
};

// Primary institution shown first in results
const ACRONYM_PRIMARY: Record<string, string | string[]> = {
    'ut': 'University of Texas at Austin',
    'uc': 'california -',  // Pattern matches all UC schools
    'uw': ['University of Washington', 'Wisconsin'],  // Multiple primaries
    ...
};
```

## Key Implementation Notes

**Issue body format** - The GitHub Action parses the `### Action` field:
```markdown
### Action
Add new faculty entry

### Name (as it appears in DBLP)
...
```
**Critical**: Don't use GitHub issue templates with the `template` URL parameter - it overrides the `body` parameter and the Action field gets lost.

**Hidden required fields** - When switching between Add/Update/Remove modes, toggle `required` attribute on hidden fields (like eligibility checkboxes) to prevent browser validation errors:
```typescript
document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
    (cb as HTMLInputElement).required = action === 'add';
});
```

**Name validation on blur** - For Update/Remove modes, auto-select entry if typed name exactly matches:
```typescript
nameInput.addEventListener('blur', () => {
    if (currentAction !== 'add') {
        validateNameForUpdateRemove();  // Auto-selects if exact match
    }
});
```

**Unicode symbols** - Using Unicode instead of Bootstrap glyphicons for status indicators:
- Check mark (`&#10003;`) - Valid/success
- X mark (`&#10007;`) - Error
- Warning (`&#9888;`) - Warning
- Refresh (`&#8635;`) - Loading/spinning

**Fuzzy matching regex** - Abbreviations ending with `.` need special handling:
```typescript
// \b word boundary doesn't work after punctuation
// Use lookahead instead: (?=\s|$)
const regex = abbrev.endsWith('.')
    ? new RegExp(`\\b${escapedAbbrev}(?=\\s|$)`, 'gi')
    : new RegExp(`\\b${escapedAbbrev}\\b`, 'gi');
```

**DBLP API**:
- Endpoint: `https://dblp.org/search/author/api?q=author%3A{query}$%3A&format=json`
- Debounced at 500ms to avoid rate limiting

**Homepage CORS**: Most academic sites block CORS. Show warning but don't block submission - server-side validation will verify.

**Google Scholar ID format**: 12 characters ending in `C` or `J`, or `NOSCHOLARPAGE`.

**ORCID format**: `0000-0000-0000-000X` where X is 0-9 or X (checksum digit). Placeholder `0000-0000-0000-0000` for no ORCID.

**CSV parsing**: Uses header-based parsing (`Papa.parse` with `header: true`) to access fields by name, handling varying column orders (e.g., `old/industry.csv` has extra `company` column).

## Build Commands

```bash
# Compile submit form only
make submit/submit.js

# Or manually
tsc src/submit.ts --target es6 --lib es2017,dom --outDir submit --skipLibCheck
```

## Workflow Processing

The `process-submission.yml` workflow:
1. Runs hourly via cron (also manual trigger)
2. Finds issues with title prefix `[CSrankings form submission]`
3. Parses `### Action` field to determine action type (add/update/remove/reinstate)
4. Validates fields and checks institution exists
5. Creates branch, commits CSV change, opens PR
6. Triggers `commit_validation.yml` on the new PR
7. Comments on issue with result

**Required permissions**:
```yaml
permissions:
  contents: write      # Create branches and commits
  issues: write        # Comment on issues, add labels
  pull-requests: write # Create PRs
  actions: write       # Trigger validation workflow
```

**Triggering validation**: PRs created by `GITHUB_TOKEN` don't trigger other workflows automatically. The workflow explicitly calls `workflow_dispatch`:
```javascript
await github.rest.actions.createWorkflowDispatch({
    workflow_id: 'commit_validation.yml',
    ref: 'gh-pages',
    inputs: { pr_number: String(pr.number) }
});
```

**Submitter attribution**: The workflow gives credit to the person who submitted the issue:
- Commit messages include `Co-Authored-By: username <username@users.noreply.github.com>`
- PR bodies include `Submitted by @username` with a clickable mention
- The submitter's GitHub username is extracted from `issue.user.login`

## Update Action Logic

For update submissions, the workflow must find the existing entry to replace it. **Critical**: When the name is changing (e.g., adding a DBLP disambiguation suffix), the workflow searches using the **old name** from the `### Old Entry` field, not the `### Name` field.

```javascript
// Extract old name from Old Entry field (for DBLP name changes)
let searchName = name;  // Default to Name field
if (oldEntryText) {
    const [oldName] = oldEntryText.split(',').map(s => s.trim());
    if (oldName) searchName = oldName;  // Use old name for search
}
```

This is essential for DBLP disambiguation suffix updates like:
- Old: `Christian Schilling,Aalborg University,...`
- New: `Christian Schilling 0001,Aalborg University,...`

The workflow correctly searches for "Christian Schilling" (old name) rather than "Christian Schilling 0001" (new name that doesn't exist yet).

## Reinstatement Action Logic

Reinstatements (moving faculty from `old/` back to active) can come through **two different submission paths**:

| Path | Source | Field Format |
|------|--------|--------------|
| Add-style | `createAddIssueUrl` with `existingOldEntry` | Explicit `### Institution`, `### Homepage URL`, `### Google Scholar ID` fields |
| Update-style | `createUpdateIssueUrl` with `isOld=true` | Fields embedded in `### New Entry` CSV format |

**The workflow handles both**:
1. First tries to parse explicit fields (`Institution`, `Homepage URL`, etc.)
2. If missing and action is `reinstate`, falls back to parsing `### New Entry` CSV:
   ```javascript
   if (action === 'reinstate' && (!institution || !homepage || !scholarid)) {
       const newEntryText = parseField(body, 'New Entry');
       const parts = newEntryText.split(',');
       // CSV format: name,institution,homepage,scholarid,orcid
       institution = parts[1]; homepage = parts[2]; scholarid = parts[3];
   }
   ```

**Old file removal**: The workflow also removes the entry from the source `old/` file (e.g., `old/industry.csv`). The source file is found via:
- `### Source File` field (update-style reinstatements)
- `### Previous Entry (from ...)` section (add-style reinstatements)

## Reprocessing Failed Submissions

If a submission fails validation and needs reprocessing after a fix:
1. Remove the `validation-failed` label: `gh issue edit <num> --remove-label validation-failed`
2. Reopen if closed: `gh issue reopen <num>`
3. Trigger workflow: `gh workflow run process-submission.yml`

The workflow only processes issues that are:
- Open (state = open)
- Have title starting with `[CSrankings form submission]`
- Don't have labels: `processed`, `pr-created`, or `validation-failed`

## CSV Line Endings

CSRankings CSV files use CRLF (`\r\n`) line endings. The workflow:
- Reads with `.split(/\r?\n/)` to handle both formats
- Writes with `.join('\r\n')` to maintain CRLF

## See Also

- [pr-validation.md](pr-validation.md) - PR validation system
- [institutions.md](institutions.md) - Adding new institutions
