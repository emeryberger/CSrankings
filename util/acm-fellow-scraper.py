#
# Scrape ACM's fellow page for award winners.
# by Emery Berger, 2018
#
from nameparser import HumanName
import csv
import urllib.request
from bs4 import BeautifulSoup
quote_page = 'https://awards.acm.org/fellows/award-winners'
with urllib.request.urlopen(quote_page) as url:
    page = url.read()
soup = BeautifulSoup(page, 'html.parser')
row_box = soup.find_all('tr', attrs={'role': 'row'})
names = {}
for i in row_box:
    if i.td is not None:
        name = i.td.find('a').text
        year = i.find('td', attrs={'role': 'rowheader'})
        if year is not None:
            year = year.text
        else:
            year = "0"
        # Process the name, adding dots to middle names if needed.
        name = HumanName(name)
        if len(name.first) == 1:
            name.first = name.first + "."
        if name.middle is not "":
            if len(name.middle) == 1:
                name.middle += '.'
            names[name.first + ' ' + name.middle + ' ' + name.last] = year
        else:
            names[name.first + ' ' + name.last] = year

# Write out a csv.
with open('acm-fellows.csv', 'w', newline='') as csvfile:
    fieldnames = ['name','year']
    wr = csv.DictWriter(csvfile, fieldnames = fieldnames)
    wr.writeheader()
    for n in names:
        wr.writerow({'name' : n, 'year' : names[n]})
