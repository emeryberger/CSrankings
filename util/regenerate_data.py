#!/usr/bin/env python3
"""
Regenerate CSRankings author publication data.

This script processes the filtered DBLP XML and generates:
- generated-author-info.csv: Author publication counts by area and year
- articles.json: Detailed article information for the web interface

Optimizations:
- Uses lxml iterparse for streaming XML processing (~3x faster than xmltodict)
- Uses orjson for JSON serialization when available (~10x faster than stdlib json)
"""

import argparse
import gzip
import json
import csv
import sys
from typing import Any, Dict, List, Optional, Tuple, TypedDict
from collections import defaultdict, OrderedDict

try:
    import orjson
    HAS_ORJSON = True
except ImportError:
    HAS_ORJSON = False

try:
    from lxml import etree
except ImportError:
    print("Error: lxml is required. Install with: pip install lxml", file=sys.stderr)
    sys.exit(1)

from csrankings import (
    Area,
    Conference,
    Title,
    countPaper,
    pagecount,
    startpage,
    areadict,
    confdict,
    TOG_SIGGRAPH_Volume,
    TOG_SIGGRAPH_Asia_Volume,
    CGF_EUROGRAPHICS_Volume,
    TVCG_Vis_Volume,
    TVCG_VR_Volume,
    map_pacmmod_to_conference,
)

parser = argparse.ArgumentParser(
    prog="csrankings",
    description="Regenerate CSrankings data.",
    formatter_class=argparse.RawTextHelpFormatter,
    allow_abbrev=False,
)

parser.add_argument(
    "--all",
    dest="all",
    action="store_const",
    const=True,
    default=False,
    help="Generate data for all authors, not just authors in the faculty database (csrankings-[a-z].csv) (default: False)",
)

parser.add_argument(
    "--conference",
    dest="conference",
    type=str,
    default="",
    help="Only use conferences that match this string (default: all conferences)",
)

args, left = parser.parse_known_args()

# Consider pubs in this range only.
startyear = 1970
endyear = 2269

LogType = TypedDict(
    "LogType",
    {
        "name": str,
        "year": int,
        "title": str,
        "conf": str,
        "area": str,
        "institution": str,
        "numauthors": int,
        "volume": str,
        "number": str,
        "startPage": int,
        "pageCount": int,
    },
)

totalPapers = 0
authlogs: Dict[str, List[LogType]] = defaultdict(list)
interestingauthors: Dict[str, int] = defaultdict(int)
authorscores: Dict[Tuple[str, str, int], float] = defaultdict(float)
authorscoresAdjusted: Dict[Tuple[str, str, int], float] = defaultdict(float)
facultydict: Dict[str, str] = {}
aliasdict: Dict[str, str] = {}
reversealiasdict: Dict[str, str] = {}


def build_dicts() -> None:
    """Load faculty and alias dictionaries from CSV files."""
    global facultydict, aliasdict, reversealiasdict

    facultydict = {}
    aliasdict = {}
    reversealiasdict = {}

    with open("faculty-affiliations.csv") as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            facultydict[row["name"]] = row["affiliation"]

    with open("dblp-aliases.csv") as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            aliasdict[row["alias"]] = row["name"]
            reversealiasdict[row["name"]] = row["alias"]

    # Count and report the total number of faculty in the database.
    totalFaculty = sum(1 for name in facultydict if name not in aliasdict)
    print(f"Total faculty members currently in the database: {totalFaculty}")


def get_element_text(elem) -> str:
    """Extract all text content from an element, including nested elements."""
    return ''.join(elem.itertext())


