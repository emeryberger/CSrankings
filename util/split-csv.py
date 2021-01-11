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
    with open(fname, mode='r') as infile:
        rdr = csv.reader(infile)
        d = {unicode(rows[0].strip(), 'utf-8'): unicode(rows[1].strip(), 'utf-8') for rows in rdr}
    return d

# Merge all 'csrankings-[0-9].csv' into 'csrankings.csv'.
with open('csrankings.csv', mode='w') as outfile:
    fieldnames = ["name","affiliation","homepage","scholarid"]
    writer = csv.DictWriter(outfile, fieldnames)
    writer.writeheader()
    for i in range(10):
        try:
            fname = "csrankings-" + str(i) + ".csv"
            with open(fname, mode='r') as infile:
                reader = csv.DictReader(infile)
                for row in reader:
                    writer.writerow(row)
        except BaseException as be:
            pass

# Now create all the subsidiary files.
with open('csrankings.csv', mode='r') as infile:
    reader = csv.DictReader(infile)
    with open('homepages.csv', mode='w') as homepages:
        homefieldnames = ['name', 'homepage']
        homepageWriter = csv.DictWriter(homepages, fieldnames=homefieldnames)
        homepageWriter.writeheader()
        with open('scholar.csv', mode='w') as scholarlinks:
            scholarfieldnames = ['name', 'scholarid']
            scholarWriter = csv.DictWriter(scholarlinks, fieldnames=scholarfieldnames)
            scholarWriter.writeheader()
            with open('faculty-affiliations.csv', 'w') as facultyaffs:
                facfieldnames = ['name', 'affiliation']
                facWriter = csv.DictWriter(facultyaffs, fieldnames=facfieldnames)
                facWriter.writeheader()
                for row in reader:
                    match = re.match('(.*)\s+\[(.*)\]', row['name'])
                    if match:
                        row['name'] = match.group(1)
                    h = { 'name' : row['name'],
                          'homepage' : row['homepage'] }
                    homepageWriter.writerow(h)
                    s = { 'name' : row['name'],
                          'scholarid' : row['scholarid'] }
                    scholarWriter.writerow(s)
                    f = { 'name' : row['name'],
                          'affiliation' : row['affiliation'] }
                    
                    facWriter.writerow(f)

