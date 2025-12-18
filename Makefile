#
# CSrankings
# http://csrankings.org
# Copyright (C) 2017-2020 by Emery Berger <http://emeryberger.org>
# See COPYING for license information.
#

TARGETS = csrankings.js csrankings.min.js generated-author-info.csv

.PHONY: home-pages scholar-links fix-affiliations update-dblp clean-dblp download-dblp shrink-dblp clean-csrankings update-author-names update-dblp-full apply-author-names backup-dblp update-dblp-date

PYTHON = python3.12 # 3.7
PYPY   = python3.12 # pypy

# DBLP   = dblp.org
DBLP   = dblp.uni-trier.de

# Note: BaseX is no longer used for DBLP filtering. We now use a streaming Python SAX parser
# which uses constant memory (~50MB) instead of loading the entire document (~11GB).

all: generated-author-info.csv csrankings.js csrankings.min.js csrankings.csv  # fix-affiliations home-pages scholar-links
	$(MAKE) clean-csrankings

clean:
	rm -f $(TARGETS)

csrankings.js: src/types.ts src/config.ts src/utils.ts src/data-loader.ts src/region.ts src/computation.ts src/verification.ts src/rendering.ts src/continents.ts src/app.ts
	@echo "Rebuilding JavaScript code."
	tsc --project tsconfig.json

csrankings.min.js: csrankings.js
	google-closure-compiler --js csrankings.js > csrankings.min.js

update-dblp:
	$(MAKE) download-dblp
	$(MAKE) shrink-dblp
	$(PYTHON) util/generate-aliases.py > dblp-aliases.csv
	@echo "Done."

clean-dblp:
	@echo "Fixing character encodings."
	sh ./util/fix-dblp.sh
	gzip dblp-fixed.xml
	$(PYTHON) util/find-missing-names-dblp.py

download-dblp:
	@echo "Downloading from DBLP."
	rm -f dblp.xml.gz
	curl -o dblp-original.xml.gz https://$(DBLP)/xml/dblp.xml.gz

shrink-dblp:
	@echo "Shrinking the DBLP file (streaming, low memory)."
	gunzip -dc dblp-original.xml.gz | $(PYTHON) util/filter-dblp.py | gzip > dblp.xml.gz
	@echo "Filtered DBLP saved to dblp.xml.gz"

faculty-affiliations.csv homepages.csv scholar.csv csrankings.csv: csrankings-*.csv
	@echo "Splitting main datafile."
	@$(PYTHON) util/split-csv.py
	@echo "Done."

clean-csrankings:
	@echo "Cleaning."
	@$(PYTHON) util/clean-csrankings.py
	@$(PYTHON) util/sort-csv-files.py
	@echo "Done."

home-pages: faculty-affiliations.csv homepages.csv
	@echo "Rebuilding home pages (homepages.csv)."
	@$(PYTHON) util/make-web-pages.py
	@echo "Cleaning home pages."
	@$(PYTHON) util/clean-web-pages.py
	@mv homepages-sorted.csv homepages.csv
	@echo "Done."

scholar-links: faculty-affiliations.csv homepages.csv
	@echo "Rebuilding Google Scholar links (scholar.csv)."
	@$(PYTHON) util/make-scholar-links.py
	@echo "Cleaning Scholar links."
	@$(PYTHON) util/clean-scholar-links.py
	@echo "Done."

fix-affiliations: faculty-affiliations.csv
	@echo "Updating affiliations."
	@$(PYTHON) util/fix-affiliations.py | sort -k2 -t"," | uniq > /tmp/f1.csv
	@echo "name,affiliation" | cat - /tmp/f1.csv >  /tmp/f2.csv
	@rm /tmp/f1.csv
	@mv /tmp/f2.csv faculty-affiliations.csv

faculty-coauthors.csv: dblp.xml.gz util/generate-faculty-coauthors.py util/csrankings.py
	@echo "Rebuilding the co-author database (faculty-coauthors.csv)."
	$(PYTHON) util/generate-faculty-coauthors.py
	@echo "Done."

generated-author-info.csv: faculty-affiliations.csv dblp.xml.gz util/regenerate_data.py util/csrankings.py dblp-aliases.csv
	@echo "Rebuilding the publication database (generated-author-info.csv)."
	@$(PYPY) util/split-csv.py
	@$(PYPY) util/regenerate_data.py
	@echo "Done."
#	@$(MAKE) clean-csrankings
#       @$(PYPY) util/split-csrankings.py
#	@$(MAKE) clean-csrankings

