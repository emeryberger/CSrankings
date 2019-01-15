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


# ASE accepts short papers and long papers. Long papers appear to be at least 10 pages long,
# while short papers are shorter.
ASE_LongPaperThreshold = 10

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

# Papers must be at least 6 pages long to count.
pageCountThreshold = 6
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile('(\d+)-(\d+)')
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile('[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)')
# Special regexp for extracting pseudo-volumes (paper number) from TECS.
TECSCounterColon = re.compile('([0-9]+):[1-9][0-9]*-([0-9]+):[1-9][0-9]*')
# Extract the ISMB proceedings page numbers.
ISMBpageCounter = re.compile('i(\d+)-i(\d+)')


def do_it():
#    gz = gzip.GzipFile('dblp-original.xml.gz')
    gz = gzip.GzipFile('dblp.xml.gz')
    xmltodict.parse(gz, item_depth=2, item_callback=handle_article)

#def csv2dict_str_str(fname : str) -> Dict[str, str]:
def csv2dict_str_str(fname):
    """Takes a CSV file and returns a dictionary of pairs."""
    with open(fname, mode='r') as infile:
        rdr = csv.reader(infile)
        d = {unicode(rows[0].strip(), 'utf-8'): unicode(rows[1].strip(), 'utf-8') for rows in rdr}
    return d

def startpage(pageStr):
    """Compute the starting page number from a string representing page numbers."""
    global pageCounterNormal
    global pageCounterColon
    if pageStr is None:
        return 0
    pageCounterMatcher1 = pageCounterNormal.match(pageStr)
    pageCounterMatcher2 = pageCounterColon.match(pageStr)
    start = 0

    if not pageCounterMatcher1 is None:
        start = int(pageCounterMatcher1.group(1))
    else:
        if not pageCounterMatcher2 is None:
            start = int(pageCounterMatcher2.group(1))
    return start

#def pagecount(pageStr : str) : int:
def pagecount(pageStr):
    """Compute the number of pages in a string representing a range of page numbers."""
    if pageStr is None:
        return 0
    pageCounterMatcher1 = pageCounterNormal.match(pageStr)
    pageCounterMatcher2 = pageCounterColon.match(pageStr)
    start = 0
    end = 0
    count = 0

    if not pageCounterMatcher1 is None:
        start = int(pageCounterMatcher1.group(1))
        end = int(pageCounterMatcher1.group(2))
        count = end - start + 1
    else:
        if not pageCounterMatcher2 is None:
            start = int(pageCounterMatcher2.group(1))
            end = int(pageCounterMatcher2.group(2))
            count = end - start + 1
    return count

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


