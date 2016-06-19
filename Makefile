TARGETS = csrank.js generated-author-info.csv faculty-coauthors.csv

all: $(TARGETS)

clean:
	rm $(TARGETS)

csrank.js: csrank.ts
	tsc --noImplicitAny --noImplicitReturns csrank.ts

update-dblp:
	@echo "Downloading from DBLP."
	rm -f dblp.xml.gz
	wget http://dblp.uni-trier.de/xml/dblp.xml.gz
	@echo "Fixing character encodings."
	sh ./util/fix-dblp.sh
	mv dblp-fixed.xml dblp.xml
	@echo "Done."

faculty-coauthors.csv: dblp.xml util/generate-faculty-coauthors.py
	@echo "Rebuilding the co-author database (faculty-coauthors.csv)."
	python util/generate-faculty-coauthors.py
	@echo "Done."

generated-author-info.csv: faculty-affiliations.csv dblp.xml util/regenerate-data.py
	@echo "Rebuilding the publication database (generated-author-info.csv)."
	python util/regenerate-data.py
	@echo "Done."

