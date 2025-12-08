#!/usr/bin/env python3
"""
CSRankings DBLP Filter - Streaming SAX-based implementation

Filters the full DBLP XML dump (~5GB) to only include publications
from CSRankings-relevant venues (~250MB output).

This uses SAX parsing which processes XML as a stream, using constant
memory (~50MB) regardless of input file size, compared to ~11GB for
DOM-based approaches like BaseX.

Usage:
    python3 util/filter-dblp.py < dblp.xml > dblp-filtered.xml
    # Or with gzip:
    gunzip -c dblp-original.xml.gz | python3 util/filter-dblp.py | gzip > dblp.xml.gz

Requirements:
    - Python 3.7+
    - dblp.dtd must be in the current directory (for entity resolution)
"""

import sys
import io
import xml.sax
import xml.sax.handler
from xml.sax.saxutils import escape, quoteattr

# Pre-compile the escape table for faster character escaping
_ESCAPE_MAP = str.maketrans({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
})

def fast_escape(s):
    """Faster escape for common case (no special chars)."""
    # Fast path: check if escaping is needed at all
    if '&' not in s and '<' not in s and '>' not in s:
        return s
    return s.translate(_ESCAPE_MAP)

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


class DBLPFilterHandler(xml.sax.handler.ContentHandler):
    """SAX handler that filters DBLP entries by venue.

    Optimizations:
    - Uses io.StringIO for element buffering (faster than list joins)
    - Reuses character buffer list (clear instead of recreate)
    - Fast-path escape function for common case
    - Batched output writes with periodic flushing
    - Local variable caching for hot-path attributes
    """

    # Output buffer size before flush (characters)
    FLUSH_THRESHOLD = 1024 * 1024  # 1MB

    def __init__(self, output):
        super().__init__()
        self.output = output
        self.output_buffer = io.StringIO()
        self.output_size = 0
        self.in_target_element = False  # Inside inproceedings or article
        self.current_element = None     # Current element type
        self.element_buffer = io.StringIO()  # Buffer for current element's XML
        self.char_buffer = []           # Buffer for character data (reused)
        self.current_tag = None         # Current inner tag name
        self.booktitle = None           # Booktitle value (for inproceedings)
        self.journal = None             # Journal value (for article)
        self.depth = 0                  # Nesting depth within target element
        self.count = 0                  # Count of matched entries
        # Cache set membership checks as local references
        self._booktitles = BOOKTITLES
        self._journals = JOURNALS

    def _flush_output(self):
        """Flush buffered output to the actual output stream."""
        if self.output_size > 0:
            self.output.write(self.output_buffer.getvalue())
            self.output_buffer = io.StringIO()
            self.output_size = 0

    def _write_output(self, s):
        """Write to output buffer, flushing if threshold exceeded."""
        self.output_buffer.write(s)
        self.output_size += len(s)
        if self.output_size >= self.FLUSH_THRESHOLD:
            self._flush_output()

    def startDocument(self):
        self._write_output('<dblp>')

    def endDocument(self):
        self._write_output('</dblp>\n')
        self._flush_output()
        print(f"Filtered {self.count} entries", file=sys.stderr)

    def startElement(self, name, attrs):
        if name == 'inproceedings' or name == 'article':
            self.in_target_element = True
            self.current_element = name
            # Reset element buffer
            self.element_buffer = io.StringIO()
            self.booktitle = None
            self.journal = None
            self.depth = 0
            # Build opening tag with attributes
            write = self.element_buffer.write
            write('<')
            write(name)
            for k, v in attrs.items():
                write(' ')
                write(k)
                write('=')
                write(quoteattr(v))
            write('>')

        elif self.in_target_element:
            self.depth += 1
            self.current_tag = name
            self.char_buffer.clear()  # Reuse list instead of creating new one
            # Build opening tag with attributes
            write = self.element_buffer.write
            write('<')
            write(name)
            for k, v in attrs.items():
                write(' ')
                write(k)
                write('=')
                write(quoteattr(v))
            write('>')

    def endElement(self, name):
        if self.in_target_element:
            if name == self.current_element and self.depth == 0:
                # End of target element - check if it matches
                write = self.element_buffer.write
                write('</')
                write(name)
                write('>')

                should_include = False
                if self.current_element == 'inproceedings':
                    should_include = self.booktitle in self._booktitles
                elif self.current_element == 'article':
                    should_include = self.journal in self._journals

                if should_include:
                    self._write_output(self.element_buffer.getvalue())
                    self.count += 1

                self.in_target_element = False
                self.current_element = None
            else:
                # End of inner element
                content = ''.join(self.char_buffer)
                write = self.element_buffer.write
                write(fast_escape(content))
                write('</')
                write(name)
                write('>')

                # Capture booktitle/journal values
                if name == 'booktitle':
                    self.booktitle = content
                elif name == 'journal':
                    self.journal = content

                self.depth -= 1
                self.current_tag = None

    def characters(self, content):
        if self.current_tag is not None:  # Faster than checking two conditions
            self.char_buffer.append(content)


def main():
    # Create parser with DTD validation for entity resolution
    parser = xml.sax.make_parser()

    # Enable external entity loading for DTD (needed for character entities)
    parser.setFeature(xml.sax.handler.feature_external_ges, True)

    # Output to stdout
    output = sys.stdout

    handler = DBLPFilterHandler(output)
    parser.setContentHandler(handler)

    print("Filtering DBLP (streaming SAX parser)...", file=sys.stderr)

    try:
        parser.parse(sys.stdin)
    except xml.sax.SAXParseException as e:
        print(f"Parse error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
