from csrankings import *

authorPaperCountThreshold = 0

def parseDBLP(facultydict):
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
            
            if (node.tag == 'inproceedings' or node.tag == 'article'):
                
                # Check that dates are in the specified range.
                
                # First, check if this is one of the conferences we are looking for.
                
                for child in node:
                    if (child.tag == 'booktitle' or child.tag == 'journal'):
                        if True: # INCLUDE ALL VENUES
                            # if (confname in confdict):
                            foundArticle = True
                            confname = child.text
                        break

                if (not foundArticle):
                    # Nope.
                    continue

                # It's a booktitle or journal, and it's one of our conferences.

                # Check that dates are in the specified range.
                
                for child in node:
                    if (child.tag == 'year'): #  and type(child.text) is str):
                        year = int(child.text)
                        if ((year >= startyear) and (year <= endyear)):
                            inRange = True
                        break

                if (not inRange):
                    # Out of range.
                    continue

                coauthorsList = []
                areaname = confdict[confname]

                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        authorName = authorName.strip()
                        if (True): # authorName in facultydict):
                            authorsOnPaper += 1
                            if (not authorName in coauthors):
                                coauthors[authorName] = {}
                            if (not (year,areaname) in coauthors[authorName]):
                                coauthors[authorName][(year,areaname)] = set([])
                            coauthorsList.append(authorName)
                            papersWritten[authorName] = papersWritten.get(authorName, 0) + 1

                # No authors? Bail.
                if (authorsOnPaper == 0):
                    continue
                
                # Count the number of pages. It needs to exceed our threshold to be considered.
                pageCount = -1
                for child in node:
                    if (child.tag == 'pages'):
                        pageCount = pagecount(child.text)

                tooFewPages = False
                if ((pageCount != -1) and (pageCount < pageCountThreshold)):
                    tooFewPages = True
                    if ((pageCount == 0) and ((confname == 'SC') or (confname == 'SIGSOFT FSE') or (confname == 'PLDI') or (confname == 'ACM Trans. Graph.'))):
                        tooFewPages = False
                    # SPECIAL CASE FOR conferences that have incorrect entries (as of 6/22/2016).
                    # Only skip papers with a very small paper count,
                    # but above 1. Why?
                    # DBLP has real papers with incorrect page counts
                    # - usually a truncated single page. -1 means no
                    # pages found at all => some problem with journal
                    # entries in DBLP.
                    # print "Skipping article with "+str(pageCount)+" pages."

                if (tooFewPages):
                    continue

                counter = counter + 1
                
                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        authorName = authorName.strip()
                        if (authorName in facultydict):
                            for coauth in coauthorsList:
                                if (coauth != authorName):
                                    if (coauth in facultydict):
                                        coauthors[authorName][(year,areaname)].add(coauth)
                                        coauthors[coauth][(year,areaname)].add(authorName)

    o = open('faculty-coauthors.csv', 'w')
    o.write('"author","coauthor","year","area"\n')
    for auth in coauthors:
        if (auth in facultydict):
            for (year,area) in coauthors[auth]:
                for coauth in coauthors[auth][(year,area)]:
                    if (papersWritten[coauth] >= authorPaperCountThreshold):
                        o.write(auth.encode('utf-8'))
                        o.write(',')
                        o.write(coauth.encode('utf-8'))
                        o.write(',')
                        o.write(str(year))
                        o.write(',')
                        o.write(area)
                        o.write('\n')
    o.close()
    
    return 0


facultydict = csv2dict_str_str('faculty-affiliations.csv')

parseDBLP(facultydict)

