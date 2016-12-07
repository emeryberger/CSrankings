# Clean up the homepages (remove dups and sort).
    
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

homepages = csv2dict_str_str('homepages.csv')
with open("homepages-sorted.csv", mode='w') as outfile:
    outfile.write("name,homepage\n")
    for name in sorted(homepages):
        if (name == "name"):
            continue
        outfile.write(name + "," + homepages[name] + "\n")

