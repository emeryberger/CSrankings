# generate a CSV for authors of specific conferences
# the CSV is of the following format:
#   name, confnameYear (first year published in that conference), confnameCount (total pubs in that conference), ... (with a final dummy field for convenience)

import gzip
import json
import csv
import sys
from optparse import OptionParser
from csrankings import areadict
from collections import defaultdict

csrankings_root = "."

# list to hold all authors with number of ISCA publications counted -- used for finding those with > 8
iscaEntries = []

# sorting function
# sorts based on count (second field)
def sortFunc(authorEntries):
    return authorEntries[1]

# Default filename.
filename = csrankings_root + '/articles.json.gz'
start_year = 1973
end_year = 2025

parser = OptionParser()

parser.add_option("--conference", dest="conference",
                  help="filter only papers that appeared in a particular conference")
                  
parser.add_option("-f", "--file", dest="filename",
                  help="read data from FILE", metavar="FILE")

parser.add_option("-n", "--name", dest="name",
                  help="produce data for author NAME", metavar="FILE")

parser.add_option("-s", "--start-year", dest="start_year",
                  help="start year for counting publications", metavar="START_YEAR")

parser.add_option("-e", "--end-year", dest="end_year",
                  help="end year for counting publications", metavar="END_YEAR")

parser.add_option("-p", "--print-hof", dest="printHOF", default=0,
                  help="printed sorted HOF members, with paper counts")

parser.add_option("-c", "--print-close", dest="printClose", default=0,
                  help="printed people close to HOF membership, with paper counts")

(options, args) = parser.parse_args()

if not options.conference:
    print("You must specify a conference.")
    sys.exit(-1)
    
if options.filename:
    filename = options.filename

if options.start_year:
    start_year = int(options.start_year)

if options.end_year:
    end_year = int(options.end_year)
    
with gzip.open(filename, 'r') as f:
    datastore = json.load(f)

# confdict = { "PLDI", "POPL", "ICFP", "OOPSLA" }
# confdict = { "ISCA" } # , "MICRO", "ASPLOS" }
confdict = { options.conference }
conflist = list(confdict)
conflist.sort()

# Generate the header.
print("name,", end='')
for k in conflist:
    print(k+"year"+","+k+"count"+",",end='')
print("dummy")

# Now start iterating through the data.

i = 0      # which entry we are on in the data (stored as an array)
year = {}  # dict: year[name][conf] = earliest year published by name in that conference
count = {} # dict: count[name][conf] = total count of pubs by name in that conference

# Note that articles.json is sorted by author name and then by date.
while (i < len(datastore)):
    name = datastore[i]["name"]
    # Tracking ACM fellows for a particular year.
    #if acm_fellow[name] != 2019:
    #    i += 1
    #    continue
    if options.name:
        if options.name != name:
            i += 1
            continue
    totalPubs = 0
    year[name] = {}
    count[name] = {}
    # Collect all conference data for this author.
    while ((i < len(datastore)) and (datastore[i]["name"] == name)):
        conf = datastore[i]["conf"]
        pubyear = int(datastore[i]["year"])
        if (conf in confdict):
            if (pubyear >= start_year) and (pubyear <= end_year):
                year[name][conf] = min(year[name].get(conf, 99999), pubyear)
                count[name][conf] = count[name].get(conf, 0) + 1
                totalPubs += 1
        i += 1

    # once done counting all ISCA publications for this author, add everyone with
    # >= 1 publication to list
    if int(options.printHOF) == 1 or int(options.printClose) == 1:
        authorTuple = (name, totalPubs)
        # if no ISCA publications, don't insert them
        if (totalPubs > 0):
            iscaEntries.append(authorTuple)

    # Spit out a CSV record.
    if totalPubs > 0:
        print(name + ",", end='')
        for c in conflist:
            if c in year[name]:
                print(str(year[name][c]) + "," + str(count[name][c]) + ",", end='')
            else:
                print("0,0,", end='')
        print(totalPubs)

# Sort all authors with ISCA publications by count (once done going through all authors)
if int(options.printHOF) == 1 or int(options.printClose) == 1:
    iscaEntriesSorted = sorted(iscaEntries, reverse=True, key=sortFunc)

# print out all authors with >= 8 ISCA publications
if int(options.printHOF) == 1:
    print("") # line of space
    print("ISCA HOF members:")
    for hofAuthor in iscaEntriesSorted:
        if (hofAuthor[1] >= 8):
            print(hofAuthor[0]+": "+str(hofAuthor[1]))

# print out all authors near joining (6 or 7 publications):
if int(options.printClose) == 1:
    print("") # line of space
    print("Close to joining HOF:")
    for hofAuthor in iscaEntriesSorted:
        if (hofAuthor[1] < 8 and hofAuthor[1] >= 6):
            print(hofAuthor[0]+": "+str(hofAuthor[1]))
