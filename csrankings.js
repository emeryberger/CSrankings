/*

  CSrankings.ts

  @author Emery Berger <emery@cs.umass.edu> http://www.emeryberger.com

*/
/// <reference path="./typescript/jquery.d.ts" />
/// <reference path="./typescript/papaparse.d.ts" />
/// <reference path="./typescript/set.d.ts" />
/// <reference path="./typescript/pako.d.ts" />
var coauthorFile = "faculty-coauthors.csv";
var authorinfoFile = "generated-author-info.csv";
var countryinfoFile = "country-info.csv";
var aliasFile = "dblp-aliases.csv";
var homepagesFile = "homepages.csv";
var allowRankingChange = false; /* Can we change the kind of rankings being used? */
var showCoauthors = false;
var maxCoauthors = 30; /* Max co-authors to display. */
var useArithmeticMean = false;
var useGeometricMean = true; /* This is the default and arguably only principled choice. */
var useHarmonicMean = false;
var useDenseRankings = false; /* Set to true for "dense rankings" vs. "competition rankings". */
/* All the areas, in order by their 'field_' number (the checkboxes) in index.html. */
var areas = ["proglang", "softeng", "opsys", "networks", "security", "database", "metrics", "mlmining", "ai", "nlp", "web", "vision", "theory", "logic", "arch", "graphics", "hci", "mobile", "robotics", "highperf", "nada", "crypto"];
;
;
;
;
;
var authors = []; /* The data which will hold the parsed CSV of author info. */
var coauthors = []; /* The data which will hold the parsed CSV of co-author info. */
var countryInfo = {};
var aliases = {};
var homepages = {};
/* The prologue that we preface each generated HTML page with (the results). */
function makePrologue() {
    var s = "<html>"
        + "<head>"
        + '<style type="text/css">'
        + '  body { font-family: "Helvetica", "Arial"; }'
        + "  table td { vertical-align: top; }"
        + "</style>"
        + "</head>"
        + "<body>"
        + '<div class="row">'
        + '<div class="table" style="overflow:auto; height: 650px;">'
        + '<table class="table-sm table-striped"'
        + 'id="ranking" valign="top">';
    return s;
}
/* from http://hubrik.com/2015/11/16/sort-by-last-name-with-javascript/ */
function compareNames(a, b) {
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
}
/* from http://www.html5gamedevs.com/topic/20052-tutorial-efficiently-load-large-amounts-of-game-data-into-memory/ */
function zlibDecompress(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function (oEvent) {
        // Base64 encode
        var reader = new FileReader();
        reader.readAsDataURL(xhr.response);
        reader.onloadend = function () {
            var base64data = reader.result;
            //console.log(base64data);
            var base64 = base64data.split(',')[1];
            // Decode base64 (convert ascii to binary)
            var strData = atob(base64);
            // Convert binary string to character-number array
            var charData = strData.split('').map(function (x) { return x.charCodeAt(0); });
            // Turn number array into byte-array
            var binData = new Uint8Array(charData);
            // Pako inflate
            var data = pako.inflate(binData, { to: 'string' });
            callback(data);
        };
    };
    xhr.send();
}
function redisplay(str) {
    jQuery("#success").html(str);
}
function toggle(dept) {
    var e = document.getElementById(dept);
    var widget = document.getElementById(dept + "-widget");
    if (e.style.display == 'block') {
        e.style.display = 'none';
        widget.innerHTML = '<font color="blue">&#9658;</font>&nbsp;' + dept;
    }
    else {
        e.style.display = 'block';
        widget.innerHTML = '<font color="blue">&#9660;</font>&nbsp;' + dept;
    }
}
function setAllCheckboxes() {
    /* Set the _default_ (not "other") checkboxes to true. */
    for (var i = 1; i <= areas.length; i++) {
        var str = 'input[name=field_' + i + ']';
        jQuery(str).prop('checked', true);
    }
}
/* A convenience function for ending a pipeline of function calls executed in continuation-passing style. */
function nop() { }
function loadCoauthors(cont) {
    Papa.parse(coauthorFile, {
        download: true,
        header: true,
        complete: function (results) {
            var data = results.data;
            coauthors = data;
            cont();
        }
    });
}
function loadAliases(cont) {
    Papa.parse(aliasFile, {
        header: true,
        download: true,
        complete: function (results) {
            var data = results.data;
            var d = data;
            for (var i = 0; i < d.length; i++) {
                aliases[d[i].alias] = d[i].name;
            }
            cont();
        }
    });
}
function loadCountryInfo(cont) {
    Papa.parse(countryinfoFile, {
        header: true,
        download: true,
        complete: function (results) {
            var data = results.data;
            var ci = data;
            for (var i = 0; i < ci.length; i++) {
                countryInfo[ci[i].institution] = ci[i].region;
            }
            cont();
        }
    });
}
function loadAuthorInfo(cont) {
    Papa.parse(authorinfoFile, {
        download: true,
        header: true,
        complete: function (results) {
            var data = results.data;
            authors = data;
            for (var i = 1; i <= areas.length; i++) {
                var str = 'input[name=field_' + i + ']';
                (function (s) {
                    jQuery(s).click(function () {
                        rank();
                    });
                })(str);
            }
            cont();
            /*	    rank(); */
        }
    });
}
function loadHomepages(cont) {
    Papa.parse(homepagesFile, {
        header: true,
        download: true,
        complete: function (results) {
            var data = results.data;
            var d = data;
            for (var i = 0; i < d.length; i++) {
                homepages[d[i].name] = d[i].homepage;
            }
            cont();
        }
    });
}
function init() {
    jQuery(document).ready(function () {
        setAllCheckboxes();
        loadAliases(function () {
            loadHomepages(function () {
                loadAuthorInfo(function () {
                    loadCountryInfo(rank);
                });
            });
        });
    });
}
/*
function init() : void {
    jQuery(document).ready(
    function() {
        setAllCheckboxes();
        loadAuthorInfo(function() {
        loadCountryInfo(function() {
            loadCoauthors(rank);
        });
        });
    });
}
*/
function activateAll(value) {
    if (value === undefined) {
        value = true;
    }
    for (var i = 1; i <= areas.length; i++) {
        var str = "input[name=field_" + i + "]";
        jQuery(str).prop('checked', value);
    }
    rank();
    return false;
}
function activateNone() {
    return activateAll(false);
}
function activateFields(value, fields) {
    if (value === undefined) {
        value = true;
    }
    for (var i = 0; i <= fields.length; i++) {
        var str = "input[name=field_" + fields[i] + "]";
        jQuery(str).prop('checked', value);
    }
    rank();
    return false;
}
function activatePL(value) {
    var plFields = [1, 2, 21];
    return activateFields(value, plFields);
}
function activateSystems(value) {
    activatePL(value);
    var systemsFields = [3, 4, 5, 6, 7, 15, 18, 20];
    return activateFields(value, systemsFields);
}
function activateAI(value) {
    var aiFields = [8, 9, 10, 11, 12];
    return activateFields(value, aiFields);
}
function activateTheory(value) {
    var theoryFields = [13, 14, 22];
    return activateFields(value, theoryFields);
}
function activateOthers(value) {
    var otherFields = [16, 17, 19];
    return activateFields(value, otherFields);
}
function deactivatePL() {
    return activatePL(false);
}
function deactivateSystems() {
    return activateSystems(false);
}
function deactivateAI() {
    return activateAI(false);
}
function deactivateTheory() {
    return activateTheory(false);
}
function deactivateOthers() {
    return activateOthers(false);
}
function toggleAI(cb) {
    if (cb.checked) {
        console.log("checked");
        activateAI(false);
    }
    else {
        console.log("not checked");
        activateAI(true);
    }
    return false;
}
function sortIndex(univagg) {
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
}
function computeCoauthors(coauthors, startyear, endyear, weights) {
    var coauthorList = {};
    for (var c in coauthors) {
        var author = coauthors[c].author;
        var coauthor = coauthors[c].coauthor;
        var year = coauthors[c].year;
        var area = coauthors[c].area;
        if (!(author in coauthorList)) {
            coauthorList[author] = new Set([]);
        }
        if ((weights[area] == 0) || (year < startyear) || (year > endyear)) {
            continue;
        }
        coauthorList[author].add(coauthor);
    }
    return coauthorList;
}
function countPapers(areacount, areaAdjustedCount, areaDeptAdjustedCount, authors, startyear, endyear, weights) {
    /* Count the total number of papers (raw and adjusted) in each area. */
    for (var r in authors) {
        var area = authors[r].area;
        var dept = authors[r].dept;
        var year = authors[r].year;
        var areaDept = area + dept;
        areaDeptAdjustedCount[areaDept] = 0;
        if ((weights[area] == 0) || (year < startyear) || (year > endyear)) {
            continue;
        }
        var count = parseFloat(authors[r].count);
        var adjustedCount = parseFloat(authors[r].adjustedcount);
        areacount[area] += count;
        areaAdjustedCount[area] += adjustedCount;
    }
}
function buildDepartments(areaDeptAdjustedCount, deptCounts, deptNames, facultycount, facultyAdjustedCount, authors, startyear, endyear, weights, regions) {
    /* Build the dictionary of departments (and count) to be ranked. */
    var visited = {}; /* contains an author name if that author has been processed. */
    for (var r in authors) {
        var area = authors[r].area;
        var dept = authors[r].dept;
        switch (regions) {
            case "USA":
                if (dept in countryInfo) {
                    continue;
                }
                break;
            case "europe":
                if (!(dept in countryInfo)) {
                    continue;
                }
                if (countryInfo[dept] != "europe") {
                    continue;
                }
                break;
            case "canada":
                if (!(dept in countryInfo)) {
                    continue;
                }
                if (countryInfo[dept] != "canada") {
                    continue;
                }
                break;
            case "world":
                break;
        }
        var areaDept = area + dept;
        if (!(areaDept in areaDeptAdjustedCount)) {
            areaDeptAdjustedCount[areaDept] = 0;
        }
        if (weights[area] == 0) {
            continue;
        }
        var name_1 = authors[r].name;
        var count = parseInt(authors[r].count);
        var adjustedCount = parseFloat(authors[r].adjustedcount);
        var year = authors[r].year;
        if ((year >= startyear) && (year <= endyear)) {
            areaDeptAdjustedCount[areaDept] += adjustedCount;
            /* Is this the first time we have seen this person? */
            if (!(name_1 in visited)) {
                visited[name_1] = true;
                facultycount[name_1 + dept] = 0;
                facultyAdjustedCount[name_1 + dept] = 0;
                if (!(dept in deptCounts)) {
                    deptCounts[dept] = 0;
                    deptNames[dept] = [];
                }
                deptNames[dept].push(name_1);
                deptCounts[dept] += 1;
            }
            facultycount[name_1 + dept] += count;
            facultyAdjustedCount[name_1 + dept] += adjustedCount;
        }
    }
}
/* Compute aggregate statistics. */
function computeStats(deptNames, areaAdjustedCount, areaDeptAdjustedCount, areas, numAreas, displayPercentages, weights) {
    var univagg = {};
    for (var dept in deptNames) {
        if (displayPercentages) {
            if (useArithmeticMean) {
                univagg[dept] = 0;
            }
            if (useGeometricMean) {
                univagg[dept] = 1;
            }
            if (useHarmonicMean) {
                univagg[dept] = 0;
            }
        }
        else {
            univagg[dept] = 0;
        }
        for (var ind = 0; ind < areas.length; ind++) {
            var area = areas[ind];
            var areaDept = area + dept;
            if (!(areaDept in areaDeptAdjustedCount)) {
                areaDeptAdjustedCount[areaDept] = 0;
            }
            if (weights[area] != 0) {
                if (displayPercentages) {
                    if (areaDeptAdjustedCount[areaDept] != 0) {
                        if (useArithmeticMean) {
                            univagg[dept] += areaDeptAdjustedCount[areaDept] / areaAdjustedCount[area];
                        }
                        if (useGeometricMean) {
                            univagg[dept] *= areaDeptAdjustedCount[areaDept];
                        }
                        if (useHarmonicMean) {
                            univagg[dept] += areaAdjustedCount[area] / areaDeptAdjustedCount[areaDept];
                        }
                    }
                    else {
                    }
                }
                else {
                    univagg[dept] += areaDeptAdjustedCount[areaDept];
                }
            }
        }
        if (displayPercentages) {
            if (useArithmeticMean) {
                univagg[dept] = univagg[dept] / numAreas;
            }
            if (useGeometricMean) {
                univagg[dept] = Math.pow(univagg[dept], 1 / numAreas);
            }
            if (useHarmonicMean) {
                univagg[dept] = numAreas / univagg[dept];
            }
        }
    }
    return univagg;
}
function rank() {
    var form = document.getElementById("rankform");
    var s = "";
    var deptNames = {}; /* names of departments. */
    var deptCounts = {}; /* number of faculty in each department. */
    var facultycount = {}; /* name + dept -> raw count of pubs per name / department */
    var facultyAdjustedCount = {}; /* name + dept -> adjusted count of pubs per name / department */
    var weights = {}; /* array to hold 1 or 0, depending on if the area is checked or not. */
    var areacount = {}; /* raw number of papers in each area */
    var areaAdjustedCount = {}; /* adjusted number of papers in each area (split among faculty authors). */
    var areaDeptAdjustedCount = {}; /* as above, but for area+dept. */
    var startyear = parseInt(jQuery("#startyear").find(":selected").text());
    var endyear = parseInt(jQuery("#endyear").find(":selected").text());
    var displayPercentages = Boolean(parseInt(jQuery("#displayPercent").find(":selected").val()));
    /* Show the top N (with more if tied at the end) */
    var minToRank = parseInt(jQuery("#minToRank").find(":selected").val());
    var whichRegions = jQuery("#regions").find(":selected").val();
    var numAreas = 0; /* Total number of areas checked */
    /* Update the 'weights' of each area from the checkboxes. */
    for (var ind = 0; ind < areas.length; ind++) {
        weights[areas[ind]] = jQuery('input[name=field_' + (ind + 1) + ']').prop('checked') ? 1 : 0;
        if (weights[areas[ind]] == 1) {
            /* One more area checked. */
            numAreas++;
        }
        areacount[areas[ind]] = 0;
        areaAdjustedCount[areas[ind]] = 0;
    }
    var coauthorList = {};
    if (showCoauthors) {
        coauthorList = computeCoauthors(coauthors, startyear, endyear, weights);
    }
    countPapers(areacount, areaAdjustedCount, areaDeptAdjustedCount, authors, startyear, endyear, weights);
    buildDepartments(areaDeptAdjustedCount, deptCounts, deptNames, facultycount, facultyAdjustedCount, authors, startyear, endyear, weights, whichRegions);
    /* (university, total or average number of papers) */
    var univagg = computeStats(deptNames, areaAdjustedCount, areaDeptAdjustedCount, areas, numAreas, displayPercentages, weights);
    var s = makePrologue();
    var univtext = {};
    /* Canonicalize names. */
    for (dept in deptNames) {
        for (var ind = 0; ind < deptNames[dept].length; ind++) {
            name = deptNames[dept][ind];
            if (name in aliases) {
                deptNames[dept][ind] = aliases[name];
                if (!(aliases[name] + dept in facultycount)) {
                    facultycount[aliases[name] + dept] = facultycount[name + dept];
                    facultyAdjustedCount[aliases[name] + dept] = facultyAdjustedCount[name + dept];
                }
                else {
                    facultycount[aliases[name] + dept] += facultycount[name + dept];
                    facultyAdjustedCount[aliases[name] + dept] += facultyAdjustedCount[name + dept];
                }
            }
        }
    }
    /* Build drop down for faculty names and paper counts. */
    for (dept in deptNames) {
        var p = '<div class="row"><div class="table"><table class="table-striped" width="400px"><thead><th></th><td><small><em><abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">Raw&nbsp;\#&nbsp;Pubs</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Count divided by number of co-authors">Adjusted&nbsp;&nbsp;\#</abbr></em></small></td></thead><tbody>';
        /* Build a dict of just faculty from this department for sorting purposes. */
        var fc = {};
        for (var ind = 0; ind < deptNames[dept].length; ind++) {
            name = deptNames[dept][ind];
            fc[name] = facultycount[name + dept];
        }
        var keys = Object.keys(fc);
        keys.sort(function (a, b) { return fc[b] - fc[a]; });
        for (var ind = 0; ind < keys.length; ind++) {
            name = keys[ind];
            if (showCoauthors) {
                /* Build up text for co-authors. */
                var coauthorStr = "";
                if ((!(name in coauthorList)) || (coauthorList[name].size == 0)) {
                    coauthorList[name] = new Set([]);
                    coauthorStr = "(no senior co-authors on these papers)";
                }
                else {
                    coauthorStr = "Senior co-authors on these papers:\n";
                }
                /* Sort it by last name. */
                var l = [];
                coauthorList[name].forEach(function (item, coauthors) {
                    l.push(item);
                });
                if (l.length > maxCoauthors) {
                    coauthorStr = "(more than " + maxCoauthors + " senior co-authors)";
                }
                else {
                    l.sort(compareNames);
                    l.forEach(function (item, coauthors) {
                        coauthorStr += item + "\n";
                    });
                    /* Trim off the trailing newline. */
                    coauthorStr = coauthorStr.slice(0, coauthorStr.length - 1);
                }
            }
            p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
                + '<a title="Click for author\'s home page." target="_blank" href="' + encodeURI(homepages[name]) + '">' // https://www.google.com/search?q='
                + name
                + '</a></small></td><td align="right"><small>'
                + '<a title="Click for author\'s DBLP entry." target="_blank" href="http://dblp.uni-trier.de/search?q=' + encodeURI(name) + '">'
                + facultycount[name + dept]
                + '</a>'
                + "</small></td>"
                + '</a></small></td><td align="right"><small>'
                + (Math.floor(10.0 * facultyAdjustedCount[name + dept]) / 10.0).toFixed(1)
                + "</small></td></tr>";
        }
        p += "</tbody></table></div></div>";
        univtext[dept] = p;
    }
    if (displayPercentages) {
        s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean number of papers published across all areas.">Average&nbsp;Count</abbr></th><th align="right">&nbsp;&nbsp;&nbsp;<abbr title="Number of faculty who have published in these areas.">Faculty</abbr></th></th></tr></thead>';
    }
    else {
        s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right">Adjusted&nbsp;Pub&nbsp;Count</th><th align="right">&nbsp;&nbsp;&nbsp;Faculty</th></tr></thead>';
    }
    s = s + "<tbody>";
    /* As long as there is at least one thing selected, compute and display a ranking. */
    if (numAreas > 0) {
        var ties = 1; /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
        var rank = 0; /* index */
        var oldv = null; /* old number - to track ties */
        /* Sort the university aggregate count from largest to smallest. */
        var keys2 = sortIndex(univagg);
        /* Display rankings until we have shown `minToRank` items or
           while there is a tie (those all get the same rank). */
        for (var ind = 0; ind < keys2.length; ind++) {
            var dept = keys2[ind];
            var v = univagg[dept];
            if (useArithmeticMean || useHarmonicMean) {
                v = (Math.floor(10000.0 * v) / (100.0));
            }
            if (useGeometricMean) {
                v = (Math.floor(10.0 * v) / 10.0);
            }
            if ((ind >= minToRank) && (v != oldv)) {
                break;
            }
            if (v === 0.0) {
                break;
            }
            if (oldv != v) {
                if (useDenseRankings) {
                    rank = rank + 1;
                }
                else {
                    rank = rank + ties;
                    ties = 0;
                }
            }
            s += "\n<tr><td>" + rank + "</td>";
            s += "<td><div onclick=\"toggle('" + dept + "')\" class=\"hovertip\" id=\"" + dept + "-widget\"><font color=\"blue\">&#9658;</font>&nbsp" + dept + "</div>";
            s += '<div style="display:none;" id="' + dept + '">' + univtext[dept] + '</div>';
            s += "</td>";
            if (displayPercentages) {
                /* Show average */
                if (useArithmeticMean || useHarmonicMean) {
                    s += '<td align="right">' + (Math.floor(10000.0 * v) / (100.0)).toPrecision(2) + "%</td>";
                }
                if (useGeometricMean) {
                    s += '<td align="right">' + (Math.floor(10.0 * v) / 10.0).toFixed(1) + "</td>";
                }
            }
            else {
                /* Show count */
                s += '<td align="right">' + (Math.floor(100.0 * v) / 100.0) + "</td>";
            }
            s += '<td align="right">' + deptCounts[dept] + "<br />"; /* number of faculty */
            s += "</td>";
            s += "</tr>\n";
            ties++;
            oldv = v;
        }
        s += "</tbody>" + "</table>" + "<br />";
        if (allowRankingChange) {
            /* Disable option to change ranking approach for now. */
            if (useDenseRankings) {
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
        s = "<h4>Please select at least one area.</h4>";
    }
    setTimeout((function (str) { redisplay(str); })(s), 0);
    return false;
}
function activateDenseRankings() {
    useDenseRankings = true;
    rank();
    return false;
}
function deactivateDenseRankings() {
    useDenseRankings = false;
    rank();
    return false;
}
window.onload = init;
