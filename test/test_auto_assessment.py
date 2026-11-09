"""Tests for the automated VALIDATION.md assessment: score caps and merge gates."""
import json
import lzma
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "util"))

import auto_merge  # noqa: E402
from dblp_local import DblpIndex  # noqa: E402
import validate_commit as vc  # noqa: E402
import validate_homepage as vh  # noqa: E402
import validate_prs as vp  # noqa: E402

SITES = {"Hanyang University": "hanyang.ac.kr", "Stanford University": "stanford.edu"}
FOOTER = "Automated validation analysis based on [VALIDATION.md]"


def criterion(verdict="pass", status="confirmed", url="https://cs.stanford.edu/jane"):
    return {"verdict": verdict, "status": status, "source_url": url}


def assessment(**criteria):
    fields = {field: criterion() for field in
              ("tenure_track", "phd_advising", "full_time", "cs_department")}
    fields.update(criteria)
    return {"entries": [{"name": "Jane Doe", "person_on_evidence_page": True,
                         "institution_link": "named on https://cs.stanford.edu/jane",
                         "homepage": "https://janedoe.github.io/", "phd_page_names_person": True,
                         "criteria": fields}],
            "removals": [],
            "affiliations": {"Jane Doe": "Stanford University"}}


def blockers(result=None, score=95, labels=(), files=("csrankings-j.csv",), passed=True):
    return auto_merge.merge_blockers(assessment() if result is None else result,
                                     score, list(labels), list(files), SITES, passed)


def test_clean_pr_may_merge():
    assert blockers() == []


@pytest.mark.parametrize("kwargs, reason", [
    ({"score": 79}, "below"),
    ({"score": None}, "below"),
    ({"labels": ["hold"]}, "hold"),
    ({"labels": ["stale"]}, "stale"),
    ({"files": ["csrankings-j.csv", ".github/workflows/x.yml"]}, "only change"),
    ({"files": ["old/industry.csv"]}, "only change"),
    ({"files": []}, "only change"),
    ({"passed": False}, "mechanical"),
])
def test_each_gate_blocks(kwargs, reason):
    assert any(reason in blocker for blocker in blockers(**kwargs))


def test_missing_assessment_blocks():
    assert auto_merge.merge_blockers(None, 99, [], ["csrankings-j.csv"], SITES, True)


def test_removal_blocks():
    result = assessment()
    result["removals"] = ["John Roe"]
    assert any("removes" in blocker for blocker in blockers(result))


def test_evidence_on_their_personal_site_is_allowed():
    result = assessment(phd_advising=criterion(url="https://janedoe.github.io/"),
                        cs_department=criterion(url="https://www.janedoe.github.io/about"))
    assert blockers(result) == []


def test_someone_elses_github_pages_site_is_not_their_homepage():
    result = assessment(cs_department=criterion(url="https://other.github.io/"))
    assert any("neither" in blocker for blocker in blockers(result))


def test_a_students_cv_can_show_phd_advising_if_it_names_them():
    result = assessment(phd_advising=criterion(url="https://astudent.github.io/cv/"))
    assert blockers(result) == []
    result["entries"][0]["phd_page_names_person"] = False
    assert any("does not name them" in blocker for blocker in blockers(result))


def test_third_party_sites_are_not_allowed_as_evidence():
    result = assessment(cs_department=criterion(url="https://scholarlink.example/jane"))
    assert any("neither" in blocker for blocker in blockers(result))


def test_a_personal_site_needs_an_independent_link():
    result = assessment(phd_advising=criterion(url="https://janedoe.github.io/"))
    result["entries"][0]["institution_link"] = None
    assert any("nothing independent" in blocker for blocker in blockers(result))


def test_an_official_page_with_a_different_title_blocks():
    result = assessment()
    result["entries"][0]["official_title_conflict"] = True
    assert any("different title" in blocker for blocker in blockers(result))


def test_rank_rule_needs_the_phd_program_on_the_official_site():
    result = assessment(phd_advising=criterion(url="https://janedoe.github.io/"))
    result["entries"][0]["phd_advising_basis"] = "rank_in_cs_department"
    assert any("PhD program" in blocker for blocker in blockers(result))


