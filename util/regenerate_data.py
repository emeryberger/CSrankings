import argparse
import contextlib
import gzip
import xmltodict
import json
import csv
import sys
from typing import Any, Dict, List, Tuple, TypedDict
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
from collections import defaultdict, OrderedDict

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
        "name": bytes,
        "year": int,
        "title": bytes,
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

ArticleType = TypedDict(
    "ArticleType",
    {
        "author": List[str],
        "booktitle": str,
        "journal": str,
        "volume": str,
        "number": str,
        "url": str,
        "year": str,
        "pages": str,
        "title": str,
    },
)

totalPapers = 0  # for statistics reporting purposes only
authlogs: Dict[str, List[LogType]] = defaultdict(list)
interestingauthors: Dict[str, int] = defaultdict(int)
authorscores: Dict[Tuple[str, str, int], float] = defaultdict(float)
authorscoresAdjusted: Dict[Tuple[str, str, int], float] = defaultdict(float)
facultydict: Dict[str, str] = defaultdict(str)
aliasdict: Dict[str, str] = {}
reversealiasdict: Dict[str, str] = {}
counter = 0
successes = 0
failures = 0


def do_it() -> None:
    gz = gzip.GzipFile("dblp.xml.gz")
    xmltodict.parse(gz, item_depth=2, item_callback=handle_article)  # type: ignore


def build_dicts() -> None:
    global facultydict
    global aliasdict
    global reversealiasdict
    # Build a dictionary mapping conferences to areas.
    # e.g., confdict['CVPR'] = 'vision'.
    confdict = {}
    venues = []
    for k, v in areadict.items():
        for item in v:
            confdict[item] = k
            venues.append(item)

    facultydict = defaultdict(str)
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
    totalFaculty = sum(name not in aliasdict for name in facultydict)
    print(f"Total faculty members currently in the database: {str(totalFaculty)}")


