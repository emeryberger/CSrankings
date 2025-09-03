from csrankings import *
from collections import *

facultydict1 = csv2dict_str_str("faculty-affiliations.csv")
aliasdict = csv2dict_str_str("dblp-aliases.csv")
reversealiasdict = {v: k for k, v in aliasdict.items()}
facultydict = OrderedDict(
    sorted(facultydict1.items(), key=lambda t: t[1] + t[0])
)
del facultydict["name"]
for name in facultydict:
    if name == "name":
        continue
    if name in reversealiasdict:
        print(reversealiasdict[name].encode("utf8") + " , " + facultydict1[
            name
        ].encode("utf8"))
        print name.encode("utf8") + " , " + facultydict1[name].encode("utf8")
    elif name in aliasdict:
        print(name.encode("utf8") + " , " + facultydict1[name].encode("utf8"))
        print(aliasdict[name].encode("utf8") + " , " + facultydict1[
            name
        ].encode("utf8"))
    else:
        print(name.encode("utf8") + " , " + facultydict1[name].encode("utf8"))
