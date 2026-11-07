"""Tests for reporting CI failures and for checking pinned runner images."""

import glob
import json
import os
import re
import sys

import pytest

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
WORKFLOWS = os.path.join(ROOT, ".github", "workflows")
sys.path.insert(0, os.path.join(ROOT, "util"))

import check_runner_images as images  # noqa: E402
import notify_ci_failure as notify  # noqa: E402

RUN = {
    "name": "Run Make and Commit Changes",
    "conclusion": "failure",
    "display_title": "Add a faculty member",
    "event": "push",
    "head_sha": "c7004e02ff297eca33ce33b2a68629a7aaa9ecb7",
    "html_url": "https://github.com/emeryberger/CSrankings/actions/runs/1",
}


@pytest.mark.parametrize("conclusion", ["failure", "timed_out", "startup_failure"])
@pytest.mark.parametrize("workflow", ["Update Sponsors", "pages build and deployment"])
def test_failures_always_notify(workflow, conclusion):
    assert notify.should_notify(workflow, conclusion)


@pytest.mark.parametrize("conclusion", ["success", "skipped", "neutral"])
def test_nonfailures_do_not_notify(conclusion):
    assert not notify.should_notify("Update Sponsors", conclusion)


def test_cancellation_notifies_unless_routine():
    # The monthly update's OOM kills surface as cancellations.
    assert notify.should_notify("Monthly DBLP Update", "cancelled")
    assert not notify.should_notify("pages build and deployment", "cancelled")
    assert not notify.should_notify("Commit Validation", "cancelled")


def test_failed_steps_names_only_what_failed():
    jobs = [
        {"name": "test", "conclusion": "success", "steps": []},
        {"name": "skipped", "conclusion": "skipped", "steps": []},
        {
            "name": "build-and-commit",
            "conclusion": "failure",
            "steps": [
                {"name": "Install dependencies", "conclusion": "success"},
                {"name": "Run make", "conclusion": "failure"},
            ],
        },
        {"name": "never started", "conclusion": "cancelled", "steps": []},
    ]
    assert notify.failed_steps(jobs) == ["build-and-commit: Run make", "never started: cancelled"]


def test_body_mentions_owner_and_links_the_run():
    body = notify.build_body(RUN, ["build: Run make"], "owner")
    assert body.startswith("@owner ")
    assert RUN["html_url"] in body and "build: Run make" in body and "c7004e02f" in body


def test_untrusted_title_cannot_mention_or_format():
    run = dict(RUN, display_title="`x` @someone\n# heading")
    body = notify.build_body(run, [], "owner")
    assert "- Title: `'x' @someone heading`" in body


def test_untrusted_title_cannot_look_like_a_faculty_submission():
    # process-submission.yml picks up any open issue whose body contains this.
    run = dict(RUN, display_title="### Action")
    assert "### Action" not in notify.build_body(run, [], "owner")


class FakeApi:
    """Records calls to the GitHub API, holding the given open issues."""

    def __init__(self, issues=(), label_status=201):
        self.issues = list(issues)
        self.label_status = label_status
        self.calls = []

    def __call__(self, method, path, body):
        self.calls.append((method, path, body))
        if path.endswith("/labels") and self.label_status != 201:
            raise notify.urllib.error.HTTPError(path, self.label_status, "error", None, None)
        if method == "GET":
            return self.issues
        return {"number": 7}

    def writes(self):
        return [call for call in self.calls if call[0] != "GET"]


def test_first_failure_opens_an_assigned_issue():
    api = FakeApi()
    notify.report_failure(api, "o/r", "owner", RUN, [])
    (_, path, body) = api.writes()[-1]
    assert path == "/repos/o/r/issues"
    assert body["title"] == "CI failure: Run Make and Commit Changes"
    assert body["assignees"] == ["owner"] and body["labels"] == [notify.LABEL]
    assert body["body"].startswith("@owner ")


def test_existing_label_does_not_stop_the_alert():
    api = FakeApi(label_status=422)
    notify.report_failure(api, "o/r", "owner", RUN, [])
    assert api.writes()[-1][1] == "/repos/o/r/issues"


def test_other_label_errors_are_not_hidden():
    with pytest.raises(notify.urllib.error.HTTPError):
        notify.report_failure(FakeApi(label_status=403), "o/r", "owner", RUN, [])


def test_repeat_failure_comments_with_a_mention():
    api = FakeApi([{"number": 3, "title": "CI failure: Run Make and Commit Changes"}])
    notify.report_failure(api, "o/r", "owner", RUN, [])
    [(_, path, body)] = api.writes()
    assert path == "/repos/o/r/issues/3/comments"
    assert body["body"].startswith("@owner ")


