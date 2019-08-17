# generate a CSV for authors of specific conferences
# the CSV is of the following format:
#   name, confnameYear (first year published in that conference), confnameCount (total pubs in that conference), ... (with a final dummy field for convenience)

import json
import csv

filename = 'articles.json';

with open(filename, 'r') as f:
    datastore = json.load(f)

# Change this to use other conferences. Note that if they aren't indexed by CSrankings, they won't appear.
confdict = { "PLDI", "POPL", "ICFP", "OOPSLA" }
conflist = list(confdict)
conflist.sort()

# Generate the header.
print("name,", end='')
for k in conflist:
    print(k+","+k+"year"+","+k+"count"+",",end='')
print("dummy")

# Now start iterating through the data.

i = 0      # which entry we are on in the data (stored as an array)
year = {}  # dict: year[name][conf] = earliest year published by name in that conference
count = {} # dict: count[name][conf] = total count of pubs by name in that conference

# Note that articles.json is sorted by author name and then by date.
while (i < len(datastore)):
    name = datastore[i]["name"]
    year[name] = {}
    count[name] = {}
    # Collect all conference data for this author.
    while ((i < len(datastore)) and (datastore[i]["name"] == name)):
        conf = datastore[i]["conf"]
        if (conf in confdict):
            year[name][conf] = min(year[name].get(conf, 99999), datastore[i]["year"])
            count[name][conf] = count[name].get(conf, 0) + 1
        i += 1
    # Spit out a CSV record.
    print(name + ",", end='')
    for c in conflist:
        if c in year[name]:
            print(str(year[name][c]) + "," + str(count[name][c]) + ",", end='')
        else:
            print("0,0,", end='')
    print('NA')

