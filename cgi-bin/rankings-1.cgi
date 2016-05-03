#!/usr/bin/python

import cgi
import cgitb
cgitb.enable()  # for troubleshooting 

import os
import csv
import sys
import operator

sys.path.append(os.path.abspath("cgi-bin/"))

from subroutines import *

"""
startyear = 2005
endyear = 2014

weights = {'plflagship': 1.0,'plothers': 0.5,'logic': 0.5, 'softeng': 0.5, 'opsys': 0.0, 'arch': 0.0, 'theory': 0.0, 'networks': 0.0, 'security': 0.0, 'mlmining': 0.0, 'ai': 0.0, 'database': 0.0,'metrics': 0.0, 'web': 0.0, 'hci': 0.0, 'graphics': 0.0}
"""


print "Content-type: text/html"
print ""
print "<html>"
print "<head>"
print "<title>CS department rankings by productivity</title>"
print "</head>"
print "<body>" 

        
print "<h4>Ranking by group size</h4>"
print "<table>"
i = 0
j = 1
oldv = -100
rankedlist = sorted(univcounts.iteritems(), key=operator.itemgetter(1), reverse = True)  
for (k, v) in rankedlist:
    if (j > 20 and v != oldv):
        break
    if (v <= 0.01):
        break
    j = j + 1
    if (oldv != v):
        i = i + 1
    encoded = k.encode('utf-8')
    print  "<tr><td>", i, "</td><td>", "<a href=\"", univwww[encoded], "\">", encoded, "</a>", "</td><td>", v, "</td></tr>"
    oldv = v
print "</table>" 
print "\n"
print "<br>"

print "</body>"
print "</html>" 
