#!/usr/bin/env python

from collections import *
import gzip
import xmltodict
import collections
import json
import csv
import re
import sys
import operator
import os

# Split 'csrankings.csv'

fieldnames = ["name","affiliation","homepage","scholarid"]
with open('csrankings.csv', mode='r') as infile:
    reader = csv.DictReader(infile)
    arr = [row for row in reader]
    index = 0
    for i in range(10):
        fname = "csrankings-" + str(i) + ".csv"
        with open(fname, mode='w') as outfile:
            writer = csv.DictWriter(outfile, fieldnames)
            writer.writeheader()
            try:
                count = 0
                while count < len(arr) / 10:
                    writer.writerow(arr[index])
                    index += 1
                    count += 1
            except:
                # We will hit this at the end of the file.
                pass
