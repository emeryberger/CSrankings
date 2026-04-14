Computer Science Rankings
=========================

This ranking of top computer science schools is designed to identify institutions and faculty actively engaged in research across a number of areas of computer science. Unlike US News and World Report's approach, which is <a target="_blank" href="https://www.usnews.com/education/best-graduate-schools/articles/science-schools-methodology">exclusively based on surveys</a>, this ranking is entirely metrics-based. It measures the number of publications by faculty that have appeared at the most selective conferences in each area of computer science.

This approach is intended to be difficult to game, since publishing in such conferences is generally difficult: contrast this with other approaches like citation-based metrics, which have been repeatedly shown to be <a target="_blank" href="https://arxiv.org/abs/1212.0638">easy</a> to <a target="_blank" href="https://evaluation.hypotheses.org/files/2010/12/pdf_IkeAntkareISSI.pdf">manipulate</a>. That said, incorporating citations in some form is a long-term goal.

See the <a href="https://csrankings.org/faq.html">FAQ</a> for more details.

---

This repository contains all code and data used to build the computer science rankings website, hosted here:
https://csrankings.org

### Adding or modifying affiliations

## 👉 **Use the [self-service submission form](https://csrankings.org/submit/).** 👈

**Essentially all contributions should be made through the form** — no clone, no CSV editing, no worrying about file format. The form validates your entry (DBLP name, homepage, Google Scholar ID, ORCID) and files an issue that is auto-processed into a PR. It supports:

- **Add** — new tenure-track faculty, with a **batch mode** for submitting an entire department at once (no rate limit on batch submissions).
- **Update** — change affiliation (when someone moves), update homepage URL or Google Scholar ID, or add a DBLP disambiguation suffix (e.g., `0001`).
- **Remove** — for faculty who retired, became emeritus, moved to industry (records the company), are deceased, are no longer tenure-track, or left academia. (Entries are moved to `old/`, not deleted.)

**_NOTE: Submissions are processed on a quarterly basis, so it may take up to three months for your change to appear._**

If your institution isn't yet listed, open a [new institution issue](https://github.com/emeryberger/CSrankings/issues/new?template=new-institution.md) first — then submit faculty through the form. Direct edits to `csrankings-[a-z].csv` via pull request are only for maintainers and unusual cases; see [`CONTRIBUTING.md`](CONTRIBUTING.md). Do not edit `csrankings.csv`; it is auto-generated.

### Trying it out at home

Because of GitHub size limits, to run this site, you will want to download the DBLP
data by running ``make update-dblp`` (note that this will consume
upwards of 19GiB of memory). To then rebuild the databases, just run
``make``. You can test it by running a local web server (e.g., ``python3 -m http.server``)
and then connecting to [http://0.0.0.0:8000](http://0.0.0.0:8000).

You will also need to install the following dependencies:

```bash
# On Debian/Ubuntu:
apt-get install libxml2-utils npm

# Install Node.js packages:
npm install -g typescript google-closure-compiler

# Install Python packages:
python3 -m pip install -r requirements.txt
```

Note: Python 3.12+ is recommended. The DBLP filtering uses a streaming lxml parser for efficient memory usage.

### Quick contribution via a shallow clone

Most contributors should use the [web-based options above](#adding-or-modifying-affiliations) — no clone needed. If you do need a local copy for larger changes, a full clone of the CSrankings repository is around 400MB. To avoid downloading the full git history, you can do a shallow clone. Follow these steps:

1. Fork the CSrankings repo. If you have an existing fork, but it is
not up to date with the main repository, this technique may not
work. If necessary, delete and re-create your fork to get it up to
date. (Do not delete your existing fork if it has unmerged changes you
want to preserve!)
1. Do a shallow clone of your fork: `git clone --depth 1
https://github.com/yourusername/CSrankings`. This will only download
the most recent commit, not the full git history.
1. Make your changes on a branch, push them to your clone, and create
a pull request on GitHub as usual.

If you want to make another contribution and some time has passed,
perform steps 1-3 again, creating a fresh fork and shallow clone.


### Acknowledgements and other rankings

This site was developed primarily by and is maintained by [Emery
Berger](https://emeryberger.com). It incorporates extensive feedback
from too many folks to mention here, including many contributors who
have helped to add and maintain faculty affiliations, home pages, and
so on.

This site was initially based on code and
data collected by [Swarat
Chaudhuri](https://www.cs.utexas.edu/~swarat/) (UT-Austin), though
it has evolved considerably since its inception. The
original faculty affiliation dataset was constructed by [Papoutsaki et
al.](http://cs.brown.edu/people/alexpap/faculty_dataset.html); since
then, it has been extensively cleaned and updated by numerous
contributors. A previous ranking
also used DBLP and Brown's dataset for [ranking theoretical computer
science](https://projects.csail.mit.edu/dnd/ranking/.).

This site uses information from [DBLP.org](http://dblp.org) which is made
available under the ODC Attribution License.

### License

CSRankings is covered by the [Creative Commons
Attribution-NonCommercial-NoDerivatives 4.0 International
License](https://creativecommons.org/licenses/by-nc-nd/4.0/).
