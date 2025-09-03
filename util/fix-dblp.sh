#!/bin/sh
gunzip -dc dblp-original.xml.gz | awk 'NF' | xmllint --loaddtd --dtdattr --noent --path '.' -  > dblp-fixed.xml
