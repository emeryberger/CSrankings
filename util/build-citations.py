from lxml import etree as ElementTree
import htmlentitydefs
import csv
import operator
import re
import scholar

# import gzip

generateLog = True

parser = ElementTree.XMLParser(attribute_defaults=True, load_dtd=True)

# Papers must be at least 4 pages long to count.
pageCountThreshold = 4
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile('(\d+)-(\d+)')
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile('[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)')

querier = scholar.ScholarQuerier()
settings = scholar.ScholarSettings()
query = scholar.SearchScholarQuery()

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

    
areadict = {
    'proglang' : ['POPL', 'PLDI','OOPSLA'],
    'logic' : ['CAV', 'LICS'],
    'softeng' : ['ICSE', 'SIGSOFT FSE', 'ESEC/SIGSOFT FSE'],
    'opsys' : ['SOSP', 'OSDI', 'EuroSys'],
    'arch' : ['ISCA', 'MICRO', 'ASPLOS'],
    'theory' : ['STOC', 'FOCS'],
    'networks' : ['SIGCOMM', 'INFOCOM', 'NSDI'],
    'security' : ['IEEE Symposium on Security and Privacy', 'ACM Conference on Computer and Communications Security', 'USENIX Security Symposium','NDSS'],
    'mlmining' : ['NIPS', 'ICML','KDD'],
    'ai' : ['AAAI', 'IJCAI'],
    'database' : ['PODS', 'VLDB', 'PVLDB', 'SIGMOD Conference'],
    'graphics' : ['ACM Trans. Graph.', 'SIGGRAPH'],
    'metrics' : ['SIGMETRICS','IMC'],
    'web' : ['WWW', 'SIGIR'],
    'hci' : ['CHI','UbiComp','UIST'],
    'nlp' : ['EMNLP','ACL','NAACL'],
    'vision' : ['CVPR','ICCV'],
    'mobile' : ['MobiSys','MobiCom','SenSys'],
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
startyear = 2000
endyear   = 2016

outputfname = "citations.csv"

def parseDBLP(facultydict):
    authlogs = {}
    interestingauthors = {}
    authorscores = {}
    authorscoresAdjusted = {}

    output = open(outputfname, mode='w')
    
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

                # If we got here, we have a winner.
                # Grab an author and a title.
                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        authorName.strip()
                        break

                for child in node:
                    if (child.tag == 'title'):
                        title = child.text
                        title.strip()
                        break

                query.set_author(authorName)
                query.set_phrase(title)
                query.set_scope(True)
                query.set_timeframe(year, year)
                query.set_num_page_results(1)
                querier.send_query(query)
                citations = 0
                if (len(querier.articles) >= 1):
                    citations = int(querier.articles[0].attrs.items()[3][1][0])
                print title+","+confname+","+str(year)+","+str(citations)
                output.write(title+","+confname+","+str(year)+","+str(citations))
    output.close()
    

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
