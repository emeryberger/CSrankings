import csv
import glob
import json
import re
import requests
import sys

import urllib.parse

allowed_files = ['csrankings-[a-z].csv', 'country-info.csv', 'old/industry.csv', 'old/other.csv', 'old/emeritus.csv', 'old/rip.csv']

def translate_name_to_dblp(name):
    # Ex: "Emery D. Berger" -> "http://dblp.uni-trier.de/pers/hd/b/Berger:Emery_D="
    # First, replace spaces and non-ASCII characters (not complete).
    name = re.sub(r' Jr\.', '_Jr.', name)
    name = re.sub(r' II', '_II', name)
    name = re.sub(r' III', '_III', name)
    name = re.sub(r'\'|\-|\.', '=', name)
    # Now replace diacritics.
    name = urllib.parse.quote(name, safe='=')
    name = re.sub(r'&', '=', name)
    name = re.sub(r';', '=', name)
    split_name = name.split(" ")
    last_name = split_name[-1]
    disambiguation = ""
    try:
        if int(last_name) > 0:
            # this was a disambiguation entry; go back.
            disambiguation = last_name
            split_name.pop()
            last_name = split_name[-1] + "_" + disambiguation
    except:
        pass
    split_name.pop()
    new_name = " ".join(split_name)
    new_name = new_name.replace(' ', '_')
    new_name = new_name.replace('-', '=')
    new_name = urllib.parse.quote(new_name)
    str_ = ""
    # str_ = "https://dblp.org/pers/hd"
    last_initial = last_name[0].lower()
    str_ += f'{last_name}:{new_name}'
    # str_ += f'/{last_initial}/{last_name}:{new_name}'
    return str_

def is_valid_account(account):
    # Check if the account is non-anonymous
    return not account.startswith('anonymous')

def has_reasonable_title(title):
    # Check if the title is reasonable
    return not title.startswith('Update csrankings-')

def has_valid_homepage(homepage):
    # Check if the homepage URL is correct
    # Use requests library to fetch the page and check the response
    try:
        response = requests.get(homepage)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def has_valid_google_scholar_id(id):
    # Check if the Google Scholar ID is valid
    if id == "NOSCHOLARPAGE":
        return True

    # Define the regular expression pattern for valid IDs
    pattern = r'^[a-zA-Z0-9_-]{7}AAAAJ$'
    
    # Check if the ID matches the pattern
    if not re.match(pattern, id):
        return False

    return True


def matching_name_with_dblp(name):
    # Check if the name matches the DBLP entry
    # Use requests library to fetch the DBLP page and check if the name is present
    # Try to fetch the author name and return the number of completions
    # (1 == an exact match).
    author_name = translate_name_to_dblp(name)
    # Look for matching authors, no more than 10.
    dblp_url = f"https://dblp.org/search/author/api?q=author%3A{author_name}$%3A&format=json&c=10"
    print(f"  searching for {dblp_url}")
    try:
        response = requests.get(dblp_url)
        j = json.loads(response.text)
        completions = j['result']['completions']['@total']
        return int(completions)
    except requests.exceptions.RequestException as e:
        print(f"Exception: {e}")
        return 0

def is_valid_file(file):
    # Check if only allowed CSV files are modified
    global allowed_files
    if re.match(r'.*\.csv', file):
        if not any(re.match(pattern, file) for pattern in allowed_files):
            return False
    return True

def process():
    json_file = sys.argv[1]
    with open(json_file, "r") as f:
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

    print("Sanity checking the commit. Please check any issues raised here.")

    # Pick arbitrary thresholds; if there are more than this many diffs,
    # it is probably because of some line ending mismatch or editing with Excel.
    remaining_diffs = 50
    
    for file in changed_lines:
        if not is_valid_file(file):
            print(f"Invalid file modification ({file}). Please only modify allowed CSV files.")
            valid = False
            break

        # Check if we are processing a `csrankings-?.csv` file.
        matched = re.match(r'csrankings-([a-z])\.csv', file)
        if matched:
            the_letter = matched.groups(0)[0]
            
            for l in changed_lines[file]:
                remaining_diffs -= 1
                if remaining_diffs <= 0:
                    print("This PR has too many diffs. Something probably went wrong.")
                    valid = False
                    break
                
                line = l['content'].strip()

                print(f"Processing {line}")
                
                if re.search(r',\s', line):
                    print(f"  Found a space after a comma ({line}). Please ensure there are no spaces after commas.")
                    valid = False
                    continue
                
                try:
                    (name, affiliation, homepage, scholarid) = line.split(',')

                    # Verify that entry is in the correct file.
                    if name[0].lower() != the_letter:
                        print(f"  This entry is in the wrong file. It is in `csrankings-{the_letter}.csv` but should be in `csrankings-{name[0].lower()}.csv`.")
                        valid = False

                    # Check Google Scholar ID.
                    if not has_valid_google_scholar_id(scholarid):
                        print(f"  Invalid Google Scholar ID ({scholarid}). Please provide a valid identifier.")
                        valid = False

                    # Check name against DBLP.
                    completions = matching_name_with_dblp(name)
                    if completions == 0:
                        print(f"  Invalid name ({name}). Please ensure it matches the DBLP entry.")
                        valid = False
                    if completions > 1:
                        print(f"  Possibly invalid name ({name}). This may be a disambiguation entry.")
                        valid = False

                    # Test the homepage.
                    if not has_valid_homepage(homepage):
                        print(f"  Invalid homepage URL ({homepage}). Please provide a correct URL.")
                        valid = False

                    # TODO:
                    # - verify that new entry is in alphabetical order
                    # - warn if there is an affiliation mismatch with DBLP
                    # - warn if there is a home page mismatch with DBLP
                        
                except Exception as e:
                    print(f"Processing failed ({e}).")
                    valid = False

    if valid:
        sys.exit(0)
    else:
        sys.exit(-1)
        
    
if __name__ == "__main__":
    process()
