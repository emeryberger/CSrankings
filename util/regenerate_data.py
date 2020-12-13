import gzip
import xmltodict
import collections
import json
import csv
import re
import sys
import operator
# from typing import Dict
from csrankings import *

# Consider pubs in this range only.
startyear = 1970
endyear = 2269

totalPapers = 0 # for statistics reporting purposes only
authlogs = {}
interestingauthors = {}
authorscores = {}
authorscoresAdjusted = {}
coauthors = {}
papersWritten = {}
counter = 0
successes = 0
failures = 0
confdict = {}
aliasdict = {}


def do_it():
#    gz = gzip.GzipFile('dblp-original.xml.gz')
    gz = gzip.GzipFile('dblp.xml.gz')
    xmltodict.parse(gz, item_depth=2, item_callback=handle_article)


def build_dicts():
    global areadict
    global confdict
    global facultydict
    global aliasdict
    # Build a dictionary mapping conferences to areas.
    # e.g., confdict['CVPR'] = 'vision'.
    confdict = {}
    venues = []
    for k, v in areadict.items():
        for item in v:
            confdict[item] = k
            venues.append(item)
    facultydict = csv2dict_str_str('faculty-affiliations.csv')
    aliasdict = csv2dict_str_str('dblp-aliases.csv')
    
    # Count and report the total number of faculty in the database.
    totalFaculty = 0
    for name in facultydict:
        # Exclude aliases.
        if name in aliasdict:
            continue
        totalFaculty += 1
    print("Total faculty members currently in the database: "+str(totalFaculty))



