from typing import Dict

"""Subroutines used for computing rankings for CSrankings.
"""
import contextlib
import re
import csv
from typing import Dict, List, NewType

Title = NewType("Title", str)
Author = NewType("Author", str)
Area = NewType("Area", str)
Conference = NewType("Conference", str)
# from builtins import str
# Papers must be at least 6 pages long to count.
pageCountThreshold = 6
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile("([0-9]+)-([0-9]+)")
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile("[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)")
# Special regexp for extracting pseudo-volumes (paper number) from TECS.
TECSCounterColon = re.compile("([0-9]+):[1-9][0-9]*-([0-9]+):[1-9][0-9]*")
# Extract the ISMB proceedings page numbers.
ISMBpageCounter = re.compile("i(\\d+)-i(\\d+)")
# Read in SIGCSE research articles
SIGCSE = set()
with open("sigcse-research-articles.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        SIGCSE.add((int(row["year"]), int(row["start"]), int(row["end"])))


def startpage(pageStr: str) -> int:
    """Compute the starting page number from a string representing page numbers."""
    if pageStr is None:
        return 0
    pageCounterMatcher1 = pageCounterNormal.match(pageStr)
    pageCounterMatcher2 = pageCounterColon.match(pageStr)
    start = 0
    if pageCounterMatcher1 is not None:
        start = int(pageCounterMatcher1.group(1))
    elif pageCounterMatcher2 is not None:
        start = int(pageCounterMatcher2.group(1))
    return start


def test_startpage() -> int:
    assert startpage("117-128") == 117
    assert startpage("138:1-138:28") == 1
    assert startpage("138:200-138:208") == 200


def pagecount(pageStr: str) -> int:
    """Compute the number of pages in a string representing a range of page numbers."""
    if pageStr is None:
        return 0
    pageCounterMatcher1 = pageCounterNormal.match(pageStr)
    pageCounterMatcher2 = pageCounterColon.match(pageStr)
    start = 0
    end = 0
    count = 0
    if pageCounterMatcher1 is not None:
        count = _extract_pagecount(pageCounterMatcher1)
    elif pageCounterMatcher2 is not None:
        count = _extract_pagecount(pageCounterMatcher2)
    return count


def _extract_pagecount(arg0) -> int:
    """Extracts the number of pages from a range string.

    Args:
        arg0 (Match): A regex match object containing the start and end page numbers.

    Returns:
        The number of pages in the range.

    """
    # Extract start and end page numbers from regex match object.
    start = int(arg0.group(1))
    end = int(arg0.group(2))
    # Calculate number of pages in the range and return.
    # inclusive.
    return end - start + 1


def test_pagecount() -> int:
    assert pagecount("117-128") == 12
    assert pagecount("138:1-138:28") == 28
    assert pagecount("138:200-138:208") == 9


#
# Max three most selective venues per area for now.
#
# SIGPLAN
#    'plan' : ['POPL', 'PLDI', 'PACMPL'],  # PACMPL, issue POPL
# "Next tier" - see csrankings.ts
# Next tier; note in 1990 the conference was merged with ECOOP
# Next tier
# Special PACMPL handling below
# SIGSOFT
# Next tier
# Next tier
# SIGOPS
# next tier
# next tier
# next tier
# SIGMETRICS
# - Two variants for each, as in DBLP.
# SIGMOBILE
# SIGHPC
# 'hpc': ['SC', 'HPDC', 'ICS'],
# SIGBED
# TECS: issue number & page numbers must be checked
# SIGDA
# SIGMOD
# next tier
# next tier
# SIGSAC
# SIGCOMM
# SIGARCH
# next tier
# SIGLOG
# 'log': ['CAV', 'CAV (1)', 'CAV (2)', 'LICS', 'CSL-LICS'],
# SIGACT
# 'act': ['STOC', 'FOCS', 'SODA'],
# 'mlmining': ['NIPS', 'ICML', 'ICML (1)', 'ICML (2)', 'ICML (3)', 'KDD'],
# 'ai': ['AAAI', 'AAAI/IAAI', 'IJCAI'],
# AAAI listed to account for AAAI/IAAI joint conference
# SIGGRAPH
# - special handling of TOG to select SIGGRAPH and SIGGRAPH Asia
#    'siggraph' : ['SIGGRAPH'],
# SIGIR
# 'ir': ['WWW', 'SIGIR'],
# SIGCHI
# 'chi': ['CHI', 'UbiComp', 'Ubicomp', 'UIST', 'IMWUT', 'Pervasive'],
#    'nlp': ['EMNLP', 'ACL', 'ACL (1)', 'ACL (2)', 'NAACL', 'HLT-NAACL', 'NAACL-HLT',
#            'ACL/IJCNLP',  # -- in 2009 was joint
#            'COLING-ACL',  # -- in 1998 was joint
#            'EMNLP-CoNLL',  # -- in 2012 was joint
#            'HLT/EMNLP',  # -- in 2005 was joint
#            ],
#    'vision': ['CVPR', 'CVPR (1)', 'CVPR (2)', 'ICCV', 'ECCV', 'ECCV (1)', 'ECCV (2)', 'ECCV (3)', 'ECCV (4)', 'ECCV (5)', 'ECCV (6)', 'ECCV (7)'],
# 'robotics'
# 'crypt'
# SIGBio
# - special handling for ISMB proceedings in Bioinformatics special issues.
# 'bio': ['RECOMB', 'ISMB', 'Bioinformatics', 'ISMB/ECCB (Supplement of Bioinformatics)', 'Bioinformatics [ISMB/ECCB]', 'ISMB (Supplement of Bioinformatics)'],
# special handling of IEEE TVCG to select IEEE Vis and VR proceedings
# 'ecom' : ['EC', 'WINE']
areadict: Dict[Area, List[Conference]] = {
    Area("popl"): [Conference("POPL")],
    Area("pldi"): [Conference("PLDI")],
    Area("oopsla"): [
        Conference("OOPSLA"),
        Conference("OOPSLA/ECOOP"),
        Conference("OOPSLA1"),
        Conference("OOPSLA2"),
    ],
    Area("icfp"): [Conference("ICFP")],
    Area("pacmpl"): [Conference("PACMPL"), Conference("Proc. ACM Program. Lang.")],
    Area("icse"): [Conference("ICSE"), Conference("ICSE (1)")],
    Area("fse"): [Conference("SIGSOFT FSE"), Conference("ESEC/SIGSOFT FSE")],
    Area("ase"): [Conference("ASE")],
    Area("issta"): [Conference("ISSTA")],
    Area("sosp"): [Conference("SOSP")],
    Area("osdi"): [Conference("OSDI")],
    Area("eurosys"): [Conference("EuroSys")],
    Area("fast"): [Conference("FAST")],
    Area("usenixatc"): [
        Conference("USENIX Annual Technical Conference"),
        Conference("USENIX Annual Technical Conference, General Track"),
    ],
    Area("imc"): [Conference("IMC"), Conference("Internet Measurement Conference")],
    Area("sigmetrics"): [
        Conference("SIGMETRICS"),
        Conference("SIGMETRICS/Performance"),
        Conference("POMACS"),
        Conference("Proc. ACM Meas. Anal. Comput. Syst."),
    ],
    Area("mobisys"): [Conference("MobiSys")],
    Area("mobicom"): [Conference("MobiCom"), Conference("MOBICOM")],
    Area("sensys"): [Conference("SenSys")],
    Area("sc"): [Conference("SC")],
    Area("hpdc"): [Conference("HPDC")],
    Area("ics"): [Conference("ICS")],
    Area("emsoft"): [
        Conference("EMSOFT"),
        Conference("ACM Trans. Embedded Comput. Syst."),
        Conference("ACM Trans. Embed. Comput. Syst."),
        Conference("IEEE Trans. Comput. Aided Des. Integr. Circuits Syst."),
    ],
    Area("rtss"): [Conference("RTSS"), Conference("rtss")],
    Area("rtas"): [
        Conference("RTAS"),
        Conference("IEEE Real-Time and Embedded Technology and Applications Symposium"),
    ],
    Area("iccad"): [Conference("ICCAD")],
    Area("dac"): [Conference("DAC")],
    Area("vldb"): [
        Conference("VLDB"),
        Conference("PVLDB"),
        Conference("Proc. VLDB Endow."),
    ],
    Area("sigmod"): [
        Conference("SIGMOD Conference"),
        Conference("Proc. ACM Manag. Data"),
    ],
    Area("icde"): [Conference("ICDE")],
    Area("pods"): [Conference("PODS")],
    Area("ccs"): [
        Conference("CCS"),
        Conference("ACM Conference on Computer and Communications Security"),
    ],
    Area("oakland"): [
        Conference("IEEE Symposium on Security and Privacy"),
        Conference("SP"),
        Conference("S&P"),
    ],
    Area("usenixsec"): [
        Conference("USENIX Security Symposium"),
        Conference("USENIX Security"),
    ],
    Area("ndss"): [Conference("NDSS")],
    Area("pets"): [
        Conference("PoPETs"),
        Conference("Privacy Enhancing Technologies"),
        Conference("Proc. Priv. Enhancing Technol."),
    ],
    Area("sigcomm"): [Conference("SIGCOMM")],
    Area("nsdi"): [Conference("NSDI")],
    Area("asplos"): [
        Conference("ASPLOS"),
        Conference("ASPLOS (1)"),
        Conference("ASPLOS (2)"),
        Conference("ASPLOS (3)"),
        Conference("ASPLOS (4)"),
    ],
    Area("isca"): [Conference("ISCA")],
    Area("micro"): [Conference("MICRO")],
    Area("hpca"): [Conference("HPCA")],
    Area("cav"): [
        Conference("CAV"),
        Conference("CAV (1)"),
        Conference("CAV (2)"),
        Conference("CAV (3)"),
    ],
    Area("lics"): [Conference("LICS"), Conference("CSL-LICS")],
    Area("focs"): [Conference("FOCS")],
    Area("stoc"): [Conference("STOC")],
    Area("soda"): [Conference("SODA")],
    Area("nips"): [Conference("NIPS"), Conference("NeurIPS")],
    Area("icml"): [
        Conference("ICML"),
        Conference("ICML (1)"),
        Conference("ICML (2)"),
        Conference("ICML (3)"),
    ],
    Area("iclr"): [Conference("ICLR"), Conference("ICLR (Poster)")],
    Area("kdd"): [Conference("KDD")],
    Area("aaai"): [Conference("AAAI"), Conference("AAAI/IAAI")],
    Area("ijcai"): [Conference("IJCAI")],
    Area("siggraph"): [Conference("ACM Trans. Graph."), Conference("SIGGRAPH")],
    Area("siggraph-asia"): [
        Conference("ACM Trans. Graph."),
        Conference("SIGGRAPH Asia"),
    ],
    Area("eurographics"): [
        Conference("Comput. Graph. Forum"),
        Conference("EUROGRAPHICS"),
    ],
    Area("sigir"): [Conference("SIGIR")],
    Area("www"): [Conference("WWW")],
    Area("chiconf"): [Conference("CHI")],
    Area("ubicomp"): [
        Conference("UbiComp"),
        Conference("Ubicomp"),
        Conference("IMWUT"),
        Conference("Pervasive"),
        Conference("Proc. ACM Interact. Mob. Wearable Ubiquitous Technol."),
    ],
    Area("uist"): [Conference("UIST")],
    Area("emnlp"): [
        Conference("EMNLP"),
        Conference("EMNLP (1)"),
        Conference("EMNLP-CoNLL"),
        Conference("HLT/EMNLP"),
        Conference("EMNLP-IJCNLP"),
        Conference("EMNLP/IJCNLP (1)"),
    ],
    Area("acl"): [
        Conference("ACL"),
        Conference("ACL (1)"),
        Conference("ACL (2)"),
        Conference("ACL/IJCNLP"),
        Conference("ACL/IJCNLP (1)"),
        Conference("ACL/IJCNLP (2)"),
        Conference("COLING-ACL"),
    ],
    Area("naacl"): [
        Conference("NAACL"),
        Conference("HLT-NAACL"),
        Conference("NAACL-HLT"),
        Conference("NAACL-HLT (1)"),
    ],
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
        Conference("ECCV (17)"),
        Conference("ECCV (18)"),
        Conference("ECCV (19)"),
        Conference("ECCV (20)"),
        Conference("ECCV (21)"),
        Conference("ECCV (22)"),
        Conference("ECCV (23)"),
        Conference("ECCV (24)"),
        Conference("ECCV (25)"),
        Conference("ECCV (26)"),
        Conference("ECCV (27)"),
        Conference("ECCV (28)"),
        Conference("ECCV (29)"),
        Conference("ECCV (30)"),
        Conference("ECCV (31)"),
        Conference("ECCV (32)"),
        Conference("ECCV (33)"),
        Conference("ECCV (34)"),
        Conference("ECCV (35)"),
        Conference("ECCV (36)"),
        Conference("ECCV (37)"),
        Conference("ECCV (38)"),
        Conference("ECCV (39)"),
    ],
    Area("icra"): [Conference("ICRA"), Conference("ICRA (1)"), Conference("ICRA (2)")],
    Area("iros"): [Conference("IROS")],
    Area("rss"): [Conference("Robotics: Science and Systems")],
    Area("crypto"): [
        Conference("CRYPTO"),
        Conference("CRYPTO (1)"),
        Conference("CRYPTO (2)"),
        Conference("CRYPTO (3)"),
        Conference("CRYPTO (4)"),
        Conference("CRYPTO (5)"),
    ],
    Area("eurocrypt"): [
        Conference("EUROCRYPT"),
        Conference("EUROCRYPT (1)"),
        Conference("EUROCRYPT (2)"),
        Conference("EUROCRYPT (3)"),
        Conference("EUROCRYPT (4)"),
        Conference("EUROCRYPT (5)"),
    ],
    Area("ismb"): [
        Conference("ISMB"),
        Conference("Bioinformatics"),
        Conference("Bioinform."),
        Conference("ISMB/ECCB (Supplement of Bioinformatics)"),
        Conference("Bioinformatics [ISMB/ECCB]"),
        Conference("ISMB (Supplement of Bioinformatics)"),
    ],
    Area("recomb"): [Conference("RECOMB")],
    Area("vis"): [
        Conference("IEEE Visualization"),
        Conference("IEEE Trans. Vis. Comput. Graph."),
    ],
    Area("vr"): [Conference("VR")],
    Area("ec"): [Conference("EC")],
    Area("wine"): [Conference("WINE")],
    Area("sigcse"): [Conference("SIGCSE"), Conference("SIGCSE (1)")],
}
# EMSOFT is now published as a special issue of TECS *or* IEEE TCAD in a particular page range.
# 2023 info contributed by Ezio Bartocci
EMSOFT_TECS = {2017: (16, "5s"), 2019: (18, "5s"), 2021: (20, "5s"), 2023: (22, "5s")}
EMSOFT_TECS_PaperNumbers = {2017: (163, 190), 2019: (84, 110), 2021: (79, 106), 2023: (136, 156)}

