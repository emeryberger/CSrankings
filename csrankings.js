/*

  CSrankings.ts

  @author Emery Berger <emery@cs.umass.edu> http://www.emeryberger.com

  */
/// <reference path="./typescript/jquery.d.ts" />
/// <reference path="./typescript/papaparse.d.ts" />
/// <reference path="./typescript/set.d.ts" />
/// <reference path="./typescript/d3.d.ts" />
/// <reference path="./typescript/d3pie.d.ts" />
;
;
;
;
;
;
;
$('.area').on('hidden.bs.collapse', function (e) {
    e.stopPropagation();
    $(this).find(".glyphicon-chevron-down").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-right");
});
$('.area').on('shown.bs.collapse', function (e) {
    e.stopPropagation();
    $(this).find(".glyphicon-chevron-right").removeClass("glyphicon-chevron-right").addClass("glyphicon-chevron-down");
});
$('.panel').on('hidden.bs.collapse', function (e) {
    $(this).find(".panel-heading").find(".glyphicon-chevron-down").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-right");
});
$('.panel').on('shown.bs.collapse', function (e) {
    $(this).find(".panel-heading").find(".glyphicon-chevron-right").removeClass("glyphicon-chevron-right").addClass("glyphicon-chevron-down");
});
$('.panel a').click(function(event){
            event.stopPropagation();
        });

