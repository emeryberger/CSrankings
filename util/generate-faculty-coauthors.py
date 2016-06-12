from lxml import etree as ElementTree
import htmlentitydefs
import csv
import operator
import re

# import gzip

generateLog = True

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

def csv2dict_str_str(fname):
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        #for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = {unicode(rows[0].strip(),'utf-8'): unicode(rows[1].strip(),'utf-8') for rows in reader}
    return d

facultydict = csv2dict_str_str('faculty-affiliations.csv')

parser = ElementTree.XMLParser(attribute_defaults=True, load_dtd=True)

# Papers must be at least 4 pages long to count.
pageCountThreshold = 4
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile('(\d+)-(\d+)')
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile('[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)')

def pagecount(input):
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


# Consider pubs in this range only.
startyear = 1990
endyear   = 2016

   
def parseDBLP(facultydict):
    coauthors = {}
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
                
                for child in node:
                    if (child.tag == 'year') and (type(child.text) is str):
                        year = int(child.text)
                        if ((year >= startyear) and (year <= endyear)):
                            inRange = True
                        break

                if (not inRange):
                    # Out of range.
                    continue
                    
                # Count the number of pages. It needs to exceed our threshold to be considered.
                pageCount = -1
                for child in node:
                    if (child.tag == 'pages'):
                        if (child.text != ""):
                            try:
                                pageCount = pagecount(child.text)
                            except:
                                pageCount = 2 # See below

                if ((pageCount > 1) and (pageCount < pageCountThreshold)):
                    # Only skip papers with a very small paper count,
                    # but above 1. Why?
                    # DBLP has real papers with incorrect page counts
                    # - usually a truncated single page. -1 means no
                    # pages found at all => some problem with journal
                    # entries in DBLP.
                    # print "Skipping article with "+str(pageCount)+" pages."
                    continue

                for child in node:
                    if (child.tag == 'booktitle' or child.tag == 'journal'):
                        if (child.text in confdict):
                            foundArticle = True
                            confname = child.text
                        break

                if (not foundArticle):
                    # Nope.
                    continue

                # If we got here, we have a winner.

                counter = counter + 1
                
                areaname = confdict[confname]
                coauthorsList = []
                
                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        authorName.strip()
                        if (authorName in facultydict):
                            authorName.encode('utf-8')
                            coauthorsList.append(authorName)
                            authorsOnPaper += 1

                # No authors? Bail.
                if (authorsOnPaper == 0):
                    continue
                
                for auth in coauthorsList:
                    if (not auth in coauthors):
                        coauthors[auth] = {}
                        coauthors[auth][(year,areaname)] = set([])
                    else:
                        if (not year in coauthors[auth]):
                            coauthors[auth][(year,areaname)] = set([])
                    for a in coauthorsList:
                        if (a != auth):
                            coauthors[auth][(year,areaname)].add(a)

    o = open('faculty-coauthors.csv', 'w')
    o.write('"author","coauthor","year","area"\n')
    for auth in coauthors:
        for (year,area) in coauthors[auth]:
            for coauth in coauthors[auth][(year,area)]:
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

parseDBLP(facultydict)

