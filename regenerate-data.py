# from xml.etree.ElementTree import iterparse, XMLParser
from lxml import etree as ElementTree
import htmlentitydefs
import csv
import operator
import sys
import gzip

class CustomEntity:
    def __getitem__(self, key):
        return unichr(htmlentitydefs.name2codepoint[key])

parser = ElementTree.XMLParser(attribute_defaults=True,load_dtd=True)
# parser.parser.UseForeignDTD(True)
# parser.entity = CustomEntity()

areadict = {
    'proglang' : ['POPL', 'PLDI','OOPSLA'],
    'logic' : ['CAV', 'LICS'],
    'softeng' : ['ICSE', 'SIGSOFT FSE', 'ESEC/SIGSOFT FSE'],
    'opsys' : ['SOSP', 'OSDI', 'ASPLOS','EuroSys'],
    'arch' : ['ISCA', 'MICRO'],
    'theory' : ['STOC', 'FOCS'],
    'networks' : ['SIGCOMM', 'INFOCOM', 'NSDI'],
    'security' : ['IEEE Symposium on Security and Privacy', 'ACM Conference on Computer and Communications Security', 'USENIX Security Symposium','NDSS'],
    'mlmining' : ['NIPS', 'ICML','KDD'],
    'ai' : ['AAAI', 'IJCAI'],
    'database' : ['PODS', 'VLDB J.', 'VLDB', 'PVLDB', 'SIGMOD Conference'],
    'graphics' : ['ACM Trans. Graph.', 'SIGGRAPH'],
    'metrics' : ['SIGMETRICS','IMC'],
    'web' : ['WWW', 'SIGIR'],
    'hci' : ['CHI','UIST'],
    'nlp' : ['EMNLP','ACL','NAACL'],
    'vision' : ['CVPR','ICCV'],
    'mobile' : ['MobiSys','MobiCom'],
    'robotics' : ['ICRA','IROS']
}

confdict = {}
for k, v in areadict.items():
    for item in v:
        confdict[item] = k

arealist = areadict.keys();

startyear = 2000
endyear = 2016

   
def conf2area(confname):
    return confdict[confname]

def parseDBLP(facultydict):
    authlogs = {}
    interestingauthors = {}
    authorscores = {}

    with gzip.open('dblp.xml.gz') as f:
        for (event, node) in ElementTree.iterparse(f, events=['start', 'end']):
            if (node.tag == 'inproceedings' or node.tag == 'article'):
                flag = False
                for child in node:
                    cond = (child.tag == 'booktitle' or child.tag == 'journal') and (child.text in confdict)
                    if (cond):
                        flag = True
                        confname = child.text
                        yflagfortrace = -1
                        break
                if (flag):
                    for child in node:    
                        if (child.tag == 'year' and type(child.text) is str):
                            if (int(child.text) < startyear or int(child.text)>endyear):
                                flag = False
                            else:
                                yflagfortrace = int(child.text)
                            break
                if(flag):
                    for child in node:
                        if(child.tag == 'author'):
                            authname = child.text
                            #print "Author: ", authname
                            if (authname in facultydict):
                                #print "Found prof author: ", authname
                                logstring = authname.encode('utf-8') + " ; " + confname + " " + str(yflagfortrace)
                                tmplist = authlogs.get(authname,[])
                                tmplist.append(logstring)
                                authlogs[authname] = tmplist
                                # if (confname in relevantconf):
                                interestingauthors[authname] = interestingauthors.get(authname,0) + 1
                                areaname = conf2area(confname)
                                authorscores[(authname,areaname,yflagfortrace)] = authorscores.get((authname,areaname,yflagfortrace), 0) + 1
                                #authorscores[(authname,areaname)] = authorscores.get((authname,areaname), 0) + 1
            node.clear()
    return (interestingauthors, authorscores, authlogs)


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

(intauthors_gl, authscores_gl, authlog_gl) = parseDBLP(facultydict)

f = open('generated-author-info.csv','w')
f.write('"name","dept","area","count","year"\n')
for k, v in intauthors_gl.items():
    #print k, "@", v
    if (v >= 1):
        for area in arealist:
            for year in range(startyear,endyear + 1):
                if (authscores_gl.has_key((k, area,year))):
                    m = authscores_gl.get((k,area,year))
                    f.write(k.encode('utf-8'))
                    f.write(',')
                    f.write((facultydict[k]).encode('utf-8'))
                    f.write(',')
                    f.write(area)
                    f.write(',')
                    f.write(str(m))
                    f.write(',')
                    f.write(str(year))
                    f.write('\n')
f.close()    


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



