#!/usr/bin/env python3
"""Tell the maintainer about GitHub Actions runs that did not succeed.

Runs from .github/workflows/ci-failure-mail.yml on a workflow_run event. No mail
credentials are involved: it opens an issue that mentions the repository owner, and
GitHub sends the email. Each workflow has at most one open issue. Further failures
comment on it, and the workflow's next success closes it.

It uses only the standard library, so it needs no install step that could itself
break. The run's title can come from a pull request, so it is untrusted.
"""

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any, Callable, Dict, List, Optional

LABEL = "ci-failure"

Api = Callable[[str, str, Optional[Dict]], Any]

# A run with one of these conclusions is always reported.
_FAILED = frozenset({"failure", "timed_out", "startup_failure"})

# These workflows are routinely cancelled when a newer run supersedes an older one
# (194 of 239 pages runs and 60 of 307 validation runs over six weeks of history).
# Elsewhere a cancellation is news: the monthly DBLP update has been OOM-killed,
# and that surfaces as a cancelled job.
_ROUTINE_CANCELLATIONS = frozenset({"Commit Validation", "pages build and deployment"})


def should_notify(workflow: str, conclusion: str) -> bool:
    """Return whether a run with this conclusion should be reported."""
    if conclusion in _FAILED:
        return True
    return conclusion == "cancelled" and workflow not in _ROUTINE_CANCELLATIONS


def failed_steps(jobs: List[Dict]) -> List[str]:
    """Describe what went wrong, given the jobs of a run from the GitHub API."""
    lines = []
    for job in jobs:
        if job.get("conclusion") in ("success", "skipped", None):
            continue
        steps = [s["name"] for s in job.get("steps", []) if s.get("conclusion") == "failure"]
        detail = ", ".join(steps) if steps else job["conclusion"]
        lines.append(f"{job['name']}: {detail}")
    return lines


def issue_title(workflow: str) -> str:
    return f"CI failure: {workflow}"


def _inline_code(text: str) -> str:
    """Quote untrusted text so that it cannot mention anyone or add Markdown.

    It also loses any "#", because process-submission.yml treats an open issue whose
    body contains "### Action" as a faculty submission, even inside a code span.
    """
    return "`" + " ".join(text.replace("`", "'").replace("#", "").split()) + "`"


def build_body(run: Dict, details: List[str], owner: str) -> str:
    """Compose the text of the issue or comment for a workflow_run payload."""
    lines = [
        f"@{owner} `{run['name']}` concluded `{run['conclusion']}`.",
        "",
        f"- Run: {run['html_url']}",
        f"- Title: {_inline_code(run.get('display_title', ''))}",
        f"- Event: `{run.get('event', '')}`",
        f"- Commit: `{run.get('head_sha', '')[:9]}`",
        "",
    ]
    if details:
        lines.append("What failed:")
        lines.extend(f"- {_inline_code(detail)}" for detail in details)
    else:
        lines.append("No failed job or step could be identified; see the run.")
    lines.extend(["", "This issue closes itself when the workflow next succeeds."])
    return "\n".join(lines)


def _find_open_issue(api: Api, repo: str, title: str) -> Optional[Dict]:
    issues = api("GET", f"/repos/{repo}/issues?state=open&labels={LABEL}&per_page=100", None)
    return next((issue for issue in issues if issue["title"] == title), None)


def report_failure(api: Api, repo: str, owner: str, run: Dict, details: List[str]) -> None:
    title = issue_title(run["name"])
    body = build_body(run, details, owner)
    existing = _find_open_issue(api, repo, title)
    if existing is not None:
        api("POST", f"/repos/{repo}/issues/{existing['number']}/comments", {"body": body})
        print(f"Commented on issue #{existing['number']}.")
        return
    try:
        api("POST", f"/repos/{repo}/labels", {"name": LABEL, "color": "b60205"})
    except urllib.error.HTTPError as error:
        if error.code != 422:  # 422 means that the label already exists.
            raise
    created = api(
        "POST",
        f"/repos/{repo}/issues",
        {"title": title, "body": body, "labels": [LABEL], "assignees": [owner]},
    )
    print(f"Opened issue #{created['number']}.")


def resolve(api: Api, repo: str, run: Dict) -> None:
    """Close this workflow's open failure issue, if there is one."""
    existing = _find_open_issue(api, repo, issue_title(run["name"]))
    if existing is None:
        print(f"{run['name']} succeeded; no open issue.")
        return
    number = existing["number"]
    api(
        "POST",
        f"/repos/{repo}/issues/{number}/comments",
        {"body": f"`{run['name']}` succeeded: {run['html_url']}. Closing."},
    )
    api("PATCH", f"/repos/{repo}/issues/{number}", {"state": "closed", "state_reason": "completed"})
    print(f"Closed issue #{number}.")


def github_api(token: str, base: str = "https://api.github.com") -> Api:
    def call(method: str, path: str, body: Optional[Dict]) -> Any:
        request = urllib.request.Request(
            base + path,
            method=method,
            data=None if body is None else json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)

    return call


def main() -> int:
    with open(os.environ["GITHUB_EVENT_PATH"], encoding="utf-8") as f:
        run = json.load(f)["workflow_run"]
    api = github_api(os.environ["GITHUB_TOKEN"])
    repo = os.environ["GITHUB_REPOSITORY"]

    if run["conclusion"] == "success":
        resolve(api, repo, run)
    elif should_notify(run["name"], run["conclusion"]):
        # The details are a convenience; losing them must not lose the alert.
        details: List[str] = []
        try:
            jobs = api("GET", f"/repos/{repo}/actions/runs/{run['id']}/jobs?per_page=100", None)
            details = failed_steps(jobs["jobs"])
        except Exception as error:  # noqa: BLE001
            print(f"Could not read the run's jobs: {error}", file=sys.stderr)
        report_failure(api, repo, os.environ["GITHUB_REPOSITORY_OWNER"], run, details)
    else:
        print(f"Not reporting: {run['name']} concluded {run['conclusion']}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
