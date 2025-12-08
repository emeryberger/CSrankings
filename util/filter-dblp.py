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
    "CAV", "CAV (1)", "CAV (2)", "CAV (3)",
    "LICS", "CSL-LICS",

    # Machine Learning
    "NeurIPS", "NIPS",
    "ICML", "ICML (1)", "ICML (2)", "ICML (3)",
    "KDD",

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


def main():
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

    output = sys.stdout
    output.write('<dblp>')

    count = 0

    for event, elem in parser:
        tag = elem.tag
        should_include = False

        if tag == 'inproceedings':
            booktitle_elem = elem.find('booktitle')
            if booktitle_elem is not None and booktitle_elem.text in BOOKTITLES:
                should_include = True
        elif tag == 'article':
            journal_elem = elem.find('journal')
            if journal_elem is not None and journal_elem.text in JOURNALS:
                should_include = True

        if should_include:
            # Serialize and write the element
            output.write(etree.tostring(elem, encoding='unicode'))
            count += 1

        # Clear element to free memory (important for streaming)
        elem.clear()
        # Also clear parent references to prevent memory buildup
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    output.write('</dblp>\n')

    print(f"Filtered {count} entries", file=sys.stderr)


if __name__ == '__main__':
    main()