EMSOFT_TCAD = {2018: (37, 11), 2020: (39, 11), 2022: (41, 11)}
# 2018 page numbers contributed by Ezio Bartocci
# 2022 numbers contributed by Changhee Jang
EMSOFT_TCAD_PaperStart = {
    2018: {
        2188,
        2200,
        2244,
        2290,
        2311,
        2393,
        2404,
        2474,
        2578,
        2636,
        2649,
        2673,
        2743,
        2768,
        2812,
        2845,
        2869,
        2894,
        2906,
        2952,
    },
    2020: {
        3215,
        3227,
        3288,
        3323,
        3336,
        3348,
        3385,
        3420,
        3433,
        3467,
        3492,
        3506,
        3555,
        3566,
        3650,
        3662,
        3674,
        3711,
        3762,
        3809,
        3856,
        3868,
        3893,
        3906,
        3931,
        3944,
        3981,
        3993,
        4006,
        4018,
        4090,
        4102,
        4142,
        4166,
        4205,
    },
    2022: {
        3614,
        3638,
        3673,
        3757,
        3779,
        3850,
        3874,
        3886,
        3898,
        3957,
        3969,
        3981,
        4016,
        4028,
        4157,
        4193,
        4205,
        4253,
        4265,
        4361,
        4373,
        4409,
        4421,
        4445,
        4457,
        4469,
        4492,
        4504,
        4539,
        4563,
    },
}
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
# The entries for 2022 and 2023 are speculative.
ISMB_Bioinformatics = {
    2023: (39, "Supplement"),
    2022: (38, "Supplement"),
    2021: (37, "Supplement"),
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
# Assuming all will be in the same issues through 2023.
TOG_SIGGRAPH_Volume = {
    2023: (42, 4),
    2022: (41, 4),
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
# Assuming all will be in the same issues through 2023.
TOG_SIGGRAPH_Asia_Volume = {
    2023: (42, 6),
    2022: (41, 6),
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
# CGF special handling to count only EUROGRAPHICS proceedings.
# Assuming all will be in the same issues through 2023.
CGF_EUROGRAPHICS_Volume = {
    2023: (42, 2),
    2022: (41, 2),
    2021: (40, 2),
    2020: (39, 2),
    2019: (38, 2),
    2018: (37, 2),
    2017: (36, 2),
    2016: (35, 2),
    2015: (34, 2),
    2014: (33, 2),
    2013: (32, 2),
    2012: (31, 2),
    2011: (30, 2),
    2010: (29, 2),
    2009: (28, 2),
    2008: (27, 2),
    2007: (26, 3),
    2006: (25, 3),
    2005: (24, 3),
    2004: (23, 3),
    2003: (22, 3),
    2002: (21, 3),
    2001: (20, 3),
    2000: (19, 3),
    1999: (18, 3),
    1998: (17, 3),
    1997: (16, 3),
    1996: (15, 3),
    1995: (14, 3),
    1994: (13, 3),
    1993: (12, 3),
    1992: (11, 3),
}
# TVCG special handling to count only IEEE VIS
TVCG_Vis_Volume = {
    2024: (30, 1),
    2023: (29, 1),
    2022: (28, 1),
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
    2023: (29, 5),
    2022: (28, 5),
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
    if confname in [
        "ACM Trans. Embedded Comput. Syst.",
        "ACM Trans. Embed. Comput. Syst.",
    ]:
        if year not in EMSOFT_TECS:
            return False
        if pvmatcher := TECSCounterColon.match(pages):
            pseudovolume = int(pvmatcher.group(1))
            startpv, endpv = EMSOFT_TECS_PaperNumbers[year]
            if pseudovolume < int(startpv) or pseudovolume > int(endpv):
                return False
            if number != EMSOFT_TECS[year][1]:
                return False
    # Special handling for EMSOFT (TCAD)
    if confname == "IEEE Trans. Comput. Aided Des. Integr. Circuits Syst.":
        if year not in EMSOFT_TCAD:
            return False
        if (
            int(volume) != EMSOFT_TCAD[year][0]
            or int(number) != EMSOFT_TCAD[year][1]
            or startPage not in EMSOFT_TCAD_PaperStart[year]
        ):
            return False
    # Special handling for SIGCSE.
    if confname in ["SIGCSE"]:
        if (year, startPage, startPage + pageCount - 1) not in SIGCSE:
            return False
    # Special handling for ISMB.
    if confname in ["Bioinformatics", "Bioinform."]:
        if year not in ISMB_Bioinformatics:
            return False
        vol, num = ISMB_Bioinformatics[year]
        if volume != str(vol) or number != str(num):
            return False
        if int(volume) >= 33 and int(volume) < 37:
            # Hopefully this works going forward.
            pg = ISMBpageCounter.match(pages)
            if pg is None:
                return False
            startPage = int(pg.group(1))
            end = int(pg.group(2))
            pageCount = end - startPage + 1
    elif confname in ["ICSE", "ICSE (1)", "ICSE (2)"]:
        if year in ICSE_ShortPaperStart:
            pageno = ICSE_ShortPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are "short papers" (regardless of their length).
                return False
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
    elif confname == "ACM Trans. Graph.":
        # should already have been handled by regenerate_data.py.
        return False
    elif confname == "IEEE Trans. Vis. Comput. Graph.":
        Vis_Conf = False
        if year in TVCG_Vis_Volume:
            vol, num = TVCG_Vis_Volume[year]
            if volume == str(vol) and number == str(num):
                Vis_Conf = True
        if year in TVCG_VR_Volume:
            vol, num = TVCG_VR_Volume[year]
            if volume == str(vol) and number == str(num):
                Vis_Conf = True
        if not Vis_Conf:
            return False
    elif confname == "ASE":
        if pageCount < ASE_LongPaperThreshold:
            # Omit short papers (which may be demos, etc.).
            return False
    elif confname == "ICS":
        if url is not None and "innovations" in url:
            return False
    elif confname == "DAC":
        if year in DAC_TooShortPapers:
            with contextlib.suppress(Exception):
                if int(pages) in DAC_TooShortPapers[year]:
                    return False
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
        and confname == "ACM Conference on Computer and Communications Security"
    ):
        tooFewPages = True
    if pageCount != -1 and pageCount < pageCountThreshold:
        exceptionConference = False
        exceptionConference |= confname == "SC" and (
            year <= 2012 or year in [2017, 2020, 2021]
        )
        exceptionConference |= confname == "SIGSOFT FSE" and year == 2012
        exceptionConference |= (
            confname == "ACM Trans. Graph."
            and int(volume) >= 26
            and (int(volume) <= 39)
        )
        exceptionConference |= (
            confname == "SIGGRAPH" and int(volume) >= 26 and (int(volume) <= 39)
        )
        exceptionConference |= confname == "SIGGRAPH Asia"
        # FIXME - hopefully DBLP will fix
        exceptionConference |= confname == "CHI" and year == 2018
        exceptionConference |= confname == "ICCAD" and year in {2016, 2018, 2022}
        exceptionConference |= confname == "CHI" and year == 2019
        exceptionConference |= confname == "FAST" and year == 2012
        exceptionConference |= confname == "DAC" and year == 2019
        # to handle very old ISCA conferences; all papers are full papers in ISCA now
        exceptionConference |= confname == "ISCA" and (pageCount < 0 or pageCount >= 3)
        tooFewPages = not exceptionConference
    if tooFewPages:
        return False
    return True


def test_countPaper() -> bool:
    assert not countPaper(
        "anything", startyear - 1, "1", "1", "1-10", 1, 10, "", "nothing"
    )
    assert not countPaper(
        "anything", endyear + 1, "1", "1", "1-10", 1, 10, "", "nothing"
    )
    assert not countPaper("anything", endyear - 1, "1", "1", "1-5", 1, 5, "", "nothing")
    assert countPaper(
        "SIGGRAPH", endyear - 1, "1", "1", "1", 1, -1, "", "Some Graphics Paper"
    )
    assert not countPaper(
        "ACM Trans. Embedded Comput. Syst.",
        2017,
        "16",
        "5s",
        "120:1-120:21",
        1,
        21,
        "DOI",
        "Some EMSOFT Paper",
    )
    assert countPaper(
        "ACM Trans. Embedded Comput. Syst.",
        2017,
        "16",
        "5s",
        "163:1-163:21",
        1,
        21,
        "DOI",
        "Some EMSOFT Paper",
    )
