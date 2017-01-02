TARGETS = csrankings.js generated-author-info.csv

.PHONY: home-pages fix-affiliations

all: | $(TARGETS) fix-affiliations home-pages 

clean:
	rm $(TARGETS)

csrankings.js: csrankings.ts
	@echo "Rebuilding JavaScript code."
	tsc --noImplicitAny --noImplicitReturns --forceConsistentCasingInFileNames --noImplicitThis --noUnusedLocals --noUnusedParameters --noFallthroughCasesInSwitch --strictNullChecks --pretty csrankings.ts

update-dblp:
	@echo "Downloading from DBLP."
	rm -f dblp.xml.gz
	wget http://dblp.uni-trier.de/xml/dblp.xml.gz
	@echo "Fixing character encodings."
	sh ./util/fix-dblp.sh
	mv dblp-fixed.xml dblp.xml
	@echo "Done."

home-pages: faculty-affiliations.csv
	@echo "Rebuilding home pages (homepages.csv)."
	@python util/make-web-pages.py
	@echo "Cleaning home pages."
	@python util/clean-web-pages.py
	@mv homepages-sorted.csv homepages.csv
	@echo "Done."

fix-affiliations: faculty-affiliations.csv
	@echo "Updating affiliations."
	@python util/fix-affiliations.py | sort -k2 -t"," | uniq > /tmp/f1.csv
	@echo "name,affiliation" | cat - /tmp/f1.csv >  /tmp/f2.csv
	@rm /tmp/f1.csv
	@mv /tmp/f2.csv faculty-affiliations.csv

#faculty-coauthors.csv: dblp.xml util/generate-faculty-coauthors.py util/csrankings.py
#	@echo "Rebuilding the co-author database (faculty-coauthors.csv)."
#	python util/generate-faculty-coauthors.py
#	@echo "Done."

generated-author-info.csv: faculty-affiliations.csv dblp.xml util/regenerate-data.py util/csrankings.py
	@echo "Rebuilding the publication database (generated-author-info.csv)."
	pypy util/regenerate-data.py
	@echo "Done."

