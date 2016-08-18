# from lxml import etree as ElementTree
import xml.etree.ElementTree as ElementTree
import htmlentitydefs
import csv
import operator
import re

# import gzip

# parser = ElementTree.XMLParser(attribute_defaults=True, load_dtd=True)
parser = ElementTree.XMLParser()

# Author paper count threshold - the author must have written at least this many top papers to count as a co-author.
# This is meant to generally exclude students.
authorPaperCountThreshold = 5

# Papers must be at least 6 pages long to count.
pageCountThreshold = 6
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
    # Max three most selective venues per area for now.
    'proglang' : ['POPL', 'PLDI', 'OOPSLA'],
    'highperf' : ['SC', 'HPDC', 'ICS'],
    'logic' : ['CAV', 'CAV (1)', 'CAV (2)', 'LICS', 'CSL-LICS'],
    'softeng' : ['ICSE', 'ICSE (1)', 'ICSE (2)', 'SIGSOFT FSE', 'ESEC/SIGSOFT FSE', 'ASE'],
    'opsys' : ['SOSP', 'OSDI', 'EuroSys', 'USENIX Annual Technical Conference', 'USENIX Annual Technical Conference, General Track'],
     # note: OSDI/SOSP alternate years, so are treated as one venue; USENIX ATC has two variants in DBLP
    'arch' : ['ISCA', 'MICRO', 'ASPLOS'],
    'theory' : ['STOC', 'FOCS','SODA'],
    'networks' : ['SIGCOMM', 'INFOCOM', 'NSDI'],
    'security' : ['IEEE Symposium on Security and Privacy', 'ACM Conference on Computer and Communications Security', 'USENIX Security Symposium', 'USENIX Security'],
    # USENIX Security listed twice to reflect variants in DBLP
    'mlmining' : ['NIPS', 'ICML','KDD'],
    'ai' : ['AAAI', 'AAAI/IAAI', 'IJCAI'],
    # AAAI listed to account for AAAI/IAAI joint conference
    'database' : ['PODS', 'VLDB', 'PVLDB', 'SIGMOD Conference'],
    'graphics' : ['ACM Trans. Graph.', 'SIGGRAPH'],
    'metrics' : ['SIGMETRICS','SIGMETRICS/Performance','IMC','Internet Measurement Conference'],
    # Two variants for each, as in DBLP.
    'web' : ['WWW', 'SIGIR'],
    'hci' : ['CHI','UbiComp','Ubicomp','UIST'],
    'nlp' : ['EMNLP','ACL','ACL (1)', 'ACL (2)', 'NAACL', 'HLT-NAACL'],
    'vision' : ['CVPR', 'CVPR (1)', 'CVPR (2)', 'ICCV', 'ECCV (1)', 'ECCV (2)', 'ECCV (3)', 'ECCV (4)', 'ECCV (5)', 'ECCV (6)', 'ECCV (7)'],
    'mobile' : ['MobiSys','MobiCom','MOBICOM','SenSys'],
    'robotics' : ['ICRA','ICRA (1)', 'ICRA (2)', 'IROS','Robotics: Science and Systems'],
    'crypto' : ['CRYPTO', 'CRYPTO (1)', 'CRYPTO (2)', 'EUROCRYPT', 'EUROCRYPT (1)', 'EUROCRYPT (2)']
}

# Build a dictionary mapping conferences to areas.
# e.g., confdict['CVPR'] = 'vision'.
confdict = {}
venues = []
for k, v in areadict.items():
    for item in v:
        confdict[item] = k
        venues.append(item)
        
# The list of all areas.
arealist = areadict.keys();

# Consider pubs in this range only.
startyear = 1970
endyear   = 2016

def csv2dict_str_str(fname):
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        #for rows in reader:
        #    print rows[0], "-->", rows[1]
        d = {unicode(rows[0].strip(),'utf-8'): unicode(rows[1].strip(),'utf-8') for rows in reader}
    return d

def sortdictionary(d):
    return sorted(d.iteritems(), key=operator.itemgetter(1), reverse = True)    
