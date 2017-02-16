from csrankings import *
from collections import *
# from graphviz import *

import csv
import json
from nameparser import HumanName

#import networkx as nx
#import matplotlib.pyplot as plt

startyear = 2006
endyear = 2017

aicolor = "#32CD32"     # limegreen
syscolor = "#00bfff"    # blue
theorycolor = "#ffff00" # yellow
intercolor = "#ffc0cb"  # pink
nacolor = "#d3d3d3"     # light gray
nocolor = "#ffffff"     # white = no co-authors (making it invisible)

colors = [ aicolor,
           syscolor,
           theorycolor,
           intercolor,
           nacolor ]
    
colorGroup = { aicolor : 1,
               syscolor : 2,
               theorycolor : 3,
               intercolor : 4,
               nacolor : 5 }

colorList = [aicolor, aicolor, aicolor, aicolor, aicolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, syscolor, theorycolor, theorycolor, theorycolor, intercolor, intercolor, intercolor, intercolor, syscolor, syscolor, intercolor, nacolor ]

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
            { "area" : "bed", "title" : "Embedded Systems" },
             { "area" : "vis", "title" : "Visualization" }, 
             { "area" : "na", "title" : "Other" }
]

areaNum = {}
ind = 0
for i in areaList:
    areaNum[areaList[ind]["area"]] = colorGroup[colorList[ind]]
    ind += 1

def canonicalName(name):
    canonical = name.decode('utf8')
    canonical = canonical.replace("0001","")
    canonical = canonical.replace("0002","")
    canonical = canonical.replace("0003","")
    canonical = canonical.replace("0004","")
    canonical = HumanName(canonical).first + " " + HumanName(canonical).last
    return canonical

def displayName(name):
    canonical = canonicalName(name)
    display = HumanName(canonical).first[0] + ". " + HumanName(canonical).last
    return display

def addNode(name, nodes, addedNode, authorIndex, authorInd):
    if not addedNode.has_key(name.decode('utf8')):
        if name in maxareas:
            nodes.append({ 'nodeName' : canonicalName(name),
                           'group' : areaNum[maxareas[name]]})
            addedNode[name.decode('utf8')] = True
            authorIndex[canonicalName(name)] = authorInd
            authorInd += 1
        
    
def makegraph(institution,fname,dir):
    sumdegree = 0
    sumnodes = 0
    maxdegree = 0
    nodes = []
    addedNode = {}
    links = []
    edges = {}
    authorIndex = {}
    authorInd = 0
    coauthored = {}
    # dot = Graph(comment=institution,engine='circo')
    
    # dot = Graph(comment=institution,engine='neato')
    # graph = nx.Graph()

    # Go through every author.
    for author in pubs:
        degree = 0
        if facultydict[author] != institution:
            continue
        if author in aliases:
            author = aliases[author]
        realname = canonicalName(author)
        addNode(author, nodes, addedNode, authorIndex, authorInd)
        sumnodes += 1
        # Check co-authors.
        # Now go through all the coauthors (we may not find any, which we handle as a special case below).
        foundOne = False
        for coauth in coauthors.get(author, []):
            print "author = " + author + ", coauth = " + coauth
            if coauth in aliases:
                coauth = aliases[coauth]
            if coauth in facultydict:
                if facultydict[coauth] == institution:
                    coauthorrealname = canonicalName(coauth)
                    foundOne = True
                    # dot.edge(author.decode('utf8'),coauth.decode('utf8'))
                    # graph.add_edge(author.decode('utf8'),coauth.decode('utf8'))
                    # dot.node(author.decode('utf8'),color=authorColor[author],style="filled")
                    #if not coauth in pubs:
                    #    # Not in DB
                    #    continue
                    # dot.node(coauth.decode('utf8'),color=authorColor[coauth],style="filled")
                    # Force co-author to be added here so we can reference him/her.
                    addNode(coauth, nodes, addedNode, authorIndex, authorInd)
                    if not edges.has_key(realname+coauthorrealname):
                        degree += 1
                        sumdegree += 1
                        if degree > maxdegree:
                            maxdegree = degree
                        # print realname + " - " + coauthorrealname
                        links.append({ 'source' : authorIndex[realname],
                                       'target' : authorIndex[coauthorrealname],
                                       'value'  : 1 })
                        print "adding " + realname.encode('utf8') + " <-> " + coauthorrealname.encode('utf8')
                        edges[realname+coauthorrealname] = 0
                        edges[coauthorrealname+realname] = 0
                    edges[realname+coauthorrealname] += 1
                    edges[coauthorrealname+realname] += 1
        if foundOne:
            coauthored[realname] = True
        else:
            coauthored[realname] = False
            # Either had no co-authors since startyear or had co-authors but not at this institution.

            # dot.node(author.decode('utf8'),color=authorColor[author],style="filled")
            # graph.add_edge(author.decode('utf8'),author.decode('utf8'))
            edges[realname+realname] = 2 # include one bogus co-authored article (2 b/c divided by 2 later)
            links.append({ 'source' : authorIndex[realname],
                           'target' : authorIndex[realname],
                           'value'  : 1 })

    # dot.render(dir+fname)
    #print "Nodes = " + str(sumnodes)
    #print "Degree = " + str(sumdegree)
    #print "Max degree = " + str(maxdegree)
    #print "Average degree = " + str(float(sumdegree)/float(sumnodes))
    gr = { 'nodes' : nodes, 'links' : links }
    # print json.dumps(gr)
    #with open(dir+fname+".json", 'wb') as f:
    # f.write("var collabs = " + json.dumps(gr) + ";")
    # f.write(json.dumps(gr))
    with open(dir+fname+"-nodes.csv", 'wb') as f:
        f.write("name,abbrv,color,coauthored\n")
        for node in nodes:
            name = node['nodeName'].encode('utf8')
            line = name
            line += ","
            line += displayName(name).encode('utf8')
            line += ","
            line += colors[node['group']-1]
            if coauthored[node['nodeName']]:
                line += ",1"
            else:
                line += ",0"
            f.write(line + "\n")
    with open(dir+fname+"-matrix.json", 'wb') as f:
        matrix = []
        for x in range(0,len(nodes)):
            row = []
            for y in range(0,len(nodes)):
                key = nodes[x]['nodeName']+nodes[y]['nodeName']
                if key in edges:
                    row.append(edges[nodes[x]['nodeName']+nodes[y]['nodeName']] / 2)
                else:
                    row.append(0)
            matrix.append(row)
        f.write(json.dumps(matrix))
        #            f.write(line)
    # print(dot.source.encode('utf8'))
    
    # pos = nx.nx_agraph.graphviz_layout(graph)
    #pos = nx.spring_layout(graph,iterations=20)
    #nx.draw_networkx_edges(graph,pos)
    #nx.draw_networkx_nodes(graph,pos)
    #nx.draw_networkx_labels(graph,pos)
    #plt.axis('off')
    # plt.rcParams['text.usetex'] = False
    #plt.figure(figsize=(16,16))
    #plt.savefig("test.png",dpi=300)
    #plt.show()

