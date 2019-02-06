#!/usr/bin/env python

import codecs
import collections
import csv
import google
import gzip
import json
import operator
import pkg_resources
import random
import re
import requests
import sys
import time
#import urllib2
import xmltodict


# make random REALLY random.
seed = random.SystemRandom().random()
random.seed(seed)

# Trim out LinkedIn and RateMyProfessors sites, etc.
trimstrings = ['\.php\?', 'youtube', 'researchgate', 'dblp.uni-trier.','ratemyprofessors.com', 'linkedin.com', 'wikipedia.org','2018','2017','2016','2015','\.pdf','wikipedia']


def find_fix(name,affiliation):
    string = name + ' ' + affiliation
    results = google.search(string, stop=1)
    actualURL = "http://csrankings.org"
    for url in results:
        actualURL = url
        matched = 0
        for t in trimstrings:
            match = re.search(t, url)
            if (match != None):
                matched = matched + 1
        if (matched == 0):
            break
                        
    # Output the name and this resolved URL.
    match = re.search('www.google.com', actualURL)
    if (match == None):
        return actualURL
    else:
        return "http://csrankings.org"

#print(find_fix("Michael H. Albert","University of Otago"))

# sys.exit()


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

#c = 0
#for n in aliases:
#    c = c +1
#print("c = "+str(c))

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
                if a in csrankings and csrankings[a]['scholarid'] != 'NOSCHOLARPAGE':
                    page = csrankings[a]['scholarid']
        if name in aliasToName:
            if csrankings[aliasToName[name]] != 'NOSCHOLARPAGE':
                page = csrankings[aliasToName[name]]['scholarid']
                
        if page != "NOSCHOLARPAGE":
            csrankings[name]['scholarid'] = page

# Fix inconsistent home pages.
for name in csrankings:
    page = csrankings[name]['homepage']
    if name in aliases:
        for a in aliases[name]:
            if a in csrankings and csrankings[a]['homepage'] != page:
                if page == "http://csrankings.org":
                    page = csrankings[a]['homepage']
                csrankings[a]['homepage'] = page

# Find and flag inconsistent affiliations.
for name in csrankings:
    aff = csrankings[name]['affiliation']
    if name in aliases:
        for a in aliases[name]:
            if a in csrankings and csrankings[a]['affiliation'] != aff:
                print("INCONSISTENT AFFILIATION: "+name)

# Find and flag inconsistent Google Scholar pages.
for name in csrankings:
    sch = csrankings[name]['scholarid']
    if name in aliases:
        for a in aliases[name]:
            if a in csrankings and csrankings[a]['scholarid'] != sch:
                print("INCONSISTENT SCHOLAR PAGE: "+name)


# Make sure that Google Scholar pages are not accidentally duplicated across different authors.
# This can mean one of two things:
# (a) the Google Scholar entries are wrong, and/or
# (b) there is a missing alias that needs to be added to dblp-aliases.csv.

scholars = {}
for name in csrankings:
    sch = csrankings[name]['scholarid']
    if sch == "NOSCHOLARPAGE":
        continue
    if sch in scholars:
        scholars[sch].append(name)
    else:
        scholars[sch] = [name]

for sch in scholars:
    if len(scholars[sch]) > 1:
        # Verify all are aliases.
        total = len(scholars[sch])
        for name in scholars[sch]:
            if name in aliases:
                total -= len(aliases[name])
        if total >= 2: # At least one name is not an alias!
            print("For Google Scholar entry " + sch + ", there is a clash: " + str(scholars[sch]))

# Look up web sites. If we get a 404 or similar, disable the homepage for now.

count = 0
ks = list(csrankings.keys())
random.shuffle(ks)
ks = ks[:count]

for name in ks:
    page = csrankings[name]['homepage']
    print("Testing "+page+" ("+name+")")
    try:
        r = requests.head(page,allow_redirects=True,timeout=3)
        print(r.status_code)
        if ((r.status_code == 404) or (r.status_code == 410) or (r.status_code == 500)):
            # prints the int of the status code. Find more at httpstatusrappers.com :)
            print("SEARCHING NOW FOR FIX FOR "+name)
            actualURL = find_fix(name, csrankings[name]['affiliation'])
            print("changed to "+actualURL)
            csrankings[name]['homepage'] = actualURL
            continue
        if (r.status_code == 301):
            print("redirect: changing home page from " + page + " to " + r.url)
            csrankings[name]['homepage'] = r.url
            continue
            
    except requests.ConnectionError:
        print("failed to connect")
        print("SEARCHING NOW FOR FIX FOR "+name)
        actualURL = find_fix(name, csrankings[name]['affiliation'])
        print("changed to "+actualURL)
        csrankings[name]['homepage'] = actualURL
    except:
        print("got me")



# Now rewrite csrankings.csv.

csrankings = collections.OrderedDict(sorted(csrankings.items(), key=lambda t: t[0]))
with open('csrankings.csv', mode='w') as outfile:
    sfieldnames = ['name', 'affiliation', 'homepage', 'scholarid']
    swriter = csv.DictWriter(outfile, fieldnames=sfieldnames)
    swriter.writeheader()
    for n in csrankings:
        h = { 'name' : n,
              'affiliation' : csrankings[n]['affiliation'],
              'homepage'    : csrankings[n]['homepage'].rstrip('/'),
              'scholarid'   : csrankings[n]['scholarid'] }
        swriter.writerow(h)
        
