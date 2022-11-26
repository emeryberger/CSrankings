# Identify and *verify* faculty home pages.

import os
import codecs
import socket
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
    with open(fname, mode="r") as infile:
        reader = csv.reader(infile)
        # for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = {rows[0].strip(): rows[1].strip() for rows in reader}
    return d


import requests

facultydict = csv2dict_str_str("faculty-affiliations.csv")
homepages = csv2dict_str_str("homepages.csv")
lastvalidated = csv2dict_str_str("homepage-validated.csv")

# Rewrite sorted.
with codecs.open("homepage-validated-temp.csv", "a", "utf8") as outfile:
    outfile.write("name,date\n")
    for name in sorted(lastvalidated):
        if name == "name":
            continue
        outfile.write(name.decode("utf8") + "," + lastvalidated[name] + "\n")

os.rename("homepage-validated-temp.csv", "homepage-validated.csv")

# Trim out LinkedIn and RateMyProfessors sites, etc.
trim = [
    "google.com",
    "google.fr",
    "ratemyprofessors.com",
    "linkedin.com",
    "wikipedia.org",
    "2016",
    "2015",
    ".pdf",
]

now = time.time()

expirationDate = 60 * 60  # * 7 * 4 # Four weeks
# expirationDate = 60 * 60 * 24 * 7 * 4 # Four weeks

with codecs.open("homepages.csv", "a", "utf8") as outfile:
    with codecs.open("homepage-validated.csv", "a", "utf8") as appendfile:
        facultydictkeys = list(facultydict.keys())
        random.shuffle(facultydictkeys)
        for name in facultydictkeys:
            timedOut = False
            if name == "name":
                continue
            if name in lastvalidated:
                if now - float(lastvalidated[name]) < expirationDate:
                    continue
            # Skip any homepages we have already in the database.
            if name in homepages:
                match = re.search("www.google.com", homepages[name])
                if match == None:
                    # Check for 404.
                    try:
                        print("checking " + homepages[
                            name
                        ] + " (" + name + ", " + facultydict[name] + ")")
                        a = urllib2.urlopen(homepages[name], None, 20)
                        if a.getcode() >= 400:
                            print(str(a.getcode()) + " : " + homepages[name])
                        else:
                            if a.getcode() >= 300:
                                # Redirect
                                print(str(a.getcode()) + " : " + homepages[
                                    name
                                ] + " -> " + a.geturl())
                            else:
                                s = "%10.2f" % time.time()
                                appendfile.write(
                                    name.decode("utf8") + "," + s + "\n"
                                )
                                appendfile.flush()
                                continue
                    except urllib2.URLError, e:
                        # For Python 2.6
                        if isinstance(e.reason, socket.timeout):
                            print("timeout: " + homepages[name])
                            timedOut = True
                    except socket.timeout, e:
                        # For Python 2.7
                        print("timeout: " + homepages[name])
                        timedOut = True
                        # continue
            str = name + " " + facultydict[name]
            name = name.decode("utf8")
            # Grab first result from Google search.
            results = google.search(str, stop=1)
            actualURL = "FIXME"
            for url in results:
                actualURL = url
                matched = 0
                for t in trim:
                    match = re.search(t, url)
                    if match != None:
                        matched = matched + 1
                if matched == 0:
                    if not timedOut:
                        break
                    else:
                        # Timed out on this URL? Try another one.
                        if actualURL == homepages[name.encode("utf8")]:
                            continue

            # Output the name and this resolved URL.
            match = re.search("www.google.com", actualURL)
            if True:  # indentation foo
                if match == None:
                    # Not a google link.
                    print(name + "," + actualURL)
                    sys.stdout.flush()
                    outfile.write(name + "," + actualURL + "\n")
                    outfile.flush()
                    s = "%10.2f" % time.time()
                    appendfile.write(name + "," + s + "\n")
                    appendfile.flush()
                else:
                    if not (name in homepages):
                        # It's a new name, what are you gonna do (even if it is a
                        # Google link, include it).
                        print(name + "," + actualURL)
                        sys.stdout.flush()
                        outfile.write(name + "," + actualURL + "\n")
                        outfile.flush()
                        s = "%10.2f" % time.time()
                        appendfile.write(name + "," + s + "\n")
                        appendfile.flush()
                    else:
                        print(
                            "Lookup failed for "
                            + name
                            + " -- found "
                            + actualURL
                        )

            sys.stdout.flush()
            # Throttle lookups to avoid getting cut off by Google.
            # sleep(2.0)