@pytest.mark.parametrize("url", ["https://stanford.edu.evil.com/x", "https://evilstanford.edu/x"])
def test_lookalike_hosts_are_not_the_institution(url):
    result = assessment(cs_department=criterion(url=url))
    assert any("neither" in blocker for blocker in blockers(result))


@pytest.mark.parametrize("evidence", [
    criterion(status="unreachable"), criterion(status="unsupported"), criterion(verdict="unverified"),
])
def test_unconfirmed_evidence_blocks(evidence):
    assert any("not a confirmed pass" in b for b in blockers(assessment(tenure_track=evidence)))


def test_unknown_institution_blocks():
    result = assessment()
    result["affiliations"] = {"Jane Doe": "Unknown College"}
    assert any("institutions.csv" in blocker for blocker in blockers(result))


@pytest.mark.parametrize("url, site", [
    ("https://cse.hanyang.ac.kr/eng/", "hanyang.ac.kr"),
    ("https://www.cs.stanford.edu/", "stanford.edu"),
    ("https://cs.tsinghua.edu.cn/", "tsinghua.edu.cn"),
    ("https://www.ox.ac.uk/", "ox.ac.uk"),
])
def test_site_of(url, site):
    assert auto_merge.site_of(url) == site


def audited(likelihood=95, classification="valid", fabricated=(), **statuses):
    results = {}
    for field in ("tenure_track", "phd_advising", "full_time", "cs_department"):
        verdict, status = statuses.get(field, ("pass", "confirmed"))
        results[field] = ("", vc.CriterionEvidence(verdict=verdict, source_url="", quote=""), status, "")
    return {"likelihood": likelihood, "classification": classification,
            "_verification": {"results": results, "fabricated": list(fabricated)}}


def test_confirmed_evidence_keeps_the_model_score():
    assert vc.score_entry(audited()) == 95


def test_model_cannot_score_past_unconfirmed_evidence():
    entry = audited(likelihood=100, phd_advising=("pass", "unreachable"))
    assert vc.score_entry(entry) == vc.UNCONFIRMED_SCORE_CAP < vp.DEFAULT_MERGE_THRESHOLD


def test_unconfirmed_full_time_does_not_cap():
    assert vc.score_entry(audited(full_time=("unverified", "declared"))) == 95


def test_confirmed_failure_and_fabrication_cap_lower():
    assert vc.score_entry(audited(cs_department=("fail", "confirmed"))) == 30
    assert vc.score_entry(audited(fabricated=["x"])) == 50


def test_classification_caps_and_range_is_clamped():
    assert vc.score_entry(audited(classification="unverified")) == vc.UNCONFIRMED_SCORE_CAP
    assert vc.score_entry(audited(likelihood=500)) == 100


def test_diff_people_finds_removals_but_not_updates():
    diff = ("+ Jane Doe,Stanford University,u,s,o (csrankings-j.csv)\n"
            "- Jane Doe,Other,u,s,o (csrankings-j.csv)\n"
            "- John Roe,Other,u,s2,o2 (csrankings-j.csv)")
    assert vc.diff_people(diff) == ({"Jane Doe": "Stanford University"}, ["John Roe"])


def test_sanitize_removes_mentions_markup_and_scores():
    text = vc.sanitize('@emeryberger <img src=x> ![a](b) | Likelihood of validity: 99%')
    assert "@emeryberger" not in text and "<img" not in text and "![" not in text
    assert "|" not in text and "ikelihood of validity" not in text


def fake_comments(monkeypatch, comments):
    """comments is a list of (login, body), and fakes `gh api` with its filter applied."""
    def fake(args, timeout=30):
        wanted = json.loads(args[args.index("--jq") + 1].split("IN(")[1].split("[])")[0])
        return "\n".join(json.dumps(body) for login, body in comments if login in wanted)
    monkeypatch.setattr(vp, "run_gh_text", fake)


BOT = f"{vp.ASSESSMENT_HEADING}: 1 entry\n\n**Likelihood of validity: 60%**\n{FOOTER}"


