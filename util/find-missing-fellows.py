# from csrankings import *
from collections import *
from fuzzydict import *
import csv


def csv2dict_str_str(fname):
    """Takes a CSV files and returns a dictionary of pairs."""
    with open(fname, mode="r") as infile:
        reader = csv.reader(infile)
        # for rows in reader:
        #    print rows[0], "-->", rows[1]
        # d = {rows[0].strip() : rows[1].strip() for rows in reader}
        d = {
            unicode(rows[0].strip(), "utf-8"): unicode(
                rows[1].strip(), "utf-8"
            )
            for rows in reader
        }
    return d


facultydict = csv2dict_str_str("faculty-affiliations.csv")
aliasdict = csv2dict_str_str("dblp-aliases.csv")
fellowdict = csv2dict_str_str("acm-fellows.csv")

# reversealiasdict = {v: k for k, v in aliasdict.items()}
# facultydict = OrderedDict(sorted(facultydict.items(), key=lambda t: t[1]+t[0]))
# del facultydict["name"]

newfac = {}
for k in facultydict:
    newfac[k] = k

fuzzfac = FuzzyDict(newfac, 0.8)
# fuzzalias = FuzzyDict(aliasdict)

# newfuzz = {}

for name in fellowdict:
    # Exclude the first line (header).
    if name == "name":
        continue
    # Clear hit in faculty DB.
    if name in facultydict:
        if name in aliasdict:
            print aliasdict[name].encode("utf8"),
        else:
            print name.encode("utf8"),
        print "," + fellowdict[name]
        continue
    # In the alias DB. Look for a clear match there.
    if name in aliasdict:
        if aliasdict[name] in fellowdict:
            print aliasdict[name] + "," + fellowdict[name]
            continue
    # Look for a fuzzy match.
    if name in fuzzfac:
        print fuzzfac[name].encode("utf8"),
        print "," + fellowdict[name]
        continue
    # Look for a fuzzy match of an alias.
    if (name in aliasdict) and (aliasdict[name] in fuzzfac):
        print aliasdict[name].encode("utf8") + "," + fellowdict[
            aliasdict[name]
        ]
        continue
    # No match: just output the original entry for now.
    print name.encode("utf8") + "," + fellowdict[name]
