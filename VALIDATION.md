# PR Validation, with examples

## Inclusion Criteria (for reference)

1. **Full-time, tenure-track research faculty** (not teaching-track, not postdoc, not adjunct, not visiting)
2. Can **solely advise PhD students in Computer Science**
3. **>=75% time appointment** (not primarily in industry; check `old/industry.csv`)
4. Faculty **not in a CS department** must provide justification (e.g., courtesy appointment) with links

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

### A. Teaching Track (NOT tenure-track research)
- "Assistant Professor of Teaching" — UC system's teaching-focused track. Has security of employment but is NOT research tenure-track. However, UC teaching faculty **can** solely advise PhD students in CS, so the remaining question is whether they meet the other inclusion criteria (tenure-track research appointment, >=75% time).
- **Key signal**: Title contains "of Teaching" or "Lecturer with Security of Employment" at UC campuses.

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
| AI school with joint CS programs | SJTU | School of AI | AI faculty may be able to advise CS PhD students (joint programs) |

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
- Faculty in a **School of AI** rather than School of CS may or may not qualify, depending on whether the university allows cross-advising of CS PhD students.
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
| Can solely advise CS PhD students | ✅ PASS / ❌ FAIL / ⚠️ UNCLEAR | [Evidence] |
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
6. **For batch PRs**, every person must be individually assessed — do not just spot-check
7. **Always end with** the `*Automated validation analysis based on [VALIDATION.md](...) criteria*` footer line
8. **For removals**, verify the stated reason (retirement, departure, death) with evidence

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

### Red flags

- "Professor of Teaching" or "Lecturer" at US universities (may be non-TT)
- "Research Professor" or "Research Scientist" (often non-TT)
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

# Investigate a specific PR
python3 util/validate_prs.py gather <PR#>   # Diff, data quality checks, red flags
python3 util/validate_prs.py info <PR#>     # Lighter-weight summary

# Post a validation comment from a file
python3 util/validate_prs.py comment <PR#> <file.md>

# Score and merge
python3 util/validate_prs.py scores         # Show all scores
python3 util/validate_prs.py mergeable      # List PRs >= 90% ready to merge
python3 util/validate_prs.py merge          # Merge all >= 90% (squash, auto-merge)
python3 util/validate_prs.py merge <PR#>    # Merge one specific PR (checks score)
```

The `gather` command performs automated checks including:
- Institution lookup against `institutions.csv`
- Duplicate Scholar ID detection within batch PRs
- URL-based department heuristics (cs/cse = good, ece/ist = needs review)
- Red flag detection (NOSCHOLARPAGE, placeholder ORCID, disambiguated names)
- Existing faculty collision detection
