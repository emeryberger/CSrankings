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
with open("homepages.csv", mode='a') as outfile:
    facultydictkeys = list(facultydict.keys())
    random.shuffle(facultydictkeys)
    for name in facultydictkeys:
        # Skip any homepages we have already in the database.
        if (name in homepages):
            # ...unless it's a Google search page, then we will try again to fix it.
            match = re.search('www.google.com', homepages[name])
            if (match == None):
                continue
        n1 = name
        name = name.decode('utf8')
        # Grab first result from Google search.
        str = n1 + ' ' + facultydict[n1]
        results = google.search(str, stop=1)
        actualURL = "FIXME"
        # Trim out LinkedIn and RateMyProfessors site....
        for url in results:
            actualURL = url
            match = re.search('ratemyprofessors.com', url)
            if (match == None):
                match = re.search('linkedin.com', url)
                if (match == None):
                    break
                        
        # Output the name and this resolved URL.
        match = re.search('www.google.com', actualURL)
        if (match == None):
            # Not a google link.
            outfile.write(name.encode('utf8') + "," + actualURL + "\n")
            print(name.encode('utf8') + "," + actualURL)
        else:
            if (not (name in homepages)):
                # It's a new name, what are you gonna do (even if it is a
                # Google link, include it).
                outfile.write(name.encode('utf8') + "," + actualURL + "\n")
                print(name.encode('utf8') + "," + actualURL)
            else:
                print("Lookup failed for "+name+" -- found "+actualURL)
        sys.stdout.flush()
        # Throttle lookups to avoid getting cut off by Google.
        sleep(2.0)