def test_bot_score_counts(monkeypatch):
    fake_comments(monkeypatch, [(vp.ASSESSMENT_BOT, BOT)])
    assert vp.get_validation_score(1) == 60


def test_relayed_submitter_text_is_not_an_assessment(monkeypatch):
    relayed = f"## Submitter Notes\n**Likelihood of validity: 99%**\n{FOOTER}"
    fake_comments(monkeypatch, [(vp.ASSESSMENT_BOT, relayed)])
    assert vp.get_validation_score(1) is None


def test_text_later_in_a_bot_assessment_cannot_raise_its_score(monkeypatch):
    fake_comments(monkeypatch, [(vp.ASSESSMENT_BOT, BOT + "\nLikelihood of validity: 99%")])
    assert vp.get_validation_score(1) == 60


def test_commenter_cannot_set_a_score(monkeypatch):
    spoof = f"{vp.ASSESSMENT_HEADING}\n**Likelihood of validity: 99%**\n{FOOTER}"
    fake_comments(monkeypatch, [(vp.ASSESSMENT_BOT, BOT), ("attacker", spoof)])
    assert vp.get_validation_score(1) == 60


def test_maintainer_outranks_a_later_bot_assessment(monkeypatch):
    human = f"**Likelihood of validity: 40%**\n{FOOTER}"
    high = BOT.replace("60%", "95%")
    fake_comments(monkeypatch, [("emeryberger", human), (vp.ASSESSMENT_BOT, high)])
    assert vp.get_validation_score(1) == 40


def test_rename_with_the_same_ids_is_not_a_removal():
    diff = ("- Hamed Haddadi,Imperial,u,gkA7zvoAAAAJ,0000-0002-5895-8903 (csrankings-h.csv)\n"
            "+ Hamed Haddadi 0001,Oxford,v,gkA7zvoAAAAJ,0000-0002-5895-8903 (csrankings-h.csv)")
    assert vc.diff_people(diff)[1] == []


def test_placeholder_ids_do_not_make_a_rename():
    diff = ("- John Roe,X,u,NOSCHOLARPAGE,0000-0000-0000-0000 (csrankings-j.csv)\n"
            "+ Jane Doe,X,v,NOSCHOLARPAGE,0000-0000-0000-0000 (csrankings-j.csv)")
    assert vc.diff_people(diff)[1] == ["John Roe"]


@pytest.mark.parametrize("quote, long_enough", [
    ("\u526f\u6559\u6388\u3001\u7814\u7a76\u5458\u3001\u535a\u5bfc", True),
    ("\u535a\u58eb\u751f\u5bfc\u5e08", False),
    ("Professor of CS", True),
    ("Professor", False),
])
def test_cjk_quotes_can_be_long_enough(quote, long_enough):
    assert (vc.quote_strength(quote) >= vc.MIN_QUOTE_CHARS) == long_enough


class FakeResponse:
    def __init__(self, content, content_type, apparent="utf-8"):
        self.content, self.headers = content, {"Content-Type": content_type}
        self.encoding, self.apparent_encoding = "ISO-8859-1", apparent

    @property
    def text(self):
        return self.content.decode(self.encoding)


CHINESE = "\u535a\u58eb\u751f\u5bfc\u5e08"


@pytest.mark.parametrize("response", [
    FakeResponse(CHINESE.encode("utf-8"), "text/html"),
    FakeResponse(f'<meta charset="gbk">{CHINESE}'.encode("gbk"), "text/html", apparent="ascii"),
    FakeResponse(f'<meta charset="nonsense">{CHINESE}'.encode("utf-8"), "text/html"),
])
def test_pages_without_a_header_charset_decode_correctly(response):
    assert CHINESE in vh.decode_response(response)


def test_a_header_charset_is_respected():
    response = FakeResponse(b"caf\xe9", "text/html; charset=latin-1")
    response.encoding = "latin-1"
    assert vh.decode_response(response) == "caf\u00e9"


def test_industry_roles_block_merging():
    result = assessment()
    result["entries"][0]["current_industry_roles"] = ["Chief Scientist at Example"]
    assert any("industry roles" in blocker for blocker in blockers(result))


