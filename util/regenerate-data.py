from csrankings import csv2dict_str_str, startyear, endyear, areadict, confdict, arealist, venues, pagecount, startpage, ElementTree, countPaper

import json
import gzip

def parseDBLP(facultydict):
    authlogs = {}
    interestingauthors = {}
    authorscores = {}
    authorscoresAdjusted = {}
    coauthors = {}
    papersWritten = {}
    counter = 0

    # with open('dblp.xml', mode='rb') as f:
    with gzip.open('dblp.xml.gz') as f:

        oldnode = None

        for (event, node) in ElementTree.iterparse(f, events=['start', 'end']):
            if (oldnode is not None):
                oldnode.clear()
            oldnode = node

            foundArticle = False
            authorsOnPaper = 0
            authorName = ""
            authorList = []
            confname = ""
            title = ""
            year = -1
            pageCount = -1
            startPage = -1
            foundOneInDict = False
            number = 0
            volume = 0
            
            if (node.tag == 'inproceedings' or node.tag == 'article'):

                # First, check if this is one of the conferences we are looking for.

                for child in node:
                    if (child.tag == 'booktitle' or child.tag == 'journal'):
                        confname = child.text
                        if (confname in confdict):
                            areaname = confdict[confname]
                            foundArticle = True
                            continue
                        else:
                            break

                    if (child.tag == 'title'):
                        if child.text is not None:
                            title = child.text
                        continue
                    if (child.tag == 'volume'):
                        volume = child.text
                        continue
                    if (child.tag == 'number'):
                        number = child.text
                        continue
                    if child.tag == 'year':
                        if child.text is not None:
                            year = int(child.text)
                        continue
                    if child.tag == 'pages':
                        pageCount = pagecount(child.text)
                        startPage = startpage(child.text)
                        continue
                    if child.tag == 'author':
                        authorName = child.text
                        if authorName is not None:
                            authorName = authorName.strip()
                            authorList.append(authorName)
                            authorsOnPaper += 1
                            if authorName in facultydict:
                                foundOneInDict = True
                        continue

                if confname == "PVLDB":
                    print confname + " " + str(year) + ":" + str(startPage) + "-" + str(pageCount)
                    for a in authorList:
                        print "  " + a.encode('utf-8')
                    print "-----"
                    
                # One of our conferences?
                if not foundArticle:
                    continue

                # Any authors in our affiliations?
                if not foundOneInDict:
                    continue

                # One of the papers we count?
                if not countPaper(confname, year, volume, number, startPage, pageCount):
                    continue
                
                # If we get here, we have a winner.

                for authorName in authorList:
                    if authorName in facultydict:
                        # print "here we go",authorName, confname, authorsOnPaper, year
                        logstring = { 'name' : authorName.encode('utf-8'),
                                      'conf' : confname,
                                      'area' : areaname,
                                      'year' : year,
                                      'title' : title.encode('utf-8'),
                                      'institution' : facultydict[authorName].encode('utf-8') }
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

f = open('articles.json','w')
z = []
length = len(authlog_gl.items())
for v, l in authlog_gl.items():
    if intauthors_gl.has_key(v):
        if (intauthors_gl[v] >= 1):
            # f.write("Papers for " + v.encode('utf-8') + ', ' + (fdict[v]).encode('utf-8') + "\n")
            for s in l:
                z.append(s)
json.dump(z, f)
f.close()



