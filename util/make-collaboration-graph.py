from csrankings import *
from graphviz import *

import csv

def makegraph(institution,fname):
    edges = {}
    dot = Graph(comment=institution)

    # print "graph umass { "

    for author in facultydict:
        if author in aliases:
            author = aliases[author]
        if author in affiliation:
            if affiliation[author] == institution:
                if not author in coauthors:
                    dot.node(author)
                if author in coauthors:
                    for coauth in coauthors[author]:
                        if coauth in aliases:
                            coauth = aliases[coauth]
                        if coauth in affiliation:
                            if affiliation[coauth] == institution:
                                if not author+coauth in edges:
                                    dot.edge(author,coauth)
                                    # print author + " -- " + coauth
                                    edges[author+coauth] = True
                                    edges[coauth+author] = True

    print(dot.source)
    dot.render(fname,view=True)


# name,affiliation
facultydict = csv2dict_str_str('faculty-affiliations.csv')

# Build reverse-lookup dictionary.
affiliation = {}
for name in facultydict:
    affiliation[name] = facultydict[name]
    
# author,coauthor,year,area

coauthors = {}

with open('faculty-coauthors.csv') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        if not coauthors.has_key(row['author']):
            coauthors[row['author']] = []
        coauthors[row['author']].append(row['coauthor'])
        
coauthordict = csv2dict_str_str('faculty-coauthors.csv')
aliases = csv2dict_str_str('dblp-aliases.csv')

# print "}"

institution = "University of Massachusetts Amherst"
makegraph(institution,'umass')

