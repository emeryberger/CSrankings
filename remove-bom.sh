awk '{if(NR==1)sub(/^\xef\xbb\xbf/,"");print}'
