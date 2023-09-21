import csrankings
import gzip
from lxml import etree as ElementTree

startyear = 2013
endyear = 2018


def parseDBLP(facultydict):
    authlogs = {}
    interestingauthors = {}
    authorscores = {}
    authorscoresAdjusted = {}

    with gzip.open("dblp.xml.gz") as f:

        oldnode = None

        for (event, node) in ElementTree.iterparse(f, events=["start", "end"]):
            if oldnode is not None:
                oldnode.clear()
            oldnode = node

            foundArticle = True  # include all venues
            # foundArticle = False
            inRange = False
            authorsOnPaper = 0
            authorName = ""
            confname = ""
            year = -1
            pageCount = -1
            foundOneInDict = False
            volume = 0

            if node.tag == "inproceedings" or node.tag == "article":

                # First, check if this is one of the conferences we are looking for.

                for child in node:
                    if child.tag == "booktitle" or child.tag == "journal":
                        confname = child.text
                        if True:  # INCLUDE ALL VENUES
                            # was: if (confname in confdict):
                            foundArticle = True
                    if child.tag == "volume":
                        volume = child.text
                    if child.tag == "year":
                        if child.text is not None:
                            year = int(child.text)
                    if child.tag == "pages":
                        pageCount = csrankings.pagecount(child.text)
                    if child.tag == "author":
                        authorName = child.text
                        if authorName is not None:
                            authorName = authorName.strip()
                            authorsOnPaper += 1
                            if authorName in facultydict:
                                foundOneInDict = True

                if not foundArticle:
                    # Not one of our conferences.
                    continue

                if confname is None:
                    continue

                if confname not in csrankings.confdict:
                    areaname = "na"
                else:
                    areaname = csrankings.confdict[confname]

                # Check that dates are in the specified range.
                if (year >= startyear) and (year <= endyear):
                    inRange = True

                if year == -1:
                    # No year.
                    continue

                tooFewPages = False
                if (pageCount != -1) and (pageCount < csrankings.pageCountThreshold):
                    tooFewPages = True
                    exceptionConference = confname == "SC"
                    exceptionConference |= confname == "SIGSOFT FSE" and year == 2012
                    exceptionConference |= (
                        confname == "ACM Trans. Graph."
                        and int(volume) >= 26
                        and int(volume) <= 36
                    )
                    if exceptionConference:
                        tooFewPages = False

                if (not inRange) or (not foundOneInDict) or tooFewPages:
                    continue

                # If we got here, we have a winner.

                for child in node:
                    if child.tag == "author":
                        authorName = child.text
                        authorName = authorName.strip()
                        if authorName in facultydict:
                            print(
                                "here we go"
                                + authorName
                                + " "
                                + confname
                                + " "
                                + str(authorsOnPaper)
                                + " "
                                + str(year)
                            )
                            logstring = authorName.encode("utf-8")
                            logstring += " ; ".encode("utf-8")
                            logstring += confname.encode("utf-8")
                            logstring += " ".encode("utf-8")
                            logstring += str(year).encode("utf-8")
                            tmplist = authlogs.get(authorName, [])
                            tmplist.append(logstring)
                            authlogs[authorName] = tmplist
                            interestingauthors[authorName] = (
                                interestingauthors.get(authorName, 0) + 1
                            )
                            authorscores[(authorName, areaname, year)] = (
                                authorscores.get((authorName, areaname, year), 0) + 1.0
                            )
                            authorscoresAdjusted[(authorName, areaname, year)] = (
                                authorscoresAdjusted.get(
                                    (authorName, areaname, year), 0
                                )
                                + 1.0 / authorsOnPaper
                            )

    return (interestingauthors, authorscores, authorscoresAdjusted, authlogs)


fdict = csrankings.csv2dict_str_str("faculty-affiliations.csv")

(intauthors_gl, authscores_gl, authscoresAdjusted_gl, authlog_gl) = parseDBLP(fdict)

f = open("all-author-info.csv", "w")
f.write('"name","dept","area","count","adjustedcount","year"\n')
for (authorName, area, year) in authscores_gl:
    count = authscores_gl[(authorName, area, year)]
    countAdjusted = authscoresAdjusted_gl[(authorName, area, year)]
    # f.write(authorName.encode('utf-8'))
    f.write(authorName)
    f.write(",")
    # f.write((fdict[authorName]).encode('utf-8'))
    f.write((fdict[authorName]))
    f.write(",")
    f.write(area)
    f.write(",")
    f.write(str(count))
    f.write(",")
    f.write(str(countAdjusted))
    f.write(",")
    f.write(str(year))
    f.write("\n")
f.close()
