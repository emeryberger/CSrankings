from csrankings import *
facultydict = csv2dict_str_str('faculty-affiliations.csv')
aliasdict = csv2dict_str_str('dblp-aliases.csv')
reversealiasdict = {v: k for k, v in aliasdict.items()}
for name in facultydict:
    if (name in reversealiasdict):
        print reversealiasdict[name].encode('utf8') + " , " + facultydict[name].encode('utf8')
        print name.encode('utf8') + " , " + facultydict[name].encode('utf8')
    if (name in aliasdict):
        print name.encode('utf8') + " , " + facultydict[name].encode('utf8')
        print aliasdict[name].encode('utf8') + " , " + facultydict[name].encode('utf8')
    else:
        print name.encode('utf8') + " , " + facultydict[name].encode('utf8')
