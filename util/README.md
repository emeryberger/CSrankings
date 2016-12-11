Most of the scripts in this directory are invoked by make. Others are
used to assist manual curation of the databases.

* regenerate-data.py

  Updates the file `generated-data.csv` (containing authors, pub
  counts, and areas) by processing DBLP and
  `faculty-affiliations.csv`. Invoked by the top-level Makefile (plain
  old `make`).

* make-web-pages.py
* clean-web-pages.py

  These scripts search for likely home pages and add them to
  `homepages.csv`, and then "clean" the updated `homepages.csv`
  database (sorting it into a new file).  The top-level `make
  home-pages` invokes both of these and replaces the old file with the
  new one.

* fix-dblp.sh

  Cleans up DBLP for later processing. This step needs to be done for
  each update of the local DBLP database, and is invoked by `make
  update-dblp`.

* dblp-lookup.sh

  This script is used to find the likely DBLP canonical name for many
  authors at a time. It takes an input file of names (one per line)
  and for each line, outputs the best matches found in the on-line
  DBLP database.

* generate-aliases.py

  Mines the DBLP file for author aliases. The generated file is
  currently manually sorted and combined with the existing
  `dblp-aliases.csv` file, which also contains manually-added aliases
  not present in DBLP.
