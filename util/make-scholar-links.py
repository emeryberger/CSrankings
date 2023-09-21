#!/usr/bin/env python

# CSRankings
# Copyright (C) 2017 by Emery Berger <http://emeryberger.com>
# See COPYING for license information.

#
# Gather Google Scholar links for faculty.
#

import os
import scholarly
from collections import *

import codecs
import sys
import random
import urllib3
import operator
import re
import time
import fcntl
import bs4
import requests

maxBeforeEnd = 1000  # Only do this many lookups before exiting.
expirationDate = 60 * 60 * 24 * 7 * 5  # Try again after five weeks


def lockfile(x):
    while True:
        try:
            fcntl.flock(x, fcntl.LOCK_EX)
            break
        except IOError as e:
            # raise on unrelated IOErrors
            if e.errno != errno.EAGAIN:
                raise
            else:
                time.sleep(0.1)


def unlockfile(x):
    while True:
        try:
            fcntl.flock(x, fcntl.LOCK_UN)
            break
        except IOError as e:
            # raise on unrelated IOErrors
            if e.errno != errno.EAGAIN:
                raise
            else:
                time.sleep(0.1)


def csv2dict_str_str(fname):
    import csv

    with open(fname, mode="r") as infile:
        reader = csv.reader(infile)
        # for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = {rows[0].strip(): rows[1].strip() for rows in reader}
    return d


facultydict = csv2dict_str_str("faculty-affiliations.csv")
facultydictkeys = list(facultydict.keys())
homepages = csv2dict_str_str("homepages.csv")
aliases = csv2dict_str_str("dblp-aliases.csv")
countryInfo = csv2dict_str_str("country-info.csv")
scholarLinks = {}
checked = {}
me = str(os.getpid())


import urllib.parse


def searchAuthor(name):
    userMatcher = re.compile("user=([A-Za-z0-9\-]+)")
    quoted = urllib.parse.quote_plus(name)
    res = requests.get(
        "https://scholar.google.com/scholar?hl=en&as_sdt=0%2C48&q=" + quoted + "&btnG="
    )
    res.raise_for_status()
    soup = bs4.BeautifulSoup(res.text)
    #    print(res.text)
    mydivs = soup.find_all("h4", class_="gs_rt2")
    for div in mydivs:
        #        print(div)
        #        print(type(div))
        found = div.getText()
        #        print(found)
        for c in div.children:
            href = c.get("href")
            um = userMatcher.search(href)
            if not um is None:
                link = um.group(1)
                return (name, link)
                break
    return None


#    print(soup.select('#gs_rt2'))

# print(searchAuthor("Nir Piterman"))
# exit(0)


def getScholarID(name):
    # print("["+me+"] Checking "+name)
    if name in scholarLinks:
        # Already there.
        if scholarLinks[name] != "NOSCHOLARPAGE":
            # print("["+me+"] already found")
            return scholarLinks[name]
    if name in checked:
        if now - float(checked[name]) < expirationDate:
            # print("["+me+"] last visited too recently.")
            return None
    origname = name
    # Trim off any trailing numerical suffixes.
    r = re.match(".*\s\d\d\d\d$", name)
    if r != None:
        name = name[:-5]
    if name in scholarLinks:
        if scholarLinks[name] != "NOSCHOLARPAGE":
            return scholarLinks[name]
    actualID = "FIXME"
    try:
        print("searching for " + name)
        res = searchAuthor(name)
        # print(res)
        if res:
            (author, link) = res
            # print("found "+author+", "+link+" (for " + name + ")")
            if author == name:
                scholarLinks[origname] = link
                return link
        else:
            pass
            # print("SEARCH FAILED")
    #        search_query = scholarly.search_author(name)
    #        name = name.decode('utf8')
    #        author = next(search_query).fill()
    #        # print author
    #        for (key, value) in author.__dict__.items():
    #            if (key == "id"):
    #                actualID = value
    #                scholarLinks[origname] = actualID
    #                return actualID
    except Exception as e:
        print("[" + me + "] not found (exception)." + e)
        return None
    return None


theCounter = 0
scholarLinks1 = csv2dict_str_str("scholar.csv")
# Sort
scholarLinks = OrderedDict(sorted(scholarLinks1.items(), key=lambda t: t[0]))

checked = csv2dict_str_str("scholar-visited.csv")
now = time.time()

newvisited = {}
newscholarLinks = {}


random.shuffle(facultydictkeys)
for name in facultydictkeys:
    if theCounter >= maxBeforeEnd:
        break
    now = time.time()
    # if facultydict[name] not in countryInfo:
    #    continue

    # Canonicalize.
    if name in aliases:
        name = aliases[name]
    dept = facultydict[name]

    # Skip any scholarLinks we have already in the database.
    if name in scholarLinks:
        if scholarLinks[name] != "NOSCHOLARPAGE":
            continue
    # Check expiration date.
    if name in checked:
        if now - float(checked[name]) < expirationDate:
            continue
    s = "%10.2f" % now
    theCounter += 1
    newvisited[name] = s

    # print("["+me+"] checking "+name+" at "+dept)
    id = getScholarID(name)
    if id == None:
        # Try to remove a middle name.
        r = re.match(".* [A-Z]\. *", name)
        if r != None:
            nomiddlename = re.sub(" [A-Z]\. ", " ", name)
            id = getScholarID(nomiddlename)
    if id == None:
        continue
    # print("found "+id)
    str = name + ", " + dept
    # print("["+me+"] "+str)
    newscholarLinks[name] = id
    #    name = name.decode('utf8')
    # print("["+me+"] " + name + "," + id)
    print(
        n + "," + facultydict[n] + "," + homepages[n] + "," + newscholarLinks[n] + "\n"
    )
    # actualURL = "https://scholar.google.com/citations?user="+id+"&hl=en&oi=ao"

    sys.stdout.flush()
    time.sleep(10)

for n in newscholarLinks:
    print(
        n + "," + facultydict[n] + "," + homepages[n] + "," + newscholarLinks[n] + "\n"
    )

# Write everything out.
with codecs.open("scholar.csv", "a+", "utf8") as scholarFile:
    lockfile(scholarFile)
    for n in newscholarLinks:
        try:
            scholarFile.write(n + "," + newscholarLinks[n] + "\n")
        except Exception as e:
            print("file writing exception ")
            print(e)
            pass
    unlockfile(scholarFile)
with codecs.open("scholar-visited.csv", "a+", "utf8") as visitedFile:
    lockfile(visitedFile)
    for n in newvisited:
        try:
            visitedFile.write(n.decode("utf8") + "," + newvisited[n] + "\n")
        except Exception:
            pass
    unlockfile(visitedFile)

# if theCounter >= maxBeforeEnd:
# Reload and keep going.
# os.system(sys.argv[0])
