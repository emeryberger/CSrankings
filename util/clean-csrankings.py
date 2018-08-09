#!/usr/bin/env python

from collections import *
import random
import requests
import gzip
import xmltodict
import collections
import json
import csv
import re
import sys
import operator

seed = random.SystemRandom().random()
random.seed(seed)

def csv2dict_str_str(fname):
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        #for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = { rows[0].strip(): rows[1].strip() for rows in reader}
    return d

# Load alias lists (name -> [aliases])
aliases = {}
aliasToName = {}
with open('dblp-aliases.csv', mode='r') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        if row['name'] in aliases:
            aliases[row['name']].append(row['alias'])
        else:
            aliases[row['name']] = [row['alias']]
        aliasToName[row['alias']] = row['name']

# Read in CSrankings file.
csrankings = {}
with open('csrankings.csv', mode='r') as infile:
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

# Look up web sites. If we get a 404 or similar, disable the homepage for now.

ks = list(csrankings.keys())
random.shuffle(ks)

count = 0

for name in ks:
    count = count + 1
    if count > 50:
        break
    page = csrankings[name]['homepage']
    failure = False
    try:
        r = requests.head(page)
        print(r.status_code)
        if (r.status_code == 404):
            failure = True
            # prints the int of the status code. Find more at httpstatusrappers.com :)
    except requests.ConnectionError:
        failure = False
        print("failed to connect")
    except:
        print("got me")
        failure = True
    if failure:
        print(name + " , " + page)
        csrankings[name]['homepage'] = 'http://csrankings.org'


# Now rewrite csrankings.csv.

csrankings = OrderedDict(sorted(csrankings.items(), key=lambda t: t[0]))
with open('csrankings.csv', mode='w') as outfile:
    sfieldnames = ['name', 'affiliation', 'homepage', 'scholarid']
    swriter = csv.DictWriter(outfile, fieldnames=sfieldnames)
    swriter.writeheader()
    for n in csrankings:
        h = { 'name' : n,
              'affiliation' : csrankings[n]['affiliation'],
              'homepage'    : csrankings[n]['homepage'],
              'scholarid'   : csrankings[n]['scholarid'] }
        swriter.writerow(h)
        
