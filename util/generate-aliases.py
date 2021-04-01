import gzip
from csrankings import *

facultydict = {}
with open("faculty-affiliations.csv") as f:
    rdr = csv.DictReader(f)
    for row in rdr:
        facultydict[row["name"]] = row["affiliation"]

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

            # print((node.tag))
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
                        print(p[1].decode('utf-8') + "," + p[0].decode('utf-8'))
                

parseDBLP(facultydict)


