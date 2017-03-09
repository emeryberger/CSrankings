#!/bin/sh
gunzip -dc dblp.xml.gz | xmllint --loaddtd --dtdattr --noent --path '.' -  > dblp-fixed.xml
