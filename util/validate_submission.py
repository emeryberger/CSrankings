#!/usr/bin/env python3
"""
Validate a faculty submission for CSRankings.
Used by the GitHub Action to process submissions from the self-service form.
"""

import argparse
import csv
import os
import re
import sys
import time
import requests
import unidecode
from urllib.parse import quote

# Reuse validation logic from validate_commit.py where possible
try:
    from validate_homepage import has_valid_homepage
except ImportError:
    has_valid_homepage = None


def has_valid_google_scholar_id(scholar_id: str) -> bool:
    """Check if Google Scholar ID has valid format (12 chars ending in J)."""
    return scholar_id == 'NOSCHOLARPAGE' or bool(re.fullmatch(r'^[a-zA-Z0-9_-]{11}[CJ]$', scholar_id))


def check_google_scholar_page(scholar_id: str, name: str) -> dict:
    """
    Check if Google Scholar page exists and contains the expected name.
    Returns dict with 'valid', 'accessible', 'name_found', 'error'.
    """
    result = {
        'valid': False,
        'accessible': False,
        'name_found': False,
        'error': None
    }

    if scholar_id == 'NOSCHOLARPAGE':
        result['valid'] = True
        return result

    if not has_valid_google_scholar_id(scholar_id):
        result['error'] = 'Invalid format'
        return result

    try:
        gs_url = f"https://scholar.google.com/citations?hl=en&user={scholar_id}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(gs_url, headers=headers, timeout=15)

        if response.status_code != 200:
            result['error'] = f'HTTP {response.status_code}'
            return result

        result['accessible'] = True
        text = response.text

        # Extract visible text (remove scripts/styles)
        text_clean = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text_clean = re.sub(r'<style[^>]*>.*?</style>', '', text_clean, flags=re.DOTALL | re.IGNORECASE)
        text_clean = re.sub(r'<[^>]+>', ' ', text_clean)
        text_clean = ' '.join(text_clean.split()).lower()

        # Check for name (normalize for comparison)
        name_norm = unidecode.unidecode(name).lower()
        name_parts = name_norm.split()

        # Check if full name or last name appears
        if name_norm in text_clean:
            result['name_found'] = True
            result['valid'] = True
        elif len(name_parts) > 1 and name_parts[-1] in text_clean:
            # Last name found
            result['name_found'] = True
            result['valid'] = True
        elif "your computer or network may be sending automated queries" in text_clean:
            # Google blocking - can't verify
            result['error'] = 'Rate limited by Google'
            result['valid'] = True  # Don't fail, just warn
        else:
            result['error'] = f'Name not found on Scholar page'

    except requests.RequestException as e:
        result['error'] = str(e)

    return result


