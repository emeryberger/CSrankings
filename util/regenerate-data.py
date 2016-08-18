from csrankings import csv2dict_str_str, startyear, endyear, areadict, confdict, arealist, venues, pagecount, ElementTree, pageCountThreshold

def parseDBLP(facultydict):
    authlogs = {}
    interestingauthors = {}
    authorscores = {}
    authorscoresAdjusted = {}
    coauthors = {}
    papersWritten = {}
    counter = 0

    with open('dblp.xml', mode='r') as f:

    # with gzip.open('dblp.xml.gz') as f:

        oldnode = None

        for (event, node) in ElementTree.iterparse(f, events=['start', 'end']):
            if (oldnode is not None):
                oldnode.clear()
            oldnode = node

            foundArticle = False
            inRange = False
            authorsOnPaper = 0
            authorName = ""
            confname = ""
            year = -1
            pageCount = -1
            foundOneInDict = False
            
            if (node.tag == 'inproceedings' or node.tag == 'article'):

                # First, check if this is one of the conferences we are looking for.

                for child in node:
                    if (child.tag == 'booktitle' or child.tag == 'journal'):
                        confname = child.text
                        if (child.text in confdict):
                            foundArticle = True
                        break

                if not foundArticle:
                    if confname is not None:
                        for a in venues:
                            if (a in confname):
                                # print "WHOA: " + a + " --> " + confname
                                break

                if (not foundArticle):
                    # Not one of our conferences.
                    continue

                # Check that dates are in the specified range.
                for child in node:
                    if child.tag == 'year': #  and type(child.text) is str):
                        year = int(child.text)
                        if ((year >= startyear) and (year <= endyear)):
                            inRange = True
                        break
                    
                if year == -1:
                    # No year.
                    print "NO YEAR WAT", confname
                    continue

                # Count up how many authors are on this paper.
                for child in node:
                    if child.tag == 'author':
                        authorName = child.text
                        authorName = authorName.strip()
                        authorsOnPaper += 1
                        if authorName in facultydict:
                            foundOneInDict = True

                # Count the number of pages. It needs to exceed our threshold to be considered.
                for child in node:
                    if child.tag == 'pages':
                        pageCount = pagecount(child.text)

                tooFewPages = False
                if ((pageCount != -1) and (pageCount < pageCountThreshold)):
                    tooFewPages = True
                    exceptionConference = ((confname == 'SC') or (confname == 'SIGSOFT FSE') or (confname == 'PLDI') or (confname == 'ACM Trans. Graph.'))
                    if ((pageCount == 0) and exceptionConference):
                        tooFewPages = False
                    # SPECIAL CASE FOR conferences that have incorrect entries (as of 6/22/2016).
                    # Only skip papers with a very small paper count,
                    # but above 1. Why?
                    # DBLP has real papers with incorrect page counts
                    # - usually a truncated single page. -1 means no
                    # pages found at all => some problem with journal
                    # entries in DBLP.
                    # print "Skipping article with "+str(pageCount)+" pages."

                if ((confname == 'ASE') and (pageCount <= 6)):
                    tooFewPages = True

                areaname = confdict[confname]

                if (not inRange) or (not foundOneInDict) or tooFewPages:
                    continue

                # If we got here, we have a winner.

                for child in node:
                    if child.tag == 'author':
                        authorName = child.text
                        authorName = authorName.strip()
                        if authorName in facultydict:
                            # print "here we go",authorName, confname, authorsOnPaper, year
                            logstring = authorName.encode('utf-8') + " ; " + confname + " " + str(year)
                            tmplist = authlogs.get(authorName, [])
                            tmplist.append(logstring)
                            authlogs[authorName] = tmplist
                            interestingauthors[authorName] = interestingauthors.get(authorName, 0) + 1
                            authorscores[(authorName, areaname, year)] = authorscores.get((authorName, areaname, year), 0) + 1.0
                            authorscoresAdjusted[(authorName, areaname, year)] = authorscoresAdjusted.get((authorName, areaname, year), 0) + 1.0 / authorsOnPaper

    return (interestingauthors, authorscores, authorscoresAdjusted, authlogs)


fdict = csv2dict_str_str('faculty-affiliations.csv')

(intauthors_gl, authscores_gl, authscoresAdjusted_gl, authlog_gl) = parseDBLP(fdict)

f = open('generated-author-info.csv','w')
f.write('"name","dept","area","count","adjustedcount","year"\n')
for (authorName, area, year) in authscores_gl:
    count = authscores_gl[(authorName, area, year)]
    countAdjusted = authscoresAdjusted_gl[(authorName, area, year)]
    f.write(authorName.encode('utf-8'))
    f.write(',')
    f.write((fdict[authorName]).encode('utf-8'))
    f.write(',')
    f.write(area)
    f.write(',')
    f.write(str(count))
    f.write(',')
    f.write(str(countAdjusted))
    f.write(',')
    f.write(str(year))
    f.write('\n')
f.close()

f = open('rankings-all.log','w')
for v, l in authlog_gl.items():
    if intauthors_gl.has_key(v):
        if (intauthors_gl[v] >= 1):
            f.write("Papers for " + v.encode('utf-8') + ', ' + (fdict[v]).encode('utf-8') + "\n")
            for s in l:
                f.write(s)
                f.write('\n')
                f.write('\n')
f.close()



