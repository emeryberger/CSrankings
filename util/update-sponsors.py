#!/usr/bin/env python3
"""
Fetch GitHub sponsors for CSrankings and update sponsors.json.

Requires a GitHub token with read:org scope.
Set GITHUB_TOKEN environment variable or pass via --token.

Usage:
    python3 util/update-sponsors.py
    python3 util/update-sponsors.py --token ghp_xxxxx
"""

import json
import os
import sys
import argparse
from datetime import datetime

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip install requests")
    sys.exit(1)

GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
SPONSORS_FILE = "sponsors.json"

# GraphQL query to fetch sponsors
SPONSORS_QUERY = """
query($org: String!, $cursor: String) {
  organization(login: $org) {
    sponsorshipsAsMaintainer(first: 100, after: $cursor, includePrivate: false) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        sponsorEntity {
          ... on User {
            login
            avatarUrl
            url
          }
          ... on Organization {
            login
            avatarUrl
            url
          }
        }
      }
    }
  }
}
"""

def fetch_sponsors(token: str, org: str = "CSrankings") -> list:
    """Fetch all sponsors for the given organization or user."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    sponsors = []
    cursor = None

    # Try organization first, then user
    for query_type in ["organization", "user"]:
        query = SPONSORS_QUERY.replace("organization(login:", f"{query_type}(login:")
        cursor = None
        sponsors = []

        print(f"Trying {query_type} query for '{org}'...")

        while True:
            variables = {"org": org, "cursor": cursor}
            response = requests.post(
                GITHUB_GRAPHQL_URL,
                headers=headers,
                json={"query": query, "variables": variables}
            )

            print(f"API response status: {response.status_code}")

            if response.status_code != 200:
                print(f"Error: GitHub API returned {response.status_code}")
                print(response.text)
                break

            data = response.json()
            print(f"Response data keys: {data.keys()}")

            if "errors" in data:
                print(f"GraphQL errors: {data['errors']}")
                break

            entity_data = data.get("data", {}).get(query_type)
            if not entity_data:
                print(f"No {query_type} data found")
                break

            sponsorships = entity_data.get("sponsorshipsAsMaintainer")
            if not sponsorships:
                print(f"No sponsorshipsAsMaintainer field found")
                break

            print(f"Found {len(sponsorships.get('nodes', []))} sponsorship nodes")

            for node in sponsorships["nodes"]:
                entity = node.get("sponsorEntity")
                if entity:  # Can be null for private sponsors
                    sponsors.append({
                        "login": entity["login"],
                        "avatar_url": entity["avatarUrl"] + "&s=60",
                        "html_url": entity["url"]
                    })

            if not sponsorships["pageInfo"]["hasNextPage"]:
                break
            cursor = sponsorships["pageInfo"]["endCursor"]

        # If we found sponsors, stop trying
        if sponsors:
            print(f"Success with {query_type} query!")
            break

    return sponsors

def main():
    parser = argparse.ArgumentParser(description="Update sponsors.json from GitHub")
    parser.add_argument("--token", help="GitHub token (or set GITHUB_TOKEN env var)")
    parser.add_argument("--dry-run", action="store_true", help="Print sponsors without saving")
    args = parser.parse_args()

    token = args.token or os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: GitHub token required. Set GITHUB_TOKEN or use --token")
        sys.exit(1)

    print("Fetching sponsors from GitHub...")
    sponsors = fetch_sponsors(token)

    print(f"Found {len(sponsors)} public sponsors")

    if args.dry_run:
        for s in sponsors:
            print(f"  - {s['login']}")
        return

    # Don't overwrite with empty list - something went wrong
    if len(sponsors) == 0:
        print("WARNING: No sponsors found. This likely means the token lacks permissions.")
        print("The token needs 'read:org' scope to read sponsor data.")
        print("NOT updating sponsors.json to preserve existing data.")
        sys.exit(0)  # Exit successfully to not fail the workflow

    # Save to file
    output = {
        "sponsors": sponsors,
        "lastUpdated": datetime.now().strftime("%Y-%m-%d")
    }

    with open(SPONSORS_FILE, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Saved {len(sponsors)} sponsors to {SPONSORS_FILE}")

if __name__ == "__main__":
    main()
