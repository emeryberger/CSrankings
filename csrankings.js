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
    function loadCountryInfo(countryInfo, countryAbbrv, institutionHomepages) {
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
                if (institutionHomepages && info.homepage) {
                    institutionHomepages[info.institution] = info.homepage;
                }
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
            p += `<tr class="faculty-row" data-homepage="${homePage}" style="cursor:pointer;" onclick="window.open('${homePage}', '_blank'); trackOutboundLink('${homePage}', true);" title="Click anywhere to visit ${name}'s home page"><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>`
                + `<a title="Click for author\'s home page." target="_blank" href="${homePage}" `
                + `onclick="event.stopPropagation(); trackOutboundLink('${homePage}', true); return false;"`
                + `>${name}</a>&nbsp;`;
            if (note.hasOwnProperty(name)) {
                const url = CSRankings.noteMap[note[name]];
                const href = `<a href="${url}" onclick="event.stopPropagation();">`;
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
                + `onclick="event.stopPropagation(); trackOutboundLink(\'${homePage}\', true); return false;"`
                + '>'
                + `<img alt=\"Home page\" src=\"${CSRankings.homepageImage}\"></a>&nbsp;`;
            if (scholarInfo.hasOwnProperty(name)) {
                if (scholarInfo[name] != "NOSCHOLARPAGE") {
                    const url = `https://scholar.google.com/citations?user=${scholarInfo[name]}&hl=en&oi=ao`;
                    p += `<a title="Click for author\'s Google Scholar page." target="_blank" href="${url}" onclick="event.stopPropagation(); trackOutboundLink('${url}', true); return false;">`
                        + '<img alt="Google Scholar" src="scholar-favicon.ico" height="10" width="10"></a>&nbsp;';
                }
            }
            p += `<a title="Click for author\'s DBLP entry." target="_blank" href="${dblpName}" onclick="event.stopPropagation(); trackOutboundLink('${dblpName}', true); return false;">`;
            p += '<img alt="DBLP" src="dblp.png">'
                + '</a>';
            p += `<span onclick='event.stopPropagation(); csr.toggleChart("${escape(name)}"); ga("send", "event", "chart", "toggle", "toggle ${escape(name)} ${$("#charttype").find(":selected").val()} chart");' title="Click for author's publication profile." class="hovertip" id="${escape(name) + '-chartwidget'}">`;
            p += ChartIcon + "</span>"
                + '</small>'
                + '</td><td align="right"><small>'
                + `<a title="Click for author's DBLP entry." target="_blank" href="${dblpName}" `
                + `onclick="event.stopPropagation(); trackOutboundLink('${dblpName}', true); return false;">${fc[name]}</a>`
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
    function buildOutputString(numAreas, countryAbbrv, countryNames, deptCounts, univtext, stats, useDenseRankings, ChartIcon, institutionHomepages) {
        var _a;
        let s = CSRankings.makePrologue();
        /* Show the top N (with more if tied at the end) */
        s = s + '<thead><tr><th></th><th align="left"><font color="#777">Institution</font>'
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
                s += "\n<tr><td class=\"rank-cell\">" + rank;
                s += "</td>";
                s += "<td>"
                    + `<span class="hovertip" onclick="csr.toggleFaculty('${esc}');" id="${esc}-widget" title="Click to show/hide faculty">`
                    + CSRankings.RightTriangle
                    + "</span>";
                let abbrv = "us";
                if (dept in countryAbbrv) {
                    abbrv = countryAbbrv[dept];
                }
                const country = (_a = countryNames[abbrv.toUpperCase()]) !== null && _a !== void 0 ? _a : abbrv.toUpperCase();
                // Institution name always toggles faculty list
                let deptDisplay = `<span onclick="csr.toggleFaculty('${esc}');" style="cursor:pointer;" title="Click to show/hide faculty">${dept}</span>`;
                // Add home icon if institution has a homepage
                const instHomepage = institutionHomepages && institutionHomepages[dept];
                if (instHomepage) {
                    deptDisplay += `&nbsp;<a href="${encodeURI(instHomepage)}" target="_blank" onclick="event.stopPropagation(); trackOutboundLink('${encodeURI(instHomepage)}', true);" title="Visit ${dept} CS department"><img alt="Homepage" src="${CSRankings.homepageImage}" style="opacity:0.7;"></a>`;
                }
                s += "&nbsp;" + deptDisplay
                    + `&nbsp;<img  title="${country}" src="/flags/${abbrv}.png">&nbsp;`
                    + `<span class="hovertip" onclick='csr.toggleChart("${esc}"); ga("send", "event", "chart", "toggle-department", "toggle ${esc} ${$("#charttype").find(":selected").val()} chart");' id='${esc + "-chartwidget"}' title="Click for publication distribution">`
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
            // Sync year slider if it exists
            if (params['fromyear'] && params['toyear']) {
                const fromYear = parseInt(params['fromyear']);
                const toYear = parseInt(params['toyear']);
                if (typeof CSRankings.setYearSliderValues === 'function') {
                    CSRankings.setYearSliderValues(fromYear, toYear);
                }
            }
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
                    // Sync the custom dropdown
                    if (typeof CSRankings.syncRegionDropdown === 'function') {
                        CSRankings.syncRegionDropdown();
                    }
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
            // Sync the custom dropdown
            if (typeof CSRankings.syncChartDropdown === 'function') {
                CSRankings.syncChartDropdown();
            }
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
            // Sync the custom dropdown
            if (typeof CSRankings.syncRegionDropdown === 'function') {
                CSRankings.syncRegionDropdown();
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
        // Note: year selects are now hidden and managed by the year slider (year-slider.ts)
        // Only add listener for regions dropdown
        const regionsWidget = document.getElementById("regions");
        regionsWidget.addEventListener("change", () => {
            // Region change invalidates the incremental cache
            callbacks.invalidateIncrementalCache();
            callbacks.recomputeAuthorAreas();
            callbacks.rank();
            // Track user interaction for sponsorship
            CSRankings.recordUserInteraction();
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
        // All areas on/off buttons
        const allOnWidget = document.getElementById('all_areas_on');
        if (allOnWidget) {
            allOnWidget.addEventListener("click", () => {
                callbacks.activateAll();
                CSRankings.recordUserInteraction();
            });
        }
        const allOffWidget = document.getElementById('all_areas_off');
        if (allOffWidget) {
            allOffWidget.addEventListener("click", () => {
                callbacks.activateNone();
                CSRankings.recordUserInteraction();
            });
        }
    }
    CSRankings.addGroupSelectorListeners = addGroupSelectorListeners;
    /* Add event listeners for area toggle buttons (the section header buttons) */
    function addAreaToggleListeners(callbacks) {
        const toggleActions = {
            'ai_toggle': { on: callbacks.activateAI, off: callbacks.deactivateAI, areas: CSRankings.aiAreas },
            'systems_toggle': { on: callbacks.activateSystems, off: callbacks.deactivateSystems, areas: CSRankings.systemsAreas },
            'theory_toggle': { on: callbacks.activateTheory, off: callbacks.deactivateTheory, areas: CSRankings.theoryAreas },
            'other_toggle': { on: callbacks.activateOthers, off: callbacks.deactivateOthers, areas: CSRankings.interdisciplinaryAreas }
        };
        for (const toggleId in toggleActions) {
            const btn = document.getElementById(toggleId);
            if (btn) {
                btn.addEventListener('click', () => {
                    // Check if any areas are currently selected
                    const areas = toggleActions[toggleId].areas;
                    let anyChecked = false;
                    for (const area of areas) {
                        const checkbox = document.getElementById(area);
                        if (checkbox && checkbox.checked) {
                            anyChecked = true;
                            break;
                        }
                    }
                    // Toggle: if any selected, turn all off; if none selected, turn all on
                    if (anyChecked) {
                        toggleActions[toggleId].off();
                    }
                    else {
                        toggleActions[toggleId].on();
                    }
                    CSRankings.recordUserInteraction();
                });
            }
        }
    }
    CSRankings.addAreaToggleListeners = addAreaToggleListeners;
    /* Add all event listeners */
    function addAllListeners(fields, callbacks) {
        addDropdownListeners(callbacks);
        addAreaWidgetListeners(callbacks);
        addCheckboxListeners(fields, callbacks);
        addGroupSelectorListeners(callbacks);
        addAreaToggleListeners(callbacks);
        addAreaIndicatorListeners(callbacks);
    }
    CSRankings.addAllListeners = addAllListeners;
    /* Update area selection indicators based on checkbox states */
    function updateAreaIndicators() {
        const areaGroups = {
            'ai': { areas: CSRankings.aiAreas, toggleId: 'ai_toggle' },
            'systems': { areas: CSRankings.systemsAreas, toggleId: 'systems_toggle' },
            'theory': { areas: CSRankings.theoryAreas, toggleId: 'theory_toggle' },
            'interdisciplinary': { areas: CSRankings.interdisciplinaryAreas, toggleId: 'other_toggle' }
        };
        for (const group in areaGroups) {
            const parentAreas = areaGroups[group].areas;
            let anyChecked = false;
            let isDefaultState = true;
            // Check if current state matches the default state:
            // - All parent areas checked
            // - All top-tier (non-nextTier) children checked
            // - All next-tier children NOT checked
            for (const area of parentAreas) {
                // Check parent checkbox - should be checked in default state
                const parentCheckbox = document.getElementById(area);
                if (parentCheckbox) {
                    if (parentCheckbox.checked) {
                        anyChecked = true;
                    }
                    else {
                        isDefaultState = false;
                    }
                }
                // Check child checkboxes
                if (area in CSRankings.childMap) {
                    for (const child of CSRankings.childMap[area]) {
                        const childCheckbox = document.getElementById(child);
                        if (childCheckbox) {
                            const isNextTier = child in CSRankings.nextTier;
                            if (childCheckbox.checked) {
                                anyChecked = true;
                                // Next-tier should NOT be checked in default state
                                if (isNextTier) {
                                    isDefaultState = false;
                                }
                            }
                            else {
                                // Top-tier should be checked in default state
                                if (!isNextTier) {
                                    isDefaultState = false;
                                }
                            }
                        }
                    }
                }
            }
            // Determine selection state
            let selectionClass;
            if (!anyChecked) {
                selectionClass = 'selection-none';
            }
            else if (isDefaultState) {
                selectionClass = 'selection-all';
            }
            else {
                selectionClass = 'selection-partial';
            }
            // Update banner indicator
            const indicator = document.querySelector(`.${group}-indicator`);
            if (indicator) {
                indicator.classList.remove('selection-none', 'selection-partial', 'selection-all');
                indicator.classList.add(selectionClass);
            }
            // Update section toggle button
            const toggleBtn = document.getElementById(areaGroups[group].toggleId);
            if (toggleBtn) {
                toggleBtn.classList.remove('selection-none', 'selection-partial', 'selection-all');
                toggleBtn.classList.add(selectionClass);
            }
        }
    }
    CSRankings.updateAreaIndicators = updateAreaIndicators;
    /* Area indicator click handling moved to area-dropdown.ts */
    function addAreaIndicatorListeners(_callbacks) {
        // Click handlers now managed by initAreaDropdowns() in area-dropdown.ts
    }
    CSRankings.addAreaIndicatorListeners = addAreaIndicatorListeners;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Year Range Slider

  Initialization and management of the year range slider using noUiSlider.
*/
var CSRankings;
(function (CSRankings) {
    let yearSliderInstance = null;
    const MIN_YEAR = 1970;
    const MAX_YEAR = new Date().getFullYear();
    const DEFAULT_FROM_YEAR = MAX_YEAR - 10;
    const DEFAULT_TO_YEAR = MAX_YEAR;
    // Store the callback for use in year input handlers
    let yearChangeCallback = null;
    /* Initialize the year range slider */
    function initYearSlider(onChangeCallback) {
        const sliderElement = document.getElementById('year-slider');
        if (!sliderElement) {
            console.error('Year slider element not found');
            return;
        }
        yearChangeCallback = onChangeCallback;
        // Get initial values from hidden selects (for URL param support)
        const fromYearSelect = document.getElementById('fromyear');
        const toYearSelect = document.getElementById('toyear');
        let initialFrom = DEFAULT_FROM_YEAR;
        let initialTo = DEFAULT_TO_YEAR;
        if (fromYearSelect && fromYearSelect.value) {
            initialFrom = parseInt(fromYearSelect.value) || DEFAULT_FROM_YEAR;
        }
        if (toYearSelect && toYearSelect.value) {
            initialTo = parseInt(toYearSelect.value) || DEFAULT_TO_YEAR;
        }
        // Create the slider
        noUiSlider.create(sliderElement, {
            start: [initialFrom, initialTo],
            connect: true,
            range: {
                'min': MIN_YEAR,
                'max': MAX_YEAR
            },
            step: 1,
            behaviour: 'tap-drag'
        });
        yearSliderInstance = sliderElement.noUiSlider;
        // Update displays and hidden selects on slide
        yearSliderInstance.on('update', (values, _handle) => {
            const fromYear = Math.round(parseFloat(values[0]));
            const toYear = Math.round(parseFloat(values[1]));
            // Update display elements (only if not being edited)
            const fromDisplay = document.getElementById('year-display-from');
            const toDisplay = document.getElementById('year-display-to');
            if (fromDisplay && document.activeElement !== fromDisplay) {
                fromDisplay.textContent = fromYear.toString();
            }
            if (toDisplay && document.activeElement !== toDisplay) {
                toDisplay.textContent = toYear.toString();
            }
        });
        // Trigger callback only on change (when user releases)
        yearSliderInstance.on('change', (values, _handle) => {
            const fromYear = Math.round(parseFloat(values[0]));
            const toYear = Math.round(parseFloat(values[1]));
            // Update hidden selects for URL compatibility
            updateHiddenSelect('fromyear', fromYear);
            updateHiddenSelect('toyear', toYear);
            // Trigger the callback
            onChangeCallback();
        });
        // Initialize editable year displays
        initEditableYearDisplays();
    }
    CSRankings.initYearSlider = initYearSlider;
    /* Initialize editable year display elements */
    function initEditableYearDisplays() {
        const fromDisplay = document.getElementById('year-display-from');
        const toDisplay = document.getElementById('year-display-to');
        if (fromDisplay) {
            setupEditableYear(fromDisplay, 'from');
        }
        if (toDisplay) {
            setupEditableYear(toDisplay, 'to');
        }
    }
    /* Set up an editable year display element */
    function setupEditableYear(element, type) {
        // Make it focusable and editable
        element.setAttribute('contenteditable', 'true');
        element.setAttribute('inputmode', 'numeric');
        element.style.cursor = 'text';
        element.title = `Click to edit ${type === 'from' ? 'start' : 'end'} year (${MIN_YEAR}-${MAX_YEAR})`;
        // Select all text on focus
        element.addEventListener('focus', () => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
        // Handle Enter key
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                element.blur();
            }
            // Only allow digits
            if (e.key.length === 1 && !/\d/.test(e.key)) {
                e.preventDefault();
            }
        });
        // Validate and apply on blur
        element.addEventListener('blur', () => {
            applyYearInput(element, type);
        });
    }
    /* Validate and apply year input */
    function applyYearInput(element, type) {
        const inputValue = parseInt(element.textContent || '', 10);
        const currentValues = getYearSliderValues();
        let newFrom = currentValues.fromYear;
        let newTo = currentValues.toYear;
        if (isNaN(inputValue)) {
            // Invalid input, restore previous value
            element.textContent = (type === 'from' ? newFrom : newTo).toString();
            return;
        }
        // Clamp to valid range
        const clampedValue = Math.max(MIN_YEAR, Math.min(MAX_YEAR, inputValue));
        if (type === 'from') {
            newFrom = clampedValue;
            // Ensure from <= to
            if (newFrom > newTo) {
                newTo = newFrom;
            }
        }
        else {
            newTo = clampedValue;
            // Ensure to >= from
            if (newTo < newFrom) {
                newFrom = newTo;
            }
        }
        // Update slider and displays
        if (yearSliderInstance) {
            yearSliderInstance.set([newFrom, newTo]);
        }
        // Update hidden selects
        updateHiddenSelect('fromyear', newFrom);
        updateHiddenSelect('toyear', newTo);
        // Update display text
        const fromDisplay = document.getElementById('year-display-from');
        const toDisplay = document.getElementById('year-display-to');
        if (fromDisplay)
            fromDisplay.textContent = newFrom.toString();
        if (toDisplay)
            toDisplay.textContent = newTo.toString();
        // Trigger callback
        if (yearChangeCallback) {
            yearChangeCallback();
        }
    }
    /* Update hidden select element, adding option if needed */
    function updateHiddenSelect(selectId, value) {
        const select = document.getElementById(selectId);
        if (!select)
            return;
        // Check if option exists, if not create it
        let option = select.querySelector(`option[value="${value}"]`);
        if (!option) {
            option = document.createElement('option');
            option.value = value.toString();
            option.textContent = value.toString();
            select.appendChild(option);
        }
        select.value = value.toString();
    }
    /* Set slider values programmatically (for URL navigation) */
    function setYearSliderValues(fromYear, toYear) {
        if (yearSliderInstance) {
            yearSliderInstance.set([fromYear, toYear]);
        }
        // Also update displays
        const fromDisplay = document.getElementById('year-display-from');
        const toDisplay = document.getElementById('year-display-to');
        if (fromDisplay)
            fromDisplay.textContent = fromYear.toString();
        if (toDisplay)
            toDisplay.textContent = toYear.toString();
    }
    CSRankings.setYearSliderValues = setYearSliderValues;
    /* Get current slider values */
    function getYearSliderValues() {
        if (yearSliderInstance) {
            const values = yearSliderInstance.get();
            return {
                fromYear: Math.round(parseFloat(values[0])),
                toYear: Math.round(parseFloat(values[1]))
            };
        }
        return { fromYear: DEFAULT_FROM_YEAR, toYear: DEFAULT_TO_YEAR };
    }
    CSRankings.getYearSliderValues = getYearSliderValues;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Custom Region Dropdown with Flags

  Creates a custom dropdown that displays country flags alongside region names.
  Multi-country regions use globe icons instead of flags.
  Syncs with the hidden original select for data compatibility.
*/
var CSRankings;
(function (CSRankings) {
    // Globe icons for multi-country regions (centered on appropriate region)
    const regionGlobeIcons = {
        'northamerica': 'globe-americas',
        'southamerica': 'globe-americas',
        'europe': 'globe-europe-africa',
        'africa': 'globe-europe-africa',
        'asia': 'globe-asia-australia',
        'australasia': 'globe-asia-australia',
        'world': 'globe-world'
    };
    // Generate icon HTML based on region type
    function getRegionIcon(region) {
        if (regionGlobeIcons[region]) {
            const iconFile = regionGlobeIcons[region];
            return `<img src="/flags/${iconFile}.png" alt="${region}" class="region-globe-img">`;
        }
        return '';
    }
    // Check if region is multi-country (uses globe icon)
    function isMultiCountryRegion(value) {
        return regionGlobeIcons[value] !== undefined;
    }
    function initRegionDropdown() {
        const select = document.getElementById('regions');
        const customDropdown = document.getElementById('custom-region-dropdown');
        const selectedDiv = document.getElementById('region-selected');
        const optionsDiv = document.getElementById('region-options');
        const selectedText = document.getElementById('region-selected-text');
        const selectedFlag = document.getElementById('region-selected-flag');
        if (!select || !customDropdown || !optionsDiv || !selectedDiv) {
            console.error('Region dropdown elements not found');
            return;
        }
        // Build the options from the select element
        let optionsHTML = '';
        const optgroups = select.querySelectorAll('optgroup');
        optgroups.forEach((group) => {
            const label = group.getAttribute('label') || '';
            optionsHTML += `<div class="region-option-group">${label}</div>`;
            const options = group.querySelectorAll('option');
            options.forEach((option) => {
                const value = option.value;
                const text = option.textContent || '';
                const selected = option.selected ? 'selected' : '';
                if (isMultiCountryRegion(value)) {
                    // Multi-country region - use globe or empty icon
                    optionsHTML += `<div class="region-option ${selected}" data-value="${value}">
                        ${getRegionIcon(value)}
                        <span>${text}</span>
                    </div>`;
                }
                else {
                    // Country with flag
                    optionsHTML += `<div class="region-option ${selected}" data-value="${value}">
                        <img src="/flags/${value}.png" alt="${value}">
                        <span>${text}</span>
                    </div>`;
                }
            });
        });
        optionsDiv.innerHTML = optionsHTML;
        // Toggle dropdown open/closed
        selectedDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsDiv.classList.toggle('open');
        });
        // Close when clicking outside
        document.addEventListener('click', () => {
            optionsDiv.classList.remove('open');
        });
        // Handle option selection
        optionsDiv.addEventListener('click', (e) => {
            var _a;
            const target = e.target.closest('.region-option');
            if (!target)
                return;
            const value = target.getAttribute('data-value');
            if (!value)
                return;
            // Update the hidden select
            select.value = value;
            // Update the visible selected display
            const text = ((_a = target.querySelector('span')) === null || _a === void 0 ? void 0 : _a.textContent) || value;
            const img = target.querySelector('img');
            if (selectedText)
                selectedText.textContent = text;
            if (selectedFlag && img) {
                selectedFlag.src = img.src;
                selectedFlag.style.display = 'block';
            }
            else if (selectedFlag) {
                selectedFlag.style.display = 'none';
            }
            // Update selected state in options
            optionsDiv.querySelectorAll('.region-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            target.classList.add('selected');
            // Close the dropdown
            optionsDiv.classList.remove('open');
            // Trigger change event on the select
            select.dispatchEvent(new Event('change'));
        });
        // Set initial state based on selected option
        updateRegionDisplay(select, selectedText, selectedFlag);
    }
    CSRankings.initRegionDropdown = initRegionDropdown;
    function updateRegionDisplay(select, textEl, flagEl) {
        const selected = select.options[select.selectedIndex];
        if (!selected)
            return;
        const value = selected.value;
        const text = selected.textContent || value;
        if (textEl)
            textEl.textContent = text;
        if (flagEl) {
            if (regionGlobeIcons[value]) {
                // Multi-country region - show globe icon
                flagEl.src = `/flags/${regionGlobeIcons[value]}.png`;
                flagEl.style.display = 'block';
            }
            else {
                // Country - show flag
                flagEl.src = `/flags/${value}.png`;
                flagEl.style.display = 'block';
            }
        }
    }
    // Sync custom dropdown when select changes programmatically (e.g., from URL)
    function syncRegionDropdown() {
        const select = document.getElementById('regions');
        const selectedText = document.getElementById('region-selected-text');
        const selectedFlag = document.getElementById('region-selected-flag');
        const optionsDiv = document.getElementById('region-options');
        if (!select || !optionsDiv)
            return;
        updateRegionDisplay(select, selectedText, selectedFlag);
        // Update selected state in options
        const value = select.value;
        optionsDiv.querySelectorAll('.region-option').forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-value') === value);
        });
    }
    CSRankings.syncRegionDropdown = syncRegionDropdown;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Custom Chart Type Dropdown

  Creates a custom dropdown for chart type selection with icons.
  Syncs with the hidden original select for compatibility.
*/
var CSRankings;
(function (CSRankings) {
    const chartIcons = {
        'bar': 'png/barchart.png',
        'pie': 'png/piechart.png'
    };
    function initChartDropdown() {
        const select = document.getElementById('charttype');
        const selectedDiv = document.getElementById('chart-selected');
        const optionsDiv = document.getElementById('chart-options');
        const selectedText = document.getElementById('chart-selected-text');
        const selectedIcon = document.getElementById('chart-selected-icon');
        if (!select || !selectedDiv || !optionsDiv) {
            return;
        }
        // Toggle dropdown open/closed
        selectedDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsDiv.classList.toggle('open');
        });
        // Close when clicking outside
        document.addEventListener('click', () => {
            optionsDiv.classList.remove('open');
        });
        // Handle option selection
        optionsDiv.addEventListener('click', (e) => {
            var _a;
            const target = e.target.closest('.chart-option');
            if (!target)
                return;
            const value = target.getAttribute('data-value');
            if (!value)
                return;
            // Update the hidden select
            select.value = value;
            // Update the visible selected display
            const text = ((_a = target.querySelector('span')) === null || _a === void 0 ? void 0 : _a.textContent) || value;
            if (selectedText)
                selectedText.textContent = text;
            if (selectedIcon && chartIcons[value]) {
                selectedIcon.src = chartIcons[value];
            }
            // Update selected state in options
            optionsDiv.querySelectorAll('.chart-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            target.classList.add('selected');
            // Close the dropdown
            optionsDiv.classList.remove('open');
            // Trigger change event on the select
            select.dispatchEvent(new Event('change'));
        });
    }
    CSRankings.initChartDropdown = initChartDropdown;
    // Sync custom dropdown when select changes programmatically
    function syncChartDropdown() {
        const select = document.getElementById('charttype');
        const selectedText = document.getElementById('chart-selected-text');
        const selectedIcon = document.getElementById('chart-selected-icon');
        const optionsDiv = document.getElementById('chart-options');
        if (!select || !optionsDiv)
            return;
        const value = select.value;
        const selectedOption = select.options[select.selectedIndex];
        const text = (selectedOption === null || selectedOption === void 0 ? void 0 : selectedOption.textContent) || value;
        if (selectedText)
            selectedText.textContent = text;
        if (selectedIcon && chartIcons[value]) {
            selectedIcon.src = chartIcons[value];
        }
        // Update selected state in options
        optionsDiv.querySelectorAll('.chart-option').forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-value') === value);
        });
    }
    CSRankings.syncChartDropdown = syncChartDropdown;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Interactive Tour for Newcomers

  A friendly, step-by-step walkthrough oriented toward prospective
  graduate students looking for PhD advisors.
*/
/// <reference path="../typescript/shepherd.d.ts" />
var CSRankings;
(function (CSRankings) {
    const TOUR_STORAGE_KEY = 'csrankings-tour-completed';
    let tourInstance = null;
    // Get current chart icon based on user's chart type selection
    function getChartIcon() {
        var _a;
        const chartType = ((_a = document.getElementById('charttype')) === null || _a === void 0 ? void 0 : _a.value) || 'bar';
        return chartType === 'pie' ? 'png/piechart.png' : 'png/barchart.png';
    }
    // Generate a mock chart matching the actual Vega charts
    // Areas sorted alphabetically, colors by category (AI=#377eb8, Systems=#ff7f00, Theory=#4daf4a,Tic.=#984ea3)
    function getMockChart() {
        var _a;
        const chartType = ((_a = document.getElementById('charttype')) === null || _a === void 0 ? void 0 : _a.value) || 'bar';
        // Simulated data: A. Professor has pubs in ML (8), NLP (3),Tic. Vis. (1)
        // Areas sorted alphabetically, colors: AI=#377eb8, Systems=#ff7f00, Theory=#4daf4a,Tic.=#984ea3
        const areas = [
            { name: 'AI', value: 0, color: '#377eb8' },
            { name: 'Arch', value: 0, color: '#ff7f00' },
            { name: 'Comp. Bio', value: 0, color: '#984ea3' },
            { name: 'Crypto', value: 0, color: '#4daf4a' },
            { name: 'CSEd', value: 0, color: '#984ea3' },
            { name: 'DB', value: 0, color: '#ff7f00' },
            { name: 'ECom', value: 0, color: '#984ea3' },
            { name: 'EDA', value: 0, color: '#ff7f00' },
            { name: 'Embedded', value: 0, color: '#ff7f00' },
            { name: 'Graphics', value: 0, color: '#984ea3' },
            { name: 'HCI', value: 0, color: '#984ea3' },
            { name: 'HPC', value: 0, color: '#ff7f00' },
            { name: 'Logic', value: 0, color: '#4daf4a' },
            { name: 'Metrics', value: 0, color: '#ff7f00' },
            { name: 'ML', value: 8, color: '#377eb8' },
            { name: 'Mobile', value: 0, color: '#ff7f00' },
            { name: 'Networks', value: 0, color: '#ff7f00' },
            { name: 'NLP', value: 3, color: '#377eb8' },
            { name: 'OS', value: 0, color: '#ff7f00' },
            { name: 'PL', value: 0, color: '#ff7f00' },
            { name: 'Robotics', value: 0, color: '#984ea3' },
            { name: 'SE', value: 0, color: '#ff7f00' },
            { name: 'Security', value: 0, color: '#ff7f00' },
            { name: 'Theory', value: 0, color: '#4daf4a' },
            { name: 'Vision', value: 0, color: '#377eb8' },
            { name: 'Visualization', value: 1, color: '#984ea3' },
            { name: 'Web+IR', value: 0, color: '#377eb8' }
        ];
        if (chartType === 'pie') {
            // Pie chart - only show slices for non-zero values
            const total = areas.reduce((sum, a) => sum + a.value, 0);
            const withValues = areas.filter(a => a.value > 0);
            let cumulativeAngle = 0;
            let slices = '';
            withValues.forEach(area => {
                const angle = (area.value / total) * 360;
                const startAngle = cumulativeAngle;
                const endAngle = cumulativeAngle + angle;
                cumulativeAngle = endAngle;
                // SVG arc for pie slice
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                const x1 = 40 + 35 * Math.cos(startRad);
                const y1 = 40 + 35 * Math.sin(startRad);
                const x2 = 40 + 35 * Math.cos(endRad);
                const y2 = 40 + 35 * Math.sin(endRad);
                const largeArc = angle > 180 ? 1 : 0;
                slices += `<path d="M40,40 L${x1},${y1} A35,35 0 ${largeArc},1 ${x2},${y2} Z" fill="${area.color}"/>`;
            });
            return `
                <div style="background:#fff; margin:10px 0; padding:8px; display:flex; align-items:center; gap:16px;">
                    <svg width="80" height="80" viewBox="0 0 80 80">${slices}</svg>
                    <div style="font-size:10px; color:#666;">
                        ${withValues.map(a => `<div><span style="display:inline-block;width:10px;height:10px;background:${a.color};margin-right:4px;"></span>${a.name}: ${a.value}</div>`).join('')}
                    </div>
                </div>
            `;
        }
        else {
            // Bar chart - show all areas, bars only for non-zero
            const maxVal = 8;
            const barWidth = 14;
            const gap = 1;
            return `
                <div style="background:#fff; margin:10px 0; padding:4px; overflow-x:auto;">
                    <div style="display:flex; align-items:flex-end; height:50px; gap:${gap}px; border-bottom:1px solid #ccc;">
                        ${areas.map(a => `<div style="background:${a.value > 0 ? a.color : 'transparent'}; width:${barWidth}px; height:${(a.value / maxVal) * 45}px; min-height:${a.value > 0 ? 2 : 0}px;"></div>`).join('')}
                    </div>
                    <div style="display:flex; gap:${gap}px; padding-top:2px;">
                        ${areas.map(a => `<div style="width:${barWidth}px; font-size:6px; text-align:center; color:#666; writing-mode:vertical-rl; transform:rotate(180deg); height:40px; overflow:hidden;">${a.name}</div>`).join('')}
                    </div>
                </div>
            `;
        }
    }
    // Mock institution row HTML for illustration
    function getMockInstitutionEntry() {
        return `
            <div style="background:#f9f9f9; border:1px solid #ddd; border-radius:4px; padding:10px; margin:10px 0; font-size:13px; line-height:2.2;">
                <span style="background:#ffeb3b; padding:4px 8px; border-radius:3px; border:2px solid #f57c00;">
                    <a href="#" onclick="return false;" style="color:#337ab7; font-weight:600;">A University</a>
                </span>
                <img src="png/house-logo.png" alt="home" style="height:12px; margin-left:6px; opacity:0.7;">
                <img src="flags/globe-world.png" alt="world" style="height:12px; margin-left:6px;">
                <img src="png/barchart.png" alt="chart" style="height:12px; margin-left:6px;">
                <span style="color:#666; margin-left:8px;">42</span>
            </div>
        `;
    }
    // Mock faculty entry HTML for illustration
    // highlight: 'name' | 'areas' | 'scholar' | 'dblp' | 'chart' | null
    function getMockFacultyEntry(highlight) {
        const chartIcon = getChartIcon();
        // Bright highlight with border for focused element
        const hlStyle = 'background:#ffeb3b; padding:4px 8px; border-radius:3px; border:2px solid #f57c00; position:relative; z-index:2;';
        // Base style for all blocks
        const blockStyle = 'display:inline-block; padding:4px 8px; border-radius:3px; vertical-align:middle;';
        const hl = (part) => highlight === part ? hlStyle : blockStyle;
        // When something is highlighted, show overlay on entire entry except highlighted part
        const overlayStyle = highlight
            ? 'position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.3); border-radius:4px; pointer-events:none;'
            : 'display:none;';
        return `
            <div style="background:#f9f9f9; border:1px solid #ddd; border-radius:4px; padding:10px; margin:10px 0; font-size:13px; line-height:2.2; position:relative;">
                <div style="${overlayStyle}"></div>
                <span style="${hl('name')}"><a href="#" onclick="return false;" style="color:#337ab7; font-weight:500;">A. Professor</a></span>
                <span style="font-variant:small-caps; color:#666; ${hl('areas')}">ml</span>
                <span style="${hl('name')}"><img src="png/house-logo.png" alt="home" style="height:12px;"></span>
                <span style="${hl('scholar')}"><img src="scholar-favicon.ico" alt="Google Scholar" style="height:12px;"></span>
                <span style="${hl('dblp')}"><img src="dblp.png" alt="DBLP" style="height:12px;"></span>
                <span style="${hl('chart')}"><img src="${chartIcon}" alt="chart" style="height:12px; cursor:pointer;"></span>
                <span style="color:#666; ${blockStyle}">12.3</span>
            </div>
        `;
    }
    function createTourSteps() {
        return [
            // Step 1: Welcome (centered)
            {
                id: 'welcome',
                title: 'Welcome to CSRankings',
                text: `
                    <p>Looking for a PhD in Computer Science? You're in the right place.</p>
                    <p>This site helps you find <strong>research-active faculty</strong> in your area of interest.</p>
                `,
                buttons: [
                    {
                        text: 'Skip',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.cancel(); },
                        secondary: true
                    },
                    {
                        text: 'Show Me How',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ],
                classes: 'shepherd-centered'
            },
            // Step 2: Key Insight
            {
                id: 'key-insight',
                title: 'Think Labs, Not Schools',
                text: `
                    <p>For a PhD, you're really applying to work with a <strong>specific professor or lab</strong>, not just a department.</p>
                    <p>A school strong in one area may not be strong in yours. Focus on finding faculty whose research matches your interests.</p>
                `,
                attachTo: {
                    element: '.intro-panel',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 3: Pick Your Region (controls row - left)
            {
                id: 'region',
                title: 'Filter by Region',
                text: `
                    <p>Looking at specific countries? Use the region filter.</p>
                    <p>Or keep it on "World" to see global options.</p>
                `,
                attachTo: {
                    element: '#custom-region-dropdown',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 4: Year Range (controls row - middle)
            {
                id: 'year-range',
                title: 'Find Active Researchers',
                text: `
                    <p>Use the year range to focus on <strong>recent publications</strong>.</p>
                    <p>Professors who haven't published recently may be focusing on administration, startups, or other duties - and may not be taking new students.</p>
                `,
                attachTo: {
                    element: '.year-slider-container',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 5: Focus on YOUR Area (controls row - right)
            {
                id: 'focus-area',
                title: 'Focus on Your Area',
                text: `
                    <p>Click any category pill (<strong>AI</strong>, <strong>Systems</strong>, <strong>Theory</strong>, <strong>Interdisc.</strong>) to open a dropdown with all the sub-areas.</p>
                    <p>Use the checkboxes to select exactly which research areas interest you. Click <strong>▶</strong> next to any area to see individual conferences.</p>
                `,
                attachTo: {
                    element: '.area-indicators',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 6: Institution Names
            {
                id: 'institution-name',
                title: 'Institution Names',
                text: function () {
                    return `
                    <p>Click any <strong>institution name</strong> to expand and see its faculty.</p>
                    <p>The <img src="png/house-logo.png" alt="home" style="height:14px;vertical-align:middle;"> icon next to each institution takes you to that CS department's website:</p>
                    ${getMockInstitutionEntry()}
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 7: Faculty Name = Homepage Link
            {
                id: 'faculty-name',
                title: 'Faculty Names Are Links',
                text: function () {
                    return `
                    <p>Each faculty <strong>name</strong> is a link to their homepage:</p>
                    ${getMockFacultyEntry('name')}
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 7: Research Areas
            {
                id: 'research-areas',
                title: 'Research Areas',
                text: function () {
                    return `
                    <p>Next to each name, you'll see their main <strong>research areas</strong> in small caps:</p>
                    ${getMockFacultyEntry('areas')}
                    <p>This gives you a quick sense of their focus and expertise.</p>
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 8: Google Scholar
            {
                id: 'google-scholar',
                title: 'Google Scholar',
                text: function () {
                    return `
                    <p>The <img src="scholar-favicon.ico" alt="Google Scholar" style="height:14px;vertical-align:middle;"> icon links to their Google Scholar profile:</p>
                    ${getMockFacultyEntry('scholar')}
                    <p>Google Scholar shows all their papers, citation counts, and recent activity.</p>
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 9: DBLP
            {
                id: 'dblp',
                title: 'DBLP',
                text: function () {
                    return `
                    <p>The <img src="dblp.png" alt="DBLP" style="height:14px;vertical-align:middle;"> icon links to DBLP, the CS bibliography:</p>
                    ${getMockFacultyEntry('dblp')}
                    <p>DBLP shows publication venues, co-authors, and collaborators.</p>
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 10: Chart Icon
            {
                id: 'chart-icon',
                title: 'Publication Breakdown',
                text: function () {
                    const chartIcon = getChartIcon();
                    return `
                    <p>Click the <img src="${chartIcon}" alt="chart" style="height:14px;vertical-align:middle;"> icon to see a breakdown of their publications by research area:</p>
                    ${getMockFacultyEntry('chart')}
                    ${getMockChart()}
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 10: Don't Obsess Over Scores
            {
                id: 'scores-warning',
                title: "Don't Compare Scores",
                text: `
                    <p>If two schools score 20.2 and 19.0, that doesn't mean one is "better."</p>
                    <p>Look at the <strong>actual faculty</strong> at both places. A student might thrive with professors at one school but not another - it's very personal.</p>
                `,
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 11: Do Your Homework
            {
                id: 'homework',
                title: 'Before You Reach Out',
                text: `
                    <p>Once you find interesting faculty:</p>
                    <ul>
                        <li>Read 2-3 of their recent papers</li>
                        <li>Check their homepage for "prospective students" info</li>
                        <li>Understand their research style and focus</li>
                    </ul>
                    <p>Send a <strong>personalized</strong> email showing you've done your homework - and always apply through the official system too.</p>
                `,
                attachTo: {
                    element: '.intro-panel',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.next(); }
                    }
                ]
            },
            // Step 9: You're Ready (centered)
            {
                id: 'ready',
                title: "You're Ready",
                text: `
                    <p>Remember: the right advisor matters more than the school's ranking. You can have a great career at many excellent programs.</p>
                    <p>Focus on <strong>finding the right advisor</strong>, not the highest-ranked school.</p>
                    <p class="tour-keyboard-hint">Click "Tour" anytime to replay this guide.</p>
                `,
                buttons: [
                    {
                        text: 'Back',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.back(); },
                        secondary: true
                    },
                    {
                        text: 'Get Started',
                        action: function () { tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.complete(); }
                    }
                ],
                classes: 'shepherd-centered'
            }
        ];
    }
    function createTour() {
        try {
            console.log('Creating Shepherd.Tour...');
            const tour = new Shepherd.Tour({
                useModalOverlay: true,
                exitOnEsc: true,
                keyboardNavigation: true,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true
                    },
                    scrollTo: { behavior: 'smooth', block: 'center' },
                    modalOverlayOpeningPadding: 8,
                    modalOverlayOpeningRadius: 4
                }
            });
            console.log('Tour created, adding steps...');
            // Add all steps
            const steps = createTourSteps();
            tour.addSteps(steps);
            console.log('Steps added:', steps.length);
            // Mark tour as completed when finished or cancelled
            tour.on('complete', () => {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
            });
            tour.on('cancel', () => {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
            });
            return tour;
        }
        catch (e) {
            console.error('Error creating tour:', e);
            throw e;
        }
    }
    /**
     * Check if the tour has been completed before
     */
    function hasCompletedTour() {
        return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    }
    /**
     * Initialize the tour - called on page load.
     * Auto-starts on first visit, otherwise waits for user action.
     */
    function initTour() {
        console.log('initTour called, Shepherd available:', typeof Shepherd !== 'undefined');
        // Only initialize if Shepherd is available
        if (typeof Shepherd === 'undefined') {
            console.warn('Shepherd.js not loaded - tour disabled');
            return;
        }
        tourInstance = createTour();
        // Auto-start on first visit (with a small delay for page to settle)
        if (!hasCompletedTour()) {
            setTimeout(() => {
                tourInstance === null || tourInstance === void 0 ? void 0 : tourInstance.start();
            }, 1000);
        }
    }
    CSRankings.initTour = initTour;
    /**
     * Start the tour manually (called from Help button)
     */
    function startTour() {
        console.log('startTour called, tourInstance:', tourInstance, 'Shepherd:', typeof Shepherd);
        if (!tourInstance) {
            if (typeof Shepherd !== 'undefined') {
                tourInstance = createTour();
            }
            else {
                console.warn('Shepherd.js not loaded - tour disabled');
                return;
            }
        }
        console.log('Starting tour...');
        tourInstance.start();
    }
    CSRankings.startTour = startTour;
    /**
     * Reset tour completion status (for testing)
     */
    function resetTourStatus() {
        localStorage.removeItem(TOUR_STORAGE_KEY);
        console.log('Tour status reset - will show on next page load');
    }
    CSRankings.resetTourStatus = resetTourStatus;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Sponsors Banner

  Fetches and displays GitHub sponsors dynamically.
*/
var CSRankings;
(function (CSRankings) {
    const SPONSORS_CONTAINER_ID = 'sponsors-avatars';
    const GITHUB_ORG = 'CSrankings';
    // Cache sponsors in localStorage for 24 hours to reduce API calls
    const CACHE_KEY = 'csrankings-sponsors';
    const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
    /**
     * Load sponsors from localStorage cache if valid.
     */
    function loadCachedSponsors() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached)
                return null;
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp > CACHE_DURATION_MS) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return data.sponsors;
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Save sponsors to localStorage cache.
     */
    function cacheSponsors(sponsors) {
        try {
            const data = {
                timestamp: Date.now(),
                sponsors: sponsors
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
        catch (_a) {
            // localStorage may be unavailable
        }
    }
    /**
     * Fetch sponsors from GitHub API.
     * Note: GitHub doesn't have a public API for sponsors, so we scrape the sponsors page
     * or use a static list. For now, we'll use the GitHub org members as a fallback.
     */
    function fetchSponsorsFromPage() {
        return __awaiter(this, void 0, void 0, function* () {
            // GitHub sponsors page doesn't have a public API
            // We'll fetch from a JSON file that can be periodically updated
            try {
                const response = yield fetch('sponsors.json');
                if (response.ok) {
                    const data = yield response.json();
                    return data.sponsors || [];
                }
            }
            catch (_a) {
                // Fall back to empty if file doesn't exist
            }
            return [];
        });
    }
    /**
     * Render sponsors to the container.
     */
    function renderSponsors(sponsors) {
        const container = document.getElementById(SPONSORS_CONTAINER_ID);
        if (!container)
            return;
        if (sponsors.length === 0) {
            // Hide the container if no sponsors
            container.style.display = 'none';
            return;
        }
        container.innerHTML = sponsors.map(sponsor => `<a href="${sponsor.html_url}" target="_blank" title="${sponsor.login}">` +
            `<img src="${sponsor.avatar_url}" alt="${sponsor.login}"></a>`).join('');
    }
    /**
     * Initialize the sponsors banner.
     */
    function initSponsors() {
        return __awaiter(this, void 0, void 0, function* () {
            // Try cache first
            const cached = loadCachedSponsors();
            if (cached && cached.length > 0) {
                renderSponsors(cached);
                return;
            }
            // Fetch fresh data
            const sponsors = yield fetchSponsorsFromPage();
            if (sponsors.length > 0) {
                cacheSponsors(sponsors);
            }
            renderSponsors(sponsors);
        });
    }
    CSRankings.initSponsors = initSponsors;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Area Dropdown Module

  Provides expandable dropdown panels for area category indicators.
  Each category (AI, Systems, Theory, Interdisciplinary) expands to show
  its parent areas, each of which can be expanded to show child conferences.
*/
var CSRankings;
(function (CSRankings) {
    // Map category to parent areas with display labels
    const categoryAreas = {
        'ai': [
            { id: 'ai', label: 'Artificial Intelligence' },
            { id: 'vision', label: 'Computer Vision' },
            { id: 'mlmining', label: 'Machine Learning' },
            { id: 'nlp', label: 'Natural Language Processing' },
            { id: 'inforet', label: 'Web & IR' }
        ],
        'systems': [
            { id: 'arch', label: 'Architecture' },
            { id: 'comm', label: 'Networks' },
            { id: 'sec', label: 'Security' },
            { id: 'mod', label: 'Databases' },
            { id: 'da', label: 'Design Automation' },
            { id: 'bed', label: 'Embedded Systems' },
            { id: 'hpc', label: 'High-Perf Computing' },
            { id: 'mobile', label: 'Mobile Computing' },
            { id: 'metrics', label: 'Measurement' },
            { id: 'ops', label: 'Operating Systems' },
            { id: 'plan', label: 'Programming Languages' },
            { id: 'soft', label: 'Software Engineering' }
        ],
        'theory': [
            { id: 'act', label: 'Algorithms & Complexity' },
            { id: 'crypt', label: 'Cryptography' },
            { id: 'log', label: 'Logic & Verification' }
        ],
        'interdisciplinary': [
            { id: 'bio', label: 'Comp. Biology' },
            { id: 'graph', label: 'Graphics' },
            { id: 'csed', label: 'CS Education' },
            { id: 'ecom', label: 'Economics' },
            { id: 'chi', label: 'HCI' },
            { id: 'robotics', label: 'Robotics' },
            { id: 'visualization', label: 'Visualization' }
        ]
    };
    // Conference display names (uppercase versions)
    const conferenceNames = {
        'aaai': 'AAAI', 'ijcai': 'IJCAI',
        'cvpr': 'CVPR', 'eccv': 'ECCV', 'iccv': 'ICCV',
        'icml': 'ICML', 'iclr': 'ICLR', 'kdd': 'KDD', 'nips': 'NeurIPS',
        'acl': 'ACL', 'emnlp': 'EMNLP', 'naacl': 'NAACL',
        'sigir': 'SIGIR', 'www': 'WWW',
        'asplos': 'ASPLOS', 'isca': 'ISCA', 'micro': 'MICRO', 'hpca': 'HPCA',
        'sigcomm': 'SIGCOMM', 'nsdi': 'NSDI',
        'ccs': 'CCS', 'oakland': 'S&P', 'usenixsec': 'USENIX Sec', 'ndss': 'NDSS', 'pets': 'PETS',
        'sigmod': 'SIGMOD', 'vldb': 'VLDB', 'icde': 'ICDE', 'pods': 'PODS',
        'dac': 'DAC', 'iccad': 'ICCAD',
        'emsoft': 'EMSOFT', 'rtas': 'RTAS', 'rtss': 'RTSS',
        'sc': 'SC', 'hpdc': 'HPDC', 'ics': 'ICS',
        'mobicom': 'MobiCom', 'mobisys': 'MobiSys', 'sensys': 'SenSys',
        'imc': 'IMC', 'sigmetrics': 'SIGMETRICS',
        'sosp': 'SOSP', 'osdi': 'OSDI', 'eurosys': 'EuroSys', 'fast': 'FAST', 'usenixatc': 'USENIX ATC',
        'popl': 'POPL', 'pldi': 'PLDI', 'oopsla': 'OOPSLA', 'icfp': 'ICFP',
        'fse': 'FSE', 'icse': 'ICSE', 'ase': 'ASE', 'issta': 'ISSTA',
        'focs': 'FOCS', 'soda': 'SODA', 'stoc': 'STOC',
        'crypto': 'CRYPTO', 'eurocrypt': 'EUROCRYPT',
        'cav': 'CAV', 'lics': 'LICS',
        'siggraph': 'SIGGRAPH', 'siggraph-asia': 'SIGGRAPH Asia', 'eurographics': 'Eurographics',
        'chiconf': 'CHI', 'ubicomp': 'UbiComp', 'uist': 'UIST',
        'icra': 'ICRA', 'iros': 'IROS', 'rss': 'RSS',
        'ismb': 'ISMB', 'recomb': 'RECOMB',
        'vis': 'VIS', 'vr': 'IEEE VR',
        'ec': 'EC', 'wine': 'WINE',
        'sigcse': 'SIGCSE'
    };
    let activeDropdown = null;
    let expandedAreas = new Set();
    let isUpdatingCheckbox = false;
    let dropdownJustOpened = false;
    /**
     * Get child conferences for a parent area
     */
    function getChildConferences(parentId) {
        return CSRankings.childMap[parentId] || [];
    }
    /**
     * Check if an area/conference checkbox is currently checked
     */
    function isAreaChecked(areaId) {
        const checkbox = document.getElementById(areaId);
        return checkbox ? checkbox.checked : false;
    }
    /**
     * Toggle an area checkbox and trigger ranking update
     */
    function toggleArea(areaId, checked) {
        const checkbox = document.getElementById(areaId);
        if (checkbox && checkbox.checked !== checked) {
            isUpdatingCheckbox = true;
            checkbox.click();
            // Reset flag after a short delay to allow event to process
            setTimeout(() => { isUpdatingCheckbox = false; }, 50);
        }
    }
    /**
     * Create the dropdown panel HTML for a category
     */
    function createDropdownPanel(category) {
        const panel = document.createElement('div');
        panel.className = 'area-dropdown-panel';
        panel.id = `area-dropdown-${category}`;
        const areas = categoryAreas[category] || [];
        const categoryLabels = {
            'ai': 'AI',
            'systems': 'Systems',
            'theory': 'Theory',
            'interdisciplinary': 'Interdisciplinary'
        };
        // Check if all areas in this category are checked
        const allChecked = areas.every(a => isAreaChecked(a.id));
        let html = '<div class="area-dropdown-content">';
        // Add "All" toggle at top
        html += `
            <div class="area-dropdown-item area-all-toggle">
                <label>
                    <input type="checkbox" class="area-dropdown-checkbox all-checkbox" data-category="${category}" ${allChecked ? 'checked' : ''}>
                    <span><strong>All ${categoryLabels[category]}</strong></span>
                </label>
            </div>
            <div class="area-dropdown-divider"></div>
        `;
        for (const area of areas) {
            const parentChecked = isAreaChecked(area.id);
            const children = getChildConferences(area.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedAreas.has(area.id);
            html += `
                <div class="area-dropdown-item area-parent" data-area="${area.id}">
                    <div class="area-parent-row">
                        ${hasChildren ? `<span class="area-expand-icon ${isExpanded ? 'expanded' : ''}" data-parent="${area.id}">&#9658;</span>` : '<span class="area-expand-spacer"></span>'}
                        <label>
                            <input type="checkbox" class="area-dropdown-checkbox parent-checkbox" data-area="${area.id}" ${parentChecked ? 'checked' : ''}>
                            <span>${area.label}</span>
                        </label>
                    </div>
            `;
            if (hasChildren) {
                // Separate top-tier and next-tier conferences
                const topTierChildren = children.filter(id => !CSRankings.nextTier[id]);
                const nextTierChildren = children.filter(id => CSRankings.nextTier[id]);
                html += `<div class="area-children ${isExpanded ? 'expanded' : ''}" data-parent="${area.id}">`;
                // Top-tier conferences first
                for (const childId of topTierChildren) {
                    const childChecked = isAreaChecked(childId);
                    const confName = conferenceNames[childId] || childId.toUpperCase();
                    html += `
                        <div class="area-dropdown-item area-child">
                            <label>
                                <input type="checkbox" class="area-dropdown-checkbox child-checkbox" data-area="${childId}" data-parent="${area.id}" ${childChecked ? 'checked' : ''}>
                                <span>${confName}</span>
                            </label>
                        </div>
                    `;
                }
                // Divider and next-tier conferences (if any)
                if (nextTierChildren.length > 0) {
                    html += '<div class="area-child-divider"></div>';
                    for (const childId of nextTierChildren) {
                        const childChecked = isAreaChecked(childId);
                        const confName = conferenceNames[childId] || childId.toUpperCase();
                        html += `
                            <div class="area-dropdown-item area-child next-tier">
                                <label>
                                    <input type="checkbox" class="area-dropdown-checkbox child-checkbox" data-area="${childId}" data-parent="${area.id}" ${childChecked ? 'checked' : ''}>
                                    <span>${confName}</span>
                                </label>
                            </div>
                        `;
                    }
                }
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        panel.innerHTML = html;
        return panel;
    }
    /**
     * Toggle expand/collapse of child conferences
     */
    function toggleExpand(parentId) {
        const isExpanded = expandedAreas.has(parentId);
        if (isExpanded) {
            expandedAreas.delete(parentId);
        }
        else {
            expandedAreas.add(parentId);
        }
        // Update UI
        document.querySelectorAll(`.area-expand-icon[data-parent="${parentId}"]`).forEach(icon => {
            icon.classList.toggle('expanded', !isExpanded);
        });
        document.querySelectorAll(`.area-children[data-parent="${parentId}"]`).forEach(container => {
            container.classList.toggle('expanded', !isExpanded);
        });
    }
    /**
     * Sync dropdown checkbox states from main checkboxes
     */
    function syncDropdownFromMain(category) {
        const panel = document.getElementById(`area-dropdown-${category}`);
        if (!panel)
            return;
        const areas = categoryAreas[category] || [];
        // Sync "All" checkbox
        const allCheckbox = panel.querySelector('.all-checkbox');
        if (allCheckbox) {
            allCheckbox.checked = areas.every(a => isAreaChecked(a.id));
        }
        for (const area of areas) {
            // Sync parent checkbox
            const parentCheckbox = panel.querySelector(`[data-area="${area.id}"].parent-checkbox`);
            if (parentCheckbox) {
                parentCheckbox.checked = isAreaChecked(area.id);
            }
            // Sync child checkboxes
            const children = getChildConferences(area.id);
            for (const childId of children) {
                const childCheckbox = panel.querySelector(`[data-area="${childId}"].child-checkbox`);
                if (childCheckbox) {
                    childCheckbox.checked = isAreaChecked(childId);
                }
            }
        }
    }
    /**
     * Toggle dropdown visibility
     */
    function toggleDropdown(category) {
        const indicator = document.querySelector(`.area-indicator[data-area="${category}"]`);
        if (!indicator)
            return;
        // Close any open dropdown
        if (activeDropdown && activeDropdown !== category) {
            closeDropdown(activeDropdown);
        }
        let panel = document.getElementById(`area-dropdown-${category}`);
        if (panel && panel.classList.contains('open')) {
            closeDropdown(category);
        }
        else {
            // Create panel if it doesn't exist
            if (!panel) {
                panel = createDropdownPanel(category);
                indicator.parentElement.appendChild(panel);
                attachDropdownListeners(category, panel);
            }
            else {
                // Sync state before opening
                syncDropdownFromMain(category);
            }
            // Open
            panel.classList.add('open');
            indicator.classList.add('active');
            activeDropdown = category;
            // Prevent immediate close on touch devices
            dropdownJustOpened = true;
            setTimeout(() => { dropdownJustOpened = false; }, 100);
        }
    }
    /**
     * Close a dropdown
     */
    function closeDropdown(category) {
        const panel = document.getElementById(`area-dropdown-${category}`);
        const indicator = document.querySelector(`.area-indicator[data-area="${category}"]`);
        if (panel) {
            panel.classList.remove('open');
        }
        if (indicator) {
            indicator.classList.remove('active');
        }
        if (activeDropdown === category) {
            activeDropdown = null;
        }
    }
    /**
     * Attach event listeners to dropdown elements
     */
    function attachDropdownListeners(category, panel) {
        // Expand/collapse icons
        panel.querySelectorAll('.area-expand-icon').forEach(icon => {
            const handleExpand = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const parentId = icon.dataset.parent;
                toggleExpand(parentId);
            };
            icon.addEventListener('click', handleExpand);
            icon.addEventListener('touchend', handleExpand);
        });
        // "All" checkbox for category
        const allCheckbox = panel.querySelector('.all-checkbox');
        if (allCheckbox) {
            allCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const input = e.target;
                const checked = input.checked;
                const areas = categoryAreas[category] || [];
                // Toggle all parent areas in this category
                for (const area of areas) {
                    toggleArea(area.id, checked);
                }
                // Sync all checkboxes in dropdown
                setTimeout(() => {
                    syncDropdownFromMain(category);
                    updateIndicatorState(category);
                }, 10);
            });
        }
        // Parent checkboxes
        panel.querySelectorAll('.parent-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const input = e.target;
                const areaId = input.dataset.area;
                toggleArea(areaId, input.checked);
                // Sync all checkboxes in dropdown to match main state
                setTimeout(() => {
                    syncDropdownFromMain(category);
                    updateIndicatorState(category);
                }, 10);
            });
        });
        // Child checkboxes
        panel.querySelectorAll('.child-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const input = e.target;
                const areaId = input.dataset.area;
                const parentId = input.dataset.parent;
                toggleArea(areaId, input.checked);
                // Sync all checkboxes in dropdown to match main state
                setTimeout(() => {
                    syncDropdownFromMain(category);
                    updateIndicatorState(category);
                }, 10);
            });
        });
    }
    /**
     * Update indicator opacity based on selection state
     */
    function updateIndicatorState(category) {
        const indicator = document.querySelector(`.area-indicator[data-area="${category}"]`);
        if (!indicator)
            return;
        const areas = categoryAreas[category] || [];
        const checkedCount = areas.filter(a => isAreaChecked(a.id)).length;
        indicator.classList.remove('selection-none', 'selection-partial', 'selection-all');
        if (checkedCount === 0) {
            indicator.classList.add('selection-none');
        }
        else if (checkedCount === areas.length) {
            indicator.classList.add('selection-all');
        }
        else {
            indicator.classList.add('selection-partial');
        }
    }
    /**
     * Initialize area dropdowns
     */
    function initAreaDropdowns() {
        // Attach click/touch handlers to indicators
        document.querySelectorAll('.area-indicator').forEach(indicator => {
            // Use both click and touchend for better iPad support
            const handleActivate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const category = indicator.dataset.area;
                toggleDropdown(category);
            };
            indicator.addEventListener('click', handleActivate);
            // For iPad Safari: touchend provides more reliable activation
            indicator.addEventListener('touchend', handleActivate);
        });
        // Close dropdown when clicking/touching outside
        const closeHandler = (e) => {
            if (activeDropdown && !isUpdatingCheckbox && !dropdownJustOpened) {
                const target = e.target;
                if (!target.closest('.area-indicators') && !target.closest('.area-dropdown-panel')) {
                    closeDropdown(activeDropdown);
                }
            }
        };
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchend', closeHandler);
        // Initialize indicator states
        ['ai', 'systems', 'theory', 'interdisciplinary'].forEach(updateIndicatorState);
        // Listen for changes to main checkboxes to sync dropdowns
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('click', () => {
                setTimeout(() => {
                    ['ai', 'systems', 'theory', 'interdisciplinary'].forEach(cat => {
                        updateIndicatorState(cat);
                        if (activeDropdown === cat) {
                            syncDropdownFromMain(cat);
                        }
                    });
                }, 10);
            });
        });
    }
    CSRankings.initAreaDropdowns = initAreaDropdowns;
})(CSRankings || (CSRankings = {}));
/*
  CSRankings - Homepage Preview

  Shows a preview of faculty homepages on hover (desktop only).
*/
var CSRankings;
(function (CSRankings) {
    let previewElement = null;
    let currentUrl = '';
    let hoverTimeout = null;
    let isPreviewHovered = false;
    const HOVER_DELAY = 300; // ms before showing preview
    /**
     * Check if we're on a wide enough screen for previews.
     */
    function isWideScreen() {
        return window.innerWidth >= 1000;
    }
    /**
     * Create the preview element if it doesn't exist.
     */
    function ensurePreviewElement() {
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'homepage-preview';
            previewElement.innerHTML = `
                <div class="homepage-preview-header">
                    <span class="homepage-preview-url"></span>
                    <a class="homepage-preview-open" href="#" target="_blank">Open</a>
                </div>
                <div class="homepage-preview-content">
                    <div class="homepage-preview-loading">Loading preview...</div>
                </div>
            `;
            document.body.appendChild(previewElement);
            // Keep preview visible when hovering over it
            previewElement.addEventListener('mouseenter', () => {
                isPreviewHovered = true;
            });
            previewElement.addEventListener('mouseleave', () => {
                isPreviewHovered = false;
                hidePreview();
            });
            // Make the preview itself clickable to open the page
            previewElement.addEventListener('click', (e) => {
                if (currentUrl && !e.target.closest('.homepage-preview-open')) {
                    window.open(currentUrl, '_blank');
                }
            });
        }
        return previewElement;
    }
    /**
     * Position the preview near the mouse/element.
     */
    function positionPreview(event) {
        if (!previewElement)
            return;
        const padding = 20;
        const previewWidth = 400;
        const previewHeight = 300;
        // Position next to the ranking window (to the left of the content)
        const rankingWindow = document.getElementById('ranking-window');
        let left = padding;
        if (rankingWindow) {
            const rect = rankingWindow.getBoundingClientRect();
            // Position at the left edge of ranking window, minus preview width
            left = rect.left - previewWidth - padding;
            // If not enough room, position at left edge of viewport
            if (left < padding) {
                left = padding;
            }
        }
        let top = event.clientY - previewHeight / 2;
        if (top < padding) {
            top = padding;
        }
        if (top + previewHeight > window.innerHeight - padding) {
            top = window.innerHeight - previewHeight - padding;
        }
        previewElement.style.left = left + 'px';
        previewElement.style.top = top + 'px';
    }
    /**
     * Show the homepage preview.
     */
    function showPreview(url, event) {
        if (!isWideScreen())
            return;
        const preview = ensurePreviewElement();
        currentUrl = url;
        // Update URL display and open link
        const urlDisplay = preview.querySelector('.homepage-preview-url');
        const openLink = preview.querySelector('.homepage-preview-open');
        if (urlDisplay) {
            try {
                urlDisplay.textContent = new URL(url).hostname;
            }
            catch (_a) {
                urlDisplay.textContent = url;
            }
        }
        if (openLink) {
            openLink.href = url;
        }
        // Show loading state first
        const content = preview.querySelector('.homepage-preview-content');
        if (content) {
            content.innerHTML = '<div class="homepage-preview-loading">Loading preview...</div>';
        }
        positionPreview(event);
        preview.classList.add('visible');
        // Try to load iframe
        loadPreviewContent(url, content);
    }
    /**
     * Load the preview content (iframe or error message).
     */
    function loadPreviewContent(url, container) {
        const iframe = document.createElement('iframe');
        iframe.sandbox.add('allow-scripts', 'allow-same-origin');
        let errorShown = false;
        const showError = () => {
            if (!errorShown) {
                errorShown = true;
                showPreviewError(container, url);
            }
        };
        iframe.onload = () => {
            var _a;
            // Check if iframe actually loaded content
            try {
                // This will throw if blocked by X-Frame-Options (cross-origin)
                const doc = iframe.contentDocument || ((_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.document);
                if (!doc || !doc.body || doc.body.innerHTML === '') {
                    showError();
                }
            }
            catch (_b) {
                // Cross-origin error means the site likely blocked framing
                showError();
            }
        };
        iframe.onerror = () => {
            showError();
        };
        // Timeout for slow loads
        setTimeout(() => {
            if (container.querySelector('.homepage-preview-loading')) {
                showError();
            }
        }, 2000);
        iframe.src = url;
        container.innerHTML = '';
        container.appendChild(iframe);
    }
    /**
     * Show error message when iframe can't load.
     */
    function showPreviewError(container, url) {
        container.innerHTML = `
            <div class="homepage-preview-error">
                <div>Preview not available</div>
                <a href="${url}" target="_blank">Click to open in new tab</a>
            </div>
        `;
    }
    /**
     * Hide the preview.
     */
    function hidePreview() {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        // Don't hide if mouse is over the preview
        if (isPreviewHovered)
            return;
        if (previewElement) {
            previewElement.classList.remove('visible');
            // Clear iframe to stop loading
            const content = previewElement.querySelector('.homepage-preview-content');
            if (content) {
                content.innerHTML = '';
            }
        }
        currentUrl = '';
    }
    /**
     * Handle mouseenter on faculty rows.
     */
    function handleFacultyMouseEnter(event) {
        const row = event.currentTarget;
        const url = row.dataset.homepage;
        if (!url || !isWideScreen())
            return;
        // Clear any existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        // Delay before showing preview
        hoverTimeout = window.setTimeout(() => {
            showPreview(url, event);
        }, HOVER_DELAY);
    }
    /**
     * Handle mouseleave on faculty rows.
     */
    function handleFacultyMouseLeave() {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        // Small delay before hiding to allow moving to preview
        setTimeout(() => {
            if (!isPreviewHovered) {
                hidePreview();
            }
        }, 100);
    }
    /**
     * Attach preview handlers to a faculty row element.
     */
    function attachPreviewHandlers(row, homepageUrl) {
        row.dataset.homepage = homepageUrl;
        row.addEventListener('mouseenter', handleFacultyMouseEnter);
        row.addEventListener('mouseleave', handleFacultyMouseLeave);
    }
    CSRankings.attachPreviewHandlers = attachPreviewHandlers;
    let currentRowElement = null;
    let hideTimeout = null;
    /**
     * Schedule showing the preview for a row.
     */
    function scheduleShowPreview(row, event) {
        const url = row.dataset.homepage;
        if (!url || !isWideScreen())
            return;
        // Cancel any pending hide
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        // Cancel any pending show
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        currentRowElement = row;
        hoverTimeout = window.setTimeout(() => {
            if (currentRowElement === row) {
                showPreview(url, event);
            }
        }, HOVER_DELAY);
    }
    /**
     * Schedule hiding the preview.
     */
    function scheduleHidePreview() {
        // Cancel any pending show
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        currentRowElement = null;
        // Small delay before hiding to allow moving to preview
        hideTimeout = window.setTimeout(() => {
            if (!isPreviewHovered && !currentRowElement) {
                hidePreview();
            }
        }, 150);
    }
    /**
     * Initialize homepage preview functionality.
     * Uses mouseover/mouseout for event delegation since mouseenter doesn't bubble.
     */
    function initHomepagePreview() {
        // Use mouseover for event delegation (it bubbles, unlike mouseenter)
        document.body.addEventListener('mouseover', (event) => {
            const target = event.target;
            const row = target.closest('.faculty-row[data-homepage]');
            if (row) {
                scheduleShowPreview(row, event);
            }
        });
        document.body.addEventListener('mouseout', (event) => {
            const target = event.target;
            const row = target.closest('.faculty-row[data-homepage]');
            const relatedTarget = event.relatedTarget;
            if (row) {
                // Check if moving to another faculty row
                const newRow = relatedTarget === null || relatedTarget === void 0 ? void 0 : relatedTarget.closest('.faculty-row[data-homepage]');
                // Check if moving to the preview
                const toPreview = relatedTarget === null || relatedTarget === void 0 ? void 0 : relatedTarget.closest('.homepage-preview');
                if (!newRow && !toPreview && !row.contains(relatedTarget)) {
                    scheduleHidePreview();
                }
            }
        });
    }
    CSRankings.initHomepagePreview = initHomepagePreview;
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
            /* Map institution to homepage URL. */
            this.institutionHomepages = {};
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
                    CSRankings.loadCountryInfo(this.countryInfo, this.countryAbbrv, this.institutionHomepages),
                    CSRankings.loadCountryNames(this.countryNames)
                ]);
                console.log(`All CSV files loaded in ${(performance.now() - loadStart).toFixed(1)}ms`);
                this.setAllOn();
                this.navigoRouter.on({
                    '/index': (params, query) => this.navigation(params, query),
                    '/fromyear/:fromyear/toyear/:toyear/index': (params, query) => this.navigation(params, query)
                }).resolve();
                // Initialize year slider after URL params are applied
                CSRankings.initYearSlider(() => {
                    this.invalidateIncrementalCache();
                    this.recomputeAuthorAreas();
                    this.rank();
                    CSRankings.recordUserInteraction();
                });
                // Initialize custom region dropdown with flags
                CSRankings.initRegionDropdown();
                // Initialize custom chart type dropdown with icons
                CSRankings.initChartDropdown();
                this.recomputeAuthorAreas();
                this.addListeners();
                CSRankings.geoCheck(() => this.rank());
                this.rank();
                // Display survey or sponsorship request
                const surveyShown = CSRankings.tryDisplaySurvey({ disabled: true });
                CSRankings.initSponsorshipTracking(surveyShown);
                // Initialize interactive tour
                CSRankings.initTour();
                // Initialize sponsors banner
                CSRankings.initSponsors();
                // Initialize area dropdowns
                CSRankings.initAreaDropdowns();
                // Initialize homepage preview on hover
                CSRankings.initHomepagePreview();
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
            const s = CSRankings.buildOutputString(numAreas, this.countryAbbrv, this.countryNames, deptCounts, univtext, this.stats, this.useDenseRankings, this.ChartIcon, this.institutionHomepages);
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
            // Update area selection indicators in the sticky banner
            CSRankings.updateAreaIndicators();
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
