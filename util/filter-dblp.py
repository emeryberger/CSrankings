#!/usr/bin/env python3
"""
CSRankings DBLP Filter - lxml iterparse implementation

Filters the full DBLP XML dump (~5GB) to only include publications
from CSRankings-relevant venues (~250MB output).

This uses lxml's iterparse for efficient streaming XML processing.
lxml (libxml2) is ~2.7x faster than Python's expat-based SAX parser.

Usage:
    python3 util/filter-dblp.py < dblp.xml > dblp-filtered.xml
    # Or with gzip:
    gunzip -c dblp-original.xml.gz | python3 util/filter-dblp.py | gzip > dblp.xml.gz

Requirements:
    - Python 3.7+
    - lxml library (pip install lxml)
    - dblp.dtd must be in the current directory (for entity resolution)

Performance:
    - Processes ~5GB XML in ~70 seconds (vs ~180s with expat SAX)
    - Memory usage: ~100MB constant (streaming)
"""

import argparse
import collections
import datetime
import os
import sys

try:
    from lxml import etree
except ImportError:
    print("Error: lxml is required. Install with: pip install lxml", file=sys.stderr)
    sys.exit(1)

# Conference booktitles to include
BOOKTITLES = frozenset([
    # NLP
    "ACL", "ACL (1)", "ACL (2)", "ACL/IJCNLP", "COLING-ACL",
    "ACL/IJCNLP (1)", "ACL/IJCNLP (2)",
    "NAACL", "NAACL-HLT", "NAACL-HLT (1)", "NAACL (Long Papers)", "HLT-NAACL",
    "EMNLP", "EMNLP-CoNLL", "EMNLP/IJCNLP (1)", "HLT/EMNLP", "EMNLP (1)",

    # AI
    "AAAI", "AAAI/IAAI", "ICLR", "ICLR (Poster)", "IJCAI",
    "IJCAI/ECAI",  # Joint IJCAI-ECAI years (e.g., 2026)

    # Web/IR
    "WWW", "SIGIR", "WSDM",

    # HCI
    "CSCW", "CHI", "UbiComp", "Ubicomp", "Pervasive", "UIST",

    # Visualization
    "IEEE Visualization", "VR",

    # Security
    "IEEE Symposium on Security and Privacy", "S&P", "SP",
    "ACM Conference on Computer and Communications Security", "CCS",
    "USENIX Security Symposium", "USENIX Security",
    "NDSS", "Privacy Enhancing Technologies",

    # Verification
    "CAV", *[f"CAV ({i})" for i in range(1, 10)],  # CAV 2025 had four parts
    "LICS", "CSL-LICS",

    # Machine Learning
    "NeurIPS", "NIPS",
    "ICML", "ICML (1)", "ICML (2)", "ICML (3)",
    "KDD", "KDD (1)", "KDD (2)",

    # Cryptography
    "CRYPTO", "CRYPTO (1)", "CRYPTO (2)", "CRYPTO (3)", "CRYPTO (4)",
    "CRYPTO (5)", "CRYPTO (6)", "CRYPTO (7)", "CRYPTO (8)", "CRYPTO (9)", "CRYPTO (10)",
    "EUROCRYPT", "EUROCRYPT (1)", "EUROCRYPT (2)", "EUROCRYPT (3)", "EUROCRYPT (4)",
    "EUROCRYPT (5)", "EUROCRYPT (6)", "EUROCRYPT (7)", "EUROCRYPT (8)",

    # High-Performance Computing
    "SC", "HPDC", "ICS", "IPDPS",

    # Bioinformatics
    "RECOMB", "ISMB", "ISMB/ECCB (Supplement of Bioinformatics)", "ISMB (Supplement of Bioinformatics)",

    # Robotics
    "ICRA", "ICRA (1)", "ICRA (2)", "IROS", "Robotics: Science and Systems",

    # Operating Systems
    "SOSP", "OSDI", "EuroSys",
    "USENIX Annual Technical Conference", "USENIX Annual Technical Conference, General Track",
    "USENIX ATC", "USENIX ATC, General Track", "FAST",

    # Theory
    "STOC", "FOCS", "SODA", "SPAA", "PODC", "DISC",

    # Design Automation
    "ICCAD", "DAC",

    # Measurement/Networking
    "SIGMETRICS", "SIGMETRICS/Performance", "IMC", "Internet Measurement Conference",
    "SIGCOMM", "NSDI",

    # Programming Languages
    "POPL", "PLDI", "ICFP", "OOPSLA", "OOPSLA/ECOOP",

    # Computer Architecture
    "ISCA", "MICRO", "HPCA",
    "ASPLOS", "ASPLOS (1)", "ASPLOS (2)", "ASPLOS (3)", "ASPLOS (4)",

    # Databases
    "VLDB", "SIGMOD Conference", "ICDE", "PODS",

    # Mobile Computing
    "MobiSys", "MobiCom", "MOBICOM", "SenSys",

    # Real-Time/Embedded
    "RTSS", "rtss", "RTAS", "IEEE Real-Time and Embedded Technology and Applications Symposium", "EMSOFT",

    # Graphics
    "SIGGRAPH", "SIGGRAPH (Conference Paper Track)", "SIGGRAPH Asia",

    # Software Engineering
    "ASE", "ICSE", "ICSE (1)", "ICSE (2)",
    "SIGSOFT FSE", "ESEC/SIGSOFT FSE", "ISSTA",

    # Computer Vision
    "CVPR", "CVPR (1)", "CVPR (2)", "ICCV",
    *[f"ECCV ({i})" for i in range(1, 90)],

    # CS Education
    "SIGCSE", "SIGCSE (1)",

    # Economics/Game Theory
    "EC", "WINE",
])

