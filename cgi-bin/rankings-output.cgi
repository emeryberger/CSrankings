#!/usr/bin/python

import cgi
import cgitb
cgitb.enable()  # for troubleshooting 

import csv
import os
import sys
import operator

sys.path.append(os.path.abspath("cgi-bin/"))

from subroutines import *

        
print "Content-type: text/html"
print ""
print "<html>"
print "<head>"
print "<title>CS department rankings by productivity</title>"
print "</head>"
print "<body>" 
# print "<h4>Ranking by aggregate faculty output</h4>"
print "<div class=\"table-responsive\">"
print "<table class=\"table table-striped\""
print "id=\"ranking\" valign=\"top\">"
print "<thead><tr><th>Rank</th><th>Institution</th><th>Score</th><th>Faculty</th></tr></thead>"
print "<tbody>"
i = 0
j = 1
oldv = -100

rankedlist = sorted(univagg.iteritems(), key=operator.itemgetter(1), reverse = True)  
for (k, v) in rankedlist:
    if (j > 20 and v != oldv):
        break
    if (v <= 0.01):
        break
    j = j + 1
    if (oldv != v):
        i = i + 1
    encoded = k.encode('utf-8')
    # Print rank
    print  "<tr><td>", i, "</td>"
    # Print university name
    print "<td>", "<a href=\"", univwww[encoded], "\">", encoded, "</a>", "</td>"
    # Print metric of interest
    s = str(univcounts[encoded])
    s.strip()
    print "<td align=\"right\">"
    print '{0}'.format(v)
    print "</td>"
    print "<td align=\"right\">"
    print '{0}'.format(s) 
    print "</td></tr>"
    oldv = v

print "</tbody>"
print "</table>" 
print "</div>"
print "\n"
print "<br>"

print "</body>"
print "</html>" 
