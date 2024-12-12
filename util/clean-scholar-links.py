#!/usr/bin/env python

# CSRankings
# Copyright (C) 2017 by Emery Berger <http://emeryberger.com>
# See COPYING for license information.

# Clean faculty scholar links (sort).

# import google

import os
from collections import *

import time
import codecs
import sys


def csv2dict_str_str(fname):
    import csv

    with open(fname, mode="r") as infile:
        reader = csv.reader(infile)
        # for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = {rows[0].strip(): rows[1].strip() for rows in reader}
    return d


scholarLinks1 = csv2dict_str_str("scholar.csv")
# Sort
scholarLinks = OrderedDict(sorted(scholarLinks1.items(), key=lambda t: t[0]))


with codecs.open("scholar2.csv", "w", "utf8") as outfile:
    outfile.write("name,scholarid\n")
    for name in scholarLinks:
        if name == "name":
            continue
        outfile.write(name.decode("utf8") + "," + scholarLinks[name] + "\n")
    outfile.flush()

os.rename("scholar2.csv", "scholar.csv")

checked1 = csv2dict_str_str("scholar-visited.csv")
# Sort
checked = OrderedDict(sorted(checked1.items(), key=lambda t: t[0]))

now = time.time()
os.rename("scholar-visited.csv", "scholar-visited-" + str(now) + ".csv")
with codecs.open("scholar-visited.csv", "w", "utf8") as visitedFile:
    visitedFile.write("name,date\n")
    for name in checked:
        visitedFile.write(name.decode("utf8") + "," + str(checked[name]) + "\n")

os.remove("scholar-visited-" + str(now) + ".csv")
