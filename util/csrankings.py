"""Subroutines used for computing rankings for CSrankings.
"""
from lxml import etree as ElementTree
# import xml.etree.ElementTree as ElementTree
import csv
import operator
import re

# import gzip

#parser = ElementTree.HTMLParser(recover=True)
#dtd = ElementTree.DTD(file='dblp.dtd')
                
# Papers must be at least 6 pages long to count.
pageCountThreshold = 6
# Match ordinary page numbers (as in 10-17).
pageCounterNormal = re.compile('(\d+)-(\d+)')
# Match page number in the form volume:page (as in 12:140-12:150).
pageCounterColon = re.compile('[0-9]+:([1-9][0-9]*)-[0-9]+:([1-9][0-9]*)')

def startpage(pageStr):
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
    'plan': ['POPL', 'PLDI'],  # , 'OOPSLA'],
    # SIGHPC
    'hpc': ['SC', 'HPDC', 'ICS'],
    # SIGLOG
    'log': ['CAV', 'CAV (1)', 'CAV (2)', 'LICS', 'CSL-LICS'],
    # SIGSOFT
    'soft': ['ICSE', 'ICSE (1)', 'ICSE (2)', 'SIGSOFT FSE', 'ESEC/SIGSOFT FSE'],
    # SIGOPS
    # - OSDI/SOSP alternate years, so are treated as one venue; USENIX ATC has two variants in DBLP
    'ops': ['SOSP', 'OSDI', 'EuroSys', 'USENIX Annual Technical Conference', 'USENIX Annual Technical Conference, General Track'],
    # SIGARCH
    'arch': ['ISCA', 'MICRO', 'ASPLOS'],
    # SIGACT
    'act': ['STOC', 'FOCS', 'SODA'],
    # SIGCOMM
    'comm': ['SIGCOMM', 'INFOCOM', 'NSDI'],
    # SIGSAC
    # - USENIX Security listed twice to reflect variants in DBLP
    'sec': ['IEEE Symposium on Security and Privacy', 'ACM Conference on Computer and Communications Security', 'USENIX Security Symposium', 'USENIX Security'],
    'mlmining': ['NIPS', 'ICML', 'ICML (1)', 'ICML (2)', 'ICML (3)', 'KDD'],
    'ai': ['AAAI', 'AAAI/IAAI', 'IJCAI'],
    # AAAI listed to account for AAAI/IAAI joint conference
    'mod': ['VLDB', 'PVLDB', 'SIGMOD Conference'],
    # SIGGRAPH
    # - special handling of TOG to select SIGGRAPH and SIGGRAPH Asia
    'graph': ['ACM Trans. Graph.', 'SIGGRAPH'],
    # SIGMETRICS
    # - Two variants for each, as in DBLP.
    'metrics': ['SIGMETRICS', 'SIGMETRICS/Performance', 'IMC', 'Internet Measurement Conference'],
    # SIGIR
    'ir': ['WWW', 'SIGIR'],
    # SIGCHI
    'chi': ['CHI', 'UbiComp', 'Ubicomp', 'UIST'],
    'nlp': ['EMNLP', 'ACL', 'ACL (1)', 'ACL (2)', 'NAACL', 'HLT-NAACL',
            'ACL/IJCNLP',  # -- in 2009 was joint
            'COLING-ACL',  # -- in 1998 was joint
            'EMNLP-CoNLL',  # -- in 2012 was joint
            'HLT/EMNLP',  # -- in 2005 was joint
            ],
    'vision': ['CVPR', 'CVPR (1)', 'CVPR (2)', 'ICCV', 'ECCV (1)', 'ECCV (2)', 'ECCV (3)', 'ECCV (4)', 'ECCV (5)', 'ECCV (6)', 'ECCV (7)'],
    # SIGMOBILE
    'mobile': ['MobiSys', 'MobiCom', 'MOBICOM', 'SenSys'],
    'robotics': ['ICRA', 'ICRA (1)', 'ICRA (2)', 'IROS', 'Robotics: Science and Systems'],
    'crypt': ['CRYPTO', 'CRYPTO (1)', 'CRYPTO (2)', 'CRYPTO (3)', 'EUROCRYPT', 'EUROCRYPT (1)', 'EUROCRYPT (2)', 'EUROCRYPT (3)'],
    # SIGBio
    # - special handling for ISMB proceedings in Bioinformatics special issues.
    'bio': ['RECOMB', 'ISMB', 'Bioinformatics', 'ISMB/ECCB (Supplement of Bioinformatics)', 'Bioinformatics [ISMB/ECCB]', 'ISMB (Supplement of Bioinformatics)'],
    # SIGDA
    'da': ['ICCAD', 'DAC'],
    # SIGBED
    'bed': ['RTSS', 'RTAS', 'EMSOFT'],
    # special handling of IEEE TVCG to select IEEE Vis and VR proceedings
    'vis': ['IEEE Visualization', 'VR', 'IEEE Trans. Vis. Comput. Graph.']
}

