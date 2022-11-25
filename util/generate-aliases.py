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
    dtd = ElementTree.DTD(file="dblp.dtd")
    with gzip.open("dblp-original.xml.gz", mode="rb") as f:
        # with open("dblp.xml", mode="r", encoding="utf-8") as f:

        oldnode = None

        for (event, node) in ElementTree.iterparse(
            f, events=["start", "end"], load_dtd=True
        ):

            if oldnode is not None:
                oldnode.clear()
            oldnode = node
            authors = 0
            authorList = []

            if node.tag != "www":
                continue

            # print("FIND: ", node.findtext("author", default="None"))
            # print("DATE", node.get("mdate", ""))
            # print("KEY", node.get("key",""))

            # Skip non-home page entries.
            if not node.get("key", "").startswith("homepages/"):
                continue

            # print("WWW")
            # print(node.getchildren())
            for child in node.getchildren():
                # from pprint import pprint
                # print(child)
                # print(child.tag)
                # print(child.findtext("author", "NOTEXT"))
                if child.tag != "author":
                    continue
                # print(dir(child))
                # print("AUTHOR", child.text)
                # print(dir(child))
                # print("WWW adding", child.text)
                authorName = child.text
                if not authorName:
                    continue
                # print("ADDING ", authorName)
                authorName = authorName.strip()
                authors += 1
                authorList.append(authorName.encode("utf-8"))
                # print("author list", authorList)

            if not authors:
                continue

            # print("AUTHORS", authorList)
            pairs = [(authorList[0], item) for item in authorList[1:]]
            for p in pairs:
                print(p[1].decode("utf-8") + "," + p[0].decode("utf-8"))


parseDBLP(facultydict)