# name,affiliation
facultydict = {}
with open('faculty-affiliations.csv', 'rb') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        name = row['name'].strip()
        aff = row['affiliation'].strip()
        facultydict[name] = aff

institutions = {}
for name in facultydict:
    if not facultydict[name] in institutions:
        institutions[facultydict[name]] = True

institutions = OrderedDict(sorted(institutions.items(), key=lambda t: t[0]))

# alias,name
aliases = {}
with open('dblp-aliases.csv','rb') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        alias = row['alias'].strip()
        name = row['name'].strip()
        aliases[alias] = name


# author,coauthor,year,area
coauthors = {}
with open('faculty-coauthors.csv', 'rb') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        author = row['author'].strip()
        if author in aliases:
            author = aliases[author]
        coauthor = row['coauthor'].strip()
        if coauthor in aliases:
            coauthor = aliases[coauthor]
        print "read in " + author
        print "  coauthor = " + coauthor
        year = int(row['year'].strip())
        print "year = " + str(year)
        if year < startyear or year > endyear:
            continue
        if not coauthors.has_key(author):
            coauthors[author] = []
        coauthors[author].append(coauthor)
        #if not coauthors.has_key(coauthor):
        #    coauthors[coauthor] = []
        #coauthors[coauthor].append(author)

# Now build up the color mapping.
# color: int -> color
color = {}
i = 0
for c in colorList:
    color[i] = c
    i += 1

# areaColor: area name -> color
areaColor = {}
i = 0
for a in areaList:
    areaName = a['area']
    areaColor[areaName] = color[i]
    i += 1

pubs = {}

# "name","dept","area","count","adjustedcount","year"

with open('all-author-info.csv') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        author = row['name'].strip()
        area = row['area'].strip()
        year = int(row['year'].strip())
        if year < startyear or year > endyear:
            continue
        if author in aliases:
            author = aliases[author]
        if not author in pubs:
            pubs[author] = {}
        if not area in pubs[author]:
            pubs[author][area] = 0
        pubs[author][area] += 1

# Compute color for each author.
# First, find max area for each author.

maxareas = {}

for author in pubs:
    maxarea = "na"
    maxcount = 0
    for area in pubs[author]:
        # print (author,area,pubs[author][area])
        if pubs[author][area] > maxcount:
            if not area == "na":
                maxarea = area
                maxcount = pubs[author][area]
    maxareas[author] = maxarea
        
authorColor = {}

for author in maxareas:
    authorColor[author] = areaColor[maxareas[author]]


dir = "collab/graphs/"

for institution in institutions:
    print '<option value="' + institution + '">' + institution + "</option>" 
    makegraph(institution,institution+"-graph",dir)
