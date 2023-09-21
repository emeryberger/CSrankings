#!/bin/sh
gunzip -dc dblp.xml.gz | awk 'NF' | xmllint --loaddtd --dtdattr --noent --path '.' -  > dblp-fixed.xml
