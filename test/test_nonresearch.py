"""Tests for excluding non-research contributions from the rankings."""

import os
import sys

import pytest

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, os.path.join(ROOT, "util"))

from nonresearch import nonResearchCategory  # noqa: E402

# csrankings.py reads sigcse-research-articles.csv from the working directory.
_cwd = os.getcwd()
os.chdir(ROOT)
try:
    from csrankings import countPaper  # noqa: E402
finally:
    os.chdir(_cwd)


@pytest.mark.parametrize(
    "category,title",
    [
        ("position paper", "Position: Stop Making Unscientific AGI Performance Claims."),
        ("position paper", "A Position Paper on the Automatic Generation of Machine Learning Leaderboards."),
        ("position paper", "Challenges for Refinement and Composition of Instrumentations: Position Paper."),
        ("position paper", "Secure Personal Data Servers: a Vision Paper."),
        ("position paper", "nsDB: Architecting the Next Generation Database (Vision)."),
        ("front matter", "Front Matter."),
        ("front matter", "Editorial."),
        ("front matter", "Editorial: Adversaries and Robustness."),
        ("front matter", "Preface."),
        ("front matter", "AAAI-13 Preface."),
        ("front matter", "Preface - SC 2003: Workshop on Software Composition."),
        ("front matter", "AAAI Organization."),
        ("front matter", "Session details: Keynote Address I."),
        ("front matter", "Session details: Cloud Systems."),
        ("front matter", "Message from the program co-chairs."),
        ("front matter", "Messages: Message from the general chairs."),
        ("front matter", "Welcome Message from the VLDB 2012 General Chairs."),
        ("front matter", "ICDE 2008 General Chairs Message."),
        ("front matter", "Letter from the Editor-in-Chief."),
        ("front matter", "Opening remarks."),
        ("invited talk", "Keynote."),
        ("invited talk", "Keynote: On Subverting Trust."),
        ("invited talk", "Keynote Address: Back to the Future."),
        ("invited talk", "VisWeek Keynote Address."),
        ("invited talk", "Producing software by integration: challenges and research directions (keynote)."),
        ("invited talk", "Invited Talk: Recognition and Understanding of Meetings."),
        ("invited talk", "Learning to Split (Invited Talk)."),
        ("invited talk", "Capstone Address: Self-Illustrating Phenomena."),
        ("invited talk", "The 2013 virtual reality career award."),
        ("panel", "Panel: Experiences with Reusability."),
        ("panel", "Panel - Security and the World Wide Web."),
        ("panel", "The Economics of Software Reuse (Panel)."),
        ("panel", "OO Anthropology: Crossing the Chasm (Panel Session)."),
        ("panel", "Politically Incorrect Languages for Supercomputing - A Panel Discussion."),
        ("tutorial", "Tutorial: Design of a Logic Synthesis System."),
        ("tutorial", "Theorem Proving for Verification (Invited Tutorial)."),
        ("tutorial", "System-Chip Test Strategies (Tutorial)."),
        ("tutorial", "Information complexity: a tutorial."),
        ("tutorial", "A Tutorial on Satisfiability Modulo Theories."),
        ("tutorial", "Embedded tutorial: formal equivalence checking."),
        ("correction", "Corrigendum: Falcon: A Scalable Analytical Cache Model."),
        ("correction", "Erratum: A Dynamic Tradeoff between Active and Passive Corruptions."),
        ("correction", "Retraction: A New Approach to Motion-Planning (Extended Abstract)"),
        ("poster", "Poster paper: HunPos - an open source trigram tagger."),
        ("poster", "Poster reception - Digital Sherpa."),
        ("contest report", "Overview of 2022 CAD Contest at ICCAD."),
        ("contest report", "Report on the tenth ICFP programming contest."),
        ("invited paper", "A Billion SMT Queries a Day (Invited Paper)."),
        ("invited paper", "Invited Paper: Physics-Driven Real-Time CPS Challenge."),
        ("invited paper", "Invited: Software Defined Accelerators From Learning Tools Environment."),
        ("invited paper", "Invited - Heterogeneous datacenters: options and opportunities."),
        ("invited paper", "(Invited) FENIX: Flexible and Efficient Hybrid HE/MPC Acceleration."),
        ("invited paper", "Dynamic Platforms for Uncertainty Management: Invited."),
        ("invited paper", "Learning Based Compact Thermal Modeling: (invited)."),
        ("invited paper", "Research Issues in Manufacturing Flexibility - An Invited Review Paper for ICRA 2000."),
        ("invited paper", "Online and Offline Machine Learning: (Invited - ICCAD Special Session Paper)."),
        ("invited paper", "Mode connectivity in the QCBM loss landscape: ICCAD Special Session Paper."),
        ("invited paper", "Special Session - Predictable Timing Behavior in Distributed Cyber-Physical Systems."),
    ],
)
def test_labelled_titles_are_excluded(category, title):
    assert nonResearchCategory(title) == category


