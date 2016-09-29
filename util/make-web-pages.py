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
with open("homepages.csv", mode='a') as outfile:
    for name in facultydict:
        # Skip any homepages we have already in the database.
        if (name in homepages):
            continue
        n1 = name
        name = name.decode('utf8')
        str = urllib2.quote(name.encode('utf8') + ' ' + facultydict[n1], safe='')
        # The URL to do an I'm Feeling Lucky search.
        # passedurl = "http://www.google.com/search?id=gbqfbb&btnI&q=" + str
        passedurl = "http://www.google.com/search?ie=UTF-8&oe=UTF-8&sourceid=navclient&gfns=1&q=" + str
        h = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64)' }
        
        # Identify the actual URL we get redirected to.
        actualURL = requests.head(passedurl, timeout=100.0 , headers=h).headers.get('location', passedurl)
        
        # Output the name and this resolved URL.
        outfile.write(name.encode('utf8') + " , " + actualURL + "\n")
        print(name.encode('utf8') + " , " + actualURL)
        sys.stdout.flush()
        # Throttle lookups to avoid getting cut off by Google.
        sleep(2.0)

    
