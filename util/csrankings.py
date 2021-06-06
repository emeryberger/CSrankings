"""Subroutines used for computing rankings for CSrankings.
"""
from lxml import etree as ElementTree

# import xml.etree.ElementTree as ElementTree
import csv
import operator
import re
import gzip
import xmltodict
import collections
import json
import csv
import re
import sys

from typing import Dict, List, NewType

Title = NewType("Title", str)
Author = NewType("Author", str)
Area = NewType("Area", str)
Conference = NewType("Conference", str)

# from builtins import str

# Papers must be at least 6 pages long to count.
pageCountThreshold = 6
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile("([0-9]+)-([0-9]+)")  #  flags=re.ASCII)
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile("[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)")
# Special regexp for extracting pseudo-volumes (paper number) from TECS.
TECSCounterColon = re.compile("([0-9]+):[1-9][0-9]*-([0-9]+):[1-9][0-9]*")
# Extract the ISMB proceedings page numbers.
ISMBpageCounter = re.compile("i(\d+)-i(\d+)")


def startpage(pageStr: str) -> int:
    """Compute the starting page number from a string representing page numbers."""
    if pageStr is None:
        return 0
    pageCounterMatcher1 = pageCounterNormal.match(pageStr)
    pageCounterMatcher2 = pageCounterColon.match(pageStr)
    start = 0

    if not pageCounterMatcher1 is None:
        start = int(pageCounterMatcher1.group(1))
    else:
        if not pageCounterMatcher2 is None:
            start = int(pageCounterMatcher2.group(1))
    return start


def pagecount(pageStr: str) -> int:
    """Compute the number of pages in a string representing a range of page numbers."""
    if pageStr is None:
        return 0
    pageCounterMatcher1 = pageCounterNormal.match(pageStr)
    pageCounterMatcher2 = pageCounterColon.match(pageStr)
    start = 0
    end = 0
    count = 0

    if not pageCounterMatcher1 is None:
        start = int(pageCounterMatcher1.group(1))
        end = int(pageCounterMatcher1.group(2))
        count = end - start + 1
    else:
        if not pageCounterMatcher2 is None:
            start = int(pageCounterMatcher2.group(1))
            end = int(pageCounterMatcher2.group(2))
            count = end - start + 1
    return count


