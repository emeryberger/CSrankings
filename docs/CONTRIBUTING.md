# Contributing to CSrankings

Thanks for contributing to CSrankings! Here are some guidelines to getting your pull request accepted.

* **To update an affiliation or home page**: update the files `faculty-affiliations.csv` and the file `homepages.csv`.

* **To add one or more faculty members (including an entire department)**: Update the same files as above.
(CSrankings has an automatic home page generator, but it is not perfect.)
  + If the institution you are adding is not in the US,
please update `country-info.csv`.

   + Make sure that faculty members' names are **exactly** as they appear in [DBLP](http://dblp.org), including disambiguation suffixes
   like 0001, if needed.
If DBLP has multiple entries for this person, all of them need to be listed.
If an alias is not already in `dblp-aliases.csv`, please add it.

   + Pay close attention to the criteria for including faculty. Eligible faculty include only full-time, tenure-track faculty members on a 
given campus who can advise PhD students in Computer Science. Faculty not in a CS department or similar
who can advise PhD students in CS can be included regardless of their home department.

