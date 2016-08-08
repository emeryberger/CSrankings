# import urllib2
# import htmlentitydefs
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

# from collections import *
# from urllib.request import urlopen
# from urllib.parse import quote

#import urllib.parse
#import urllib.request
#import urllib.response
#from urllib.error import URLError, HTTPError
#from urllib.request import Request, urlopen
import requests

facultydict1 = csv2dict_str_str('faculty-affiliations.csv')
homepages = csv2dict_str_str('homepages.csv')
print "name , homepage"
for name in facultydict1:
    if (name in homepages):
        continue
#    print("Hello")
#    print(name)
    n1 = name
    name = name.decode('utf8')
#    print(name)
    str = urllib2.quote(name.encode('utf8') + ' ' + facultydict1[n1], safe='')
#    str = "Emery%20Berger"
    # str = urllib.parse.quote(name.encode('utf8'), safe='')
#    print(str)
    passedurl = "http://www.google.com/search?q=" + str + '&btnI'
    actualURL = requests.head(passedurl, timeout=100.0 , headers={'Accept-Encoding': 'identity'}).headers.get('location', passedurl)
    print(name.encode('utf8') + " , " + actualURL)
    sys.stdout.flush()
    sleep(0.2)
#    break

    