areadict : Dict[Area, List[Conference]] = {
    #
    # Max three most selective venues per area for now.
    #
    # SIGPLAN
    #    'plan' : ['POPL', 'PLDI', 'PACMPL'],  # PACMPL, issue POPL
    Area("popl"): [Conference("POPL")],
    Area("pldi"): [Conference("PLDI")],
    # "Next tier" - see csrankings.ts
    Area("oopsla"): [
        Conference("OOPSLA"),
        Conference("OOPSLA/ECOOP"),
    ],  # Next tier; note in 1990 the conference was merged with ECOOP
    Area("icfp"): [Conference("ICFP")],  # Next tier
    Area("pacmpl"): [
        Conference("PACMPL"),
        Conference("Proc. ACM Program. Lang."),
    ],  # Special PACMPL handling below
    # SIGSOFT
    Area("icse"): [Conference("ICSE"), Conference("ICSE (1)")],
    Area("fse"): [Conference("SIGSOFT FSE"), Conference("ESEC/SIGSOFT FSE")],
    Area("ase"): [Conference("ASE")],  # Next tier
    Area("issta"): [Conference("ISSTA")],  # Next tier
    # SIGOPS
    Area("sosp"): [Conference("SOSP")],
    Area("osdi"): [Conference("OSDI")],
    Area("eurosys"): [Conference("EuroSys")],  # next tier
    Area("fast"): [Conference("FAST")],  # next tier
    Area("usenixatc"): [
        Conference("USENIX Annual Technical Conference"),
        Conference("USENIX Annual Technical Conference, General Track"),
    ],  # next tier
    # SIGMETRICS
    # - Two variants for each, as in DBLP.
    Area("imc"): [Conference("IMC"), Conference("Internet Measurement Conference")],
    Area("sigmetrics"): [
        Conference("SIGMETRICS"),
        Conference("SIGMETRICS/Performance"),
        Conference("POMACS"),
        Conference("Proc. ACM Meas. Anal. Comput. Syst."),
    ],
    # SIGMOBILE
    Area("mobisys"): [Conference("MobiSys")],
    Area("mobicom"): [Conference("MobiCom"), Conference("MOBICOM")],
    Area("sensys"): [Conference("SenSys")],
    # SIGHPC
    # 'hpc': ['SC', 'HPDC', 'ICS'],
    Area("sc"): [Conference("SC")],
    Area("hpdc"): [Conference("HPDC")],
    Area("ics"): [Conference("ICS")],
    # SIGBED
    Area("emsoft"): [
        Conference("EMSOFT"),
        Conference("ACM Trans. Embedded Comput. Syst."),
        Conference("ACM Trans. Embed. Comput. Syst."),
        Conference("IEEE Trans. Comput. Aided Des. Integr. Circuits Syst.")
    ],  # TECS: issue number & page numbers must be checked
    Area("rtss"): [Conference("RTSS")],
    Area("rtas"): [
        Conference("RTAS"),
        Conference("IEEE Real-Time and Embedded Technology and Applications Symposium"),
    ],
    # SIGDA
    Area("iccad"): [Conference("ICCAD")],
    Area("dac"): [Conference("DAC")],
    # SIGMOD
    Area("vldb"): [Conference("VLDB"), Conference("PVLDB"), Conference("Proc. VLDB Endow.")],
    Area("sigmod"): [Conference("SIGMOD Conference")],
    Area("icde"): [Conference("ICDE")],  # next tier
    Area("pods"): [Conference("PODS")],  # next tier
    # SIGSAC
    Area("ccs"): [Conference("CCS"), Conference("ACM Conference on Computer and Communications Security")],
    Area("oakland"): [Conference("IEEE Symposium on Security and Privacy")],
    Area("usenixsec"): [Conference("USENIX Security Symposium"), Conference("USENIX Security")],
    Area("ndss"): [Conference("NDSS")],
    Area("pets"): [
        Conference("PoPETs"),
        Conference("Privacy Enhancing Technologies"),
        Conference("Proc. Priv. Enhancing Technol."),
    ],
    # SIGCOMM
    Area("sigcomm"): [Conference("SIGCOMM")],
    Area("nsdi"): [Conference("NSDI")],
    # SIGARCH
    Area("asplos"): [Conference("ASPLOS")],
    Area("isca"): [Conference("ISCA")],
    Area("micro"): [Conference("MICRO")],
    Area("hpca"): [Conference("HPCA")],  # next tier
    # SIGLOG
    # 'log': ['CAV', 'CAV (1)', 'CAV (2)', 'LICS', 'CSL-LICS'],
    Area("cav"): [Conference("CAV"), Conference("CAV (1)"), Conference("CAV (2)")],
    Area("lics"): [Conference("LICS"), Conference("CSL-LICS")],
    # SIGACT
    # 'act': ['STOC', 'FOCS', 'SODA'],
    Area("focs"): [Conference("FOCS")],
    Area("stoc"): [Conference("STOC")],
    Area("soda"): [Conference("SODA")],
    # 'mlmining': ['NIPS', 'ICML', 'ICML (1)', 'ICML (2)', 'ICML (3)', 'KDD'],
    Area("nips"): [Conference("NIPS"), Conference("NeurIPS")],
    Area("icml"): [Conference("ICML"), Conference("ICML (1)"), Conference("ICML (2)"), Conference("ICML (3)")],
    Area("kdd"): [Conference("KDD")],
    # 'ai': ['AAAI', 'AAAI/IAAI', 'IJCAI'],
    Area("aaai"): [Conference("AAAI"), Conference("AAAI/IAAI")],
    Area("ijcai"): [Conference("IJCAI")],
    # AAAI listed to account for AAAI/IAAI joint conference
    # SIGGRAPH
    # - special handling of TOG to select SIGGRAPH and SIGGRAPH Asia
    Area("siggraph"): [Conference("ACM Trans. Graph."), Conference("SIGGRAPH")],
    #    'siggraph' : ['SIGGRAPH'],
    Area("siggraph-asia"): [Conference("ACM Trans. Graph."), Conference("SIGGRAPH Asia")],
    # SIGIR
    # 'ir': ['WWW', 'SIGIR'],
    Area("sigir"): [Conference("SIGIR")],
    Area("www"): [Conference("WWW")],
    # SIGCHI
    # 'chi': ['CHI', 'UbiComp', 'Ubicomp', 'UIST', 'IMWUT', 'Pervasive'],
    Area("chiconf"): [Conference("CHI")],
    Area("ubicomp"): [
        Conference("UbiComp"),
        Conference("Ubicomp"),
        Conference("IMWUT"),
        Conference("Pervasive"),
        Conference("Proc. ACM Interact. Mob. Wearable Ubiquitous Technol."),
    ],
    Area("uist"): [Conference("UIST")],
    #    'nlp': ['EMNLP', 'ACL', 'ACL (1)', 'ACL (2)', 'NAACL', 'HLT-NAACL', 'NAACL-HLT',
    #            'ACL/IJCNLP',  # -- in 2009 was joint
    #            'COLING-ACL',  # -- in 1998 was joint
    #            'EMNLP-CoNLL',  # -- in 2012 was joint
    #            'HLT/EMNLP',  # -- in 2005 was joint
    #            ],
    Area("emnlp"): [
        Conference("EMNLP"),
        Conference("EMNLP (1)"),
        Conference("EMNLP-CoNLL"),
        Conference("HLT/EMNLP"),
        Conference("EMNLP-IJCNLP"),
        Conference("EMNLP/IJCNLP (1)"),
    ],
    Area("acl"): [Conference("ACL"), Conference("ACL (1)"), Conference("ACL (2)"), Conference("ACL/IJCNLP"), Conference("COLING-ACL")],
    Area("naacl"): [Conference("NAACL"), Conference("HLT-NAACL"), Conference("NAACL-HLT"), Conference("NAACL-HLT (1)")],
    #    'vision': ['CVPR', 'CVPR (1)', 'CVPR (2)', 'ICCV', 'ECCV', 'ECCV (1)', 'ECCV (2)', 'ECCV (3)', 'ECCV (4)', 'ECCV (5)', 'ECCV (6)', 'ECCV (7)'],
    Area("cvpr"): [Conference("CVPR"), Conference("CVPR (1)"), Conference("CVPR (2)")],
    Area("iccv"): [Conference("ICCV")],
    Area("eccv"): [
        Conference("ECCV"),
        Conference("ECCV (1)"),
        Conference("ECCV (2)"),
        Conference("ECCV (3)"),
        Conference("ECCV (4)"),
        Conference("ECCV (5)"),
        Conference("ECCV (6)"),
        Conference("ECCV (7)"),
        Conference("ECCV (8)"),
        Conference("ECCV (9)"),
        Conference("ECCV (10)"),
        Conference("ECCV (11)"),
        Conference("ECCV (12)"),
        Conference("ECCV (13)"),
        Conference("ECCV (14)"),
        Conference("ECCV (15)"),
        Conference("ECCV (16)"),
    ],
    # 'robotics': ['ICRA', 'ICRA (1)', 'ICRA (2)', 'IROS', 'Robotics: Science and Systems'],
    Area("icra"): [Conference("ICRA"), Conference("ICRA (1)"), Conference("ICRA (2)")],
    Area("iros"): [Conference("IROS")],
    Area("rss"): [Conference("Robotics: Science and Systems")],
    # 'crypt': ['CRYPTO', 'CRYPTO (1)', 'CRYPTO (2)', 'CRYPTO (3)', 'EUROCRYPT', 'EUROCRYPT (1)', 'EUROCRYPT (2)', 'EUROCRYPT (3)'],
    Area("crypto"): [Conference("CRYPTO"), Conference("CRYPTO (1)"), Conference("CRYPTO (2)"), Conference("CRYPTO (3)")],
    Area("eurocrypt"): [
        Conference("EUROCRYPT"),
        Conference("EUROCRYPT (1)"),
        Conference("EUROCRYPT (2)"),
        Conference("EUROCRYPT (3)"),
    ],
    # SIGBio
    # - special handling for ISMB proceedings in Bioinformatics special issues.
    # 'bio': ['RECOMB', 'ISMB', 'Bioinformatics', 'ISMB/ECCB (Supplement of Bioinformatics)', 'Bioinformatics [ISMB/ECCB]', 'ISMB (Supplement of Bioinformatics)'],
    Area("ismb"): [
        Conference("ISMB"),
        Conference("Bioinformatics"),
        Conference("Bioinform."),
        Conference("ISMB/ECCB (Supplement of Bioinformatics)"),
        Conference("Bioinformatics [ISMB/ECCB]"),
        Conference("ISMB (Supplement of Bioinformatics)"),
    ],
    Area("recomb"): [Conference("RECOMB")],
    # special handling of IEEE TVCG to select IEEE Vis and VR proceedings
    Area("vis"): [Conference("IEEE Visualization"), Conference("IEEE Trans. Vis. Comput. Graph.")],
    Area("vr"): [Conference("VR")],
    # 'ecom' : ['EC', 'WINE']
    Area("ec"): [Conference("EC")],
    Area("wine"): [Conference("WINE")]
    # ,'cse' : ['SIGCSE']
}

