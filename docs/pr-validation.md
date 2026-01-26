# PR Validation System

The `commit_validation.yml` workflow validates PRs automatically using `validate_commit.py`.

## PR Template

`.github/PULL_REQUEST_TEMPLATE.md` provides a checklist that populates new PR descriptions. Key learnings:

- **Use absolute URLs**: Links in PR templates don't resolve correctly with relative paths. Use full URLs like `https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#anchor`
- **GitHub doesn't support PR forms**: Unlike Issue Forms (YAML-based with required fields), PR templates are markdown-only. Checkboxes are just text that users can ignore.
- **Trigger on `edited`**: The workflow must include `edited` in triggers so validation re-runs when contributors check boxes after initial submission:
  ```yaml
  on:
    pull_request_target:
      types: [opened, synchronize, edited]
  ```

## Programmatic Validation

`validate_commit.py` validates PRs programmatically rather than trusting checkboxes:

| Check | Implementation |
|-------|----------------|
| Author profile | GitHub API check for non-empty `user.name` |
| PR title | Reject generic titles like "Update csrankings-x.csv" |
| One PR per institution | Collect affiliations, fail if >1 (excludes affiliation changes) |
| Allowed files | Only `csrankings-[a-z].csv` or `old/*.csv` |
| Excel corruption | Detect `#NAME?`, `#REF?`, `#VALUE?`, etc. |
| CSV format | No spaces after commas |
| Alphabetical order | Check new entries against neighbors in file |
| DBLP match | Query DBLP API for name |
| Homepage | Fetch and check for name/affiliation |
| Google Scholar | Validate 12-char ID format, fetch page |
| New institution | Provide guidance to open issue first |

## Checkbox References

Error messages include footnote references (e.g., `[^5]`) that map to the PR template, helping contributors understand which requirement failed:
```
[^5] Excel corruption detected: found '#NAME?' in line.
[^7] 'Jane Smith' should come before 'John Doe' (alphabetically)
```

## Affiliation Changes

The one-PR-per-institution check correctly handles affiliation changes by detecting when a name appears in both deleted and added lines:
```python
if name_normalized in deleted_names:
    affiliation_changes.append(name)  # Don't count toward institution check
else:
    all_affiliations.add(affiliation)
```

## Files Involved

- `.github/PULL_REQUEST_TEMPLATE.md` - Checklist with footnotes
- `CONTRIBUTING.md` - Detailed explanations with anchor IDs
- `validate_commit.py` - Programmatic validation logic
- `generate_diff.py` - Fetches PR metadata including author info

## See Also

- [pr-conflicts.md](pr-conflicts.md) - Resolving PR conflicts manually
- [submission-form.md](submission-form.md) - Faculty submission form (alternative to PRs)
