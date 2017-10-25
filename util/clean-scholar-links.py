# Clean faculty scholar links (sort).
#import google

import os
from collections import *

import codecs
import sys

def csv2dict_str_str(fname):
    import csv
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        #for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = { rows[0].strip(): rows[1].strip() for rows in reader}
    return d

scholarLinks1 = csv2dict_str_str('scholar.csv')
# Sort
scholarLinks = OrderedDict(sorted(scholarLinks1.items(), key=lambda t: t[0]))


with codecs.open("scholar2.csv", "w", "utf8") as outfile:
    outfile.write("name,scholarid\n")
    for name in scholarLinks:
        if (name == "name"):
            continue
        outfile.write(name.decode('utf8') + "," + scholarLinks[name] + "\n")
    outfile.flush()

os.rename("scholar2.csv","scholar.csv")
