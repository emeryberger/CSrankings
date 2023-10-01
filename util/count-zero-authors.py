import csv
import os
from lxml import etree as ElementTree

import csrankings


def parseDBLP(facultydict):
    count = 0
    authlogs = {}
    interestingauthors = {}
    authorscores = {}
    authorscoresAdjusted = {}

    with open("dblp.xml", mode="r") as f:

        # with gzip.open('dblp.xml.gz') as f:

        oldnode = None

        for (event, node) in ElementTree.iterparse(f, events=["start", "end"]):

            if oldnode is not None:
                oldnode.clear()
            oldnode = node

            inRange = False
            authorsOnPaper = 0
            authorName = ""
            confname = ""
            year = -1

            if node.tag == "inproceedings" or node.tag == "article":

                # It's a booktitle or journal, and it's one of our conferences.

                # Check that dates are in the specified range.

                for child in node:
                    if child.tag == "year" and type(child.text) is str:
                        year = int(child.text)
                        if (year >= csrankings.startyear) and (
                            year <= csrankings.endyear
                        ):
                            inRange = True
                        break

                if not inRange:
                    # Out of range.
                    continue

                # Now, count up how many faculty from our list are on this paper.

                for child in node:
                    if child.tag == "author":
                        authorName = child.text
                        authorName.strip()
                        if authorName in facultydict:
                            authorsOnPaper += 1

                if authorsOnPaper == 0:
                    # No authors from our list.
                    continue

                # Count the number of pages. It needs to exceed our threshold to be considered.
                pageCount = -1
                for child in node:
                    if child.tag == "pages":
                        pageCount = csrankings.pagecount(child.text)

                if (pageCount > 1) and (pageCount < csrankings.pageCountThreshold):
                    # Only skip papers with a very small paper count,
                    # but above 1. Why?
                    # DBLP has real papers with incorrect page counts
                    # - usually a truncated single page. -1 means no
                    # pages found at all => some problem with journal
                    # entries in DBLP.
                    # print "Skipping article with "+str(pageCount)+" pages."
                    continue

                # If we got here, we have a winner.

                count = count + 1
                if count % 100 == 0:
                    print(count)
                for child in node:
                    if child.tag == "author":
                        authorName = child.text
                        authorName.strip()
                        if authorName in facultydict:
                            # print "here we go",authorName, confname, authorsOnPaper, year
                            if csrankings.generateLog:
                                logstring = (
                                    authorName.encode("utf-8")
                                    + " ; "
                                    + confname
                                    + " "
                                    + str(year)
                                )
                                tmplist = authlogs.get(authorName, [])
                                tmplist.append(logstring)
                                authlogs[authorName] = tmplist
                            interestingauthors[authorName] = (
                                interestingauthors.get(authorName, 0) + 1
                            )

    if csrankings.generateLog:
        return (
            interestingauthors,
            authorscores,
            authorscoresAdjusted,
            authlogs,
        )
    else:
        return (interestingauthors, authorscores, authorscoresAdjusted)


def csv2dict_str_str(fname):
    with open(fname, mode="r") as infile:
        reader = csv.reader(infile)
        # for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = {
            unicode(rows[0].strip(), "utf-8"): unicode(rows[1].strip(), "utf-8")
            for rows in reader
        }
    return d


def sortdictionary(d):
    return sorted(d.iteritems(), key=operator.itemgetter(1), reverse=True)


facultydict = csv2dict_str_str("faculty-affiliations.csv")

if csrankings.generateLog:
    (
        intauthors_gl,
        authscores_gl,
        authscoresAdjusted_gl,
        authlog_gl,
    ) = parseDBLP(facultydict)
else:
    (intauthors_gl, authscores_gl, authscoresAdjusted_gl) = parseDBLP(facultydict)

    # if (intauthors_gl[k] > 0)
    #    print k.encode('utf8') + " : " + str(intauthors_gl[k]).encode('utf8')

for k in facultydict:
    if (k not in intauthors_gl) or (intauthors_gl[k] <= 3):
        # print k.encode('utf8') + " , " + facultydict[k]
        name = k.replace(" ", "%20")
        name = name.encode("utf8")
        # print name
        institution = facultydict[k]
        cmd = (
            "xmlstarlet sel -T --net -t -m '//authors/author' -v '.' -n http://dblp.uni-trier.de/search/author?xauthor="
            + name
        )
        stream = os.popen(cmd)
        for line in stream:
            x = line.rstrip()
            print(x + " , " + institution.encode("utf8"))
        # os.system(cmd)