@pytest.mark.parametrize(
    "title",
    [
        # Each of these is a real paper, most of them from the DBLP snapshot.
        "Position-Based Nonlinear Gauss-Seidel for Quasistatic Hyperelasticity.",
        "Position Specific Posterior Lattices for Indexing Speech.",
        "Position/force control of robot manipulators without velocity/force measurements.",
        "On the Emergence of Position Bias in Transformers.",
        "Perspective: A Sensible Approach to Speculative Automatic Parallelization.",
        "Perspectives: Improving SSH-style Host Authentication with Multi-Path Probing.",
        "Vision: Identifying Affected Library Versions for Open Source Software Vulnerabilities.",
        "Large (Vision) Language Models are Unsupervised In-Context Learners.",
        "Cross-Modal Taxonomic Generalization in (Vision-) Language Models.",
        "DeMo: Decoupling Motion Forecasting into Directional Intentions and Dynamic States.",
        "Preface: A Data-driven Volumetric Prior for Few-shot Ultra High-resolution Face Synthesis.",
        "PrefAce: Face-Centric Pretraining with Self-Structure Aware Distillation.",
        "Editorial Comprehension in OpEd through Argument Units.",
        "Introduction to a System for Implementing Neural Net Connections on SIMD Architectures.",
        "Index Merging.",
        "Committee Selection with Intraclass and Interclass Synergies.",
        "KeyNote: Trust Management for Public-Key Infrastructures.",
        "Panel-Specific Degradation Representation for Raw Under-Display Camera Image Restoration.",
        "Business instrument panel: a new paradigm for interfacing with financial data.",
        "Retraction-based RRT planner for articulated models.",
        "TPC: Target-Driven Parallelism Combining Prediction and Correction.",
        "Generating photo manipulation tutorials by demonstration.",
        "Mathematical Domain Reasoning Tasks in Natural Language Tutorial Dialog on Proofs.",
        "A Pedagogical Analysis of Online Coding Tutorials.",
        "Space-Optimized Texture Maps (Guenter Enderle [Best Paper] Award.",
        "A Programming Contest Strategy Guide.",
        "Human vs. Generative AI in Content Creation Competition: Symbiosis or Conflict?",
        "Stop the Nonconsensual Use of Nude Images in Research.",  # Only its URL says so.
        "Uninvited Guests: Analyzing the Identity and Behavior of Certificate Transparency Bots.",
        '"It Feels Like I am Invited to Communicate": Mediating Ad-Hoc Interruptions.',
    ],
)
def test_research_titles_are_kept(title):
    assert nonResearchCategory(title) is None


@pytest.mark.parametrize(
    "category,url",
    [
        ("position paper", "http://papers.nips.cc/paper_files/paper/2025/hash/657f1d2c3b933f534f3737125f7b6429-Abstract-Position_Paper_Track.html"),
        ("doctoral consortium", "http://www.aaai.org/ocs/index.php/DC/DC11/paper/view/3464"),
        ("invited talk", "https://www.usenix.org/conference/usenixsecurity21/presentation/keynote-landau"),
        ("invited talk", "https://www.usenix.org/conference/atc22/presentation/tues-keynote"),
        ("invited talk", "https://www.usenix.org/conference/fast22/presentation/keynote"),
        ("panel", "https://www.usenix.org/conference/usenixsecurity20/presentation/panel-voting"),
        ("non-main track", "http://papers.nips.cc/paper_files/paper/2022/hash/0a1b-Abstract-Datasets_and_Benchmarks.html"),
        ("non-main track", "http://papers.nips.cc/paper_files/paper/2025/hash/0a1b-Abstract-Datasets_and_Benchmarks_Track.html"),
        # Tracks that DBLP has not listed yet must not count by default.
        ("non-main track", "https://proceedings.neurips.cc/paper_files/paper/2026/hash/0a1b-Abstract-Evaluations_and_Datasets_Track.html"),
        ("non-main track", "https://papers.nips.cc/paper_files/paper/2026/hash/0a1b-Abstract-Creative_AI_Track.html"),
    ],
)
def test_non_research_urls_are_excluded(category, url):
    assert nonResearchCategory("Some Title.", [url]) == category