def countPaper(confname, year, volume, number, pages, startPage, pageCount, url, title):
    global EMSOFT_TECS
    global EMSOFT_TECS_PaperNumbers
    global TECSCounterColon
    global ISMB_Bioinformatics
    global ICSE_ShortPaperStart
    global SIGMOD_NonResearchPaperStart
    global SIGMOD_NonResearchPapersRange
    global TOG_SIGGRAPH_Volume
    global TOG_SIGGRAPH_Asia_Volume
    global TVCG_Vis_Volume
    global TVCG_VR_Volume
    global ASE_LongPaperThreshold
    global pageCountThreshold
    global ISMBpageCounter
    
    """Returns true iff this paper will be included in the rankings."""
    if year < startyear or year > endyear:
        return False

    # Special handling for EMSOFT.
    if confname == 'ACM Trans. Embedded Comput. Syst.':
        if year in EMSOFT_TECS:
            pvmatcher = TECSCounterColon.match(pages)
            if not pvmatcher is None:
                pseudovolume = int(pvmatcher.group(1))
                (startpv, endpv) = EMSOFT_TECS_PaperNumbers[year]
                if pseudovolume < int(startpv) or pseudovolume > int(endpv):
                    return False
        else:
            return False
        
    # Special handling for ISMB.
    if confname == 'Bioinformatics':
        if year in ISMB_Bioinformatics:
            (vol, num) = ISMB_Bioinformatics[year]
            if (volume != str(vol)) or (number != str(num)):
                return False
            else:
                if (int(volume) >= 33): # Hopefully this works going forward.
                    pg = ISMBpageCounter.match(pages)
                    if pg is None:
                        return False
                    startPage = int(pg.group(1))
                    end = int(pg.group(2))
                    pageCount = end - startPage + 1
        else:
            return False

    # Special handling for ICSE.
    elif confname == 'ICSE' or confname == 'ICSE (1)' or confname == 'ICSE (2)':
        if year in ICSE_ShortPaperStart:
            pageno = ICSE_ShortPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are "short papers" (regardless of their length).
                return False

    # Special handling for SIGMOD.
    elif confname == 'SIGMOD Conference':
        if year in SIGMOD_NonResearchPaperStart:
            pageno = SIGMOD_NonResearchPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are not research-track papers.
                return False
        if year in SIGMOD_NonResearchPapersRange:
            pageRange = SIGMOD_NonResearchPapersRange[year]
            for p in pageRange:
                if startPage >= p[0] and startPage + pageCount - 1 <= p[1]:
                    return False

    # Special handling for SIGGRAPH and SIGGRAPH Asia.
    elif confname in areadict['siggraph']: # == 'ACM Trans. Graph.':
        if year in TOG_SIGGRAPH_Volume:
            (vol, num) = TOG_SIGGRAPH_Volume[year]
            if not ((volume == str(vol)) and (number == str(num))):
                return False
        
    elif confname in areadict['siggraph-asia']: # == 'ACM Trans. Graph.':
        if year in TOG_SIGGRAPH_Asia_Volume:
            (vol, num) = TOG_SIGGRAPH_Asia_Volume[year]
            if not((volume == str(vol)) and (number == str(num))):
                return False

    # Special handling for IEEE Vis and VR
    elif confname == 'IEEE Trans. Vis. Comput. Graph.':
        Vis_Conf = False
        if year in TVCG_Vis_Volume:
            (vol, num) = TVCG_Vis_Volume[year]
            if (volume == str(vol)) and (number == str(num)):
                Vis_Conf = True
        if year in TVCG_VR_Volume:
            (vol, num) = TVCG_VR_Volume[year]
            if (volume == str(vol)) and (number == str(num)):
                Vis_Conf = True
        if not Vis_Conf:
            return False

    # Special handling for ASE.
    elif confname == 'ASE':
        if pageCount < ASE_LongPaperThreshold:
            # Omit short papers (which may be demos, etc.).
            return False

    # Disambiguate Innovations in (Theoretical) Computer Science from
    # International Conference on Supercomputing
    elif confname == 'ICS':
        if not url is None:
            if url.find('innovations') != -1:
                return False
        
    # SPECIAL CASE FOR conferences that have incorrect entries (as of 6/22/2016).
    # Only skip papers with a very small paper count,
    # but above 1. Why?
    # DBLP has real papers with incorrect page counts
    # - usually a truncated single page. -1 means no
    # pages found at all => some problem with journal
    # entries in DBLP.
    tooFewPages = False

    if pageCount == -1 and confname == 'ACM Conference on Computer and Communications Security':
        tooFewPages = True
    
    if ((pageCount != -1) and (pageCount < pageCountThreshold)):
        tooFewPages = True
        exceptionConference = confname == 'SC'
        exceptionConference |= confname == 'SIGSOFT FSE' and year == 2012
        exceptionConference |= confname == 'ACM Trans. Graph.' and int(volume) >= 26 and int(volume) <= 36
        exceptionConference |= confname == 'SIGGRAPH' and int(volume) >= 26 and int(volume) <= 36
        exceptionConference |= confname == 'CHI' and year == 2018 # FIXME - hopefully DBLP will fix
        if exceptionConference:
            tooFewPages = False
    if tooFewPages:
        return False
       
    return True

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
            if confname == 'PACMPL':
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
            if foundAuthor is not None:
                log = { 'name' : foundAuthor.encode('utf-8'),
                        'year' : year,
                        'title' : title.encode('utf-8'),
                        'conf' : confname,
                        'area' : areaname,
                        'institution' : facultydict[foundAuthor],
                        'numauthors' : authorsOnPaper }
                if not volume is "":
                    log['volume'] = volume
                if not number is "":
                    log['number'] = number
                if not startPage is "":
                    log['startPage'] = startPage
                if not pageCount is "":
                    log['pageCount'] = pageCount
                tmplist = authlogs.get(foundAuthor, [])
                tmplist.append(log)
                authlogs[foundAuthor] = tmplist
                interestingauthors[foundAuthor] = interestingauthors.get(foundAuthor, 0) + 1
                authorscores[(foundAuthor, areaname, year)] = authorscores.get((foundAuthor, areaname, year), 0) + 1.0
                authorscoresAdjusted[(foundAuthor, areaname, year)] = authorscoresAdjusted.get((foundAuthor, areaname, year), 0) + 1.0 / authorsOnPaper
    return True

def sortdictionary(d):
    """Sorts a dictionary."""
    return sorted(d.iteritems(), key=operator.itemgetter(1), reverse=True)

def dump_it():
    global authorscores
    global authorscoresAdjusted
    global authlogs
    global interestingauthors
    global facultydict
    with open('generated-author-info.csv','w') as f:
        f.write('"name","dept","area","count","adjustedcount","year"\n')
        authorscores = collections.OrderedDict(sorted(authorscores.iteritems()))
        for ((authorName, area, year), count) in authorscores.iteritems():
            # count = authorscores[(authorName, area, year)]
            countAdjusted = authorscoresAdjusted[(authorName, area, year)]
            f.write(authorName.encode('utf-8'))
            f.write(',')
            f.write((facultydict[authorName].encode('utf-8')))
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
        for v, l in authlogs.iteritems():
            if v in interestingauthors:
                for s in sorted(l, key=lambda x: x['name'].decode('utf-8')+str(x['year'])+x['conf']+x['title'].decode('utf-8')):
                    z.append(s)
        json.dump(z, f, indent=2)

def main():
    build_dicts()
    do_it()
    dump_it()
    print("Total papers counted = "+str(totalPapers))

if __name__== "__main__":
  main()