def process_article(elem, conf_filter: str, include_all: bool) -> Optional[Dict]:
    """Process a single article/inproceedings element and return article data if valid."""
    global totalPapers

    # Extract authors
    author_elems = elem.findall('author')
    if not author_elems:
        return None

    authorList = [get_element_text(a).strip() for a in author_elems]
    authorsOnPaper = len(authorList)

    # Check if any author is in faculty dict (unless --all flag)
    if not include_all:
        foundOneInDict = False
        for authorName in authorList:
            if authorName in facultydict:
                foundOneInDict = True
                break
            alias = aliasdict.get(authorName)
            if alias and alias in facultydict:
                foundOneInDict = True
                break
            reverse = reversealiasdict.get(authorName)
            if reverse and reverse in facultydict:
                foundOneInDict = True
                break
        if not foundOneInDict:
            return None

    # Get conference/journal name
    booktitle_elem = elem.find('booktitle')
    journal_elem = elem.find('journal')

    if booktitle_elem is not None:
        confname = Conference(get_element_text(booktitle_elem))
    elif journal_elem is not None:
        confname = Conference(get_element_text(journal_elem))
    else:
        return None

    # Apply conference filter if specified
    if conf_filter and conf_filter not in confname:
        return None

    # Get other fields
    volume_elem = elem.find('volume')
    number_elem = elem.find('number')
    year_elem = elem.find('year')
    pages_elem = elem.find('pages')
    title_elem = elem.find('title')
    url_elem = elem.find('url')

    volume = get_element_text(volume_elem) if volume_elem is not None else "0"
    number = get_element_text(number_elem) if number_elem is not None else "0"
    year = int(get_element_text(year_elem)) if year_elem is not None else -1
    pages = get_element_text(pages_elem) if pages_elem is not None else ""
    title = Title(get_element_text(title_elem)) if title_elem is not None else Title("")
    url = get_element_text(url_elem) if url_elem is not None else ""

    # Check if conference is in our list
    if confname not in confdict:
        return None

    areaname = confdict[confname]

    # Special handling for PACMPL and PACMSE
    if areaname == Area("pacmpl") or areaname == Area("pacmse"):
        confname = Conference(number)
        if confname in confdict:
            areaname = confdict[confname]
        else:
            return None
    elif areaname == Area("pacmmod"):
        (confname, year) = map_pacmmod_to_conference(confname, year, number)
        areaname = confdict[confname]
    elif confname == Conference("ACM Trans. Graph."):
        if year in TOG_SIGGRAPH_Volume:
            (vol, num) = TOG_SIGGRAPH_Volume[year]
            if volume == str(vol) and number == str(num):
                confname = Conference("SIGGRAPH")
                areaname = confdict[confname]
        if year in TOG_SIGGRAPH_Asia_Volume:
            (vol, num) = TOG_SIGGRAPH_Asia_Volume[year]
            if volume == str(vol) and number == str(num):
                confname = Conference("SIGGRAPH Asia")
                areaname = confdict[confname]
    elif confname == Conference("Comput. Graph. Forum"):
        if year in CGF_EUROGRAPHICS_Volume:
            (vol, num) = CGF_EUROGRAPHICS_Volume[year]
            if volume == str(vol) and number == str(num):
                confname = Conference("EUROGRAPHICS")
                areaname = confdict[confname]
    elif confname == "IEEE Trans. Vis. Comput. Graph.":
        if year in TVCG_Vis_Volume:
            (vol, num) = TVCG_Vis_Volume[year]
            if volume == str(vol) and number == str(num):
                areaname = Area("vis")
        if year in TVCG_VR_Volume:
            (vol, num) = TVCG_VR_Volume[year]
            if volume == str(vol) and number == str(num):
                confname = Conference("VR")
                areaname = Area("vr")

    # Parse pages
    if pages:
        pageCount = pagecount(pages)
        startPage = startpage(pages)
    else:
        pageCount = -1
        startPage = -1

    # Check if paper should be counted
    if not countPaper(confname, year, volume, number, pages, startPage, pageCount, url, title):
        return None

    totalPapers += 1

    return {
        'authorList': authorList,
        'authorsOnPaper': authorsOnPaper,
        'confname': confname,
        'areaname': areaname,
        'year': year,
        'title': title,
        'volume': volume,
        'number': number,
        'startPage': startPage,
        'pageCount': pageCount,
    }


