if [ $# = 0 ]; then
    echo "You need to specify the filename to input from."
    exit
fi

IFS='
'
for i in $(<$1)
do xmllint --xpath 'string(//authors/author)' "http://dblp.org/search/author?xauthor=$i" 
   echo ""
done
