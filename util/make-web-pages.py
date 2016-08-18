# Identify faculty home pages by using Google's "I'm Feeling Lucky"
# search for both their name and their home page.

import sys
import urllib2
import csv
import operator
import re
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
for name in facultydict:
    # Skip any homepages we have already in the database.
    if (name in homepages):
        continue
    n1 = name
    name = name.decode('utf8')
    str = urllib2.quote(name.encode('utf8') + ' ' + facultydict[n1], safe='')
    # The URL to do an I'm Feeling Lucky search.
    passedurl = "http://www.google.com/search?q=" + str + '&btnI'
    # Identify the actual URL we get redirected to.
    actualURL = requests.head(passedurl, timeout=100.0 , headers={'Accept-Encoding': 'identity'}).headers.get('location', passedurl)
    # Output the name and this resolved URL.
    print(name.encode('utf8') + " , " + actualURL)
    sys.stdout.flush()
    # Throttle lookups to avoid getting cut off by Google.
    sleep(0.2)

    
