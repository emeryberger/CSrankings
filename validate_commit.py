import csv
import glob
import json
import re
import requests
import sys
import time
import unidecode
import urllib.parse
import os
import openai
import json
import re
import sys

from typing import List, Literal, Optional
from pydantic import BaseModel, ValidationError

from validate_homepage import has_valid_homepage

MAX_RETRIES = 3

class AuditEntry(BaseModel):
    name: str
    dblp_name: str
    change: Literal['addition', 'deletion', 'modification']
    classification: Literal['valid', 'invalid', 'questionable']
    explanation: str
    
def extract_json_from_backquotes(text: str) -> str:
    """Try to extract the first JSON-like block enclosed in backticks."""
    match = re.search(r"```(?:json)?\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else text

def load_diff(diff_file_path: str) -> str:
    """Convert structured JSON diff to a readable text format."""
    with open(diff_file_path, "r", encoding="utf-8") as f:
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
                    old_line = change.get("oldLine", '').strip()
                    new_line = change.get("newLine", '').strip()
                    diff_lines.append(f"- {old_line} ({path})")
                    diff_lines.append(f"+ {new_line} ({path})")
                    # diff_lines.append(f"~ {old_line} -> {new_line} ({path})")

    return "\n".join(diff_lines)

def construct_prompt(diff):
    fname = "CONTRIBUTING.md"
    with open(fname, "r") as f:
        contributing = f.read()
    
    prompt = f"""
Audit this pull request to verify the following checklist for a PR to CSrankings. Indicate any questionable additions, removals, or modifications. In particular, verify if any new faculty are affiliated at the listed institution, and whether they are in computer science or can solely supervise PhD students for a degree in computer science, and if they are full-time faculty members. Consult their home page (included in the PR), and if necessary, consult LinkedIn or departmental web pages and Google Scholar (using the included Google Scholar ID). Respond ONLY with a JSON file like the following:

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

{diff}

Checklist:

{contributing}
    
"""
    # print(prompt)
    return prompt


def run_audit(client, diff_path: str) -> Optional[List[dict]]:
    diff_text = load_diff(diff_path)
    prompt = construct_prompt(diff_text)

    for attempt in range(1, MAX_RETRIES + 1):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )

        output = response.choices[0].message.content
        output_clean = extract_json_from_backquotes(output)

        try:
            parsed = json.loads(output_clean)
            validated = [AuditEntry(**entry) for entry in parsed]
            filtered_sorted = sorted(
                (entry.model_dump() for entry in validated if entry.classification in {"invalid", "questionable"}),
                key=lambda x: ("invalid" if x["classification"] == "invalid" else "questionable", x["name"].lower())
            )
            return filtered_sorted            
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"Attempt {attempt} failed: {e}\n")
            if attempt == MAX_RETRIES:
                print("Max retries reached. Raw output:")
                print(output)
    return None



def get_dblp_info(path: str, timeout: float = 10.0) -> str:
    """Try to fetch info from DBLP, returning the first live server.

    Args:
        path: The path to append to the base URL (e.g., '/rec/conf/pldi/Smith23').
        timeout: Timeout in seconds for each request.

    Returns:
        The DBLP URL for the first successful fetch.

    Raises:
        RuntimeError: If both attempts fail.
    """
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
            else:
                print(f"Failed to fetch {url}: HTTP {response.status_code}")
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")

    raise RuntimeError("All DBLP fetch attempts failed.")

DBLP = get_dblp_info("", 3.0)

allowed_files = ['csrankings-[a-z0].csv', 'country-info.csv', 'old/industry.csv', 'old/other.csv', 'old/emeritus.csv', 'old/rip.csv']

def remove_suffix_and_brackets(input_string: str) -> str:
    # Remove any suffix with a space and anything in brackets only if it is at the end of the string
    # Used to handle special entries like [Tech]
    modified_string = re.sub(r'\s*\[.*?\]$', '', input_string)
    return modified_string

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

def is_valid_account(account: str) -> bool:
    return not account.startswith('anonymous')

def has_reasonable_title(title):
    # Check if the title is reasonable
    return not title.startswith('Update csrankings-')

def has_valid_google_scholar_id(id):
    # Check if the Google Scholar ID is valid
    if id == 'NOSCHOLARPAGE':
        return True
    # Define the regular expression pattern for valid IDs
    pattern = '^[a-zA-Z0-9_-]{12}$'
    # Check if the ID matches the pattern
    return re.fullmatch(pattern, id) is not None

assert has_valid_google_scholar_id('NOSCHOLARPAGE')
assert not has_valid_google_scholar_id('a_49dn0AAAAJ&hl')
assert has_valid_google_scholar_id('a_49dn0AAAAJ')

def matching_name_with_dblp(name: str) -> int:
    """
    Check if a name matches a DBLP entry and return the number of completions.

    Args:
        name: A string representing the name to check.

    Returns:
        An integer representing the number of completions. 1 indicates an exact match.

    """
    # Translate the name to a format that can be used in DBLP queries.
    author_name = translate_name_to_dblp(name)
    # Search for up to 10 matching authors.
    dblp_url = f'{DBLP}/search/author/api?q=author%3A{author_name}$%3A&format=json&c=10'
    try:
        # Send a request to the DBLP API.
        response = requests.get(dblp_url)
        # Extract the number of completions from the JSON response.
        if "<title>429 Too Many Requests</title>" in response.text:
            # wait for a few seconds and try again
            time.sleep(10)
            return matching_name_with_dblp(name)
        j = json.loads(response.text)
        completions = int(j['result']['completions']['@total'])
        # Print a message if there is a match.
        if completions != 0:
            print(f'  Checking {dblp_url}')
            # Check for an exact name match
            if completions > 0:
                for hit in j['result']['hits']['hit']:
                    if hit['info']['author'] == name:
                        return 1
        return completions
    except requests.exceptions.RequestException as e:
        # Handle any exceptions that occur during the request.
        print(f'ERROR: Exception: {e}')
        return 0

