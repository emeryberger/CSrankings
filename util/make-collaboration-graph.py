from csrankings import *
from graphviz import *

import csv

aicolor = "#32CD32"     # limegreen
syscolor = "#0000ff"    # blue
theorycolor = "#ffff00" # yellow
intercolor = "#ffc0cb"  # pink

colorList = [aicolor, aicolor, aicolor, aicolor, aicolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, theorycolor, theorycolor, theorycolor, intercolor, intercolor, intercolor, intercolor, syscolor, syscolor ]

# colorList = ["#f30000", "#0600f3", "#00b109", "#14e4b4", "#0fe7fb", "#67f200", "#ff7e00", "#8fe4fa", "#ff5300", "#640000", "#3854d1", "#d00ed8", "#7890ff", "#01664d", "#04231b", "#e9f117", "#f3228e", "#7ce8ca", "#ff5300", "#ff5300", "#7eff30", "#9a8cf6", "#79aff9", "#bfbfbf", "#56b510", "#00e2f6", "#ff4141", "#61ff41" ]

areaList = [ { "area" : "ai", "title" : "AI" },
	    { "area" : "vision", "title" : "Vision" },
	    { "area" : "mlmining", "title" : "ML" },
	    { "area" : "nlp",  "title" : "NLP" },
	    { "area" : "ir", "title" : "Web & IR" },
	    { "area" : "arch", "title" : "Arch" },
	    { "area" : "comm", "title" : "Networks"},
	    { "area" : "sec", "title" : "Security"},
	    { "area" : "mod", "title" : "DB"},
	    { "area" : "hpc", "title" : "HPC"},
	    { "area" : "mobile", "title" : "Mobile"},
	    { "area" : "metrics", "title" : "Metrics"},
	    { "area" : "ops", "title" : "OS" },
	    { "area" : "plan", "title" : "PL" },
	    { "area" : "soft", "title" : "SE" },
	    { "area" : "act", "title" : "Theory" },
	    { "area" : "crypt", "title" : "Crypto" },
	    { "area" : "log", "title" : "Logic" },
	    { "area" : "graph", "title" : "Graphics" },
	    { "area" : "chi", "title" : "HCI" },
	    { "area" : "robotics", "title" : "Robotics" },
	    { "area" : "bio", "title" : "Comp. Biology" },
	    { "area" : "da", "title" : "Design Automation" },
	    { "area" : "bed", "title" : "Embedded Systems" } ]


def makegraph(institution,fname):
    edges = {}
    dot = Graph(comment=institution)

    # print "graph umass { "

    for author in facultydict:
        if author in aliases:
            author = aliases[author]
        if facultydict[author] == institution:
            print author
            if not author in authorColor:
                continue
            if not author in coauthors:
                dot.node(author.encode('utf8'),color=authorColor[author],style="filled")
                continue
            for coauth in coauthors[author]:
                if coauth in aliases:
                    coauth = aliases[coauth]
                if coauth in facultydict:
                    if facultydict[coauth] == institution:
                        if not (author+coauth) in edges:
                            dot.edge(author.decode('utf8'),coauth.decode('utf8'))
                        dot.node(author.decode('utf8'),color=authorColor[author],style="filled")
                        dot.node(coauth.decode('utf8'),color=authorColor[coauth],style="filled")
                        # print author + " -- " + coauth
                        edges[author+coauth] = True
                        edges[coauth+author] = True

    # print(dot.source)
    dot.render(fname,view=True)


# name,affiliation
facultydict = {}
with open('faculty-affiliations.csv', 'rb') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        name = row['name'].strip()
        aff = row['affiliation'].strip()
        facultydict[name] = aff

# author,coauthor,year,area
coauthors = {}
with open('faculty-coauthors.csv', 'rb') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        author = row['author'].strip()
        coauthor = row['coauthor'].strip()
        if not coauthors.has_key(author):
            coauthors[author] = []
        coauthors[author].append(coauthor)
        if not coauthors.has_key(coauthor):
            coauthors[coauthor] = []
        coauthors[coauthor].append(author)

# alias,name
aliases = {}
with open('dblp-aliases.csv','rb') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        alias = row['alias'].strip()
        name = row['name'].strip()
        aliases[alias] = name

# Now build up the color mapping.
# color: int -> color
color = {}
i = 0
for c in colorList:
    color[i] = c
    i = i + 1

# areaColor: area name -> color
areaColor = {}
i = 0
for a in areaList:
    areaName = a['area']
    areaColor[areaName] = color[i]
    i = i + 1

pubs = {}

# "name","dept","area","count","adjustedcount","year"

with open('generated-author-info.csv') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        author = row['name'].strip()
        area = row['area'].strip()
        # author = author.decode('utf8')
        if not author in pubs:
            pubs[author] = {}
        if not area in pubs[author]:
            pubs[author][area] = 0
        pubs[author][area] = pubs[author][area] + 1

# Compute color for each author.
# First, find max area for each author.

maxareas = {}

for author in pubs:
    maxarea = None
    maxcount = 0
    for area in pubs[author]:
        if pubs[author][area] > maxcount:
            maxarea = area
            maxcount = pubs[author][area]
    maxareas[author] = maxarea

authorColor = {}

for author in maxareas:
    # print maxareas[author]
    authorColor[author] = areaColor[maxareas[author]]

        
# print "}"

institution = "University of Massachusetts Amherst"
makegraph(institution,'umass')