def handle_article(_, article):
    global totalPapers
    global confdict
    global counter
    global successes
    global failures
    global interestingauthors
    global authorscores
    global authorscoresAdjusted
    global authlogs
    global interestingauthors
    global facultydict
    global aliasdict
    global TOG_SIGGRAPH_Volume
    global TOG_SIGGRAPH_Asia_Volume
    global TVCG_Vis_Volume
    global TVCG_VR_Volume
    counter += 1
    try:
        if counter % 10000 == 0:
            print(str(counter)+ " papers processed.")
        if 'author' in article:
            # Fix if there is just one author.
            if type(article['author']) != list:
                article['author'] = [article['author']]
            authorList = article['author']
            authorsOnPaper = len(authorList)
            foundOneInDict = False
            for authorName in authorList:
                if type(authorName) is collections.OrderedDict:
                    authorName = authorName["#text"]
                authorName = authorName.strip()
                if authorName in facultydict:
                    foundOneInDict = True
                    break
                if authorName in aliasdict:
                    if aliasdict[authorName] in facultydict:
                        foundOneInDict = True
                        break
            if not foundOneInDict:
                return True
        else:
            return True
        if 'booktitle' in article:
            confname = article['booktitle']
        elif 'journal' in article:
            confname = article['journal']
        else:
            return True

        volume = article.get('volume',"0")
        number = article.get('number',"0")
        url    = article.get('url',"")
        year   = int(article.get('year',"-1"))
        pages  = ""
        
        if confname in confdict:
            areaname = confdict[confname]
            #Special handling for PACMPL
            if areaname == 'pacmpl':
                confname = article['number']
                if confname in confdict:
                    areaname = confdict[confname]
                else:
                    return True
            elif confname == 'ACM Trans. Graph.':
                if year in TOG_SIGGRAPH_Volume:
                    (vol, num) = TOG_SIGGRAPH_Volume[year]
                    if (volume == str(vol)) and (number == str(num)):
                        confname = 'SIGGRAPH'
                        areaname = confdict[confname]
                if year in TOG_SIGGRAPH_Asia_Volume:
                    (vol, num) = TOG_SIGGRAPH_Asia_Volume[year]
                    if (volume == str(vol)) and (number == str(num)):
                        confname = 'SIGGRAPH Asia'
                        areaname = confdict[confname]
            elif confname == 'IEEE Trans. Vis. Comput. Graph.':
                if year in TVCG_Vis_Volume:
                    (vol, num) = TVCG_Vis_Volume[year]
                    if (volume == str(vol)) and (number == str(num)):
                        areaname = 'vis'
                if year in TVCG_VR_Volume:
                    (vol, num) = TVCG_VR_Volume[year]
                    if (volume == str(vol)) and (number == str(num)):
                        confname = 'VR'
                        areaname = 'vr'

        else:
            return True
        
        if 'title' in article:
            title = article['title']
            if type(title) is collections.OrderedDict:
                title = title["#text"]
        if 'pages' in article:
            pages = article['pages']
            pageCount = pagecount(pages)
            startPage = startpage(pages)
        else:
            pageCount = -1
            startPage = -1
        successes += 1
    except TypeError:
        raise
    except:
        print(sys.exc_info()[0])
        failures += 1
        raise

    if countPaper(confname, year, volume, number, pages, startPage, pageCount, url, title):
        totalPapers += 1
        for authorName in authorList:
            if type(authorName) is collections.OrderedDict:
                authorName = authorName["#text"]
            realName = aliasdict.get(authorName, authorName)
            #            if authorName in aliasdict:
            #                authorName = aliasdict[authorName]
            foundAuthor = None
            if realName in facultydict:
                foundAuthor = realName
            if foundAuthor != None:
                log = { 'name' : foundAuthor.encode('utf-8'),
                        'year' : year,
                        'title' : title.encode('utf-8'),
                        'conf' : confname,
                        'area' : areaname,
                        'institution' : facultydict[foundAuthor],
                        'numauthors' : authorsOnPaper }
                if volume != "":
                    log['volume'] = volume
                if number != "":
                    log['number'] = number
                if startPage != "":
                    log['startPage'] = startPage
                if pageCount != "":
                    log['pageCount'] = pageCount
                tmplist = authlogs.get(foundAuthor, [])
                tmplist.append(log)
                authlogs[foundAuthor] = tmplist
                interestingauthors[foundAuthor] = interestingauthors.get(foundAuthor, 0) + 1
                authorscores[(foundAuthor, areaname, year)] = authorscores.get((foundAuthor, areaname, year), 0) + 1.0
                authorscoresAdjusted[(foundAuthor, areaname, year)] = authorscoresAdjusted.get((foundAuthor, areaname, year), 0) + 1.0 / authorsOnPaper
    return True

def dump_it():
    global authorscores
    global authorscoresAdjusted
    global authlogs
    global interestingauthors
    global facultydict
    with open('generated-author-info.csv','w') as f:
        f.write('"name","dept","area","count","adjustedcount","year"\n')
        authorscores = collections.OrderedDict(sorted(authorscores.items()))
        for ((authorName, area, year), count) in authorscores.items():
            # count = authorscores[(authorName, area, year)]
            print(authorName)
            countAdjusted = authorscoresAdjusted[(authorName, area, year)]
            f.write(authorName)
            f.write(',')
            f.write(facultydict[authorName])
            f.write(',')
            f.write(area)
#            f.write(',')
#            f.write(subarea)
            f.write(',')
            f.write(str(count))
            f.write(',')
            f.write(str(countAdjusted))
            f.write(',')
            f.write(str(year))
            f.write('\n')

    with open('articles.json','w') as f:
        z = []
        authlogs = collections.OrderedDict(sorted(authlogs.items()))
        for v, l in authlogs.items():
            if v in interestingauthors:
                for s in sorted(l, key=lambda x: x['name'].decode('utf-8')+str(x['year'])+x['conf']+x['title'].decode('utf-8')):
                    s['name'] = s['name'].decode('utf-8')
                    s['title'] = s['title'].decode('utf-8')
                    z.append(s)
        json.dump(z, f, indent=2)

def main():
    build_dicts()
    do_it()
    dump_it()
    print("Total papers counted = "+str(totalPapers))

if __name__== "__main__":
  main()