@pytest.mark.parametrize(
    "url",
    [
        "http://papers.nips.cc/paper_files/paper/2025/hash/0a1b-Abstract-Conference.html",
        "https://proceedings.neurips.cc/paper/2020/hash/0a1b-Abstract.html",
        "http://www.aaai.org/ocs/index.php/AAAI/AAAI11/paper/view/3464",
        "https://www.usenix.org/conference/usenixsecurity23/presentation/campanelli",
        "https://www.usenix.org/conference/usenixsecurity23/presentation/panelli",
    ],
)
def test_research_urls_are_kept(url):
    assert nonResearchCategory("Some Title.", [url]) is None


def test_any_ee_url_can_exclude():
    urls = [
        "https://doi.org/10.1234/abc",
        "http://papers.nips.cc/paper_files/paper/2025/hash/0a1b-Abstract-Position_Paper_Track.html",
    ]
    assert nonResearchCategory("Some Title.", urls) == "position paper"


@pytest.mark.parametrize(
    "category,dblpUrl",
    [
        ("course", "db/conf/siggrapha/siggrapha2019courses.html#JorgeCL19"),
        ("workshop", "db/conf/ijcai/ijcai2019w.html#ZhangVP19"),
    ],
)
def test_non_research_tables_of_contents_are_excluded(category, dblpUrl):
    assert nonResearchCategory("Some Title.", (), dblpUrl) == category


@pytest.mark.parametrize(
    "dblpUrl",
    [
        "db/conf/ijcai/ijcai2019.html#X19",
        "db/conf/oopsla/oopsla2004p.html#X04",
        "db/conf/usenix/usenix2005g.html#X05",
        "db/journals/pacmpl/pacmpl9.html#X25",
        "",
    ],
)
def test_research_tables_of_contents_are_kept(dblpUrl):
    assert nonResearchCategory("Some Title.", (), dblpUrl) is None


def _count(confname, year, pages, title="A Paper.", ee=(), url="", pageCount=-1):
    return countPaper(confname, year, "0", "0", pages, -1, pageCount, url, title, ee)


def test_count_paper_applies_title_and_url_rules():
    assert _count("ICML", 2024, "1-16", pageCount=16)
    assert not _count("ICML", 2024, "1-16", "Position: Foo Should Bar.", pageCount=16)
    assert _count("NeurIPS", 2025, "")
    assert not _count(
        "NeurIPS", 2025, "",
        ee=["http://papers.nips.cc/paper_files/paper/2025/hash/0-Abstract-Position_Paper_Track.html"],
    )
    assert not _count("SIGGRAPH Asia", 2019, "1-33", url="db/conf/siggrapha/siggrapha2019courses.html#X", pageCount=33)


def test_count_paper_ee_is_optional():
    assert countPaper("NeurIPS", 2025, "0", "0", "", -1, -1, "", "A Paper.")


@pytest.mark.parametrize(
    "pages,counted",
    [
        ("44", False),  # Birds of a feather
        ("45", True),   # Gordon Bell finalist
        ("50", True),
        ("51", False),  # Invited talks
        ("69", False),  # Panel
        ("73", False),
        ("74", True),   # Technical program
        ("127", True),
        ("128", False),  # Student research competition
        ("150", False),  # Poster
        ("213", False),  # Tutorial
        ("0", False),    # Keynote
    ],
)
def test_sc_2006_counts_only_technical_papers(pages, counted):
    assert _count("SC", 2006, pages, pageCount=0) is counted


def test_sc_article_numbers_only_matter_in_2006():
    assert _count("SC", 2005, "150", pageCount=0)
    assert _count("SC", 2007, "150", pageCount=0)


