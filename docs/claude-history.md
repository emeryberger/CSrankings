# CSRankings Development History with Claude
**December 7, 2025 – January 18, 2026**

---

## 1. Performance Optimization (Dec 7, 2025)

- Optimize csrankings.ts to make checkbox updates faster
- Implement incremental computation instead of full recomputation
- Create test suite with Selenium/pytest for verification
- Reduce render time from 700ms+ to much faster
- Remove lazy loading (first 25 entries) since no longer necessary
- Make initial page loading faster
- Remove initialization messages

---

## 2. DBLP Processing & Backend (Dec 7-8, Dec 30, 2025)

- Optimize shrink-dblp logic (replace basex/filter.xq with faster Python)
- Fix XML entity handling for diacritics (Ümit V. Çatalyürek, Éva Tardos)
- Implement streaming XML processing to reduce RAM usage
- Fix author name update logic (handling aliases like "Nathaniel Hudson 0001")
- Switch to lxml for 2.7x performance improvement
- Create monthly DBLP update workflow with automatic date extraction
- Automate Makefile for DBLP and faculty name updates

---

## 3. Repository Maintenance (Dec 8, 22, 2025)

- Analyze git history size (~5GB problem)
- Identify articles.json as culprit
- Permanently remove articles.json from git history (reduced to ~140MB)
- Set up Git LFS for dblp.xml.gz

---

## 4. Code Refactoring (Dec 16-17, 2025)

- Refactor csrankings.ts into modular src/ directory:
  - app.ts, checkbox.ts, computation.ts, config.ts
  - data-loader.ts, event-handlers.ts, navigation.ts
  - rendering.ts, region.ts, types.ts, utils.ts, verification.ts
- Move continents.ts to src/
- Break out survey and sponsorship logic
- Add usage tracking for sponsorship prompts

---

## 5. UI/UX Improvements (Dec 15, 28-31, 2025)

### Mobile Optimization
- Comprehensive mobile layout improvements
- Sticky banner for date slider and controls
- Responsive institution panel height
- Touch-friendly circular slider handles on mobile

### Visual Design
- Zebra striping for faculty and institution listings
- Row hover highlighting
- Remove extraneous blue rows between institutions
- Add vertical spacing between rows
- Date range slider with color-coded handles (green/red → black)
- Area selection dropdown pills (AI, Systems, Theory, Interdisciplinary)
- Region dropdown with globe icons
- Chart type dropdown with bar/pie icons
- Sponsor button in banner (dark blue to match site)

### Top Banner & Footer Cleanup
- Move GitHub logo to title area
- Add sponsor avatars dynamically loaded from GitHub API
- Clean up bottom section (FAQ, advice links alphabetized)
- Add "Publication data from DBLP" attribution
- Links to CSconferences, CSStipendRankings with tooltips

### Interactive Tour
- Create guided tour for newcomers (prospective PhD students)
- Mock faculty entry "A. Professor" with ML area
- Explain all UI elements: sliders, checkboxes, icons, charts
- Based on Philip Guo's video transcript

### Attempted Features (Shelved)
- Dark mode (too many visual issues)
- Homepage preview on hover (CORS issues)

---

## 6. PR Management & Validation (Dec 21, 2025 – Jan 2026)

- Batch merge of 127+ validated PRs
- Conflict resolution rules documented
- Workflow to resolve CSV conflicts (accept PR changes for affiliation updates)
- PR validation improvements:
  - Programmatic checks for Scholar IDs, names, duplicates
  - Footnotes with links to CONTRIBUTING.md
  - Check for anonymous GitHub profiles

---

## 7. Institution Management (Dec 25, 28, Jan 4, 2026)

- Rename "University of Adelaide" → "Adelaide University" (2026 merger)
- Add 6 new institutions from open issues
- Fix institution homepages (audit all for CS department pages)
- Abbreviate long names (University→Univ., Institute→Inst., Technology→Tech.)
- Add institution home page icons with links
- Fix specific entries: Royal Military College of Canada, Simula UiB, UConn, Weizmann, etc.

---

## 8. Submission Form & Workflows (Jan 1-5, 2026)

### Web-Based Submission Form (submit/)
- Single-page app for faculty submissions
- Three workflows: Add, Update, Remove
- Auto-complete for names (from DBLP) and institutions
- Support for abbreviations (UIUC, MIT, CMU, UC*, UT*, UF*, etc.)
- Live validation: DBLP name check, Google Scholar ID format, homepage URL
- Pre-populate fields for existing entries
- Handle faculty in old/ directories (industry, emeritus, rip)
- Eligibility checkboxes with links to guidelines
- Batch submission feature for multiple faculty

### GitHub Integration
- Form creates GitHub issues with structured data
- Workflow processes issues into PRs automatically
- Validation checks run on generated PRs
- Issues reference submitter's GitHub account

### Data Validation
- Fix Google Scholar ID formats (AAAJ endings, NOSCHOLARPAGE standardization)
- Name capitalization validation
- Accent-insensitive matching for name updates
- Homepage domain validation against institutions.csv

---

## 9. CI/CD Workflows (Dec 30, 2025 – Jan 2026)

- Monthly DBLP update workflow (downloads from Dagstuhl)
- Monthly sponsor update workflow (fetches from GitHub API)
- Form submission processing workflow
- Commit validation workflow improvements
- Selenium test integration in CI
- Submission throttling (2/day for non-batch)
- Auto-batching for rapid submissions

---

## 10. Data Fixes & Maintenance (Jan 4-8, 2026)

- Fix ORCID field overwrites (make scripts read from CSV headers)
- Restore accidentally deleted entries
- Fix reinstatement workflow for old/ directory handling
- Robustify util/*.py scripts to not use hardcoded fieldnames
- Fix URL parameter preservation (year ranges)

---

## 11. Documentation Updates (Throughout)

- Create and maintain CLAUDE.md with project guide
- Create optimizations.md for performance strategies
- Create docs/ui-learnings.md for CSS patterns
- Create docs/architecture.md, docs/ci-cd.md, docs/pr-validation.md
- Create docs/submission-form.md, docs/dblp.md, docs/orcid.md
- Create docs/pr-conflicts.md, docs/institutions.md
- Refactor CLAUDE.md into separate doc files (Jan 12)

---

## 12. Submission Form Updates (Jan 13, 2026)

- Add GitHub profile confirmation checkbox to submission form
- Make checkbox appear for all actions (add/update/remove)
- Add link to GitHub profile setup documentation

---

## 13. UI Improvements - Area Selection (Jan 18, 2026)

### "All" Toggle Switch
- Replace "[off | on]" text links with modern toggle switch
- Add toggle to both banner and sidebar ("All Areas")
- Sync toggle state with area checkboxes
- Three visual states: on (blue), partial (steel blue), off (gray)

### Empty State Improvements
- Replace plain "no areas selected" message with friendly callout
- Add clickable area pills (AI, Systems, Theory, Interdisc.) that activate each category
- Add "Select All Areas" button

### Hover Effects
- Add consistent hover effects (brighten + lift) to all interactive pills:
  - Area indicators in banner
  - Area toggle buttons in sidebar
  - Tour button
  - New area pill buttons in empty state

### Documentation
- Update CLAUDE.md and src/README.md with new source files (area-dropdown.ts, tour.ts)
- Update event-handlers.ts description and line counts

### Submission Form Improvements
- Add guidance to Update workflow: use Remove action for industry/emeritus moves
- Hide batch submission help text for Update and Remove actions

---

**Total interactions: ~230+ commands over 6 weeks**