collab-graph: generated-author-info.csv faculty-coauthors.csv
	@echo "Generating the list of all publications (all-author-info.csv)."
	$(PYTHON) util/generate-all-pubs.py
	@echo "Building collaboration graph data."
	$(PYTHON) util/make-collaboration-graph.py

# Update the "last update" date in index.html to current month/year
update-dblp-date:
	@echo "Updating DBLP date in index.html..."
	@MONTH_YEAR=$$(date "+%B %Y"); \
	sed -i.bak -E "s/(DBLP<\/a> \(last update )[A-Za-z]+ [0-9]{4}/\1$$MONTH_YEAR/" index.html && \
	rm -f index.html.bak && \
	echo "Updated to: $$MONTH_YEAR"

# Backup current DBLP before downloading new one
backup-dblp:
	@if [ -f dblp-original.xml.gz ]; then \
		echo "Backing up dblp-original.xml.gz to prev-dblp.xml.gz"; \
		cp dblp-original.xml.gz prev-dblp.xml.gz; \
	else \
		echo "No dblp-original.xml.gz to backup (first run?)"; \
	fi

# Detect DBLP author name changes (dry-run preview)
# Requires: prev-dblp.xml.gz (previous DBLP dump) and dblp-original.xml.gz (current)
update-author-names:
	@echo "Detecting DBLP author name changes..."
	@if [ ! -f prev-dblp.xml.gz ]; then \
		echo "Error: prev-dblp.xml.gz not found. Save old DBLP before downloading new one:"; \
		echo "  cp dblp-original.xml.gz prev-dblp.xml.gz"; \
		exit 1; \
	fi
	$(PYTHON) util/new-name-detector.py --old prev-dblp.xml.gz --new dblp-original.xml.gz > name-changes.csv
	@echo "Name changes written to name-changes.csv"
	@echo "Previewing changes (dry-run):"
	$(PYTHON) util/update-new-names.py --diff name-changes.csv
	@echo ""
	@echo "To apply changes, run:"
	@echo "  make apply-author-names"

# Apply detected author name changes (modifies csrankings-*.csv files)
apply-author-names:
	@if [ ! -f name-changes.csv ]; then \
		echo "Error: name-changes.csv not found. Run 'make update-author-names' first."; \
		exit 1; \
	fi
	@CHANGES=$$(wc -l < name-changes.csv | tr -d ' '); \
	if [ "$$CHANGES" -le 1 ]; then \
		echo "No name changes to apply."; \
	else \
		echo "Applying $$(($$CHANGES - 1)) name change(s)..."; \
		$(PYTHON) util/update-new-names.py --diff name-changes.csv --in-place; \
	fi

# Fully automated DBLP update: backup, download, shrink, detect & apply name changes, regenerate data
# This is the one-command solution for updating DBLP
update-dblp-full:
	@echo "=== FULLY AUTOMATED DBLP UPDATE ==="
	@echo ""
	@echo "Step 1/6: Backing up current DBLP..."
	$(MAKE) backup-dblp
	@echo ""
	@echo "Step 2/6: Downloading new DBLP from $(DBLP)..."
	$(MAKE) download-dblp
	@echo ""
	@echo "Step 3/6: Filtering DBLP to CSRankings venues..."
	$(MAKE) shrink-dblp
	@echo ""
	@echo "Step 4/6: Generating DBLP aliases..."
	$(PYTHON) util/generate-aliases.py > dblp-aliases.csv
	@echo ""
	@echo "Step 5/6: Detecting and applying author name changes..."
	@if [ -f prev-dblp.xml.gz ]; then \
		$(PYTHON) util/new-name-detector.py --old prev-dblp.xml.gz --new dblp-original.xml.gz > name-changes.csv; \
		CHANGES=$$(wc -l < name-changes.csv | tr -d ' '); \
		if [ "$$CHANGES" -le 1 ]; then \
			echo "No name changes detected."; \
		else \
			echo "Detected $$(($$CHANGES - 1)) name change(s). Applying..."; \
			$(PYTHON) util/update-new-names.py --diff name-changes.csv --in-place; \
		fi; \
	else \
		echo "No previous DBLP backup found. Skipping name change detection."; \
	fi
	@echo ""
	@echo "Step 6/7: Regenerating publication data..."
	$(MAKE) generated-author-info.csv
	@echo ""
	@echo "Step 7/7: Updating DBLP date in index.html..."
	$(MAKE) update-dblp-date
	@echo ""
	@echo "=== DBLP UPDATE COMPLETE ==="
	@echo "You may want to run 'make all' to rebuild everything."

