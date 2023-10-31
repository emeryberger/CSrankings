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


def csv2dict_str_str(fname):
    """Takes a CSV file and returns a dictionary of pairs."""
    with open(fname, mode="r") as infile:
        rdr = csv.reader(infile)
        d = {
            unicode(rows[0].strip(), "utf-8"): unicode(rows[1].strip(), "utf-8")
            for rows in rdr
        }
    return d


facultydict1 = csv2dict_str_str("faculty-affiliations.csv")
facultydict = OrderedDict(sorted(facultydict1.items(), key=lambda t: t[0]))
homepages = csv2dict_str_str("homepages.csv")
scholarLinks1 = csv2dict_str_str("scholar.csv")
scholarLinks = OrderedDict(sorted(scholarLinks1.items(), key=lambda t: t[0]))

with open("csrankings.csv", mode="wb") as outfile:
    fieldnames = ["name", "affiliation", "homepage", "scholarid"]
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()

    for authorName in facultydict:
        if authorName == "name":
            continue
        if scholarLinks.get(authorName, "XX") == "NOENTRYYET":
            scholarLinks[authorName] = "NOSCHOLARPAGE"
        entry = {
            "name": authorName.encode("utf8"),
            "affiliation": facultydict[authorName].encode("utf8"),
            "homepage": homepages[authorName].encode("utf8"),
            "scholarid": scholarLinks.get(authorName, "NOSCHOLARPAGE"),
        }
        writer.writerow(entry)