def check_institution_exists(institution: str) -> bool:
    """Check if institution exists in institutions.csv."""
    try:
        with open('institutions.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('institution', '').strip().lower() == institution.strip().lower():
                    return True
    except FileNotFoundError:
        print("Warning: institutions.csv not found", file=sys.stderr)
        return True  # Don't fail if file missing
    return False


def get_exact_institution_name(institution: str) -> str:
    """Get the exact institution name with correct casing."""
    try:
        with open('institutions.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('institution', '').strip().lower() == institution.strip().lower():
                    return row['institution'].strip()
    except FileNotFoundError:
        pass
    return institution


def translate_name_to_dblp(name: str) -> str:
    """Translate a name to DBLP URL format: FirstName_MiddleName_LastName"""
    # Remove periods
    name = name.replace('.', '')

    parts = name.split()
    if not parts:
        return ''

    # Check for disambiguation number at end (e.g., "0001")
    disambiguation = ''
    if parts[-1].isdigit():
        disambiguation = parts[-1]
        parts = parts[:-1]

    if not parts:
        return ''

    # DBLP format: FirstName_MiddleName_LastName (underscores for spaces, = for hyphens)
    result = '_'.join(parts).replace('-', '=')

    # Add disambiguation if present
    if disambiguation:
        result = f"{result}_{disambiguation}"

    return result


def check_dblp_name(name: str) -> dict:
    """
    Check if a name exists in DBLP.
    Returns dict with 'found', 'exact_match', and 'suggestions'.
    """
    result = {
        'found': False,
        'exact_match': False,
        'suggestions': [],
        'error': None
    }

    try:
        # Use DBLP author search API
        author_query = translate_name_to_dblp(name)
        if not author_query:
            result['error'] = 'Could not parse name'
            return result

        url = f"https://dblp.org/search/author/api?q=author%3A{quote(author_query)}%3A&format=json&c=10"

        response = requests.get(url, timeout=10)

        if response.status_code == 429:
            result['error'] = 'DBLP rate limited - please try again later'
            return result

        if response.status_code != 200:
            result['error'] = f'DBLP API returned status {response.status_code}'
            return result

        data = response.json()

        total = int(data.get('result', {}).get('completions', {}).get('@total', 0))

        if total > 0:
            result['found'] = True
            hits = data.get('result', {}).get('hits', {}).get('hit', [])

            # Collect suggestions
            for hit in hits[:5]:
                author = hit.get('info', {}).get('author', '')
                if author:
                    result['suggestions'].append(author)
                    # Check for exact match
                    if author.lower() == name.lower():
                        result['exact_match'] = True

    except requests.RequestException as e:
        result['error'] = f'DBLP request failed: {str(e)}'
    except Exception as e:
        result['error'] = f'DBLP check error: {str(e)}'

    return result


def check_homepage_accessible(url: str, name: str, institution: str) -> dict:
    """
    Check if homepage is accessible and contains expected content.
    Returns dict with 'accessible', 'name_found', 'institution_found', 'error'.
    """
    result = {
        'accessible': False,
        'name_found': False,
        'institution_found': False,
        'error': None
    }

    # Use validate_homepage module if available
    if has_valid_homepage is not None:
        try:
            valid, warnings = has_valid_homepage(url, name, institution)
            result['accessible'] = True
            result['name_found'] = 'name' not in str(warnings).lower() if warnings else True
            result['institution_found'] = 'institution' not in str(warnings).lower() if warnings else True
            return result
        except Exception as e:
            result['error'] = str(e)
            return result

    # Fallback: simple accessibility check
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)

        if response.status_code == 200:
            result['accessible'] = True

            # Simple text extraction
            text = response.text.lower()
            # Remove scripts and styles
            text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = ' '.join(text.split())

            # Check for name (normalize both)
            name_norm = unidecode.unidecode(name).lower()
            if name_norm in text or name.lower() in text:
                result['name_found'] = True

            # Check for institution
            inst_norm = unidecode.unidecode(institution).lower()
            if inst_norm in text or institution.lower() in text:
                result['institution_found'] = True
        else:
            result['error'] = f'HTTP {response.status_code}'

    except requests.RequestException as e:
        result['error'] = str(e)

    return result


def check_duplicate_entry(name: str) -> dict:
    """
    Check if an entry with this name already exists.
    Returns dict with 'exists', 'current_institution', 'current_file'.
    """
    result = {
        'exists': False,
        'current_institution': None,
        'current_homepage': None,
        'current_scholarid': None,
        'current_file': None
    }

    # Determine which file to check
    first_letter = name[0].lower() if name else ''
    if first_letter.isalpha():
        filename = f'csrankings-{first_letter}.csv'
    else:
        filename = 'csrankings-0.csv'

    if not os.path.exists(filename):
        return result

    name_norm = unidecode.unidecode(name).lower().strip()

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None)  # Skip header
            for row in reader:
                if len(row) >= 4:
                    existing_name = row[0].strip()
                    existing_norm = unidecode.unidecode(existing_name).lower().strip()
                    if existing_norm == name_norm:
                        result['exists'] = True
                        result['current_institution'] = row[1].strip()
                        result['current_homepage'] = row[2].strip()
                        result['current_scholarid'] = row[3].strip()
                        result['current_file'] = filename
                        break
    except Exception:
        pass

    return result


def set_output(name: str, value: str):
    """Set GitHub Actions output variable."""
    # Use environment file for outputs (new style)
    github_output = os.environ.get('GITHUB_OUTPUT')
    if github_output:
        with open(github_output, 'a') as f:
            f.write(f"{name}={value}\n")
    else:
        # Fallback to old style (deprecated)
        print(f"::set-output name={name}::{value}")


