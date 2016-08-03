TARGETS = csrankings.js generated-author-info.csv # faculty-coauthors.csv

all: $(TARGETS)

clean:
	rm $(TARGETS)

csrankings.js: csrankings.ts
	tsc --noImplicitAny --noImplicitReturns csrankings.ts

update-dblp:
	@echo "Downloading from DBLP."
	rm -f dblp.xml.gz
	wget http://dblp.uni-trier.de/xml/dblp.xml.gz
	@echo "Fixing character encodings."
	sh ./util/fix-dblp.sh
	mv dblp-fixed.xml dblp.xml
	@echo "Done."

fix-affiliations:
	python util/fix-affiliations.py | sort -k2 -t"," | uniq  >  /tmp/f.csv
	mv /tmp/f.csv faculty-affiliations.csv

faculty-coauthors.csv: dblp.xml util/generate-faculty-coauthors.py util/csrankings.py
	@echo "Rebuilding the co-author database (faculty-coauthors.csv)."
	python util/generate-faculty-coauthors.py
	@echo "Done."

generated-author-info.csv: faculty-affiliations.csv dblp.xml util/regenerate-data.py util/csrankings.py
	@echo "Rebuilding the publication database (generated-author-info.csv)."
	python util/regenerate-data.py
	@echo "Done."

