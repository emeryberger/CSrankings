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
aliasToName = {}
with open('dblp-aliases.csv', mode='rb') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        if row['name'] in aliases:
            aliases[row['name']].append(row['alias'])
        else:
            aliases[row['name']] = [row['alias']]
        aliasToName[row['alias']] = row['name']

# Read in CSrankings file.
csrankings = {}
with open('csrankings.csv', mode='rb') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        csrankings[row['name']] = { 'affiliation' : row['affiliation'],
                                    'homepage'    : row['homepage'],
                                    'scholarid'   : row['scholarid'] }

# Add any missing aliases.
for name in aliases:
    if name in csrankings:
        # Make sure all aliases are there.
        for a in aliases[name]:
            # Add any missing aliases.
            if not a in csrankings:
                # print("Missing "+a+"\n")
                csrankings[a] = csrankings[name]
    else:
        # There might be a name that isn't there but an alias that IS. If so, add the name.
        for a in aliases[name]:
            if a in csrankings:
                csrankings[name] = csrankings[a]
                break

# Correct any missing scholar pages.
for name in csrankings:
    if csrankings[name]['scholarid'] == 'NOSCHOLARPAGE':
        page = "NOSCHOLARPAGE"
        if name in aliases:
            for a in aliases[name]:
                if csrankings[a]['scholarid'] != 'NOSCHOLARPAGE':
                    page = csrankings[a]['scholarid']
        if name in aliasToName:
            if csrankings[aliasToName[name]] != 'NOSCHOLARPAGE':
                page = csrankings[aliasToName[name]]['scholarid']
                
        if page != "NOSCHOLARPAGE":
            csrankings[name]['scholarid'] = page

# Sort csrankings by name.

csrankings = OrderedDict(sorted(csrankings.items(), key=lambda t: t[0]))

# Now rewrite csrankings.csv.

with open('csrankings.csv', mode='wb') as outfile:
    sfieldnames = ['name', 'affiliation', 'homepage', 'scholarid']
    swriter = csv.DictWriter(outfile, fieldnames=sfieldnames)
    swriter.writeheader()
    for n in csrankings:
        h = { 'name' : n,
              'affiliation' : csrankings[n]['affiliation'],
              'homepage'    : csrankings[n]['homepage'],
              'scholarid'   : csrankings[n]['scholarid'] }
        swriter.writerow(h)
        