# EMSOFT is now published as a special issue of TECS *or* IEEE TCAD in a particular page range.
EMSOFT_TECS = {2017: (16, "5s"), 2019: (18, "5s")}
EMSOFT_TECS_PaperNumbers = {2017: (163, 190), 2019: (84, 110)}

EMSOFT_TCAD = {2020: (39, 11)}
EMSOFT_TCAD_PaperStart = { 2020: { 3215, 3227, 3288, 3323, 3336, 3348, 3385, 3420, 3433, 3467, 3492, 3506, 3555, 3566, 3650, 3662, 3674, 3711, 3762, 3809, 3856, 3868, 3893, 3906, 3931, 3944, 3981, 3993, 4006, 4018, 4090, 4102, 4142, 4166, 4205}}


# DAC in 2019 has article numbers. Some of these have too few pages. (Contributed by Wanli Chang.)
DAC_TooShortPapers = {
    2019: {
        21,
        22,
        43,
        44,
        45,
        76,
        77,
        78,
        79,
        100,
        101,
        121,
        152,
        153,
        154,
        175,
        176,
        197,
        198,
        199,
        222,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
    }
}

# ISMB proceedings are published as special issues of Bioinformatics.
# Here is the list.
ISMB_Bioinformatics = {
    2020: (36, "Supplement-1"),
    2019: (35, 14),
    2018: (34, 13),
    2017: (33, 14),
    2016: (32, 12),
    2015: (31, 12),
    2014: (30, 12),
    2013: (29, 13),
    2012: (28, 12),
    2011: (27, 13),
    2010: (26, 12),
    2009: (25, 12),
    2008: (24, 13),
    2007: (23, 13),
}

