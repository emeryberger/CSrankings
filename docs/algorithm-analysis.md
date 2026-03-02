# CSRankings: Algorithm Analysis and Assessment

## Overview

CSRankings is a metrics-based ranking of top computer science institutions based on faculty publications at selective conferences. This document analyzes the ranking algorithm, addresses common criticisms, documents the site's impact, and suggests potential improvements.

---

## The Algorithm

### 1. Fractional Co-authorship Counting

Each publication gives each author `1/N` credit, where N = total number of authors.

**Example:** A paper with 5 authors gives each author 0.2 adjusted count.

**Implementation:** `util/regenerate_data.py`:
```python
authorscoresAdjusted[(realName, areaname, year)] += 1.0 / authorsOnPaper
```

### 2. Geometric Mean Aggregation

Department scores are computed as a **smoothed geometric mean** across selected areas:

```
score = ((count_area1 + 1) × (count_area2 + 1) × ...) ^ (1/numAreas)
```

**Implementation:** `src/computation.ts`:
```typescript
for (const area in topLevelAreas) {
    if (weights[area] != 0) {
        stats[dept] *= (areaDeptAdjustedCount[areaDept] + 1.0);
    }
}
stats[dept] = Math.pow(stats[dept], 1 / numAreas);
```

### 3. Laplace Smoothing (+1)

The `+1` prevents departments with zero papers in an area from getting a zero total score.

---

## Why This Algorithm?

| Aspect | Benefit |
|--------|---------|
| **Fractional counting** | Prevents gaming by adding authors; fair credit distribution |
| **Geometric mean** | Rewards breadth across areas; prevents single-area dominance |
| **Smoothing** | No division by zero; departments aren't eliminated for missing one area |
| **Simplicity** | Easy to explain; users can verify manually |
| **Deterministic** | Same data always produces same results |

### Alternative Approaches Considered

| Alternative | Verdict | Reason |
|-------------|---------|--------|
| **Arithmetic mean** | Rejected | Allows single-area dominance |
| **Harmonic mean** | Rejected | Too punitive for specialized institutions |
| **First/last author weighting** | Not recommended | CS culture varies (alphabetical ordering common in theory) |
| **Faculty-only fractional counting** | Rejected | Creates incentive against students getting faculty jobs |
| **Citation-based metrics** | Future consideration | Gameable; time-lagged; but could complement counts |

---

## Addressing Criticisms

### Criticism 1: Disincentivizes Collaboration

**The argument:** 1/N fractional counting creates disincentives to include students or collaborate with other faculty.

**Counter-arguments:**

1. **Faculty already have these incentives** - Tenure committees, grants, and awards already favor smaller author teams. CSRankings reflects existing academic culture, not creates it.

2. **Alternative approaches have worse problems** - Counting only faculty in the database would create "a disincentive for faculty to see their students get faculty appointments."

3. **Full counting enables gaming** - If each co-author got 1.0 credit, a single paper with 10 authors would count as 10.0, trivially inflating rankings.

**Empirical evidence:**

| Year | NeurIPS Avg Authors | Change from 2013 |
|------|---------------------|------------------|
| 2013 | ~3.3 | baseline |
| 2017 | ~4.0 | +21% |
| 2022 | 4.66 | +41% |
| 2023 | 4.98 | **+51%** |

