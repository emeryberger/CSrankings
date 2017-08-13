# Contributing to CSrankings

Thanks for contributing to CSrankings! Here are some guidelines to getting your pull request accepted.

**Inclusion criteria**

- [ ] Make sure that any faculty you add meet the inclusion
criteria. Eligible faculty include only full-time, tenure-track
faculty members on a given campus who can advise PhD students in
Computer Science. Faculty not in a CS department or similar who can
advise PhD students in CS can be included regardless of their home
department.

**Updating an affiliation or home page**

- [ ] Update affiliations by modifying `faculty-affiliations.csv`

- [ ] Change the home page by modifying the file `homepages.csv`.

**Adding one or more faculty members (including an entire department)**

- [ ] If the department is not yet listed in CSrankings, the entire faculty needs to be added (not just one faculty member).

- [ ] Enter each faculty member's [DBLP](http://dblp.org) name by modifying `faculty-affiliations.csv`; include disambiguation suffixes like 0001 as needed.

- [ ] If DBLP has multiple entries for this person, all of them need to be listed. If an alias is not already present in `dblp-aliases.csv`, add it.

- [ ] Enter their home page by modifying the file `homepages.csv`.
(CSrankings has an automatic home page generator, but it is not perfect.)

- [ ] If the institution you are adding is not in the US,
update `country-info.csv`.


