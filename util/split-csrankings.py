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
import os
import string

# https://stackoverflow.com/a/518232/335756
import unicodedata


def strip_accents(s):
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


print(strip_accents("Ítalo")[0].lower())

# Split 'csrankings.csv'

fieldnames = ["name", "affiliation", "homepage", "scholarid"]
with open("csrankings.csv", mode="r") as infile:
    reader = csv.DictReader(infile)
    arr = [row for row in reader]
    arr.sort(key=lambda a: strip_accents(a["name"]))
    index = 0
    # Create all the files with headers
    for ch in list(string.ascii_lowercase):
        fname = "csrankings-" + ch + ".csv"
        with open(fname, mode="w") as outfile:
            writer = csv.DictWriter(outfile, fieldnames)
            writer.writeheader()
    # Now iterate through them, appending to each as appropriate
    outfile = {}
    writer = {}
    for ch in list(string.ascii_lowercase):
        fname = "csrankings-" + ch + ".csv"
        outfile[ch] = open(fname, mode="a")
        writer[ch] = csv.DictWriter(outfile[ch], fieldnames)
    for item in arr:
        ch = strip_accents(item["name"])[0].lower()
        for i in fieldnames:
            if item[i] == "":
                print(item[i], index)
        if item["scholarid"] == "":
            item["scholarid"] = "NOSCHOLARPAGE"
        if item["scholarid"] != "NOSCHOLARPAGE" and item["scholarid"][-5:] != "AAAAJ":
            print(item["scholarid"], index)
        writer[ch].writerow(item)
    # Finally, cleanup.
    for ch in list(string.ascii_lowercase):
        outfile[ch].close()