# TOG special handling to count only SIGGRAPH proceedings.
# Assuming all will be in the same issues through 2021.
TOG_SIGGRAPH_Volume = {
    2021: (40, 4),
    2020: (39, 4),
    2019: (38, 4),
    2018: (37, 4),
    2017: (36, 4),
    2016: (35, 4),
    2015: (34, 4),
    2014: (33, 4),
    2013: (32, 4),
    2012: (31, 4),
    2011: (30, 4),
    2010: (29, 4),
    2009: (28, 3),
    2008: (27, 3),
    2007: (26, 3),
    2006: (25, 3),
    2005: (24, 3),
    2004: (23, 3),
    2003: (22, 3),
    2002: (21, 3),
}

# TOG special handling to count only SIGGRAPH Asia proceedings.
# Assuming all will be in the same issues through 2021.
TOG_SIGGRAPH_Asia_Volume = {
    2021: (40, 6),
    2020: (39, 6),
    2019: (38, 6),
    2018: (37, 6),
    2017: (36, 6),
    2016: (35, 6),
    2015: (34, 6),
    2014: (33, 6),
    2013: (32, 6),
    2012: (31, 6),
    2011: (30, 6),
    2010: (29, 6),
    2009: (28, 5),
    2008: (27, 5),
}

# TVCG special handling to count only IEEE VIS
TVCG_Vis_Volume = {
    2021: (27, 2),
    2020: (26, 1),
    2019: (25, 1),
    2018: (24, 1),
    2017: (23, 1),
    2016: (22, 1),
    2014: (20, 12),
    2013: (19, 12),
    2012: (18, 12),
    2011: (17, 12),
    2010: (16, 6),
    2009: (15, 6),
    2008: (14, 6),
    2007: (13, 6),
    2006: (12, 5),
}

# TVCG special handling to count only IEEE VR
TVCG_VR_Volume = {
    2021: (27, 5),
    2020: (26, 5),
    2019: (25, 5),
    2018: (24, 4),
    2017: (23, 4),
    2016: (22, 4),
    2015: (21, 4),
    2014: (20, 4),
    2013: (19, 4),
    2012: (18, 4),
}

