# Identify faculty home pages.
#import google

import os
import scholarly
from collections import *

import codecs
import sys
import random
import urllib2
import operator
import re
import time

def csv2dict_str_str(fname):
    import csv
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        #for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = { rows[0].strip(): rows[1].strip() for rows in reader}
    return d


facultydict = csv2dict_str_str('faculty-affiliations.csv')
scholarLinks1 = csv2dict_str_str('scholar.csv')
aliases = csv2dict_str_str('dblp-aliases.csv')
# Sort
scholarLinks = OrderedDict(sorted(scholarLinks1.items(), key=lambda t: t[0]))

checked = csv2dict_str_str('scholar-visited.csv')
now = time.time()
expirationDate = 60 * 60 * 7 * 4 # Four weeks

def getScholarID(name):
    print "Checking "+name
    if name in scholarLinks:
        # Already there.
        print "Found"
        return scholarLinks[name]
    if name in checked:
        if now - float(checked[name]) < expirationDate:
            return None
    origname = name
    # Trim off any trailing numerical suffixes.
    r = re.match(".*\s\d\d\d\d$", name)
    if r != None:
        name = name[:-5]
    if (name in scholarLinks):
        return scholarLinks[name]
    actualID = "FIXME"
    try:
        search_query = scholarly.search_author(name)
        name = name.decode('utf8')
        author = next(search_query).fill()
        # print author
        for (key, value) in author.__dict__.items():
            if (key == "id"):
                actualID = value
                scholarLinks[origname] = actualID
                return actualID
    except:
        return None
    return None

import requests

# Working through top 20 US first, then the rest.
schoolList = ["Carnegie Mellon University",
              "Massachusetts Institute of Technology",
              "Stanford University",
              "University of California - Berkeley",
              "University of Illinois at Urbana-Champaign",
              "Cornell University",
              "University of Michigan",
              "University of Washington",
              "Georgia Institute of Technology",
              "University of California - San Diego",
              "Columbia University",
              "University of Wisconsin - Madison",
              "University of Southern California",
              "University of Pennsylvania",
              "University of Texas at Austin",
              "Princeton University",
              "Purdue University",
              "University of California - Los Angeles"]

schoolList = [
    "Northeastern University",
    "New York University",
    "University of California - Irvine",
    "Harvard University",
    "Pennsylvania State University",
    "University of California - Santa Barbara",
    "Stony Brook University",
    "Ohio State University",
    "Rutgers University",
    "University of Utah",
    "University of Minnesota",
    "Rice University" ]

schools = {}
for s in schoolList:
    schools[s] = True

with codecs.open("scholar2.csv", "w", "utf8") as outfile:
    outfile.write("name,scholarid\n")
    for name in scholarLinks:
        if (name == "name"):
            continue
        outfile.write(name.decode('utf8') + "," + scholarLinks[name] + "\n")
    outfile.flush()

os.rename("scholar2.csv","scholar.csv")

with codecs.open("scholar.csv", "a", "utf8") as outfile:
    with codecs.open("scholar-visited.csv", "a", "utf8") as visitedFile:
        facultydictkeys = list(facultydict.keys())
        random.shuffle(facultydictkeys)
        for name in facultydictkeys:
            now = time.time()
            if facultydict[name] not in schools:
                continue
            # Skip any scholarLinks we have already in the database.
            if name in aliases:
                name = aliases[name]
            if name in scholarLinks:
                continue
            if name in checked:
                if now - float(checked[name]) < expirationDate:
                    continue
            now = time.time()
            s = "%10.2f" % now
            visitedFile.write(name.decode('utf8') + "," + s + "\n")
            visitedFile.flush()
            dept = facultydict[name]
            print "checking "+name+" at "+dept
            id = getScholarID(name)
            if id == None:
                # Try to remove a middle name.
                r = re.match(".* [A-Z]\. *", name)
                if r != None:
                    nomiddlename = re.sub(" [A-Z]\. ", " ", name)
                    id = getScholarID(nomiddlename)
            if id == None:
                continue
            str = name + ", " + dept
            print str
            # It's a new name, what are you gonna do (even if it is a
            # Google link, include it).
            name = name.decode('utf8')
            outfile.write(name + "," + id + "\n")
            outfile.flush()
            print(name + "," + id)
            actualURL = "https://scholar.google.com/citations?user="+id+"&hl=en&oi=ao"
        
            sys.stdout.flush()

