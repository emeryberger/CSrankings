#!/usr/bin/env python3
"""Fail if a runner image pinned by a workflow is no longer offered by GitHub.

A job pinned to a removed image does not fail promptly: it can sit queued for a
long time before GitHub gives up on it. Checking GitHub's list of images directly
reports the problem without depending on such a job, and a deprecation marker there
reports it earlier. .github/workflows/check-runner-images.yml runs this on a
schedule; ci-failure-mail.yml reports the failure by email.
"""

import glob
import os
import re
import sys
import urllib.request
from typing import Dict, List, Set

README_URL = "https://raw.githubusercontent.com/actions/runner-images/main/README.md"

_PIN = re.compile(r"^\s*runs-on:\s*[\"']?(ubuntu-\d+\.\d+(?:-arm)?)\b", re.MULTILINE)


def pinned_images(workflow_dir: str) -> Dict[str, List[str]]:
    """Map each pinned image label to the workflow files that use it."""
    pins: Dict[str, List[str]] = {}
    for path in sorted(glob.glob(os.path.join(workflow_dir, "*.yml"))):
        with open(path, encoding="utf-8") as f:
            for label in set(_PIN.findall(f.read())):
                pins.setdefault(label, []).append(os.path.basename(path))
    return pins


def offered_images(readme: str) -> Dict[str, bool]:
    """Map each label in the README's image table to whether it is deprecated."""
    offered: Dict[str, bool] = {}
    for line in readme.splitlines():
        if line.startswith("|"):
            labels: Set[str] = set(re.findall(r"`([^`]+)`", line))
            for label in labels:
                offered[label] = "deprecat" in line.lower()
    return offered


def problems(pins: Dict[str, List[str]], offered: Dict[str, bool]) -> List[str]:
    """Describe each pinned image that is missing or deprecated."""
    # With no pins this check would pass forever without checking anything.
    if not pins:
        return ["No workflow pins an Ubuntu image, so there is nothing to check."]
    found = []
    for label, files in sorted(pins.items()):
        users = ", ".join(files)
        if label not in offered:
            found.append(f"{label} is no longer listed by GitHub (used by {users}).")
        elif offered[label]:
            found.append(f"{label} is marked as deprecated by GitHub (used by {users}).")
    return found


def main() -> int:
    workflow_dir = sys.argv[1] if len(sys.argv) > 1 else ".github/workflows"
    with urllib.request.urlopen(README_URL, timeout=30) as response:
        readme = response.read().decode("utf-8")
    pins = pinned_images(workflow_dir)
    found = problems(pins, offered_images(readme))
    for problem in found:
        print(f"::error::{problem}")
    if found:
        print(f"Images: {README_URL}")
        return 1
    print(f"Still offered: {', '.join(sorted(pins))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
