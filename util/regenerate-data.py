from lxml import etree as ElementTree
import htmlentitydefs
import csv
import operator
import re

# import gzip

generateLog = True

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
    authlogs = {}
    interestingauthors = {}
    authorscores = {}
    authorscoresAdjusted = {}
    
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

                # Now, count up how many faculty from our list are on this paper.
                
                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        authorName.strip()
                        if (authorName in facultydict):
                            authorsOnPaper += 1

                if (authorsOnPaper == 0):
                    # No authors from our list.
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
                
                areaname = confdict[confname]
                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        authorName.strip()
                        if (authorName in facultydict):
                            # print "here we go",authorName, confname, authorsOnPaper, year
                            if (generateLog):
                                logstring = authorName.encode('utf-8') + " ; " + confname + " " + str(year)
                                tmplist = authlogs.get(authorName,[])
                                tmplist.append(logstring)
                                authlogs[authorName] = tmplist
                            interestingauthors[authorName] = interestingauthors.get(authorName,0) + 1
                            authorscores[(authorName, areaname, year)] = authorscores.get((authorName, areaname, year), 0) + 1.0
                            authorscoresAdjusted[(authorName, areaname, year)] = authorscoresAdjusted.get((authorName, areaname, year), 0) + 1.0 / authorsOnPaper
                          
  
            
    if (generateLog):
        return (interestingauthors, authorscores, authorscoresAdjusted, authlogs)
    else:
        return (interestingauthors, authorscores, authorscoresAdjusted)


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

if (generateLog):
    (intauthors_gl, authscores_gl, authscoresAdjusted_gl, authlog_gl) = parseDBLP(facultydict)
else:
    (intauthors_gl, authscores_gl, authscoresAdjusted_gl) = parseDBLP(facultydict)

f = open('generated-author-info.csv','w')
f.write('"name","dept","area","count","adjustedcount","year"\n')
for k, v in intauthors_gl.items():
    #print k, "@", v
    if (v >= 1):
        for area in arealist:
            for year in range(startyear,endyear + 1):
                if (authscores_gl.has_key((k, area,year))):
                    count = authscores_gl.get((k,area,year))
                    countAdjusted = authscoresAdjusted_gl.get((k,area,year))
                    f.write(k.encode('utf-8'))
                    f.write(',')
                    f.write((facultydict[k]).encode('utf-8'))
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


if (generateLog):
    f = open('rankings-all.log','w')
    for v, l in authlog_gl.items():
        if intauthors_gl.has_key(v):
            if (intauthors_gl[v] >= 1):
                f.write("Papers for " + v.encode('utf-8') + ', ' + (facultydict[v]).encode('utf-8') + "\n")
                for logstring in l:
                    f.write(logstring)
                    f.write('\n')
            f.write('\n')
    f.close()



