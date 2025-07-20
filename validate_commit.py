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

from validate_homepage import has_valid_homepage, extract_visible_text_from_webpage

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

# ---------- CSV Validation ----------

def is_valid_file(file: str) -> bool:
    allowed_files = [
        'csrankings-[a-z0].csv', 
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
                print(f"{ERROR}\tInvalid file modified: {path}")
                return False
            changed_lines[path] = [
                c["content"] for ch in d["chunks"] for c in ch["changes"]
                if c["type"] == "AddedLine"
            ]
        except KeyError:
            continue

    valid = True
    index = 0
    for path, lines in changed_lines.items():
        matched = re.match(r'csrankings-([a-z0])\.csv', path)
        if matched:
            the_letter = unidecode.unidecode(matched.groups(0)[0])
            for line in lines:
                index += 1
                if re.search(r',\s', line):
                    print(f"\t{index}.\t{ERROR}\tSpace after comma: {line}")
                    valid = False
                    continue
                try:
                    name, affiliation, homepage, scholarid = line.split(',')
                    print(f"{index}.\tValidating {name}")
                    name_no_brackets = remove_brackets(name)
                    if matching_name_with_dblp(name_no_brackets) == 0:
                        print(f"{index}.\t{ERROR}\tNo DBLP match for {name_no_brackets}")
                        valid = False
                    print(f"{index}.\t{INFO}\tChecking homepage: {homepage}")
                    homepage_text = has_valid_homepage(homepage)                    
                    if not homepage_text:
                        print(f"{index}.\t{ERROR}\tInvalid homepage: {homepage}")
                        valid = False
                    homepage_text = extract_visible_text_from_webpage(homepage_text)
                    name = remove_suffix_and_brackets(name)
                    if name not in homepage_text:
                        print(f"{index}.\t{WARN}\tExact match of name ({name}) not found on home page ({homepage}).")
                        if not fuzzysearch.find_near_matches(name, homepage_text, max_l_dist=5):
                            print(f"{index}.\t{WARN}\tNo fuzzy match for {name} found on home page.")
                    else:    
                        print(f"{index}.\t{INFO}\tName ({name}) found on home page.")
                    if affiliation not in homepage_text:
                        print(f"{index}.\t{WARN}\tAffiliation ({affiliation}) not found on home page.")
                        if not fuzzysearch.find_near_matches(affiliation, homepage_text, max_l_dist=5):
                            print(f"{index}.\t{WARN}\tNo fuzzy match for {affiliation} found on home page.")
                    else:
                        print(f"{index}.\t{INFO}\tAffiliation ({affiliation}) found on home page.")
                    if affiliation not in institutions:
                        print(f"{index}.\t{ERROR}\tUnknown institution: {affiliation} not found in `institutions.csv`.")
                        valid = False
                    else:
                        print(f"{index}.\t{INFO}\t{affiliation} is on the list of known institutions (`institutions.csv`).")
                    if unidecode.unidecode(name)[0].lower() != the_letter and the_letter != '0':
                        print(f"{index}.\t{ERROR}\tEntry in wrong file: {name} → csrankings-{the_letter}.csv")
                        valid = False
                    else:
                        print(f"{index}.\t{INFO}\tEntry in the correct file.")
                    if not has_valid_google_scholar_id(scholarid):
                        print(f"{index}.\t{ERROR}\tInvalid Google Scholar ID format: {scholarid}")
                        valid = False
                    else:
                        print(f"{index}.\t{INFO}\tGoogle Scholar ID ({scholarid}) passed validity checks.")
                        gs_url = f"https://scholar.google.com/citations?hl=en&user={scholarid}"
                        gscholar_page_text = has_valid_homepage(gs_url)
                        if not gscholar_page_text:
                            print(f"{index}.\t{ERROR}\tInvalid Google Scholar ID ({scholarid}, {gs_url}).")
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
    return valid

# ---------- Main ----------


def mark_failed():
    print(f"\n{ERROR} At least one validity check failed.")
    # DO NOT remove the 'stale' flag.
    with open("remove_stale.txt", "w") as f:
        f.write("false")    
    sys.exit(0)

def mark_succeeded():
    print(f"{SUCCESS} All validity checks passed.")
    # Remove the 'stale' flag.
    with open("remove_stale.txt", "w") as f:
        f.write("true")
    sys.exit(0)

if __name__ == "__main__":
    # Remove the 'stale' flag if no error occurs.
    with open("remove_stale.txt", "w") as f:
        f.write("true")
    diff_path = sys.argv[1]
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY not set.")

    csv_valid = process_csv_diff(diff_path)

    # Proceed with the AI audit even when the basic checks fail.

    client = openai.OpenAI(api_key=api_key)
    audit_result = ""

    retries_remaining = 3
    while retries_remaining > 0:
        try:
            audit_result = run_audit(client, diff_path)
            break
        except:
            retries_remaining -= 1
        
    if audit_result:
        print(f"\nThe analysis below was generated by AI and may not be accurate:\n")
        auditing_error = False
        for index, entry in enumerate(audit_result, start=1):
            gloss = f"{ERROR}\t" if entry['classification'] in { 'invalid', 'questionable' } else ""
            print(f"{index}.\t{gloss}Update for {entry['name']} ({entry['dblp_name']}) is {entry['classification']}: {entry['explanation']}\n")
            if gloss:
                auditing_error = True
        if auditing_error:
            mark_failed()
            
    if not csv_valid:
        mark_failed()
    mark_succeeded()
