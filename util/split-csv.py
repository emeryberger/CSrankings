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

with open('csrankings.csv', mode='rb') as infile:
    reader = csv.DictReader(infile)
    with open('homepages.csv', mode='wb') as homepages:
        homefieldnames = ['name', 'homepage']
        homepageWriter = csv.DictWriter(homepages, fieldnames=homefieldnames)
        homepageWriter.writeheader()
        with open('scholar.csv', mode='wb') as scholarlinks:
            scholarfieldnames = ['name', 'scholarid']
            scholarWriter = csv.DictWriter(scholarlinks, fieldnames=scholarfieldnames)
            scholarWriter.writeheader()
            with open('faculty-affiliations.csv', 'wb') as facultyaffs:
                facfieldnames = ['name', 'affiliation']
                facWriter = csv.DictWriter(facultyaffs, fieldnames=facfieldnames)
                facWriter.writeheader()
                for row in reader:
                    h = { 'name' : row['name'],
                          'homepage' : row['homepage'] }
                    homepageWriter.writerow(h)
                    s = { 'name' : row['name'],
                          'scholarid' : row['scholarid'] }
                    scholarWriter.writerow(s)
                    f = { 'name' : row['name'],
                          'affiliation' : row['affiliation'] }
                    
                    facWriter.writerow(f)

