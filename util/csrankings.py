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
import operator
#from builtins import str

# Papers must be at least 6 pages long to count.
pageCountThreshold = 6
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile('([0-9]+)-([0-9]+)') #  flags=re.ASCII)
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile('[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)')
# Special regexp for extracting pseudo-volumes (paper number) from TECS.
TECSCounterColon = re.compile('([0-9]+):[1-9][0-9]*-([0-9]+):[1-9][0-9]*')
# Extract the ISMB proceedings page numbers.
ISMBpageCounter = re.compile('i(\d+)-i(\d+)')


def startpage(pageStr):
    """Compute the starting page number from a string representing page numbers."""
    global pageCounterNormal
    global pageCounterColon
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

#def pagecount(pageStr : str) : int:
def pagecount(pageStr):
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


areadict = {
    #
    # Max three most selective venues per area for now.
    #
    # SIGPLAN
#    'plan' : ['POPL', 'PLDI', 'PACMPL'],  # PACMPL, issue POPL
    'popl' : ['POPL'], 
    'pldi' : ['PLDI'],
    # "Next tier" - see csrankings.ts
    'oopsla' : ['OOPSLA', 'OOPSLA/ECOOP'], # Next tier; note in 1990 the conference was merged with ECOOP
    'icfp'   : ['ICFP'],   # Next tier
    'pacmpl' : ['PACMPL', 'Proc. ACM Program. Lang.'], # Special PACMPL handling below
    # SIGSOFT
    #    'soft': ['ICSE', 'ICSE (1)', 'ICSE (2)', 'SIGSOFT FSE', 'ESEC/SIGSOFT FSE'],
    'icse' : ['ICSE', 'ICSE (1)'],
    'fse'  : ['SIGSOFT FSE', 'ESEC/SIGSOFT FSE'],
    'ase'  : ['ASE'], # Next tier
    'issta'  : ['ISSTA'], # Next tier
    # SIGOPS
    # - OSDI/SOSP alternate years, so are treated as one venue; USENIX ATC has two variants in DBLP
    # 'ops': ['SOSP', 'OSDI', 'EuroSys'], # 'USENIX Annual Technical Conference', 'USENIX Annual Technical Conference, General Track'],
    'sosp' : ['SOSP'],
    'osdi' : ['OSDI'],
    'eurosys' : ['EuroSys'], # next tier
    'fast' : ['FAST'], # next tier
    'usenixatc' : ['USENIX Annual Technical Conference', 'USENIX Annual Technical Conference, General Track'], # next tier
    # SIGMETRICS
    # - Two variants for each, as in DBLP.
    # 'metrics': ['SIGMETRICS', 'SIGMETRICS/Performance', 'POMACS','IMC', 'Internet Measurement Conference'],
    'imc': ['IMC', 'Internet Measurement Conference'],
    'sigmetrics': ['SIGMETRICS', 'SIGMETRICS/Performance', 'POMACS', 'Proc. ACM Meas. Anal. Comput. Syst.'],
    # SIGMOBILE
    # 'mobile': ['MobiSys', 'MobiCom', 'MOBICOM', 'SenSys'],
    'mobisys' : ['MobiSys'],
    'mobicom' : ['MobiCom', 'MOBICOM'],
    'sensys'  : ['SenSys'],
    # SIGHPC
    # 'hpc': ['SC', 'HPDC', 'ICS'],
    'sc': ['SC'],
    'hpdc': ['HPDC'],
    'ics': ['ICS'],
    # SIGBED
    # 'bed': ['RTSS', 'RTAS', 'IEEE Real-Time and Embedded Technology and Applications Symposium', 'EMSOFT', 'ACM Trans. Embedded Comput. Syst.'],
    'emsoft': ['EMSOFT', 'ACM Trans. Embedded Comput. Syst.', 'ACM Trans. Embed. Comput. Syst.'], # TECS: issue number & page numbers must be checked
    'rtss' : ['RTSS'],
    'rtas' : ['RTAS', 'IEEE Real-Time and Embedded Technology and Applications Symposium'],
    # SIGDA
    # 'da': ['ICCAD', 'DAC'],
    'iccad': ['ICCAD'],
    'dac' : ['DAC'],
    # SIGMOD
    # 'mod': ['VLDB', 'PVLDB', 'SIGMOD Conference'],
    'vldb' : ['VLDB', 'PVLDB', 'Proc. VLDB Endow.'],
    'sigmod' : ['SIGMOD Conference'],
    'icde' : ['ICDE'], # next tier
    'pods' : ['PODS'], # next tier
    # SIGSAC
    # - USENIX Security listed twice to reflect variants in DBLP
    # 'sec': ['IEEE Symposium on Security and Privacy', 'ACM Conference on Computer and Communications Security', 'USENIX Security Symposium', 'USENIX Security', 'CCS'], # , 'NDSS'],
    'ccs': ['CCS', 'ACM Conference on Computer and Communications Security'],
    'oakland' : ['IEEE Symposium on Security and Privacy'],
    'usenixsec' : ['USENIX Security Symposium', 'USENIX Security'],
    'ndss' : ['NDSS'],
    'pets' : ['PoPETs', 'Privacy Enhancing Technologies', 'Proc. Priv. Enhancing Technol.'],
    # SIGCOMM
    # 'comm': ['SIGCOMM', 'NSDI'], # INFOCOM
    'sigcomm': ['SIGCOMM'],
    'nsdi': ['NSDI'], # INFOCOM
    # SIGARCH
    # 'arch': ['ISCA', 'MICRO', 'ASPLOS'],
    'asplos': ['ASPLOS'],
    'isca': ['ISCA'],
    'micro': ['MICRO'],
    'hpca': ['HPCA'], # next tier
    # SIGLOG
    # 'log': ['CAV', 'CAV (1)', 'CAV (2)', 'LICS', 'CSL-LICS'],
    'cav': ['CAV', 'CAV (1)', 'CAV (2)'],
    'lics' : ['LICS', 'CSL-LICS'],
    # SIGACT
    # 'act': ['STOC', 'FOCS', 'SODA'],
    'focs': ['FOCS'],
    'stoc': ['STOC'],
    'soda': ['SODA'],
    # 'mlmining': ['NIPS', 'ICML', 'ICML (1)', 'ICML (2)', 'ICML (3)', 'KDD'],
    'nips': ['NIPS', 'NeurIPS'],
    'icml': ['ICML', 'ICML (1)', 'ICML (2)', 'ICML (3)'],
    'kdd' : ['KDD'],
    # 'ai': ['AAAI', 'AAAI/IAAI', 'IJCAI'],
    'aaai': ['AAAI', 'AAAI/IAAI'],
    'ijcai': ['IJCAI'],
    # AAAI listed to account for AAAI/IAAI joint conference
    # SIGGRAPH
    # - special handling of TOG to select SIGGRAPH and SIGGRAPH Asia
    'siggraph': ['ACM Trans. Graph.', 'SIGGRAPH'],
#    'siggraph' : ['SIGGRAPH'],
    'siggraph-asia' : ['ACM Trans. Graph.','SIGGRAPH Asia'],
    # SIGIR
    # 'ir': ['WWW', 'SIGIR'],
    'sigir': ['SIGIR'],
    'www': ['WWW'],
    # SIGCHI
    # 'chi': ['CHI', 'UbiComp', 'Ubicomp', 'UIST', 'IMWUT', 'Pervasive'],
    'chiconf' : ['CHI'],
    'ubicomp' : ['UbiComp', 'Ubicomp', 'IMWUT', 'Pervasive', 'Proc. ACM Interact. Mob. Wearable Ubiquitous Technol.'],
    'uist' : ['UIST'],
#    'nlp': ['EMNLP', 'ACL', 'ACL (1)', 'ACL (2)', 'NAACL', 'HLT-NAACL', 'NAACL-HLT',
#            'ACL/IJCNLP',  # -- in 2009 was joint
#            'COLING-ACL',  # -- in 1998 was joint
#            'EMNLP-CoNLL',  # -- in 2012 was joint
#            'HLT/EMNLP',  # -- in 2005 was joint
#            ],
    'emnlp': ['EMNLP', 'EMNLP-CoNLL', 'HLT/EMNLP', 'EMNLP-IJCNLP', 'EMNLP/IJCNLP (1)'],
    'acl' : ['ACL', 'ACL (1)', 'ACL (2)', 'ACL/IJCNLP', 'COLING-ACL'],
    'naacl' : ['NAACL', 'HLT-NAACL', 'NAACL-HLT', 'NAACL-HLT (1)'],
#    'vision': ['CVPR', 'CVPR (1)', 'CVPR (2)', 'ICCV', 'ECCV', 'ECCV (1)', 'ECCV (2)', 'ECCV (3)', 'ECCV (4)', 'ECCV (5)', 'ECCV (6)', 'ECCV (7)'],
    'cvpr': ['CVPR', 'CVPR (1)', 'CVPR (2)'],
    'iccv': ['ICCV'],
    'eccv': ['ECCV', 'ECCV (1)', 'ECCV (2)', 'ECCV (3)', 'ECCV (4)', 'ECCV (5)', 'ECCV (6)', 'ECCV (7)', 'ECCV (8)', 'ECCV (9)', 'ECCV (10)', 'ECCV (11)', 'ECCV (12)', 'ECCV (13)', 'ECCV (14)', 'ECCV (15)', 'ECCV (16)'],
    # 'robotics': ['ICRA', 'ICRA (1)', 'ICRA (2)', 'IROS', 'Robotics: Science and Systems'],
    'icra': ['ICRA', 'ICRA (1)', 'ICRA (2)'],
    'iros': ['IROS'],
    'rss': ['Robotics: Science and Systems'],
    # 'crypt': ['CRYPTO', 'CRYPTO (1)', 'CRYPTO (2)', 'CRYPTO (3)', 'EUROCRYPT', 'EUROCRYPT (1)', 'EUROCRYPT (2)', 'EUROCRYPT (3)'],
    'crypto': ['CRYPTO', 'CRYPTO (1)', 'CRYPTO (2)', 'CRYPTO (3)'],
    'eurocrypt': ['EUROCRYPT', 'EUROCRYPT (1)', 'EUROCRYPT (2)', 'EUROCRYPT (3)'],
    # SIGBio
    # - special handling for ISMB proceedings in Bioinformatics special issues.
    # 'bio': ['RECOMB', 'ISMB', 'Bioinformatics', 'ISMB/ECCB (Supplement of Bioinformatics)', 'Bioinformatics [ISMB/ECCB]', 'ISMB (Supplement of Bioinformatics)'],
    'ismb': ['ISMB', 'Bioinformatics', 'Bioinform.', 'ISMB/ECCB (Supplement of Bioinformatics)', 'Bioinformatics [ISMB/ECCB]', 'ISMB (Supplement of Bioinformatics)'],
    'recomb' : ['RECOMB'],
    # special handling of IEEE TVCG to select IEEE Vis and VR proceedings
    'vis': ['IEEE Visualization', 'IEEE Trans. Vis. Comput. Graph.'],
    'vr' : ['VR'],
    # 'ecom' : ['EC', 'WINE']
    'ec' : ['EC'],
    'wine' : ['WINE']
    # ,'cse' : ['SIGCSE']
}

