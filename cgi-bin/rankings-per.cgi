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

print "<h4>Ranking by output per faculty member</h4>"
print "<table>"

i = 0
j = 1
oldv = -100

rankedlist = sorted(univper.iteritems(), key=operator.itemgetter(1), reverse = True)  
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

print "</body>"
print "</html>" 
