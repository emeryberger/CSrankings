#!/bin/sh
gunzip -dc dblp.xml.gz | xmllint --stream --loaddtd --dtdattr --noent --path '.' -  > dblp-fixed.xml