# EMSOFT is now published as a special issue of TECS, in a particular page range.
EMSOFT_TECS = { 2017: (16, 5), 2019: (18, "5s") }
EMSOFT_TECS_PaperNumbers = { 2017: (163, 190), 2019: (84, 110) }

# DAC in 2019 has article numbers. Some of these have too few pages. (Contributed by Wanli Chang.)
DAC_TooShortPapers = { 2019: { 21, 22, 43, 44, 45, 76, 77, 78, 79, 100, 101, 121, 152, 153, 154, 175, 176, 197, 198, 199,222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240} }

# ISMB proceedings are published as special issues of Bioinformatics.
# Here is the list.
ISMB_Bioinformatics = {2019: (35, 14),
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
                       2007: (23, 13)
                       }

# TOG special handling to count only SIGGRAPH proceedings.
# Assuming all will be in the same issues through 2021.
TOG_SIGGRAPH_Volume = {2021: (40, 4),
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
                       2002: (21, 3)
                       }

# TOG special handling to count only SIGGRAPH Asia proceedings.
# Assuming all will be in the same issues through 2021.
TOG_SIGGRAPH_Asia_Volume = {2021: (40, 6),
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
                            2008: (27, 5)
                            }

# TVCG special handling to count only IEEE VIS
TVCG_Vis_Volume = {2021: (27, 1),
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
                   2006: (12, 5)
                   }

