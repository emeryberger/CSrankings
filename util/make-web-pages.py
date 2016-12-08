# Identify faculty home pages by using Google's "I'm Feeling Lucky"
# search for both their name and their home page.

import sys
import random
import urllib2
import csv
import operator
import re
import google
from time import sleep
def csv2dict_str_str(fname):
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        #for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = { rows[0].strip(): rows[1].strip() for rows in reader}
    return d

import requests

facultydict = csv2dict_str_str('faculty-affiliations.csv')
homepages = csv2dict_str_str('homepages.csv')
# Trim out LinkedIn and RateMyProfessors sites, etc.
trim = ['ratemyprofessors.com', 'linkedin.com', 'wikipedia.org','2016','2015','.pdf']

with open("homepages.csv", mode="a") as outfile:
    facultydictkeys = list(facultydict.keys())
    random.shuffle(facultydictkeys)
    for name in facultydictkeys:
        # Skip any homepages we have already in the database.
        if (name in homepages):
            # ...unless it's a Google search page, then we will try again to fix it.
            match = re.search('www.google.com', homepages[name])
            if (match == None):
                continue
        str = name + ' ' + facultydict[name]
        name = name.decode('utf8')
        # Grab first result from Google search.
        results = google.search(str, stop=1)
        actualURL = "FIXME"
        for url in results:
            actualURL = url
            matched = 0
            for t in trim:
                match = re.search(t, url)
                if (match != None):
                    matched = matched + 1
            if (matched == 0):
                break
                        
        # Output the name and this resolved URL.
        match = re.search('www.google.com', actualURL)
        name = name.encode('utf8')
        if (match == None):
            # Not a google link.
            print(name + "," + actualURL)
            outfile.write(name + "," + actualURL + "\n")
        else:
            if (not (name in homepages)):
                # It's a new name, what are you gonna do (even if it is a
                # Google link, include it).
                print(name + "," + actualURL)
                outfile.write(name + "," + actualURL + "\n")
            else:
                print("Lookup failed for "+name+" -- found "+actualURL)
        sys.stdout.flush()
        # Throttle lookups to avoid getting cut off by Google.
        sleep(2.0)