var CSRankings = (function () {
    function CSRankings() {
        /* Build the areaDict dictionary: areas -> names used in pie charts
           and areaPosition dictionary: areas -> position in area array
           */
           for (var position = 0; position < CSRankings.areaMap.length; position++) {
            var _a = CSRankings.areaMap[position], area = _a.area, title = _a.title;
            CSRankings.areas[position] = area;
            CSRankings.areaNames[position] = title;
            CSRankings.fields[position] = "field_" + area;
            CSRankings.areaDict[area] = CSRankings.areaNames[position];
            CSRankings.areaPosition[area] = position;
        }
        for (var _i = 0, _b = CSRankings.aiAreas; _i < _b.length; _i++) {
            var area = _b[_i];
            CSRankings.aiFields.push(CSRankings.areaPosition[area]);
        }
        for (var _c = 0, _d = CSRankings.systemsAreas; _c < _d.length; _c++) {
            var area = _d[_c];
            CSRankings.systemsFields.push(CSRankings.areaPosition[area]);
        }
        for (var _e = 0, _f = CSRankings.theoryAreas; _e < _f.length; _e++) {
            var area = _f[_e];
            CSRankings.theoryFields.push(CSRankings.areaPosition[area]);
        }
        for (var _g = 0, _h = CSRankings.otherAreas; _g < _h.length; _g++) {
            var area = _h[_g];
            CSRankings.otherFields.push(CSRankings.areaPosition[area]);
        }
        CSRankings.setAllCheckboxes();
        var next = function () {
            CSRankings.loadAliases(CSRankings.aliases, function () {
                CSRankings.loadHomepages(CSRankings.homepages, function () {
                    CSRankings.loadAuthorInfo(function () {
                        CSRankings.loadCountryInfo(CSRankings.countryInfo, CSRankings.rank);
                    });
                });
            });
        };
        if (CSRankings.showCoauthors) {
            CSRankings.loadCoauthors(next);
        }
        else {
            next();
        }
    }
    CSRankings.translateNameToDBLP = function (name) {
        // Ex: "Emery D. Berger" -> "http://dblp.uni-trier.de/pers/hd/b/Berger:Emery_D="
        // First, replace spaces and non-ASCII characters (not complete).
        // Known issue: does not properly handle suffixes like Jr., III, etc.
        name = name.replace(/'/g, "=");
        name = name.replace(/\-/g, "=");
        name = name.replace(/\./g, "=");
        name = name.replace(/Á/g, "=Aacute=");
        name = name.replace(/á/g, "=aacute=");
        name = name.replace(/è/g, "=egrave=");
        name = name.replace(/é/g, "=eacute=");
        name = name.replace(/ï/g, "=iuml=");
        name = name.replace(/ó/g, "=oacute=");
        name = name.replace(/ç/g, "=ccedil=");
        name = name.replace(/ä/g, "=auml=");
        name = name.replace(/ö/g, "=ouml=");
        name = name.replace(/ø/g, "=oslash=");
        name = name.replace(/Ö/g, "=Ouml=");
        name = name.replace(/ü/g, "=uuml=");
        var splitName = name.split(" ");
        var lastName = splitName[splitName.length - 1];
        splitName.pop();
        var newName = splitName.join(" ");
        newName = newName.replace(/\s/g, "_");
        newName = newName.replace(/\-/g, "=");
        var str = "http://dblp.uni-trier.de/pers/hd";
        var lastInitial = lastName[0].toLowerCase();
        str += "/" + lastInitial + "/" + lastName + ":" + newName;
        return str;
    };
    /* Create the prologue that we preface each generated HTML page with (the results). */
    CSRankings.makePrologue = function () {
        var windowHeight = $(window).height();
        var height = Math.max(0, 260, windowHeight - 480);
        var s = "<html>"
        + "<head>"
        + '<style type="text/css">'
        + '  body { font-family: "Helvetica", "Arial"; }'
        + '  #leftCol .table { padding: 20px 20px 0px 40px;}'
        + '  #rightCol .table { padding: 20px 40px 0px 20px;}'
        + '  .table span{ font-size:14px;}'
        + '  #leftCol{ border-right:solid 2px #ddd;}'
        + '  #leftCol td, #rightCol td{ border-left:solid 1px #ddd; padding-left:4px;}'
        + '  #leftCol th, #rightCol th{ border-left:solid 1px #ddd; padding-left:4px;}'
        + '  #leftCol td:first-child, #rightCol td:first-child{ border-left:none;}'
        + '  #leftCol th:first-child, #rightCol th:first-child{ border-left:none;}'
        + '  #ranking, #ranking2{ width:100%}'
        + "</style>"
        + "</head>"
        + "<body>"
        + '<div class="row">'
        + '<div class="col-md-6" id="leftCol">'
        + '<div class="table">'
        + '<table class="table-sm table-striped"'
        + 'id="ranking" valign="top">';
        return s;
    };
    /* from http://hubrik.com/2015/11/16/sort-by-last-name-with-javascript/ */
    CSRankings.compareNames = function (a, b) {
        //split the names as strings into arrays
        var aName = a.split(" ");
        var bName = b.split(" ");
        // get the last names by selecting
        // the last element in the name arrays
        // using array.length - 1 since full names
        // may also have a middle name or initial
        var aLastName = aName[aName.length - 1];
        var bLastName = bName[bName.length - 1];
        // compare the names and return either
        // a negative number, positive number
        // or zero.
        if (aLastName < bLastName)
            return -1;
        if (aLastName > bLastName)
            return 1;
        return 0;
    };
    /* Create a pie chart */
    CSRankings.makeChart = function (name) {
        console.assert(CSRankings.color.length >= CSRankings.areas.length, "Houston, we have a problem.");
        var data = [];
        var keys = CSRankings.areas;
        var uname = unescape(name);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = CSRankings.authorAreas[uname][key];
            if (value > 0) {
                data.push({ "label": CSRankings.areaDict[key],
                    "value": value,
                    "color": CSRankings.color[i] });
            }
        }
        new d3pie(name + "-chart", {
            "header": {
                "title": {
                    "text": uname,
                    "fontSize": 24,
                    "font": "open sans"
                },
                "subtitle": {
                    "text": "Publication Profile",
                    "color": "#999999",
                    "fontSize": 14,
                    "font": "open sans"
                },
                "titleSubtitlePadding": 9
            },
            "size": {
                "canvasHeight": 500,
                "canvasWidth": 500,
                "pieInnerRadius": "38%",
                "pieOuterRadius": "83%"
            },
            "data": {
                "content": data,
                "smallSegmentGrouping": {
                    "enabled": true,
                    "value": 1
                }
            },
            "labels": {
                "outer": {
                    "pieDistance": 32
                },
                "inner": {
                    "format": "value",
                    "hideWhenLessThanPercentage": 2
                },
                "mainLabel": {
                    "fontSize": 12
                },
                "percentage": {
                    "color": "#ffffff",
                    "decimalPlaces": 0
                },
                "value": {
                    "color": "#ffffff",
                    "fontSize": 10
                },
                "lines": {
                    "enabled": true
                },
                "truncation": {
                    "enabled": true
                }
            },
            "effects": {
                "load": {
                    "effect": "none"
                },
                "pullOutSegmentOnClick": {
                    "effect": "linear",
                    "speed": 400,
                    "size": 8
                }
            },
            "misc": {
                "gradient": {
                    "enabled": true,
                    "percentage": 100
                }
            }
        });
};
CSRankings.loadCoauthors = function (cont) {
    Papa.parse(CSRankings.coauthorFile, {
        download: true,
        header: true,
        complete: function (results) {
            var data = results.data;
            CSRankings.coauthors = data;
            setTimeout(cont, 0);
        }
    });
};
CSRankings.loadAliases = function (aliases, cont) {
    Papa.parse(CSRankings.aliasFile, {
        header: true,
        download: true,
        complete: function (results) {
            var data = results.data;
            var d = data;
            for (var _i = 0, d_1 = d; _i < d_1.length; _i++) {
                var aliasPair = d_1[_i];
                aliases[aliasPair.alias] = aliasPair.name;
            }
            setTimeout(cont, 0);
        }
    });
};
CSRankings.loadCountryInfo = function (countryInfo, cont) {
    Papa.parse(CSRankings.countryinfoFile, {
        header: true,
        download: true,
        complete: function (results) {
            var data = results.data;
            var ci = data;
            for (var _i = 0, ci_1 = ci; _i < ci_1.length; _i++) {
                var info = ci_1[_i];
                countryInfo[info.institution] = info.region;
            }
            setTimeout(cont, 0);
        }
    });
};
CSRankings.loadAuthorInfo = function (cont) {
    var _this = this;
    Papa.parse(CSRankings.authorinfoFile, {
        download: true,
        header: true,
        complete: function (results) {
            var data = results.data;
            _this.authors = data;
            for (var i = 0; i < CSRankings.fields.length; i++) {
                var str = 'input[name=' + CSRankings.fields[i] + ']';
                jQuery(str).click(function () { _this.rank(); });
            }
            setTimeout(cont, 0);
        }
    });
};
CSRankings.loadHomepages = function (homepages, cont) {
    Papa.parse(CSRankings.homepagesFile, {
        header: true,
        download: true,
        complete: function (results) {
            var data = results.data;
            var d = data;
            for (var _i = 0, d_2 = d; _i < d_2.length; _i++) {
                var namePage = d_2[_i];
                if (typeof namePage.homepage === 'undefined') {
                    continue;
                }
                homepages[namePage.name.trim()] = namePage.homepage.trim();
            }
            setTimeout(cont, 0);
        }
    });
};
CSRankings.inRegion = function (dept, regions) {
    switch (regions) {
        case "world":
        break;
        case "USA":
        if (dept in CSRankings.countryInfo) {
            return false;
        }
        break;
        case "europe":
        if (!(dept in CSRankings.countryInfo)) {
            return false;
        }
        if (CSRankings.countryInfo[dept] != "europe") {
            return false;
        }
        break;
        case "canada":
        if (!(dept in CSRankings.countryInfo)) {
            return false;
        }
        if (CSRankings.countryInfo[dept] != "canada") {
            return false;
        }
        break;
        case "northamerica":
        if ((dept in CSRankings.countryInfo) && (CSRankings.countryInfo[dept] != "canada")) {
            return false;
        }
        break;
        case "australasia":
        if (!(dept in CSRankings.countryInfo)) {
            return false;
        }
        if (CSRankings.countryInfo[dept] != "australasia") {
            return false;
        }
        break;
    }
    return true;
};
CSRankings.activateFields = function (value, fields) {
    for (var i = 0; i < fields.length; i++) {
        var str = "input[name=" + CSRankings.fields[fields[i]] + "]";
        jQuery(str).prop('checked', value);
    }
    CSRankings.rank();
    return false;
};
CSRankings.sortIndex = function (univagg) {
    var keys = Object.keys(univagg);
    keys.sort(function (a, b) {
        if (univagg[a] > univagg[b]) {
            return -1;
        }
        if (univagg[b] > univagg[a]) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
        if (b < a) {
            return 1;
        }
        return 0;
    });
    return keys;
};
CSRankings.computeCoauthors = function (coauthors, startyear, endyear, weights) {
    var coauthorList = {};
    for (var c in coauthors) {
        if (!coauthors.hasOwnProperty(c)) {
            continue;
        }
        var _a = coauthors[c], author = _a.author, coauthor = _a.coauthor, year = _a.year, area = _a.area;
        if ((weights[area] === 0) || (year < startyear) || (year > endyear)) {
            continue;
        }
        if (!(author in coauthorList)) {
            coauthorList[author] = new Set([]);
        }
        coauthorList[author].add(coauthor);
    }
    return coauthorList;
};
CSRankings.countAuthorAreas = function (authors, startyear, endyear, weights, authorAreas) {
    for (var r in authors) {
        if (!authors.hasOwnProperty(r)) {
            continue;
        }
        var year = authors[r].year;
        if ((year < startyear) || (year > endyear)) {
            continue;
        }
        var theArea = authors[r].area;
        if (weights[theArea] === 0) {
            continue;
        }
        var theDept = authors[r].dept;
        var theCount = parseFloat(authors[r].count);
        var name_1 = authors[r].name;
        if (name_1 in CSRankings.aliases) {
            name_1 = CSRankings.aliases[name_1];
        }
        if (!(name_1 in authorAreas)) {
            authorAreas[name_1] = {};
            for (var area in CSRankings.areaDict) {
                if (CSRankings.areaDict.hasOwnProperty(area)) {
                    authorAreas[name_1][area] = 0;
                }
            }
        }
        if (!(theDept in authorAreas)) {
            authorAreas[theDept] = {};
            for (var area in CSRankings.areaDict) {
                if (CSRankings.areaDict.hasOwnProperty(area)) {
                    authorAreas[theDept][area] = 0;
                }
            }
        }
        authorAreas[name_1][theArea] += theCount;
        authorAreas[theDept][theArea] += theCount;
    }
};
/* Build the dictionary of departments (and count) to be ranked. */
CSRankings.buildDepartments = function (authors, startyear, endyear, weights, regions, areaDeptAdjustedCount, deptCounts, deptNames, facultycount, facultyAdjustedCount) {
    /* contains an author name if that author has been processed. */
    var visited = {};
    for (var r in authors) {
        if (!authors.hasOwnProperty(r)) {
            continue;
        }
        var _a = authors[r], name_2 = _a.name, year = _a.year, area = _a.area, dept = _a.dept;
        if (name_2 in CSRankings.aliases) {
            name_2 = CSRankings.aliases[name_2];
        }
        if (typeof dept === 'undefined') {
            continue;
        }
        if ((weights[area] === 0) || (year < startyear) || (year > endyear)) {
            continue;
        }
        var areaDept = area + dept;
        var nameDept = name_2 + dept;
        if (!(areaDept in areaDeptAdjustedCount)) {
            areaDeptAdjustedCount[areaDept] = 0;
        }
        if (!CSRankings.inRegion(dept, regions)) {
            continue;
        }
        var count = parseInt(authors[r].count);
        var adjustedCount = parseFloat(authors[r].adjustedcount);
        areaDeptAdjustedCount[areaDept] += adjustedCount;
        /* Is this the first time we have seen this person? */
        if (!(name_2 in visited)) {
            visited[name_2] = true;
            facultycount[nameDept] = 0;
            facultyAdjustedCount[nameDept] = 0;
            if (!(dept in deptCounts)) {
                deptCounts[dept] = 0;
                deptNames[dept] = [];
            }
            deptNames[dept].push(name_2);
            deptCounts[dept] += 1;
        }
        facultycount[nameDept] += count;
        facultyAdjustedCount[nameDept] += adjustedCount;
    }
};
/* Compute aggregate statistics. */
CSRankings.computeStats = function (deptNames, areaDeptAdjustedCount, areas, numAreas, displayPercentages, weights) {
    var univagg = {};
    for (var dept in deptNames) {
        if (!deptNames.hasOwnProperty(dept)) {
            continue;
        }
        if (displayPercentages) {
            univagg[dept] = 1;
        }
        else {
            univagg[dept] = 0;
        }
        for (var _i = 0, areas_1 = areas; _i < areas_1.length; _i++) {
            var area = areas_1[_i];
            var areaDept = area + dept;
            if (!(areaDept in areaDeptAdjustedCount)) {
                areaDeptAdjustedCount[areaDept] = 0;
            }
            if (weights[area] != 0) {
                if (displayPercentages) {
                        // Adjusted (smoothed) geometric mean.
                        univagg[dept] *= (areaDeptAdjustedCount[areaDept] + 1.0);
                    }
                    else {
                        univagg[dept] += areaDeptAdjustedCount[areaDept];
                    }
                }
            }
            if (displayPercentages) {
                // finally compute geometric mean.
                univagg[dept] = Math.pow(univagg[dept], 1 / numAreas);
            }
        }
        return univagg;
    };
    /* Updates the 'weights' of each area from the checkboxes. */
    /* Returns the number of areas selected (checked). */
    CSRankings.updateWeights = function (weights) {
        var numAreas = 0;
        for (var ind = 0; ind < CSRankings.areas.length; ind++) {
            var area = CSRankings.areas[ind];
            weights[area] = jQuery('input[name=' + CSRankings.fields[ind] + ']').prop('checked') ? 1 : 0;
            if (weights[area] === 1) {
                /* One more area checked. */
                numAreas++;
            }
        }
        return numAreas;
    };
    CSRankings.canonicalizeNames = function (deptNames, facultycount, facultyAdjustedCount) {
        for (var dept in deptNames) {
            if (!deptNames.hasOwnProperty(dept)) {
                continue;
            }
            for (var ind = 0; ind < deptNames[dept].length; ind++) {
                var name_3 = deptNames[dept][ind];
                if (name_3 in CSRankings.aliases) {
                    deptNames[dept][ind] = CSRankings.aliases[name_3];
                    if (!(CSRankings.aliases[name_3] + dept in facultycount)) {
                        facultycount[CSRankings.aliases[name_3] + dept] = facultycount[name_3 + dept];
                        facultyAdjustedCount[CSRankings.aliases[name_3] + dept] = facultyAdjustedCount[name_3 + dept];
                    }
                    else {
                        facultycount[CSRankings.aliases[name_3] + dept] += facultycount[name_3 + dept];
                        facultyAdjustedCount[CSRankings.aliases[name_3] + dept] += facultyAdjustedCount[name_3 + dept];
                    }
                }
            }
        }
    };
    /* Build drop down for faculty names and paper counts. */
    CSRankings.buildDropDown = function (deptNames, facultycount, facultyAdjustedCount, coauthorList) {
        var univtext = {};
        var _loop_1 = function (dept) {
            if (!deptNames.hasOwnProperty(dept)) {
                return "continue";
            }
            var p = '<div class="row"><div class="table"><table class="table-striped" width="100%"><thead><th></th><td><small><em><abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">Raw&nbsp;\#&nbsp;Pubs</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Count divided by number of co-authors">Adjusted&nbsp;&nbsp;\#</abbr></em></small></td></thead><tbody>';
            /* Build a dict of just faculty from this department for sorting purposes. */
            var fc = {};
            for (var _i = 0, _a = deptNames[dept]; _i < _a.length; _i++) {
                var name_4 = _a[_i];
                fc[name_4] = facultycount[name_4 + dept];
            }
            var keys = Object.keys(fc);
            keys.sort(function (a, b) { return fc[b] - fc[a]; });
            var _loop_2 = function (name_5) {
                if (CSRankings.showCoauthors) {
                    /* Build up text for co-authors. */
                    var coauthorStr_1 = "";
                    if ((!(name_5 in coauthorList)) || (coauthorList[name_5].size === 0)) {
                        coauthorList[name_5] = new Set([]);
                        coauthorStr_1 = "(no senior co-authors on these papers)";
                    }
                    else {
                        coauthorStr_1 = "Senior co-authors on these papers:\n";
                    }
                    /* Sort it by last name. */
                    var l_1 = [];
                    coauthorList[name_5].forEach(function (item, _) {
                        l_1.push(item);
                    });
                    if (l_1.length > CSRankings.maxCoauthors) {
                        coauthorStr_1 = "(more than " + CSRankings.maxCoauthors + " senior co-authors)";
                    }
                    else {
                        l_1.sort(CSRankings.compareNames);
                        l_1.forEach(function (item, _) {
                            coauthorStr_1 += item + "\n";
                        });
                        /* Trim off the trailing newline. */
                        coauthorStr_1 = coauthorStr_1.slice(0, coauthorStr_1.length - 1);
                    }
                }
                var homePage = encodeURI(CSRankings.homepages[name_5]);
                var dblpName = CSRankings.translateNameToDBLP(name_5);
                p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
                + '<a title="Click for author\'s home page." target="_blank" href="'
                + homePage
                + '" '
                + 'onclick="trackOutboundLink(\''
                    + homePage
                    + '\', true); return false;"'
+ '>'
+ name_5
+ '</a>&nbsp;'
+ "<span onclick=\"CSRankings.toggleChart('"
    + escape(name_5)
    + "')\" class=\"hovertip\" ><font color=\"#333\">" + CSRankings.PieChart + "</font></span>"
+ '</small>'
+ '</td><td align="right"><small>'
+ '<a title="Click for author\'s DBLP entry." target="_blank" href="'
+ dblpName
+ '" '
+ 'onclick="trackOutboundLink(\''
    + dblpName
    + '\', true); return false;"'
+ '>'
+ facultycount[name_5 + dept]
+ '</a>'
+ "</small></td>"
+ '<td align="right"><small>'
+ (Math.round(10.0 * facultyAdjustedCount[name_5 + dept]) / 10.0).toFixed(1)
+ "</small></td></tr>"
+ "<tr id='" + escape(name_5) + "-chartCont' style='display:none;'><td colspan=\"4\">"
+ '<div" id="' + escape(name_5) + "-chart" + '">'
+ '</div>'
+ "</td></tr>";
};
for (var _b = 0, keys_1 = keys; _b < keys_1.length; _b++) {
    var name_5 = keys_1[_b];
    _loop_2(name_5);
}
p += "</tbody></table></div></div>";
univtext[dept] = p;
};
for (var dept in deptNames) {
    _loop_1(dept);
}
return univtext;
};
CSRankings.buildOutputString = function (displayPercentages, numAreas, univagg, deptCounts, univtext) {
    var s = CSRankings.makePrologue();
    /* Show the top N (with more if tied at the end) */
    var minToRank = parseInt(jQuery("#minToRank").find(":selected").val());
    if (displayPercentages) {
        s = s + '<thead><tr><th align="left">Rk&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean number of papers published across all areas.">Avg&nbsp;Count</abbr></th></tr></thead>';
    }
    else {
        s = s + '<thead><tr><th align="left">Rk&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Total count adjusted based on number of coauthors.">Count</abbr></th></tr></thead>';
    }
    s = s + "<tbody>";
    /* As long as there is at least one thing selected, compute and display a ranking. */
    if (numAreas > 0) {
        var ties = 1; /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
        var rank = 0; /* index */
        var oldv = 9999999.999; /* old number - to track ties */
        var hasSplit = 0;
        /* Sort the university aggregate count from largest to smallest. */
        var keys2 = CSRankings.sortIndex(univagg);
            /* Display rankings until we have shown `minToRank` items or
            while there is a tie (those all get the same rank). */
                for (var ind = 0; ind < keys2.length; ind++) {
                    var dept = keys2[ind];
                    var v = Math.round(10.0 * univagg[dept]) / 10.0;
                    if ((ind >= minToRank) && (v != oldv)) {
                        break;
                    }
                    if (v === 0.0) {
                        break;
                    }
                    if (oldv != v) {
                        if (CSRankings.useDenseRankings) {
                            rank = rank + 1;
                        }
                        else {
                            rank = rank + ties;
                            ties = 0;
                        }
                    }
                    if((ind == Math.ceil(minToRank / 2)) || (ind == Math.ceil(keys2.length / 2))) {
                        if(hasSplit == 0) {
                            hasSplit != 1;
                            s += "</tbody>" + "</table>";
                            s += "</div></div>";
                            s += "<div class='col-md-6' id='rightCol'><div class='table'><table class='table-sm table-striped' id='ranking2' valign='top'>";
                            if (displayPercentages) {
                                s = s + '<thead><tr><th align="left">Rk&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean number of papers published across all areas.">Avg&nbsp;Count</abbr></th></tr></thead>';
                            }
                            else {
                                s = s + '<thead><tr><th align="left">Rk&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Total count adjusted based on number of coauthors.">Count</abbr></th></tr></thead>';
                            }
                        }
                    }
                    var esc = escape(dept);
                    s += "\n<tr valign='middle'><td>" + rank + "</td>";
                    s += "<td>"
                    + "<span onclick=\"CSRankings.toggleFaculty('" + dept + "')\" class=\"hovertip glyphicon glyphicon-chevron-right\" id=\"" + dept + "-widget\"></span></font>&nbsp;"
                    + "<span onclick=\"CSRankings.toggleFaculty('" + dept + "')\" class=\"hovertip\">" + dept + "</span>";
                    s += "&nbsp;<font color=\"#333\">" + "<span onclick=\"CSRankings.toggleChart('"
                        + esc
                        + "')\" class=\"hovertip\" id=\""
+ esc
+ "-widget\">" + CSRankings.PieChart + "</span></font>";
                //      s += '<div style="display:none;" style="width: 100%; height: 350px;" id="' + esc + '">' + '</div>';
                s += "</td>";
                s += '<td align="right">' + (Math.round(10.0 * v) / 10.0).toFixed(1) + "</td>";
                s += "</tr>\n";
                s += '<tr id="' + esc + '-chartCont" style="display:none;"><td colspan="4"><div style="width: 100%; height: 350px;" id="'
                + esc
                + '-chart">' + '</div></td></tr>';
                s += '<tr style="display:none;" id="' + dept + '-facultyCont"><td colspan="4"><div id="' + dept + '-faculty">' + univtext[dept] + '</div></td></tr>';
                ties++;
                oldv = v;
            }
            s += "</tbody>" + "</table>" + "<br />";
            if (CSRankings.allowRankingChange) {
                /* Disable option to change ranking approach for now. */
                if (CSRankings.useDenseRankings) {
                    s += '<em><a class="only_these_areas" onClick="deactivateDenseRankings(); return false;"><font color="blue"><b>Using dense rankings. Click to use competition rankings.</b></font></a><em>';
                }
                else {
                    s += '<em><a class="only_these_areas" onClick="activateDenseRankings(); return false;"><font color="blue"><b>Using competition rankings. Click to use dense rankings.</b></font></a></em>';
                }
            }
            s += "</div>" + "</div>" + "</div>" + "\n";
            s += "<br>" + "</body>" + "</html>";
        }
        else {
            /* Nothing selected. */
            s = "<h4>Please select at least one area.</h4>";
        }
        return s;
    };
    /* Set all checkboxes to true. */
    CSRankings.setAllCheckboxes = function () {
        for (var i = 0; i < CSRankings.areas.length; i++) {
            var str = 'input[name=' + CSRankings.fields[i] + ']';
            jQuery(str).prop('checked', true);
        }
    };
    /* PUBLIC METHODS */
    CSRankings.rank = function () {
        var deptNames = {}; /* names of departments. */
        var deptCounts = {}; /* number of faculty in each department. */
        var facultycount = {}; /* name + dept -> raw count of pubs per name / department */
        var facultyAdjustedCount = {}; /* name + dept -> adjusted count of pubs per name / department */
        var currentWeights = {}; /* array to hold 1 or 0, depending on if the area is checked or not. */
        var areaDeptAdjustedCount = {}; /* as above, but for area+dept. */
        var startyear = parseInt(jQuery("#startyear").find(":selected").text());
        var endyear = parseInt(jQuery("#endyear").find(":selected").text());
        var displayPercentages = Boolean(parseInt(jQuery("#displayPercent").find(":selected").val()));
        var whichRegions = jQuery("#regions").find(":selected").val();
        var numAreas = CSRankings.updateWeights(currentWeights);
        var coauthorList = {};
        if (CSRankings.showCoauthors) {
            coauthorList = CSRankings.computeCoauthors(CSRankings.coauthors, startyear, endyear, currentWeights);
        }
        CSRankings.authorAreas = {};
        CSRankings.countAuthorAreas(CSRankings.authors, startyear, endyear, currentWeights, CSRankings.authorAreas);
        CSRankings.buildDepartments(CSRankings.authors, startyear, endyear, currentWeights, whichRegions, areaDeptAdjustedCount, deptCounts, deptNames, facultycount, facultyAdjustedCount);
        /* (university, total or average number of papers) */
        var univagg = CSRankings.computeStats(deptNames, areaDeptAdjustedCount, CSRankings.areas, numAreas, displayPercentages, currentWeights);
        /* Canonicalize names. */
        CSRankings.canonicalizeNames(deptNames, facultycount, facultyAdjustedCount);
        var univtext = CSRankings.buildDropDown(deptNames, facultycount, facultyAdjustedCount, coauthorList);
        /* Start building up the string to output. */
        var s = CSRankings.buildOutputString(displayPercentages, numAreas, univagg, deptCounts, univtext);
        /* Finally done. Redraw! */
        setTimeout(function () { jQuery("#success").html(s); }, 0);
        return false;
    };
    /* Turn the chart display on or off. */
    CSRankings.toggleChart = function (name) {
        var chartCont = document.getElementById(name + "-chartCont");
        if (chartCont.style.display === 'block') {
            chartCont.style.display = 'none';
        }
        else {
            chartCont.style.display = 'block';
            CSRankings.makeChart(name);
        }
    };
    /* Expand or collape the view of all faculty in a department. */
    CSRankings.toggleFaculty = function (dept) {
        var e = document.getElementById(dept + "-faculty");
        var eContainer = document.getElementById(dept + "-facultyCont");
        var widget = $("[id='" + dept + "-widget']");
        if (eContainer.style.display === '') {
            eContainer.style.display = 'none';
            widget.removeClass("glyphicon-chevron-down");
            widget.addClass("glyphicon-chevron-right");
        }
        else {
            eContainer.style.display = '';
            widget.removeClass("glyphicon-chevron-right");
            widget.addClass("glyphicon-chevron-down");
        }
    };
    CSRankings.activateAll = function (value) {
        if (value === void 0) { value = true; }
        for (var i = 0; i < CSRankings.areas.length; i++) {
            var str = "input[name=" + CSRankings.fields[i] + "]";
            jQuery(str).prop('checked', value);
        }
        CSRankings.rank();
        return false;
    };
    CSRankings.activateNone = function () {
        return CSRankings.activateAll(false);
    };
    CSRankings.activateSystems = function (value) {
        if (value === void 0) { value = true; }
        return CSRankings.activateFields(value, CSRankings.systemsFields);
    };
    CSRankings.activateAI = function (value) {
        if (value === void 0) { value = true; }
        return CSRankings.activateFields(value, CSRankings.aiFields);
    };
    CSRankings.activateTheory = function (value) {
        if (value === void 0) { value = true; }
        return CSRankings.activateFields(value, CSRankings.theoryFields);
    };
    CSRankings.activateOthers = function (value) {
        if (value === void 0) { value = true; }
        return CSRankings.activateFields(value, CSRankings.otherFields);
    };
    CSRankings.deactivateSystems = function () {
        return CSRankings.activateSystems(false);
    };
    CSRankings.deactivateAI = function () {
        return CSRankings.activateAI(false);
    };
    CSRankings.deactivateTheory = function () {
        return CSRankings.activateTheory(false);
    };
    CSRankings.deactivateOthers = function () {
        return CSRankings.activateOthers(false);
    };
    return CSRankings;
}());
CSRankings.coauthorFile = "faculty-coauthors.csv";
CSRankings.authorinfoFile = "generated-author-info.csv";
CSRankings.countryinfoFile = "country-info.csv";
CSRankings.aliasFile = "dblp-aliases.csv";
CSRankings.homepagesFile = "homepages.csv";
CSRankings.allowRankingChange = false; /* Can we change the kind of rankings being used? */
CSRankings.showCoauthors = false;
CSRankings.maxCoauthors = 30; /* Max co-authors to display. */
CSRankings.areaMap = [{ area: "ai", title: "AI" },
{ area: "vision", title: "Vision" },
{ area: "mlmining", title: "ML" },
{ area: "nlp", title: "NLP" },
{ area: "ir", title: "Web & IR" },
{ area: "arch", title: "Arch" },
{ area: "comm", title: "Networks" },
{ area: "sec", title: "Security" },
{ area: "mod", title: "DB" },
{ area: "hpc", title: "HPC" },
{ area: "mobile", title: "Mobile" },
{ area: "metrics", title: "Metrics" },
{ area: "ops", title: "OS" },
{ area: "plan", title: "PL" },
{ area: "soft", title: "SE" },
{ area: "act", title: "Theory" },
{ area: "crypt", title: "Crypto" },
{ area: "log", title: "Logic" },
{ area: "graph", title: "Graphics" },
{ area: "chi", title: "HCI" },
{ area: "robotics", title: "Robotics" },
{ area: "bio", title: "Comp. Biology" },
{ area: "da", title: "Design Automation" },
{ area: "bed", title: "Embedded Systems" },
{ area: "vis", title: "Visualization" }
];
CSRankings.aiAreas = ["ai", "vision", "mlmining", "nlp", "ir"];
CSRankings.systemsAreas = ["arch", "comm", "sec", "mod", "hpc", "mobile", "metrics", "ops", "plan", "soft", "da", "bed"];
CSRankings.theoryAreas = ["act", "crypt", "log"];
CSRankings.otherAreas = ["graph", "chi", "robotics", "bio", "vis"];
CSRankings.areas = [];
CSRankings.areaNames = [];
CSRankings.fields = [];
CSRankings.aiFields = [];
CSRankings.systemsFields = [];
CSRankings.theoryFields = [];
CSRankings.otherFields = [];
/* Map area to its name (from areaNames). */
CSRankings.areaDict = {};
/* Map area to its position in the list. */
CSRankings.areaPosition = {};
/* Map aliases to canonical author name. */
CSRankings.aliases = {};
/* Map institution to (non-US) region. */
CSRankings.countryInfo = {};
/* Map name to home page. */
CSRankings.homepages = {};
/* Set to true for "dense rankings" vs. "competition rankings". */
CSRankings.useDenseRankings = false;
/* The data which will hold the parsed CSV of author info. */
CSRankings.authors = [];
/* The data which will hold the parsed CSV of co-author info. */
CSRankings.coauthors = [];
/* Map authors to the areas they have published in (for pie chart display). */
CSRankings.authorAreas = {};
/* Colors for all areas. */
CSRankings.color = ["#f30000", "#0600f3", "#00b109", "#14e4b4", "#0fe7fb", "#67f200", "#ff7e00", "#8fe4fa", "#ff5300", "#640000", "#3854d1", "#d00ed8", "#7890ff", "#01664d", "#04231b", "#e9f117", "#f3228e", "#7ce8ca", "#ff5300", "#ff5300", "#7eff30", "#9a8cf6", "#79aff9", "#bfbfbf", "#56b510", "#00e2f6", "#ff4141", "#61ff41"];
CSRankings.RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
CSRankings.DownTriangle = "&#9660;"; // downward-facing triangle symbol (expanded view)
CSRankings.PieChart = "&#9685;"; // symbol that looks close enough to a pie chart
function init() {
    new CSRankings();
}
window.onload = init;
//  jQuery(document).ready(
