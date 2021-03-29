import gzip
import xmltodict
import collections
import json
import csv
import re
import sys
import operator
from typing import cast, Any, Dict, List, Tuple, TypedDict, Union
from csrankings import *
from collections import defaultdict

# Consider pubs in this range only.
startyear = 1970
endyear = 2269

ArticleType = TypedDict('ArticleType', { 'author' : List[str],
                                         'booktitle' : str,
                                         'journal' : str,
                                         'volume' : str,
                                         'number' : str,
                                         'url' : str,
                                         'year' : str,
                                         'pages' : str,
                                         'title' : str })

totalPapers = 0 # for statistics reporting purposes only
authlogs : Dict[str, List[str]] = defaultdict(list)
interestingauthors : Dict[str, int] = defaultdict(int)
authorscores : Dict[Tuple[str, str, int], float] = defaultdict(float)
authorscoresAdjusted : Dict[Tuple[str, str, int], float] = defaultdict(float)
facultydict : Dict[str, str] = {}
aliasdict : Dict[str, str] = {}
counter = 0
successes = 0
failures = 0


def do_it() -> None:
    gz = gzip.GzipFile('dblp.xml.gz')
    xmltodict.parse(gz, item_depth=2, item_callback=handle_article)


def build_dicts() -> None:
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

    facultydict = {}
    aliasdict = {}
    
    with open("faculty-affiliations.csv") as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            facultydict[row["name"]] = row["affiliation"]
            
    with open("dblp-aliases.csv") as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            aliasdict[row["alias"]] = row["name"]
    
    # Count and report the total number of faculty in the database.
    totalFaculty = 0
    for name in facultydict:
        # Exclude aliases.
        if name in aliasdict:
            continue
        totalFaculty += 1
    print("Total faculty members currently in the database: "+str(totalFaculty))



def handle_article(_ : Any, article : ArticleType) -> bool:
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
        if not 'author' in article:
            return True
        # Fix if there is just one author.
        if type(article['author']) != list:
            if type(article['author']) == str:
                article['author'] = [str(article['author'])]
            elif type(article['author']) is collections.OrderedDict:
                article['author'] = [article['author']["#text"]]
            else:
                print("***Unknown record type, skipping.***")
                return True
        authorList = article['author']
        authorsOnPaper = len(authorList)
        foundOneInDict = False
        for authorName in authorList:
            if type(authorName) is collections.OrderedDict:
                aName = cast(str, authorName["#text"])
            else:
                aName = authorName
            aName = aName.strip()
            if aName in facultydict:
                foundOneInDict = True
                break
            if aName in aliasdict:
                if aliasdict[aName] in facultydict:
                    foundOneInDict = True
                    break
        if not foundOneInDict:
            return True
        if 'booktitle' in article:
            confname = article['booktitle']
        elif 'journal' in article:
            confname = article['journal']
        else:
            return True

        if not confname in confdict:
            return True
        
        volume = article.get('volume',"0")
        number = article.get('number',"0")
        url    = article.get('url',"")
        year   = int(article.get('year',"-1"))
        pages  = ""
        
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
            aName = cast(str, authorName)
            if type(authorName) is collections.OrderedDict:
                aName = cast(str, authorName["#text"])
            realName = aliasdict.get(aName, aName)
            if realName in facultydict:
                log = { 'name' : realName.encode('utf-8'),
                        'year' : year,
                        'title' : title.encode('utf-8'),
                        'conf' : confname,
                        'area' : areaname,
                        'institution' : facultydict[realName],
                        'numauthors' : authorsOnPaper }
                if volume != "":
                    log['volume'] = volume
                if number != "":
                    log['number'] = number
                if startPage != "":
                    log['startPage'] = startPage
                if pageCount != "":
                    log['pageCount'] = pageCount
                tmplist = authlogs.get(realName, [])
                tmplist.append(log)
                authlogs[realName] = tmplist
                interestingauthors[realName] += 1
                authorscores[(realName, areaname, year)] += 1.0
                authorscoresAdjusted[(realName, areaname, year)] += 1.0 / authorsOnPaper
    return True

def dump_it() -> None:
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
            # print(authorName)
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

def main() -> None:
    build_dicts()
    do_it()
    dump_it()
    print("Total papers counted = "+str(totalPapers))

if __name__== "__main__":
  main()
