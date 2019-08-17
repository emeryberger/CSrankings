# generate a CSV for authors of specific conferences
# the CSV is of the following format:
#   name, confnameYear (first year published in that conference), confnameCount (total pubs in that conference), ... (with a final dummy field for convenience)

import gzip
import xmltodict
import collections
import json
import csv
import re
import sys
import operator
# from typing import Dict
from csrankings import *

filename = 'articles.json';

with open(filename, 'r') as f:
    datastore = json.load(f)

confdict = { "PLDI", "POPL", "ICFP", "OOPSLA" }
conflist = list(confdict)

lastconf = ""

print("name,", end='')
for k in conflist:
    print(k+","+k+"year"+","+k+"count"+",",end='')
print("dummy")
    
i = 0
year = {}
count = {}

while (i < len(datastore)):
    # Note that articles.json is sorted by author name and then by date.
    name = datastore[i]["name"]
    # print(name)
    year[name] = {}
    count[name] = {}
    while ((i < len(datastore)) and (datastore[i]["name"] == name)):
        conf = datastore[i]["conf"]
        if (conf in confdict):
            # print("----" + conf + ", " + str(datastore[i]["year"]))
            year[name][conf] = min(year[name].get(conf, 99999), datastore[i]["year"])
            count[name][conf] = count[name].get(conf, 0) + 1
        i += 1
    print(name + ",", end='')
    for c in conflist:
        if c in year[name]:
            print(str(year[name][c]) + "," + str(count[name][c]) + ",", end='')
        else:
            print("0,0,", end='')
    print('NA')
    #print(name + " " + year[name] + " " + count[name])
#    print(datastore[i])

def main():
    pass

if __name__== "__main__":
  main()
