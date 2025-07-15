import gzip
import xmltodict
import csv
import unicodedata
from collections import defaultdict
from typing import Set

def strong_normalize(name: str) -> str:
    return unicodedata.normalize("NFKC", name).strip().lower()

faculty_file = "faculty-affiliations.csv"
alias_file = "dblp-aliases.csv"
dblp_file = "dblp-fixed.xml.gz"
txt_output = "missing-names.txt"
csv_output = "missing-names-diagnostic.csv"

# Load aliases
alias_to_real = {}
real_to_alias = defaultdict(set)
with open(alias_file, newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        alias = strong_normalize(row["alias"])
        real = strong_normalize(row["name"])
        alias_to_real[alias] = real
        real_to_alias[real].add(alias)

# Load canonical faculty names (skip aliases)
canonical_faculty: Set[str] = set()
name_mapping = {}  # normalized -> original
with open(faculty_file, newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        norm_name = strong_normalize(name)
        if norm_name not in alias_to_real:
            canonical_faculty.add(norm_name)
            name_mapping[norm_name] = name

# Set of all normalized author names seen in DBLP
all_dblp_names: Set[str] = set()

count = 0

def handle_article(_, article) -> bool:
    global count
    
    count += 1
    if count % 10000 == 0:
        print(f"{count} parsed.")
    
    def extract(nameobj):
        if isinstance(nameobj, str):
            return strong_normalize(nameobj)
        elif isinstance(nameobj, dict):
            return strong_normalize(nameobj.get("#text", ""))
        return None

    authors = article.get("author", [])
   
    if isinstance(authors, list):
        for a in authors:
            n = extract(a)
            if n:
                all_dblp_names.add(n)
    else:
        n = extract(authors)
        if n:
            all_dblp_names.add(n)

    return True

print("Parsing.")

# Parse DBLP
with gzip.open(dblp_file) as f:
    xmltodict.parse(f, item_depth=2, item_callback=handle_article)

print("Done parsing.")

# Write missing names and diagnostics
missing = []
with open(csv_output, "w", newline="") as diag_csv, open(txt_output, "w") as txt_out:
    writer = csv.writer(diag_csv)
    writer.writerow(["Canonical Name", "Aliases Checked", "Found in DBLP"])

    for norm_name in sorted(canonical_faculty):
        all_aliases = sorted(real_to_alias[norm_name] | {norm_name})
        found = any(alias in all_dblp_names for alias in all_aliases)
        if not found:
            missing.append(name_mapping[norm_name])
            txt_out.write(name_mapping[norm_name] + "\n")
        alias_status = "; ".join(
            f"{alias}={'yes' if alias in all_dblp_names else 'no'}"
            for alias in all_aliases
        )
        writer.writerow([name_mapping[norm_name], alias_status, "no" if not found else "yes"])

print(f"{len(missing)} canonical names missing from DBLP.")
print(f"Wrote: {txt_output} and {csv_output}")