def test_listing_in_the_industry_file_blocks_merging():
    found = auto_merge.merge_blockers(assessment(), 95, [], ["csrankings-j.csv"], SITES, True,
                                      industry_names=frozenset({"Jane Doe"}))
    assert any("industry.csv" in blocker for blocker in found)


def test_the_real_industry_file_loads():
    assert auto_merge.load_industry_names()


def rank_entry(monkeypatch, title="Assistant Professor of Computer Science",
               program="The department offers a Ph.D. in Computer Science", page=None):
    entry = audited()
    results = entry["_verification"]["results"]
    results["tenure_track"][1].quote = title
    results["tenure_track"][1].source_url = "https://cs.example.edu/jane"
    results["phd_advising"][1].quote = program
    entry["name"], entry["dblp_name"] = "Jane Doe", "Jane Doe 0001"
    entry["phd_advising_basis"] = "rank_in_cs_department"
    monkeypatch.setattr(vc, "fetch_page_text", lambda url: page or f"Jane Doe\n{title}")
    return entry


@pytest.mark.parametrize("country", ["us", "ca"])
def test_rank_rule_counts_in_the_us_and_canada(monkeypatch, country):
    assert vc.score_entry(rank_entry(monkeypatch), country) == 95


@pytest.mark.parametrize("country", ["kr", "cn", "gb", None])
def test_rank_rule_does_not_count_elsewhere(monkeypatch, country):
    assert vc.score_entry(rank_entry(monkeypatch), country) == vc.UNCONFIRMED_SCORE_CAP


@pytest.mark.parametrize("title", [
    "Assistant Professor of Teaching", "Research Assistant Professor", "Clinical Professor",
    "Professor of Practice", "Adjunct Professor", "Visiting Professor", "Lecturer", "Researcher",
])
def test_rank_rule_needs_a_tenure_track_title(monkeypatch, title):
    assert vc.score_entry(rank_entry(monkeypatch, title=title), "us") == vc.UNCONFIRMED_SCORE_CAP


DIRECTORY = """Roe, John
Assistant Professor
Poe, Ann
Professor of Instruction
Doe, Jane
Assistant Professor of Instruction
Loe, Max
Assistant Professor
"""


def test_a_quote_cropped_from_a_qualified_title_is_caught(monkeypatch):
    entry = rank_entry(monkeypatch, title="Assistant Professor", page=DIRECTORY)
    assert vc.score_entry(entry, "us") == vc.UNCONFIRMED_SCORE_CAP


def test_someone_elses_title_in_a_directory_does_not_count(monkeypatch):
    page = "Roe, John\nAssistant Professor\nDoe, Jane\nLecturer\nLoe, Max\nAssistant Professor"
    entry = rank_entry(monkeypatch, title="Assistant Professor", page=page)
    assert vc.score_entry(entry, "us") == vc.UNCONFIRMED_SCORE_CAP


# UTC's CSE directory: each card's name heading is split across two lines, and the
# card ends with a "More info about <name>" link, right before the next card.
SPLIT_NAME_DIRECTORY = """Image
Jane
\t\t\tDoe
PhD
Computer Science and Engineering: Assistant Professor
[email protected]
More info
about Jane Doe
Image
William
\t\t\tWorden
Computer Science and Engineering: Assistant Professor of Practice
"""


def test_a_name_split_across_lines_finds_its_own_card():
    assert vc.nearest_title("Jane Doe", SPLIT_NAME_DIRECTORY) == "unqualified"
    assert not vc.official_title_conflicts("Jane Doe", SPLIT_NAME_DIRECTORY, "us")


def test_the_next_cards_title_is_still_caught_when_it_is_theirs():
    page = SPLIT_NAME_DIRECTORY.replace("Engineering: Assistant Professor\n",
                                        "Engineering: Assistant Professor of Practice\n", 1)
    assert vc.official_title_conflicts("Jane Doe", page, "us")


def test_a_name_split_across_lines_does_not_join_two_people():
    assert not vc.lines_naming("Jane Doe", "Jane Smith\nand John Doe")[1]


