import csv
import gzip
import os

from lxml import etree as ElementTree


class LocalDTDResolver(ElementTree.Resolver):
    """Serve the local dblp.dtd for whatever DTD name the dump declares.

    The rolling dump declares SYSTEM "dblp.dtd"; the monthly releases on
    drops.dagstuhl.de declare a dated name such as "dblp-2023-06-28.dtd".
    """

    def resolve(self, system_url, public_id, context):
        if os.path.basename(system_url).startswith("dblp") and system_url.endswith(".dtd"):
            return self.resolve_filename(os.path.abspath("dblp.dtd"), context)
        return None


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

        parser = ElementTree.iterparse(
            f, events=["start", "end"], load_dtd=True
        )
        # The monthly releases declare a dated DTD (e.g. dblp-2023-06-28.dtd);
        # map any dblp*.dtd to the local dblp.dtd so entities still resolve.
        parser.resolvers.add(LocalDTDResolver())
        for (event, node) in parser:

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
