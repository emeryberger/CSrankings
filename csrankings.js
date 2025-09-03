/*

  CSRankings.ts

  @author Emery Berger <emery@cs.umass.edu> http://www.emeryberger.com

*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference path="./typescript/he/index.d.ts" />
/// <reference path="./typescript/jquery.d.ts" />
/// <reference path="./typescript/vega-embed.d.ts" />
/// <reference path="./typescript/papaparse.d.ts" />
/// <reference path="./typescript/navigo.d.ts" />
/// <reference path="./typescript/continents.d.ts" />
;
;
;
;
;
;
;
;
;
;
;
;
class CSRankings {
    // We have scrolled: increase the number we rank.
    static updateMinimum(obj) {
        if (CSRankings.minToRank <= 500) {
            const t = obj.scrollTop;
            CSRankings.minToRank = 5000;
            CSRankings.getInstance().rank();
            return t;
        }
        else {
            return 0;
        }
    }
    // Return the singleton corresponding to this object.
    static getInstance() {
        return CSRankings.theInstance;
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
        this.authorFile = "./csrankings.csv";
        this.authorinfoFile = "./generated-author-info.csv";
        this.countryinfoFile = "./country-info.csv";
        this.countrynamesFile = "./countries.csv";
        // private readonly aliasFile = "./dblp-aliases.csv";
        this.turingFile = "./turing.csv";
        this.turingImage = "./png/acm-turing-award.png";
        this.acmfellowFile = "./acm-fellows.csv";
        this.acmfellowImage = "./png/acm.png";
        this.homepageImage = "./png/house-logo.png";
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
        this.aiAreas = ["ai", "vision", "mlmining", "nlp", "inforet"];
        this.systemsAreas = ["arch", "comm", "sec", "mod", "da", "bed", "hpc", "mobile", "metrics", "ops", "plan", "soft"];
        this.theoryAreas = ["act", "crypt", "log"];
        this.interdisciplinaryAreas = ["bio", "graph", "csed", "ecom", "chi", "robotics", "visualization"];
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
        /* Map names to Google Scholar IDs. */
        this.scholarInfo = {};
        /* Map aliases to canonical author name. */
        this.aliases = {};
        /* Map Turing award winners to year */
        this.turing = {};
        /* Map ACM Fellow award winners to year */
        this.acmfellow = {};
        /* Map institution to (non-US) region. */
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
        /* Colors. */
        this.RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
        this.DownTriangle = "&#9660;"; // downward-facing triangle symbol (expanded view)
        this.BarChartIcon = "<img class='closed_chart_icon chart_icon' alt='closed chart' src='png/barchart.png'>"; // bar chart image
        this.OpenBarChartIcon = "<img class='open_chart_icon chart_icon' alt='opened chart' src='png/barchart-open.png'>"; // opened bar chart image
        this.PieChartIcon = "<img class='closed_chart_icon chart_icon' alt='closed chart' src='png/piechart.png'>";
        this.OpenPieChartIcon = "<img class='open_chart_icon chart_icon' alt='opened chart' src='png/piechart-open.png'>";
        this.ChartIcon = this.BarChartIcon;
        this.OpenChartIcon = this.OpenBarChartIcon;
        CSRankings.theInstance = this;
        this.navigoRouter = new Navigo(null, true);
        /* Build dictionaries:
       areaDict: areas -> names used in pie charts
           areaPosition: areas -> position in area array
       subareas: subareas -> areas (e.g., "Vision" -> "ai")
        */
        for (let position = 0; position < this.areaMap.length; position++) {
            const { area, title } = this.areaMap[position];
            CSRankings.areas[position] = area;
            if (!(area in CSRankings.parentMap)) {
                CSRankings.topLevelAreas[area] = area;
            }
            if (!(area in CSRankings.nextTier)) {
                CSRankings.topTierAreas[area] = area;
            }
            this.areaNames[position] = title;
            this.fields[position] = area;
            this.areaDict[area] = title; // this.areaNames[position];
            this.areaPosition[area] = position;
        }
        const subareaList = [
            ...this.aiAreas.map(key => ({ [this.areaDict[key]]: "ai" })),
            ...this.systemsAreas.map(key => ({ [this.areaDict[key]]: "systems" })),
            ...this.theoryAreas.map(key => ({ [this.areaDict[key]]: "theory" })),
            ...this.interdisciplinaryAreas.map(key => ({ [this.areaDict[key]]: "interdisciplinary" })),
        ];
        for (const item of subareaList) {
            for (const key in item) {
                this.subareas[key] = item[key];
            }
        }
        for (const area of this.aiAreas) {
            this.aiFields.push(this.areaPosition[area]);
        }
        for (const area of this.systemsAreas) {
            this.systemsFields.push(this.areaPosition[area]);
        }
        for (const area of this.theoryAreas) {
            this.theoryFields.push(this.areaPosition[area]);
        }
        for (const area of this.interdisciplinaryAreas) {
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
        this.displayProgress(1);
        (() => __awaiter(this, void 0, void 0, function* () {
            yield this.loadTuring(this.turing);
            yield this.loadACMFellow(this.acmfellow);
            this.displayProgress(2);
            yield this.loadAuthorInfo();
            this.displayProgress(3);
            yield this.loadAuthors();
            this.setAllOn();
            this.navigoRouter.on({
                '/index': this.navigation,
                '/fromyear/:fromyear/toyear/:toyear/index': this.navigation
            }).resolve();
            this.displayProgress(4);
            this.countAuthorAreas();
            yield this.loadCountryInfo(this.countryInfo, this.countryAbbrv);
            yield this.loadCountryNames(this.countryNames);
            this.addListeners();
            CSRankings.geoCheck();
            this.rank();
            // We've finished loading; remove the overlay.
            document.getElementById("overlay-loading").style.display = "none";
            // Randomly display a survey.
            const surveyFrequency = 1000000; // One out of this many users gets the survey (on average).
            // Check to see if survey has already been displayed.
            let displaySurvey = false;
            // Keep the cookie for backwards compatibility (for now).
            let shownAlready = document.cookie.split('; ').find(row => row.startsWith('surveyDisplayed')) ||
                localStorage.getItem('surveyDisplayed');
            // DISABLE SURVEY (remove the next line to re-enable)
            shownAlready = 'disabled';
            if (!shownAlready) {
                // Not shown yet.
                const randomValue = Math.floor(Math.random() * surveyFrequency);
                displaySurvey = (randomValue == 0);
                if (displaySurvey) {
                    localStorage.setItem('surveyDisplayed', 'true');
                    // Now reveal the survey.
                    document.getElementById("overlay-survey").style.display = "block";
                }
            }
            // Randomly display a sponsorship request.
            // In the future, tie to amount of use of the site, a la Wikipedia.
            const sponsorshipFrequency = 5; // One out of this many users gets the sponsor page (on average).
            // Check to see if the sponsorship page has already been displayed.
            if (!localStorage.getItem('sponsorshipDisplayed')) {
                // Not shown yet.
                const randomValue = Math.floor(Math.random() * sponsorshipFrequency);
                const displaySponsor = (randomValue == 0);
                if (!displaySurvey && displaySponsor) { // Only show if we have not shown the survey page as well.
                    localStorage.setItem('sponsorshipDisplayed', 'true');
                    // Now reveal the sponsorship page.
                    document.getElementById("overlay-sponsor").style.display = "block";
                }
            }
        }))();
    }
    translateNameToDBLP(name) {
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
    /* Create the prologue that we preface each generated HTML page with (the results). */
    makePrologue() {
        const s = '<div class="table-responsive" style="overflow:auto; height:700px;">'
            + '<table class="table table-fit table-sm table-striped"'
            + 'id="ranking" valign="top">';
        return s;
    }
    static sum(n) {
        let s = 0.0;
        for (let i = 0; i < n.length; i++) {
            s += n[i];
        }
        return s;
    }
    static average(n) {
        return CSRankings.sum(n) / n.length;
    }
    static stddev(n) {
        const avg = CSRankings.average(n);
        const squareDiffs = n.map(function (value) {
            const diff = value - avg;
            return (diff * diff);
        });
        const sigma = Math.sqrt(CSRankings.sum(squareDiffs) / (n.length - 1));
        return sigma;
    }
    areaString(name) {
        if (name in this.areaStringMap) {
            return this.areaStringMap[name];
        }
        // Create a summary of areas, separated by commas,
        // corresponding to a faculty member's publications.  We only
        // consider areas within a fixed number of standard deviations
        // of the max that also comprise a threshold fraction of pubs
        // (and at least crossing a min count threshold).
        const pubThreshold = 0.2;
        const numStddevs = 1.0;
        const topN = 3;
        const minPubThreshold = 1;
        if (!this.authorAreas[name]) {
            return "";
        }
        // Create an object containing areas and number of publications.
        // This is essentially duplicated logic from makeChart and
        // should be factored out.
        let datadict = {};
        const keys = CSRankings.topTierAreas;
        let maxValue = 0;
        for (let key in keys) { // i = 0; i < keys.length; i++) {
            //	    let key = keys[i];
            //	    if (key in CSRankings.nextTier) {
            //		continue;
            //	    }
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
        const sum = CSRankings.sum(values);
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
                ((1.0 * datadict[key]) / sum >= pubThreshold) &&
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
    removeDisambiguationSuffix(str) {
        // Matches a space followed by a four-digit number at the end of the string
        const regex = /\s\d{4}$/;
        return str.replace(regex, '');
    }
    /* from http://hubrik.com/2015/11/16/sort-by-last-name-with-javascript/ */
    compareNames(a, b) {
        // Split the names as strings into arrays,
        // removing any disambiguation suffixes first.
        const aName = this.removeDisambiguationSuffix(a).split(" ");
        const bName = this.removeDisambiguationSuffix(b).split(" ");
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
    /* Create a bar or pie chart using Vega. Modified by Minsuk Kahng (https://minsuk.com) */
    makeChart(name, isPieChart) {
        let data = [];
        let datadict = {};
        const keys = CSRankings.topTierAreas;
        const uname = unescape(name);
        // Areas with their category info for color map (from https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=4).
        const areas = [
            ...this.aiAreas.map(key => ({ key: key, label: this.areaDict[key], color: "#377eb8" })),
            ...this.systemsAreas.map(key => ({ key: key, label: this.areaDict[key], color: "#ff7f00" })),
            ...this.theoryAreas.map(key => ({ key: key, label: this.areaDict[key], color: "#4daf4a" })),
            ...this.interdisciplinaryAreas.map(key => ({ key: key, label: this.areaDict[key], color: "#984ea3" }))
        ];
        areas.forEach(area => datadict[area.key] = 0);
        for (let key in keys) { // i = 0; i < keys.length; i++) {
            //	    let key = keys[i];
            if (!(uname in this.authorAreas)) {
                // Defensive programming.
                // This should only happen if we have an error in the aliases file.
                return;
            }
            //	    if (key in CSRankings.nextTier) {
            //		continue;
            //	    }
            // Round it to the nearest 0.1.
            const value = Math.round(this.authorAreas[uname][key] * 10) / 10;
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
            if (value > 0) {
                if (key in CSRankings.parentMap) {
                    key = CSRankings.parentMap[key];
                }
                datadict[key] += value;
            }
        }
        let valueSum = 0;
        areas.forEach(area => {
            valueSum += datadict[area.key];
        });
        areas.forEach((area, index) => {
            const newSlice = {
                index: index,
                area: this.areaDict[area.key],
                value: Math.round(datadict[area.key] * 10) / 10,
                ratio: datadict[area.key] / valueSum
            };
            data.push(newSlice);
            area.label = this.areaDict[area.key];
        });
        const colors = areas.sort((a, b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0)).map(area => area.color);
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
    displayProgress(step) {
        const msgs = ["Initializing.",
            "Loading author information.",
            "Loading publication data.",
            "Computing ranking."];
        const s = `<strong>${msgs[step - 1]}</strong><br />`;
        const progress = document.querySelector("#progress");
        if (progress) {
            progress.innerHTML = s;
        }
    }
    loadTuring(turing) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(this.turingFile, {
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
    loadACMFellow(acmfellow) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(this.acmfellowFile, {
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
    loadCountryInfo(countryInfo, countryAbbrv) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(this.countryinfoFile, {
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
    loadCountryNames(countryNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(this.countrynamesFile, {
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
    loadAuthorInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(this.authorFile, {
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
                    this.note[name] = result[2];
                }
                if (name !== "") {
                    this.dblpAuthors[name] = this.translateNameToDBLP(name);
                    this.homepages[name] = record['homepage'];
                    this.scholarInfo[name] = record['scholarid'];
                }
            }
        });
    }
    loadAuthors() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield new Promise((resolve) => {
                Papa.parse(this.authorinfoFile, {
                    download: true,
                    header: true,
                    complete: (results) => {
                        resolve(results.data);
                    }
                });
            });
            this.authors = data;
        });
    }
    inRegion(dept, regions) {
        switch (regions) {
            case "us":
                if (dept in this.countryInfo) {
                    return false;
                }
                break;
            case "europe":
                if (!(dept in this.countryInfo)) { // USA
                    return false;
                }
                if (this.countryInfo[dept] != "europe") {
                    return false;
                }
                break;
            case "northamerica":
                if ((dept in this.countryInfo) && (this.countryInfo[dept] != "canada")) {
                    return false;
                }
                break;
            case "australasia":
                if (!(dept in this.countryInfo)) { // USA
                    return false;
                }
                if (this.countryInfo[dept] != "australasia") {
                    return false;
                }
                break;
            case "southamerica":
                if (!(dept in this.countryInfo)) { // USA
                    return false;
                }
                if (this.countryInfo[dept] != "southamerica") {
                    return false;
                }
                break;
            case "asia":
                if (!(dept in this.countryInfo)) { // USA
                    return false;
                }
                if (this.countryInfo[dept] != "asia") {
                    return false;
                }
                break;
            case "africa":
                if (!(dept in this.countryInfo)) { // USA
                    return false;
                }
                if (this.countryInfo[dept] != "africa") {
                    return false;
                }
                break;
            case "world":
                break;
            default:
                if (this.countryAbbrv[dept] != regions) {
                    return false;
                }
                break;
        }
        return true;
    }
    activateFields(value, fields) {
        for (let i = 0; i < fields.length; i++) {
            const item = this.fields[fields[i]];
            const str = `input[name=${item}]`;
            $(str).prop('checked', value);
            if (item in CSRankings.childMap) {
                // It's a parent.
                $(str).prop('disabled', false);
                // Activate / deactivate all children as appropriate.
                CSRankings.childMap[item].forEach((k) => {
                    const str = `input[name=${k}]`;
                    if (k in CSRankings.nextTier) {
                        $(str).prop('checked', false);
                    }
                    else {
                        $(str).prop('checked', value);
                    }
                });
            }
        }
        this.rank();
        return false;
    }
    sortIndex(univagg) {
        let keys = Object.keys(univagg);
        keys.sort((a, b) => {
            if (univagg[a] != univagg[b]) {
                return univagg[b] - univagg[a];
            }
            /*
              if (univagg[a] > univagg[b]) {
              return -1;
              }
              if (univagg[b] > univagg[a]) {
              return 1;
              }
            */
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
    countAuthorAreas() {
        const startyear = parseInt($("#fromyear").find(":selected").text());
        const endyear = parseInt($("#toyear").find(":selected").text());
        this.authorAreas = {};
        for (const r in this.authors) {
            const { area } = this.authors[r];
            if (area in CSRankings.nextTier) {
                continue;
            }
            const { year } = this.authors[r];
            if ((year < startyear) || (year > endyear)) {
                continue;
            }
            const { name, dept, count } = this.authors[r];
            /*
              DISABLING weight selection so all pie charts look the
              same regardless of which areas are currently selected:
              
              if (weights[theArea] === 0) {
              continue;
              }
            */
            const theCount = parseFloat(count);
            if (!(name in this.authorAreas)) {
                this.authorAreas[name] = {};
                for (const area in this.areaDict) {
                    if (this.areaDict.hasOwnProperty(area)) {
                        this.authorAreas[name][area] = 0;
                    }
                }
            }
            if (!(dept in this.authorAreas)) {
                this.authorAreas[dept] = {};
                for (const area in this.areaDict) {
                    if (this.areaDict.hasOwnProperty(area)) {
                        this.authorAreas[dept][area] = 0;
                    }
                }
            }
            this.authorAreas[name][area] += theCount;
            this.authorAreas[dept][area] += theCount;
        }
    }
    /* Build the dictionary of departments (and count) to be ranked. */
    buildDepartments(startyear, endyear, weights, regions, deptCounts, deptNames, facultycount, facultyAdjustedCount) {
        /* contains an author name if that author has been processed. */
        const visited = {};
        for (const r in this.authors) {
            if (!this.authors.hasOwnProperty(r)) {
                continue;
            }
            const auth = this.authors[r];
            const dept = auth.dept;
            //	    if (!(dept in regionMap)) {
            if (!this.inRegion(dept, regions)) {
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
            if (!(areaDept in this.areaDeptAdjustedCount)) {
                this.areaDeptAdjustedCount[areaDept] = 0;
            }
            const count = parseInt(this.authors[r].count);
            const adjustedCount = parseFloat(this.authors[r].adjustedcount);
            this.areaDeptAdjustedCount[areaDept] += adjustedCount;
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
    /* Compute aggregate statistics. */
    computeStats(deptNames, numAreas, weights) {
        this.stats = {};
        for (const dept in deptNames) {
            if (!deptNames.hasOwnProperty(dept)) {
                continue;
            }
            this.stats[dept] = 1;
            for (const area in CSRankings.topLevelAreas) {
                const areaDept = area + dept;
                if (!(areaDept in this.areaDeptAdjustedCount)) {
                    this.areaDeptAdjustedCount[areaDept] = 0;
                }
                if (weights[area] != 0) {
                    // Adjusted (smoothed) geometric mean.
                    this.stats[dept] *= (this.areaDeptAdjustedCount[areaDept] + 1.0);
                }
            }
            // finally compute geometric mean.
            this.stats[dept] = Math.pow(this.stats[dept], 1 / numAreas); // - 1.0;
        }
    }
    /* Updates the 'weights' of each area from the checkboxes. */
    /* Returns the number of areas selected (checked). */
    updateWeights(weights) {
        let numAreas = 0;
        for (let ind = 0; ind < CSRankings.areas.length; ind++) {
            const area = CSRankings.areas[ind];
            weights[area] = $(`input[name=${this.fields[ind]}]`).prop('checked') ? 1 : 0;
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
    /* Build drop down for faculty names and paper counts. */
    buildDropDown(deptNames, facultycount, facultyAdjustedCount) {
        let univtext = {};
        for (const dept in deptNames) {
            if (!deptNames.hasOwnProperty(dept)) {
                continue;
            }
            let p = '<div class="table"><table class="table table-sm table-striped"><thead><th></th><td><small><em>'
                + '<abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td>'
                + '<td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">\#&nbsp;Pubs</abbr>'
                + ' </em></small></td><td align="right"><small><em><abbr title="Count divided by number of co-authors">Adj.&nbsp;\#</abbr></em>'
                + '</small></td></thead><tbody>';
            /* Build a dict of just faculty from this department for sorting purposes. */
            let fc = {};
            for (const name of deptNames[dept]) {
                fc[name] = facultycount[name];
            }
            let keys = Object.keys(fc);
            keys.sort((a, b) => {
                if (fc[b] === fc[a]) {
                    // return this.compareNames(a, b);
                    const fb = Math.round(10.0 * facultyAdjustedCount[b]) / 10.0;
                    const fa = Math.round(10.0 * facultyAdjustedCount[a]) / 10.0;
                    if (fb === fa) {
                        return this.compareNames(a, b);
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
                const homePage = encodeURI(this.homepages[name]);
                const dblpName = this.dblpAuthors[name]; // this.translateNameToDBLP(name);
                p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
                    + `<a title="Click for author\'s home page." target="_blank" href="${homePage}" `
                    + `onclick="trackOutboundLink('${homePage}', true); return false;"`
                    + `>${name}</a>&nbsp;`;
                if (this.note.hasOwnProperty(name)) {
                    const url = CSRankings.noteMap[this.note[name]];
                    const href = `<a href="${url}">`;
                    p += `<span class="note" title="Note">[${href + this.note[name]}</a>]</span>&nbsp;`;
                }
                if (this.acmfellow.hasOwnProperty(name)) {
                    p += `<span title="ACM Fellow (${this.acmfellow[name]})"><img alt="ACM Fellow" src="${this.acmfellowImage}"></span>&nbsp;`;
                }
                if (this.turing.hasOwnProperty(name)) {
                    p += `<span title="Turing Award"><img alt="Turing Award" src="${this.turingImage}"></span>&nbsp;`;
                }
                p += `<span class="areaname">${this.areaString(name).toLowerCase()}</span>&nbsp;`;
                p += `<a title="Click for author\'s home page." target="_blank" href="${homePage}" `
                    + `onclick="trackOutboundLink(\'${homePage}\', true); return false;"`
                    + '>'
                    + `<img alt=\"Home page\" src=\"${this.homepageImage}\"></a>&nbsp;`;
                if (this.scholarInfo.hasOwnProperty(name)) {
                    if (this.scholarInfo[name] != "NOSCHOLARPAGE") {
                        const url = `https://scholar.google.com/citations?user=${this.scholarInfo[name]}&hl=en&oi=ao`;
                        p += `<a title="Click for author\'s Google Scholar page." target="_blank" href="${url}" onclick="trackOutboundLink('${url}', true); return false;">`
                            + '<img alt="Google Scholar" src="scholar-favicon.ico" height="10" width="10"></a>&nbsp;';
                    }
                }
                p += `<a title="Click for author\'s DBLP entry." target="_blank" href="${dblpName}" onclick="trackOutboundLink('${dblpName}', true); return false;">`;
                p += '<img alt="DBLP" src="dblp.png">'
                    + '</a>';
                p += `<span onclick='csr.toggleChart("${escape(name)}"); ga("send", "event", "chart", "toggle", "toggle ${escape(name)} ${$("#charttype").find(":selected").val()} chart");' title="Click for author's publication profile." class="hovertip" id="${escape(name) + '-chartwidget'}">`;
                p += this.ChartIcon + "</span>"
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
            univtext[dept] = p;
        }
        return univtext;
    }
    buildOutputString(numAreas, countryAbbrv, deptCounts, univtext, minToRank) {
        var _a;
        let s = this.makePrologue();
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
            for (const k in this.stats) {
                const v = Math.round(10.0 * this.stats[k]) / 10.0;
                this.stats[k] = v;
            }
            // Now sort them,
            const keys2 = this.sortIndex(this.stats);
            /* Display rankings until we have shown `minToRank` items or
               while there is a tie (those all get the same rank). */
            for (let ind = 0; ind < keys2.length; ind++) {
                const dept = keys2[ind];
                const v = this.stats[dept]; // Math.round(10.0 * this.stats[dept]) / 10.0;
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
                const esc = escape(dept);
                s += "\n<tr><td>" + rank;
                // Print spaces to hold up to 4 digits of ranked schools.
                s += "&nbsp;".repeat(4 - Math.ceil(Math.log10(rank)));
                s += "</td>";
                s += "<td>"
                    + `<span class="hovertip" onclick="csr.toggleFaculty('${esc}');" id="${esc}-widget">`
                    + this.RightTriangle
                    + "</span>";
                let abbrv = "us";
                if (dept in countryAbbrv) {
                    abbrv = countryAbbrv[dept];
                }
                const country = (_a = this.countryNames[abbrv.toUpperCase()]) !== null && _a !== void 0 ? _a : abbrv.toUpperCase();
                s += "&nbsp;" + `<span onclick="csr.toggleFaculty('${esc}');">${dept}</span>`
                    + `&nbsp;<img  title="${country}" src="/flags/${abbrv}.png">&nbsp;`
                    + `<span class="hovertip" onclick='csr.toggleChart("${esc}"); ga("send", "event", "chart", "toggle-department", "toggle ${esc} ${$("#charttype").find(":selected").val()} chart");' id='${esc + "-chartwidget"}'>`
                    + this.ChartIcon + "</span>";
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
    }
    /* This activates all checkboxes _without_ triggering ranking. */
    setAllOn(value = true) {
        for (let i = 0; i < CSRankings.areas.length; i++) {
            const item = this.fields[i];
            const str = `input[name=${item}]`;
            if (value) {
                // Turn off all next tier venues.
                if (item in CSRankings.nextTier) {
                    $(str).prop('checked', false);
                }
                else {
                    $(str).prop('checked', true);
                    $(str).prop('disabled', false);
                }
            }
            else {
                // turn everything off.
                $(str).prop('checked', false);
                $(str).prop('disabled', false);
            }
        }
    }
    /* PUBLIC METHODS */
    rank(update = true) {
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
        this.buildDepartments(startyear, endyear, currentWeights, whichRegions, deptCounts, deptNames, facultycount, facultyAdjustedCount);
        /* (university, total or average number of papers) */
        this.computeStats(deptNames, numAreas, currentWeights);
        const univtext = this.buildDropDown(deptNames, facultycount, facultyAdjustedCount);
        /* Start building up the string to output. */
        const s = this.buildOutputString(numAreas, this.countryAbbrv, deptCounts, univtext, CSRankings.minToRank);
        let stop = performance.now();
        console.log(`Before render: rank took ${(stop - start)} milliseconds.`);
        /* Finally done. Redraw! */
        document.getElementById("success").innerHTML = s;
        $("div").scroll(function () {
            // console.log("scrollTop = " + this.scrollTop + ", clientHeight = " + this.clientHeight + ", scrollHeight = " + this.scrollHeight);
            // If we are nearly at the bottom, update the minimum.
            if (this.scrollTop + this.clientHeight > this.scrollHeight - 50) {
                const t = CSRankings.updateMinimum(this);
                if (t) {
                    $("div").scrollTop(t);
                }
            }
        });
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
            this.makeChart(name, this.usePieChart);
            chartwidget.innerHTML = this.OpenChartIcon;
        }
    }
    /* Expand or collape the view of conferences in a given area. */
    toggleConferences(area) {
        const e = document.getElementById(area + "-conferences");
        const widget = document.getElementById(area + "-widget");
        if (e.style.display === 'block') {
            e.style.display = 'none';
            widget.innerHTML = this.RightTriangle;
        }
        else {
            e.style.display = 'block';
            widget.innerHTML = this.DownTriangle;
        }
    }
    /* Expand or collape the view of all faculty in a department. */
    toggleFaculty(dept) {
        const e = document.getElementById(dept + "-faculty");
        const widget = document.getElementById(dept + "-widget");
        if (e.style.display === 'block') {
            e.style.display = 'none';
            widget.innerHTML = this.RightTriangle;
        }
        else {
            e.style.display = 'block';
            widget.innerHTML = this.DownTriangle;
        }
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
        let s = '';
        let count = 0;
        let totalParents = 0;
        for (let i = 0; i < this.fields.length; i++) {
            const str = `input[name=${this.fields[i]}]`;
            if (!(this.fields[i] in CSRankings.parentMap)) {
                totalParents += 1;
            }
            if ($(str).prop('checked')) {
                // Only add parents.
                if (!(this.fields[i] in CSRankings.parentMap)) {
                    // And only add if every top tier child is checked
                    // and only if every next tier child is NOT
                    // checked.
                    let allChecked = 1;
                    if (this.fields[i] in CSRankings.childMap) {
                        CSRankings.childMap[this.fields[i]].forEach((k) => {
                            let val = $(`input[name=${k}]`).prop('checked');
                            if (!(k in CSRankings.nextTier)) {
                                allChecked &= val;
                            }
                            else {
                                allChecked &= val ? 0 : 1;
                            }
                        });
                    }
                    if (allChecked) {
                        s += `${this.fields[i]}&`;
                        count += 1;
                    }
                }
            }
        }
        if (count > 0) {
            // Trim off the trailing '&'.
            s = s.slice(0, -1);
        }
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
        const chartType = $("#charttype").find(":selected").val();
        if (chartType == "pie") {
            this.usePieChart = true;
            for (const elt of document.getElementsByClassName("chart_icon")) {
                elt.src = "png/piechart.png";
            }
            for (const elt of document.getElementsByClassName("open_chart_icon")) {
                elt.src = "png/piechart-open.png";
            }
            for (const elt of document.getElementsByClassName("closed_chart_icon")) {
                elt.src = "png/piechart.png";
            }
            this.ChartIcon = this.PieChartIcon;
            this.OpenChartIcon = this.OpenPieChartIcon;
            start += '&pie';
        }
        else {
            this.usePieChart = false;
            for (const elt of document.getElementsByClassName("chart_icon")) {
                elt.src = "png/barchart.png";
            }
            for (const elt of document.getElementsByClassName("open_chart_icon")) {
                elt.src = "png/barchart-open.png";
            }
            for (const elt of document.getElementsByClassName("closed_chart_icon")) {
                elt.src = "png/barchart.png";
            }
            this.ChartIcon = this.BarChartIcon;
            this.OpenChartIcon = this.OpenBarChartIcon;
        }
        return start;
    }
    static geoCheck() {
        var _a;
        (_a = navigator.geolocation) === null || _a === void 0 ? void 0 : _a.getCurrentPosition((position) => {
            const continent = whichContinent(position.coords.latitude, position.coords.longitude);
            let regions = document.getElementById("regions");
            switch (continent) {
                case "northamerica":
                    return;
                case "europe":
                case "asia":
                case "southamerica":
                case "africa":
                    regions.value = continent;
                    break;
                default:
                    regions.value = "world";
                    break;
            }
            CSRankings.getInstance().rank();
        });
    }
    /*
      public static geoCheck(): void {
      // Figure out which country clients are coming from and set
      // the default region accordingly.
      let theUrl = 'https://geoip-db.com/jsonp/'; // 'http://freegeoip.net/json/';
      $.getJSON(theUrl, (result) => {
      switch (result.country_code) {
      case "US":
      case "CN":
      case "IN":
      case "KR":
      case "JP":
      case "TW":
      case "SG":
      $("#regions").val("USA");
      CSRankings.getInstance().rank();
      break;
      default:
      $("#regions").val("world");
      CSRankings.getInstance().rank();
      break;
      }
      }).fail(() => {
      // If we can't find a location (e.g., because this site is
      // blocked by an ad blocker), just rank anyway.
      CSRankings.getInstance().rank();
      });
      }
    */
    navigation(params, query) {
        if (params !== null) {
            // Set params (fromyear and toyear).
            Object.keys(params).forEach((key) => {
                $(`#${key}`).prop('value', params[key].toString());
            });
        }
        // Clear everything *unless* there are subsets / below-the-fold selected.
        CSRankings.clearNonSubsetted();
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
                //		if (!(item in CSRankings.nextTier)) {
                let str = `input[name=${item}]`;
                $(str).prop('checked', true);
                if (item in CSRankings.childMap) {
                    // It's a parent. Enable it.
                    $(str).prop('disabled', false);
                    // and activate all children.
                    CSRankings.childMap[item].forEach((k) => {
                        if (!(k in CSRankings.nextTier)) {
                            $(`input[name=${k}]`).prop('checked', true);
                        }
                    });
                }
                //		}
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
        for (const item of q) {
            if ((item != "none") && (item != "")) {
                const str = `input[name=${item}]`;
                $(str).prop('checked', true);
                $(str).prop('disabled', false);
                if (item in CSRankings.childMap) {
                    // Activate all children.
                    CSRankings.childMap[item].forEach((k) => {
                        if (!(k in CSRankings.nextTier)) {
                            $(`input[name=${k}]`).prop('checked', true);
                        }
                    });
                }
            }
        }
    }
    static clearNonSubsetted() {
        for (const item of CSRankings.areas) {
            if (item in CSRankings.childMap) {
                const kids = CSRankings.childMap[item];
                if (!CSRankings.subsetting(kids)) {
                    const str = `input[name=${item}]`;
                    $(str).prop('checked', false);
                    $(str).prop('disabled', false);
                    kids.forEach((item) => {
                        $(`input[name=${item}]`).prop('checked', false);
                    });
                }
            }
        }
    }
    static subsetting(sibs) {
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
            let str = `input[name=${elem}]`;
            let val = $(str).prop('checked');
            if (val) {
                numCheckedAbove++;
            }
        });
        let numCheckedBelow = 0;
        belowFold.forEach((elem) => {
            let str = `input[name=${elem}]`;
            let val = $(str).prop('checked');
            if (val) {
                numCheckedBelow++;
            }
        });
        const subsettedAbove = ((numCheckedAbove > 0) && (numCheckedAbove < aboveFold.length));
        const subsettedBelow = ((numCheckedBelow > 0) && (belowFold.length != 0));
        return subsettedAbove || subsettedBelow;
    }
    addListeners() {
        ["toyear", "fromyear", "regions", "charttype"].forEach((key) => {
            const widget = document.getElementById(key);
            widget.addEventListener("change", () => { this.countAuthorAreas(); this.rank(); });
        });
        // Add listeners for clicks on area widgets (left side of screen)
        // e.g., 'ai'
        for (let position = 0; position < CSRankings.areas.length; position++) {
            let area = CSRankings.areas[position];
            if (!(area in CSRankings.parentMap)) {
                // Not a child.
                const widget = document.getElementById(`${area}-widget`);
                if (widget) {
                    widget.addEventListener("click", () => {
                        this.toggleConferences(area);
                    });
                }
            }
        }
        // Initialize callbacks for area checkboxes.
        for (let i = 0; i < this.fields.length; i++) {
            const str = `input[name=${this.fields[i]}]`;
            const field = this.fields[i];
            const fieldElement = document.getElementById(this.fields[i]);
            if (!fieldElement) {
                continue;
            }
            fieldElement.addEventListener("click", () => {
                let updateURL = true;
                if (field in CSRankings.parentMap) {
                    // Child:
                    // If any child is on, activate the parent.
                    // If all are off, deactivate parent.
                    updateURL = false;
                    let parent = CSRankings.parentMap[field];
                    const strparent = `input[name=${parent}]`;
                    let anyChecked = 0;
                    let allChecked = 1;
                    CSRankings.childMap[parent].forEach((k) => {
                        const val = $(`input[name=${k}]`).prop('checked');
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
                    $(strparent).prop('checked', anyChecked);
                    // Mark the parent as disabled unless all are checked.
                    if (!anyChecked || allChecked) {
                        $(strparent).prop('disabled', false);
                    }
                    if (anyChecked && !allChecked) {
                        $(strparent).prop('disabled', true);
                    }
                }
                else {
                    // Parent: activate or deactivate all children.
                    const val = $(str).prop('checked');
                    if (field in CSRankings.childMap) {
                        for (const child of CSRankings.childMap[field]) {
                            const strchild = `input[name=${child}]`;
                            if (!(child in CSRankings.nextTier)) {
                                $(strchild).prop('checked', val);
                            }
                            else {
                                // Always deactivate next tier conferences.
                                $(strchild).prop('checked', false);
                            }
                        }
                    }
                }
                this.rank(updateURL);
            });
        }
        // Add group selectors.
        const listeners = {
            'all_areas_on': (() => { this.activateAll(); }),
            'all_areas_off': (() => { this.activateNone(); }),
            'ai_areas_on': (() => { this.activateAI(); }),
            'ai_areas_off': (() => { this.deactivateAI(); }),
            'systems_areas_on': (() => { this.activateSystems(); }),
            'systems_areas_off': (() => { this.deactivateSystems(); }),
            'theory_areas_on': (() => { this.activateTheory(); }),
            'theory_areas_off': (() => { this.deactivateTheory(); }),
            'other_areas_on': (() => { this.activateOthers(); }),
            'other_areas_off': (() => { this.deactivateOthers(); })
        };
        for (const item in listeners) {
            const widget = document.getElementById(item);
            widget.addEventListener("click", () => {
                listeners[item]();
            });
        }
    }
}
CSRankings.minToRank = 30; // initial number to rank --> should be enough to enable a scrollbar
CSRankings.areas = [];
CSRankings.topLevelAreas = {};
CSRankings.topTierAreas = {};
CSRankings.regions = ["europe", "northamerica", "southamerica", "australasia", "asia", "africa", "world", "ae", "ar", "at", "au", "bd", "be", "br", "ca", "ch", "cl", "cn", "co", "cy", "cz", "de", "dk", "ee", "eg", "es", "fi", "fr", "gr", "hk", "hu", "ie", "il", "in", "ir", "it", "jo", "jp", "kr", "lb", "lk", "lu", "mt", "my", "nl", "no", "nz", "ph", "pk", "pl", "pt", "qa", "ro", "ru", "sa", "se", "sg", "th", "tr", "tw", "uk", "za"];
CSRankings.nameMatcher = new RegExp('(.*)\\s+\\[(.*)\\]'); // Matches names followed by [X] notes.
CSRankings.parentIndex = {}; // For color lookups
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
CSRankings.childMap = {};
CSRankings.noteMap = {
    'Tech': 'https://tech.cornell.edu/',
    'CBG': 'https://www.cis.mpg.de/cbg/',
    'INF': 'https://www.cis.mpg.de/mpi-inf/',
    'IS': 'https://www.cis.mpg.de/is/',
    'MG': 'https://www.cis.mpg.de/molgen/',
    'SP': 'https://www.cis.mpg.de/mpi-for-security-and-privacy/',
    'SWS': 'https://www.cis.mpg.de/mpi-sws/'
};
var csr = new CSRankings();