@pytest.mark.parametrize("name,page", [
    ("Md. Imran Hossen", "Image\nImran Hossen\nAssistant Professor"),
    ("Md Imran Hossen", "Dr. Md Imran Hossen\nAssistant Professor"),
    ("Mohammad Ali Khan", "Hossen, Imran\nAli Khan\nProfessor"),
    ("Imran Hossen", "Md. Imran Hossen\nAssistant Professor"),
])
def test_a_leading_md_prefix_is_optional(name, page):
    assert vc.lines_naming(name, page)[1]


def test_a_prefix_is_kept_when_only_one_name_would_remain():
    assert not vc.lines_naming("Muhammad Ali", "Ali Khan\nProfessor")[1]
    assert not vc.lines_naming("Md. Imran Hossen", "Md. Rafiq Hossen\nProfessor")[1]


def test_a_page_that_does_not_name_the_person_fails(monkeypatch):
    entry = rank_entry(monkeypatch, title="Assistant Professor", page="John Roe\nAssistant Professor")
    assert vc.score_entry(entry, "us") == vc.UNCONFIRMED_SCORE_CAP
    assert not vc.person_on_evidence_page(entry)


@pytest.mark.parametrize("page", [
    "Doe, Jane\nAssistant Professor\nResearch Areas",
    "Jane Q. Doe\nAssociate Professor",
    "Assistant Professor\nJane Doe\nResearch Interests",
    "Dr. Jane Doe is an Assistant Professor in the Department of Computer Science. Her research is on systems.",
    "JANE DOE\nProfessor\nDepartment of Computer Science",
    "J\u00e4ne Doe\nFull Professor",
])
def test_ordinary_layouts_pass(page):
    assert vc.tenure_title_near_name("Jane Doe 0001", page)


def test_page_without_the_name_blocks_merging():
    result = assessment()
    result["entries"][0]["person_on_evidence_page"] = False
    assert any("does not name them" in blocker for blocker in blockers(result))


def test_a_different_person_sharing_a_first_name_does_not_match():
    assert not vc.lines_naming("Jane Doe", "Jane Smith and John Doe")[1]


def test_rank_rule_needs_evidence_of_a_phd_program(monkeypatch):
    entry = rank_entry(monkeypatch, program="The department offers a Master of Science")
    assert vc.score_entry(entry, "us") == vc.UNCONFIRMED_SCORE_CAP


@pytest.fixture
def dblp(monkeypatch, tmp_path):
    snapshot = tmp_path / "dblp.xml.xz"
    with lzma.open(snapshot, "wb") as f:
        f.write(b"""<dblp>
<inproceedings key="a"><author orcid="0000-0002-8188-3751">Dimitrios Kollias</author></inproceedings>
<inproceedings key="b"><author orcid="0000-0003-0034-0358">Yanan Guo 0002</author></inproceedings>
</dblp>""")
    aliases = tmp_path / "dblp-aliases.csv"
    aliases.write_text("alias,name\nDimitrios Kollias,Dimitris Kollias\n", encoding="utf-8")
    monkeypatch.setattr(vc, "get_dblp_index", lambda: DblpIndex(str(snapshot), str(aliases)))


def test_orcid_on_an_alias_of_the_submitted_name_is_not_an_error(dblp, capsys):
    assert vc.check_dblp_name(1, "Dimitris Kollias", "0000-0002-8188-3751")
    output = capsys.readouterr().out
    assert "credited to `Dimitris Kollias`" in output and "Use that DBLP name" not in output


def test_orcid_on_an_unrelated_name_is_still_an_error(dblp, capsys):
    assert not vc.check_dblp_name(1, "Yanan Guo", "0000-0003-0034-0358")
    assert "Use that DBLP name" in capsys.readouterr().out


def rank_entry_on_own_site(monkeypatch, page):
    entry = rank_entry(monkeypatch, title="assistant professor", page=page)
    entry["_homepage"] = "https://cs.example.edu/jane"
    return entry


def test_rank_rule_accepts_first_person_on_their_own_site(monkeypatch):
    entry = rank_entry_on_own_site(monkeypatch, "I am an assistant professor of computer science.")
    assert vc.score_entry(entry, "us") == 95


