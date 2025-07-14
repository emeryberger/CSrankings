import csv
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
from pydantic import BaseModel, ValidationError

from validate_homepage import has_valid_homepage

MAX_RETRIES = 3

# ---------- Models ----------

class AuditEntry(BaseModel):
    name: str
    dblp_name: str
    change: Literal['addition', 'deletion', 'modification']
    classification: Literal['valid', 'invalid', 'questionable']
    explanation: str

# ---------- Helpers ----------

def extract_json_from_backquotes(text: str) -> str:
    match = re.search(r"```(?:json)?\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else text

def remove_suffix_and_brackets(s: str) -> str:
    return re.sub(r'\s*\[.*?\]$', '', s)

def has_valid_google_scholar_id(s: str) -> bool:
    return s == 'NOSCHOLARPAGE' or bool(re.fullmatch(r'^[a-zA-Z0-9_-]{12}$', s))

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
modifications. In particular, verify if any new faculty are affiliated
at the listed institution, and whether they are in computer science or
can solely supervise PhD students for a degree in computer science,
and if they are full-time faculty members. Search the web to consult
their home page (included in the PR), and consult LinkedIn,
departmental web pages, and Google Scholar (using the included Google
Scholar ID). Search the web to verify that their home page contains
the name and specified affiliation (university and CS
department). Search the web to verify that their Google Scholar ID
corresponds to them.

Respond ONLY with a JSON file like the following:

{{ 
[
    'name' : (the name),
    'dblp_name' : (the DBLP name),
    'change': (one of 'addition', 'deletion', 'modification'),
    'classification': (one of 'valid', 'invalid', 'questionable'),
    'explanation': (a textual explanation of the reason for the declared classification),
    'scholar_url': (their Google Scholar URL),
    'home_page': (their home page),
    'linkedin_url': (their LinkedIn, or NOLINKEDIN if not found)
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
    return "\n".join(diff_lines)

# ---------- GPT-4 Auditing ----------

def run_audit(client, diff_path: str) -> Optional[List[dict]]:
    diff_text = parse_pr_api_diff(diff_path)
    prompt = construct_prompt(diff_text)

    for attempt in range(1, MAX_RETRIES + 1):
        # response = client.chat.completions.create(
        response = client.responses.create(
            model="gpt-4.1",
            input = prompt,
            tools=[{"type": "web_search_preview"}],
            temperature=0.2
        )

        # output = response.choices[0].message.content
        output = response.output_text
        output_clean = extract_json_from_backquotes(output)

        try:
            parsed = json.loads(output_clean)
            validated = [AuditEntry(**entry) for entry in parsed]
            filtered_sorted = sorted(
                (entry.model_dump() for entry in validated),
                 key=lambda x: x["name"].lower()
            )
            return filtered_sorted
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"Attempt {attempt} failed: {e}\n")
            if attempt == MAX_RETRIES:
                print("Max retries reached. Raw output:")
                print(output)
    return None

# ---------- CSV Validation ----------

def is_valid_file(file: str) -> bool:
    allowed_files = [
        'csrankings-[a-z0].csv', 'country-info.csv',
        'old/industry.csv', 'old/other.csv', 'old/emeritus.csv', 'old/rip.csv'
    ]
    return re.match(r'.*\.csv$', file) and any(re.match(p, file) for p in allowed_files)

def process_csv_diff(diff_path: str) -> bool:
    with open("institutions.csv", "r") as f:
        institutions = {row["institution"]: True for row in csv.DictReader(f)}

    with open(diff_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    changed_lines = {}
    for d in data["files"]:
        try:
            path = d["path"]
            if not is_valid_file(path):
                print(f"ERROR: Invalid file modified: {path}")
                return False
            changed_lines[path] = [
                c["content"] for ch in d["chunks"] for c in ch["changes"]
                if c["type"] == "AddedLine"
            ]
        except KeyError:
            continue

    valid = True
    for path, lines in changed_lines.items():
        matched = re.match(r'csrankings-([a-z0])\.csv', path)
        if matched:
            the_letter = unidecode.unidecode(matched.groups(0)[0])
            for line in lines:
                if re.search(r',\s', line):
                    print(f"ERROR: Space after comma: {line}")
                    valid = False
                    continue
                try:
                    name, affiliation, homepage, scholarid = line.split(',')
                    name = unidecode.unidecode(remove_suffix_and_brackets(name))
                    if affiliation not in institutions:
                        print(f"ERROR: Unknown institution: {affiliation}")
                        valid = False
                    if name[0].lower() != the_letter and the_letter != '0':
                        print(f"ERROR: Entry in wrong file: {name} → csrankings-{the_letter}.csv")
                        valid = False
                    if not has_valid_google_scholar_id(scholarid):
                        print(f"ERROR: Invalid GS ID: {scholarid}")
                        valid = False
                    if matching_name_with_dblp(name) == 0:
                        print(f"ERROR: No DBLP match for {name}")
                        valid = False
                    print(f"Checking homepage: {homepage}")
                    homepage_text = has_valid_homepage(homepage)                    
                    if not homepage_text:
                        print(f"WARNING: Invalid homepage: {homepage}")
                        valid = False
                except Exception as e:
                    print(f"Processing error: {e}")
                    valid = False
    return valid

# ---------- Main ----------

if __name__ == "__main__":
    diff_path = sys.argv[1]
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY not set.")

    csv_valid = process_csv_diff(diff_path)
    if not csv_valid:
        sys.exit(-1)

    client = openai.OpenAI(api_key=api_key)
    audit_result = run_audit(client, diff_path)
    if audit_result:
        print(f"\nThe analysis below was generated by AI and may not be accurate:\n")
        auditing_error = False
        for entry in audit_result:
            gloss = "ERROR: " if entry['classification'] in { 'invalid', 'questionable' } else ""
            print(f"{gloss}Update for {entry['name']} ({entry['dblp_name']}) is {entry['classification']}: {entry['explanation']}\n")
            if gloss:
                auditing_error = True
        if auditing_error:
            sys.exit(-1)
    sys.exit(0)
