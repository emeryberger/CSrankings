# CI/CD Workflows

This document covers the GitHub Actions workflows used for continuous integration and deployment.

## Main Workflows

GitHub Actions workflow (`.github/workflows/post-merge-rebuild.yml`) runs on push to `gh-pages`:
1. **test job**: Compiles TypeScript, runs pytest with Selenium/Chrome
2. **build-and-commit job**: Runs `make` and auto-commits results (only after tests pass)

## Race Condition Protection

All workflows that push changes include retry logic to handle concurrent pushes:
- **Max retries**: 3 attempts
- **Retry mechanism**: `git pull --rebase` to integrate remote changes before retrying
- **Exponential backoff**: 5s, 10s, 15s delays between retries
- **Workflows protected**: `post-merge-rebuild.yml`, `monthly-dblp-update.yml`, `update-sponsors.yml`

This prevents data loss when multiple PRs are merged in quick succession, ensuring all changes are preserved even if concurrent CI runs occur.

## Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/post-merge-rebuild.yml` | Test + build on push |
| `.github/workflows/commit_validation.yml` | PR validation |
| `.github/workflows/process-submission.yml` | Issue -> PR automation |
| `.github/workflows/monthly-dblp-update.yml` | Monthly DBLP data refresh |
| `.github/workflows/update-sponsors.yml` | Sponsor logo updates |
| `.github/workflows/stale.yml` | Stale PR management |

## See Also

- [pr-validation.md](pr-validation.md) - PR validation system details
- [submission-form.md](submission-form.md) - Faculty submission form and workflow