def test_process_article_passes_ee_to_the_filter(monkeypatch):
    """The example that motivated this: a NeurIPS position paper with no pages."""
    etree = pytest.importorskip("lxml.etree")
    monkeypatch.setattr(sys, "argv", ["regenerate_data"])
    monkeypatch.chdir(ROOT)
    import regenerate_data

    template = """<inproceedings key="conf/nips/CintaqiaARKMQ25">
        <author>Elissa M. Redmiles</author>
        <title>Stop the Nonconsensual Use of Nude Images in Research.</title>
        <year>2025</year>
        <booktitle>NeurIPS</booktitle>
        <ee type="oa">http://papers.nips.cc/paper_files/paper/2025/hash/657f-Abstract-{track}.html</ee>
        <url>db/conf/nips/neurips2025.html#CintaqiaARKMQ25</url>
    </inproceedings>"""
    for track, counted in [("Position_Paper_Track", False), ("Conference", True)]:
        elem = etree.fromstring(template.format(track=track))
        assert (regenerate_data.process_article(elem, None, True) is not None) is counted


@pytest.mark.parametrize(
    "confname,year,url",
    [
        ("ICCAD", 2017, "db/conf/iccad2/iccad2017.html#X17"),
        ("ICS", 2020, "db/conf/intcompsymp/ics2020.html#X20"),
        ("IMC", 2009, "db/conf/imc2/imc2009.html#X09"),
        ("SC", 2012, "db/conf/soco/sc2012.html#X12"),
        ("SC", 2004, "db/journals/entcs/entcs114.html#X04"),
        ("ICLR", 2025, "db/conf/icbinb/icbinb2025.html#X25"),
        ("SIGMETRICS", 1982, "db/conf/cnps/cnps1982.html#X82"),
    ],
)
def test_other_conferences_with_the_same_booktitle_are_excluded(confname, year, url):
    assert not _count(confname, year, "1-10", url=url, pageCount=10)


@pytest.mark.parametrize(
    "confname,year,url",
    [
        ("ICCAD", 2017, "db/conf/iccad/iccad2017.html#X17"),
        ("ICS", 2020, "db/conf/ics/ics2020.html#X20"),
        ("IMC", 2009, "db/conf/imc/imc2009.html#X09"),
        ("SC", 2012, "db/conf/sc/sc2012.html#X12"),
        ("ICLR", 2025, "db/conf/iclr/iclr2025.html#X25"),
        ("SIGMETRICS", 1982, "db/conf/sigmetrics/sigmetrics1982.html#X82"),
        # A series is only wrong for the booktitle it collides with.
        ("Foo", 2017, "db/conf/iccad2/iccad2017.html#X17"),
    ],
)
def test_the_real_conferences_are_kept(confname, year, url):
    assert _count(confname, year, "1-10", url=url, pageCount=10)


def test_only_the_eurographics_issue_of_cgf_counts():
    # regenerate_data.py renames the Eurographics issue, so anything else is not it.
    assert not _count("Comput. Graph. Forum", 2023, "1-10", pageCount=10)
    assert _count("EUROGRAPHICS", 2023, "1-10", pageCount=10)
    assert not _count("EUROGRAPHICS", 2023, "1-10", "A Survey on SPH Methods in Computer Graphics.", pageCount=10)
    assert not _count("EUROGRAPHICS", 2023, "1-10", "State-of-the-art in Sketch Processing.", pageCount=10)


def test_eurographics_2024_survives_placeholder_pages():
    assert _count("EUROGRAPHICS", 2024, "i-iii", pageCount=0)
    assert not _count("EUROGRAPHICS", 2023, "i-iii", pageCount=0)


def test_track_list_is_well_formed_and_applied():
    import csv

    with open(os.path.join(ROOT, "non-research-papers.csv"), encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    assert rows
    assert len({row["key"] for row in rows}) == len(rows)
    for row in rows:
        assert row["key"].startswith(("conf/", "journals/")), row
        assert row["track"] and row["source"].startswith("https://"), row
    row = rows[0]
    assert nonResearchCategory("Some Title.", (), "", row["key"]) == row["track"]
    assert nonResearchCategory("Some Title.", (), "", "conf/foo/NotListed99") is None
    assert not countPaper("KDD", 2025, "0", "0", "1-10", 1, 10, "", "A Paper.", (), row["key"])


def test_mobicom_2024_counts_only_research_pages():
    def count(year, start):
        return countPaper("MobiCom", year, "0", "0", f"{start}-{start + 14}", start, 15, "", "A Paper.")

    assert count(2024, 1560)
    assert not count(2024, 1826)
    assert count(2023, 1826)