Average authorship at NeurIPS increased by more than 50% over the decade—the opposite of what the disincentive hypothesis predicts. A [Scientometrics study](https://link.springer.com/article/10.1007/s11192-016-2214-9) found CS author counts have increased every decade since 1954.

**Conclusion:** The criticism is theoretically valid but empirically unsupported. Collaboration has increased, not decreased.

---

### Criticism 2: Incentivizes Quantity Over Quality

**The arguments** (from [William J. Bowman](https://www.williamjbowman.com/blog/2025/04/02/the-structure-and-interpretation-of-computer-science-academic-metrics/) and [Mark Guzdial](https://cacm.acm.org/blogcacm/why-i-dont-recommend-csrankings-org-know-the-values-you-are-ranking-on/)):

- Publication count is a flawed proxy for quality
- Goodhart's Law: when a measure becomes a target, it ceases to be good
- Conservative bias toward established venues
- Anti-interdisciplinary (doesn't count Nature, Science, etc.)

**Counter-arguments:**

1. **The venue filter IS a quality filter** - CSRankings only counts top-tier venues with ~20-30% acceptance rates, not all publications.

2. **No ranking can measure "quality" directly** - All metrics are proxies. Citations measure attention, not quality. Expert judgment doesn't scale.

3. **DBLP doesn't index interdisciplinary venues** - CSRankings relies on DBLP, which is a CS bibliography. Nature/Science publish few CS papers anyway.

4. **Anti-gaming features exist:**
   - Fractional counting prevents author inflation
   - Only top-tier venues count
   - 75% appointment rule excludes industry double-counting
   - Public data allows scrutiny

**Valid criticism:** The conservative/establishment bias is real but intentional—for stability and to serve prospective students researching established programs.

---

## CSRankings Is More Than a Ranking

A critical point often missed: CSRankings is a **research discovery tool**, not just a ranking.

| Feature | Value |
|---------|-------|
| **Research area filtering** | Select specific sub-areas; see rankings for your interests |
| **Faculty discovery** | Drill down to individual faculty at each institution |
| **Homepage links** | Direct links to faculty personal websites |
| **Google Scholar links** | One-click access to citation profiles |
| **DBLP links** | Verify publication records |
| **Year range filtering** | Focus on recent activity |
| **Geographic filtering** | Filter by region |
| **Interactive charts** | Visualize publication distribution |

**The ranking emerges from exploration, not the other way around.**

---

## Impact and Usage

### Traffic Statistics

| Metric | Value |
|--------|-------|
| **Monthly visits** | ~280,000 |
| **Daily visitors** | ~8,000 |
| **Pages per visit** | 3.98 |
| **Top countries** | USA, India, Bangladesh |

### Community Contributions

| Metric | Value |
|--------|-------|
| **Total commits** | 12,571 |
| **Unique contributors** | 2,989 |

### Documented Use Cases

**Prospective PhD Students:**
> "I highly recommend csrankings... it is capable of filtering out a lot of unwanted information and focusing on your research interests quickly."

**Hiring/Tenure Decisions:** Directly cited in promotion packets and hiring discussions.

**Department Recruitment:** Used by Duke, MBZUAI, IISc, NC State in promotional materials.

### Displacement of US News

| Factor | US News | CSRankings |
|--------|---------|------------|
| **Methodology** | Opaque surveys | Open source, verifiable |
| **Cost** | Paid access | Free |
| **Customization** | None | Filter by area, region, years |
| **Update frequency** | Annual | Continuous |

CSRankings has become the de facto standard for CS department rankings within the academic community.

---

## Potential Improvements

### High Priority (Low Effort)

| Improvement | Benefit |
|-------------|---------|
| **Display raw + adjusted counts** | Show "15 papers (8.3 adjusted)" for transparency |
| **Conference selectivity tooltips** | Show acceptance rates |
| **Export/sharing** | Download CSV; better URL state |

### Medium Priority

| Improvement | Benefit |
|-------------|---------|
| **Historical trends** | Show department trajectory over time |
| **Side-by-side comparison** | Compare 2-4 institutions directly |
| **Citation indicators** | Optional Semantic Scholar integration |

### Lower Priority / Long-term

| Improvement | Benefit |
|-------------|---------|
| **Research topic search** | Find faculty by keyword |
| **PhD placement data** | Track where graduates end up |

---

## Conclusion

**The current algorithm is well-designed and defensible.** The combination of:
1. Simple fractional counting (1/N)
2. Geometric mean aggregation
3. Laplace smoothing (+1)

...represents a reasonable balance of simplicity, fairness, and robustness.

**Key criticisms and responses:**

| Criticism | Validity | Evidence |
|-----------|----------|----------|
| Disincentivizes collaboration | Overstated | Author counts increased 50%+ |
| Favors quantity over quality | Partially valid | Venue selectivity provides quality floor |
| Conservative bias | True by design | For stability; new areas can be added |
| Anti-interdisciplinary | True but constrained | DBLP limitation; few CS papers in Nature/Science |

**The key insight:** CSRankings should be used as *one input* among many. Its value lies in providing transparent, verifiable data that users can combine with other factors (advisor fit, location, funding, culture) to make informed decisions.

---

*Document generated January 2026*