# TVCG special handling to count only IEEE VR
TVCG_VR_Volume = {2021: (27, 5),
                  2020: (26, 5),
                  2019: (25, 5),
                  2018: (24, 4),
                  2017: (23, 4),
                  2016: (22, 4),
                  2015: (21, 4),
                  2014: (20, 4),
                  2013: (19, 4),
                  2012: (18, 4)}

# ICSE special handling to omit short papers.
# Contributed by Zhendong Su, UC Davis.
# Short papers start at this page number for these proceedings of ICSE (and are thus omitted,
# as the acceptance criteria differ).
ICSE_ShortPaperStart = {2013: 851,
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
                        1997: 535}

# SIGMOD special handling to avoid non-research papers.
# This and other SIGMOD data below contributed by Davide Martinenghi,
# Politecnico di Milano.
SIGMOD_NonResearchPaperStart = {2017: 1587,
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
                                1993: 388}

# SIGMOD recently has begun intermingling research and non-research
# track papers in their proceedings, requiring individual paper
# filtering.
SIGMOD_NonResearchPapersRange = { 2018 : [(177, 230), (583, 627), (789, 839), (1393, 1459),
                                          (1637, 1845)],
                                  2017: [(1, 3), (51, 63), (125, 138), (331, 343),
                                         (1041, 1052), (511, 526), (1587, 1782)],
                                  2016: [(1753, 1764), (1295, 1306), (795, 806),
                                        (227, 238), (999, 1010), (1923, 1934),
                                        (1307, 1318), (1951, 1960), (759, 771),
                                        (253, 265), (1405, 1416), (215, 226),
                                        (1105, 1117), (35, 46), (63, 75),
                                        (807, 819), (1099, 1104), (1087, 1098),
                                        (847, 859), (239, 251), (1393, 1404),
                                        (2069, 2243)],
                                 2015: [(227, 276), (607, 658), (1343, 1394),
                                        (1657, 1706), (1917, 1940),
                                        (859, 918), (1063, 1122), (1403, 1462)],
                                 2014: [(147, 188), (337, 384), (529, 573), (1223, 1258)]}


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

