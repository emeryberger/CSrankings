# Identify and *verify* faculty home pages.

import sys
import time
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
lastvalidated = csv2dict_str_str('homepage-validated.csv')
# Trim out LinkedIn and RateMyProfessors sites, etc.
trim = ['google.com','google.fr','ratemyprofessors.com', 'linkedin.com', 'wikipedia.org','2016','2015','.pdf']

now = time.time()

with open("homepages.csv", mode="a") as outfile:
    with open("homepage-validated.csv", mode="a") as appendfile:
        facultydictkeys = list(facultydict.keys())
        random.shuffle(facultydictkeys)
        for name in facultydictkeys:
            if name in lastvalidated:
                if now - float(lastvalidated[name]) < 60 * 60 * 24 * 4:
                    continue
            # Skip any homepages we have already in the database.
            if (name in homepages):
                match = re.search('www.google.com', homepages[name])
                if (match == None):
                    # Check for 404.
                    try:
                        print "checking " + homepages[name] + " (" + name + ")"
                        a=urllib2.urlopen(homepages[name], None, 10)
                        if a.getcode() >= 400:
                            print str(a.getcode()) + " : " + homepages[name]
                        else:
                            if a.getcode() >= 300:
                                # Redirect
                                print str(a.getcode()) + " : " + homepages[name] + " -> " + a.geturl()
                            else:
                                s = "%10.2f" % time.time() 
                                appendfile.write(name + "," + s + "\n")
                                appendfile.flush()
                                continue
                    except:
                        # Timeout
                        print "timeout: " + homepages[name]
                        # continue
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
                    #if actualURL != homepages[name]: # Skip if we already found this was a 404...
                    break
                        
            # Output the name and this resolved URL.
            match = re.search('www.google.com', actualURL)
            name = name.encode('utf-8')
            try:
                if (match == None):
                    # Not a google link.
                    print(name + "," + actualURL)
                    outfile.write(name + "," + actualURL + "\n")
                    outfile.flush()
                    s = "%10.2f" % time.time() 
                    appendfile.write(name + "," + s + "\n")
                    appendfile.flush()
                else:
                    if (not (name in homepages)):
                        # It's a new name, what are you gonna do (even if it is a
                        # Google link, include it).
                        print(name + "," + actualURL)
                        outfile.write(name + "," + actualURL + "\n")
                        outfile.flush()
                        s = "%10.2f" % time.time() 
                        appendfile.write(name + "," + s + "\n")
                        appendfile.flush()
                    else:
                        print("Lookup failed for "+name+" -- found "+actualURL)
            except UnicodeDecodeError as err:
                print("Unicode error: {0}".format(err))
                print("Lookup failed for "+name)
                print("Decode = "+name.decode('utf8'))
                print("URL = "+actualURL)
        
            sys.stdout.flush()
            # Throttle lookups to avoid getting cut off by Google.
            # sleep(2.0)

