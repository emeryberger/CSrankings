import gzip
from csrankings import *

def parseDBLP(facultydict):
    counter = 0

    # with open('dblp.xml', mode='r') as f:
        
    with gzip.open('dblp.xml.gz', mode='rb') as f:

        oldnode = None
        
        for (event, node) in ElementTree.iterparse(f, events=['start', 'end']):

            if (oldnode is not None):
                oldnode.clear()
            oldnode = node
            authors = 0
            authorList = []

            if (node.tag == 'www'):
                for child in node:
                    if (child.tag == 'author'):
                        authorName = child.text
                        if (authorName is not None):
                            authorName = authorName.strip()
                            authors = authors + 1
                            authorList.append(authorName.encode('utf-8'))
                if (authors > 1):
                    pairs = [(authorList[0],item) for item in authorList[1:]]
                    for p in pairs:
                        print p[1] + "," + p[0]
                

facultydict = csv2dict_str_str('faculty-affiliations.csv')

parseDBLP(facultydict)


