# generate_diff.py
import os
import json
import requests

def generate_diff(repo: str, pr_number: str, token: str, output_path: str = "diff.json") -> None:
    headers = {"Authorization": f"Bearer {token}"}
    diff_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"

    print(f"Fetching: {diff_url}")
    response = requests.get(diff_url, headers=headers)
    response.raise_for_status()
    files = response.json()

    output = {"files": []}

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
