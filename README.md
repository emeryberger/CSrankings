Computer Science Rankings
=========================

This ranking of top computer science schools is designed to identify institutions and faculty actively engaged in research across a number of areas of computer science. Unlike US News and World Report's approach, which is <a target="_blank" href="http://www.usnews.com/education/best-graduate-schools/articles/science-schools-methodology">exclusively based on surveys</a>, this ranking is entirely metrics-based. It measures the number of publications by faculty that have appeared at the most selective conferences in each area of computer science.

This approach is intended to be difficult to game, since publishing in such conferences is generally difficult: contrast this with other approaches like citation-based metrics, which have been repeatedly shown to be <a target="_blank" href="http://arxiv.org/abs/1212.0638">easy</a> to <a target="_blank" href="http://evaluation.hypotheses.org/files/2010/12/pdf_IkeAntkareISSI.pdf">manipulate</a>. That said, incorporating citations in some form is a long-term goal.

See the <a href="http://csrankings.org/faq.html">FAQ</a> for more details.

---

This repository contains all code and data used to build the computer science rankings website, hosted here:
http://csrankings.org

### Adding or modifying affiliations

Please read <a href="CONTRIBUTING.md">```CONTRIBUTING.md```</a> for full details on how to contribute.

### Trying it out at home

Because of GitHub size limits, to run this site, you will want to download the DBLP
data by running ``make update-dblp`` (note that this will consume
upwards of 19GiB of memory). To then rebuild the databases, just run
``make``. You can test it by running a local web server (e.g., ``python3 -m http.server``)
and then connecting to [http://0.0.0.0:8000](http://0.0.0.0:8000).

You will also need to install libxml2-utils (or whatever package
includes xmllint on your distro), npm, typescript, closure-compiler, python-lxml, [pypy](http://doc.pypy.org/en/latest/install.html),
and basex via a command line like:

``apt-get install libxml2-utils npm python-lxml basex; npm install -g typescript google-closure-compiler``

### Acknowledgements and other rankings

This site was developed primarily by and is maintained by [Emery
Berger](https://emeryberger.com). It incorporates extensive feedback
from too many folks to mention here, including many contributors who
have helped to add and maintain faculty affiliations, home pages, and
so on.

This site was initially based on code and
data collected by [Swarat
Chaudhuri](https://www.cs.rice.edu/~sc40/) (Rice University), though
it has evolved considerably since its inception. The
original faculty affiliation dataset was constructed by [Papoutsaki et
al.](http://cs.brown.edu/people/alexpap/faculty_dataset.html); since
then, it has been extensively cleaned and updated by numerous
contributors. A previous ranking
also used DBLP and Brown's dataset for [ranking theoretical computer
science](http://projects.csail.mit.edu/dnd/ranking/.).

This site uses information from [DBLP.org](http://dblp.org) which is made
available under the ODC Attribution License.

### License

CSRankings is covered by the [Creative Commons
Attribution-NonCommercial-NoDerivatives 4.0 International
License](https://creativecommons.org/licenses/by-nc-nd/4.0/).
