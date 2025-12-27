# generate_diff.py
import os
import json
import requests

def generate_metadata(repo: str, pr_number: str, token: str, output_path: str = "pr_metadata.json") -> None:
    """Fetch PR metadata (title and description) and write to a JSON file."""
    headers = {"Authorization": f"Bearer {token}"}
    pr_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    print(f"Fetching PR metadata: {pr_url}")
    pr_response = requests.get(pr_url, headers=headers)
    pr_response.raise_for_status()
    pr_data = pr_response.json()
    pr_metadata = {
        "title": pr_data.get("title", ""),
        "body": pr_data.get("body", "")
    }
    with open(output_path, "w") as f:
        json.dump(pr_metadata, f, indent=2)

def generate_diff(repo: str, pr_number: str, token: str, output_path: str = "diff.json") -> None:
    headers = {"Authorization": f"Bearer {token}"}
    diff_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"

    print(f"Fetching: {diff_url}")
    response = requests.get(diff_url, headers=headers)
    response.raise_for_status()
    files = response.json()

    output: dict = {"files": []}

    for f in files:
        filename = f["filename"]
        patch = f.get("patch")
        if not patch or not filename.endswith(".csv"):
            continue

        lines = patch.splitlines()
        changes = []

        for line in lines:
            if line.startswith("+") and not line.startswith("+++"):
                changes.append({"type": "AddedLine", "content": line[1:]})
            elif line.startswith("-") and not line.startswith("---"):
                changes.append({"type": "DeletedLine", "content": line[1:]})

        if changes:
            output["files"].append({
                "path": filename,
                "chunks": [{"changes": changes}]
            })

    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)


if __name__ == "__main__":
    repo = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ["GITHUB_EVENT_NUMBER"]
    token = os.environ["GITHUB_TOKEN"]
    generate_diff(repo, pr_number, token)
    generate_metadata(repo, pr_number, token)