# ICSE special handling to omit short papers.
# Contributed by Zhendong Su, UC Davis.
# Short papers start at this page number for these proceedings of ICSE (and are thus omitted,
# as the acceptance criteria differ).
ICSE_ShortPaperStart = {
    2013: 851,
    2012: 957,
    2011: 620,
    2010: 544,
    2009: 550,
    2007: 510,
    2006: 411,
    2005: 478,
    2003: 477,
    2002: 534,
    2001: 502,
    2000: 518,
    1999: 582,
    1998: 419,
    1997: 535,
}

# SIGMOD special handling to avoid non-research papers.
# This and other SIGMOD data below contributed by Davide Martinenghi,
# Politecnico di Milano.
SIGMOD_NonResearchPaperStart = {
    2017: 1587,
    2016: 2069,
    2013: 917,
    2012: 577,
    2011: 1045,
    2010: 963,
    2009: 841,
    2008: 1043,
    2007: 873,
    2006: 695,
    2005: 778,
    2004: 839,
    2003: 635,
    2002: 500,
    2001: 521,
    2000: 499,
    1999: 503,
    1998: 496,
    1997: 498,
    1996: 541,
    1995: 423,
    1994: 466,
    1993: 388,
}

# SIGMOD recently has begun intermingling research and non-research
# track papers in their proceedings, requiring individual paper
# filtering.
SIGMOD_NonResearchPapersRange = {
    2018: [(177, 230), (583, 627), (789, 839), (1393, 1459), (1637, 1845)],
    2017: [
        (1, 3),
        (51, 63),
        (125, 138),
        (331, 343),
        (1041, 1052),
        (511, 526),
        (1587, 1782),
    ],
    2016: [
        (1753, 1764),
        (1295, 1306),
        (795, 806),
        (227, 238),
        (999, 1010),
        (1923, 1934),
        (1307, 1318),
        (1951, 1960),
        (759, 771),
        (253, 265),
        (1405, 1416),
        (215, 226),
        (1105, 1117),
        (35, 46),
        (63, 75),
        (807, 819),
        (1099, 1104),
        (1087, 1098),
        (847, 859),
        (239, 251),
        (1393, 1404),
        (2069, 2243),
    ],
    2015: [
        (227, 276),
        (607, 658),
        (1343, 1394),
        (1657, 1706),
        (1917, 1940),
        (859, 918),
        (1063, 1122),
        (1403, 1462),
    ],
    2014: [(147, 188), (337, 384), (529, 573), (1223, 1258)],
}


# ASE accepts short papers and long papers. Long papers appear to be at least 10 pages long,
# while short papers are shorter.
ASE_LongPaperThreshold = 10

# Build a dictionary mapping conferences to areas.
# e.g., confdict['CVPR'] = 'vision'.
confdict = {}
venues = []
for k, v in areadict.items():
    for item in v:
        confdict[item] = k
        venues.append(item)

# The list of all areas.
arealist = areadict.keys()

# Consider pubs in this range only.
startyear = 1970
endyear = 2269