def test_a_directory_as_homepage_judges_their_own_card(monkeypatch):
    # The PR's homepage is the department directory, which also lists someone
    # else as "Assistant Professor of Practice" (UTC, PR #15509).
    page = "Jane Doe\nAssistant Professor\nWilliam Worden\nAssistant Professor of Practice"
    entry = rank_entry_on_own_site(monkeypatch, page)
    entry["_homepage"] = entry["_verification"]["results"]["tenure_track"][1].source_url
    assert vc.score_entry(entry, "us") == 95


def test_a_directory_as_homepage_still_catches_their_own_qualified_title(monkeypatch):
    page = "Jane Doe\nAssistant Professor of Practice\nWilliam Worden\nAssistant Professor"
    entry = rank_entry_on_own_site(monkeypatch, page)
    entry["_homepage"] = entry["_verification"]["results"]["tenure_track"][1].source_url
    assert vc.score_entry(entry, "us") == vc.UNCONFIRMED_SCORE_CAP


def test_a_title_cropped_on_their_own_site_is_caught(monkeypatch):
    entry = rank_entry_on_own_site(monkeypatch, "I am an assistant professor of teaching.")
    assert vc.score_entry(entry, "us") == vc.UNCONFIRMED_SCORE_CAP


def linked_entry(url="https://cs.stanford.edu/people", homepage="https://janedoe.github.io/"):
    entry = audited()
    entry.update(name="Jane Doe", dblp_name="Jane Doe", _homepage=homepage, official_listing_url=url)
    return entry


def test_official_listing_links_a_personal_site(monkeypatch):
    monkeypatch.setattr(vc, "fetch_page_text", lambda url: "Doe, Jane\nAssistant Professor")
    found = vc.find_institution_link(linked_entry(), "Stanford University", "", SITES)
    assert "named on" in found["link"] and not found["conflict"]


def test_official_listing_with_a_lesser_title_conflicts(monkeypatch):
    monkeypatch.setattr(vc, "fetch_page_text", lambda url: "Doe, Jane\nAssistant Professor of Instruction")
    assert vc.find_institution_link(linked_entry(), "Stanford University", "", SITES)["conflict"]


def test_official_lecturer_listing_conflicts_only_in_the_us_and_canada(monkeypatch):
    monkeypatch.setattr(vc, "fetch_page_text", lambda url: "Doe, Jane\nLecturer")
    find = lambda country: vc.find_institution_link(linked_entry(), "Stanford University", "", SITES, country)
    assert find("us")["conflict"] and find("ca")["conflict"]
    assert not find("gb")["conflict"] and not find("au")["conflict"]


def test_a_listing_on_another_site_is_not_a_link(monkeypatch):
    monkeypatch.setattr(vc, "fetch_page_text", lambda url: "Doe, Jane\nAssistant Professor")
    monkeypatch.setattr(vc, "get_dblp_index", lambda: None)
    entry = linked_entry(url="https://evil.example/stanford")
    assert vc.find_institution_link(entry, "Stanford University", "", SITES)["link"] is None


ORCID = "0000-0002-8188-3751"
JOB = {"organization": {"name": "The Stanford University"}, "role-title": "Assistant Professor"}


@pytest.fixture
def orcid_dblp(monkeypatch, tmp_path):
    snapshot = tmp_path / "dblp.xml.xz"
    with lzma.open(snapshot, "wb") as f:
        f.write(f'<dblp><inproceedings key="a"><author orcid="{ORCID}">Jane Doe</author></inproceedings></dblp>'.encode())
    aliases = tmp_path / "dblp-aliases.csv"
    aliases.write_text("alias,name\n", encoding="utf-8")
    monkeypatch.setattr(vc, "get_dblp_index", lambda: DblpIndex(str(snapshot), str(aliases)))


