var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/*
  CSRankings - Type Definitions

  All interfaces and type declarations for the CSRankings application.
*/
/// <reference path="../typescript/he/index.d.ts" />
/// <reference path="../typescript/jquery.d.ts" />
/// <reference path="../typescript/vega-embed.d.ts" />
/// <reference path="../typescript/papaparse.d.ts" />
/// <reference path="../typescript/navigo.d.ts" />
/// <reference path="../typescript/continents.d.ts" />
/*
  CSRankings - Configuration

  Static maps, area definitions, and constants.
*/
var CSRankings;
(function (CSRankings) {
    /* Parent-child mapping for conference hierarchy */
    CSRankings.parentMap = {
        'aaai': 'ai',
        'ijcai': 'ai',
        'cvpr': 'vision',
        'eccv': 'vision',
        'iccv': 'vision',
        'icml': 'mlmining',
        'iclr': 'mlmining',
        'kdd': 'mlmining',
        'nips': 'mlmining',
        'acl': 'nlp',
        'emnlp': 'nlp',
        'naacl': 'nlp',
        'sigir': 'inforet',
        'www': 'inforet',
        'asplos': 'arch',
        'isca': 'arch',
        'micro': 'arch',
        'hpca': 'arch', // next tier
        'ccs': 'sec',
        'oakland': 'sec',
        'usenixsec': 'sec',
        'ndss': 'sec', // next tier (for now)
        'pets': 'sec', // next tier
        'vldb': 'mod',
        'sigmod': 'mod',
        'icde': 'mod', // next tier
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
        'eurosys': 'ops', // next tier (see below)
        'fast': 'ops', // next tier
        'usenixatc': 'ops', // next tier
        'popl': 'plan',
        'pldi': 'plan',
        'oopsla': 'plan', // next tier
        'icfp': 'plan', // next tier
        'fse': 'soft',
        'icse': 'soft',
        'ase': 'soft', // next tier
        'issta': 'soft', // next tier
        'nsdi': 'comm',
        'sigcomm': 'comm',
        'siggraph': 'graph',
        'siggraph-asia': 'graph',
        'eurographics': 'graph', // next tier
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
        'vr': 'visualization',
        'sigcse': 'csed'
    };
    /* Next tier conferences (off by default) */
    CSRankings.nextTier = {
        'ase': true,
        'issta': true,
        'icde': true,
        'pods': true,
        'hpca': true,
        'ndss': true, // for now
        'pets': true,
        'eurosys': true,
        'eurographics': true,
        'fast': true,
        'usenixatc': true,
        'icfp': true,
        'oopsla': true,
        'kdd': true,
    };
    /* Child map - built dynamically from parentMap */
    CSRankings.childMap = {};
    /* Parent index for color lookups */
    CSRankings.parentIndex = {};
    /* All regions/countries */
    CSRankings.regions = [
        "europe", "northamerica", "southamerica", "australasia", "asia", "africa", "world",
        "ae", "ar", "at", "au", "bd", "be", "bg", "br", "ca", "ch", "cl", "cn", "co", "cy", "cz",
        "de", "dk", "ee", "eg", "es", "fi", "fr", "gr", "hk", "hu", "ie", "il", "in", "ir", "it",
        "jo", "jp", "kr", "lb", "lk", "lu", "mt", "my", "nl", "no", "nz", "ph", "pk", "pl", "pt",
        "qa", "ro", "ru", "sa", "se", "sg", "th", "tr", "tw", "uk", "us", "vn", "za"
    ];
    /* Note map for special institution URLs */
    CSRankings.noteMap = {
        'Tech': 'https://tech.cornell.edu/',
        'CBG': 'https://www.cis.mpg.de/cbg/',
        'INF': 'https://www.cis.mpg.de/mpi-inf/',
        'IS': 'https://www.cis.mpg.de/is/',
        'MG': 'https://www.cis.mpg.de/molgen/',
        'SP': 'https://www.cis.mpg.de/mpi-for-security-and-privacy/',
        'SWS': 'https://www.cis.mpg.de/mpi-sws/'
    };
    /* Area definitions with titles */
    CSRankings.areaMap = [
        { area: "ai", title: "AI" },
        { area: "aaai", title: "AI" },
        { area: "ijcai", title: "AI" },
        { area: "vision", title: "Vision" },
        { area: "cvpr", title: "Vision" },
        { area: "eccv", title: "Vision" },
        { area: "iccv", title: "Vision" },
        { area: "mlmining", title: "ML" },
        { area: "icml", title: "ML" },
        { area: "kdd", title: "ML" },
        { area: "iclr", title: "ML" },
        { area: "nips", title: "ML" },
        { area: "nlp", title: "NLP" },
        { area: "acl", title: "NLP" },
        { area: "emnlp", title: "NLP" },
        { area: "naacl", title: "NLP" },
        { area: "inforet", title: "Web+IR" },
        { area: "sigir", title: "Web+IR" },
        { area: "www", title: "Web+IR" },
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
        { area: "icde", title: "DB" }, // next tier
        { area: "pods", title: "DB" }, // next tier
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
        { area: "fast", title: "OS" }, // next tier
        { area: "usenixatc", title: "OS" }, // next tier
        { area: "eurosys", title: "OS" },
        { area: "pldi", title: "PL" },
        { area: "popl", title: "PL" },
        { area: "icfp", title: "PL" }, // next tier
        { area: "oopsla", title: "PL" }, // next tier
        { area: "plan", title: "PL" },
        { area: "soft", title: "SE" },
        { area: "fse", title: "SE" },
        { area: "icse", title: "SE" },
        { area: "ase", title: "SE" }, // next tier
        { area: "issta", title: "SE" }, // next tier
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
        { area: "eurographics", title: "Graphics" },
        { area: "chi", title: "HCI" },
        { area: "chiconf", title: "HCI" },
        { area: "ubicomp", title: "HCI" },
        { area: "uist", title: "HCI" },
        { area: "robotics", title: "Robotics" },
        { area: "icra", title: "Robotics" },
        { area: "iros", title: "Robotics" },
        { area: "rss", title: "Robotics" },
        { area: "bio", title: "Comp. Bio" },
        { area: "ismb", title: "Comp. Bio" },
        { area: "recomb", title: "Comp. Bio" },
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
        { area: "wine", title: "ECom" },
        { area: "csed", title: "CSEd" },
        { area: "sigcse", title: "CSEd" }
    ];
    /* Area category arrays */
    CSRankings.aiAreas = ["ai", "vision", "mlmining", "nlp", "inforet"];
    CSRankings.systemsAreas = ["arch", "comm", "sec", "mod", "da", "bed", "hpc", "mobile", "metrics", "ops", "plan", "soft"];
    CSRankings.theoryAreas = ["act", "crypt", "log"];
    CSRankings.interdisciplinaryAreas = ["bio", "graph", "csed", "ecom", "chi", "robotics", "visualization"];
    /* Arrays populated by App constructor */
    CSRankings.areas = [];
    CSRankings.topLevelAreas = {};
    CSRankings.topTierAreas = {};
    /* File paths */
    CSRankings.authorFile = "./csrankings.csv";
    CSRankings.authorinfoFile = "./generated-author-info.csv";
    CSRankings.countryinfoFile = "./institutions.csv";
    CSRankings.countrynamesFile = "./countries.csv";
    CSRankings.turingFile = "./turing.csv";
    CSRankings.acmfellowFile = "./acm-fellows.csv";
    /* Image paths */
    CSRankings.turingImage = "./png/acm-turing-award.png";
    CSRankings.acmfellowImage = "./png/acm.png";
    CSRankings.homepageImage = "./png/house-logo.png";
    /* UI constants */
    CSRankings.RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
    CSRankings.DownTriangle = "&#9660;"; // downward-facing triangle symbol (expanded view)
    CSRankings.BarChartIcon = "<img class='closed_chart_icon chart_icon' alt='closed chart' src='png/barchart.png'>"; // bar chart image
    CSRankings.OpenBarChartIcon = "<img class='open_chart_icon chart_icon' alt='opened chart' src='png/barchart-open.png'>"; // opened bar chart image
    CSRankings.PieChartIcon = "<img class='closed_chart_icon chart_icon' alt='closed chart' src='png/piechart.png'>";
    CSRankings.OpenPieChartIcon = "<img class='open_chart_icon chart_icon' alt='opened chart' src='png/piechart-open.png'>";
    /* Ranking configuration */
    CSRankings.minToRank = 5000; // show all entries (lazy rendering makes this fast)
    /* Name matcher regex for notes in brackets */
    CSRankings.nameMatcher = new RegExp('(.*)\\s+\\[(.*)\\]');
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Utility Functions

  Pure utility functions for data transformation and statistics.
*/
var CSRankings;
(function (CSRankings) {
    /* Sum of array elements */
    function sum(n) {
        let s = 0.0;
        for (let i = 0; i < n.length; i++) {
            s += n[i];
        }
        return s;
    }
    CSRankings.sum = sum;
    /* Average of array elements */
    function average(n) {
        return sum(n) / n.length;
    }
    CSRankings.average = average;
    /* Standard deviation of array elements */
    function stddev(n) {
        const avg = average(n);
        const squareDiffs = n.map(function (value) {
            const diff = value - avg;
            return (diff * diff);
        });
        const sigma = Math.sqrt(sum(squareDiffs) / (n.length - 1));
        return sigma;
    }
    CSRankings.stddev = stddev;
    /* Create the prologue that we preface each generated HTML page with (the results). */
    function makePrologue() {
        const s = '<div class="table-responsive" style="overflow:auto; height:700px;">'
            + '<table class="table table-fit table-sm table-striped"'
            + 'id="ranking" valign="top">';
        return s;
    }
    CSRankings.makePrologue = makePrologue;
    /* Translate a name to DBLP URL format */
    function translateNameToDBLP(name) {
        // Ex: "Emery D. Berger" -> "http://dblp.uni-trier.de/pers/hd/b/Berger:Emery_D="
        // First, replace spaces and non-ASCII characters (not complete).
        name = name.replace(/ Jr\./g, "_Jr.");
        name = name.replace(/ II/g, "_II");
        name = name.replace(/ III/g, "_III");
        name = name.replace(/'|\-|\./g, "=");
        // Now replace diacritics.
        name = he.encode(name, { 'useNamedReferences': true, 'allowUnsafeSymbols': true });
        name = name.replace(/&/g, "=");
        name = name.replace(/;/g, "=");
        let splitName = name.split(" ");
        let lastName = splitName[splitName.length - 1];
        let disambiguation = "";
        if (parseInt(lastName) > 0) {
            // this was a disambiguation entry; go back.
            disambiguation = lastName;
            splitName.pop();
            lastName = splitName[splitName.length - 1] + "_" + disambiguation;
        }
        splitName.pop();
        let newName = splitName.join(" ");
        newName = newName.replace(/\s/g, "_");
        newName = newName.replace(/\-/g, "=");
        newName = encodeURIComponent(newName);
        let str = "https://dblp.org/pers/hd";
        const lastInitial = lastName[0].toLowerCase();
        str += `/${lastInitial}/${lastName}:${newName}`;
        return str;
    }
    CSRankings.translateNameToDBLP = translateNameToDBLP;
    /* Remove disambiguation suffix (4-digit year) from name */
    function removeDisambiguationSuffix(str) {
        // Matches a space followed by a four-digit number at the end of the string
        const regex = /\s\d{4}$/;
        return str.replace(regex, '');
    }
    CSRankings.removeDisambiguationSuffix = removeDisambiguationSuffix;
    /* Compare names by last name for sorting
       from http://hubrik.com/2015/11/16/sort-by-last-name-with-javascript/ */
    function compareNames(a, b) {
        // Split the names as strings into arrays,
        // removing any disambiguation suffixes first.
        const aName = removeDisambiguationSuffix(a).split(" ");
        const bName = removeDisambiguationSuffix(b).split(" ");
        // get the last names by selecting
        // the last element in the name arrays
        // using array.length - 1 since full names
        // may also have a middle name or initial
        const aLastName = aName[aName.length - 1];
        const bLastName = bName[bName.length - 1];
        let returnValue;
        // compare the names and return either
        // a negative number, positive number
        // or zero.
        if (aLastName < bLastName) {
            returnValue = -1;
        }
        else if (aLastName > bLastName) {
            returnValue = 1;
        }
        else {
            returnValue = 0;
        }
        return returnValue;
    }
    CSRankings.compareNames = compareNames;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Data Loading

  Functions for loading CSV data files.
*/
var CSRankings;
(function (CSRankings) {
    /* Load Turing Award winners */
    function loadTuring(turing) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(CSRankings.turingFile, {
                    header: true,
                    download: true,
                    complete: (results) => {
                        resolve(results.data);
                    }
                });
            });
            const d = data;
            for (const turingPair of d) {
                turing[turingPair.name] = turingPair.year;
            }
        });
    }
    CSRankings.loadTuring = loadTuring;
    /* Load ACM Fellows */
    function loadACMFellow(acmfellow) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(CSRankings.acmfellowFile, {
                    header: true,
                    download: true,
                    complete: (results) => {
                        resolve(results.data);
                    }
                });
            });
            const d = data;
            for (const acmfellowPair of d) {
                acmfellow[acmfellowPair.name] = acmfellowPair.year;
            }
        });
    }
    CSRankings.loadACMFellow = loadACMFellow;
    /* Load country/region information for institutions */
    function loadCountryInfo(countryInfo, countryAbbrv) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(CSRankings.countryinfoFile, {
                    header: true,
                    download: true,
                    complete: (results) => {
                        resolve(results.data);
                    }
                });
            });
            const ci = data;
            for (const info of ci) {
                countryInfo[info.institution] = info.region;
                countryAbbrv[info.institution] = info.countryabbrv;
            }
        });
    }
    CSRankings.loadCountryInfo = loadCountryInfo;
    /* Load country name mappings */
    function loadCountryNames(countryNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(CSRankings.countrynamesFile, {
                    header: true,
                    download: true,
                    complete: (results) => {
                        resolve(results.data);
                    }
                });
            });
            const ci = data;
            for (const info of ci) {
                countryNames[info.alpha_2] = info.name;
            }
        });
    }
    CSRankings.loadCountryNames = loadCountryNames;
    /* Load author info (homepages, scholar IDs) */
    function loadAuthorInfo(dblpAuthors, homepages, scholarInfo, note) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(CSRankings.authorFile, {
                    download: true,
                    header: true,
                    complete: (results) => {
                        resolve(results.data);
                    }
                });
            });
            const ai = data;
            for (let counter = 0; counter < ai.length; counter++) {
                const record = ai[counter];
                let name = record['name'].trim();
                const result = name.match(CSRankings.nameMatcher);
                if (result) {
                    name = result[1].trim();
                    note[name] = result[2];
                }
                if (name !== "") {
                    dblpAuthors[name] = CSRankings.translateNameToDBLP(name);
                    homepages[name] = record['homepage'];
                    scholarInfo[name] = record['scholarid'];
                }
            }
        });
    }
    CSRankings.loadAuthorInfo = loadAuthorInfo;
    /* Load publication data (authors) */
    function loadAuthors() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(CSRankings.authorinfoFile, {
                    download: true,
                    header: true,
                    complete: (results) => {
                        resolve(results.data);
                    }
                });
            });
            return data;
        });
    }
    CSRankings.loadAuthors = loadAuthors;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Region Filtering

  Functions for filtering institutions by geographic region.