def main():
    parser = argparse.ArgumentParser(description='Validate a faculty submission')
    parser.add_argument('--name', required=True, help='Faculty name as it appears in DBLP')
    parser.add_argument('--institution', required=True, help='Institution name')
    parser.add_argument('--homepage', required=True, help='Homepage URL')
    parser.add_argument('--scholarid', required=True, help='Google Scholar ID')
    parser.add_argument('--action', default='add', choices=['add', 'update'],
                        help='Type of submission (add new or update existing)')

    args = parser.parse_args()

    errors = []
    warnings = []

    print(f"Validating submission:")
    print(f"  Name: {args.name}")
    print(f"  Institution: {args.institution}")
    print(f"  Homepage: {args.homepage}")
    print(f"  Scholar ID: {args.scholarid}")
    print(f"  Action: {args.action}")
    print()

    # 1. Check Google Scholar ID (format + page verification)
    print("Checking Google Scholar ID...")
    if not has_valid_google_scholar_id(args.scholarid):
        errors.append(f"- **Google Scholar ID**: Must be exactly 12 characters ending in J, or `NOSCHOLARPAGE`. Got: `{args.scholarid}`")
    else:
        print("  ✓ Valid format")
        # Also check that the page exists and contains the name
        if args.scholarid != 'NOSCHOLARPAGE':
            gs_check = check_google_scholar_page(args.scholarid, args.name)
            if gs_check['error']:
                if 'Rate limited' in str(gs_check['error']):
                    warnings.append(f"- **Google Scholar**: Could not verify ({gs_check['error']})")
                elif gs_check['accessible']:
                    warnings.append(f"- **Google Scholar**: Page accessible but {gs_check['error']}")
                else:
                    errors.append(f"- **Google Scholar**: {gs_check['error']}")
            elif gs_check['valid']:
                print("  ✓ Scholar page verified")

    # 2. Check institution exists
    print("Checking institution...")
    if not check_institution_exists(args.institution):
        errors.append(f"- **Institution**: `{args.institution}` not found in CSRankings. [Request new institution](https://github.com/emeryberger/CSrankings/issues/new) first.")
    else:
        exact_name = get_exact_institution_name(args.institution)
        if exact_name != args.institution:
            warnings.append(f"- Institution name will be normalized to: `{exact_name}`")
        print(f"  ✓ Found: {exact_name}")

    # 3. Check for duplicate (for 'add' action)
    if args.action == 'add':
        print("Checking for existing entry...")
        dup = check_duplicate_entry(args.name)
        if dup['exists']:
            errors.append(f"- **Duplicate**: An entry for `{args.name}` already exists at `{dup['current_institution']}`. Use the 'update' action to modify existing entries.")
        else:
            print("  ✓ No duplicate found")

    # 4. Check DBLP name
    print("Checking DBLP...")
    time.sleep(0.5)  # Rate limiting
    dblp = check_dblp_name(args.name)
    if dblp['error']:
        warnings.append(f"- **DBLP**: Could not verify ({dblp['error']}). Manual review required.")
    elif not dblp['found']:
        errors.append(f"- **DBLP**: Name `{args.name}` not found. Check [DBLP](https://dblp.org/search) for exact spelling.")
    elif not dblp['exact_match']:
        suggestions = ', '.join(f'`{s}`' for s in dblp['suggestions'][:3])
        warnings.append(f"- **DBLP**: Name found but not exact match. Suggestions: {suggestions}")
    else:
        print("  ✓ Found exact match")

    # 5. Check homepage
    print("Checking homepage...")
    hp = check_homepage_accessible(args.homepage, args.name, args.institution)
    if hp['error']:
        errors.append(f"- **Homepage**: Not accessible ({hp['error']})")
    elif not hp['accessible']:
        errors.append(f"- **Homepage**: URL did not return HTTP 200")
    else:
        print("  ✓ Accessible")
        if not hp['name_found']:
            warnings.append(f"- **Homepage**: Faculty name not found on page")
        if not hp['institution_found']:
            warnings.append(f"- **Homepage**: Institution not found on page")

    # Output results
    print()
    if errors:
        print("❌ Validation FAILED")
        print()
        for error in errors:
            print(error)
        if warnings:
            print()
            print("Warnings:")
            for warning in warnings:
                print(warning)

        error_text = "\\n".join(errors)
        if warnings:
            error_text += "\\n\\n**Warnings:**\\n" + "\\n".join(warnings)
        set_output('valid', 'false')
        set_output('errors', error_text)
        sys.exit(1)
    else:
        print("✅ Validation PASSED")
        if warnings:
            print()
            print("Warnings (non-blocking):")
            for warning in warnings:
                print(warning)
        set_output('valid', 'true')
        set_output('errors', '')
        sys.exit(0)


if __name__ == '__main__':
    main()
