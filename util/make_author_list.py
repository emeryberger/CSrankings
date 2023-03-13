# generate a CSV for authors of specific conferences
# the CSV is of the following format:
#   name, confnameYear (first year published in that conference), confnameCount (total pubs in that conference), ... (with a final dummy field for convenience)

import json
import csv
from optparse import OptionParser

# Default filename.
filename = "articles.json"
start_year = 2000
end_year = 2020

parser = OptionParser()

parser.add_option(
    "-f", "--file", dest="filename", help="read data from FILE", metavar="FILE"
)

parser.add_option(
    "-s",
    "--start-year",
    dest="start_year",
    help="start year for counting publications",
    metavar="START_YEAR",
)

parser.add_option(
    "-e",
    "--end-year",
    dest="end_year",
    help="end year for counting publications",
    metavar="END_YEAR",
)

(options, args) = parser.parse_args()

if options.filename:
    filename = options.filename

if options.start_year:
    start_year = int(options.start_year)

if options.end_year:
    end_year = int(options.end_year)


with open(filename, "r") as f:
    datastore = json.load(f)

# Change this to use other conferences. Note that if they aren't indexed by CSrankings, they won't appear.
confdict = {"PLDI", "POPL", "ICFP", "OOPSLA"}
confdict = {"ISCA", "MICRO", "ASPLOS"}
conflist = list(confdict)
conflist.sort()

# Generate the header.
print("name,", end="")
for k in conflist:
    print(k + "year" + "," + k + "count" + ",", end="")
print("dummy")

# Now start iterating through the data.

i = 0  # which entry we are on in the data (stored as an array)
year = {}  # dict: year[name][conf] = earliest year published by name in that conference
count = {}  # dict: count[name][conf] = total count of pubs by name in that conference

# Note that articles.json is sorted by author name and then by date.
while i < len(datastore):
    name = datastore[i]["name"]
    totalPubs = 0
    year[name] = {}
    count[name] = {}
    # Collect all conference data for this author.
    while (i < len(datastore)) and (datastore[i]["name"] == name):
        conf = datastore[i]["conf"]
        pubyear = int(datastore[i]["year"])
        if conf in confdict:
            if (pubyear >= start_year) and (pubyear <= end_year):
                year[name][conf] = min(year[name].get(conf, 99999), pubyear)
                count[name][conf] = count[name].get(conf, 0) + 1
                totalPubs += 1
        i += 1
    # Spit out a CSV record.
    if totalPubs > 0:
        print(name + ",", end="")
        for c in conflist:
            if c in year[name]:
                print(
                    str(year[name][c]) + "," + str(count[name][c]) + ",",
                    end="",
                )
            else:
                print("0,0,", end="")
        print("NA")
