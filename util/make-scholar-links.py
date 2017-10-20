# Identify faculty home pages.
#import google

import scholarly

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

import requests

facultydict = csv2dict_str_str('faculty-affiliations.csv')
homepages = csv2dict_str_str('scholar.csv')

with codecs.open("scholar.csv", "a", "utf8") as outfile:
    facultydictkeys = list(facultydict.keys())
    random.shuffle(facultydictkeys)
    for name in facultydictkeys:
        # Skip any homepages we have already in the database.
        if (name in homepages):
            # ...unless it's a Google search page, then we will try again to fix it.
            # match = re.search('www.google.com', homepages[name])
            # if (match == None):
            continue
        # str = '"' + facultydict[name] + '" "' + name + '"'
        dept = facultydict[name]
        str = name + ", " + dept
        print str
        # "University of Massachusetts Amherst" author:Emery author:Berger
        # Grab first result from Google search.
        #search_query = scholarly.search_author('Emery D. Berger, University of Massachusetts Amherst')
        #print(next(search_query))
        try:
            actualURL = "FIXME"
            search_query = scholarly.search_author(name)
            name = name.decode('utf8')
            try:
                author = next(search_query).fill()
                # print author
                id = ""
                for (key, value) in author.__dict__.items():
                    if (key == "id"):
                        id = value 
                        # https://scholar.google.com/citations?user=RaHaArkAAAAJ&hl=en&oi=ao
                actualURL = id # "https://scholar.google.com/citations?user="+id+"&hl=en&oi=ao"
                # print actualURL
            except:
                continue
        
            if actualURL == "FIXME":
                continue
        
            if (not (name in homepages)):
                # It's a new name, what are you gonna do (even if it is a
                # Google link, include it).
                outfile.write(name + "," + actualURL + "\n")
                outfile.flush()
                print(name + "," + actualURL)
                actualURL = "https://scholar.google.com/citations?user="+actualURL+"&hl=en&oi=ao"
            else:
                print("Lookup failed for "+name+" -- found "+actualURL)
        
            sys.stdout.flush()
            # Throttle lookups to avoid getting cut off by Google.
            time.sleep(2.0)
        except:
            continue