def countPaper(
    confname: Conference,
    year: int,
    volume: str,
    number: str,
    pages: str,
    startPage: int,
    pageCount: int,
    url: str,
    title: Title,
) -> bool:
    """Returns true iff this paper will be included in the rankings."""
    if year < startyear or year > endyear:
        return False

    # Special handling for EMSOFT (TECS).
    if (
            confname == "ACM Trans. Embedded Comput. Syst."
            or confname == "ACM Trans. Embed. Comput. Syst."
    ):
        if not year in EMSOFT_TECS:
            return False
        pvmatcher = TECSCounterColon.match(pages)
        if pvmatcher:
            pseudovolume = int(pvmatcher.group(1))
            (startpv, endpv) = EMSOFT_TECS_PaperNumbers[year]
            if pseudovolume < int(startpv) or pseudovolume > int(endpv):
                return False
            if number != EMSOFT_TECS[year][1]:
                return False

    # Special handling for EMSOFT (TCAD)
    if (confname == "IEEE Trans. Comput. Aided Des. Integr. Circuits Syst."):
        if not year in EMSOFT_TCAD:
            return False
        if not(int(volume) == EMSOFT_TCAD[year][0] and int(number) == EMSOFT_TCAD[year][1] and int(startPage) in EMSOFT_TCAD_PaperStart[year]):
            return False

    # Special handling for ISMB.
    if confname == "Bioinformatics" or confname == "Bioinform.":
        if year in ISMB_Bioinformatics:
            (vol, num) = ISMB_Bioinformatics[year]
            if (volume != str(vol)) or (number != str(num)):
                return False
            else:
                if int(volume) >= 33:  # Hopefully this works going forward.
                    pg = ISMBpageCounter.match(pages)
                    if pg is None:
                        return False
                    startPage = int(pg.group(1))
                    end = int(pg.group(2))
                    pageCount = end - startPage + 1
        else:
            return False

    # Special handling for ICSE.
    elif (
        confname == "ICSE" or confname == "ICSE (1)" or confname == "ICSE (2)"
    ):
        if year in ICSE_ShortPaperStart:
            pageno = ICSE_ShortPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are "short papers" (regardless of their length).
                return False

    # Special handling for SIGMOD.
    elif confname == "SIGMOD Conference":
        if year in SIGMOD_NonResearchPaperStart:
            pageno = SIGMOD_NonResearchPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are not research-track papers.
                return False
        if year in SIGMOD_NonResearchPapersRange:
            pageRange = SIGMOD_NonResearchPapersRange[year]
            for p in pageRange:
                if startPage >= p[0] and startPage + pageCount - 1 <= p[1]:
                    return False

    # Special handling for SIGGRAPH and SIGGRAPH Asia.
    elif confname == "ACM Trans. Graph.":
        return False  # should already have been handled by regenerate_data.py.

    # Special handling for IEEE Vis and VR
    elif confname == "IEEE Trans. Vis. Comput. Graph.":
        Vis_Conf = False
        if year in TVCG_Vis_Volume:
            (vol, num) = TVCG_Vis_Volume[year]
            if (volume == str(vol)) and (number == str(num)):
                Vis_Conf = True
        if year in TVCG_VR_Volume:
            (vol, num) = TVCG_VR_Volume[year]
            if (volume == str(vol)) and (number == str(num)):
                Vis_Conf = True
        if not Vis_Conf:
            return False

    # Special handling for ASE.
    elif confname == "ASE":
        if pageCount < ASE_LongPaperThreshold:
            # Omit short papers (which may be demos, etc.).
            return False

    # Disambiguate Innovations in (Theoretical) Computer Science from
    # International Conference on Supercomputing
    elif confname == "ICS":
        if not url is None:
            if url.find("innovations") != -1:
                return False

    # Special handling for DAC.
    elif confname == "DAC":
        if year in DAC_TooShortPapers:
            try:
                if int(pages) in DAC_TooShortPapers[year]:
                    return False
            except Exception as e:
                pass

    # SPECIAL CASE FOR conferences that have incorrect entries (as of 6/22/2016).
    # Only skip papers with a very small paper count,
    # but above 1. Why?
    # DBLP has real papers with incorrect page counts
    # - usually a truncated single page. -1 means no
    # pages found at all => some problem with journal
    # entries in DBLP.
    tooFewPages = False

    if (
        pageCount == -1
        and confname
        == "ACM Conference on Computer and Communications Security"
    ):
        tooFewPages = True

    if (pageCount != -1) and (pageCount < pageCountThreshold):

        tooFewPages = True
        exceptionConference = False
        exceptionConference |= confname == "SC" and (
            year <= 2012 or year == 2020
        )
        exceptionConference |= confname == "SIGSOFT FSE" and year == 2012
        exceptionConference |= (
            confname == "ACM Trans. Graph."
            and int(volume) >= 26
            and int(volume) <= 39
        )
        exceptionConference |= (
            confname == "SIGGRAPH" and int(volume) >= 26 and int(volume) <= 39
        )
        exceptionConference |= confname == "SIGGRAPH Asia"
        exceptionConference |= (
            confname == "CHI" and year == 2018
        )  # FIXME - hopefully DBLP will fix
        exceptionConference |= confname == "ICCAD" and (
            year == 2016 or year == 2018
        )
        exceptionConference |= confname == "CHI" and year == 2019
        exceptionConference |= confname == "FAST" and year == 2012
        exceptionConference |= confname == "DAC" and year == 2019
        exceptionConference |= confname == "ISCA" and (
            (pageCount < 0) or pageCount >= 3
        )  # to handle very old ISCA conferences; all papers are full papers in ISCA now

        if exceptionConference:
            tooFewPages = False

    if tooFewPages:
        return False

    return True
