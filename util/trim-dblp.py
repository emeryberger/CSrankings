from lxml import etree as ElementTree
import htmlentitydefs
import csv
import operator
import re

parser = ElementTree.XMLParser(attribute_defaults=True, load_dtd=True)

# Papers must be at least 4 pages long to count.
pageCountThreshold = 4
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile("(\d+)-(\d+)")
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile("[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)")


def pagecount(input):
    pageCounterMatcher1 = pageCounterNormal.match(input)
    pageCounterMatcher2 = pageCounterColon.match(input)
    start = 0
    end = 0
    count = 0

    if not (pageCounterMatcher1 is None):
        start = int(pageCounterMatcher1.group(1))
        end = int(pageCounterMatcher1.group(2))
        count = end - start + 1
    else:
        if not (pageCounterMatcher2 is None):
            start = int(pageCounterMatcher2.group(1))
            end = int(pageCounterMatcher2.group(2))
            count = end - start + 1
    return count


# Consider pubs in this range only.
startyear = 2000
endyear = 2016

outputfname = "dblp-reduced.xml"


def parseDBLP():

    count = 0
    output = open(outputfname, "w")
    output.write(
        """<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE dblp SYSTEM "dblp.dtd">
<dblp>"""
    )

    with open("dblp.xml", mode="r") as f:

        # with gzip.open('dblp.xml.gz') as f:

        for (event, node) in ElementTree.iterparse(f, events=["start", "end"]):

            foundArticle = False
            inRange = False
            authorsOnPaper = 0
            authorName = ""
            confname = ""
            year = -1

            if node.tag == "inproceedings" or node.tag == "article":

                # Check that dates are in the specified range.

                for child in node:
                    if child.tag == "year" and type(child.text) is str:
                        year = int(child.text)
                        if (year >= startyear) and (year <= endyear):
                            inRange = True
                        break

                if not inRange:
                    # Out of range.
                    node.clear()
                    continue

                # Count the number of pages. It needs to exceed our threshold to be considered.
                pageCount = -1
                for child in node:
                    if child.tag == "pages" and type(child.text) is str:
                        pageCount = pagecount(child.text)

                if (pageCount > 1) and (pageCount < pageCountThreshold):
                    # Only skip papers with a very small paper count,
                    # but above 1. Why?
                    # DBLP has real papers with incorrect page counts
                    # - usually a truncated single page. -1 means no
                    # pages found at all => some problem with journal
                    # entries in DBLP.
                    # print "Skipping article with "+str(pageCount)+" pages."
                    node.clear()
                    continue

                count = count + 1
                print(str(count))
                output.write(ElementTree.tostring(node, pretty_print=True))
                node.clear()
                # If we got here, we have a winner.
    output.write("</dblp>")
    output.close()


parseDBLP()
