from __future__ import division
import cgi
import cgitb
cgitb.enable()  # for troubleshooting 

import os
import csv
import sys
import operator

weights = {}
form = cgi.FieldStorage()
weights['plflagship'] = float(form.getvalue('plflagship'))
# weights['plothers'] = float(form.getvalue('plothers'))
weights['logic'] = float(form.getvalue('logic'))
weights['softeng'] = float(form.getvalue('softeng'))
weights['opsys'] = float(form.getvalue('opsys'))
weights['arch'] = float(form.getvalue('arch'))
weights['theory'] = float(form.getvalue('theory'))
weights['networks'] = float(form.getvalue('networks'))
weights['security'] = float(form.getvalue('security'))
weights['mlmining'] = float(form.getvalue('mlmining'))
weights['ai'] = float(form.getvalue('ai'))
weights['database'] = float(form.getvalue('database'))
weights['metrics'] = float(form.getvalue('metrics'))
weights['web'] = float(form.getvalue('web'))
weights['hci'] = float(form.getvalue('hci'))
weights['graphics'] = float(form.getvalue('graphics'))
weights['nlp'] = float(form.getvalue('nlp'))
weights['vision'] = float(form.getvalue('vision'))

for k in weights.keys():
    weights[k] /= 4.0  # slider max value !!

startyear = int(form.getvalue('startyear'))
endyear = int(form.getvalue('endyear'))

univcounts = {}
authcounts = {}
visited = {}
univagg = {}
univwww = {} # web page for each CS department / college
univmax = {}
authagg = {}

with open('universities.csv', mode='r') as infile:
    reader = csv.reader(infile)
    for rows in reader:
        name = rows[0]
        encoded = name.encode('utf8')
        encoded = encoded.strip()
        www = rows[1]
        univwww[encoded] = www

with open('intauthors-all.csv', mode='r') as infile:
    reader = csv.reader(infile)
    for rows in reader:
        aname = rows[0]
        uname = rows[1]
        area = rows[2]
        count = float(rows[3])
        year = int(rows[4])
        if (year >= startyear and year <= endyear): 
            univagg[uname] = univagg.get(uname, 0) + weights.get(area) * count
            authagg[aname] = authagg.get(aname, 0) + weights.get(area) * count
            univmax[uname] = max(univmax.get(uname, 0), authagg[aname])
        if (year >= startyear and year <= endyear and weights.get(area) >= 0.01):
            authcounts[aname] = authcounts.get(aname,0) + count
            if (authcounts[aname] >= 3 and not visited.has_key(aname)):
                univcounts[uname] = univcounts.get(uname, 0) + 1
                visited[aname] = True
