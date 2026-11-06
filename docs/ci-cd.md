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
| `.github/workflows/commit_validation.yml` | PR validation, automated `VALIDATION.md` assessment, auto-merge ([details](pr-validation.md#automated-assessment)) |
| `.github/workflows/process-submission.yml` | Issue -> PR automation |
| `.github/workflows/monthly-dblp-update.yml` | Monthly DBLP data refresh |
| `.github/workflows/update-sponsors.yml` | Sponsor logo updates |
| `.github/workflows/stale.yml` | Stale PR management |
| `.github/workflows/ci-failure-mail.yml` | Emails the owner, through a GitHub issue, when a workflow does not succeed |
| `.github/workflows/check-runner-images.yml` | Weekly check that pinned runner images still exist |

## Failure Mail

`ci-failure-mail.yml` runs when any listed workflow completes. For a run that fails, times out or fails to start, `util/notify_ci_failure.py` opens an issue labeled `ci-failure` that mentions and is assigned to the repository owner, so GitHub emails them. No mail credentials are stored, so delivery depends on the owner's [GitHub notification settings](https://github.com/settings/notifications) having email enabled for participating and @mentions. Cancelled runs are also reported, except for `Commit Validation` and `pages build and deployment`, where cancellation is routine.

Each workflow has at most one open issue. Further failures comment on it, and the workflow's next success closes it. A new workflow must be added to the list; `test/test_ci_notifications.py` fails until it is.

To test it, run `Check Runner Images` from the Actions tab with `simulate_failure` set; an issue and an email should appear within a few minutes. Running it again without that option closes the issue. If reporting itself fails, the `CI Failure Mail` run is the only sign, because it does not watch itself.

## Pinned Runner Image

`post-merge-rebuild.yml` pins its jobs to a specific Ubuntu image, because a change of image can remove tools the build needs. `check-runner-images.yml` runs weekly and fails, which is reported like any other failure, if GitHub's [list of images](https://github.com/actions/runner-images) no longer offers a pinned image or marks it deprecated. To move to a new image, change `runs-on` in both jobs and confirm that `make` still passes in the next run. The two alerting workflows stay on `ubuntu-latest` so that they keep running when a pinned image is gone.

## See Also

- [pr-validation.md](pr-validation.md) - PR validation system details
- [submission-form.md](submission-form.md) - Faculty submission form and workflow
