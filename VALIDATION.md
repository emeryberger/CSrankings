# PR Validation, with examples

## Inclusion Criteria (for reference)

1. **Full-time, tenure-track research faculty** (not postdoc, not adjunct, not visiting)
   - **Exception — University of California teaching faculty are eligible.** UC's Teaching Professor series (formerly LPSOE/LSOE; titles such as "Assistant/Associate/Full Professor of Teaching" or "Assistant/Associate/Full Teaching Professor", and "Lecturer with Security of Employment") confers security of employment and the ability to solely advise CS PhD students. Faculty in this series count as eligible. See [Common Failure Modes §A](#a-university-of-california-teaching-faculty-eligible).
2. Can **solely advise PhD students in Computer Science**
   - **Verify this directly; do not infer it from rank.** Many institutions state supervision rights explicitly — Chinese faculty pages in particular almost always mark **博士生导师** (doctoral supervisor) or **硕士生导师** (master's supervisor *only*, which does **not** qualify). See [Verifying PhD supervision rights](#verifying-phd-supervision-rights-criterion-2).
3. **>=75% time appointment** (not primarily in industry; check `old/industry.csv`)
4. Faculty **not in a CS department** must provide justification (e.g., courtesy appointment) with links
   - **Exception — AI schools and colleges are eligible.** A university's School of Artificial Intelligence or College of AI (e.g. SJTU, Tsinghua) counts as a CS unit; its faculty need no separate justification and no proof of CS cross-advising. See [Common Failure Modes §C1](#c1-ai-schools-and-colleges-eligible).

> **Important:** Having publications in CSRankings-tracked venues does **not** make someone eligible. Eligibility is determined solely by the criteria above (tenure-track status, CS department, PhD advising). Many researchers outside CS publish in CS venues — this does not qualify them for inclusion.

---

## Categories of PRs

### 1. Updates to Existing Faculty (lowest risk)
Changes to homepage URL, Google Scholar ID, ORCID, affiliation, or DBLP name for people already in CSRankings. These are almost always safe to merge.

### 2. New Individual Additions (moderate risk)
Single faculty being added. Verify: department, tenure-track status, PhD advising ability.

### 3. Batch Additions (highest risk)
Multiple faculty from one institution. Every person must be individually verified. A single ineligible person means the whole PR cannot be merged as-is.

### 4. Removals / Reinstatements
Removals should have clear justification (retirement, departure, death). Reinstatements from `old/industry.csv` require proof the person is back in academia full-time.

---

## Common Failure Modes

### A. University of California teaching faculty: ELIGIBLE

**This is not a failure mode.** It is listed here because it is a common source of confusion.

Faculty in the **University of California Teaching Professor series** are **eligible for inclusion**. Do not reject a UC entry on the grounds that the title contains "Teaching".

- **Titles in this series**: "Assistant / Associate / Full Professor of Teaching", the equivalent "Assistant / Associate / Full Teaching Professor" phrasing, and the legacy "Lecturer with Security of Employment" (LSOE) and "Lecturer with Potential Security of Employment" (LPSOE).
- **Why eligible**: the series confers **security of employment** (UC's equivalent of tenure) and carries the right to **solely advise PhD students in Computer Science**. Both of the criteria that matter — a permanent appointment and sole CS PhD advising — are satisfied.
- **Still check the remaining criteria**: the person must be in a CS department (criterion 4) and at >=75% time (criterion 3). Those are assessed exactly as for any other entry.

> **Scope**: this exception is specific to the **University of California** system. Teaching-titled appointments elsewhere ("Teaching Professor", "Professor of Practice", "Lecturer" at non-UC US institutions) are **not** automatically eligible and must be assessed individually — the question is whether the appointment is permanent and confers sole CS PhD advising rights. Note that in the UK, "Lecturer" is a permanent academic post and is eligible; see [International Title Equivalences](#international-title-equivalences).

### B. Wrong Department (not CS, no cross-appointment shown)
| Pattern | Example Institution | Actual Department | Why Ineligible |
|---------|------------|-------------------|----------------|
| Automation dept | SJTU | Automation | No CS cross-appointment; advises Automation PhD students |
| ECE without CS | FIU | Electrical & Computer Eng. | ECE, hardware focus; no CS PhD advising |
| Engineering Technology | RIT | ECE **Technology** | "Engineering Technology" is a separate college from CS/Engineering |
| Information Science | Penn State | IST (Info Sci & Tech) | IST grants Informatics PhDs, not CS PhDs; separate college from CS |
| Info Sci within mixed college | Drexel | Information Science (within CCI) | Colleges with separate CS and Info Sci departments — only CS qualifies |

### C. Borderline / Non-standard Department Structures
| Pattern | Example Institution | Department | Notes |
|---------|------------|------------|-------|
| Media/Governance PhD | Keio | Environment & Info Studies (SFC) | PhD in "Media and Governance", not CS. University has a separate CS dept. |
| Merged CS+IS faculty | Ben-Gurion | SISE | **Now OK** — BGU merged CS and SISE into Faculty of Computer and Information Science in 2025 |
| AI school / college | SJTU, Tsinghua | School of AI, College of AI | **ELIGIBLE** — see [§C1](#c1-ai-schools-and-colleges-eligible) |

#### C1. AI schools and colleges: ELIGIBLE

**This is not a failure mode.** It is called out because it was previously ambiguous and is now settled (ruling: 2026-08-01).

Faculty in a university's **School of Artificial Intelligence** or **College of AI** are **eligible for inclusion**, and should be treated the same as faculty in that university's Department of Computer Science. Do not hold an entry because the unit is named "AI" rather than "Computer Science".

- **Examples**: SJTU School of Artificial Intelligence, Tsinghua College of AI, and equivalents elsewhere.
- **Why eligible**: these are computing units. They are typically spun out of, or run jointly with, the CS department, and their faculty supervise doctoral students in shared or cross-listed CS programmes. Requiring per-institution proof of cross-advising rights produced a lot of churn for a question that resolves the same way nearly every time.
- **`institutions.csv` need not match.** These entries will often be at a university whose `institutions.csv` URL points at the CS department (e.g. `cs.tsinghua.edu.cn`, `cs.sjtu.edu.cn`). That mismatch alone is **not** grounds to reject — CSRankings tracks one URL per institution, not per unit.
- **Still check the remaining criteria**: the person must be tenure-track or equivalent (criterion 1) and at >=75% time (criterion 3). Assess those exactly as for any other entry.

> **Boundary — this ruling covers AI schools only.** It does not extend to other adjacent units, which continue to be assessed under [§B](#b-wrong-department-not-cs-no-cross-appointment-shown): **Automation** departments (including SJTU's), **Electrical & Computer Engineering**, **Information Science / IST**, and **Engineering Technology** remain ineligible without a documented CS cross-appointment. A "School of Data Science" or "School of Cyber Science" is likewise not covered here and should be judged on its own facts.

### D. Future Additions

- Faculty listed as "assistant research professor" (non-TT) but joining as tenure-track in the current year can be added.

### E. Duplicate PRs

Multiple PRs adding the same person, often with slightly different data. Watch for:
- Identical entries submitted twice
- Same person appearing in both individual and batch PRs
- Different Scholar IDs for the same person (indicates data error)

### F. Same-PR Data Errors

- Watch for PRs that add both "Name" and "Name 0001" with **identical** Scholar ID and ORCID. On DBLP, the correct disambiguated form (e.g., "Name 0001") should be used exclusively.
- Duplicate Scholar IDs within the same batch PR always indicate a data error.

---

## Batch PR Common Issues

### General Patterns

- Faculty in **Mathematics** departments at universities with CS schools are ineligible (check email domains like `math@`).
- Faculty in **remote sensing / surveying labs** are NOT in CS departments, even if their discipline listing mentions "Computer Science and Technology."
- Faculty in a **School of AI** or **College of AI** rather than a School of CS **are eligible** — see [§C1](#c1-ai-schools-and-colleges-eligible). No per-institution proof of CS cross-advising is required.
- Removals of deceased faculty or duplicate entries with zero publications in CSRankings venues are generally appropriate.
- Removals of active faculty require evidence (retirement announcement, departure notice, etc.).
- Consolidates Imani N. S. Munyaka / Imani N. Sherman entries: **Appropriate**.

---

## Validation Comment Format

When reviewing a PR, **always post a validation assessment comment** on the PR. The comment should follow this template. The comment must be thorough, evidence-based, and reference this document.

### Template for Individual Additions

```markdown
## Validation Assessment: [Full Name] ([Institution])

**Likelihood of validity: [X]%**

### Analysis

| Criterion | Status | Notes |
|-----------|--------|-------|
| Full-time, tenure-track research faculty | ✅ PASS / ❌ FAIL / ⚠️ UNCLEAR | [Evidence: title, department page link] |
| Can solely advise CS PhD students | ✅ PASS / ❌ FAIL / ⚠️ UNCLEAR | [Evidence — cite the source, e.g. 博士生导师 designation, "Accepting Doctoral Students" flag, or named PhD students on a lab page. Do not infer from rank alone] |
| >=75% time appointment | ✅ PASS / ❌ FAIL / ⚠️ UNCLEAR | [Evidence or "No evidence of industry split"] |
| In a CS department | ✅ PASS / ❌ FAIL / ⚠️ UNCLEAR | [Department name, any cross-appointment notes] |

### Data Verification
- **DBLP name**: [Exact DBLP name, disambiguation notes if any]
- **Google Scholar**: [Confirmed/Not found, institution match]
- **Homepage**: [URL or faculty directory listing, title as shown]
- **ORCID**: [If provided — consistent with affiliation?]

### Conclusion
[1-2 sentence summary. Explain any percentage deduction from 100%.]

---
*Automated validation analysis based on [VALIDATION.md](../blob/gh-pages/VALIDATION.md) criteria*
```

### Template for Batch Additions

```markdown
## Validation Assessment: [N] Faculty from [Institution]

**Overall likelihood of validity: [X]%**

### Institution-Level Notes
- [Whether institution is already in institutions.csv]
- [Department/school context — is this a CS unit?]
- [Country-specific title equivalences if non-US]

### Per-Person Analysis

| # | Name | Position | DBLP Match | Scholar/ORCID | PhD Advising | Verdict |
|---|------|----------|-----------|---------------|-------------|---------|
| 1 | [Name] | [Title] | ✅/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ | PASS / FAIL / NEEDS CLARIFICATION |
| ... | ... | ... | ... | ... | ... | ... |

### Issues Requiring Action
[Numbered list of specific problems found, with details]

### Summary
[X of N entries clearly pass. Describe what needs resolution for the rest.]

---
*Automated validation analysis based on [VALIDATION.md](../blob/gh-pages/VALIDATION.md) criteria*
```

### Template for Updates to Existing Faculty

```markdown
## Validation Assessment: Update for [Full Name] ([Institution])

**Likelihood of validity: [X]%**

### Changes
| Field | Old Value | New Value | Valid? |
|-------|-----------|-----------|--------|
| [field] | [old] | [new] | ✅/❌ |

### Conclusion
[Brief assessment.]

---
*Automated validation analysis based on [VALIDATION.md](../blob/gh-pages/VALIDATION.md) criteria*
```

### Guidelines for Writing Validation Comments

1. **Always check every inclusion criterion** from the table above — do not skip any row
2. **Cite evidence**: link to or name the specific source (faculty directory page, Google Scholar profile, LinkedIn, etc.)
3. **Likelihood percentage**: 90-100% = clearly valid; 70-89% = likely valid with minor concerns; 50-69% = significant uncertainty; <50% = likely invalid
4. **Flag specific issues** that need action (wrong Scholar ID, DBLP disambiguation, missing institution, etc.)
5. **For non-US institutions**, reference the International Title Equivalences table above
6. **Never mark criterion 2 as PASS on the strength of a title alone.** Cite the actual evidence for doctoral supervision — a 博士生导师 designation, an "Accepting Doctoral Students" flag, named PhD students on a lab page, or a departmental supervisor listing. If none is available, mark it ⚠️ UNCLEAR and say what would settle it. See [Verifying PhD supervision rights](#verifying-phd-supervision-rights-criterion-2)
7. **Read the whole PR thread before assessing.** Submitters and third parties often supply the missing evidence in a comment; scoring without reading it produces a wrong verdict and wastes their time
8. **For batch PRs**, every person must be individually assessed — do not just spot-check
9. **Always end with** the `*Automated validation analysis based on [VALIDATION.md](...) criteria*` footer line
10. **For removals**, verify the stated reason (retirement, departure, death) with evidence

---

## Verification Techniques

### Quick checks (URL-based)

- `cs.xxx.edu` or `cse.xxx.edu` URLs strongly suggest CS department
- `ece.xxx.edu` or `ee.xxx.edu` suggest ECE -- need to verify CS PhD advising
- `ist.xxx.edu` or `ischool` suggest Information Science -- usually separate from CS
- `jszy.whu.edu.cn` is Wuhan's general faculty directory -- does NOT indicate department
- `dr.ntu.edu.sg` is NTU's general directory -- does NOT indicate school

### Deeper checks needed

- Google Scholar profile (verified email domain)
- LinkedIn (current title and department)
- DBLP (name disambiguation, publication venues)
- University faculty directory pages (department-specific listings)
- ResearchGate (often shows department explicitly)

### Verifying PhD supervision rights (criterion 2)

Criterion 2 — *can solely advise PhD students* — is easy to assume from a title and easy to get wrong. A professorial title does **not** by itself establish doctoral supervision rights, and some non-professorial titles **do** carry them. Check it directly rather than inferring it from rank.

**Chinese institutions state it explicitly. Always look.**

Chinese faculty pages routinely print supervision status as part of the title line, and it is authoritative:

| Term | Pinyin | Meaning | Satisfies criterion 2? |
|------|--------|---------|------------------------|
| **博士生导师** (often 博导) | bóshìshēng dǎoshī | Doctoral supervisor | ✅ **Yes** |
| **硕士生导师** (often 硕导) | shuòshìshēng dǎoshī | Master's supervisor only | ❌ **No** |

Titles are usually written as a compound, e.g. `教授、博士生导师` (Professor and Doctoral Supervisor) or `副教授 / 博士生导师` (Associate Professor / Doctoral Supervisor).

**This is often the fastest way to resolve an otherwise ambiguous title.** It decouples criterion 2 from rank naming, which matters because Chinese research-series titles can look non-tenure-track to a reader used to US conventions:

- `青年研究员、博士生导师` ("Young Researcher") — the 博导 designation confirms doctoral supervision even though the rank name resembles a research-scientist post that [Red flags](#red-flags) would otherwise treat with suspicion.
- `特聘教授` ("Distinguished Professor") — a 特聘 appointment [may be fixed-term](#international-title-equivalences); 博导 status is separate evidence and should be checked on its own.

Directories where this appears in practice include `faculty.<inst>.edu.cn` profile pages, `gr.xjtu.edu.cn`, and `people.ucas.edu.cn` (which renders it in English as "Ph.D. Advisor").

**Elsewhere, look for these signals:**

- **UK/European institutional research portals** often carry an explicit **"Accepting Doctoral Students"** flag (e.g. `researchportal.bath.ac.uk`). Strong positive evidence.
- **Lab or group pages listing current PhD students** by name. A group with several doctoral students is direct evidence of sole supervision in practice, not merely eligibility for it.
- **Departmental graduate-programme pages** listing eligible supervisors.

**Two cautions:**

1. **Supervision rights do not establish the department.** 博导 status confirms criterion 2 only. A faculty member can be a doctoral supervisor in a non-CS unit, which leaves criterion 4 unaddressed — verify the two separately.
2. **Co-advising is not sole advising.** Criterion 2 requires the ability to serve as sole advisor. Where a page shows only jointly-supervised students, or where a research-series appointment permits supervision only alongside a full professor, that does not qualify.

### Red flags

- "Professor of Teaching" or "Lecturer" at **non-UC** US universities (may be non-TT). At University of California campuses these titles are **eligible** — see [§A](#a-university-of-california-teaching-faculty-eligible)
- "Research Professor" or "Research Scientist" (often non-TT). **For Chinese institutions, check for a 博士生导师 designation before rejecting** — research-series titles such as 青年研究员 frequently carry full doctoral supervision rights; see [Verifying PhD supervision rights](#verifying-phd-supervision-rights-criterion-2)
- Faculty page shows **硕士生导师 only** (master's supervisor, no 博导 designation) — cannot solely advise PhD students, so criterion 2 fails
- Faculty whose email domain doesn't match their listed institution
- Same Google Scholar ID appearing in multiple entries
- NOSCHOLARPAGE with no ORCID -- harder to verify identity

---

## International Title Equivalences

| Country | Tenure-Track Equivalent | Notes |
|---------|------------------------|-------|
| UK | Lecturer, Senior Lecturer, Reader, Professor | All are permanent academic positions |
| Germany | W1 (Juniorprofessur), W2, W3 | W1 may or may not be TT; W2/W3 are tenured |
| Australia | Lecturer, Senior Lecturer, Assoc. Prof, Professor | Permanent "continuing" appointments |
| Japan | Assistant/Associate/Full Professor | Generally permanent in national universities |
| China | Lecturer, Associate Prof, Professor | Generally permanent; "特聘" (special appointment) may be fixed-term |
| South Korea | Assistant/Associate/Full Professor | Similar to US system |
| Estonia | Professor, Dotsent (Assoc. Prof), Lektor (Lecturer) | "Teadur" (Research Fellow/Researcher) is research-only, NOT tenure-track |

---

## Automation

The script `util/validate_prs.py` automates the validation workflow:

```bash
# See what needs work
python3 util/validate_prs.py status         # Full status report
python3 util/validate_prs.py list           # PRs still needing our validation comment
python3 util/validate_prs.py check <PR#>    # Does this PR already have our comment?

# Investigate a specific PR
python3 util/validate_prs.py gather <PR#>   # Diff, data quality checks, red flags
python3 util/validate_prs.py info <PR#>     # Lighter-weight summary
python3 util/validate_prs.py gather-all     # Gather all unvalidated PRs -> /tmp/prs_gathered.json

# Post a validation comment from a file
python3 util/validate_prs.py comment <PR#> <file.md>

# Score and merge
python3 util/validate_prs.py scores         # Show all scores; tags those >= 80% [MERGEABLE]
python3 util/validate_prs.py merge          # Merge ALL PRs >= 80% (squash)
python3 util/validate_prs.py merge <PR#>    # Merge one specific PR (checks score)
python3 util/validate_prs.py merge -t 90    # Raise the threshold for this run

# Conflicts and duplicates
python3 util/validate_prs.py resolve [PR#]  # Auto-resolve conflicts on CSV-only PRs
python3 util/validate_prs.py duplicates     # Institutions with 2+ open PRs
python3 util/validate_prs.py close-dupes    # Close dupes, keeping the lowest PR number
python3 util/validate_prs.py consolidate    # Combine per-institution PRs into one
```

> **Careful with bare `merge`.** With no PR argument it merges *every* PR at or
> above the threshold (default **80%**, not 90%). That will happily merge a PR
> you flagged as conditionally unsafe — for example, a removal whose replacement
> entry is still sitting in a separate open PR. When some PRs above the threshold
> carry caveats, merge them one at a time by number.

The `gather` command performs automated checks including:
- Institution lookup against `institutions.csv`
- Duplicate Scholar ID detection within batch PRs
- URL-based department heuristics (cs/cse = good, ece/ist = needs review)
- Red flag detection (NOSCHOLARPAGE, placeholder ORCID, disambiguated names)
- Existing faculty collision detection