def test_another_workflows_issue_is_left_alone():
    api = FakeApi([{"number": 3, "title": "CI failure: Update Sponsors"}])
    notify.report_failure(api, "o/r", "owner", RUN, [])
    assert api.writes()[-1][1] == "/repos/o/r/issues"
    api = FakeApi([{"number": 3, "title": "CI failure: Update Sponsors"}])
    notify.resolve(api, "o/r", RUN)
    assert api.writes() == []


def test_success_closes_the_issue():
    api = FakeApi([{"number": 3, "title": "CI failure: Run Make and Commit Changes"}])
    notify.resolve(api, "o/r", RUN)
    (method, path, body) = api.writes()[-1]
    assert (method, path) == ("PATCH", "/repos/o/r/issues/3")
    assert body["state"] == "closed"


@pytest.fixture
def run_main(tmp_path, monkeypatch):
    api = FakeApi()
    monkeypatch.setattr(notify, "github_api", lambda token: api)
    monkeypatch.setenv("GITHUB_TOKEN", "token")
    monkeypatch.setenv("GITHUB_REPOSITORY", "o/r")
    monkeypatch.setenv("GITHUB_REPOSITORY_OWNER", "o")

    def run(event):
        path = tmp_path / "event.json"
        path.write_text(json.dumps({"workflow_run": dict(event, id=1)}))
        monkeypatch.setenv("GITHUB_EVENT_PATH", str(path))
        assert notify.main() == 0
        return api

    return run


def test_main_reports_even_if_job_details_are_unavailable(run_main):
    # FakeApi answers the jobs request with a list, which has no "jobs" entry.
    api = run_main(RUN)
    assert api.writes()[-1][1] == "/repos/o/r/issues"


def test_main_stays_quiet_for_routine_cancellation(run_main):
    api = run_main(dict(RUN, name="Commit Validation", conclusion="cancelled"))
    assert api.calls == []


def test_main_ignores_skipped_runs(run_main):
    assert run_main(dict(RUN, conclusion="skipped")).calls == []


def test_main_on_success_makes_no_writes_without_an_issue(run_main):
    assert run_main(dict(RUN, conclusion="success")).writes() == []


def test_every_workflow_is_watched():
    with open(os.path.join(WORKFLOWS, "ci-failure-mail.yml"), encoding="utf-8") as f:
        text = f.read()
    watched = set(re.findall(r"^      - (.+)$", text.split("types:")[0], re.MULTILINE))
    names = set()
    for path in glob.glob(os.path.join(WORKFLOWS, "*.yml")):
        with open(path, encoding="utf-8") as f:
            names.add(re.search(r"^name:\s*['\"]?(.*?)['\"]?\s*$", f.read(), re.MULTILINE).group(1))
    names.discard("CI Failure Mail")
    # GitHub's own workflow for deploying the site has no file in this repository.
    assert watched == names | {"pages build and deployment"}


def test_rebuild_is_pinned_and_alerting_is_not():
    pins = images.pinned_images(WORKFLOWS)
    assert any("post-merge-rebuild.yml" in files for files in pins.values())
    for files in pins.values():
        assert "ci-failure-mail.yml" not in files
        assert "check-runner-images.yml" not in files


README = """
| Image | Architecture | YAML Label | Included Software |
| Ubuntu 26.04<br>![Badge](https://x) | x64 | `ubuntu-26.04` | [ubuntu-26.04] |
| Ubuntu 24.04 | x64 | `ubuntu-latest` or `ubuntu-24.04` | [ubuntu-24.04] |
| Ubuntu 22.04 (deprecated) | x64 | `ubuntu-22.04` | [ubuntu-22.04] |
Prose mentioning `ubuntu-18.04` outside the table.
"""


def test_offered_images():
    offered = images.offered_images(README)
    assert offered["ubuntu-26.04"] is False
    assert offered["ubuntu-24.04"] is False
    assert offered["ubuntu-latest"] is False
    assert offered["ubuntu-22.04"] is True
    assert "ubuntu-18.04" not in offered


def test_problems_reports_missing_and_deprecated_images():
    offered = images.offered_images(README)
    assert images.problems({"ubuntu-26.04": ["a.yml"]}, offered) == []
    [missing] = images.problems({"ubuntu-18.04": ["a.yml"]}, offered)
    assert "no longer listed" in missing and "a.yml" in missing
    [deprecated] = images.problems({"ubuntu-22.04": ["a.yml"]}, offered)
    assert "deprecated" in deprecated


def test_problems_refuses_to_pass_with_nothing_to_check():
    assert images.problems({}, images.offered_images(README))


def test_pinned_images_ignores_unpinned_jobs(tmp_path):
    (tmp_path / "a.yml").write_text("jobs:\n  x:\n    runs-on: ubuntu-26.04\n  y:\n    runs-on: ubuntu-latest\n")
    (tmp_path / "b.yml").write_text("jobs:\n  x:\n    runs-on: 'ubuntu-26.04'\n")
    assert images.pinned_images(str(tmp_path)) == {"ubuntu-26.04": ["a.yml", "b.yml"]}