def process_authors(article_data: Dict, include_all: bool) -> None:
    """Process authors for a valid article and update global data structures."""
    authorList = article_data['authorList']
    authorsOnPaper = article_data['authorsOnPaper']
    confname = article_data['confname']
    areaname = article_data['areaname']
    year = article_data['year']
    title = article_data['title']
    volume = article_data['volume']
    number = article_data['number']
    startPage = article_data['startPage']
    pageCount = article_data['pageCount']

    for authorName in authorList:
        realName = aliasdict.get(authorName, authorName)

        # Get affiliation
        affiliation = facultydict.get(realName, "")
        if not affiliation:
            alias = aliasdict.get(realName)
            if alias:
                affiliation = facultydict.get(alias, "")
            if not affiliation:
                reverse = reversealiasdict.get(realName)
                if reverse:
                    affiliation = facultydict.get(reverse, "")

        # Update faculty dict
        if realName not in facultydict:
            facultydict[realName] = affiliation

        # Check if we should log this author
        should_log = include_all or (
            affiliation and (
                realName in facultydict or
                realName in aliasdict or
                realName in reversealiasdict
            )
        )

        if should_log:
            log: LogType = {
                "name": realName,
                "year": year,
                "title": str(title),
                "conf": confname,
                "area": areaname,
                "institution": affiliation,
                "numauthors": authorsOnPaper,
                "volume": volume,
                "number": number,
                "startPage": startPage,
                "pageCount": pageCount,
            }
            authlogs[realName].append(log)
            interestingauthors[realName] += 1
            authorscores[(realName, areaname, year)] += 1.0
            authorscoresAdjusted[(realName, areaname, year)] += 1.0 / authorsOnPaper


def do_it() -> None:
    """Process the DBLP XML file using lxml iterparse."""
    print("Processing DBLP XML with lxml iterparse...", file=sys.stderr, flush=True)

    counter = 0
    conf_filter = args.conference
    include_all = args.all

    # Use iterparse for memory-efficient streaming
    with gzip.open("dblp.xml.gz", 'rb') as gz:
        context = etree.iterparse(
            gz,
            events=('end',),
            tag=('inproceedings', 'article'),
            load_dtd=True,
            resolve_entities=True,
            huge_tree=True,
        )

        for event, elem in context:
            counter += 1
            if counter % 10000 == 0:
                print(f"{counter} papers processed.", file=sys.stderr)

            article_data = process_article(elem, conf_filter, include_all)
            if article_data:
                process_authors(article_data, include_all)

            # Clear element to free memory
            elem.clear()
            while elem.getprevious() is not None:
                del elem.getparent()[0]

    print(f"{counter} papers processed (total).", file=sys.stderr)


def dump_it() -> None:
    """Write output files."""
    print("Writing generated-author-info.csv...", file=sys.stderr)

    with open("generated-author-info.csv", "w") as f:
        f.write('"name","dept","area","count","adjustedcount","year"\n')
        for (authorName, area, year), count in sorted(authorscores.items()):
            countAdjusted = authorscoresAdjusted[(authorName, area, year)]
            dept = facultydict.get(authorName, "")
            f.write(f"{authorName},{dept},{area},{count},{countAdjusted:1.5},{year}\n")

    print("Writing articles.json...", file=sys.stderr)

    z = []
    for author in sorted(authlogs.keys()):
        if author in interestingauthors:
            logs = authlogs[author]
            for s in sorted(logs, key=lambda x: (x["name"], x["year"], x["conf"], x["title"])):
                z.append(s)

    if HAS_ORJSON:
        with open("articles.json", "wb") as f:
            f.write(orjson.dumps(z, option=orjson.OPT_INDENT_2))
    else:
        with open("articles.json", "w") as f:
            json.dump(z, f, indent=2)


def main() -> None:
    build_dicts()
    do_it()
    dump_it()
    print(f"Total papers counted = {totalPapers}")


if __name__ == "__main__":
    main()
