import csv
import fuzzysearch
import json
import os
import re
import sys
import time
import urllib.parse
import requests
import unidecode
import openai

from typing import List, Literal, Optional
from pydantic import HttpUrl, BaseModel, ValidationError

ERROR = chr(0x274C)
WARN = chr(0x26A0) + chr(0xFE0F)
INFO = chr(0x2139) + chr(0xFE0F)
SUCCESS = "\U00002705"

# Import from same directory (add util/ to path when running from repo root)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate_homepage import has_valid_homepage, extract_visible_text_from_webpage

# ---------- Checkbox References ----------
# These map to footnotes in .github/PULL_REQUEST_TEMPLATE.md
# Used in error messages to help contributors understand which requirement failed

CHECKBOX_REFS = {
    "non_anonymous": "[^1]",      # Full name in profile
    "pr_title": "[^2]",           # Descriptive PR title
    "one_pr": "[^3]",             # One PR per institution
    "allowed_files": "[^4]",      # Only modify allowed files
    "no_excel": "[^5]",           # No Excel corruption
    "csv_format": "[^6]",         # No spaces after commas
    "alphabetical": "[^7]",       # Alphabetical order
    "dblp_name": "[^8]",          # DBLP name match
    "homepage": "[^9]",           # Valid homepage
    "scholar_id": "[^10]",        # Valid Google Scholar ID
    "new_institution": "[^14]",   # Open issue first for new institutions
}

# Excel error values that indicate the file was edited with Excel
EXCEL_ERROR_PATTERNS = [
    '#NAME?', '#REF?', '#VALUE?', '#DIV/0!', '#NULL!', '#N/A', '#NUM!',
    '=HYPERLINK(', '=CONCATENATE(', '=IF(',  # Unevaluated formulas
]

# ---------- Models ----------

class AuditEntry(BaseModel):
    name: str
    dblp_name: str
    change: Literal['addition', 'deletion', 'modification']
    classification: Literal['valid', 'invalid', 'questionable']
    explanation: str

class AuditEntryList(BaseModel):
    entries: List[AuditEntry]
    
# ---------- Helpers ----------