def is_valid_file(file: str) -> bool:
    global allowed_files
    if re.match('.*\\.csv', file):
        if any((re.match(pattern, file) for pattern in allowed_files)):
            return True
    return False

def process():
    # Read in the institutions dictionary.
    institutions = {}
    with open('institutions.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            institutions[row['institution']] = True
    
    # Read in the argument JSON file.
    json_file = sys.argv[1]
    with open(json_file, 'r') as f:
        json_data = f.read()
    data = json.loads(json_data)
    changed_lines = {}
    for d in data['files']:
        try:
            file_path = d['path']
            changed_lines[file_path] = []
            for chunk in d['chunks']:
                for change in chunk['changes']:
                    if change['type'] == 'AddedLine':
                        changed_lines[file_path].append(change)
        except:
            # Gracefully handle misformed / empty JSON.
            pass
    # Now process the diffs.
    valid = True
    line_valid = True
    print('Sanity checking the commit. Please check any issues raised here.')
    # Pick arbitrary thresholds; if there are more than this many diffs,
    # it is probably because of some line ending mismatch or editing with Excel.
    remaining_diffs = 500
    # TO DO: check deleted lines to see if home page still valid
    # or if moved to another file
    for file in changed_lines:
        if not is_valid_file(file):
            print(f'ERROR: Invalid file modification ({file}). Please only modify allowed CSV files.')
            valid, line_valid = (False, False)
            break
        # Check if we are processing a `csrankings-?.csv` file.
        matched = re.match('csrankings-([a-z0])\\.csv', file)
        if matched:
            the_letter = unidecode.unidecode(matched.groups(0)[0]) # Convert to ASCII
            for l in changed_lines[file]:
                line_valid = True
                remaining_diffs -= 1
                if remaining_diffs <= 0:
                    print('ERROR: This PR has too many diffs. Something probably went wrong.')
                    valid, line_valid = (False, False)
                    break
                line = l['content'].strip()
                # print(f'Processing {line}')
                if re.search(',\\s', line):
                    print(f'  ERROR: Found a space after a comma ({line}). Please ensure there are no spaces after commas.')
                    valid, line_valid = (False, False)
                    continue
                try:
                    name, affiliation, homepage, scholarid = line.split(',')
                    name = unidecode.unidecode(remove_suffix_and_brackets(name))
                    # Verify that the affiliation is already in the database
                    if affiliation not in institutions:
                        print(f'  ERROR: This institution ({affiliation}) was not found in `institutions.csv`.')
                        valid, line_valid = (False, False)
                    # Verify that entry is in the correct file.
                    if name[0].lower() != the_letter and the_letter != '0':
                        print(f'  ERROR: This entry is in the wrong file. It is in `csrankings-{the_letter}.csv` but should be in `csrankings-{name[0].lower()}.csv`.')
                        valid, line_valid = (False, False)
                    # Check Google Scholar ID.
                    # print(f"  Checking Google Scholar ID ({scholarid})")
                    if not has_valid_google_scholar_id(scholarid):
                        print(f'  ERROR: Invalid Google Scholar ID ({scholarid}). Please provide a valid identifier.')
                        valid = False
                    # Check name against DBLP.
                    completions = matching_name_with_dblp(name)
                    if completions == 0:
                        print(f'  ERROR: Invalid name ({name}). Please ensure it matches the DBLP entry.')
                        valid, line_valid = (False, False)
                    elif completions > 1:
                        print(f'  WARNING: Possibly invalid name ({name}). This may be a disambiguation entry.')
                        valid, line_valid = (False, False)
                    # Test the homepage.
                    print(f"  Checking homepage URL ({homepage})")
                    if not has_valid_homepage(homepage):
                        print(f'  WARNING: Invalid homepage URL ({homepage}). Please provide a correct URL.')
                        valid, line_valid = (False, False)
                    # TODO:
                    # - verify that new entry is in alphabetical order
                    # - warn if there is an affiliation mismatch with DBLP
                    # - warn if there is a home page mismatch with DBLP
                    if line_valid:
                        pass
                    else:
                        # print(f"All tests passed for {name}.")
                        print(f'***Test failure for {name}***.')
                except Exception as e:
                    print(f'Processing failed ({e}).')
                    valid, line_valid = (False, False)
    return valid

        
if __name__ == '__main__':
    # Fetch API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY not set in environment.")

    valid = process()
    if not valid:
        sys.exit(-1)
    # openai.api_key = api_key
    client = openai.OpenAI(api_key=api_key)

    diff_path = sys.argv[1]
    result = run_audit(client, diff_path)
    if result:
        for item in result:
            print(f"* Update for {item['name']} ({item['dblp_name']}) is {item['classification']}: {item['explanation']}")
            print("")
        sys.exit(-1)
    sys.exit(0)
