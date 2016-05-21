This repo contains the code and data used to build this web page:
http://csrankings.org

To add or modify a faculty member's affiliation, please modify the
file ```faculty-affiliations.csv``` and issue a pull request. Make
sure that the faculty's name corresponds to their <a href="http://dblp.uni-trier.de/search/">DBLP</a> author entry;
for example, Les Valiant's entry is <a
href="http://dblp.uni-trier.de/pers/hd/v/Valiant:Leslie_G=">```Leslie
G. Valiant , Harvard University```</a>.

The Python script ```regenerate-data.py``` builds the
```generated-author-info.csv``` file which the web app uses to compute
rankings. This needs to be re-executed every time the faculty
affiliation csv changes.