# Journal names to include
JOURNALS = frozenset([
    # Visualization
    "IEEE Trans. Vis. Comput. Graph.",

    # Design Automation
    "IEEE Trans. Comput. Aided Des. Integr. Circuits Syst.",

    # Security/Privacy
    "PoPETs", "Proc. Priv. Enhancing Technol.",

    # Ubiquitous Computing
    "IMWUT", "Proc. ACM Interact. Mob. Wearable Ubiquitous Technol.",

    # Bioinformatics
    "Bioinform.", "Bioinformatics", "Bioinformatics [ISMB/ECCB]",

    # Measurement
    "POMACS", "Proc. ACM Meas. Anal. Comput. Syst.",

    # Programming Languages
    "PACMPL", "Proc. ACM Program. Lang.",

    # Databases
    "PVLDB", "Proc. VLDB Endow.", "Proc. ACM Manag. Data",

    # Embedded Systems
    "ACM Trans. Embedded Comput. Syst.", "ACM Trans. Embed. Comput. Syst.",

    # Graphics
    "ACM Trans. Graph.",
    "Comput. Graph. Forum",

    # Software Engineering
    "Proc. ACM Softw. Eng.",
])


class LocalDTDResolver(etree.Resolver):
    """Serve the local dblp.dtd for whatever DTD name the dump declares.

    The rolling dump declares SYSTEM "dblp.dtd", but the monthly releases on
    drops.dagstuhl.de declare a dated name such as "dblp-2023-06-28.dtd". Without
    this, lxml looks for that file next to the input, finds nothing, and every
    &Eacute;-style entity becomes a hard parse error.
    """

    def resolve(self, system_url, public_id, context):
        if os.path.basename(system_url).startswith("dblp") and system_url.endswith(".dtd"):
            return self.resolve_filename(os.path.abspath("dblp.dtd"), context)
        return None


def stream_of(key):
    """DBLP stream of a record key: "conf/ijcai/XiangXJCZ26" -> "conf/ijcai"."""
    parts = key.split('/')
    return '/'.join(parts[:2]) if len(parts) >= 3 else None


def venue_drift_report(kept_streams, dropped, min_year, threshold):
    """Venue names that newly appeared in a DBLP stream we track.

    DBLP sometimes uses a one-off venue name for a single year -- the joint
    IJCAI-ECAI 2026 papers are booktitle "IJCAI/ECAI", not "IJCAI" -- and the
    exact-match filter above then silently drops the entire year. Those records
    still live in the tracked stream (conf/ijcai), so we flag any venue name in
    a tracked stream that we did not keep and that DBLP never used in that
    stream before `min_year`. Recurring names (workshops, companion volumes,
    Findings) were seen in earlier years, so they do not show up here.

    `dropped` maps (stream, venue) -> Counter of year -> record count.
    """
    rows = []
    for (stream, venue), years in dropped.items():
        if stream not in kept_streams or stream in IGNORED_STREAMS:
            continue
        if venue in KNOWN_UNCOUNTED.get(stream, ()):
            continue
        if min(years) < min_year:
            continue
        for year, n in years.items():
            if n >= threshold:
                rows.append((stream, venue, year, n))
    rows.sort(key=lambda r: (-r[3], r[0], r[1], r[2]))
    return rows