@pytest.mark.parametrize("job, expected", [
    (JOB, True),
    ({**JOB, "end-date": {"year": {"value": "2020"}}}, False),
    ({**JOB, "role-title": "PhD Student"}, False),
    ({**JOB, "role-title": "Research Assistant Professor"}, False),
    ({**JOB, "role-title": None}, False),
    ({**JOB, "organization": {"name": "Harvard University"}}, False),
])
def test_orcid_link_needs_a_current_professorship_there(monkeypatch, orcid_dblp, job, expected):
    monkeypatch.setattr(vc, "fetch_orcid_employments", lambda orcid: [job])
    assert vc.orcid_links_to_institution("Jane Doe", ORCID, "Stanford University") is expected


def test_orcid_link_needs_dblp_to_attach_it_to_the_name(monkeypatch, orcid_dblp):
    monkeypatch.setattr(vc, "fetch_orcid_employments", lambda orcid: [JOB])
    assert not vc.orcid_links_to_institution("John Roe", ORCID, "Stanford University")
    assert not vc.orcid_links_to_institution("Jane Doe", "0000-0000-0000-0000", "Stanford University")


@pytest.mark.parametrize("quote", [
    "The department offers a Doctor of Philosophy in Computer Science.",
    "With a PhD in Computer Science from UIC",
    "offered at the master's and doctoral levels",
    "getting a Ph.D. in Computer Science",
])
def test_ways_of_naming_a_phd_program(quote):
    assert vc.PHD_PROGRAM.search(quote)


def unverified_full_time_entry(roles=()):
    entry = audited()
    entry["_score"], entry["name"], entry["current_industry_roles"] = 90, "Jane Doe", list(roles)
    results = entry["_verification"]["results"]
    label, ev, _status, detail = results["full_time"]
    ev.verdict, ev.quote, ev.source_url = "unverified", None, None
    results["full_time"] = (label, ev, "declared", detail)
    return entry


def time_row(entry):
    return [line for line in vc.render_assessment([entry], 90, [], "abc").splitlines()
            if line.startswith("| >=75%")]


def test_time_appointment_is_assumed_without_evidence_against_it():
    entry = unverified_full_time_entry()
    assert time_row(entry) == [
        "| >=75% time appointment | ✅ Assumed | No evidence of a part-time or industry appointment |"]
    assert "unverified, declared" not in vc.render_assessment([entry], 90, [], "abc")


def test_time_appointment_needs_a_check_when_industry_roles_are_mentioned():
    entry = unverified_full_time_entry(roles=["CTO, Example Inc."])
    assert time_row(entry) == [
        "| >=75% time appointment | ⚠️ Check | Industry roles were mentioned; see below |"]


def test_an_unverified_criterion_reads_as_words():
    entry = audited()
    entry["_score"], entry["name"] = 90, "Jane Doe"
    results = entry["_verification"]["results"]
    label, ev, _status, detail = results["phd_advising"]
    ev.verdict, ev.quote, ev.source_url = "unverified", None, None
    results["phd_advising"] = (label, ev, "declared", detail)
    rows = [line for line in vc.render_assessment([entry], 90, [], "abc").splitlines()
            if line.startswith("| Can solely")]
    assert rows == ["| Can solely advise CS PhD students | ⚠️ Not verified | No page found that states this |"]


@pytest.mark.parametrize("role,substantive", [
    ("Member, Board of Advisors, Example Inc.", False),
    ("Scientific Advisory Board, Acme AI", False),
    ("Serves on the board of directors for startups (unnamed)", False),
    ("Advisor to Example Robotics", False),
    ("Co-founder and board member, Example Inc.", True),
    ("Chief Scientist at Example", True),
    ("CTO, Example Inc.", True),
    ("Research scientist, Google (part-time)", True),
])
def test_board_and_advisory_roles_are_not_industry_roles(role, substantive):
    kept, advisory = vc.split_industry_roles([role])
    assert (kept == [role]) == substantive and (advisory == [role]) != substantive


def test_advisory_roles_are_shown_as_information_not_a_check():
    entry = unverified_full_time_entry()
    entry["advisory_roles"] = ["Board of Advisors, Example Inc."]
    out = vc.render_assessment([entry], 90, [], "abc")
    assert "✅ Assumed" in out and "not evidence against the 75% time requirement" in out
