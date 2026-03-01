# Plan for Remaining Validated PRs

## Current State

- **65 PRs merged** (33 updates, 1 removal, 1 reinstatement, 30 new additions)
- **~335 validated PRs still open** (35 from analyzed batch + ~300 not yet analyzed)
- **6 PRs confirmed ineligible** (should be closed or have label removed)
- **7 PRs are duplicates** (should be closed after the original is merged)
- **~22 batch PRs need per-faculty verification** before merging

---

## Immediate Actions (no further research needed)

### Close as Ineligible (6 PRs)

| PR | Faculty | Reason |
|----|---------|--------|
| #11475 | Thomas Y. Yeh (UCI) | Teaching track, not research tenure-track |
| #11159 | Hesheng Wang (SJTU) | Dept of Automation, not CS |
| #11450 | Md. Tauhidur Rahman (FIU) | Dept of ECE, not CS |
| #11129 | John Thomas 0001 (RIT) | Dept of ECE Technology, not CS |
| #11136 | Xinning Gui (Penn State) | College of IST, not CS |
| #11452 | Christopher C. Yang (Drexel) | Information Science dept, advises Info Sci PhD not CS PhD |

### Close as Duplicates (7 PRs)

| Close | Keep | Person |
|-------|------|--------|
| #11080 | #11163 (already merged) | Eleni Tzirita Zacharatou |
| #11286 | #11176 (pending) | Chuanxia Zheng (NTU) |
| #11099 | #11114 (pending) | Keith G. Mills (LSU) |
| #11120 | #11114 (pending) | Reza Ghaiumy Anaraky (LSU) |
| #11139 | #11114 (pending) | James Ghawaly (LSU) |
| #11364 | #11316 (pending) | Jing Zhang 0037 (Wuhan) |
| #11471 | none (needs fix) | Jia Zhang -- PR adds both "Jia Zhang" and "Jia Zhang 0001" with same Scholar ID; needs to be fixed to only include "Jia Zhang 0001" |

### Decline with Explanation (2 PRs)

| PR | Faculty | Reason |
|----|---------|--------|
| #11220 | Rodney Van Meter (Keio) | Faculty of Environment & Info Studies; PhD in "Media and Governance"; no evidence of CS PhD advising |
| #11149 | Nicolas Christianson (JHU) | Not yet in tenure-track role (starts Fall 2026); currently "assistant research professor" |

---

## Batch PRs Requiring Per-Faculty Verification

These PRs contain multiple faculty. Some may be eligible and some not. Each person needs individual checking.

### Strategy for Verification

For each person in a batch PR, check:
1. **Department**: Look at the faculty page URL. Chinese university faculty pages (jszy.*.edu.cn, faculty.*.edu.cn) typically show "School/Department:" field.
2. **Title**: Confirm tenure-track equivalent.
3. **CS PhD advising**: If not in CS dept, look for cross-appointment evidence.

### Priority Order (largest impact first)

#### Tier 1: Large NTU batches (27 faculty total)
- **#11175** (12 faculty) and **#11176** (15 faculty)
- All use dr.ntu.edu.sg URLs (general directory)
- Need to verify each is in SCSE (School of Computer Science and Engineering) or equivalent
- Some may be in Math, EE, or Business schools

#### Tier 2: Wuhan University batches (39 faculty total across 7 PRs)
- **#11211** (7), **#11232** (5), **#11233** (4), **#11312** (7), **#11316** (9), **#11323** (3), **#11352** (7)
- Known issues: #11352 contains Yuling Jiao (Math dept); #11312 contains Bijun Li (Surveying/Remote Sensing lab)
- Most have jszy.whu.edu.cn URLs; check "School/Department" field on each page
- Key departments: 计算机学院 (CS) = OK; 人工智能学院 (AI) = borderline; 数学与统计学院 (Math) = NO; 测绘 (Surveying) = NO

#### Tier 3: Nankai AI batches (17 faculty total across 3 PRs)
- **#11084** (13), **#11092** (9), **#11103** (4)
- All from ai.nankai.edu.cn (College of Artificial Intelligence)
- Need to verify: Can Nankai AI faculty solely advise CS PhD students?
- Nankai has a separate College of Computer Science (cs.nankai.edu.cn)

#### Tier 4: Other batches
- **#11114** (LSU, 8 faculty) -- Also has duplicate issues with #11099, #11120, #11139. Scholar ID discrepancy for Keith Mills needs resolution.
- **#11310** (Sun Yat-sen, 4 faculty) -- 2 have cse.sysu.edu.cn URLs (OK), 2 have personal sites (need verification)
- **#11402** (ECNU, 4 faculty) -- Check departments
- **#11449** (Bogazici, 3 faculty) -- 1 confirmed CMPE (OK), 2 need verification
- **#11460** (Bogazici, 2 faculty) -- 1 confirmed CMPE (OK), 1 needs verification
- **#11222** (Keio SFC, 4 faculty) -- All in Faculty of Environment & Info Studies; same concern as Rodney Van Meter

### Individual PRs Needing Quick Verification
- **#11429** (Xin Li 0033, Beijing Institute of Technology) -- Check CS department

---

## PR #11085 (UCSD Miscellaneous) -- Special Case

This PR has mixed appropriate/questionable changes:

**Appropriate changes:**
- Remove Fan Chung Graham / F.R.K. Chung / Fan R.K. Chung (3 entries) -- retired/emerita, Math dept, zero CSRankings publications
- Remove H. L. Graham (Ronald Graham) -- deceased 2020, zero publications
- Remove David Danks -- affiliate (not primary) CSE faculty
- Consolidate Imani N. S. Munyaka / Imani N. Sherman into one entry
- Add Thuy-Duong Vuong -- verified TT Assistant Professor in CSE

**Questionable change:**
- Remove David J. Kriegman -- still listed as active Professor on UCSD CSE website. No public evidence of retirement.

**Recommendation:** Ask the PR author to provide evidence for the Kriegman removal, or split the PR to merge the uncontroversial changes separately.

---

## Remaining ~300 Validated PRs (not yet analyzed)

There are approximately 300 additional validated PRs (roughly #10837-#11058) that were not covered in this analysis session. These should be processed using the same methodology:

1. Categorize (update vs. new addition vs. removal)
2. For updates: merge directly (>90% safe)
3. For new additions: verify department, tenure-track status, CS PhD advising ability
4. For batch additions: verify every faculty member individually
5. Check for duplicates across PRs
6. Check `old/industry.csv` for industry conflicts

### Efficiency Improvements for Next Session

1. **Automate department checking** for Chinese universities: curl the jszy.*.edu.cn page and grep for "School/Department" field
2. **Batch-verify NTU faculty** by checking the SCSE faculty directory page against the PR names
3. **Process update-only PRs first** -- they're always safe and reduce the queue quickly
4. **Use DBLP API** to verify name disambiguation (0001, 0002 suffixes)
5. **Check for cross-PR duplicates** by comparing Scholar IDs across all open PRs before merging
