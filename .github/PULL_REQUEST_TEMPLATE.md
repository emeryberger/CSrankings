## Required Checklist

Read [CONTRIBUTING.md](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md) and check **all** boxes that apply.
Delete any lines that don't apply to your PR.

### Identity & Format
- [ ] My GitHub profile shows my full name[^1]
- [ ] PR title is descriptive (not "Update csrankings-x.csv")[^2]
- [ ] One PR per institution, all changes combined[^3]
- [ ] Only modified `csrankings-[a-z].csv` or `old/industry.csv`[^4]
- [ ] Did NOT use Excel[^5]
- [ ] No spaces after commas, no missing fields[^6]
- [ ] Entries in alphabetical order by full name[^7]

### Data Accuracy
- [ ] Name matches [DBLP](https://dblp.org) exactly (including 0001 suffixes)[^8]
- [ ] Homepage URL works and shows name + affiliation[^9]
- [ ] Google Scholar ID is the 12-character code only[^10]

### Eligibility
- [ ] Faculty is full-time, tenure-track[^11]
- [ ] Can **solely** advise CS PhD students[^12]
- [ ] If not in CS department: included justification with links[^13]

### New Institutions
- [ ] If adding new institution: opened issue first[^14]
- [ ] Adding **all** CS faculty (not just one)[^15]

---

[^1]: Anonymous submissions are rejected to ensure accountability. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#non-anonymous)
[^2]: Generic titles make the PR queue difficult to manage. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#pr-title)
[^3]: Multiple PRs for one institution create merge conflicts. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#one-pr)
[^4]: Other files are auto-generated or require maintainer access. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#allowed-files)
[^5]: Excel corrupts Google Scholar IDs by converting them to formulas. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#no-excel)
[^6]: Malformed CSV lines break the data pipeline. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#csv-format)
[^7]: Alphabetical order makes entries easy to find and reduces merge conflicts. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#alphabetical)
[^8]: Publications are matched by exact DBLP name; mismatches = zero papers counted. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#dblp-name)
[^9]: Automated validation fetches homepage to verify affiliation. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#homepage)
[^10]: Full URLs or `&hl=en` suffixes break the Scholar lookup. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#scholar-id)
[^11]: Adjuncts, visitors, and part-time faculty are excluded. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#tenure-track)
[^12]: Faculty who can only co-advise don't meet inclusion criteria. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#sole-advising)
[^13]: E.g., courtesy appointment in CS, or graduate program membership. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#non-cs-dept)
[^14]: Institution must be added to `institutions.csv` first by maintainer. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#new-institution)
[^15]: Partial departments skew rankings; all-or-nothing ensures fairness. [more info](https://github.com/emeryberger/CSrankings/blob/gh-pages/CONTRIBUTING.md#entire-dept)
