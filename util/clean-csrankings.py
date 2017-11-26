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

# Load alias lists (name -> [aliases])
aliases = {}
with open('dblp-aliases.csv', mode='rb') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        print row
        if row['name'] in aliases:
            aliases[row['name']].append(row['alias'])
        else:
            aliases[row['name']] = [row['alias']]

# Read in CSrankings file.
csrankings = {}
with open('csrankings.csv', mode='rb') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        csrankings[row['name']] = { 'affiliation' : row['affiliation'],
                                    'homepage'    : row['homepage'],
                                    'scholarid'   : row['scholarid'] }

# Now process for aliases.
for name in aliases:
    if name in csrankings:
        # Make sure all aliases are there.
        for a in aliases[name]:
            # Add any missing aliases.
            if not a in csrankings:
                # print("Missing "+a+"\n")
                csrankings[a] = csrankings[name]

# Now correct any missing scholar pages.
for name in csrankings:
    if csrankings[name]['scholarid'] == 'NOSCHOLARPAGE':
        page = "NOSCHOLARPAGE"
        if name in aliases:
            for a in aliases[name]:
                if csrankings[a]['scholarid'] != 'NOSCHOLARPAGE':
                    page = csrankings[a]['scholarid']
        if page != "NOSCHOLARPAGE":
            csrankings[name]['scholarid'] = page

# Sort csrankings by name.

csrankings = OrderedDict(sorted(csrankings.items(), key=lambda t: t[0]))

# Now rewrite csrankings.csv.

print csrankings

with open('csrankings.csv', mode='wb') as outfile:
    sfieldnames = ['name', 'affiliation', 'homepage', 'scholarid']
    swriter = csv.DictWriter(outfile, fieldnames=sfieldnames)
    swriter.writeheader()
    for n in csrankings:
        print("yomama "+n+"\n")
        h = { 'name' : n,
              'affiliation' : csrankings[n]['affiliation'],
              'homepage'    : csrankings[n]['homepage'],
              'scholarid'   : csrankings[n]['scholarid'] }
        swriter.writerow(h)
        
