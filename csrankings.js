/*

  CSrankings.ts

  @author Emery Berger <emery@cs.umass.edu> http://www.emeryberger.com

*/
/// <reference path="./typescript/jquery.d.ts" />
/// <reference path="./typescript/papaparse.d.ts" />
/// <reference path="./typescript/set.d.ts" />
/// <reference path="./typescript/d3.d.ts" />
/// <reference path="./typescript/d3pie.d.ts" />
/// <reference path="./typescript/navigo.d.ts" />
;
;
;
;
;
;
;
;
;
var CSRankings = (function () {
    function CSRankings() {
        /* Build the areaDict dictionary: areas -> names used in pie charts
           and areaPosition dictionary: areas -> position in area array
        */
        CSRankings.geoCheck();
        for (var position = 0; position < CSRankings.areaMap.length; position++) {
            var _a = CSRankings.areaMap[position], area = _a.area, title = _a.title;
            CSRankings.areas[position] = area;
            CSRankings.areaNames[position] = title;
            CSRankings.fields[position] = area;
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
        for (var _g = 0, _h = CSRankings.interdisciplinaryAreas; _g < _h.length; _g++) {
            var area = _h[_g];
            CSRankings.otherFields.push(CSRankings.areaPosition[area]);
        }
        var next = function () {
            CSRankings.loadAliases(CSRankings.aliases, function () {
                CSRankings.loadAuthorInfo(function () {
                    CSRankings.loadAuthors(function () {
                        CSRankings.loadCountryInfo(CSRankings.countryInfo, CSRankings.rank);
                    });
                });
            });
        };
        next();
        CSRankings.activateAll();
        CSRankings.navigoRouter = new Navigo(null, true);
        CSRankings.navigoRouter.on('/index', CSRankings.navigator).resolve();
        CSRankings.navigoRouter.on('/fromyear/:fromyear/toyear/:toyear/index', CSRankings.navigator).resolve();
    }
    CSRankings.translateNameToDBLP = function (name) {
        // Ex: "Emery D. Berger" -> "http://dblp.uni-trier.de/pers/hd/b/Berger:Emery_D="
        // First, replace spaces and non-ASCII characters (not complete).
        // Known issue: does not properly handle suffixes like Jr., III, etc.
        name = name.replace(/'|\-|\./g, "=");
        //	name = name.replace(/\-/g, "=");
        //	name = name.replace(/\./g, "=");
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
        var disambiguation = "";
        if (parseInt(lastName) > 0) {
            // this was a disambiguation entry; go back.
            disambiguation = lastName;
            splitName.pop();
            lastName = splitName[splitName.length - 1] + "_" + disambiguation;
        }
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
        var s = '<div class="table-responsive" style="overflow:auto; height:700px;">'
            + '<table class="table table-fit table-sm table-striped"'
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
        var datadict = {};
        var keys = CSRankings.areas;
        var uname = unescape(name);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = CSRankings.authorAreas[uname][key];
            // Use adjusted count if this is for a department.
            /*
                DISABLED so department charts are invariant.
    
            if (uname in CSRankings.stats) {
            value = CSRankings.areaDeptAdjustedCount[key+uname] + 1;
            if (value == 1) {
                value = 0;
            }
            }
            */
            // Round it to the nearest 0.1.
            value = Math.round(value * 10) / 10;
            if (value > 0) {
                //		if (key in CSRankings.parentMap) {
                // key = CSRankings.parentMap[key];
                //		}
                if (!(key in datadict)) {
                    datadict[key] = 0;
                }
                datadict[key] += value;
            }
        }
        for (var key in datadict) {
            data.push({ "label": CSRankings.areaDict[key],
                "value": Math.round(datadict[key] * 10) / 10,
                "color": CSRankings.color[CSRankings.areaPosition[key]] });
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
                    //"format": "percentage", // "value",
                    //"hideWhenLessThanPercentage": 0 // 2 // 100 // 2
                    "format": "value",
                    "hideWhenLessThanPercentage": 5 // 100 // 2
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
        Papa.parse(CSRankings.authorFile, {
            download: true,
            header: true,
            complete: function (results) {
                var data = results.data;
                var ai = data;
                for (var counter = 0; counter < ai.length; counter++) {
                    var record = ai[counter];
                    var name_1 = record['name'];
                    CSRankings.homepages[name_1.trim()] = record['homepage'];
                    CSRankings.scholarInfo[name_1.trim()] = record['scholarid'];
                }
                setTimeout(cont, 0);
            }
        });
    };
    CSRankings.loadAuthors = function (cont) {
        var _this = this;
        Papa.parse(CSRankings.authorinfoFile, {
            download: true,
            header: true,
            complete: function (results) {
                var data = results.data;
                _this.authors = data;
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
            case "southamerica":
                if (!(dept in CSRankings.countryInfo)) {
                    return false;
                }
                if (CSRankings.countryInfo[dept] != "southamerica") {
                    return false;
                }
                break;
            case "asia":
                if (!(dept in CSRankings.countryInfo)) {
                    return false;
                }
                if (CSRankings.countryInfo[dept] != "asia") {
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
    CSRankings.countAuthorAreas = function (authors, startyear, endyear, 
        //				    weights : {[key:string] : number},
        authorAreas) {
        for (var r in authors) {
            if (!authors.hasOwnProperty(r)) {
                continue;
            }
            var auth = authors[r];
            var year = auth.year;
            if ((year < startyear) || (year > endyear)) {
                continue;
            }
            var theArea = auth.area;
            /*
              DISABLING weight selection so all pie charts look the
              same regardless of which areas are currently selected:
    
            if (weights[theArea] === 0) {
            continue;
            }
            */
            var theDept = auth.dept;
            var theCount = parseFloat(auth.count);
            //	    const theCount = parseFloat(auth.adjustedcount);
            var name_2 = auth.name;
            if (name_2 in CSRankings.aliases) {
                name_2 = CSRankings.aliases[name_2];
            }
            if (!(name_2 in authorAreas)) {
                authorAreas[name_2] = {};
                for (var area in CSRankings.areaDict) {
                    if (CSRankings.areaDict.hasOwnProperty(area)) {
                        authorAreas[name_2][area] = 0;
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
            authorAreas[name_2][theArea] += theCount;
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
            var _a = authors[r], name_3 = _a.name, year = _a.year, area = _a.area, dept = _a.dept;
            if (name_3 in CSRankings.aliases) {
                name_3 = CSRankings.aliases[name_3];
            }
            if (typeof dept === 'undefined') {
                continue;
            }
            if ((weights[area] === 0) || (year < startyear) || (year > endyear)) {
                continue;
            }
            if (!CSRankings.inRegion(dept, regions)) {
                continue;
            }
            // If this area is a child area, accumulate totals for parent.
            if (area in CSRankings.parentMap) {
                area = CSRankings.parentMap[area];
            }
            var areaDept = area + dept;
            var nameDept = name_3 + dept;
            if (!(areaDept in areaDeptAdjustedCount)) {
                areaDeptAdjustedCount[areaDept] = 0;
            }
            var count = parseInt(authors[r].count);
            var adjustedCount = parseFloat(authors[r].adjustedcount);
            areaDeptAdjustedCount[areaDept] += adjustedCount;
            /* Is this the first time we have seen this person? */
            if (!(name_3 in visited)) {
                visited[name_3] = true;
                facultycount[nameDept] = 0;
                facultyAdjustedCount[nameDept] = 0;
                if (!(dept in deptCounts)) {
                    deptCounts[dept] = 0;
                    deptNames[dept] = [];
                }
                deptNames[dept].push(name_3);
                deptCounts[dept] += 1;
            }
            facultycount[nameDept] += count;
            facultyAdjustedCount[nameDept] += adjustedCount;
        }
    };
    /* Compute aggregate statistics. */
    CSRankings.computeStats = function (deptNames, areaDeptAdjustedCount, areas, numAreas, displayPercentages, weights) {
        CSRankings.stats = {};
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
                // If the area is a child, ignore it.
                if (area in CSRankings.parentMap) {
                    continue;
                }
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
                var name_4 = deptNames[dept][ind];
                if (name_4 in CSRankings.aliases) {
                    deptNames[dept][ind] = CSRankings.aliases[name_4];
                    if (!(CSRankings.aliases[name_4] + dept in facultycount)) {
                        facultycount[CSRankings.aliases[name_4] + dept] = facultycount[name_4 + dept];
                        facultyAdjustedCount[CSRankings.aliases[name_4] + dept] = facultyAdjustedCount[name_4 + dept];
                    }
                    else {
                        facultycount[CSRankings.aliases[name_4] + dept] += facultycount[name_4 + dept];
                        facultyAdjustedCount[CSRankings.aliases[name_4] + dept] += facultyAdjustedCount[name_4 + dept];
                    }
                }
            }
        }
    };
    /* Build drop down for faculty names and paper counts. */
    CSRankings.buildDropDown = function (deptNames, facultycount, facultyAdjustedCount) {
        var univtext = {};
        var _loop_1 = function (dept) {
            if (!deptNames.hasOwnProperty(dept)) {
                return "continue";
            }
            var p = '<div class="table"><table class="table table-sm table-striped"><thead><th></th><td><small><em><abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">\#&nbsp;Pubs</abbr></em></small></td><td align="right"><small><em><abbr title="Count divided by number of co-authors">Adj.&nbsp;\#</abbr></em></small></td></thead><tbody>';
            /* Build a dict of just faculty from this department for sorting purposes. */
            var fc = {};
            for (var _i = 0, _a = deptNames[dept]; _i < _a.length; _i++) {
                var name_5 = _a[_i];
                fc[name_5] = facultycount[name_5 + dept];
            }
            var keys = Object.keys(fc);
            keys.sort(function (a, b) {
                if (fc[b] === fc[a]) {
                    var fb = Math.round(10.0 * facultyAdjustedCount[b + dept]) / 10.0;
                    var fa = Math.round(10.0 * facultyAdjustedCount[a + dept]) / 10.0;
                    if (fb === fa) {
                        return CSRankings.compareNames(a, b);
                    }
                    return fb - fa;
                }
                else {
                    return fc[b] - fc[a];
                }
            });
            for (var _b = 0, keys_1 = keys; _b < keys_1.length; _b++) {
                var name_6 = keys_1[_b];
                var homePage = encodeURI(CSRankings.homepages[name_6]);
                var dblpName = CSRankings.translateNameToDBLP(name_6);
                p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
                    + '<a title="Click for author\'s home page." target="_blank" href="'
                    + homePage
                    + '" '
                    + 'onclick="trackOutboundLink(\''
                    + homePage
                    + '\', true); return false;"'
                    + '>'
                    + name_6
                    + '</a>&nbsp;';
                if (CSRankings.scholarInfo.hasOwnProperty(name_6)) {
                    var url = 'https://scholar.google.com/citations?user='
                        + CSRankings.scholarInfo[name_6]
                        + '&hl=en&oi=ao';
                    p += '<a title="Click for author\'s Google Scholar page." target="_blank" href="' + url + '" '
                        + 'onclick="trackOutboundLink(\''
                        + url
                        + '\', true); return false;"'
                        + '>'
                        + '<img src="scholar-favicon.ico" height="10" width="10">'
                        + '</a>&nbsp;';
                }
                p += "<span title=\"Click for author's publication profile.\" onclick=\"CSRankings.toggleChart('"
                    + escape(name_6)
                    + "')\" class=\"hovertip\" ><font color=\"blue\">" + CSRankings.PieChart + "</font></span>"
                    + '</small>'
                    + '</td><td align="right"><small>'
                    + '<a title="Click for author\'s DBLP entry." target="_blank" href="'
                    + dblpName
                    + '" '
                    + 'onclick="trackOutboundLink(\''
                    + dblpName
                    + '\', true); return false;"'
                    + '>'
                    + fc[name_6]
                    + '</a>'
                    + "</small></td>"
                    + '<td align="right"><small>'
                    + (Math.round(10.0 * facultyAdjustedCount[name_6 + dept]) / 10.0).toFixed(1)
                    + "</small></td></tr>"
                    + "<tr><td colspan=\"4\">"
                    + '<div style="display:none;" id="' + escape(name_6) + "-chart" + '">'
                    + '</div>'
                    + "</td></tr>";
            }
            p += "</tbody></table></div>";
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
        var minToRank = 99999; // parseInt(jQuery("#minToRank").find(":selected").val());
        if (displayPercentages) {
            s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean count of papers published across all areas.">Count</abbr></th><th align="right">&nbsp;<abbr title="Number of faculty who have published in these areas.">Faculty</abbr></th></th></tr></thead>';
        }
        else {
            s = s + '<thead><tr><th align="left">Rank&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right">Adjusted&nbsp;Pub&nbsp;Count</th><th align="right">&nbsp;Faculty</th></tr></thead>';
        }
        s = s + "<tbody>";
        /* As long as there is at least one thing selected, compute and display a ranking. */
        if (numAreas > 0) {
            var ties = 1; /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
            var rank = 0; /* index */
            var oldv = 9999999.999; /* old number - to track ties */
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
                var esc = escape(dept);
                s += "\n<tr><td>" + rank + "</td>";
                s += "<td>"
                    + "<span onclick=\"CSRankings.toggleFaculty('" + dept + "')\" class=\"hovertip\" id=\"" + dept + "-widget\">" + "<font color=\"blue\">" + CSRankings.RightTriangle + "</font></span>&nbsp;"
                    + "<span onclick=\"CSRankings.toggleFaculty('" + dept + "')\" class=\"hovertip\">" + dept + "</span>";
                s += "&nbsp;<font color=\"blue\">" + "<span onclick=\"CSRankings.toggleChart('"
                    + esc
                    + "')\" class=\"hovertip\" id=\""
                    + esc
                    + "-widget\">" + CSRankings.PieChart + "</span></font>";
                //	    s += '<div style="display:none;" style="width: 100%; height: 350px;" id="' + esc + '">' + '</div>';
                s += "</td>";
                s += '<td align="right">' + (Math.round(10.0 * v) / 10.0).toFixed(1) + "</td>";
                s += '<td align="right">' + deptCounts[dept] + "<br />"; /* number of faculty */
                s += "</td>";
                s += "</tr>\n";
                s += '<tr><td colspan="4"><div style="display:none;" style="width: 100%; height: 350px;" id="'
                    + esc
                    + '-chart">' + '</div></td></tr>';
                s += '<tr><td colspan="4"><div style="display:none;" id="' + dept + '-faculty">' + univtext[dept] + '</div></td></tr>';
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
            s += "</div>" + "</div>" + "\n";
            s += "<br>" + "</body>" + "</html>";
        }
        else {
            /* Nothing selected. */
            s = "<h3>Please select at least one area by clicking one or more checkboxes.</h3>";
        }
        return s;
    };
    /* Set all checkboxes to true. */
    CSRankings.setAllCheckboxes = function () {
        CSRankings.activateAll();
    };
    /* PUBLIC METHODS */
    CSRankings.rank = function () {
        var deptNames = {}; /* names of departments. */
        var deptCounts = {}; /* number of faculty in each department. */
        var facultycount = {}; /* name + dept -> raw count of pubs per name / department */
        var facultyAdjustedCount = {}; /* name + dept -> adjusted count of pubs per name / department */
        var currentWeights = {}; /* array to hold 1 or 0, depending on if the area is checked or not. */
        CSRankings.areaDeptAdjustedCount = {};
        var startyear = parseInt(jQuery("#fromyear").find(":selected").text());
        var endyear = parseInt(jQuery("#toyear").find(":selected").text());
        var displayPercentages = true; // Boolean(parseInt(jQuery("#displayPercent").find(":selected").val()));
        var whichRegions = jQuery("#regions").find(":selected").val();
        var numAreas = CSRankings.updateWeights(currentWeights);
        CSRankings.authorAreas = {};
        CSRankings.countAuthorAreas(CSRankings.authors, startyear, endyear, 
        //				    currentWeights,
        CSRankings.authorAreas);
        CSRankings.buildDepartments(CSRankings.authors, startyear, endyear, currentWeights, whichRegions, CSRankings.areaDeptAdjustedCount, deptCounts, deptNames, facultycount, facultyAdjustedCount);
        /* (university, total or average number of papers) */
        CSRankings.stats = CSRankings.computeStats(deptNames, CSRankings.areaDeptAdjustedCount, CSRankings.areas, numAreas, displayPercentages, currentWeights);
        /* Canonicalize names. */
        CSRankings.canonicalizeNames(deptNames, facultycount, facultyAdjustedCount);
        var univtext = CSRankings.buildDropDown(deptNames, facultycount, facultyAdjustedCount);
        /* Start building up the string to output. */
        var s = CSRankings.buildOutputString(displayPercentages, numAreas, CSRankings.stats, deptCounts, univtext);
        /* Finally done. Redraw! */
        setTimeout(function () { jQuery("#success").html(s); CSRankings.urlUpdate(); }, 0);
        return false;
    };
    /* Turn the chart display on or off. */
    CSRankings.toggleChart = function (name) {
        var chart = document.getElementById(name + "-chart");
        if (chart.style.display === 'block') {
            chart.style.display = 'none';
            chart.innerHTML = '';
        }
        else {
            chart.style.display = 'block';
            CSRankings.makeChart(name);
        }
    };
    /* Expand or collape the view of conferences in a given area. */
    CSRankings.toggleConferences = function (area) {
        var e = document.getElementById(area + "-conferences");
        var widget = document.getElementById(area + "-widget");
        if (e.style.display === 'block') {
            e.style.display = 'none';
            widget.innerHTML = "<font color=\"blue\">" + CSRankings.RightTriangle + "</font>";
        }
        else {
            e.style.display = 'block';
            widget.innerHTML = "<font color=\"blue\">" + CSRankings.DownTriangle + "</font>";
        }
        var boxes = document.getElementById(area + "-conferences-checkboxes");
        if (boxes.style.display === 'block') {
            boxes.style.display = 'none';
        }
        else {
            boxes.style.display = 'block';
        }
    };
    /* Expand or collape the view of all faculty in a department. */
    CSRankings.toggleFaculty = function (dept) {
        var e = document.getElementById(dept + "-faculty");
        var widget = document.getElementById(dept + "-widget");
        if (e.style.display === 'block') {
            e.style.display = 'none';
            widget.innerHTML = "<font color=\"blue\">" + CSRankings.RightTriangle + "</font>";
        }
        else {
            e.style.display = 'block';
            widget.innerHTML = "<font color=\"blue\">" + CSRankings.DownTriangle + "</font>";
        }
    };
    CSRankings.activateAll = function (value) {
        if (value === void 0) { value = true; }
        for (var i = 0; i < CSRankings.areas.length; i++) {
            var str = "input[name=" + CSRankings.fields[i] + "]";
            jQuery(str).prop('checked', value);
            if (CSRankings.fields[i] in CSRankings.childMap) {
                var parent_1 = CSRankings.fields[i];
                for (var _i = 0, _a = CSRankings.childMap[parent_1]; _i < _a.length; _i++) {
                    var kid = _a[_i];
                    jQuery("input[name=" + kid + "]").prop('checked', value);
                }
            }
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
    // Update the URL according to the selected checkboxes.
    CSRankings.urlUpdate = function () {
        var s = '';
        var count = 0;
        for (var i = 0; i < CSRankings.fields.length; i++) {
            var str = 'input[name=' + CSRankings.fields[i] + ']';
            if (jQuery(str).prop('checked')) {
                s += CSRankings.fields[i] + '&';
                count += 1;
            }
        }
        if (count > 0) {
            // Trim off the trailing '&'.
            s = s.slice(0, -1);
        }
        if (count == CSRankings.fields.length) {
            s = ''; // Distinguished special URL - default = all selected.
        }
        else if (count == 0) {
            s = '/index?none'; // Distinguished special URL - none selected.
        }
        else {
            s = '/index?' + s;
        }
        CSRankings.navigoRouter.navigate(s);
    };
    CSRankings.geoCheck = function () {
        // Figure out which country clients are coming from and set
        // the default regions accordingly.
        jQuery.getJSON('http://freegeoip.net/json/', function (result) {
            switch (result.country_code) {
                case "US":
                case "CN":
                case "IN":
                case "KR":
                case "JP":
                case "TW":
                case "SG":
                    // jQuery("#regions").val("USA");
                    // This is currently the default.
                    break;
                default:
                    jQuery("#regions").val("world");
                    break;
            }
        });
    };
    CSRankings.navigator = function (params, query) {
        console.log(params);
        if (params !== null) {
            Object.keys(params).forEach(function (key) {
                jQuery("#" + key).prop('value', params[key]);
                console.log(key + " --> " + params[key]);
            });
        }
        // Clear everything.
        for (var a in CSRankings.areas) {
            jQuery("input[name=" + CSRankings.areas[a] + "]").prop('checked', false);
        }
        // Now check everything listed in the query string.
        query.split('&').forEach(function (item) {
            if ((item != "none") && (item != "")) {
                jQuery("input[name=" + item + "]").prop('checked', true);
            }
        });
    };
    CSRankings.addListeners = function () {
        var _this = this;
        ["toyear", "fromyear", "regions"].forEach(function (key) {
            var widget = document.getElementById(key);
            widget.addEventListener("change", CSRankings.rank);
        });
        var _loop_2 = function (position) {
            var area = CSRankings.areas[position];
            var widget = document.getElementById(area + '-widget');
            widget.addEventListener("click", function () {
                CSRankings.toggleConferences(area);
            });
        };
        // Add listeners for clicks on area widgets (left side of screen)
        // e.g., 'ai'
        for (var position = 0; position < CSRankings.areas.length; position++) {
            _loop_2(position);
        }
        // Initialize callbacks for area checkboxes.
        for (var i = 0; i < CSRankings.fields.length; i++) {
            var str = 'input[name=' + CSRankings.fields[i] + ']';
            jQuery(str).click(function () {
                _this.rank();
            });
        }
        // Add group selectors.
        var listeners = { 'all_areas_on': (function () { CSRankings.activateAll(); }),
            'all_areas_off': (function () { CSRankings.activateNone(); }),
            'ai_areas_on': (function () { CSRankings.activateAI(); }),
            'ai_areas_off': (function () { CSRankings.deactivateAI(); }),
            'systems_areas_on': (function () { CSRankings.activateSystems(); }),
            'systems_areas_off': (function () { CSRankings.deactivateSystems(); }),
            'theory_areas_on': (function () { CSRankings.activateTheory(); }),
            'theory_areas_off': (function () { CSRankings.deactivateTheory(); }),
            'other_areas_on': (function () { CSRankings.activateOthers(); }),
            'other_areas_off': (function () { CSRankings.deactivateOthers(); })
        };
        var _loop_3 = function (item) {
            var widget = document.getElementById(item);
            widget.addEventListener("click", function () {
                listeners[item]();
            });
        };
        for (var item in listeners) {
            _loop_3(item);
        }
    };
    return CSRankings;
}());
CSRankings.authorFile = "/csrankings.csv";
CSRankings.authorinfoFile = "/generated-author-info.csv";
CSRankings.countryinfoFile = "/country-info.csv";
CSRankings.aliasFile = "/dblp-aliases.csv";
CSRankings.allowRankingChange = false; /* Can we change the kind of rankings being used? */
CSRankings.parentMap = { 'aaai': 'ai',
    'ijcai': 'ai',
    'cvpr': 'vision',
    'eccv': 'vision',
    'iccv': 'vision'
};
CSRankings.childMap = { 'ai': ['aaai', 'ijcai'],
    'vision': ['cvpr', 'eccv', 'iccv'] };
CSRankings.areaMap = [{ area: "ai", title: "AI" },
    //	    { area : "aaai", title : "AI" },
    //	    { area : "ijcai", title : "AI" },
    { area: "vision", title: "Vision" },
    //	    { area : "cvpr", title : "Vision" },
    //	    { area : "eccv", title : "Vision" },
    //	    { area : "iccv", title : "Vision" },
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
    { area: "da", title: "EDA" },
    { area: "bed", title: "Embedded" },
    { area: "vis", title: "Visualization" },
    { area: "ecom", title: "ECom" }
    //,{ area : "cse", title : "CSEd" }
];
CSRankings.aiAreas = ["ai", "vision", "mlmining", "nlp", "ir"];
CSRankings.systemsAreas = ["arch", "comm", "sec", "mod", "hpc", "mobile", "metrics", "ops", "plan", "soft", "da", "bed"];
CSRankings.theoryAreas = ["act", "crypt", "log"];
CSRankings.interdisciplinaryAreas = ["graph", "chi", "robotics", "bio", "vis", "ecom"];
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
/* Map names to Google Scholar IDs. */
CSRankings.scholarInfo = {};
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
/* Map authors to the areas they have published in (for pie chart display). */
CSRankings.authorAreas = {};
/* Computed stats (univagg). */
CSRankings.stats = {};
CSRankings.areaDeptAdjustedCount = {}; /* area+dept */
/* Colors for all areas. */
CSRankings.color = ["#f30000", "#0600f3", "#00b109", "#14e4b4", "#0fe7fb", "#67f200", "#ff7e00", "#8fe4fa", "#ff5300", "#640000", "#3854d1", "#d00ed8", "#7890ff", "#01664d", "#04231b", "#e9f117", "#f3228e", "#7ce8ca", "#ff5300", "#ff5300", "#7eff30", "#9a8cf6", "#79aff9", "#bfbfbf", "#56b510", "#00e2f6", "#ff4141", "#61ff41"];
CSRankings.RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
CSRankings.DownTriangle = "&#9660;"; // downward-facing triangle symbol (expanded view)
CSRankings.PieChart = "&#9685;"; // symbol that looks close enough to a pie chart
function init() {
    var csr = new CSRankings();
    CSRankings.addListeners();
}
window.onload = init;