*/
var CSRankings;
(function (CSRankings) {
    /* Check if an institution is in the selected region */
    function inRegion(dept, selectedRegions, countryInfo, countryAbbrv) {
        switch (selectedRegions) {
            case "northamerica":
                if (countryInfo[dept] != "northamerica") {
                    return false;
                }
                break;
            case "europe":
                if (countryInfo[dept] != "europe") {
                    return false;
                }
                break;
            case "australasia":
                if (countryInfo[dept] != "australasia") {
                    return false;
                }
                break;
            case "southamerica":
                if (countryInfo[dept] != "southamerica") {
                    return false;
                }
                break;
            case "asia":
                if (countryInfo[dept] != "asia") {
                    return false;
                }
                break;
            case "africa":
                if (countryInfo[dept] != "africa") {
                    return false;
                }
                break;
            case "world":
                break;
            default:
                if (countryAbbrv[dept] != selectedRegions) {
                    return false;
                }
                break;
        }
        return true;
    }
    CSRankings.inRegion = inRegion;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Core Computation

  Core ranking algorithms including incremental computation and caching.
*/
var CSRankings;
(function (CSRankings) {
    /* Build the incremental cache - processes all authors once and caches per-area data */
    function buildIncrementalCache(authors, startyear, endyear, selectedRegions, countryInfo, countryAbbrv, cache) {
        if (cache.valid &&
            cache.startyear === startyear &&
            cache.endyear === endyear &&
            cache.regions === selectedRegions) {
            return; // Cache is still valid
        }
        console.log("Building incremental cache...");
        const cacheStart = performance.now();
        // Reset cache
        cache.valid = true;
        cache.startyear = startyear;
        cache.endyear = endyear;
        cache.regions = selectedRegions;
        cache.areaData = {};
        cache.deptNames = {};
        cache.deptCounts = {};
        cache.facultyAreaData = {};
        cache.allFaculty = {};
        // Initialize area data for ALL areas (including children)
        // This is important because weights are checked against child areas
        for (let i = 0; i < CSRankings.areas.length; i++) {
            const area = CSRankings.areas[i];
            cache.areaData[area] = {};
            cache.facultyAreaData[area] = {};
        }
        // Track which faculty we've seen (for building deptNames/deptCounts)
        const visitedForDept = {};
        // Single pass through all authors
        for (const r in authors) {
            if (!authors.hasOwnProperty(r)) {
                continue;
            }
            const auth = authors[r];
            const dept = auth.dept;
            // Filter by region
            if (!CSRankings.inRegion(dept, selectedRegions, countryInfo, countryAbbrv)) {
                continue;
            }
            // Filter by year
            const year = auth.year;
            if ((year < startyear) || (year > endyear)) {
                continue;
            }
            if (typeof dept === 'undefined') {
                continue;
            }
            const name = auth.name;
            const rawArea = auth.area; // Keep the raw area (could be child like 'aaai')
            // For areaDeptAdjustedCount, we need to map to parent area
            let parentArea = rawArea;
            if (rawArea in CSRankings.parentMap) {
                parentArea = CSRankings.parentMap[rawArea];
            }
            // Store data by RAW area (for weight checking)
            // Initialize dept entry for this raw area if needed
            if (!(dept in cache.areaData[rawArea])) {
                cache.areaData[rawArea][dept] = 0;
            }
            // Accumulate adjusted count for this rawArea+dept
            const adjustedCount = parseFloat(auth.adjustedcount);
            cache.areaData[rawArea][dept] += adjustedCount;
            // Track faculty data per RAW area
            if (!(name in cache.facultyAreaData[rawArea])) {
                cache.facultyAreaData[rawArea][name] = { count: 0, adjustedCount: 0 };
            }
            cache.facultyAreaData[rawArea][name].count += parseInt(auth.count);
            cache.facultyAreaData[rawArea][name].adjustedCount += adjustedCount;
            // Track all faculty and their departments
            if (!(name in cache.allFaculty)) {
                cache.allFaculty[name] = { dept: dept };
            }
            // Build deptNames and deptCounts (first time we see each faculty member)
            if (!(name in visitedForDept)) {
                visitedForDept[name] = true;
                if (!(dept in cache.deptNames)) {
                    cache.deptNames[dept] = [];
                    cache.deptCounts[dept] = 0;
                }
                cache.deptNames[dept].push(name);
                cache.deptCounts[dept] += 1;
            }
        }
        const cacheEnd = performance.now();
        console.log(`Incremental cache built in ${(cacheEnd - cacheStart).toFixed(1)}ms`);
    }
    CSRankings.buildIncrementalCache = buildIncrementalCache;
    /* Incremental version of buildDepartments - uses cached data */
    function buildDepartmentsIncremental(cache, weights, deptCounts, deptNames, facultycount, facultyAdjustedCount, areaDeptAdjustedCount) {
        // Build areaDeptAdjustedCount from cached per-area data
        // Iterate through ALL areas (including children) and check weights
        // But accumulate into PARENT area for areaDeptAdjustedCount
        for (let i = 0; i < CSRankings.areas.length; i++) {
            const rawArea = CSRankings.areas[i];
            if (weights[rawArea] === 0) {
                continue;
            }
            // Map to parent area for areaDeptAdjustedCount key
            let parentArea = rawArea;
            if (rawArea in CSRankings.parentMap) {
                parentArea = CSRankings.parentMap[rawArea];
            }
            const areaCache = cache.areaData[rawArea];
            if (!areaCache)
                continue;
            for (const dept in areaCache) {
                const areaDept = parentArea + dept;
                if (!(areaDept in areaDeptAdjustedCount)) {
                    areaDeptAdjustedCount[areaDept] = 0;
                }
                areaDeptAdjustedCount[areaDept] += areaCache[dept];
            }
        }
        // Track which faculty have publications in ANY selected area
        // A faculty member is counted once per department, regardless of how many areas
        const facultySeen = {};
        // Iterate through all areas (checking weights) and find faculty
        for (let i = 0; i < CSRankings.areas.length; i++) {
            const rawArea = CSRankings.areas[i];
            if (weights[rawArea] === 0) {
                continue;
            }
            const facultyArea = cache.facultyAreaData[rawArea];
            if (!facultyArea)
                continue;
            for (const name in facultyArea) {
                if (!(name in facultySeen)) {
                    facultySeen[name] = true;
                    facultycount[name] = 0;
                    facultyAdjustedCount[name] = 0;
                }
                facultycount[name] += facultyArea[name].count;
                facultyAdjustedCount[name] += facultyArea[name].adjustedCount;
            }
        }
        // Build deptNames and deptCounts from faculty we found
        for (const name in facultySeen) {
            const dept = cache.allFaculty[name].dept;
            if (!(dept in deptNames)) {
                deptNames[dept] = [];
                deptCounts[dept] = 0;
            }
            deptNames[dept].push(name);
            deptCounts[dept] += 1;
        }
    }
    CSRankings.buildDepartmentsIncremental = buildDepartmentsIncremental;
    /* Build the dictionary of departments (and count) to be ranked (non-incremental version). */
    function buildDepartments(authors, startyear, endyear, weights, selectedRegions, deptCounts, deptNames, facultycount, facultyAdjustedCount, countryInfo, countryAbbrv, areaDeptAdjustedCount) {
        /* contains an author name if that author has been processed. */
        const visited = {};
        for (const r in authors) {
            if (!authors.hasOwnProperty(r)) {
                continue;
            }
            const auth = authors[r];
            const dept = auth.dept;
            if (!CSRankings.inRegion(dept, selectedRegions, countryInfo, countryAbbrv)) {
                continue;
            }
            let area = auth.area;
            if (weights[area] === 0) {
                continue;
            }
            const year = auth.year;
            if ((year < startyear) || (year > endyear)) {
                continue;
            }
            if (typeof dept === 'undefined') {
                continue;
            }
            const name = auth.name;
            // If this area is a child area, accumulate totals for parent.
            if (area in CSRankings.parentMap) {
                area = CSRankings.parentMap[area];
            }
            const areaDept = area + dept;
            if (!(areaDept in areaDeptAdjustedCount)) {
                areaDeptAdjustedCount[areaDept] = 0;
            }
            const count = parseInt(authors[r].count);
            const adjustedCount = parseFloat(authors[r].adjustedcount);
            areaDeptAdjustedCount[areaDept] += adjustedCount;
            /* Is this the first time we have seen this person? */
            if (!(name in visited)) {
                visited[name] = true;
                facultycount[name] = 0;
                facultyAdjustedCount[name] = 0;
                if (!(dept in deptCounts)) {
                    deptCounts[dept] = 0;
                    deptNames[dept] = [];
                }
                deptNames[dept].push(name);
                deptCounts[dept] += 1;
            }
            facultycount[name] += count;
            facultyAdjustedCount[name] += adjustedCount;
        }
    }
    CSRankings.buildDepartments = buildDepartments;
    /* Compute aggregate statistics. */
    function computeStats(deptNames, numAreas, weights, areaDeptAdjustedCount) {
        const stats = {};
        for (const dept in deptNames) {
            if (!deptNames.hasOwnProperty(dept)) {
                continue;
            }
            stats[dept] = 1;
            for (const area in CSRankings.topLevelAreas) {
                const areaDept = area + dept;
                if (!(areaDept in areaDeptAdjustedCount)) {
                    areaDeptAdjustedCount[areaDept] = 0;
                }
                if (weights[area] != 0) {
                    // Adjusted (smoothed) geometric mean.
                    stats[dept] *= (areaDeptAdjustedCount[areaDept] + 1.0);
                }
            }
            // finally compute geometric mean.
            stats[dept] = Math.pow(stats[dept], 1 / numAreas); // - 1.0;
        }
        return stats;
    }
    CSRankings.computeStats = computeStats;
    /* Count author publications per area for pie charts */
    function countAuthorAreas(authors, areaDict, startyear, endyear) {
        const authorAreas = {};
        // Pre-compute area list once instead of iterating areaDict each time
        const areaList = Object.keys(areaDict);
        const numAuthors = authors.length;
        for (let r = 0; r < numAuthors; r++) {
            const record = authors[r];
            const { area, year } = record;
            if (area in CSRankings.nextTier) {
                continue;
            }
            if ((year < startyear) || (year > endyear)) {
                continue;
            }
            const { name, dept, count } = record;
            const theCount = parseFloat(count);
            // Initialize area counts lazily - only create entry when needed
            if (!(name in authorAreas)) {
                const entry = {};
                for (let i = 0; i < areaList.length; i++) {
                    entry[areaList[i]] = 0;
                }
                authorAreas[name] = entry;
            }
            if (!(dept in authorAreas)) {
                const entry = {};
                for (let i = 0; i < areaList.length; i++) {
                    entry[areaList[i]] = 0;
                }
                authorAreas[dept] = entry;
            }
            authorAreas[name][area] += theCount;
            authorAreas[dept][area] += theCount;
        }
        return authorAreas;
    }
    CSRankings.countAuthorAreas = countAuthorAreas;
    /* Sort universities by aggregate score */
    function sortIndex(univagg) {
        let keys = Object.keys(univagg);
        keys.sort((a, b) => {
            if (univagg[a] != univagg[b]) {
                return univagg[b] - univagg[a];
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
    CSRankings.sortIndex = sortIndex;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Verification Helpers

  Debug helpers for verifying incremental computation correctness.
*/
var CSRankings;
(function (CSRankings) {
    /* Compare two objects for equality (for verification) */
    function deepEqual(obj1, obj2, path = "") {
        if (obj1 === obj2)
            return true;
        if (typeof obj1 !== typeof obj2) {
            console.error(`Type mismatch at ${path}: ${typeof obj1} vs ${typeof obj2}`);
            return false;
        }
        if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
            if (typeof obj1 === 'number' && typeof obj2 === 'number') {
                // Allow small floating point differences
                if (Math.abs(obj1 - obj2) < 0.0001)
                    return true;
            }
            console.error(`Value mismatch at ${path}: ${obj1} vs ${obj2}`);
            return false;
        }
        const keys1 = Object.keys(obj1).sort();
        const keys2 = Object.keys(obj2).sort();
        if (keys1.length !== keys2.length) {
            console.error(`Key count mismatch at ${path}: ${keys1.length} vs ${keys2.length}`);
            console.error(`Keys in obj1 but not obj2: ${keys1.filter(k => keys2.indexOf(k) === -1)}`);
            console.error(`Keys in obj2 but not obj1: ${keys2.filter(k => keys1.indexOf(k) === -1)}`);
            return false;
        }
        for (const key of keys1) {
            if (!deepEqual(obj1[key], obj2[key], `${path}.${key}`)) {
                return false;
            }
        }
        return true;
    }
    CSRankings.deepEqual = deepEqual;
    /* Verify incremental results match full computation */
    function verifyIncrementalResults(fullStats, fullDeptCounts, fullDeptNames, fullFacultycount, fullFacultyAdjustedCount, incrStats, incrDeptCounts, incrDeptNames, incrFacultycount, incrFacultyAdjustedCount) {
        let allMatch = true;
        // Sort deptNames arrays for comparison
        const sortedFullDeptNames = {};
        const sortedIncrDeptNames = {};
        for (const dept in fullDeptNames) {
            sortedFullDeptNames[dept] = [...fullDeptNames[dept]].sort();
        }
        for (const dept in incrDeptNames) {
            sortedIncrDeptNames[dept] = [...incrDeptNames[dept]].sort();
        }
        if (!deepEqual(fullStats, incrStats, "stats")) {
            console.error("VERIFICATION FAILED: stats mismatch");
            allMatch = false;
        }
        if (!deepEqual(fullDeptCounts, incrDeptCounts, "deptCounts")) {
            console.error("VERIFICATION FAILED: deptCounts mismatch");
            allMatch = false;
        }
        if (!deepEqual(sortedFullDeptNames, sortedIncrDeptNames, "deptNames")) {
            console.error("VERIFICATION FAILED: deptNames mismatch");
            allMatch = false;
        }
        if (!deepEqual(fullFacultycount, incrFacultycount, "facultycount")) {
            console.error("VERIFICATION FAILED: facultycount mismatch");
            allMatch = false;
        }
        if (!deepEqual(fullFacultyAdjustedCount, incrFacultyAdjustedCount, "facultyAdjustedCount")) {
            console.error("VERIFICATION FAILED: facultyAdjustedCount mismatch");
            allMatch = false;
        }
        if (allMatch) {
            console.log("✓ Incremental computation verified - matches full computation");
        }
        return allMatch;
    }
    CSRankings.verifyIncrementalResults = verifyIncrementalResults;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - HTML Rendering

  Functions for generating HTML output and Vega charts.
*/
var CSRankings;
(function (CSRankings) {
    /* Build drop down HTML for a single department's faculty */
    function buildFacultyHTML(_dept, names, facultycount, facultyAdjustedCount, homepages, dblpAuthors, note, acmfellow, turing, scholarInfo, areaStringFn, ChartIcon, _subareas) {
        let p = '<div class="table"><table class="table table-sm table-striped"><thead><th></th><td><small><em>'
            + '<abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td>'
            + '<td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">\#&nbsp;Pubs</abbr>'
            + ' </em></small></td><td align="right"><small><em><abbr title="Count divided by number of co-authors">Adj.&nbsp;\#</abbr></em>'
            + '</small></td></thead><tbody>';
        /* Build a dict of just faculty from this department for sorting purposes. */
        let fc = {};
        for (const name of names) {
            fc[name] = facultycount[name];
        }
        let keys = Object.keys(fc);
        keys.sort((a, b) => {
            if (fc[b] === fc[a]) {
                const fb = Math.round(10.0 * facultyAdjustedCount[b]) / 10.0;
                const fa = Math.round(10.0 * facultyAdjustedCount[a]) / 10.0;
                if (fb === fa) {
                    return CSRankings.compareNames(a, b);
                }
                else {
                    return fb - fa;
                }
            }
            else {
                return fc[b] - fc[a];
            }
        });
        for (const name of keys) {
            const homePage = encodeURI(homepages[name]);
            const dblpName = dblpAuthors[name];
            p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
                + `<a title="Click for author\'s home page." target="_blank" href="${homePage}" `
                + `onclick="trackOutboundLink('${homePage}', true); return false;"`
                + `>${name}</a>&nbsp;`;
            if (note.hasOwnProperty(name)) {
                const url = CSRankings.noteMap[note[name]];
                const href = `<a href="${url}">`;
                p += `<span class="note" title="Note">[${href + note[name]}</a>]</span>&nbsp;`;
            }
            if (acmfellow.hasOwnProperty(name)) {
                p += `<span title="ACM Fellow (${acmfellow[name]})"><img alt="ACM Fellow" src="${CSRankings.acmfellowImage}"></span>&nbsp;`;
            }
            if (turing.hasOwnProperty(name)) {
                p += `<span title="Turing Award"><img alt="Turing Award" src="${CSRankings.turingImage}"></span>&nbsp;`;
            }
            const areaStr = areaStringFn(name);
            p += `<span class="areaname">${areaStr.toLowerCase()}</span>&nbsp;`;
            p += `<a title="Click for author\'s home page." target="_blank" href="${homePage}" `
                + `onclick="trackOutboundLink(\'${homePage}\', true); return false;"`
                + '>'
                + `<img alt=\"Home page\" src=\"${CSRankings.homepageImage}\"></a>&nbsp;`;
            if (scholarInfo.hasOwnProperty(name)) {
                if (scholarInfo[name] != "NOSCHOLARPAGE") {
                    const url = `https://scholar.google.com/citations?user=${scholarInfo[name]}&hl=en&oi=ao`;
                    p += `<a title="Click for author\'s Google Scholar page." target="_blank" href="${url}" onclick="trackOutboundLink('${url}', true); return false;">`
                        + '<img alt="Google Scholar" src="scholar-favicon.ico" height="10" width="10"></a>&nbsp;';
                }
            }
            p += `<a title="Click for author\'s DBLP entry." target="_blank" href="${dblpName}" onclick="trackOutboundLink('${dblpName}', true); return false;">`;
            p += '<img alt="DBLP" src="dblp.png">'
                + '</a>';
            p += `<span onclick='csr.toggleChart("${escape(name)}"); ga("send", "event", "chart", "toggle", "toggle ${escape(name)} ${$("#charttype").find(":selected").val()} chart");' title="Click for author's publication profile." class="hovertip" id="${escape(name) + '-chartwidget'}">`;
            p += ChartIcon + "</span>"
                + '</small>'
                + '</td><td align="right"><small>'
                + `<a title="Click for author's DBLP entry." target="_blank" href="${dblpName}" `
                + `onclick="trackOutboundLink('${dblpName}', true); return false;">${fc[name]}</a>`
                + "</small></td>"
                + '<td align="right"><small>'
                + (Math.round(10.0 * facultyAdjustedCount[name]) / 10.0).toFixed(1)
                + "</small></td></tr>"
                + "<tr><td colspan=\"4\">"
                + `<div class="csr-chart" id="${escape(name)}-chart">`
                + '</div>'
                + "</td></tr>";
        }
        p += "</tbody></table></div>";
        return p;
    }
    CSRankings.buildFacultyHTML = buildFacultyHTML;
    /* Build the main output ranking table */
    function buildOutputString(numAreas, countryAbbrv, countryNames, deptCounts, univtext, stats, useDenseRankings, ChartIcon) {
        var _a;
        let s = CSRankings.makePrologue();
        /* Show the top N (with more if tied at the end) */
        s = s + '<thead><tr><th align="left"><font color="#777">#</font></th><th align="left"><font color="#777">Institution</font>'
            + '&nbsp;'.repeat(20) /* Hopefully max length of an institution. */
            + '</th><th align="right">'
            + '<abbr title="Geometric mean count of papers published across all areas."><font color="#777">Count</font>'
            + '</abbr></th><th align="right">&nbsp;<abbr title="Number of faculty who have published in these areas."><font color="#777">Faculty</font>'
            + '</abbr></th></th></tr></thead>';
        s = s + "<tbody>";
        /* As long as there is at least one thing selected, compute and display a ranking. */
        if (numAreas > 0) {
            let ties = 1; /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
            let rank = 0; /* index */
            let oldv = 9999999.999; /* old number - to track ties */
            /* Sort the university aggregate count from largest to smallest. */
            // First, round the stats.
            for (const k in stats) {
                const v = Math.round(10.0 * stats[k]) / 10.0;
                stats[k] = v;
            }
            // Now sort them,
            const keys2 = CSRankings.sortIndex(stats);
            /* Display rankings until we have shown `minToRank` items or
               while there is a tie (those all get the same rank). */
            for (let ind = 0; ind < keys2.length; ind++) {
                const dept = keys2[ind];
                const v = stats[dept];
                if ((ind >= CSRankings.minToRank) && (v != oldv)) {
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
                const esc = escape(dept);
                s += "\n<tr><td>" + rank;
                // Print spaces to hold up to 4 digits of ranked schools.
                s += "&nbsp;".repeat(4 - Math.ceil(Math.log10(rank)));
                s += "</td>";
                s += "<td>"
                    + `<span class="hovertip" onclick="csr.toggleFaculty('${esc}');" id="${esc}-widget">`
                    + CSRankings.RightTriangle
                    + "</span>";
                let abbrv = "us";
                if (dept in countryAbbrv) {
                    abbrv = countryAbbrv[dept];
                }
                const country = (_a = countryNames[abbrv.toUpperCase()]) !== null && _a !== void 0 ? _a : abbrv.toUpperCase();
                s += "&nbsp;" + `<span onclick="csr.toggleFaculty('${esc}');">${dept}</span>`
                    + `&nbsp;<img  title="${country}" src="/flags/${abbrv}.png">&nbsp;`
                    + `<span class="hovertip" onclick='csr.toggleChart("${esc}"); ga("send", "event", "chart", "toggle-department", "toggle ${esc} ${$("#charttype").find(":selected").val()} chart");' id='${esc + "-chartwidget"}'>`
                    + ChartIcon + "</span>";
                s += "</td>";
                s += `<td align="right">${(Math.round(10.0 * v) / 10.0).toFixed(1)}</td>`;
                s += `<td align="right">${deptCounts[dept]}`; /* number of faculty */
                s += "</td>";
                s += "</tr>\n";
                // style="width: 100%; height: 350px;"
                s += `<tr><td colspan="4"><div class="csr-chart" id="${esc}-chart"></div></td></tr>`;
                s += `<tr><td colspan="4"><div style="display:none;" id="${esc}-faculty">${univtext[dept]}</div></td></tr>`;
                ties++;
                oldv = v;
            }
            s += "</tbody>" + "</table>" + "<br />";
            s += "</div>" + "</div>" + "\n";
            s += "<br>" + "</body>" + "</html>";
        }
        else {
            /* Nothing selected. */
            s = "<h3>Please select at least one area by clicking one or more checkboxes.</h3>";
        }
        return s;
    }
    CSRankings.buildOutputString = buildOutputString;
    /* Create a bar or pie chart using Vega. Modified by Minsuk Kahng (https://minsuk.com) */
    function makeChart(name, isPieChart, authorAreas, areaDict) {
        let data = [];
        let datadict = {};
        const keys = CSRankings.topTierAreas;
        const uname = unescape(name);
        // Areas with their category info for color map (from https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=4).
        const chartAreas = [
            ...CSRankings.aiAreas.map(key => ({ key: key, label: areaDict[key], color: "#377eb8" })),
            ...CSRankings.systemsAreas.map(key => ({ key: key, label: areaDict[key], color: "#ff7f00" })),
            ...CSRankings.theoryAreas.map(key => ({ key: key, label: areaDict[key], color: "#4daf4a" })),
            ...CSRankings.interdisciplinaryAreas.map(key => ({ key: key, label: areaDict[key], color: "#984ea3" }))
        ];
        chartAreas.forEach(area => datadict[area.key] = 0);
        for (let key in keys) {
            if (!(uname in authorAreas)) {
                // Defensive programming.
                // This should only happen if we have an error in the aliases file.
                return;
            }
            // Round it to the nearest 0.1.
            const value = Math.round(authorAreas[uname][key] * 10) / 10;
            if (value > 0) {
                if (key in CSRankings.parentMap) {
                    key = CSRankings.parentMap[key];
                }
                datadict[key] += value;
            }
        }
        let valueSum = 0;
        chartAreas.forEach(area => {
            valueSum += datadict[area.key];
        });
        chartAreas.forEach((area, index) => {
            const newSlice = {
                index: index,
                area: areaDict[area.key],
                value: Math.round(datadict[area.key] * 10) / 10,
                ratio: datadict[area.key] / valueSum
            };
            data.push(newSlice);
            area.label = areaDict[area.key];
        });
        const colors = chartAreas.sort((a, b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0)).map(area => area.color);
        const vegaLiteBarChartSpec = {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            data: {
                values: data
            },
            mark: "bar",
            encoding: {
                x: {
                    field: "area",
                    type: "nominal",
                    sort: null,
                    axis: { title: null }
                },
                y: {
                    field: "value",
                    type: "quantitative",
                    axis: { title: null }
                },
                tooltip: [
                    { "field": "area", "type": "nominal", "title": "Area" },
                    { "field": "value", "type": "quantitative", "title": "Count" }
                ],
                color: {
                    field: "area",
                    type: "nominal",
                    scale: { "range": colors },
                    legend: null
                }
            },
            width: 420,
            height: 80,
            padding: { left: 25, top: 3 }
        };
        const vegaLitePieChartSpec = {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            data: {
                values: data
            },
            encoding: {
                theta: {
                    field: "value",
                    type: "quantitative",
                    stack: true
                },
                color: {
                    field: "area",
                    type: "nominal",
                    scale: { "range": colors },
                    legend: null
                },
                order: { field: "index" },
                tooltip: [
                    { field: "area", type: "nominal", title: "Area" },
                    { field: "value", type: "quantitative", title: "Count" },
                    { field: "ratio", type: "quantitative", title: "Ratio", format: ".1%" }
                ]
            },
            layer: [
                {
                    mark: { type: "arc", outerRadius: 90, stroke: "#fdfdfd", strokeWidth: 1 }
                },
                {
                    mark: { type: "text", radius: 108, dy: -3 },
                    encoding: {
                        text: { field: "area", type: "nominal" },
                        color: {
                            condition: { test: "datum.ratio < 0.03", value: "rgba(255, 255, 255, 0)" },
                            field: "area",
                            type: "nominal",
                            scale: { "range": colors }
                        }
                    }
                },
                {
                    mark: { type: "text", radius: 108, fontSize: 9, dy: 7 },
                    encoding: {
                        text: { field: "value", type: "quantitative" },
                        color: {
                            condition: { test: "datum.ratio < 0.03", value: "rgba(255, 255, 255, 0)" },
                            field: "area",
                            type: "nominal",
                            scale: { "range": colors }
                        }
                    }
                }
            ],
            width: 400,
            height: 250,
            padding: { left: 25, top: 3 }
        };
        vegaEmbed(`div[id="${name}-chart"]`, isPieChart ? vegaLitePieChartSpec : vegaLiteBarChartSpec, { actions: false });
    }
    CSRankings.makeChart = makeChart;
})(CSRankings || (CSRankings = {}));
function whichContinent(latitude, longitude) {
    const point = [longitude, latitude];
    for (const cont in continents) {
        if (inPolygon(point, pathToList(continents[cont]))) {
            return cont;
        }
    }
    return "unknown";
}
// Adapted from https://stackoverflow.com/questions/13905646/get-the-continent-given-the-latitude-and-longitude
// Rough shape of continents.
const continents = {
    "northamerica": { latitude: [90, 90, 78.13, 57.5, 15, 15, 1.25, 1.25, 51, 60, 60, 51, 51, 60], longitude: [-168.75, -10, -10, -37.5, -30, -75, -82.5, -105, -180, -180, -168.75, 166.6, 180, 180] },
    "asia": { latitude: [90, 42.5, 42.5, 40.79, 41, 40.55, 40.4, 40.05, 39.17, 35.46, 33, 31.74, 29.54, 27.78, 11.3, 12.5, -60, -60, -31.88, -11.88, -10.27, 33.13, 51, 60, 90, 90, 90, 60, 60], longitude: [77.5, 48.8, 30, 28.81, 29, 27.31, 26.75, 26.36, 25.19, 27.91, 27.5, 34.58, 34.92, 34.46, 44.3, 52, 75, 110, 110, 110, 140, 140, 166.6, 180, 180, -180, -168.75, -168.75, -180] },
    "europe": { latitude: [90, 90, 42.5, 42.5, 40.79, 41, 40.55, 40.40, 40.05, 39.17, 35.46, 33, 38, 35.42, 28.25, 15, 57.5, 78.13], longitude: [-10, 77.5, 48.8, 30, 28.81, 29, 27.31, 26.75, 26.36, 25.19, 27.91, 27.5, 10, -10, -13, -30, -37.5, -10] },
    "australia": { latitude: [-11.88, -10.27, -10, -30, -52.5, -31.88], longitude: [110, 140, 145, 161.25, 142.5, 110] },
    "southamerica": { latitude: [1.25, 1.25, 15, 15, -60, -60], longitude: [-105, -82.5, -75, -30, -30, -105] },
    "africa": { latitude: [15, 28.25, 35.42, 38, 33, 31.74, 29.54, 27.78, 11.3, 12.5, -60, -60], longitude: [-30, -13, -10, 10, 27.5, 34.58, 34.92, 34.46, 44.3, 52, 75, -30] },
    //    "asia2" : { latitude: [90, 90, 60, 60], longitude: [-180, -168.75, -168.75, -180] },
    //    "northAmerica2" : { latitude: [51, 51, 60], longitude: [166.6, 180, 180] },
    "antarctica": { latitude: [-60, -60, -90, -90], longitude: [-180, 180, 180, -180] }
};
function inPolygon(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect)
            inside = !inside;
    }
    return inside;
}
function pathToList(path) {
    let l = [];
    for (let i = 0; i < path["longitude"].length; i++) {
        l.push([path["longitude"][i], path["latitude"][i]]);
    }
    return l;
}
/*
  CSRankings - Checkbox State Management

  Functions for managing checkbox state, weights, and field activation.
*/
var CSRankings;
(function (CSRankings) {
    /* Refresh checkbox cache by reading all checkbox states */
    function refreshCheckboxCache(fields, cache) {
        for (let ind = 0; ind < CSRankings.areas.length; ind++) {
            const area = CSRankings.areas[ind];
            const element = document.getElementById(fields[ind]);
            cache[area] = element ? element.checked : false;
        }
    }
    CSRankings.refreshCheckboxCache = refreshCheckboxCache;
    /* Get checkbox state, refreshing cache if needed */
    function getCheckboxStateFromCache(area, cache, cacheValid, _fields, refreshCache) {
        if (!cacheValid) {
            refreshCache();
        }
        return cache[area] || false;
    }
    CSRankings.getCheckboxStateFromCache = getCheckboxStateFromCache;
    /* Update weights from checkbox states, returns number of areas selected */
    function updateWeightsFromCache(weights, cache) {
        let numAreas = 0;
        for (let ind = 0; ind < CSRankings.areas.length; ind++) {
            const area = CSRankings.areas[ind];
            weights[area] = cache[area] ? 1 : 0;
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
    }
    CSRankings.updateWeightsFromCache = updateWeightsFromCache;
    /* Set all checkboxes on or off without triggering ranking */
    function setAllCheckboxes(fields, value, invalidateCache) {
        for (let i = 0; i < CSRankings.areas.length; i++) {
            const item = fields[i];
            const element = document.getElementById(item);
            if (!element)
                continue;
            if (value) {
                // Turn off all next tier venues.
                if (item in CSRankings.nextTier) {
                    element.checked = false;
                }
                else {
                    element.checked = true;
                    element.disabled = false;
                }
            }
            else {
                // turn everything off.
                element.checked = false;
                element.disabled = false;
            }
        }
        invalidateCache();
    }
    CSRankings.setAllCheckboxes = setAllCheckboxes;
    /* Activate or deactivate a set of fields */
    function activateFieldSet(value, fieldIndices, fields, invalidateCache, rankCallback) {
        for (let i = 0; i < fieldIndices.length; i++) {
            const item = fields[fieldIndices[i]];
            const element = document.getElementById(item);
            if (element) {
                element.checked = value;
                if (item in CSRankings.childMap) {
                    // It's a parent.
                    element.disabled = false;
                    // Activate / deactivate all children as appropriate.
                    CSRankings.childMap[item].forEach((k) => {
                        const childElement = document.getElementById(k);
                        if (childElement) {
                            if (k in CSRankings.nextTier) {
                                childElement.checked = false;
                            }
                            else {
                                childElement.checked = value;
                            }
                        }
                    });
                }
            }
        }
        invalidateCache();
        rankCallback();
        return false;
    }
    CSRankings.activateFieldSet = activateFieldSet;
    /* Handle parent checkbox click - propagates to children */
    function handleParentCheckboxClick(field, fieldElement, _invalidateCache) {
        const val = fieldElement.checked;
        if (field in CSRankings.childMap) {
            for (const child of CSRankings.childMap[field]) {
                const childElement = document.getElementById(child);
                if (childElement) {
                    if (!(child in CSRankings.nextTier)) {
                        childElement.checked = val;
                    }
                    else {
                        // Always deactivate next tier conferences.
                        childElement.checked = false;
                    }
                }
            }
        }
    }
    CSRankings.handleParentCheckboxClick = handleParentCheckboxClick;
    /* Handle child checkbox click - updates parent state */
    function handleChildCheckboxClick(field, _invalidateCache) {
        // Child: If any child is on, activate the parent.
        // If all are off, deactivate parent.
        const parent = CSRankings.parentMap[field];
        const parentElement = document.getElementById(parent);
        let anyChecked = 0;
        let allChecked = 1;
        CSRankings.childMap[parent].forEach((k) => {
            const childElement = document.getElementById(k);
            const val = childElement ? (childElement.checked ? 1 : 0) : 0;
            anyChecked |= val;
            // allChecked means all top tier conferences
            // are on and all next tier conferences are
            // off.
            if (!(k in CSRankings.nextTier)) {
                // All need to be on.
                allChecked &= val;
            }
            else {
                // All need to be off.
                allChecked &= val ? 0 : 1;
            }
        });
        // Activate parent if any checked.
        if (parentElement) {
            parentElement.checked = anyChecked ? true : false;
            // Mark the parent as disabled unless all are checked.
            if (!anyChecked || allChecked) {
                parentElement.disabled = false;
            }
            if (anyChecked && !allChecked) {
                parentElement.disabled = true;
            }
        }
        // Return false to indicate URL should not be updated (child click)
        return false;
    }
    CSRankings.handleChildCheckboxClick = handleChildCheckboxClick;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Navigation and URL Handling

  URL construction, navigation routing, and geolocation handling.
*/
var CSRankings;
(function (CSRankings) {
    /* Build the URL string based on current checkbox selections */
    function buildURLString(fields, getCheckboxState) {
        let s = '';
        let count = 0;
        let totalParents = 0;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (!(field in CSRankings.parentMap)) {
                totalParents += 1;
            }
            if (getCheckboxState(field)) {
                // Only add parents.
                if (!(field in CSRankings.parentMap)) {
                    // And only add if every top tier child is checked
                    // and only if every next tier child is NOT
                    // checked.
                    let allChecked = 1;
                    if (field in CSRankings.childMap) {
                        CSRankings.childMap[field].forEach((k) => {
                            const val = getCheckboxState(k) ? 1 : 0;
                            if (!(k in CSRankings.nextTier)) {
                                allChecked &= val;
                            }
                            else {
                                allChecked &= val ? 0 : 1;
                            }
                        });
                    }
                    if (allChecked) {
                        s += `${field}&`;
                        count += 1;
                    }
                }
            }
        }
        if (count > 0) {
            // Trim off the trailing '&'.
            s = s.slice(0, -1);
        }
        return { s, count, totalParents };
    }
    CSRankings.buildURLString = buildURLString;
    /* Build full URL with year, region, and chart type parameters */
    function buildFullURL(fields, getCheckboxState, _usePieChart) {
        const { s, count, totalParents } = buildURLString(fields, getCheckboxState);
        const region = $("#regions").find(":selected").val();
        let start = '';
        // Check the dates.
        const d = new Date();
        const currYear = d.getFullYear();
        const startyear = parseInt($("#fromyear").find(":selected").text());
        const endyear = parseInt($("#toyear").find(":selected").text());
        if ((startyear != currYear - 10) || (endyear != currYear)) {
            start += `/fromyear/${startyear.toString()}`;
            start += `/toyear/${endyear.toString()}`;
        }
        if (count == totalParents) {
            start += '/index?all'; // Distinguished special URL - default = all selected.
        }
        else if (count == 0) {
            start += '/index?none'; // Distinguished special URL - none selected.
        }
        else {
            start += `/index?${s}`;
        }
        if (region != "USA") {
            start += `&${region}`;
        }
        let newUsePieChart = _usePieChart;
        let ChartIcon = CSRankings.BarChartIcon;
        let OpenChartIcon = CSRankings.OpenBarChartIcon;
        const chartType = $("#charttype").find(":selected").val();
        if (chartType == "pie") {
            newUsePieChart = true;
            for (const elt of document.getElementsByClassName("chart_icon")) {
                elt.src = "png/piechart.png";
            }
            for (const elt of document.getElementsByClassName("open_chart_icon")) {
                elt.src = "png/piechart-open.png";
            }
            for (const elt of document.getElementsByClassName("closed_chart_icon")) {
                elt.src = "png/piechart.png";
            }
            ChartIcon = CSRankings.PieChartIcon;
            OpenChartIcon = CSRankings.OpenPieChartIcon;
            start += '&pie';
        }
        else {
            newUsePieChart = false;
            for (const elt of document.getElementsByClassName("chart_icon")) {
                elt.src = "png/barchart.png";
            }
            for (const elt of document.getElementsByClassName("open_chart_icon")) {
                elt.src = "png/barchart-open.png";
            }
            for (const elt of document.getElementsByClassName("closed_chart_icon")) {
                elt.src = "png/barchart.png";
            }
        }
        return { url: start, usePieChart: newUsePieChart, ChartIcon, OpenChartIcon };
    }
    CSRankings.buildFullURL = buildFullURL;
    /* Handle navigation from URL query parameters */
    function handleNavigation(params, query, invalidateCheckboxCache) {
        if (params !== null) {
            // Set params (fromyear and toyear).
            Object.keys(params).forEach((key) => {
                $(`#${key}`).prop('value', params[key].toString());
            });
        }
        // Clear everything *unless* there are subsets / below-the-fold selected.
        clearNonSubsetted(invalidateCheckboxCache);
        // Now check everything listed in the query string.
        let q = query.split('&');
        // If there is an 'all' in the query string, set everything to true.
        const foundAll = q.some((elem) => {
            return (elem == "all");
        });
        // For testing: if 'survey' is in the query string, reveal the survey overlay.
        const foundSurvey = q.some((elem) => {
            return (elem == "survey");
        });
        if (foundSurvey) {
            document.getElementById("overlay-survey").style.display = "block";
        }
        const foundNone = q.some((elem) => {
            return (elem == "none");
        });
        // Check for regions and strip them out.
        const foundRegion = q.some((elem) => {
            return CSRankings.regions.indexOf(elem) >= 0;
        });
        if (foundRegion) {
            let index = 0;
            q.forEach((elem) => {
                // Splice it out.
                if (CSRankings.regions.indexOf(elem) >= 0) {
                    q.splice(index, 1);
                    // Set the region.
                    $("#regions").val(elem);
                }
                index += 1;
            });
        }
        // Check for pie chart
        const foundPie = q.some((elem) => {
            return (elem == "pie");
        });
        if (foundPie) {
            $("#charttype").val("pie");
        }
        if (foundAll) {
            // Set everything.
            for (const item in CSRankings.topTierAreas) {
                const element = document.getElementById(item);
                if (element) {
                    element.checked = true;
                    if (item in CSRankings.childMap) {
                        // It's a parent. Enable it.
                        element.disabled = false;
                        // and activate all children.
                        CSRankings.childMap[item].forEach((k) => {
                            if (!(k in CSRankings.nextTier)) {
                                const childElement = document.getElementById(k);
                                if (childElement) {
                                    childElement.checked = true;
                                }
                            }
                        });
                    }
                }
            }
            // And we're out.
            invalidateCheckboxCache();
            return;
        }
        if (foundNone) {
            // Clear everything and return.
            clearNonSubsetted(invalidateCheckboxCache);
            return;
        }
        // Just a list of areas.
        // First, clear everything that isn't subsetted.
        clearNonSubsetted(invalidateCheckboxCache);
        // Then, activate the areas in the query.
        for (const item of q) {
            if ((item != "none") && (item != "")) {
                const element = document.getElementById(item);
                if (element) {
                    element.checked = true;
                    element.disabled = false;
                    if (item in CSRankings.childMap) {
                        // Activate all children.
                        CSRankings.childMap[item].forEach((k) => {
                            if (!(k in CSRankings.nextTier)) {
                                const childElement = document.getElementById(k);
                                if (childElement) {
                                    childElement.checked = true;
                                }
                            }
                        });
                    }
                }
            }
        }
        invalidateCheckboxCache();
    }
    CSRankings.handleNavigation = handleNavigation;
    /* Clear all checkboxes that are not subsetted */
    function clearNonSubsetted(invalidateCheckboxCache) {
        for (const item of CSRankings.areas) {
            if (item in CSRankings.childMap) {
                const kids = CSRankings.childMap[item];
                if (!subsetting(kids)) {
                    const element = document.getElementById(item);
                    if (element) {
                        element.checked = false;
                        element.disabled = false;
                    }
                    kids.forEach((kid) => {
                        const kidElement = document.getElementById(kid);
                        if (kidElement) {
                            kidElement.checked = false;
                        }
                    });
                }
            }
        }
        // Invalidate the checkbox cache since we modified checkboxes
        invalidateCheckboxCache();
    }
    CSRankings.clearNonSubsetted = clearNonSubsetted;
    /* Check if siblings are subsetted (some but not all selected) */
    function subsetting(sibs) {
        // Separate the siblings into above and below the fold.
        let aboveFold = [];
        let belowFold = [];
        sibs.forEach((elem) => {
            if (elem in CSRankings.nextTier) {
                belowFold.push(elem);
            }
            else {
                aboveFold.push(elem);
            }
        });
        // Count how many are checked above and below.
        let numCheckedAbove = 0;
        aboveFold.forEach((elem) => {
            const element = document.getElementById(elem);
            if (element && element.checked) {
                numCheckedAbove++;
            }
        });
        let numCheckedBelow = 0;
        belowFold.forEach((elem) => {
            const element = document.getElementById(elem);
            if (element && element.checked) {
                numCheckedBelow++;
            }
        });
        const subsettedAbove = ((numCheckedAbove > 0) && (numCheckedAbove < aboveFold.length));
        const subsettedBelow = ((numCheckedBelow > 0) && (belowFold.length != 0));
        return subsettedAbove || subsettedBelow;
    }
    CSRankings.subsetting = subsetting;
    /* Check geolocation and set region accordingly */
    function geoCheck(rankCallback) {
        var _a;
        (_a = navigator.geolocation) === null || _a === void 0 ? void 0 : _a.getCurrentPosition((position) => {
            const continent = whichContinent(position.coords.latitude, position.coords.longitude);
            let regionsEl = document.getElementById("regions");
            switch (continent) {
                case "northamerica":
                    return;
                case "europe":
                case "asia":
                case "southamerica":
                case "africa":
                    regionsEl.value = continent;
                    break;
                default:
                    regionsEl.value = "world";
                    break;
            }
            rankCallback();
        });
    }
    CSRankings.geoCheck = geoCheck;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Survey Module

  Handles display of user surveys with configurable frequency.
*/
var CSRankings;
(function (CSRankings) {
    const DEFAULT_SURVEY_CONFIG = {
        frequency: 1000000, // One out of this many users gets the survey (on average)
        overlayId: 'overlay-survey',
        storageKey: 'surveyDisplayed',
        cookieKey: 'surveyDisplayed',
        disabled: true // Currently disabled
    };
    /**
     * Check if survey has already been shown to this user.
     * Checks both localStorage and cookies for backwards compatibility.
     */
    function hasBeenShown(config) {
        // Check localStorage
        if (localStorage.getItem(config.storageKey)) {
            return true;
        }
        // Check cookie for backwards compatibility
        if (config.cookieKey) {
            const cookieMatch = document.cookie
                .split('; ')
                .find(row => row.startsWith(config.cookieKey + '='));
            if (cookieMatch) {
                return true;
            }
        }
        return false;
    }
    /**
     * Mark the survey as shown in localStorage.
     */
    function markAsShown(config) {
        localStorage.setItem(config.storageKey, 'true');
    }
    /**
     * Show the survey overlay.
     */
    function showOverlay(config) {
        const overlay = document.getElementById(config.overlayId);
        if (overlay) {
            overlay.style.display = 'block';
        }
    }
    /**
     * Attempt to display the survey to the user.
     * Returns true if the survey was displayed, false otherwise.
     */
    function tryDisplaySurvey(config = {}) {
        const fullConfig = Object.assign(Object.assign({}, DEFAULT_SURVEY_CONFIG), config);
        // Check if disabled
        if (fullConfig.disabled) {
            return false;
        }
        // Check if already shown
        if (hasBeenShown(fullConfig)) {
            return false;
        }
        // Random chance to show
        const randomValue = Math.floor(Math.random() * fullConfig.frequency);
        if (randomValue !== 0) {
            return false;
        }
        // Show the survey
        markAsShown(fullConfig);
        showOverlay(fullConfig);
        return true;
    }
    CSRankings.tryDisplaySurvey = tryDisplaySurvey;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Sponsorship Module

  Handles display of sponsorship requests with usage-based triggering.
  Tracks user visits and interactions over time to show sponsorship
  requests to engaged users (similar to Wikipedia's approach).
*/
var CSRankings;
(function (CSRankings) {
    const DEFAULT_SPONSORSHIP_CONFIG = {
        minVisits: 3, // Show after at least 3 visits
        minInteractions: 10, // And at least 10 interactions
        randomChance: 3, // 1 in 3 chance once thresholds met
        overlayId: 'overlay-sponsor',
        storageKey: 'csrankings-usage'
    };
    const DEFAULT_USAGE_STATS = {
        visitCount: 0,
        firstVisit: 0,
        lastVisit: 0,
        interactionCount: 0,
        sponsorshipShown: false
    };
    /**
     * Load usage stats from localStorage.
     */
    function loadUsageStats(storageKey) {
        const stored = localStorage.getItem(storageKey);
        if (!stored) {
            return Object.assign({}, DEFAULT_USAGE_STATS);
        }
        try {
            const parsed = JSON.parse(stored);
            return Object.assign(Object.assign({}, DEFAULT_USAGE_STATS), parsed);
        }
        catch (_a) {
            return Object.assign({}, DEFAULT_USAGE_STATS);
        }
    }
    /**
     * Save usage stats to localStorage.
     */
    function saveUsageStats(storageKey, stats) {
        localStorage.setItem(storageKey, JSON.stringify(stats));
    }
    /**
     * Show the sponsorship overlay.
     */
    function showOverlay(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.style.display = 'block';
        }
    }
    /**
     * UsageTracker class to manage usage statistics and sponsorship display.
     * Use the singleton instance via UsageTracker.getInstance().
     */
    class UsageTracker {
        constructor(config = {}) {
            this.config = Object.assign(Object.assign({}, DEFAULT_SPONSORSHIP_CONFIG), config);
            this.stats = loadUsageStats(this.config.storageKey);
        }
        /**
         * Get or create the singleton UsageTracker instance.
         */
        static getInstance(config) {
            if (!UsageTracker.instance) {
                UsageTracker.instance = new UsageTracker(config);
            }
            return UsageTracker.instance;
        }
        /**
         * Record a new visit/session.
         * Should be called once when the page loads.
         */
        recordVisit() {
            const now = Date.now();
            this.stats.visitCount += 1;
            if (this.stats.firstVisit === 0) {
                this.stats.firstVisit = now;
            }
            this.stats.lastVisit = now;
            this.save();
            console.log(`CSRankings usage: Visit #${this.stats.visitCount}`);
        }
        /**
         * Record a user interaction (checkbox click, filter change, etc.).
         * Call this when the user interacts with the rankings.
         */
        recordInteraction() {
            this.stats.interactionCount += 1;
            this.save();
        }
        /**
         * Get current usage statistics.
         */
        getStats() {
            return Object.assign({}, this.stats);
        }
        /**
         * Get a human-readable summary of usage.
         */
        getUsageSummary() {
            const visits = this.stats.visitCount;
            const firstVisit = this.stats.firstVisit
                ? new Date(this.stats.firstVisit).toLocaleDateString()
                : 'never';
            return `You've visited CSRankings ${visits} time${visits !== 1 ? 's' : ''} ` +
                `since ${firstVisit}.`;
        }
        /**
         * Check if sponsorship thresholds have been met.
         */
        meetsThresholds() {
            return this.stats.visitCount >= this.config.minVisits &&
                this.stats.interactionCount >= this.config.minInteractions;
        }
        /**
         * Attempt to display the sponsorship request.
         * Returns true if displayed, false otherwise.
         *
         * @param skipIfSurveyShown - If true, won't show if survey was just displayed
         */
        tryDisplaySponsorship(skipIfSurveyShown = false) {
            // Already shown this session via localStorage flag
            if (this.stats.sponsorshipShown) {
                return false;
            }
            // Skip if survey was just shown
            if (skipIfSurveyShown) {
                return false;
            }
            // Check if usage thresholds are met
            if (!this.meetsThresholds()) {
                console.log(`CSRankings: Sponsorship thresholds not met. ` +
                    `Visits: ${this.stats.visitCount}/${this.config.minVisits}, ` +
                    `Interactions: ${this.stats.interactionCount}/${this.config.minInteractions}`);
                return false;
            }
            // Random chance
            const randomValue = Math.floor(Math.random() * this.config.randomChance);
            if (randomValue !== 0) {
                return false;
            }
            // Show sponsorship
            this.stats.sponsorshipShown = true;
            this.save();
            showOverlay(this.config.overlayId);
            console.log(`CSRankings: Showing sponsorship request. ${this.getUsageSummary()}`);
            return true;
        }
        /**
         * Reset the sponsorship shown flag (e.g., for a new session/year).
         * This allows the sponsorship to be shown again.
         */
        resetSponsorshipShown() {
            this.stats.sponsorshipShown = false;
            this.save();
        }
        /**
         * Save current stats to localStorage.
         */
        save() {
            saveUsageStats(this.config.storageKey, this.stats);
        }
        /**
         * Clear all usage data (for testing/debugging).
         */
        clearUsageData() {
            this.stats = Object.assign({}, DEFAULT_USAGE_STATS);
            localStorage.removeItem(this.config.storageKey);
            console.log('CSRankings: Usage data cleared.');
        }
    }
    UsageTracker.instance = null;
    CSRankings.UsageTracker = UsageTracker;
    // Convenience functions for common operations
    /**
     * Record a visit and attempt to display sponsorship.
     * Call this once when the app initializes.
     *
     * @param surveyWasShown - Whether a survey was just displayed
     * @returns true if sponsorship was displayed
     */
    function initSponsorshipTracking(surveyWasShown = false) {
        const tracker = UsageTracker.getInstance();
        tracker.recordVisit();
        return tracker.tryDisplaySponsorship(surveyWasShown);
    }
    CSRankings.initSponsorshipTracking = initSponsorshipTracking;
    /**
     * Record a user interaction.
     * Call this when user clicks checkboxes, changes filters, etc.
     */
    function recordUserInteraction() {
        UsageTracker.getInstance().recordInteraction();
    }
    CSRankings.recordUserInteraction = recordUserInteraction;
    /**
     * Get usage statistics summary.
     */
    function getUsageSummary() {
        return UsageTracker.getInstance().getUsageSummary();
    }
    CSRankings.getUsageSummary = getUsageSummary;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Event Handlers

  DOM event listener setup for dropdowns, checkboxes, and buttons.
*/
var CSRankings;
(function (CSRankings) {
    /* Add event listeners for dropdown changes */
    function addDropdownListeners(callbacks) {
        ["toyear", "fromyear", "regions"].forEach((key) => {
            const widget = document.getElementById(key);
            widget.addEventListener("change", () => {
                // Year/region change invalidates the incremental cache
                callbacks.invalidateIncrementalCache();
                callbacks.recomputeAuthorAreas();
                callbacks.rank();
                // Track user interaction for sponsorship
                CSRankings.recordUserInteraction();
            });
        });
        // Chart type doesn't affect data, just visualization
        const charttypeWidget = document.getElementById("charttype");
        charttypeWidget.addEventListener("change", () => { callbacks.rank(); });
    }
    CSRankings.addDropdownListeners = addDropdownListeners;
    /* Add event listeners for area widget toggles (conference expansion) */
    function addAreaWidgetListeners(callbacks) {
        for (let position = 0; position < CSRankings.areas.length; position++) {
            let area = CSRankings.areas[position];
            if (!(area in CSRankings.parentMap)) {
                // Not a child.
                const widget = document.getElementById(`${area}-widget`);
                if (widget) {
                    widget.addEventListener("click", () => {
                        callbacks.toggleConferences(area);
                    });
                }
            }
        }
    }
    CSRankings.addAreaWidgetListeners = addAreaWidgetListeners;
    /* Add event listeners for area checkboxes */
    function addCheckboxListeners(fields, callbacks) {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const fieldElement = document.getElementById(field);
            if (!fieldElement) {
                continue;
            }
            fieldElement.addEventListener("click", () => {
                // Invalidate cache since a checkbox changed
                callbacks.invalidateCheckboxCache();
                let updateURL = true;
                if (field in CSRankings.parentMap) {
                    // Child checkbox - handle parent state update
                    updateURL = CSRankings.handleChildCheckboxClick(field, callbacks.invalidateCheckboxCache);
                }
                else {
                    // Parent checkbox - propagate to children
                    CSRankings.handleParentCheckboxClick(field, fieldElement, callbacks.invalidateCheckboxCache);
                }
                callbacks.rank(updateURL);
                // Track user interaction for sponsorship
                CSRankings.recordUserInteraction();
            });
        }
    }
    CSRankings.addCheckboxListeners = addCheckboxListeners;
    /* Add event listeners for group selector buttons */
    function addGroupSelectorListeners(callbacks) {
        const listeners = {
            'all_areas_on': (() => { callbacks.activateAll(); }),
            'all_areas_off': (() => { callbacks.activateNone(); }),
            'ai_areas_on': (() => { callbacks.activateAI(); }),
            'ai_areas_off': (() => { callbacks.deactivateAI(); }),
            'systems_areas_on': (() => { callbacks.activateSystems(); }),
            'systems_areas_off': (() => { callbacks.deactivateSystems(); }),
            'theory_areas_on': (() => { callbacks.activateTheory(); }),
            'theory_areas_off': (() => { callbacks.deactivateTheory(); }),
            'other_areas_on': (() => { callbacks.activateOthers(); }),
            'other_areas_off': (() => { callbacks.deactivateOthers(); })
        };
        for (const item in listeners) {
            const widget = document.getElementById(item);
            widget.addEventListener("click", () => {
                listeners[item]();
                // Track user interaction for sponsorship
                CSRankings.recordUserInteraction();
            });
        }
    }
    CSRankings.addGroupSelectorListeners = addGroupSelectorListeners;
    /* Add all event listeners */
    function addAllListeners(fields, callbacks) {
        addDropdownListeners(callbacks);
        addAreaWidgetListeners(callbacks);
        addCheckboxListeners(fields, callbacks);
        addGroupSelectorListeners(callbacks);
    }
    CSRankings.addAllListeners = addAllListeners;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Main Application

  The main App class that orchestrates the ranking system.
*/
var CSRankings;
(function (CSRankings) {
    class App {
        // Return the singleton corresponding to this object.
        static getInstance() {
            return App.theInstance;
        }
        // Promises polyfill.
        static promise(cont) {
            if (typeof Promise !== "undefined") {
                var resolved = Promise.resolve();
                resolved.then(cont);
            }
            else {
                setTimeout(cont, 0);
            }
        }
        constructor() {
            this.note = {};
            this.allowRankingChange = false; /* Can we change the kind of rankings being used? */
            /* Map names to Google Scholar IDs. */
            this.scholarInfo = {};
            /* Map aliases to canonical author name. */
            this.aliases = {};
            /* Map Turing award winners to year */
            this.turing = {};
            /* Map ACM Fellow award winners to year */
            this.acmfellow = {};
            /* Map institution to region. */
            this.countryInfo = {};
            /* Map country codes (abbreviations) to names. */
            this.countryNames = {};
            /* Map institution to (non-US) abbreviation. */
            this.countryAbbrv = {};
            /* Map name to home page. */
            this.homepages = {};
            /* Set to true for "dense rankings" vs. "competition rankings". */
            this.useDenseRankings = false;
            /* The data which will hold the parsed CSV of author info. */
            this.authors = [];
            /* The DBLP-transformed strings per author. */
            this.dblpAuthors = {};
            /* Map authors to the areas they have published in (for pie chart display). */
            this.authorAreas = {};
            /* Computed stats (univagg). */
            this.stats = {};
            this.areaDeptAdjustedCount = {}; /* area+dept */
            this.areaStringMap = {}; // name -> areaString (memoized)
            this.usePieChart = false;
            /* Cached checkbox states to avoid repeated DOM queries */
            this.checkboxCache = {};
            this.checkboxCacheValid = false;
            /* Debounce timer for rank() calls */
            this.rankDebounceTimer = null;
            this.RANK_DEBOUNCE_MS = 16; // ~1 frame
            /* === INCREMENTAL UPDATE CACHING === */
            this.incrementalCache = {
                valid: false,
                startyear: 0,
                endyear: 0,
                regions: '',
                areaData: {},
                deptNames: {},
                deptCounts: {},
                facultyAreaData: {},
                allFaculty: {}
            };
            /* Enable/disable verification mode to compare incremental vs full computation */
            /* Can be toggled from console: csr.setVerifyIncremental(true) */
            this.verifyIncremental = false;
            /* === RENDERING OPTIMIZATION CACHING === */
            /* Cache for faculty dropdown HTML - only changes when year/region changes */
            this.facultyDropdownCache = {
                valid: false,
                startyear: 0,
                endyear: 0,
                regions: '',
                html: {}
            };
            /* Current chart icons */
            this.ChartIcon = CSRankings.BarChartIcon;
            this.OpenChartIcon = CSRankings.OpenBarChartIcon;
            /* Instance lookup tables (populated in constructor) */
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
            /* Map subareas to their areas. */
            this.subareas = {};
            /* Data for lazy rendering of faculty dropdowns */
            this.lazyRenderData = null;
            App.theInstance = this;
            this.navigoRouter = new Navigo(null, true);
            /* Build dictionaries:
               areaDict: areas -> names used in pie charts
               areaPosition: areas -> position in area array
               subareas: subareas -> areas (e.g., "Vision" -> "ai")
            */
            for (let position = 0; position < CSRankings.areaMap.length; position++) {
                const { area, title } = CSRankings.areaMap[position];
                CSRankings.areas[position] = area;
                if (!(area in CSRankings.parentMap)) {
                    CSRankings.topLevelAreas[area] = area;
                }
                if (!(area in CSRankings.nextTier)) {
                    CSRankings.topTierAreas[area] = area;
                }
                this.areaNames[position] = title;
                this.fields[position] = area;
                this.areaDict[area] = title;
                this.areaPosition[area] = position;
            }
            const subareaList = [
                ...CSRankings.aiAreas.map(key => ({ [this.areaDict[key]]: "ai" })),
                ...CSRankings.systemsAreas.map(key => ({ [this.areaDict[key]]: "systems" })),
                ...CSRankings.theoryAreas.map(key => ({ [this.areaDict[key]]: "theory" })),
                ...CSRankings.interdisciplinaryAreas.map(key => ({ [this.areaDict[key]]: "interdisciplinary" })),
            ];
            for (const item of subareaList) {
                for (const key in item) {
                    this.subareas[key] = item[key];
                }
            }
            for (const area of CSRankings.aiAreas) {
                this.aiFields.push(this.areaPosition[area]);
            }
            for (const area of CSRankings.systemsAreas) {
                this.systemsFields.push(this.areaPosition[area]);
            }
            for (const area of CSRankings.theoryAreas) {
                this.theoryFields.push(this.areaPosition[area]);
            }
            for (const area of CSRankings.interdisciplinaryAreas) {
                this.otherFields.push(this.areaPosition[area]);
            }
            let parentCounter = 0;
            for (const child in CSRankings.parentMap) {
                const parent = CSRankings.parentMap[child];
                if (!(parent in CSRankings.childMap)) {
                    CSRankings.childMap[parent] = [child];
                    CSRankings.parentIndex[parent] = parentCounter;
                    parentCounter += 1;
                }
                else {
                    CSRankings.childMap[parent].push(child);
                }
            }
            (() => __awaiter(this, void 0, void 0, function* () {
                // Load all CSV files in parallel for faster initial load
                const loadStart = performance.now();
                yield Promise.all([
                    CSRankings.loadTuring(this.turing),
                    CSRankings.loadACMFellow(this.acmfellow),
                    CSRankings.loadAuthorInfo(this.dblpAuthors, this.homepages, this.scholarInfo, this.note),
                    CSRankings.loadAuthors().then(authors => { this.authors = authors; }),
                    CSRankings.loadCountryInfo(this.countryInfo, this.countryAbbrv),
                    CSRankings.loadCountryNames(this.countryNames)
                ]);
                console.log(`All CSV files loaded in ${(performance.now() - loadStart).toFixed(1)}ms`);
                this.setAllOn();
                this.navigoRouter.on({
                    '/index': (params, query) => this.navigation(params, query),
                    '/fromyear/:fromyear/toyear/:toyear/index': (params, query) => this.navigation(params, query)
                }).resolve();
                this.recomputeAuthorAreas();
                this.addListeners();
                CSRankings.geoCheck(() => this.rank());
                this.rank();
                // Display survey or sponsorship request
                const surveyShown = CSRankings.tryDisplaySurvey({ disabled: true });
                CSRankings.initSponsorshipTracking(surveyShown);
            }))();
        }
        recomputeAuthorAreas() {
            const startyear = parseInt($("#fromyear").find(":selected").text());
            const endyear = parseInt($("#toyear").find(":selected").text());
            this.authorAreas = CSRankings.countAuthorAreas(this.authors, this.areaDict, startyear, endyear);
        }
        areaString(name) {
            if (name in this.areaStringMap) {
                return this.areaStringMap[name];
            }
            // Create a summary of areas, separated by commas,
            // corresponding to a faculty member's publications.
            const pubThreshold = 0.2;
            const numStddevs = 1.0;
            const topN = 3;
            const minPubThreshold = 1;
            if (!this.authorAreas[name]) {
                return "";
            }
            // Create an object containing areas and number of publications.
            let datadict = {};
            const keys = CSRankings.topTierAreas;
            let maxValue = 0;
            for (let key in keys) {
                const value = this.authorAreas[name][key];
                if (key in CSRankings.parentMap) {
                    key = this.areaDict[key];
                }
                if (value > 0) {
                    if (!(key in datadict)) {
                        datadict[key] = 0;
                    }
                    datadict[key] += value;
                    maxValue = (datadict[key] > maxValue) ? datadict[key] : maxValue;
                }
            }
            // Now compute the standard deviation.
            let values = [];
            for (const key in datadict) {
                values.push(datadict[key]);
            }
            const sumVal = CSRankings.sum(values);
            let stddevs = 0.0;
            if (values.length > 1) {
                stddevs = Math.ceil(numStddevs * CSRankings.stddev(values));
            }
            // Strip out everything not within the desired number of
            // standard deviations of the max and not crossing the
            // publication threshold.
            let maxes = [];
            for (const key in datadict) {
                if ((datadict[key] >= maxValue - stddevs) &&
                    ((1.0 * datadict[key]) / sumVal >= pubThreshold) &&
                    (datadict[key] > minPubThreshold)) {
                    maxes.push(key);
                }
            }
            // Finally, pick at most the top N.
            const areaList = maxes.sort((x, y) => { return datadict[y] - datadict[x]; }).slice(0, topN);
            // Cache the result.
            this.areaStringMap[name] = areaList.map(n => `<span class="${this.subareas[n]}-area">${n}</span>`).join(",");
            // Return it.
            return this.areaStringMap[name];
        }
        activateFields(value, fields) {
            return CSRankings.activateFieldSet(value, fields, this.fields, () => this.invalidateCheckboxCache(), () => this.rank());
        }
        /* Build drop down for faculty names and paper counts - OPTIMIZED with lazy rendering */
        buildDropDown(deptNames, facultycount, facultyAdjustedCount) {
            // Return empty - we'll render faculty HTML lazily when expanded
            let univtext = {};
            for (const dept in deptNames) {
                // Store placeholder - actual HTML generated on demand in toggleFaculty
                univtext[dept] = "";
            }
            // Store the data needed for lazy rendering
            this.lazyRenderData = { deptNames, facultycount, facultyAdjustedCount };
            return univtext;
        }
        /* Invalidate the checkbox cache - call this when checkboxes change */
        invalidateCheckboxCache() {
            this.checkboxCacheValid = false;
        }
        /* Invalidate the incremental cache - call when year/region changes */
        invalidateIncrementalCache() {
            this.incrementalCache.valid = false;
        }
        /* Refresh the checkbox cache by reading all checkbox states at once */
        refreshCheckboxCache() {
            if (this.checkboxCacheValid) {
                return;
            }
            CSRankings.refreshCheckboxCache(this.fields, this.checkboxCache);
            this.checkboxCacheValid = true;
        }
        /* Get checkbox state from cache (refreshes cache if invalid) */
        getCheckboxState(area) {
            if (!this.checkboxCacheValid) {
                this.refreshCheckboxCache();
            }
            return this.checkboxCache[area] || false;
        }
        /* Updates the 'weights' of each area from the checkboxes. */
        /* Returns the number of areas selected (checked). */
        updateWeights(weights) {
            // Refresh cache once at the start
            this.refreshCheckboxCache();
            return CSRankings.updateWeightsFromCache(weights, this.checkboxCache);
        }
        /* This activates all checkboxes _without_ triggering ranking. */
        setAllOn(value = true) {
            CSRankings.setAllCheckboxes(this.fields, value, () => this.invalidateCheckboxCache());
        }
        /* PUBLIC METHODS */
        rank(update = true) {
            // Debounce rapid rank() calls
            if (this.rankDebounceTimer !== null) {
                window.clearTimeout(this.rankDebounceTimer);
            }
            // For immediate feedback, we execute synchronously but use requestAnimationFrame
            // to batch DOM updates with the browser's render cycle
            return this.doRank(update);
        }
        doRank(update) {
            const start = performance.now();
            let deptNames = {}; /* names of departments. */
            let deptCounts = {}; /* number of faculty in each department. */
            let facultycount = {}; /* name -> raw count of pubs per name / department */
            let facultyAdjustedCount = {}; /* name -> adjusted count of pubs per name / department */
            let currentWeights = {}; /* array to hold 1 or 0, depending on if the area is checked or not. */
            this.areaDeptAdjustedCount = {};
            const startyear = parseInt($("#fromyear").find(":selected").text());
            const endyear = parseInt($("#toyear").find(":selected").text());
            const whichRegions = String($("#regions").find(":selected").val());
            const numAreas = this.updateWeights(currentWeights);
            // Build/update the incremental cache (only rebuilds if year/region changed)
            CSRankings.buildIncrementalCache(this.authors, startyear, endyear, whichRegions, this.countryInfo, this.countryAbbrv, this.incrementalCache);
            // Use incremental computation
            const incrStart = performance.now();
            CSRankings.buildDepartmentsIncremental(this.incrementalCache, currentWeights, deptCounts, deptNames, facultycount, facultyAdjustedCount, this.areaDeptAdjustedCount);
            /* (university, total or average number of papers) */
            this.stats = CSRankings.computeStats(deptNames, numAreas, currentWeights, this.areaDeptAdjustedCount);
            const incrEnd = performance.now();
            console.log(`Incremental computation took ${(incrEnd - incrStart).toFixed(1)}ms`);
            // VERIFICATION: Compare with full computation if enabled
            // Toggle from console: csr.verifyIncremental = true; then click a checkbox
            if (this.verifyIncremental) {
                const fullStart = performance.now();
                let fullDeptNames = {};
                let fullDeptCounts = {};
                let fullFacultycount = {};
                let fullFacultyAdjustedCount = {};
                const savedAreaDeptAdjustedCount = Object.assign({}, this.areaDeptAdjustedCount);
                const fullAreaDeptAdjustedCount = {};
                CSRankings.buildDepartments(this.authors, startyear, endyear, currentWeights, whichRegions, fullDeptCounts, fullDeptNames, fullFacultycount, fullFacultyAdjustedCount, this.countryInfo, this.countryAbbrv, fullAreaDeptAdjustedCount);
                const fullStats = CSRankings.computeStats(fullDeptNames, numAreas, currentWeights, fullAreaDeptAdjustedCount);
                const fullEnd = performance.now();
                console.log(`Full computation took ${(fullEnd - fullStart).toFixed(1)}ms`);
                // Verify results match
                CSRankings.verifyIncrementalResults(fullStats, fullDeptCounts, fullDeptNames, fullFacultycount, fullFacultyAdjustedCount, this.stats, deptCounts, deptNames, facultycount, facultyAdjustedCount);
                // Restore incremental results (we use those for rendering)
                this.areaDeptAdjustedCount = savedAreaDeptAdjustedCount;
            }
            const univtext = this.buildDropDown(deptNames, facultycount, facultyAdjustedCount);
            /* Start building up the string to output. */
            const s = CSRankings.buildOutputString(numAreas, this.countryAbbrv, this.countryNames, deptCounts, univtext, this.stats, this.useDenseRankings, this.ChartIcon);
            let stop = performance.now();
            console.log(`Before render: rank took ${(stop - start)} milliseconds.`);
            /* Finally done. Redraw! */
            document.getElementById("success").innerHTML = s;
            if (!update) {
                this.navigoRouter.pause();
            }
            else {
                this.navigoRouter.resume();
            }
            const str = this.updatedURL();
            this.navigoRouter.navigate(str);
            stop = performance.now();
            console.log(`Rank took ${(stop - start)} milliseconds.`);
            return false;
        }
        /* Turn the chart display on or off. */
        toggleChart(name) {
            const chart = document.getElementById(name + "-chart");
            const chartwidget = document.getElementById(name + "-chartwidget");
            if (chart.style.display === 'block') {
                chart.style.display = 'none';
                chart.innerHTML = '';
                chartwidget.innerHTML = this.ChartIcon;
            }
            else {
                chart.style.display = 'block';
                CSRankings.makeChart(name, this.usePieChart, this.authorAreas, this.areaDict);
                chartwidget.innerHTML = this.OpenChartIcon;
            }
        }
        /* Expand or collape the view of conferences in a given area. */
        toggleConferences(area) {
            const e = document.getElementById(area + "-conferences");
            const widget = document.getElementById(area + "-widget");
            if (e.style.display === 'block') {
                e.style.display = 'none';
                widget.innerHTML = CSRankings.RightTriangle;
            }
            else {
                e.style.display = 'block';
                widget.innerHTML = CSRankings.DownTriangle;
            }
        }
        /* Expand or collape the view of all faculty in a department. */
        toggleFaculty(dept) {
            const e = document.getElementById(dept + "-faculty");
            const widget = document.getElementById(dept + "-widget");
            // Track user interaction for sponsorship
            CSRankings.recordUserInteraction();
            if (e.style.display === 'block') {
                e.style.display = 'none';
                widget.innerHTML = CSRankings.RightTriangle;
            }
            else {
                // Lazy render: generate HTML on first expansion
                if (e.innerHTML === '' && this.lazyRenderData) {
                    const deptUnescaped = unescape(dept);
                    if (deptUnescaped in this.lazyRenderData.deptNames) {
                        e.innerHTML = CSRankings.buildFacultyHTML(deptUnescaped, this.lazyRenderData.deptNames[deptUnescaped], this.lazyRenderData.facultycount, this.lazyRenderData.facultyAdjustedCount, this.homepages, this.dblpAuthors, this.note, this.acmfellow, this.turing, this.scholarInfo, (name) => this.areaString(name), this.ChartIcon, this.subareas);
                    }
                }
                e.style.display = 'block';
                widget.innerHTML = CSRankings.DownTriangle;
            }
        }
        /* Toggle verification mode from console: csr.setVerifyIncremental(true) */
        setVerifyIncremental(enabled) {
            this.verifyIncremental = enabled;
            console.log(`Verification mode ${enabled ? 'ENABLED' : 'DISABLED'}. Click a checkbox to test.`);
        }
        activateAll(value = true) {
            this.setAllOn(value);
            this.rank();
            return false;
        }
        activateNone() {
            return this.activateAll(false);
        }
        activateSystems(value = true) {
            return this.activateFields(value, this.systemsFields);
        }
        activateAI(value = true) {
            return this.activateFields(value, this.aiFields);
        }
        activateTheory(value = true) {
            return this.activateFields(value, this.theoryFields);
        }
        activateOthers(value = true) {
            return this.activateFields(value, this.otherFields);
        }
        deactivateSystems() {
            return this.activateSystems(false);
        }
        deactivateAI() {
            return this.activateAI(false);
        }
        deactivateTheory() {
            return this.activateTheory(false);
        }
        deactivateOthers() {
            return this.activateOthers(false);
        }
        // Update the URL according to the selected checkboxes.
        updatedURL() {
            const result = CSRankings.buildFullURL(this.fields, (field) => this.getCheckboxState(field), this.usePieChart);
            this.usePieChart = result.usePieChart;
            this.ChartIcon = result.ChartIcon;
            this.OpenChartIcon = result.OpenChartIcon;
            return result.url;
        }
        navigation(params, query) {
            CSRankings.handleNavigation(params, query, () => this.invalidateCheckboxCache());
        }
        addListeners() {
            const callbacks = {
                invalidateIncrementalCache: () => this.invalidateIncrementalCache(),
                invalidateCheckboxCache: () => this.invalidateCheckboxCache(),
                recomputeAuthorAreas: () => this.recomputeAuthorAreas(),
                rank: (updateURL) => this.rank(updateURL),
                toggleConferences: (area) => this.toggleConferences(area),
                activateAll: () => this.activateAll(),
                activateNone: () => this.activateNone(),
                activateAI: () => this.activateAI(),
                deactivateAI: () => this.deactivateAI(),
                activateSystems: () => this.activateSystems(),
                deactivateSystems: () => this.deactivateSystems(),
                activateTheory: () => this.activateTheory(),
                deactivateTheory: () => this.deactivateTheory(),
                activateOthers: () => this.activateOthers(),
                deactivateOthers: () => this.deactivateOthers()
            };
            CSRankings.addAllListeners(this.fields, callbacks);
        }
    }
    CSRankings.App = App;
})(CSRankings || (CSRankings = {}));
var csr = new CSRankings.App();
