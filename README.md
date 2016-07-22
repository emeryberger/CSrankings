This repo contains the code and data used to build this web page:
http://csrankings.org

To add or modify a faculty member's affiliation, please modify the
file ```faculty-affiliations.csv``` and issue a pull request. Make
sure that the faculty's name corresponds to their <a href="http://dblp.uni-trier.de/search/">DBLP</a> author entry;
for example, Les Valiant's entry is <a
href="http://dblp.uni-trier.de/pers/hd/v/Valiant:Leslie_G=">```Leslie
G. Valiant , Harvard University```</a>.

If you want to change anything, you will want to download the DBLP data by running ``make update-dblp``. To then rebuild the databases, just run ```make```.

You will need to install libxml2-utils (or whatever package includes xmllint on your distro), npm, typescript, and python-lxml at the minimum.

apt-get install libxml2-utils, npm, python-lxml

npm install -g typescript

Be warned that running ``make update-dblp `` will consume upwards of 19GiB of memory (so make sure your system has sufficient resources).
