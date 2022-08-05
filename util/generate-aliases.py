import csv
import gzip

from lxml import etree as ElementTree

facultydict = {}
with open("faculty-affiliations.csv") as f:
    rdr = csv.DictReader(f)
    for row in rdr:
        facultydict[row["name"]] = row["affiliation"]


def parseDBLP(facultydict):
    # with open('dblp.xml', mode='r') as f:
    print("alias,name")
    # dtd = ElementTree.DTD(file='dblp.dtd')
    with gzip.open('dblp-original.xml.gz', mode='rb') as f:
    # with open("dblp.xml", mode="r", encoding="utf-8") as f:

        oldnode = None

        for (event, node) in ElementTree.iterparse(f, events=["start", "end"], load_dtd=True):

            if oldnode is not None:
                oldnode.clear()
            oldnode = node
            authors = 0
            authorList = []

            # print((node.tag))
            if node.tag == "www":
                if node.get("key", "").startswith("homepages/"):
                    for child in node:
                        if child.tag == "author":
                            # print("WWW adding", child.text)
                            authorName = child.text
                            if authorName:
                                authorName = authorName.strip()
                                authors += 1
                                authorList.append(authorName.encode("utf-8"))
                                # print("author list", authorList)
                if authors:
                    pairs = [(authorList[0], item) for item in authorList[1:]]
                    for p in pairs:
                        print(
                            p[1].decode("utf-8") + "," + p[0].decode("utf-8")
                        )


parseDBLP(facultydict)
