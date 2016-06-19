from lxml import etree as ElementTree
import htmlentitydefs
import csv
import operator
import re

# import gzip

generateLog = True

parser = ElementTree.XMLParser(attribute_defaults=True, load_dtd=True)

# Author paper count threshold - the author must have written at least this many top papers to count as a co-author.
# This is meant to generally exclude students.
authorPaperCountThreshold = 5

# Papers must be at least 4 pages long to count.
pageCountThreshold = 4
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile('(\d+)-(\d+)')
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile('[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)')

def pagecount(input):
    if (input is None):
        return 0
    pageCounterMatcher1 = pageCounterNormal.match(input)
    pageCounterMatcher2 = pageCounterColon.match(input)
    start = 0
    end = 0
    count = 0
    
    if (not (pageCounterMatcher1 is None)):
        start = int(pageCounterMatcher1.group(1))
        end   = int(pageCounterMatcher1.group(2))
        count = end-start+1
    else:
        if (not (pageCounterMatcher2 is None)):
            start = int(pageCounterMatcher2.group(1))
            end   = int(pageCounterMatcher2.group(2))
            count = end-start+1
    return count

    
areadict = {
    'proglang' : ['POPL', 'PLDI','OOPSLA'],
    'logic' : ['CAV', 'LICS'],
    'softeng' : ['ICSE', 'ICSE (2)', 'SIGSOFT FSE', 'ESEC/SIGSOFT FSE'],
    'opsys' : ['SOSP', 'OSDI'],
    'arch' : ['ISCA', 'MICRO', 'ASPLOS'],
    'theory' : ['STOC', 'FOCS','SODA'],
    'networks' : ['SIGCOMM', 'INFOCOM', 'NSDI'],
    'security' : ['IEEE Symposium on Security and Privacy', 'ACM Conference on Computer and Communications Security', 'USENIX Security Symposium'],
    'mlmining' : ['NIPS', 'ICML','KDD'],
    'ai' : ['AAAI', 'IJCAI'],
    'database' : ['PODS', 'VLDB', 'PVLDB', 'SIGMOD Conference'],
    'graphics' : ['ACM Trans. Graph.', 'SIGGRAPH'],
    'metrics' : ['SIGMETRICS','IMC','Internet Measurement Conference'],
    'web' : ['WWW', 'SIGIR'],
    'hci' : ['CHI','UbiComp','UIST'],
    'nlp' : ['EMNLP','ACL','NAACL'],
    'vision' : ['CVPR','ICCV'],
    'mobile' : ['MobiSys','MobiCom','MOBICOM','SenSys'],
    'robotics' : ['ICRA','IROS','Robotics: Science and Systems']
}

# Build a dictionary mapping conferences to areas.
# e.g., confdict['CVPR'] = 'vision'.
confdict = {}
for k, v in areadict.items():
    for item in v:
        confdict[item] = k

# The list of all areas.
arealist = areadict.keys();

# Consider pubs in this range only.
startyear = 1990
endyear   = 2016

   
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
                        if (child.text in confdict):
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

                if ((pageCount > 1) and (pageCount < pageCountThreshold)):
                    # Only skip papers with a very small paper count,
                    # but above 1. Why?
                    # DBLP has real papers with incorrect page counts
                    # - usually a truncated single page. -1 means no
                    # pages found at all => some problem with journal
                    # entries in DBLP.
                    # print "Skipping article with "+str(pageCount)+" pages."
                    continue

                counter = counter + 1
                
                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        authorName = authorName.strip()
                        if (authorName in facultydict):
                            for coauth in coauthorsList:
                                if (coauth != authorName):
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


def csv2dict_str_str(fname):
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        #for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = {unicode(rows[0].strip(),'utf-8'): unicode(rows[1].strip(),'utf-8') for rows in reader}
    return d

def sortdictionary(d):
    return sorted(d.iteritems(), key=operator.itemgetter(1), reverse = True)    

facultydict = csv2dict_str_str('faculty-affiliations.csv')

parseDBLP(facultydict)