# ISMB proceedings are published as special issues of Bioinformatics.
# Here is the list.
ISMB_Bioinformatics = {2016: (32, 12),
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
TOG_SIGGRAPH_Volume = {2016: (35, 4),
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
TOG_SIGGRAPH_Asia_Volume = {2016: (35, 6),
                            2015: (34, 6),
                            2014: (33, 6),
                            2013: (32, 6),
                            2012: (31, 6),
                            2011: (30, 6),
                            2010: (29, 6),
                            2009: (28, 5),
                            2008: (27, 5)
                            }

# TVCG special handling to count only IEEE Visualization
TVCG_Vis_Volume = {2017: (23, 1),
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
TVCG_VR_Volume = {2016: (22, 4),
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
SIGMOD_NonResearchPaperStart = {2016: 2069,
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
SIGMOD_NonResearchPapersRange = {2016: [(1753, 1764), (1295, 1306), (795, 806),
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


def csv2dict_str_str(fname):
    """Takes a CSV files and returns a dictionary of pairs."""
    with open(fname, mode='r') as infile:
        reader = csv.reader(infile)
        # for rows in reader:
        #    print rows[0], "-->", rows[1]
        # d = {rows[0].strip() : rows[1].strip() for rows in reader}
        d = {unicode(rows[0].strip(), 'utf-8'): unicode(rows[1].strip(), 'utf-8') for rows in reader}
    return d


def sortdictionary(d):
    """Sorts a dictionary."""
    return sorted(d.iteritems(), key=operator.itemgetter(1), reverse=True)

def countPaper(confname, year, volume, number, startPage, pageCount, url):
    """Returns true iff this paper will be included in the rankings."""
    if year < startyear or year > endyear:
        return False

    # Special handling for ISMB.
    if confname == 'Bioinformatics':
        if ISMB_Bioinformatics.has_key(year):
            (vol, num) = ISMB_Bioinformatics[year]
            if (volume != str(vol)) or (number != str(num)):
                return False
        else:
            return False

    # Special handling for ICSE.
    elif confname == 'ICSE' or confname == 'ICSE (1)' or confname == 'ICSE (2)':
        if ICSE_ShortPaperStart.has_key(year):
            pageno = ICSE_ShortPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are "short papers" (regardless of their length).
                return False

    # Special handling for SIGMOD.
    elif confname == 'SIGMOD Conference':
        if SIGMOD_NonResearchPaperStart.has_key(year):
            pageno = SIGMOD_NonResearchPaperStart[year]
            if startPage >= pageno:
                # Omit papers that start at or beyond this page,
                # since they are not research-track papers.
                return False
        if SIGMOD_NonResearchPapersRange.has_key(year):
            pageRange = SIGMOD_NonResearchPapersRange[year]
            for p in pageRange:
                if startPage >= p[0] and startPage + pageCount - 1 <= p[1]:
                    return False

    # Special handling for SIGGRAPH and SIGGRAPH Asia.
    elif confname == 'ACM Trans. Graph.':
        SIGGRAPH_Conf = False
        if TOG_SIGGRAPH_Volume.has_key(year):
            (vol, num) = TOG_SIGGRAPH_Volume[year]
            if (volume == str(vol)) and (number == str(num)):
                SIGGRAPH_Conf = True
        if TOG_SIGGRAPH_Asia_Volume.has_key(year):
            (vol, num) = TOG_SIGGRAPH_Asia_Volume[year]
            if (volume == str(vol)) and (number == str(num)):
                SIGGRAPH_Conf = True
        if not SIGGRAPH_Conf:
            return False

    # Special handling for IEEE Vis and VR
    elif confname == 'IEEE Trans. Vis. Comput. Graph.':
        Vis_Conf = False
        if TVCG_Vis_Volume.has_key(year):
            (vol, num) = TVCG_Vis_Volume[year]
            if (volume == str(vol)) and (number == str(num)):
                Vis_Conf = True
        if TVCG_VR_Volume.has_key(year):
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

    # SPECIAL CASE FOR conferences that have incorrect entries (as of 6/22/2016).
    # Only skip papers with a very small paper count,
    # but above 1. Why?
    # DBLP has real papers with incorrect page counts
    # - usually a truncated single page. -1 means no
    # pages found at all => some problem with journal
    # entries in DBLP.
    tooFewPages = False
    if ((pageCount != -1) and (pageCount < pageCountThreshold)):
        tooFewPages = True
        exceptionConference = confname == 'SC'
        exceptionConference |= confname == 'SIGSOFT FSE' and year == 2012
        exceptionConference |= confname == 'ACM Trans. Graph.' and int(volume) >= 26 and int(volume) <= 36
        if exceptionConference:
            tooFewPages = False
    if tooFewPages:
        return False

    # Disambiguate Innovations in (Theoretical) Computer Science from
    # International Conference on Supercomputing
    if confname == 'ICS':
        if not url is None:
            if url.find('innovations') != -1:
                return False
        
    return True
