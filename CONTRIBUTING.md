# Contributing to CSrankings

Thanks for contributing to CSrankings! Here are some guidelines to getting your pull request accepted.


1. _Do not use Excel to edit any .csv files; Excel incorrectly tries to
convert some Google Scholar entries to formulas, corrupting the
database. Use a text editor like emacs or NotePad instead._

2. _Insert new faculty **in alphabetical order**, not at the end of `csrankings.csv`._

3. _Read and check **all** the boxes below by filling them in with an X._

**Inclusion criteria**

- [ ] Make sure that any faculty you add meet the inclusion
criteria. Eligible faculty include only full-time, tenure-track research
faculty members on a given campus who can *solely* advise PhD students in
Computer Science. Faculty not in a CS department or similar who can
advise PhD students in CS can be included regardless of their home
department. Faculty should also have a 75%+ time appointment (check
`old/industry.csv` for faculty who are now more than 25% in industry).

**Updating an affiliation or home page**

- [ ] Update affiliations, home pages, and Google Scholar entries by modifying `csrankings.csv`. For the Google Scholar entry, just use the alphanumeric identifier in the middle of the URL. If none is there, put NOSCHOLARPAGE.

**Adding one or more faculty members (including an entire department)**

- [ ] If the department is not yet listed in CSrankings, the entire faculty needs to be added (not just one faculty member).

- [ ] Enter each faculty member's [DBLP](http://dblp.org) name, home page, and Google Scholar entry (just the alphanumeric identifier, not the whole URL) by modifying `csrankings.csv`; include disambiguation suffixes like 0001 as needed. If the faculty entry is currently ambiguous, please do not include them. Send mail to the DBLP maintainers (dblp@dagstuhl.de) with a few publications by a particular faculty member; also, open an issue so that when the DBLP database is updated, that faculty member's information can be added.

- [ ] If DBLP has multiple entries for this person, all of them need to be listed. If an alias is not already present in `dblp-aliases.csv`, add it.

- [ ] If the institution you are adding is not in the US,
update `country-info.csv`.


