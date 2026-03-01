# PR Validation, with examples

## Inclusion Criteria (for reference)

1. **Full-time, tenure-track research faculty** (not teaching-track, not postdoc, not adjunct, not visiting)
2. Can **solely advise PhD students in Computer Science**
3. **>=75% time appointment** (not primarily in industry; check `old/industry.csv`)
4. Faculty **not in a CS department** must provide justification (e.g., courtesy appointment) with links

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

## Common Failure Modes Found

### A. Teaching Track (NOT tenure-track research)
- **Thomas Y. Yeh (UCI)**: "Assistant Professor of Teaching" -- UC system's teaching-focused track. Has security of employment but is NOT research tenure-track. Teaching professors typically cannot solely advise PhD students.
- **Key signal**: Title contains "of Teaching" or "Lecturer with Security of Employment" at UC campuses.

### B. Wrong Department (not CS, no cross-appointment shown)
| Faculty | Institution | Actual Department | Why Ineligible |
|---------|------------|-------------------|----------------|
| Hesheng Wang | SJTU | Automation | No CS cross-appointment; advises Automation PhD students |
| Md. Tauhidur Rahman | FIU | Electrical & Computer Eng. | ECE, hardware security focus; no CS PhD advising |
| John Thomas 0001 | RIT | ECE **Technology** | "Engineering Technology" is a separate college from CS/Engineering at RIT |
| Xinning Gui | Penn State | IST (Info Sci & Tech) | IST grants Informatics PhDs, not CS PhDs; separate college from CS |
| Christopher C. Yang | Drexel | Information Science (within CCI) | CCI has separate CS and Info Sci departments; he advises Info Sci PhDs |

### C. Borderline / Non-standard Department Structures
| Faculty | Institution | Department | Notes |
|---------|------------|------------|-------|
| Rodney Van Meter | Keio | Environment & Info Studies (SFC) | PhD in "Media and Governance", not CS. Keio has a separate CS dept. |
| Mark Last | Ben-Gurion | SISE | **Now OK** -- BGU merged CS and SISE into Faculty of Computer and Information Science in 2025 |
| Linfeng Zhang | SJTU | School of AI | SJTU AI faculty appear able to advise CS PhD students (joint programs) |

### D. Future Additions

- **Nicolas Christianson (JHU)**: Listed as "assistant research professor" (non-TT) in Feb 2026. Joining as tenure-track assistant professor in Fall 2026; incoming faculty in the current year can be added.

### E. Duplicate PRs

Multiple PRs adding the same person, often with slightly different data:

| Duplicate | Original | Person |
|-----------|----------|--------|
| #11080 | #11163 | Eleni Tzirita Zacharatou (HPI) -- identical entries |
| #11286 | #11176 | Chuanxia Zheng (NTU) -- already in batch PR |
| #11099 | #11114 | Keith G. Mills (LSU) -- **different Scholar IDs!** |
| #11120 | #11114 | Reza Ghaiumy Anaraky (LSU) |
| #11139 | #11114 | James Ghawaly (LSU) |
| #11364 | #11316 | Jing Zhang 0037 (Wuhan) |

### F. Same-PR Data Errors

- **PR #11471**: Adds BOTH "Jia Zhang" AND "Jia Zhang 0001" with **identical** Scholar ID and ORCID. On DBLP, the correct name is "Jia Zhang 0001" (there are 4+ people named "Jia Zhang"). Only the 0001 entry should be added.

---

## Batch PR Issues Found

### Wuhan University Batches

- **PR #11352**: Contains **Yuling Jiao** whose email is `yulingjiaomath@whu.edu.cn` and department is School of Mathematics. INELIGIBLE.
- **PR #11312**: Contains **Bijun Li** from the "State Key Lab of Surveying, Mapping and Remote Sensing Information Engineering" (测绘遥感信息工程全国重点实验室). NOT a CS department. Her discipline listing includes "Other specialties in Computer Science and Technology" but primary affiliation is not CS.
- Some Wuhan entries are in the School of Artificial Intelligence (人工智能学院) rather than the School of Computer Science (计算机学院). These may or may not qualify depending on cross-advising arrangements.

### UCSD Miscellaneous (PR #11085)

- Removes Fan Chung Graham (3 duplicate entries) and H. L. Graham (Ronald Graham, deceased 2020): **Appropriate** -- all had zero publications in CSRankings venues.
- Removes David Danks: **Likely appropriate** -- affiliate (not primary) CSE faculty; primary in Data Science Institute + Philosophy.
- Removes David J. Kriegman: **Questionable** -- still listed as active Professor on UCSD CSE website. No public evidence of retirement. Should request evidence before merging.
- Adds Thuy-Duong Vuong: **Appropriate** -- confirmed TT Assistant Professor in CSE.
- Consolidates Imani N. S. Munyaka / Imani N. Sherman entries: **Appropriate**.

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

---