def handle_article(_: Any, article: ArticleType) -> bool:  # type: ignore
    global counter
    global successes
    global failures
    global totalPapers
    counter += 1
    try:
        if counter % 10000 == 0:
            print(f"{counter} papers processed.")
        if "author" not in article:
            return True
        # Fix if there is just one author.
        authorList: List[str] = []
        if type(article["author"]) == list:
            for authorName in article["author"]:
                if type(authorName) is OrderedDict or type(authorName) is dict:
                    aName = authorName["#text"]  # type: ignore
                else:
                    aName = authorName
                aName = aName.strip()
                authorList.append(aName)
        elif type(article["author"]) == str:
            authorList = [str(article["author"])]
        elif type(article["author"]) is OrderedDict or type(article["author"]) is dict:
            authorList = [article["author"]["#text"]]  # type: ignore
        else:
            print("***Unknown record type, skipping.***")
            return True
        authorsOnPaper = len(authorList)
        foundOneInDict = False or args.all
        if not args.all:
            for authorName in authorList:
                if authorName in facultydict or args.all:
                    foundOneInDict = True
                    break
                with contextlib.suppress(KeyError):
                    if aliasdict[authorName] in facultydict:
                        foundOneInDict = True
                        break
                    if reversealiasdict[authorName] in facultydict:
                        foundOneInDict = True
                        break
            if not foundOneInDict:
                return True
        if "booktitle" in article:
            confname = Conference(article["booktitle"])
        elif "journal" in article:
            confname = Conference(article["journal"])
        else:
            return True

        if args.conference not in confname:
            return True

        volume = article.get("volume", "0")
        number = article.get("number", "0")
        url = article.get("url", "")
        year = int(article.get("year", "-1"))
        pages = ""

        if confname not in confdict:
            return True

        areaname = confdict[confname]

        # Special handling for PACMPL
        if areaname == Area("pacmpl"):
            confname = Conference(article["number"])
            if confname in confdict:
                areaname = confdict[confname]
            else:
                return True
        elif areaname == Area("pacmmod"):
            (confname, year) = map_pacmmod_to_conference(confname, year, number)
            areaname = confdict[confname]
        elif confname == Conference("ACM Trans. Graph."):
            if year in TOG_SIGGRAPH_Volume:
                (vol, num) = TOG_SIGGRAPH_Volume[year]
                if (volume == str(vol)) and (number == str(num)):
                    confname = Conference("SIGGRAPH")
                    areaname = confdict[confname]
            if year in TOG_SIGGRAPH_Asia_Volume:
                (vol, num) = TOG_SIGGRAPH_Asia_Volume[year]
                if (volume == str(vol)) and (number == str(num)):
                    confname = Conference("SIGGRAPH Asia")
                    areaname = confdict[confname]
        elif confname == Conference("Comput. Graph. Forum"):
            if year in CGF_EUROGRAPHICS_Volume:
                (vol, num) = CGF_EUROGRAPHICS_Volume[year]
                if (volume == str(vol)) and (number == str(num)):
                    confname = Conference("EUROGRAPHICS")
                    areaname = confdict[confname]
        elif confname == "IEEE Trans. Vis. Comput. Graph.":
            if year in TVCG_Vis_Volume:
                (vol, num) = TVCG_Vis_Volume[year]
                if (volume == str(vol)) and (number == str(num)):
                    areaname = Area("vis")
            if year in TVCG_VR_Volume:
                (vol, num) = TVCG_VR_Volume[year]
                if (volume == str(vol)) and (number == str(num)):
                    confname = Conference("VR")
                    areaname = Area("vr")

        if "title" in article:
            title = Title("")
            if type(article["title"]) is OrderedDict or type(article["title"]) is dict:
                title = Title(article["title"]["#text"])  # type: ignore
            else:
                title = Title(article["title"])

        if "pages" in article:
            pages = article["pages"]
            pageCount = pagecount(pages)
            startPage = startpage(pages)
        else:
            pageCount = -1
            startPage = -1
        successes += 1
    except TypeError:
        raise
    except BaseException:
        print(sys.exc_info()[0])
        failures += 1
        raise

    if countPaper(
        confname, year, volume, number, pages, startPage, pageCount, url, title
    ):
        totalPapers += 1
        for authorName in authorList:
            aName = ""
            if type(authorName) is OrderedDict or type(authorName) is dict:
                aName = authorName["#text"]  # type: ignore
            elif type(authorName) is str:
                aName = authorName
            realName = aliasdict.get(aName, aName)
            affiliation = ""
            if realName in facultydict:
                affiliation = facultydict[realName]
            elif realName in aliasdict:
                affiliation = facultydict[aliasdict[realName]]
            elif realName in reversealiasdict:
                affiliation = facultydict[reversealiasdict[realName]]
            facultydict[realName] = affiliation

            if (
                affiliation
                and (
                    realName in facultydict
                    or realName in aliasdict
                    or realName in reversealiasdict
                )
            ) or args.all:
                log: LogType = {
                    "name": realName.encode("utf-8"),
                    "year": year,
                    "title": title.encode("utf-8"),
                    "conf": confname,
                    "area": areaname,
                    "institution": affiliation,
                    "numauthors": authorsOnPaper,
                    "volume": volume,
                    "number": number,
                    "startPage": startPage,
                    "pageCount": pageCount,
                }
                tmplist: List[LogType] = authlogs.get(realName, [])
                tmplist.append(log)
                authlogs[realName] = tmplist
                interestingauthors[realName] += 1
                authorscores[(realName, areaname, year)] += 1.0
                authorscoresAdjusted[(realName, areaname, year)] += 1.0 / authorsOnPaper
    return True


def dump_it() -> None:
    global authorscores
    global authorscoresAdjusted
    global authlogs
    global interestingauthors
    global facultydict
    with open("generated-author-info.csv", "w") as f:
        f.write('"name","dept","area","count","adjustedcount","year"\n')
        authorscores = OrderedDict(sorted(authorscores.items()))
        for ((authorName, area, year), count) in authorscores.items():
            countAdjusted = authorscoresAdjusted[(authorName, area, year)]
            f.write(
                f"{authorName},{facultydict[authorName]},{area},{count},{countAdjusted:1.5},{year}\n"
            )

    with open("articles.json", "w") as f:
        z = []
        authlogs = OrderedDict(sorted(authlogs.items()))
        for v, l in authlogs.items():
            if v in interestingauthors:
                for s in sorted(l, key=lambda x: x["name"].decode("utf-8") + str(x["year"]) + x["conf"] + x["title"].decode("utf-8")):  # type: ignore
                    s["name"] = s["name"].decode("utf-8")  # type: ignore
                    s["title"] = s["title"].decode("utf-8")  # type: ignore
                    z.append(s)
        json.dump(z, f, indent=2)


def main() -> None:
    build_dicts()
    do_it()
    dump_it()
    print(f"Total papers counted = {str(totalPapers)}")


if __name__ == "__main__":
    main()