# arXiv: never counted, and gets new venue names constantly.
IGNORED_STREAMS = frozenset(["journals/corr"])

# New venue names in a tracked stream that were reviewed and are deliberately
# not counted (workshops, companion volumes, etc.). Add entries here after
# review so they stop being reported, or add the name to BOOKTITLES/JOURNALS
# (and util/csrankings.py) if it should be counted.
KNOWN_UNCOUNTED = {
    "conf/acl": ("ACL (6)",),  # Industry Track
    "conf/huc": ("UbiComp Companion",),
    "conf/iccv": ("ICCVW",),
    "conf/icml": ("ICML (Position Papers)",),  # Position Paper Track
    "conf/ics": ("ICS Workshops",),
    "conf/ipps": ("IPDPSW",),
    "conf/issta": ("ISSTA Companion",),
    "conf/mobisys": ("MobiSys Companion", "MobiSys Workshops"),
    "conf/naacl": ("NAACL (Findings)", "NAACL (System Demonstrations)"),
    "conf/sensys": ("SenSys-Adjunct",),
    "conf/sigmod": ("SIGMOD Companion", "SIGMOD ARI Reports"),
    "conf/sp": ("SPW",),
    "conf/uist": ("UIST Adjunct",),
    "conf/wsdm": ("WSDM Companion",),
}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--drift-report', metavar='PATH',
                    help='write a Markdown report of possible venue renames (see venue_drift_report)')
    ap.add_argument('--drift-min-year', type=int, default=datetime.date.today().year - 1,
                    help='flag venue names first used in a tracked stream in this year or later (default: last year)')
    ap.add_argument('--drift-threshold', type=int, default=20,
                    help='minimum records per (stream, venue, year) to report (default: 20)')
    args = ap.parse_args()

    print("Filtering DBLP (lxml iterparse)...", file=sys.stderr)

    # Create parser with DTD loading enabled for entity resolution
    parser = etree.iterparse(
        sys.stdin.buffer,
        events=('end',),
        tag=('inproceedings', 'article'),
        load_dtd=True,
        resolve_entities=True,
        huge_tree=True,  # Allow large text content
    )
    parser.resolvers.add(LocalDTDResolver())

    output = sys.stdout
    output.write('<dblp>')

    count = 0
    kept_streams = set()
    dropped = collections.defaultdict(collections.Counter)

    for event, elem in parser:
        tag = elem.tag
        should_include = False
        venue = None

        if tag == 'inproceedings':
            booktitle_elem = elem.find('booktitle')
            venue = booktitle_elem.text if booktitle_elem is not None else None
            should_include = venue in BOOKTITLES
        elif tag == 'article':
            journal_elem = elem.find('journal')
            venue = journal_elem.text if journal_elem is not None else None
            should_include = venue in JOURNALS

        stream = stream_of(elem.get('key', ''))
        if should_include:
            # Serialize and write the element
            output.write(etree.tostring(elem, encoding='unicode'))
            count += 1
            if stream:
                kept_streams.add(stream)
        elif stream and venue:
            year_elem = elem.find('year')
            year_text = (year_elem.text or '') if year_elem is not None else ''
            if year_text.isdigit():
                dropped[(stream, venue)][int(year_text)] += 1

        # Clear element to free memory (important for streaming)
        elem.clear()
        # Also clear parent references to prevent memory buildup
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    output.write('</dblp>\n')

    print(f"Filtered {count} entries", file=sys.stderr)

    rows = venue_drift_report(kept_streams, dropped, args.drift_min_year, args.drift_threshold)
    for stream, venue, year, n in rows:
        print(f"WARNING: possible venue rename: {n} {year} records in {stream} "
              f"with unrecognized venue {venue!r}", file=sys.stderr)
    if args.drift_report:
        with open(args.drift_report, 'w', encoding='utf-8') as f:
            if rows:
                f.write("| DBLP stream | Venue name in DBLP | Year | Records |\n")
                f.write("|---|---|---|---|\n")
                for stream, venue, year, n in rows:
                    f.write(f"| `{stream}` | `{venue}` | {year} | {n} |\n")


if __name__ == '__main__':
    main()
