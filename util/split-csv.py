#!/usr/bin/env python

from collections import *
import gzip
import xmltodict
import collections
import json
import csv
import re
import sys
import operator
import string


def csv2dict_str_str(fname):
    """Takes a CSV file and returns a dictionary of pairs."""
    with open(fname, mode="r") as infile:
        rdr = csv.reader(infile)
        d = {
            unicode(rows[0].strip(), "utf-8"): unicode(rows[1].strip(), "utf-8")
            for rows in rdr
        }
    return d


# Merge all 'csrankings-*.csv' into 'csrankings.csv'.

import hashlib

# Read fieldnames from the first file to preserve all columns dynamically
with open("csrankings-a.csv", mode="r") as first_file:
    first_reader = csv.DictReader(first_file)
    fieldnames = first_reader.fieldnames

added = set()
with open("csrankings.csv", mode="w") as outfile:
    writer = csv.DictWriter(outfile, fieldnames)
    writer.writeheader()
    for i in list(string.ascii_lowercase):
        print("processing " + i)
        fname = "csrankings-" + i + ".csv"
        with open(fname, mode="r") as infile:
            reader = csv.DictReader(infile)
            lineno = 2
            for row in reader:
                try:
                    # Ensure orcid field exists (for backwards compatibility)
                    if "orcid" in fieldnames and "orcid" not in row:
                        row["orcid"] = "0000-0000-0000-0000"
                    hashrow = hashlib.md5(str(row).encode("utf8"))
                    if hashrow not in added:
                        writer.writerow(row)
                        added.add(hashrow)
                except:
                    print(f"*** issue on line {lineno}, file {fname} ***")
                finally:
                    lineno += 1

# Now create all the subsidiary files.
with open("csrankings.csv", mode="r") as infile:
    reader = csv.DictReader(infile)
    with open("homepages.csv", mode="w") as homepages:
        homefieldnames = ["name", "homepage"]
        homepageWriter = csv.DictWriter(homepages, fieldnames=homefieldnames)
        homepageWriter.writeheader()
        with open("scholar.csv", mode="w") as scholarlinks:
            scholarfieldnames = ["name", "scholarid"]
            scholarWriter = csv.DictWriter(scholarlinks, fieldnames=scholarfieldnames)
            scholarWriter.writeheader()
            with open("faculty-affiliations.csv", "w") as facultyaffs:
                facfieldnames = ["name", "affiliation"]
                facWriter = csv.DictWriter(facultyaffs, fieldnames=facfieldnames)
                facWriter.writeheader()
                for row in reader:
                    match = re.match(r"(.*)\s+\[(.*)\]", row["name"])
                    if match:
                        row["name"] = match.group(1)
                    h = {"name": row["name"], "homepage": row["homepage"]}
                    homepageWriter.writerow(h)
                    s = {"name": row["name"], "scholarid": row["scholarid"]}
                    scholarWriter.writerow(s)
                    f = {
                        "name": row["name"],
                        "affiliation": row["affiliation"],
                    }

                    facWriter.writerow(f)