def extract_json_from_backquotes(text: str) -> str:
    match = re.search(r"```(?:json)?\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else text

def remove_suffix_and_brackets(s: str) -> str:
    # Remove optional four-digit numeric suffix and optional bracketed suffix, in any order
    return re.sub(r'\s*(\d{4})?\s*(\[[^\]]*\])?$', '', s)

def remove_brackets(s: str) -> str:
    # Remove optional bracketed suffix
    return re.sub(r'\s*\[[^\]]*\]$', '', s)

def has_valid_google_scholar_id(s: str) -> bool:
    """Check if Google Scholar ID has valid format (12 chars ending in J)."""
    return s == 'NOSCHOLARPAGE' or bool(re.fullmatch(r'^[a-zA-Z0-9_-]{11}J$', s))

def check_excel_corruption(line: str) -> Optional[str]:
    """Check if a line contains signs of Excel corruption. Returns the pattern found, or None."""
    for pattern in EXCEL_ERROR_PATTERNS:
        if pattern in line:
            return pattern
    return None

def normalize_name_for_sorting(name: str) -> str:
    """Normalize a name for alphabetical comparison."""
    # Remove diacritics and convert to lowercase for consistent sorting
    return unidecode.unidecode(name).lower().strip()

def check_alphabetical_order(filepath: str, new_entries: List[str]) -> List[str]:
    """
    Check if new entries are inserted in correct alphabetical position.
    Returns a list of error messages for entries that are out of order.
    """
    errors = []

    if not os.path.exists(filepath):
        return errors

    # Read the current file
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            all_names = [row[0] for row in reader if row and len(row) >= 1]
    except Exception:
        return errors

    # For each new entry, check its position
    for new_entry in new_entries:
        try:
            parts = new_entry.split(',')
            if len(parts) < 1:
                continue
            new_name = parts[0]
            new_name_normalized = normalize_name_for_sorting(new_name)

            # Find where this name appears in the file
            for i, existing_name in enumerate(all_names):
                if existing_name == new_name:
                    # Check predecessor
                    if i > 0:
                        prev_name = all_names[i - 1]
                        prev_normalized = normalize_name_for_sorting(prev_name)
                        if prev_normalized > new_name_normalized:
                            errors.append(f"'{new_name}' should come after '{prev_name}' (alphabetically)")

                    # Check successor
                    if i < len(all_names) - 1:
                        next_name = all_names[i + 1]
                        next_normalized = normalize_name_for_sorting(next_name)
                        if next_normalized < new_name_normalized:
                            errors.append(f"'{new_name}' should come before '{next_name}' (alphabetically)")
                    break
        except Exception:
            continue

    return errors

def get_dblp_info(path: str, timeout: float = 10.0) -> str:
    urls = [
        f"https://dblp.org{path}",
        f"https://dblp.uni-trier.de{path}",
        f"https://dblp.dagstuhl.de{path}"
    ]
    for url in urls:
        try:
            response = requests.get(url, timeout=timeout)
            if response.ok:
                return url
        except requests.RequestException:
            pass
    raise RuntimeError("All DBLP fetch attempts failed.")

DBLP = None

def get_dblp():
    global DBLP
    if DBLP is None:
        DBLP = get_dblp_info("", 3.0)
    return DBLP

def translate_name_to_dblp(name: str) -> str:
    """
    Converts a given name to a DBLP URL.

    Args:
        name: A string containing the name to be converted.

    Returns:
        A string containing the DBLP URL representation of the name.
    """
    # Replace spaces and non-ASCII characters.
    # removes periods
    name = re.sub('\\.', '', name)
    # replaces '-' with ' ' to cope with DBLP search API issue (disabled negation operator)
    name = re.sub('-', ' ', name)
    # encodes diacritics
    name = urllib.parse.quote(name, safe='=')
    # replaces '&' with '='
    name = re.sub('&', '=', name)
    # replaces ';' with '='
    name = re.sub(';', '=', name)
    split_name = name.split(' ')
    last_name = split_name[-1]
    disambiguation = ''
    # Handle disambiguation entries.
    try:
        if int(last_name) > 0:
            disambiguation = last_name
            split_name.pop()
            last_name = split_name[-1] + '_' + disambiguation
    except:
        pass
    # Consolidate name and replace spaces with underscores.
    split_name.pop()
    new_name = ' '.join(split_name)
    new_name = new_name.replace(' ', '_')
    new_name = new_name.replace('-', '=')
    new_name = urllib.parse.quote(new_name)
    str_ = ''
    last_initial = last_name[0].lower()
    str_ += f'{last_name}:{new_name}'
    # str_ += f'/{last_initial}/{last_name}:{new_name}'
    # return the DBLP URL containing the given name
    return str_


def matching_name_with_dblp(name: str) -> int:
    author_name = translate_name_to_dblp(name)
    # print(author_name)
    dblp_url = f'{get_dblp()}/search/author/api?q=author%3A{author_name}$%3A&format=json&c=10'
    # print(dblp_url)
    try:
        r = requests.get(dblp_url)
        if "<title>429 Too Many Requests</title>" in r.text:
            time.sleep(10)
            return matching_name_with_dblp(name)
        j = r.json()
        # print(j)
        completions = int(j['result']['completions']['@total'])
        if completions > 0:
            for hit in j['result']['hits']['hit']:
                if hit['info']['author'] == name:
                    return 1
        return completions
    except Exception:
        return 0

# ---------- Prompt Construction ----------

def construct_prompt(diff: str) -> str:
    with open("CONTRIBUTING.md", "r") as f:
        checklist = f.read()
    return f"""
    
Audit this pull request to verify the following checklist for a PR to
CSrankings. Indicate any questionable additions, removals, or
modifications. In particular, verify if faculty are affiliated
at the listed institution, and whether they are in computer science or
can solely supervise PhD students for a degree in computer science because
they have an affiliation with the Computer Science department OR if they are
permitted to solely advise PhD students by their institution.
They must also be full-time faculty members. It is not sufficient for them
to have published in Computer Science venues.


Search the web as follows:
    
* Search the web to consult their home page (included in the PR), and
consult LinkedIn, departmental web pages, and Google Scholar (using
the included Google Scholar ID). Note that "NOSCHOLARPAGE" is
acceptable as a Google Scholar ID.

* Search the web to verify that the faculty member's home page
contains the name and specified affiliation (university and CS
department).

* Search the web to verify that their Google Scholar ID
corresponds to them.

Provide an audit for every single faculty mentioned in the diff.

Respond ONLY with a JSON file like the following:

{{ 
[
    'name' : (the name),
    'dblp_name' : (the DBLP name),
    'change': (one of 'addition', 'deletion', 'modification'),
    'classification': (one of 'valid', 'invalid', 'questionable'),
    'explanation': (a textual explanation of the reason for the declared classification),
  ]
}}

Pull request diff:

name,affiliation,homepage,scholarid
{diff}

Checklist:

{checklist}
"""

# ---------- PR Diff Parsing ----------

def parse_pr_api_diff(pr_diff_json_path: str) -> str:
    """Parses GitHub PR API diff JSON into a human-readable format."""
    with open(pr_diff_json_path, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    print("JSON diff:",file=sys.stderr)
    print(json.dumps(json_data, indent=4), file=sys.stderr)
    diff_lines = []
    for file_diff in json_data.get("files", []):
        path = file_diff.get("path", "")
        for chunk in file_diff.get("chunks", []):
            for change in chunk.get("changes", []):
                change_type = change.get("type")
                content = change.get("content", '').strip()
                if change_type == "AddedLine":
                    diff_lines.append(f"+ {content} ({path})")
                elif change_type == "DeletedLine":
                    diff_lines.append(f"- {content} ({path})")
                elif change_type == "ModifiedLine":
                    diff_lines.append(f"- {change.get('oldLine', '').strip()} ({path})")
                    diff_lines.append(f"+ {change.get('newLine', '').strip()} ({path})")
    result = "\n".join(diff_lines)
    print("Generated diff:", file=sys.stderr)
    print(result, file=sys.stderr)
    return result

# ---------- GPT-4 Auditing ----------

def run_audit(client, diff_path: str) -> Optional[List[dict]]:
    diff_text = parse_pr_api_diff(diff_path)
    prompt = construct_prompt(diff_text)

    response = client.responses.parse(
        model = "gpt-4.1",
        input = prompt,
        tools = [{"type": "web_search_preview"}],
        tool_choice = "auto",
        temperature=0.2,
        text_format = AuditEntryList,
    )
    parsed = response.output_parsed
    
    filtered_sorted = sorted(
        parsed.entries,
        key=lambda x: x.model_dump()["name"].lower()
    )
    
    return [x.model_dump() for x in filtered_sorted]

# ---------- PR Metadata Validation ----------

def process_pr_metadata(pr_metadata_path: str) -> bool:
    """
    Validates PR metadata:
    - PR title is not a default GitHub title (like "Update csrankings-a.csv")
    - All checkboxes in the Markdown checklist are checked
    """
    valid = True
    with open(pr_metadata_path, "r", encoding="utf-8") as f:
        pr_metadata = json.load(f)

    # Check that author has a name set in their GitHub profile
    author_login = pr_metadata.get("author_login", "")
    author_name = pr_metadata.get("author_name", "")
    if not author_name or not author_name.strip():
        print(f"{ERROR}\t{CHECKBOX_REFS['non_anonymous']} GitHub profile for @{author_login} does not have a name set.")
        print(f"{INFO}\tPlease add your full name to your GitHub profile: https://github.com/settings/profile")
        valid = False
    elif author_name.strip().lower() == author_login.lower():
        print(f"{WARN}\tGitHub profile name '{author_name}' appears to be the same as username. Consider using your full name.")
    else:
        print(f"{INFO}\tPR author: {author_name} (@{author_login})")

    pr_title = pr_metadata["title"]
    # Check for default GitHub PR titles
    if re.match(r"^Update csrankings-[a-z0]\.csv$", pr_title) or pr_title.strip().lower() in {
        "update csrankings.csv", "update generated-author-info.csv"
    }:
        print(f"{ERROR}\t{CHECKBOX_REFS['pr_title']} PR title is the default GitHub option and too generic: '{pr_title}'")
        valid = False
    else:
        print(f"{INFO}\tPR title is descriptive: '{pr_title}'")

    # Check that all checkboxes in the checklist are checked
    pr_body = pr_metadata["body"]
    # Match checklist items that are not checked, only if at line start or after indentation
    unchecked = re.search(r"^[ \t]*-\s*\[\s+\]", pr_body, re.MULTILINE)
    if unchecked:
        print(f"{ERROR}\tNot all checklist items are checked in the PR description.")
        valid = False
    else:
        print(f"{INFO}\tAll checklist items are checked.")

    return valid

# ---------- CSV Validation ----------

def is_valid_file(file: str) -> bool:
    allowed_files = [
        'csrankings-[a-z0].csv', 
        'old/industry.csv', 'old/other.csv', 'old/emeritus.csv', 'old/rip.csv',
        'csrankings.csv',
        'generated-author-info.csv'
    ]
    return re.match(r'.*\.csv$', file) and any(re.match(p, file) for p in allowed_files)

def process_csv_diff(diff_path: str) -> bool:
    with open("institutions.csv", "r") as f:
        institutions = {row["institution"]: True for row in csv.DictReader(f)}

    with open(diff_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    valid = True
    changed_lines = {}
    deleted_lines = {}
    for d in data["files"]:
        try:
            path = d["path"]
            if not is_valid_file(path):
                print(f"{ERROR}\t{CHECKBOX_REFS['allowed_files']} Invalid file modified: {path}")
                valid = False
            changed_lines[path] = [
                c["content"] for ch in d["chunks"] for c in ch["changes"]
                if c["type"] == "AddedLine"
            ]
            deleted_lines[path] = [
                c["content"] for ch in d["chunks"] for c in ch["changes"]
                if c["type"] == "DeletedLine"
            ]
        except KeyError:
            continue

    # Collect names being deleted (for affiliation change detection)
    deleted_names = set()
    for path, lines in deleted_lines.items():
        for line in lines:
            if line and ',' in line:
                try:
                    name = line.split(',')[0]
                    deleted_names.add(normalize_name_for_sorting(name))
                except Exception:
                    pass

    # Collect all affiliations to check one-PR-per-institution rule
    # But exclude entries that are affiliation changes (name exists in both added and deleted)
    all_affiliations = set()
    affiliation_changes = []

    index = 0
    for path, lines in changed_lines.items():
        matched = re.match(r'csrankings-([a-z0])\.csv', path)
        if matched:
            the_letter = unidecode.unidecode(matched.groups(0)[0])

            # Check alphabetical order for this file
            order_errors = check_alphabetical_order(path, lines)
            for err in order_errors:
                print(f"{ERROR}\t{CHECKBOX_REFS['alphabetical']} {err}")
                valid = False

            for line in lines:
                # Ignore empty lines, since Github seems to be adding them now.
                if len(line) == 0:
                    continue
                index += 1

                # Check for Excel corruption
                excel_error = check_excel_corruption(line)
                if excel_error:
                    print(f"{index}.\t{ERROR}\t{CHECKBOX_REFS['no_excel']} Excel corruption detected: found '{excel_error}' in line. Do not use Excel to edit CSV files.")
                    valid = False
                    continue

                if re.search(r',\s', line):
                    print(f"{index}.\t{ERROR}\t{CHECKBOX_REFS['csv_format']} Space after comma: {line}")
                    valid = False
                    continue
                try:
                    name, affiliation, homepage, scholarid = line.split(',')
                    # Check if this is an affiliation change (name was also deleted)
                    name_normalized = normalize_name_for_sorting(name)
                    if name_normalized in deleted_names:
                        affiliation_changes.append(name)
                    else:
                        all_affiliations.add(affiliation)
                    print(f"{index}.\tValidating {name}")
                    name_no_brackets = remove_brackets(name)
                    if matching_name_with_dblp(name_no_brackets) == 0:
                        print(f"{index}.\t{ERROR}\t{CHECKBOX_REFS['dblp_name']} No DBLP match for {name_no_brackets}")
                        valid = False
                    print(f"{index}.\t{INFO}\tChecking homepage: {homepage}")
                    homepage_text = has_valid_homepage(homepage)
                    if not homepage_text:
                        print(f"{index}.\t{ERROR}\t{CHECKBOX_REFS['homepage']} Invalid homepage: {homepage}")
                        valid = False
                    homepage_text = extract_visible_text_from_webpage(homepage_text)
                    name = remove_suffix_and_brackets(name)
                    if name.lower() not in homepage_text.lower():
                        print(f"{index}.\t{WARN}\tExact match of name ({name}) not found on home page ({homepage}).")
                        if not fuzzysearch.find_near_matches(name.lower(), homepage_text.lower(), max_l_dist=5):
                            print(f"{index}.\t{WARN}\tNo fuzzy match for {name} found on home page.")
                    else:
                        print(f"{index}.\t{INFO}\tName ({name}) found on home page.")
                    if affiliation.lower() not in homepage_text.lower():
                        print(f"{index}.\t{WARN}\tAffiliation ({affiliation}) not found on home page.")
                        if not fuzzysearch.find_near_matches(affiliation, homepage_text, max_l_dist=5):
                            print(f"{index}.\t{WARN}\tNo fuzzy match for {affiliation} found on home page.")
                    else:
                        print(f"{index}.\t{INFO}\tAffiliation ({affiliation}) found on home page.")
                    if affiliation not in institutions:
                        print(f"{index}.\t{ERROR}\t{CHECKBOX_REFS['new_institution']} Unknown institution: {affiliation}")
                        print(f"{index}.\t{INFO}\tYou must first open an issue titled 'Add {affiliation} to the list of institutions' before submitting this PR.")
                        print(f"{index}.\t{INFO}\tOnce the institution is added, submit a single PR with ALL faculty in the CS department.")
                        valid = False
                    else:
                        print(f"{index}.\t{INFO}\t{affiliation} is on the list of known institutions (`institutions.csv`).")
                    if unidecode.unidecode(name)[0].lower() != the_letter and the_letter != '0':
                        print(f"{index}.\t{ERROR}\tEntry in wrong file: {name} → csrankings-{the_letter}.csv")
                        valid = False
                    else:
                        print(f"{index}.\t{INFO}\tEntry in the correct file.")
                    if not has_valid_google_scholar_id(scholarid):
                        print(f"{index}.\t{ERROR}\t{CHECKBOX_REFS['scholar_id']} Invalid Google Scholar ID format: {scholarid}")
                        valid = False
                    else:
                        print(f"{index}.\t{INFO}\tGoogle Scholar ID ({scholarid}) passed validity checks.")
                        gs_url = f"https://scholar.google.com/citations?hl=en&user={scholarid}"
                        gscholar_page_text = has_valid_homepage(gs_url)
                        if not gscholar_page_text:
                            print(f"{index}.\t{ERROR}\t{CHECKBOX_REFS['scholar_id']} Invalid Google Scholar ID ({scholarid}, {gs_url}).")
                            valid = False
                        else:
                            gscholar_page_text = extract_visible_text_from_webpage(gscholar_page_text)
                            if all(item not in gscholar_page_text
                                   for item in
                                   [name, "your computer or network may be sending automated queries"]):
                                print(f"{index}.\t{WARN}\tName ({name}) not found on given Google Scholar page ({gs_url}).")
                                print(f"Returned Google Scholar page:\n{gscholar_page_text}", file=sys.stderr)
                            else:
                                pass
                                # print(f"{index}.\t{INFO}\tName ({name}) found on given Google Scholar page ({gs_url}).")
                except Exception as e:
                    print(f"{index}.\tProcessing error: {e}")
                    valid = False

    # Check one-PR-per-institution rule (excluding affiliation changes)
    if affiliation_changes:
        print(f"{INFO}\tDetected affiliation change(s) for: {', '.join(affiliation_changes)}")
    if len(all_affiliations) > 1:
        print(f"{ERROR}\t{CHECKBOX_REFS['one_pr']} PR contains new entries for multiple institutions: {', '.join(sorted(all_affiliations))}")
        print(f"{INFO}\tCombine all updates for a single institution into one PR. Submit separate PRs for different institutions.")
        valid = False
    elif len(all_affiliations) == 1:
        print(f"{INFO}\tAll new entries are for a single institution: {list(all_affiliations)[0]}")
    elif len(all_affiliations) == 0 and affiliation_changes:
        print(f"{INFO}\tPR contains only affiliation changes (no new faculty additions).")

    return valid

# ---------- Main ----------


def mark_failed():
    print(f"\n{ERROR} At least one validity check failed.")
    # DO NOT remove the 'stale' flag.
    with open("remove_stale.txt", "w") as f:
        f.write("false")    

def mark_succeeded():
    print(f"{SUCCESS} All validity checks passed.")
    # Remove the 'stale' flag.
    with open("remove_stale.txt", "w") as f:
        f.write("true")

if __name__ == "__main__":
    # Remove the 'stale' flag if no error occurs.
    with open("remove_stale.txt", "w") as f:
        f.write("true")
    pr_metadata_path = sys.argv[1]
    diff_path = sys.argv[2]

    pr_metadata_valid = process_pr_metadata(pr_metadata_path)
    csv_valid = process_csv_diff(diff_path)

    # Proceed with the AI audit even when the basic checks fail.
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY not set.")

    client = openai.OpenAI(api_key=api_key)
    audit_result = ""

    retries_remaining = 3
    while retries_remaining > 0:
        try:
            audit_result = run_audit(client, diff_path)
            break
        except:
            retries_remaining -= 1

    auditing_error = False
    if audit_result:
        print(f"\nThe analysis below was generated by AI and may not be accurate:\n")
        for index, entry in enumerate(audit_result, start=1):
            gloss = f"{ERROR}\t" if entry['classification'] in { 'invalid', 'questionable' } else ""
            print(f"{index}.\t{gloss}Update for {entry['name']} ({entry['dblp_name']}) is {entry['classification']}: {entry['explanation']}\n")
            if gloss:
                auditing_error = True
                
    if not pr_metadata_valid or not csv_valid or auditing_error:
        mark_failed()
        sys.exit(-1)
    else:
        mark_succeeded()
        sys.exit(0)
