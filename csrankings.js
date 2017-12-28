/*

  CSRankings.ts

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
var CSRankings = /** @class */ (function () {
    function CSRankings() {
        var _this = this;
        this.authorFile = "/csrankings.csv";
        this.authorinfoFile = "/generated-author-info.csv";
        this.countryinfoFile = "/country-info.csv";
        this.aliasFile = "/dblp-aliases.csv";
        this.homepageImage = "/house-logo.png";
        this.allowRankingChange = false; /* Can we change the kind of rankings being used? */
        this.areaMap = [{ area: "ai", title: "AI" },
            { area: "aaai", title: "AI" },
            { area: "ijcai", title: "AI" },
            { area: "vision", title: "Vision" },
            { area: "cvpr", title: "Vision" },
            { area: "eccv", title: "Vision" },
            { area: "iccv", title: "Vision" },
            { area: "mlmining", title: "ML" },
            { area: "icml", title: "ML" },
            { area: "kdd", title: "ML" },
            { area: "nips", title: "ML" },
            { area: "nlp", title: "NLP" },
            { area: "acl", title: "NLP" },
            { area: "emnlp", title: "NLP" },
            { area: "naacl", title: "NLP" },
            { area: "ir", title: "Web & IR" },
            { area: "sigir", title: "Web & IR" },
            { area: "www", title: "Web & IR" },
            { area: "reconfig", title: "Reconfig" },
            { area: "fpga", title: "Reconfig" },
            { area: "fccm", title: "Reconfig" },
            { area: "fpl", title: "Reconfig" },
            { area: "fpt", title: "Reconfig" },
            { area: "arch", title: "Arch" },
            { area: "asplos", title: "Arch" },
            { area: "isca", title: "Arch" },
            { area: "micro", title: "Arch" },
            { area: "hpca", title: "Arch" },
            { area: "comm", title: "Networks" },
            { area: "sigcomm", title: "Networks" },
            { area: "nsdi", title: "Networks" },
            { area: "sec", title: "Security" },
            { area: "ccs", title: "Security" },
            { area: "oakland", title: "Security" },
            { area: "usenixsec", title: "Security" },
            { area: "ndss", title: "Security" },
            { area: "pets", title: "Security" },
            { area: "mod", title: "DB" },
            { area: "sigmod", title: "DB" },
            { area: "vldb", title: "DB" },
            { area: "icde", title: "DB" },
            { area: "pods", title: "DB" },
            { area: "hpc", title: "HPC" },
            { area: "sc", title: "HPC" },
            { area: "hpdc", title: "HPC" },
            { area: "ics", title: "HPC" },
            { area: "mobile", title: "Mobile" },
            { area: "mobicom", title: "Mobile" },
            { area: "mobisys", title: "Mobile" },
            { area: "sensys", title: "Mobile" },
            { area: "metrics", title: "Metrics" },
            { area: "imc", title: "Metrics" },
            { area: "sigmetrics", title: "Metrics" },
            { area: "ops", title: "OS" },
            { area: "sosp", title: "OS" },
            { area: "osdi", title: "OS" },
            { area: "fast", title: "OS" },
            { area: "usenixatc", title: "OS" },
            { area: "eurosys", title: "OS" },
            { area: "pldi", title: "PL" },
            { area: "popl", title: "PL" },
            { area: "icfp", title: "PL" },
            { area: "oopsla", title: "PL" },
            { area: "plan", title: "PL" },
            { area: "soft", title: "SE" },
            { area: "fse", title: "SE" },
            { area: "icse", title: "SE" },
            { area: "ase", title: "SE" },
            { area: "issta", title: "SE" },
            { area: "act", title: "Theory" },
            { area: "focs", title: "Theory" },
            { area: "soda", title: "Theory" },
            { area: "stoc", title: "Theory" },
            { area: "crypt", title: "Crypto" },
            { area: "crypto", title: "Crypto" },
            { area: "eurocrypt", title: "Crypto" },
            { area: "log", title: "Logic" },
            { area: "cav", title: "Logic" },
            { area: "lics", title: "Logic" },
            { area: "graph", title: "Graphics" },
            { area: "siggraph", title: "Graphics" },
            { area: "siggraph-asia", title: "Graphics" },
            { area: "chi", title: "HCI" },
            { area: "chiconf", title: "HCI" },
            { area: "ubicomp", title: "HCI" },
            { area: "uist", title: "HCI" },
            { area: "robotics", title: "Robotics" },
            { area: "icra", title: "Robotics" },
            { area: "iros", title: "Robotics" },
            { area: "rss", title: "Robotics" },
            { area: "bio", title: "Comp. Biology" },
            { area: "ismb", title: "Comp. Biology" },
            { area: "recomb", title: "Comp. Biology" },
            { area: "da", title: "EDA" },
            { area: "dac", title: "EDA" },
            { area: "iccad", title: "EDA" },
            { area: "bed", title: "Embedded" },
            { area: "emsoft", title: "Embedded" },
            { area: "rtas", title: "Embedded" },
            { area: "rtss", title: "Embedded" },
            { area: "visualization", title: "Visualization" },
            { area: "vis", title: "Visualization" },
            { area: "vr", title: "Visualization" },
            { area: "ecom", title: "ECom" },
            { area: "ec", title: "ECom" },
            { area: "wine", title: "ECom" }
            //,{ area : "cse", title : "CSEd" }
        ];
        this.aiAreas = ["ai", "vision", "mlmining", "nlp", "ir"];
        this.systemsAreas = ["reconfig", "arch", "comm", "sec", "mod", "hpc", "mobile", "metrics", "ops", "plan", "soft", "da", "bed"];
        this.theoryAreas = ["act", "crypt", "log"];
        this.interdisciplinaryAreas = ["graph", "chi", "robotics", "bio", "visualization", "ecom"];
        this.areaNames = [];
        this.fields = [];
        this.aiFields = [];
        this.systemsFields = [];
        this.theoryFields = [];
        this.otherFields = [];
        /* Map area to its name (from areaNames). */
        this.areaDict = {};
        /* Map area to its position in the list. */
        this.areaPosition = {};
        /* Map names to Google Scholar IDs. */
        this.scholarInfo = {};
        /* Map aliases to canonical author name. */
        this.aliases = {};
        /* Map institution to (non-US) region. */
        this.countryInfo = {};
        /* Map name to home page. */
        this.homepages = {};
        /* Set to true for "dense rankings" vs. "competition rankings". */
        this.useDenseRankings = false;
        /* The data which will hold the parsed CSV of author info. */
        this.authors = [];
        /* Map authors to the areas they have published in (for pie chart display). */
        this.authorAreas = {};
        /* Computed stats (univagg). */
        this.stats = {};
        this.areaDeptAdjustedCount = {}; /* area+dept */
        /* Colors for all areas. */
        this.color = ["#f30000", "#0600f3", "#00b109", "#14e4b4", "#0fe7fb", "#67f200", "#ff7e00", "#8fe4fa", "#ff5300", "#640000", "#3854d1", "#d00ed8", "#7890ff", "#01664d", "#04231b", "#e9f117", "#f3228e", "#7ce8ca", "#ff5300", "#ff5300", "#7eff30", "#9a8cf6", "#79aff9", "#bfbfbf", "#56b510", "#00e2f6", "#ff4141", "#61ff41"];
        this.RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
        this.DownTriangle = "&#9660;"; // downward-facing triangle symbol (expanded view)
        this.PieChart = "&#9685;"; // symbol that looks close enough to a pie chart
        this.navigoRouter = new Navigo(null, true);
        /* Build the areaDict dictionary: areas -> names used in pie charts
           and areaPosition dictionary: areas -> position in area array
        */
        for (var position = 0; position < this.areaMap.length; position++) {
            var _a = this.areaMap[position], area = _a.area, title = _a.title;
            CSRankings.areas[position] = area;
            this.areaNames[position] = title;
            this.fields[position] = area;
            this.areaDict[area] = this.areaNames[position];
            this.areaPosition[area] = position;
        }
        for (var _i = 0, _b = this.aiAreas; _i < _b.length; _i++) {
            var area = _b[_i];
            this.aiFields.push(this.areaPosition[area]);
        }
        for (var _c = 0, _d = this.systemsAreas; _c < _d.length; _c++) {
            var area = _d[_c];
            this.systemsFields.push(this.areaPosition[area]);
        }
        for (var _e = 0, _f = this.theoryAreas; _e < _f.length; _e++) {
            var area = _f[_e];
            this.theoryFields.push(this.areaPosition[area]);
        }
        for (var _g = 0, _h = this.interdisciplinaryAreas; _g < _h.length; _g++) {
            var area = _h[_g];
            this.otherFields.push(this.areaPosition[area]);
        }
        for (var child in CSRankings.parentMap) {
            var parent_1 = CSRankings.parentMap[child];
            if (!(parent_1 in CSRankings.childMap)) {
                CSRankings.childMap[parent_1] = [child];
            }
            else {
                CSRankings.childMap[parent_1].push(child);
            }
        }
        this.displayProgress(1);
        this.loadAliases(this.aliases, function () {
            _this.displayProgress(2);
            _this.loadAuthorInfo(function () {
                _this.displayProgress(3);
                _this.loadAuthors(function () {
                    _this.displayProgress(4);
                    _this.loadCountryInfo(_this.countryInfo, function () {
                        //					     this.navigoRouter.on('/fromyear/:fromyear/toyear/:toyear/index', this.navigator).resolve();
                        _this.setAllOn();
                        // this.navigoRouter.on('/index', this.navigator).resolve();
                        _this.navigoRouter.on({
                            '/index': _this.navigator,
                            '/fromyear/:fromyear/toyear/:toyear/index': _this.navigator
                        }).resolve();
                        _this.rank();
                        _this.addListeners();
                    });
                });
            });
        });
    }
    CSRankings.prototype.translateNameToDBLP = function (name) {
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
    CSRankings.prototype.makePrologue = function () {
        var s = '<div class="table-responsive" style="overflow:auto; height:700px;">'
            + '<table class="table table-fit table-sm table-striped"'
            + 'id="ranking" valign="top">';
        return s;
    };
    /* from http://hubrik.com/2015/11/16/sort-by-last-name-with-javascript/ */
    CSRankings.prototype.compareNames = function (a, b) {
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
    CSRankings.prototype.makeChart = function (name) {
        console.assert(this.color.length >= CSRankings.areas.length, "Houston, we have a problem.");
        var data = [];
        var datadict = {};
        var keys = CSRankings.areas;
        var uname = unescape(name);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!(uname in this.authorAreas)) {
                // Defensive programming.
                // This should only happen if we have an error in the aliases file.
                return;
            }
            if (key in CSRankings.nextTier) {
                continue;
            }
            var value = this.authorAreas[uname][key];
            // Use adjusted count if this is for a department.
            /*
                DISABLED so department charts are invariant.
    
            if (uname in this.stats) {
            value = this.areaDeptAdjustedCount[key+uname] + 1;
            if (value == 1) {
                value = 0;
            }
            }
            */
            // Round it to the nearest 0.1.
            value = Math.round(value * 10) / 10;
            if (value > 0) {
                if (key in CSRankings.parentMap) {
                    key = CSRankings.parentMap[key];
                }
                if (!(key in datadict)) {
                    datadict[key] = 0;
                }
                datadict[key] += value;
            }
        }
        for (var key in datadict) {
            data.push({ "label": this.areaDict[key],
                "value": Math.round(datadict[key] * 10) / 10,
                "color": this.color[this.areaPosition[key]] });
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
                    "fontSize": 10.5
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
    CSRankings.prototype.displayProgress = function (step) {
        var msgs = ["Loading alias data.",
            "Loading author information.",
            "Loading publication data.",
            "Computing ranking."];
        var s = "";
        var count = 1;
        msgs.map(function (elem) {
            if (count == step) {
                s += "<strong>" + elem + "</strong>";
            }
            else {
                s += "<font color='gray'>" + elem + "</font>";
            }
            s += "<br />";
            count += 1;
        });
        jQuery("#progress").html(s);
    };
    CSRankings.prototype.loadAliases = function (aliases, cont) {
        Papa.parse(this.aliasFile, {
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
    CSRankings.prototype.loadCountryInfo = function (countryInfo, cont) {
        Papa.parse(this.countryinfoFile, {
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
    CSRankings.prototype.loadAuthorInfo = function (cont) {
        var _this = this;
        Papa.parse(this.authorFile, {
            download: true,
            header: true,
            complete: function (results) {
                var data = results.data;
                var ai = data;
                for (var counter = 0; counter < ai.length; counter++) {
                    var record = ai[counter];
                    var name_1 = record['name'];
                    _this.homepages[name_1.trim()] = record['homepage'];
                    _this.scholarInfo[name_1.trim()] = record['scholarid'];
                }
                setTimeout(cont, 0);
            }
        });
    };
    CSRankings.prototype.loadAuthors = function (cont) {
        var _this = this;
        Papa.parse(this.authorinfoFile, {
            download: true,
            header: true,
            complete: function (results) {
                var data = results.data;
                _this.authors = data;
                setTimeout(cont, 0);
            }
        });
    };
    CSRankings.prototype.inRegion = function (dept, regions) {
        switch (regions) {
            case "world":
                break;
            case "USA":
                if (dept in this.countryInfo) {
                    return false;
                }
                break;
            case "europe":
                if (!(dept in this.countryInfo)) {
                    return false;
                }
                if (this.countryInfo[dept] != "europe") {
                    return false;
                }
                break;
            case "canada":
                if (!(dept in this.countryInfo)) {
                    return false;
                }
                if (this.countryInfo[dept] != "canada") {
                    return false;
                }
                break;
            case "northamerica":
                if ((dept in this.countryInfo) && (this.countryInfo[dept] != "canada")) {
                    return false;
                }
                break;
            case "australasia":
                if (!(dept in this.countryInfo)) {
                    return false;
                }
                if (this.countryInfo[dept] != "australasia") {
                    return false;
                }
                break;
            case "southamerica":
                if (!(dept in this.countryInfo)) {
                    return false;
                }
                if (this.countryInfo[dept] != "southamerica") {
                    return false;
                }
                break;
            case "asia":
                if (!(dept in this.countryInfo)) {
                    return false;
                }
                if (this.countryInfo[dept] != "asia") {
                    return false;
                }
                break;
        }
        return true;
    };
    CSRankings.prototype.activateFields = function (value, fields) {
        for (var i = 0; i < fields.length; i++) {
            var item = this.fields[fields[i]];
            var str = "input[name=" + item + "]";
            jQuery(str).prop('checked', value);
            if (item in CSRankings.childMap) {
                // It's a parent.
                jQuery(str).prop('disabled', false);
                // Activate / deactivate all children as appropriate.
                CSRankings.childMap[item].forEach(function (k) {
                    if (k in CSRankings.nextTier) {
                        jQuery('input[name=' + k + ']').prop('checked', false);
                    }
                    else {
                        jQuery('input[name=' + k + ']').prop('checked', value);
                    }
                });
            }
        }
        this.rank();
        return false;
    };
    CSRankings.prototype.sortIndex = function (univagg) {
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
    CSRankings.prototype.countAuthorAreas = function (startyear, endyear) {
        for (var r in this.authors) {
            if (!this.authors.hasOwnProperty(r)) {
                continue;
            }
            var auth = this.authors[r];
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
            if (name_2 in this.aliases) {
                name_2 = this.aliases[name_2];
            }
            if (!(name_2 in this.authorAreas)) {
                this.authorAreas[name_2] = {};
                for (var area in this.areaDict) {
                    if (this.areaDict.hasOwnProperty(area)) {
                        this.authorAreas[name_2][area] = 0;
                    }
                }
            }
            if (!(theDept in this.authorAreas)) {
                this.authorAreas[theDept] = {};
                for (var area in this.areaDict) {
                    if (this.areaDict.hasOwnProperty(area)) {
                        this.authorAreas[theDept][area] = 0;
                    }
                }
            }
            this.authorAreas[name_2][theArea] += theCount;
            this.authorAreas[theDept][theArea] += theCount;
        }
    };
    /* Build the dictionary of departments (and count) to be ranked. */
    CSRankings.prototype.buildDepartments = function (startyear, endyear, weights, regions, deptCounts, deptNames, facultycount, facultyAdjustedCount) {
        /* contains an author name if that author has been processed. */
        var visited = {};
        for (var r in this.authors) {
            if (!this.authors.hasOwnProperty(r)) {
                continue;
            }
            var _a = this.authors[r], name_3 = _a.name, year = _a.year, area = _a.area, dept = _a.dept;
            if (name_3 in this.aliases) {
                name_3 = this.aliases[name_3];
            }
            if (typeof dept === 'undefined') {
                continue;
            }
            if ((weights[area] === 0) || (year < startyear) || (year > endyear)) {
                continue;
            }
            if (!this.inRegion(dept, regions)) {
                continue;
            }
            // If this area is a child area, accumulate totals for parent.
            if (area in CSRankings.parentMap) {
                area = CSRankings.parentMap[area];
            }
            var areaDept = area + dept;
            var nameDept = name_3 + dept;
            if (!(areaDept in this.areaDeptAdjustedCount)) {
                this.areaDeptAdjustedCount[areaDept] = 0;
            }
            var count = parseInt(this.authors[r].count);
            var adjustedCount = parseFloat(this.authors[r].adjustedcount);
            this.areaDeptAdjustedCount[areaDept] += adjustedCount;
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
    CSRankings.prototype.computeStats = function (deptNames, numAreas, weights) {
        this.stats = {};
        for (var dept in deptNames) {
            if (!deptNames.hasOwnProperty(dept)) {
                continue;
            }
            this.stats[dept] = 1;
            for (var _i = 0, _a = CSRankings.areas; _i < _a.length; _i++) {
                var area = _a[_i];
                // If this area is a child area, skip it.
                if (area in CSRankings.parentMap) {
                    continue;
                }
                var areaDept = area + dept;
                if (!(areaDept in this.areaDeptAdjustedCount)) {
                    this.areaDeptAdjustedCount[areaDept] = 0;
                }
                if (weights[area] != 0) {
                    // Adjusted (smoothed) geometric mean.
                    this.stats[dept] *= (this.areaDeptAdjustedCount[areaDept] + 1.0);
                }
            }
            // finally compute geometric mean.
            this.stats[dept] = Math.pow(this.stats[dept], 1 / numAreas);
        }
    };
    /* Updates the 'weights' of each area from the checkboxes. */
    /* Returns the number of areas selected (checked). */
    CSRankings.prototype.updateWeights = function (weights) {
        var numAreas = 0;
        for (var ind = 0; ind < CSRankings.areas.length; ind++) {
            var area = CSRankings.areas[ind];
            weights[area] = jQuery('input[name=' + this.fields[ind] + ']').prop('checked') ? 1 : 0;
            if (weights[area] === 1) {
                if (area in CSRankings.parentMap) {
                    // Don't count children.
                    continue;
                }
                /* One more area checked. */
                numAreas++;
            }
        }
        return numAreas;
    };
    CSRankings.prototype.canonicalizeNames = function (deptNames, facultycount, facultyAdjustedCount) {
        for (var dept in deptNames) {
            if (!deptNames.hasOwnProperty(dept)) {
                continue;
            }
            for (var ind = 0; ind < deptNames[dept].length; ind++) {
                var name_4 = deptNames[dept][ind];
                if (name_4 in this.aliases) {
                    deptNames[dept][ind] = this.aliases[name_4];
                    if (!(this.aliases[name_4] + dept in facultycount)) {
                        facultycount[this.aliases[name_4] + dept] = facultycount[name_4 + dept];
                        facultyAdjustedCount[this.aliases[name_4] + dept] = facultyAdjustedCount[name_4 + dept];
                    }
                    else {
                        facultycount[this.aliases[name_4] + dept] += facultycount[name_4 + dept];
                        facultyAdjustedCount[this.aliases[name_4] + dept] += facultyAdjustedCount[name_4 + dept];
                    }
                }
            }
        }
    };
    /* Build drop down for faculty names and paper counts. */
    CSRankings.prototype.buildDropDown = function (deptNames, facultycount, facultyAdjustedCount) {
        var _this = this;
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
                        return _this.compareNames(a, b);
                    }
                    return fb - fa;
                }
                else {
                    return fc[b] - fc[a];
                }
            });
            for (var _b = 0, keys_1 = keys; _b < keys_1.length; _b++) {
                var name_6 = keys_1[_b];
                var homePage = encodeURI(this_1.homepages[name_6]);
                var dblpName = this_1.translateNameToDBLP(name_6);
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
                if (this_1.scholarInfo.hasOwnProperty(name_6)) {
                    if (this_1.scholarInfo[name_6] != "NOSCHOLARPAGE") {
                        var url = 'https://scholar.google.com/citations?user='
                            + this_1.scholarInfo[name_6]
                            + '&hl=en&oi=ao';
                        p += '<a title="Click for author\'s Google Scholar page." target="_blank" href="' + url + '" '
                            + 'onclick="trackOutboundLink(\''
                            + url
                            + '\', true); return false;"'
                            + '>'
                            + '<img src="scholar-favicon.ico" height="10" width="10">'
                            + '</a>&nbsp;';
                    }
                }
                p += '<a title="Click for author\'s home page." target="_blank" href="'
                    + homePage
                    + '" '
                    + 'onclick="trackOutboundLink(\''
                    + homePage
                    + '\', true); return false;"'
                    + '>' + '<img src=\"' + this_1.homepageImage + '\"></a>&nbsp;';
                p += "<span onclick='csr.toggleChart(\"" + escape(name_6) + "\");' title=\"Click for author's publication profile.\" class=\"hovertip\" ><font color=\"blue\">" + this_1.PieChart + "</font></span>"
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
        var this_1 = this;
        for (var dept in deptNames) {
            _loop_1(dept);
        }
        return univtext;
    };
    CSRankings.prototype.buildOutputString = function (numAreas, deptCounts, univtext) {
        var s = this.makePrologue();
        /* Show the top N (with more if tied at the end) */
        var minToRank = 99999; // parseInt(jQuery("#minToRank").find(":selected").val());
        s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean count of papers published across all areas.">Count</abbr></th><th align="right">&nbsp;<abbr title="Number of faculty who have published in these areas.">Faculty</abbr></th></th></tr></thead>';
        s = s + "<tbody>";
        /* As long as there is at least one thing selected, compute and display a ranking. */
        if (numAreas > 0) {
            var ties = 1; /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
            var rank = 0; /* index */
            var oldv = 9999999.999; /* old number - to track ties */
            /* Sort the university aggregate count from largest to smallest. */
            var keys2 = this.sortIndex(this.stats);
            /* Display rankings until we have shown `minToRank` items or
               while there is a tie (those all get the same rank). */
            for (var ind = 0; ind < keys2.length; ind++) {
                var dept = keys2[ind];
                var v = Math.round(10.0 * this.stats[dept]) / 10.0;
                if ((ind >= minToRank) && (v != oldv)) {
                    break;
                }
                if (v === 0.0) {
                    break;
                }
                if (oldv != v) {
                    if (this.useDenseRankings) {
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
                    + "<span class=\"hovertip\" onclick=\"csr.toggleFaculty('" + esc + "')\";\" id=\"" + esc + "-widget\">"
                    + "<font color=\"blue\">"
                    + this.RightTriangle
                    + "</font>"
                    + "</span>";
                s += "&nbsp;" + dept + "&nbsp;"
                    + "<font color=\"blue\">"
                    + "<span class=\"hovertip\" onclick=\"csr.toggleChart('" + esc + "')\";\" >"
                    + this.PieChart
                    + "</span></font>";
                s += "</td>";
                s += '<td align="right">' + (Math.round(10.0 * v) / 10.0).toFixed(1) + "</td>";
                s += '<td align="right">' + deptCounts[dept] + "<br />"; /* number of faculty */
                s += "</td>";
                s += "</tr>\n";
                s += '<tr><td colspan="4"><div style="display:none;" style="width: 100%; height: 350px;" id="'
                    + esc + '-chart">' + '</div></td></tr>';
                s += '<tr><td colspan="4"><div style="display:none;" id="' + esc + '-faculty">' + univtext[dept] + '</div></td></tr>';
                ties++;
                oldv = v;
            }
            s += "</tbody>" + "</table>" + "<br />";
            /*
              if (this.allowRankingChange) {
              // Disable option to change ranking approach for now.
              if (this.useDenseRankings) {
              s += '<em><a class="only_these_areas" onClick="deactivateDenseRankings(); return false;"><font color="blue"><b>Using dense rankings. Click to use competition rankings.</b></font></a><em>';
              } else {
              s += '<em><a class="only_these_areas" onClick="activateDenseRankings(); return false;"><font color="blue"><b>Using competition rankings. Click to use dense rankings.</b></font></a></em>';
              }
              }
            */
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
    CSRankings.prototype.setAllCheckboxes = function () {
        this.activateAll();
    };
    /* This activates all checkboxes _without_ triggering ranking. */
    CSRankings.prototype.setAllOn = function (value) {
        if (value === void 0) { value = true; }
        for (var i = 0; i < CSRankings.areas.length; i++) {
            var item = this.fields[i];
            var str = "input[name=" + item + "]";
            if (value) {
                // Turn off all next tier venues.
                if (item in CSRankings.nextTier) {
                    jQuery(str).prop('checked', false);
                }
                else {
                    jQuery(str).prop('checked', true);
                    jQuery(str).prop('disabled', false);
                }
            }
            else {
                // turn everything off.
                jQuery(str).prop('checked', false);
                jQuery(str).prop('disabled', false);
            }
        }
    };
    /* PUBLIC METHODS */
    CSRankings.prototype.rank = function (update) {
        if (update === void 0) { update = true; }
        var deptNames = {}; /* names of departments. */
        var deptCounts = {}; /* number of faculty in each department. */
        var facultycount = {}; /* name + dept -> raw count of pubs per name / department */
        var facultyAdjustedCount = {}; /* name + dept -> adjusted count of pubs per name / department */
        var currentWeights = {}; /* array to hold 1 or 0, depending on if the area is checked or not. */
        this.areaDeptAdjustedCount = {};
        var startyear = parseInt(jQuery("#fromyear").find(":selected").text());
        var endyear = parseInt(jQuery("#toyear").find(":selected").text());
        var whichRegions = jQuery("#regions").find(":selected").val();
        var numAreas = this.updateWeights(currentWeights);
        this.authorAreas = {};
        this.countAuthorAreas(startyear, endyear);
        this.buildDepartments(startyear, endyear, currentWeights, whichRegions, deptCounts, deptNames, facultycount, facultyAdjustedCount);
        /* (university, total or average number of papers) */
        this.computeStats(deptNames, numAreas, currentWeights);
        /* Canonicalize names. */
        this.canonicalizeNames(deptNames, facultycount, facultyAdjustedCount);
        var univtext = this.buildDropDown(deptNames, facultycount, facultyAdjustedCount);
        /* Start building up the string to output. */
        var s = this.buildOutputString(numAreas, deptCounts, univtext);
        /* Finally done. Redraw! */
        jQuery("#success").html(s);
        if (!update) {
            this.navigoRouter.pause();
        }
        else {
            this.navigoRouter.resume();
        }
        this.urlUpdate();
        return false;
    };
    /* Turn the chart display on or off. */
    CSRankings.prototype.toggleChart = function (name) {
        var chart = document.getElementById(name + "-chart");
        if (chart.style.display === 'block') {
            chart.style.display = 'none';
            chart.innerHTML = '';
        }
        else {
            chart.style.display = 'block';
            this.makeChart(name);
        }
    };
    /* Expand or collape the view of conferences in a given area. */
    CSRankings.prototype.toggleConferences = function (area) {
        var e = document.getElementById(area + "-conferences");
        var widget = document.getElementById(area + "-widget");
        if (e.style.display === 'block') {
            e.style.display = 'none';
            widget.innerHTML = "<font color=\"blue\">" + this.RightTriangle + "</font>";
        }
        else {
            e.style.display = 'block';
            widget.innerHTML = "<font color=\"blue\">" + this.DownTriangle + "</font>";
        }
    };
    /* Expand or collape the view of all faculty in a department. */
    CSRankings.prototype.toggleFaculty = function (dept) {
        var e = document.getElementById(dept + "-faculty");
        var widget = document.getElementById(dept + "-widget");
        if (e.style.display === 'block') {
            e.style.display = 'none';
            widget.innerHTML = "<font color=\"blue\">" + this.RightTriangle + "</font>";
        }
        else {
            e.style.display = 'block';
            widget.innerHTML = "<font color=\"blue\">" + this.DownTriangle + "</font>";
        }
    };
    CSRankings.prototype.activateAll = function (value) {
        if (value === void 0) { value = true; }
        this.setAllOn(value);
        this.rank();
        return false;
    };
    CSRankings.prototype.activateNone = function () {
        return this.activateAll(false);
    };
    CSRankings.prototype.activateSystems = function (value) {
        if (value === void 0) { value = true; }
        return this.activateFields(value, this.systemsFields);
    };
    CSRankings.prototype.activateAI = function (value) {
        if (value === void 0) { value = true; }
        return this.activateFields(value, this.aiFields);
    };
    CSRankings.prototype.activateTheory = function (value) {
        if (value === void 0) { value = true; }
        return this.activateFields(value, this.theoryFields);
    };
    CSRankings.prototype.activateOthers = function (value) {
        if (value === void 0) { value = true; }
        return this.activateFields(value, this.otherFields);
    };
    CSRankings.prototype.deactivateSystems = function () {
        return this.activateSystems(false);
    };
    CSRankings.prototype.deactivateAI = function () {
        return this.activateAI(false);
    };
    CSRankings.prototype.deactivateTheory = function () {
        return this.activateTheory(false);
    };
    CSRankings.prototype.deactivateOthers = function () {
        return this.activateOthers(false);
    };
    // Update the URL according to the selected checkboxes.
    CSRankings.prototype.urlUpdate = function () {
        var s = '';
        var count = 0;
        var totalParents = 0;
        var _loop_2 = function (i) {
            var str = 'input[name=' + this_2.fields[i] + ']';
            if (!(this_2.fields[i] in CSRankings.parentMap)) {
                totalParents += 1;
            }
            if (jQuery(str).prop('checked')) {
                // Only add parents.
                if (!(this_2.fields[i] in CSRankings.parentMap)) {
                    // And only add if every top tier child is checked
                    // and only if every next tier child is NOT
                    // checked.
                    var allChecked_1 = 1;
                    if (this_2.fields[i] in CSRankings.childMap) {
                        CSRankings.childMap[this_2.fields[i]].forEach(function (k) {
                            var val = jQuery('input[name=' + k + ']').prop('checked');
                            if (!(k in CSRankings.nextTier)) {
                                allChecked_1 &= val;
                            }
                            else {
                                allChecked_1 &= val ? 0 : 1;
                            }
                        });
                    }
                    if (allChecked_1) {
                        s += this_2.fields[i] + '&';
                        count += 1;
                    }
                }
            }
        };
        var this_2 = this;
        for (var i = 0; i < this.fields.length; i++) {
            _loop_2(i);
        }
        if (count > 0) {
            // Trim off the trailing '&'.
            s = s.slice(0, -1);
        }
        var region = jQuery("#regions").find(":selected").val();
        var start = '';
        // Check the dates.
        var d = new Date();
        var currYear = d.getFullYear();
        var startyear = parseInt(jQuery("#fromyear").find(":selected").text());
        var endyear = parseInt(jQuery("#toyear").find(":selected").text());
        if ((startyear != currYear - 10) || (endyear != currYear)) {
            start += '/fromyear/' + startyear.toString();
            start += '/toyear/' + endyear.toString();
        }
        if (count == totalParents) {
            start += '/index?all'; // Distinguished special URL - default = all selected.
        }
        else if (count == 0) {
            start += '/index?none'; // Distinguished special URL - none selected.
        }
        else {
            start += '/index?' + s;
        }
        if (region != "USA") {
            start += '&' + region;
        }
        this.navigoRouter.navigate(start);
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
                    jQuery("#regions").val("USA");
                    break;
                default:
                    jQuery("#regions").val("world");
                    break;
            }
        });
    };
    CSRankings.prototype.navigator = function (params, query) {
        if (params !== null) {
            // Set params (fromyear and toyear).
            Object.keys(params).forEach(function (key) {
                jQuery("#" + key).prop('value', params[key].toString());
            });
        }
        // Clear everything *unless* there are subsets / below-the-fold selected.
        CSRankings.clearNonSubsetted();
        // Now check everything listed in the query string.
        var q = query.split('&');
        // If there is an 'all' in the query string, set everything to true.
        var foundAll = q.some(function (elem) {
            return (elem == "all");
        });
        var foundNone = q.some(function (elem) {
            return (elem == "none");
        });
        // Check for regions and strip them out.
        var foundRegion = q.some(function (elem) {
            return CSRankings.regions.indexOf(elem) >= 0;
        });
        if (foundRegion) {
            var index_1 = 0;
            q.forEach(function (elem) {
                // Splice it out.
                if (CSRankings.regions.indexOf(elem) >= 0) {
                    q.splice(index_1, 1);
                }
                // Set the region.
                jQuery("#regions").val(elem);
                index_1 += 1;
            });
        }
        else {
            CSRankings.geoCheck();
        }
        if (foundAll) {
            // Set everything.
            for (var position = 0; position < CSRankings.areas.length; position++) {
                var item = CSRankings.areas[position];
                if (!(item in CSRankings.nextTier)) {
                    var str = "input[name=" + item + "]";
                    jQuery(str).prop('checked', true);
                    if (item in CSRankings.childMap) {
                        // It's a parent. Enable it.
                        jQuery(str).prop('disabled', false);
                        // and activate all children.
                        CSRankings.childMap[item].forEach(function (k) {
                            if (!(k in CSRankings.nextTier)) {
                                jQuery('input[name=' + k + ']').prop('checked', true);
                            }
                        });
                    }
                }
            }
            // And we're out.
            return;
        }
        if (foundNone) {
            // Clear everything and return.
            CSRankings.clearNonSubsetted();
            return;
        }
        // Just a list of areas.
        // First, clear everything that isn't subsetted.
        CSRankings.clearNonSubsetted();
        // Then, activate the areas in the query.
        for (var _i = 0, q_1 = q; _i < q_1.length; _i++) {
            var item = q_1[_i];
            if ((item != "none") && (item != "")) {
                var str = "input[name=" + item + "]";
                jQuery(str).prop('checked', true);
                jQuery(str).prop('disabled', false);
                if (item in CSRankings.childMap) {
                    // Activate all children.
                    CSRankings.childMap[item].forEach(function (k) {
                        if (!(k in CSRankings.nextTier)) {
                            jQuery('input[name=' + k + ']').prop('checked', true);
                        }
                    });
                }
            }
        }
    };
    CSRankings.clearNonSubsetted = function () {
        for (var _i = 0, _a = CSRankings.areas; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item in CSRankings.childMap) {
                var kids = CSRankings.childMap[item];
                if (!CSRankings.subsetting(kids)) {
                    var str = "input[name=" + item + "]";
                    jQuery(str).prop('checked', false);
                    jQuery(str).prop('disabled', false);
                    kids.forEach(function (item) {
                        jQuery("input[name=" + item + "]").prop('checked', false);
                    });
                }
            }
        }
    };
    CSRankings.subsetting = function (sibs) {
        // Separate the siblings into above and below the fold.
        var aboveFold = [];
        var belowFold = [];
        sibs.forEach(function (elem) {
            if (elem in CSRankings.nextTier) {
                belowFold.push(elem);
            }
            else {
                aboveFold.push(elem);
            }
        });
        // Count how many are checked above and below.
        var numCheckedAbove = 0;
        aboveFold.forEach(function (elem) {
            var str = "input[name=" + elem + "]";
            var val = jQuery(str).prop('checked');
            if (val) {
                numCheckedAbove++;
            }
        });
        var numCheckedBelow = 0;
        belowFold.forEach(function (elem) {
            var str = "input[name=" + elem + "]";
            var val = jQuery(str).prop('checked');
            if (val) {
                numCheckedBelow++;
            }
        });
        var subsettedAbove = ((numCheckedAbove > 0) && (numCheckedAbove < aboveFold.length));
        var subsettedBelow = ((numCheckedBelow > 0) && (belowFold.length != 0));
        return subsettedAbove || subsettedBelow;
    };
    CSRankings.prototype.addListeners = function () {
        var _this = this;
        ["toyear", "fromyear", "regions"].forEach(function (key) {
            var widget = document.getElementById(key);
            widget.addEventListener("change", function () { _this.rank(); });
        });
        var _loop_3 = function (position) {
            var area = CSRankings.areas[position];
            if (!(area in CSRankings.parentMap)) {
                // Not a child.
                var widget = document.getElementById(area + '-widget');
                widget.addEventListener("click", function () {
                    _this.toggleConferences(area);
                });
            }
        };
        // Add listeners for clicks on area widgets (left side of screen)
        // e.g., 'ai'
        for (var position = 0; position < CSRankings.areas.length; position++) {
            _loop_3(position);
        }
        var _loop_4 = function (i) {
            var str = 'input[name=' + this_3.fields[i] + ']';
            var field = this_3.fields[i];
            jQuery(str).click(function () {
                var updateURL = true;
                if (field in CSRankings.parentMap) {
                    // Child:
                    // If any child is on, activate the parent.
                    // If all are off, deactivate parent.
                    updateURL = false;
                    var parent_2 = CSRankings.parentMap[field];
                    var strparent = 'input[name=' + parent_2 + ']';
                    var anyChecked_1 = 0;
                    var allChecked_2 = 1;
                    CSRankings.childMap[parent_2].forEach(function (k) {
                        var val = jQuery('input[name=' + k + ']').prop('checked');
                        anyChecked_1 |= val;
                        // allChcked means all top tier conferences
                        // are on and all next tier conferences are
                        // off.
                        if (!(k in CSRankings.nextTier)) {
                            // All need to be on.
                            allChecked_2 &= val;
                        }
                        else {
                            // All need to be off.
                            allChecked_2 &= val ? 0 : 1;
                        }
                    });
                    // Activate parent if any checked.
                    jQuery(strparent).prop('checked', anyChecked_1);
                    // Mark the parent as disabled unless all are checked.
                    if (!anyChecked_1 || allChecked_2) {
                        jQuery(strparent).prop('disabled', false);
                    }
                    if (anyChecked_1 && !allChecked_2) {
                        jQuery(strparent).prop('disabled', true);
                    }
                }
                else {
                    // Parent: activate or deactivate all children.
                    var val = jQuery(str).prop('checked');
                    if (field in CSRankings.childMap) {
                        for (var _i = 0, _a = CSRankings.childMap[field]; _i < _a.length; _i++) {
                            var child = _a[_i];
                            var strchild = 'input[name=' + child + ']';
                            if (!(child in CSRankings.nextTier)) {
                                jQuery(strchild).prop('checked', val);
                            }
                            else {
                                // Always deactivate next tier conferences.
                                jQuery(strchild).prop('checked', false);
                            }
                        }
                    }
                }
                _this.rank(updateURL);
            });
        };
        var this_3 = this;
        // Initialize callbacks for area checkboxes.
        for (var i = 0; i < this.fields.length; i++) {
            _loop_4(i);
        }
        // Add group selectors.
        var listeners = { 'all_areas_on': (function () { _this.activateAll(); }),
            'all_areas_off': (function () { _this.activateNone(); }),
            'ai_areas_on': (function () { _this.activateAI(); }),
            'ai_areas_off': (function () { _this.deactivateAI(); }),
            'systems_areas_on': (function () { _this.activateSystems(); }),
            'systems_areas_off': (function () { _this.deactivateSystems(); }),
            'theory_areas_on': (function () { _this.activateTheory(); }),
            'theory_areas_off': (function () { _this.deactivateTheory(); }),
            'other_areas_on': (function () { _this.activateOthers(); }),
            'other_areas_off': (function () { _this.deactivateOthers(); })
        };
        var _loop_5 = function (item) {
            var widget = document.getElementById(item);
            widget.addEventListener("click", function () {
                listeners[item]();
            });
        };
        for (var item in listeners) {
            _loop_5(item);
        }
    };
    CSRankings.areas = [];
    CSRankings.regions = ["USA", "europe", "canada", "northamerica", "southamerica", "australasia", "asia", "world"];
    CSRankings.parentMap = { 'aaai': 'ai',
        'ijcai': 'ai',
        'cvpr': 'vision',
        'eccv': 'vision',
        'iccv': 'vision',
        'icml': 'mlmining',
        'kdd': 'mlmining',
        'nips': 'mlmining',
        'acl': 'nlp',
        'emnlp': 'nlp',
        'naacl': 'nlp',
        'sigir': 'ir',
        'www': 'ir',
        'fpga': 'reconfig',
        'fccm': 'reconfig',
        'fpl': 'reconfig',
        'fpt': 'reconfig',
        'asplos': 'arch',
        'isca': 'arch',
        'micro': 'arch',
        'hpca': 'arch',
        'ccs': 'sec',
        'oakland': 'sec',
        'usenixsec': 'sec',
        'ndss': 'sec',
        'pets': 'sec',
        'vldb': 'mod',
        'sigmod': 'mod',
        'icde': 'mod',
        'pods': 'mod',
        'dac': 'da',
        'iccad': 'da',
        'emsoft': 'bed',
        'rtas': 'bed',
        'rtss': 'bed',
        'sc': 'hpc',
        'hpdc': 'hpc',
        'ics': 'hpc',
        'mobicom': 'mobile',
        'mobisys': 'mobile',
        'sensys': 'mobile',
        'imc': 'metrics',
        'sigmetrics': 'metrics',
        'osdi': 'ops',
        'sosp': 'ops',
        'eurosys': 'ops',
        'fast': 'ops',
        'usenixatc': 'ops',
        'popl': 'plan',
        'pldi': 'plan',
        'oopsla': 'plan',
        'icfp': 'plan',
        'fse': 'soft',
        'icse': 'soft',
        'ase': 'soft',
        'issta': 'soft',
        'nsdi': 'comm',
        'sigcomm': 'comm',
        'siggraph': 'graph',
        'siggraph-asia': 'graph',
        'focs': 'act',
        'soda': 'act',
        'stoc': 'act',
        'crypto': 'crypt',
        'eurocrypt': 'crypt',
        'cav': 'log',
        'lics': 'log',
        'ismb': 'bio',
        'recomb': 'bio',
        'ec': 'ecom',
        'wine': 'ecom',
        'chiconf': 'chi',
        'ubicomp': 'chi',
        'uist': 'chi',
        'icra': 'robotics',
        'iros': 'robotics',
        'rss': 'robotics',
        'vis': 'visualization',
        'vr': 'visualization'
    };
    CSRankings.nextTier = {
        'ase': true,
        'issta': true,
        'icde': true,
        'pods': true,
        'hpca': true,
        'ndss': true,
        'pets': true,
        'fast': true,
        'usenixatc': true,
        'icfp': true,
        'oopsla': true
    };
    CSRankings.childMap = {};
    return CSRankings;
}());
var csr = new CSRankings();