import sys
if sys.version_info.major == 3:
    unicode = str
    
#def csv2dict_str_str(fname : str) -> Dict[str, str]:
def csv2dict_str_str(fname):
    """Takes a CSV file and returns a dictionary of pairs."""
    with open(fname, mode='r') as infile:
        rdr = csv.reader(infile)
        if sys.version_info.major == 3:
            d = {unicode(rows[0].strip()): unicode(rows[1].strip()) for rows in rdr}
        else:
            d = {unicode(rows[0].strip(), 'utf-8'): unicode(rows[1].strip(), 'utf-8') for rows in rdr}
    return d


def countPaper(confname, year, volume, number, pages, startPage, pageCount, url, title):
    global EMSOFT_TECS
    global EMSOFT_TECS_PaperNumbers
    global TECSCounterColon
    global ISMB_Bioinformatics
    global ICSE_ShortPaperStart
    global SIGMOD_NonResearchPaperStart
    global SIGMOD_NonResearchPapersRange
    global TOG_SIGGRAPH_Volume
    global TOG_SIGGRAPH_Asia_Volume
    global TVCG_Vis_Volume
    global TVCG_VR_Volume
    global ASE_LongPaperThreshold
    global pageCountThreshold
    global ISMBpageCounter
    global DAC_TooShortPapers
    
    """Returns true iff this paper will be included in the rankings."""
    if year < startyear or year > endyear:
        return False

    # Special handling for EMSOFT.
    if confname == 'ACM Trans. Embedded Comput. Syst.' or confname == 'ACM Trans. Embed. Comput. Syst.':
        if year in EMSOFT_TECS:
            pvmatcher = TECSCounterColon.match(pages)
            if not pvmatcher is None:
                pseudovolume = int(pvmatcher.group(1))
                (startpv, endpv) = EMSOFT_TECS_PaperNumbers[year]
                if pseudovolume < int(startpv) or pseudovolume > int(endpv):
                    return False
        else:
            return False
        
    # Special handling for ISMB.
    if confname == 'Bioinformatics' or confname == 'Bioinform.':
        if year in ISMB_Bioinformatics:
            (vol, num) = ISMB_Bioinformatics[year]
            if (volume != str(vol)) or (number != str(num)):
                return False
            else:
                if (int(volume) >= 33): # Hopefully this works going forward.
                    pg = ISMBpageCounter.match(pages)
                    if pg is None:
                        return False
                    startPage = int(pg.group(1))
                    end = int(pg.group(2))
                    pageCount = end - startPage + 1
        else:
            return False

    # Special handling for ICSE.
    elif confname == 'ICSE' or confname == 'ICSE (1)' or confname == 'ICSE (2)':
        if year in ICSE_ShortPaperStart:
            pageno = ICSE_ShortPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are "short papers" (regardless of their length).
                return False

    # Special handling for SIGMOD.
    elif confname == 'SIGMOD Conference':
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
    elif confname == 'ACM Trans. Graph.':
        return False # should already have been handled by regenerate_data.py.

    # Special handling for IEEE Vis and VR
    elif confname == 'IEEE Trans. Vis. Comput. Graph.':
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
    elif confname == 'ASE':
        if pageCount < ASE_LongPaperThreshold:
            # Omit short papers (which may be demos, etc.).
            return False

    # Disambiguate Innovations in (Theoretical) Computer Science from
    # International Conference on Supercomputing
    elif confname == 'ICS':
        if not url is None:
            if url.find('innovations') != -1:
                return False

    # Special handling for DAC.
    elif confname == 'DAC':
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

    if pageCount == -1 and confname == 'ACM Conference on Computer and Communications Security':
        tooFewPages = True

    if ((pageCount != -1) and (pageCount < pageCountThreshold)):
        tooFewPages = True
        exceptionConference = False
        exceptionConference |= confname == 'SC' and year <= 2012
        exceptionConference |= confname == 'SIGSOFT FSE' and year == 2012
        exceptionConference |= confname == 'ACM Trans. Graph.' and int(volume) >= 26 and int(volume) <= 39
        exceptionConference |= confname == 'SIGGRAPH' and int(volume) >= 26 and int(volume) <= 39
        exceptionConference |= confname == 'SIGGRAPH Asia'
        exceptionConference |= confname == 'CHI' and year == 2018 # FIXME - hopefully DBLP will fix
        exceptionConference |= confname == 'ICCAD' and (year == 2016 or year == 2018)
        exceptionConference |= confname == 'CHI' and year == 2019
        exceptionConference |= confname == 'FAST' and year == 2012
        exceptionConference |= confname == 'DAC' and year == 2019
        
    
        if exceptionConference:
            tooFewPages = False
    if tooFewPages:
        return False
       
    return True
