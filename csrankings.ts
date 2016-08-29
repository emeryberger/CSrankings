/*

  CSrankings.ts

  @author Emery Berger <emery@cs.umass.edu> http://www.emeryberger.com

*/

/// <reference path="./typescript/jquery.d.ts" />
/// <reference path="./typescript/papaparse.d.ts" />
/// <reference path="./typescript/set.d.ts" />
/// <reference path="./typescript/d3.d.ts" />
/// <reference path="./typescript/d3pie.d.ts" />

declare function escape(s:string): string;
declare function unescape(s:string): string;

interface Author {
    name : string;
    dept : string;
    area : string;
    count : string;
    adjustedcount : string;
    year : number;
};

interface Coauthor {
    author : string;
    coauthor : string;
    year : number;
    area : string;
};

interface CountryInfo {
    institution : string;
    region : string;
};

interface Alias {
    alias : string;
    name : string;
};

interface HomePage {
    name : string;
    homepage : string;
};

class CSRankings {
    
    constructor() {
	CSRankings.setAllCheckboxes();
	CSRankings.initAreaDict();
	CSRankings.loadAliases(function() {
	    CSRankings.loadHomepages(function() {
		CSRankings.loadAuthorInfo(function() {
		    CSRankings.loadCountryInfo(CSRankings.rank);
		});
	    });
	});
    }

    private static coauthorFile       = "faculty-coauthors.csv";
    private static authorinfoFile     = "generated-author-info.csv";
    private static countryinfoFile    = "country-info.csv";
    private static aliasFile          = "dblp-aliases.csv";
    private static homepagesFile      = "homepages.csv";
    private static allowRankingChange = false;   /* Can we change the kind of rankings being used? */
    private static showCoauthors      = false;
    private static maxCoauthors       = 30;      /* Max co-authors to display. */

    private static useArithmeticMean = false;
    private static useGeometricMean  = true;    /* This is the default and arguably only principled choice. */
    private static useHarmonicMean   = false;

    /* All the areas, in order by their 'field_' number (the checkboxes) in index.html. */

    private static areas : Array<string> = [ "ai", "vision", "mlmining",  "nlp",  "web", 
					     "arch",  "networks",  "security", "database", "highperf", "mobile", "metrics", "opsys", "proglang", "softeng",
					     "theory",  "crypto", "logic",
					     "graphics", "hci", "robotics", "compbio"];

    private static areaNames : Array<string> = ["AI", "Vision", "ML", "NLP", "Web & IR",
						"Arch", "Networks", "Security", "DB", "HPC", "Mobile", "Metrics", "OS", "PL", "SE",
						"Theory", "Crypto", "Logic",
						"Graphics", "HCI", "Robotics", "Computational Biology"];

    private static useDenseRankings : boolean = false;    /* Set to true for "dense rankings" vs. "competition rankings". */
    private static areaDict : {[key : string] : string } = {};
    private static areaPosition : {[key : string] : number } = {};
    private static authors   : Array<Author> = [];       /* The data which will hold the parsed CSV of author info. */
    private static coauthors : Array<Coauthor> = [];     /* The data which will hold the parsed CSV of co-author info. */
    private static countryInfo : {[key : string] : string } = {}; /* Maps institutions to (non-US) regions. */
    private static aliases : {[key : string] : string } = {}; /* Maps aliases to canonical author name. */
    private static homepages : {[key : string] : string } = {}; /* Maps names to home pages. */
    private static authorAreas : {[name : string] : {[area : string] : number } } = {};
    /* Maps authors to the areas they have published in (for pie chart display). */

    /* Colors for all areas. */
    private static color : Array<string> =
	["#f30000", "#0600f3", "#00b109", "#14e4b4", "#0fe7fb", "#67f200", "#ff7e00", "#8fe4fa", "#ff5300", "#640000", "#3854d1", "#d00ed8", "#7890ff", "#01664d", "#04231b", "#e9f117", "#f3228e", "#7ce8ca", "#ff5300", "#ff5300", "#7eff30", "#9a8cf6", "#79aff9", "#bfbfbf", "#56b510", "#00e2f6", "#ff4141",      "#61ff41" ];

    private static RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
    private static DownTriangle  = "&#9660;"; // downward-facing triangle symbol (expanded view)
    private static PieChart      = "&#9685;"; // symbol that looks close enough to a pie chart


    private static translateNameToDBLP(name : string) : string {
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
	name = name.replace(/ó/g, "=oacute=");
	name = name.replace(/ç/g, "=ccedil=");
	name = name.replace(/ä/g, "=auml=");
	name = name.replace(/ö/g, "=ouml=");
	name = name.replace(/ü/g, "=uuml=");
	let splitName = name.split(" ");
	let newname = "";
	let lastName = splitName[splitName.length - 1];
	splitName.pop();
	let newName = splitName.join(" ");
	newName = newName.replace(/\s/g, "_");
	newName = newName.replace(/\-/g, "=");
	let str = "http://dblp.uni-trier.de/pers/hd";
	let lastInitial = lastName[0].toLowerCase();
	str += "/" + lastInitial + "/" + lastName + ":" + newName;
	return str;
    }


    /* Build the areaDict dictionary: areas -> names used in pie charts
       and areaPosition dictionary: areas -> position in area array
    */
    private static initAreaDict() : void {
	for (let i = 0; i < CSRankings.areaNames.length; i++) {
	    CSRankings.areaDict[CSRankings.areas[i]] = CSRankings.areaNames[i];
	    CSRankings.areaPosition[CSRankings.areas[i]] = i;
	}
    }

    /* Create the prologue that we preface each generated HTML page with (the results). */
    private static makePrologue() : string {
	let s = "<html>"
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
    private static compareNames (a : string, b : string) : number {

	//split the names as strings into arrays
	let aName = a.split(" ");
	let bName = b.split(" ");

	// get the last names by selecting
	// the last element in the name arrays
	// using array.length - 1 since full names
	// may also have a middle name or initial
	let aLastName = aName[aName.length - 1];
	let bLastName = bName[bName.length - 1];

	// compare the names and return either
	// a negative number, positive number
	// or zero.
	if (aLastName < bLastName) return -1;
	if (aLastName > bLastName) return 1;
	return 0;
    }

    private static redisplay(str : string) : void {
	jQuery("#success").html(str);
    }

    /* Create a pie chart */
    private static makeChart(name : string) : void {
	console.assert (CSRankings.color.length >= CSRankings.areas.length, "Houston, we have a problem.");
	let data : any = [];
	let keys = CSRankings.areas;
	for (let i = 0; i < keys.length; i++) {
	    if (CSRankings.authorAreas[unescape(name)][keys[i]] > 0) {
		data.push({ "label" : CSRankings.areaDict[keys[i]],
			    "value" : CSRankings.authorAreas[unescape(name)][keys[i]],
			    "color" : CSRankings.color[i] });
	    }
	}
	let pie = new d3pie(name + "-chart", {
	    "header": {
		"title": {
		    "text": unescape(name),
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
		},
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
		    "color": "#ffffff", // "#adadad",
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
    }

    /* Turn the chart display on or off. */
    private static toggleChart(name : string) : void {
	let chart = document.getElementById(name+"-chart");
	let widget = document.getElementById(name+"-widget");
	if (chart.style.display === 'block') {
	    chart.style.display = 'none';
	    chart.innerHTML = '';
	} else {
	    chart.style.display = 'block';
	    CSRankings.makeChart(name);
	}
	
    }

    /* Expand or collape the view of all faculty in a department. */
    private static toggleFaculty(dept : string) : void {
	let e = document.getElementById(dept+"-faculty");
	let widget = document.getElementById(dept+"-widget");
	if (e.style.display === 'block') {
	    e.style.display = 'none';
	    widget.innerHTML = CSRankings.RightTriangle;
	} else {
	    e.style.display = 'block';
	    widget.innerHTML = CSRankings.DownTriangle;
	}
    }

    /* Set all checkboxes to true. */
    private static setAllCheckboxes() : void {
	for (let i = 1; i <= CSRankings.areas.length; i++) {
	    let str = 'input[name=field_'+i+']';
	    jQuery(str).prop('checked', true);
	}
    }

    /* A convenience function for ending a pipeline of function calls executed in continuation-passing style. */
    private static nop() : void {}

    private static loadCoauthors(cont : () => void ) : void {
	Papa.parse(CSRankings.coauthorFile, {
	    download : true,
	    header: true,
	    complete : function(results) {
		let data : any = results.data;
		CSRankings.coauthors = data as Array<Coauthor>;
		cont();
	    }
	});
    }

    private static loadAliases(cont : ()=> void ) : void {
	let self = this;
	Papa.parse(CSRankings.aliasFile, {
	    header: true,
	    download : true,
	    complete : function(results) {
		let data : any = results.data;
		let d = data as Array<Alias>;
		for (let i = 0; i < d.length; i++) {
		    self.aliases[d[i].alias] = d[i].name;
		}
		cont();
	    }
	});
    }

    private static loadCountryInfo(cont : () => void ) : void {
	let self = this;
	Papa.parse(CSRankings.countryinfoFile, {
	    header: true,
	    download : true,
	    complete : function(results) {
		let data : any = results.data;
		let ci = data as Array<CountryInfo>;
		for (let i = 0; i < ci.length; i++) {
		    self.countryInfo[ci[i].institution] = ci[i].region;
		}
		cont();
	    }
	});
    }

    private static loadAuthorInfo(cont : () => void) : void {
	let self = this;
	Papa.parse(CSRankings.authorinfoFile, {
	    download : true,
	    header : true,
	    complete: function(results) {
		let data : any = results.data;
		self.authors = data as Array<Author>;
		for (let i = 1; i <= self.areas.length; i++) {
		    let str = 'input[name=field_'+i+']';
		    (function(s : string) {
			jQuery(s).click(function() {
			    self.rank();
			});})(str);
		}
		cont();
		/*	    rank(); */
	    }
	});
    }

    private static loadHomepages(cont : ()=> void ) : void {
	let self = this;
	Papa.parse(CSRankings.homepagesFile, {
	    header: true,
	    download : true,
	    complete : function(results) {
		let data : any = results.data;
		let d = data as Array<HomePage>;
		for (let i = 0; i < d.length; i++) {
		    self.homepages[d[i].name] = d[i].homepage;
		}
		cont();
	    }
	});
    }

    private static activateAll(value : boolean) : boolean {
	if (value === undefined) {
	    value = true;
	}
	for (let i = 1; i <= CSRankings.areas.length; i++) {
	    let str = "input[name=field_"+i+"]";
	    jQuery(str).prop('checked', value);
	}
	CSRankings.rank();
	return false;
    }

    private static activateNone() : boolean {
	return CSRankings.activateAll(false);
    }

    private static activateFields(value : boolean, fields : Array<number>) : boolean {
	if (value === undefined) {
	    value = true;
	}
	for (let i = 0; i <= fields.length; i++) {
	    let str = "input[name=field_"+fields[i]+"]";
	    jQuery(str).prop('checked', value);
	}
	CSRankings.rank();
	return false;
    }

    private static activateSystems(value : boolean) : boolean {
	const systemsFields : Array<number> = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
	return CSRankings.activateFields(value, systemsFields);
    }

    private static activateAI(value : boolean) : boolean {
	const aiFields      : Array<number> = [1, 2, 3, 4, 5];
	return CSRankings.activateFields(value, aiFields);
    }

    private static activateTheory(value : boolean) : boolean {
	const theoryFields  : Array<number> = [16, 17, 18];
	return CSRankings.activateFields(value, theoryFields);
    }

    private static activateOthers(value : boolean) : boolean {
	const otherFields   : Array<number> = [19, 20, 21, 22];
	return CSRankings.activateFields(value, otherFields);
    }

    private static deactivateSystems() : boolean {
	return CSRankings.activateSystems(false);
    }

    private static deactivateAI() : boolean {
	return CSRankings.activateAI(false);
    }

    private static deactivateTheory() : boolean {
	return CSRankings.activateTheory(false);
    }

    private static deactivateOthers() : boolean {
	return CSRankings.activateOthers(false);
    }

    private static toggleAI(cb : any) : boolean {
	if (cb.checked) {
	    CSRankings.activateAI(false);
	} else {
	    CSRankings.activateAI(true);
	}
	return false;
    }

    private static sortIndex(univagg : {[key: string] : number}) : string[] {
	let keys = Object.keys(univagg);
	keys.sort(function(a,b) {
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
	    return 0;});
	return keys;
    }

    private static computeCoauthors(coauthors : Array<Coauthor>,
			      startyear : number,
			      endyear : number,
			      weights : {[key:string] : number})
    : {[key : string] : Set<string> }
    {
	let coauthorList : {[key : string] : Set<string> } = {};
	for (let c in coauthors) {
	    if (!coauthors.hasOwnProperty(c)) {
		continue;
	    }
	    let author = coauthors[c].author;
	    let coauthor = coauthors[c].coauthor;
	    let year = coauthors[c].year;
	    let area = coauthors[c].area;
	    if (!(author in coauthorList)) {
		coauthorList[author] = new Set([]);
	    }
	    if ((weights[area] === 0) || (year < startyear) || (year > endyear)) {
		continue;
	    }
	    coauthorList[author].add(coauthor);
	}
	return coauthorList;
    }

    private static countAuthorAreas(areacount : {[key:string] : number},
			     authors : Array<Author>,
			     startyear : number,
			     endyear : number,
			     weights : {[key:string] : number}) : void
    
    {
	// Build up an associative array of depts.
	let depts : {[key:string] : number} = {};
	/* Delete everything from authorAreas. */
	CSRankings.authorAreas = {};
	/* Now rebuild. */
	for (let r in authors) {
	    if (!authors.hasOwnProperty(r)) {
		continue;
	    }
	    const theDept  = authors[r].dept;
	    const theArea  = authors[r].area;
	    const theCount = parseFloat(authors[r].count);
	    let name : string  = authors[r].name;
	    if (name in CSRankings.aliases) {
		name = CSRankings.aliases[name];
	    }
	    let year = authors[r].year;
	    if (!(name in CSRankings.authorAreas)) {
		CSRankings.authorAreas[name] = {};
		for (let area in CSRankings.areaDict) {
		    if (CSRankings.areaDict.hasOwnProperty(area)) {
			CSRankings.authorAreas[name][area] = 0;
		    }
		}
	    }
	    if (!(theDept in CSRankings.authorAreas)) {
		CSRankings.authorAreas[theDept] = {};
		for (let area in CSRankings.areaDict) {
		    if (CSRankings.areaDict.hasOwnProperty(area)) {
			CSRankings.authorAreas[theDept][area] = 0;
		    }
		}
	    }
	    if (!(theArea in CSRankings.authorAreas[name])) {
		CSRankings.authorAreas[name][theArea] = 0;
	    }
	    if (!(theArea in CSRankings.authorAreas[theDept])) {
		CSRankings.authorAreas[theDept][theArea] = 0;
	    }
	    if ((weights[theArea] !== 0) && (year >= startyear) && (year <= endyear)) {
		CSRankings.authorAreas[name][theArea] += theCount;
		CSRankings.authorAreas[theDept][theArea] += theCount;
	    }
	}
	
    }

    private static countPapers(areacount : {[key:string] : number},
			 areaAdjustedCount : {[key:string] : number},
			 areaDeptAdjustedCount  : {[key:string] : number},
			 authors : Array<Author>,
			 startyear : number,
			 endyear : number,
			 weights : {[key:string] : number}) : void
    {
	/* Count the total number of papers (raw and adjusted) in each area. */
	for (let r in authors) {
	    if (!authors.hasOwnProperty(r)) {
		continue;
	    }
	    const area = authors[r].area;
	    const dept = authors[r].dept;
	    const year = authors[r].year;
	    const areaDept = area+dept;
	    areaDeptAdjustedCount[areaDept] = 0;
	    if ((weights[area] === 0) || (year < startyear) || (year > endyear)) {
		continue;
	    }
	    const count = parseFloat(authors[r].count);
	    const adjustedCount = parseFloat(authors[r].adjustedcount);
	    areacount[area] += count;
	    areaAdjustedCount[area] += adjustedCount;
	}
    }


    private static buildDepartments(areaDeptAdjustedCount : {[key:string] : number},
			     deptCounts : {[key:string] : number},
			     deptNames  : {[key:string] : Array<string>},
			     facultycount : {[key:string] : number},
			     facultyAdjustedCount : {[key:string] : number},
			     authors : Array<Author>,
			     startyear : number,
			     endyear : number,
			     weights : {[key:string] : number},
			     regions : string) : void
    {
	/* Build the dictionary of departments (and count) to be ranked. */
	let visited : {[key:string] : boolean} = {};            /* contains an author name if that author has been processed. */
	for (let r in authors) {
	    if (!authors.hasOwnProperty(r)) {
		continue;
	    }
	    const area : string = authors[r].area;
	    const dept : string = authors[r].dept;
	    switch (regions) {
	    case "USA":
		if (dept in CSRankings.countryInfo) {
		    continue;
		}
		break;
	    case "europe":
		if (!(dept in CSRankings.countryInfo)) { // USA
		    continue;
		}
		if (CSRankings.countryInfo[dept] != "europe") {
		    continue;
		}
		break;
	    case "canada":
		if (!(dept in CSRankings.countryInfo)) { // USA
		    continue;
		}
		if (CSRankings.countryInfo[dept] != "canada") {
		    continue;
		}
		break;
	    case "northamerica":
		if ((dept in CSRankings.countryInfo) && (CSRankings.countryInfo[dept] != "canada")) {
		    continue;
		}
		break;
	    case "australasia":
		if (!(dept in CSRankings.countryInfo)) { // USA
		    continue;
		}
		if (CSRankings.countryInfo[dept] != "australasia") {
		    continue;
		}
		break;
	    case "world":
		break;
	    }
	    const areaDept : string = area+dept;
	    if (!(areaDept in areaDeptAdjustedCount)) {
		areaDeptAdjustedCount[areaDept] = 0;
	    }
	    if (weights[area] === 0) {
		continue;
	    }
	    const name : string  = authors[r].name;
	    const count : number = parseInt(authors[r].count);
	    const adjustedCount : number = parseFloat(authors[r].adjustedcount);
	    const year : number  = authors[r].year;
	    if ((year >= startyear) && (year <= endyear)) {
		areaDeptAdjustedCount[areaDept] += adjustedCount;
		/* Is this the first time we have seen this person? */
		if (!(name in visited)) {
		    visited[name] = true;
		    facultycount[name+dept] = 0;
		    facultyAdjustedCount[name+dept] = 0;
		    if (!(dept in deptCounts)) {
			deptCounts[dept] = 0;
			deptNames[dept] = <Array<string>>[];
		    }
		    deptNames[dept].push(name);
		    deptCounts[dept] += 1;
		}
		facultycount[name+dept] += count;
		facultyAdjustedCount[name+dept] += adjustedCount;
	    }
	}
    }

    /* Compute aggregate statistics. */
    private static computeStats(deptNames : {[key:string] : Array<string> },
			  areaAdjustedCount : {[key:string] : number},
			  areaDeptAdjustedCount : {[key:string] : number},
			  areas : Array<string>,
			  numAreas : number,
			  displayPercentages : boolean,
			  weights : {[key:string] : number})
    : {[key: string] : number}
    {
	
	let univagg : {[key: string] : number} = {};
	for (let dept in deptNames) {
	    if (!deptNames.hasOwnProperty(dept)) {
		continue;
	    }
	    if (displayPercentages) {
		if (CSRankings.useArithmeticMean) {
		    univagg[dept] = 0;
		}
		if (CSRankings.useGeometricMean) {
		    univagg[dept] = 1;
		}
		if (CSRankings.useHarmonicMean) {
		    univagg[dept] = 0;
		}
	    } else {
		univagg[dept] = 0;
	    }
	    for (let ind = 0; ind < areas.length; ind++) {
		let area = areas[ind];
		let areaDept = area+dept;
		if (!(areaDept in areaDeptAdjustedCount)) {
		    areaDeptAdjustedCount[areaDept] = 0;
		}
		if (weights[area] != 0) {
		    if (displayPercentages) {
			if (areaDeptAdjustedCount[areaDept] != 0) {
			    if (CSRankings.useArithmeticMean) {
				univagg[dept] += areaDeptAdjustedCount[areaDept] / areaAdjustedCount[area];
			    }
			    if (CSRankings.useGeometricMean) {
				univagg[dept] *= areaDeptAdjustedCount[areaDept];
			    }
			    if (CSRankings.useHarmonicMean) {
				univagg[dept] += areaAdjustedCount[area] / areaDeptAdjustedCount[areaDept];
			    }
			} else {
			    /* n--; */
			}
		    } else {
			univagg[dept] += areaDeptAdjustedCount[areaDept];
		    }
		}
	    }
	    if (displayPercentages) {
		if (CSRankings.useArithmeticMean) {
		    univagg[dept] = univagg[dept] / numAreas;
		}
		if (CSRankings.useGeometricMean) {
		    univagg[dept] = Math.pow(univagg[dept], 1/numAreas);
		}
		if (CSRankings.useHarmonicMean) {
		    univagg[dept] = numAreas / univagg[dept];
		}
	    }
	}
	return univagg;
    }

    public static rank() : boolean {
	let form = document.getElementById("rankform");
	//    let s : string = "";
	let deptNames : {[key: string] : Array<string> } = {};              /* names of departments. */
	let deptCounts : {[key: string] : number} = {};         /* number of faculty in each department. */
	let facultycount : {[key: string] : number} = {};       /* name + dept -> raw count of pubs per name / department */
	let facultyAdjustedCount : {[key: string] : number} = {}; /* name + dept -> adjusted count of pubs per name / department */
	let weights : {[key: string] : number} = {};            /* array to hold 1 or 0, depending on if the area is checked or not. */
	let areacount : {[key: string] : number} = {};          /* raw number of papers in each area */
	let areaAdjustedCount : {[key: string] : number} = {};  /* adjusted number of papers in each area (split among faculty authors). */
	let areaDeptAdjustedCount : {[key: string] : number} = {}; /* as above, but for area+dept. */
	
	const startyear          = parseInt(jQuery("#startyear").find(":selected").text());
	const endyear            = parseInt(jQuery("#endyear").find(":selected").text());
	const displayPercentages = Boolean(parseInt(jQuery("#displayPercent").find(":selected").val()));
	/* Show the top N (with more if tied at the end) */
	let minToRank            = parseInt(jQuery("#minToRank").find(":selected").val());
	const whichRegions       = jQuery("#regions").find(":selected").val();

	let numAreas = 0; /* Total number of areas checked */
	
	/* Update the 'weights' of each area from the checkboxes. */
	for (let ind = 0; ind < CSRankings.areas.length; ind++) {
	    weights[CSRankings.areas[ind]] = jQuery('input[name=field_'+(ind+1)+']').prop('checked') ? 1 : 0;
	    if (weights[CSRankings.areas[ind]] === 1) {
		/* One more area checked. */
		numAreas++;
	    }
	    areacount[CSRankings.areas[ind]] = 0;
	    areaAdjustedCount[CSRankings.areas[ind]] = 0;
	}

	let coauthorList : {[key : string] : Set<string> } = {};
	if (CSRankings.showCoauthors) {
	    coauthorList = CSRankings.computeCoauthors(CSRankings.coauthors, startyear, endyear, weights);
	}
	CSRankings.countPapers(areacount, areaAdjustedCount, areaDeptAdjustedCount, CSRankings.authors, startyear, endyear, weights);
	CSRankings.countAuthorAreas(areacount, CSRankings.authors, startyear, endyear, weights);
	CSRankings.buildDepartments(areaDeptAdjustedCount, deptCounts, deptNames, facultycount, facultyAdjustedCount, CSRankings.authors, startyear, endyear, weights, whichRegions);
	
	/* (university, total or average number of papers) */
	let univagg = CSRankings.computeStats(deptNames, areaAdjustedCount, areaDeptAdjustedCount, CSRankings.areas, numAreas, displayPercentages, weights);

	let univtext : {[key:string] : string} = {};

	/* Canonicalize names. */
	for (let dept in deptNames) {
	    for (let ind = 0; ind < deptNames[dept].length; ind++) {
		name = deptNames[dept][ind];
		if (name in CSRankings.aliases) {
		    deptNames[dept][ind] = CSRankings.aliases[name];
		    if (!(CSRankings.aliases[name]+dept in facultycount)) {
			facultycount[CSRankings.aliases[name]+dept] = facultycount[name+dept];
			facultyAdjustedCount[CSRankings.aliases[name]+dept] = facultyAdjustedCount[name+dept];
		    } else {
			facultycount[CSRankings.aliases[name]+dept] += facultycount[name+dept];
			facultyAdjustedCount[CSRankings.aliases[name]+dept] += facultyAdjustedCount[name+dept];
		    }
		}
	    }
	}
	
	/* Build drop down for faculty names and paper counts. */
	for (let dept in deptNames) {
	    let p = '<div class="row"><div class="table"><table class="table-striped" width="100%"><thead><th></th><td><small><em><abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">Raw&nbsp;\#&nbsp;Pubs</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Count divided by number of co-authors">Adjusted&nbsp;&nbsp;\#</abbr></em></small></td></thead><tbody>';
	    /* Build a dict of just faculty from this department for sorting purposes. */
	    let fc : {[key:string] : number} = {};
	    for (let ind = 0; ind < deptNames[dept].length; ind++) {
		name = deptNames[dept][ind];
		fc[name] = facultycount[name+dept];
	    }
	    let keys = Object.keys(fc);
	    keys.sort(function(a : string, b : string){ return fc[b] - fc[a];});
	    for (let ind = 0; ind < keys.length; ind++) {
		name = keys[ind];
		if (CSRankings.showCoauthors) {
		    /* Build up text for co-authors. */
		    let coauthorStr = "";
		    if ((!(name in coauthorList)) || (coauthorList[name].size === 0)) {
			coauthorList[name] = new Set([]);
			coauthorStr = "(no senior co-authors on these papers)";
		    } else {
			coauthorStr = "Senior co-authors on these papers:\n";
		    }
		    /* Sort it by last name. */
		    let l : Array<string> = [];
		    coauthorList[name].forEach(function (item, coauthors) {
			l.push(item);
		    });
		    if (l.length > CSRankings.maxCoauthors) {
			coauthorStr = "(more than "+CSRankings.maxCoauthors+" senior co-authors)";
		    } else {
			l.sort(CSRankings.compareNames);
			l.forEach(function (item, coauthors) {
			    coauthorStr += item + "\n";
			});
			/* Trim off the trailing newline. */
			coauthorStr = coauthorStr.slice(0,coauthorStr.length-1);
		    }
		}

		p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
		    + '<a title="Click for author\'s home page." target="_blank" href="'
		    + encodeURI(CSRankings.homepages[name])
		    + '">' 
		    + name
		    + '</a>&nbsp;'
		    + "<span onclick=\"CSRankings.toggleChart('"
		    + escape(name)
		    + "')\" class=\"hovertip\" ><font color=\"blue\">" + CSRankings.PieChart + "</font></span>"
		    + '</small>'
		    + '</td><td align="right"><small>'
		    + '<a title="Click for author\'s DBLP entry." target="_blank" href="'
		    + CSRankings.translateNameToDBLP(name) + '">'
		    + facultycount[name+dept]
		    + '</a>'
		    + "</small></td>"
		    + '</a></small></td><td align="right"><small>'
		//		+ '<abbr title="' + coauthorStr + '">'
		    + (Math.floor(10.0 * facultyAdjustedCount[name+dept]) / 10.0).toFixed(1)
		//		+ '</abbr>'
		    + "</small></td></tr>"
		    + "<tr><td colspan=\"4\">"
		    + '<div style="display:none;" id="' + escape(name) + "-chart" + '">'
		    + '</div>'
		    + "</td></tr>"
		;
	    }
	    p += "</tbody></table></div></div>";
	    univtext[dept] = p;
	}

	/* Start building up the string to output. */
	let s = CSRankings.makePrologue();

	if (displayPercentages) {
	    s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean number of papers published across all areas.">Average&nbsp;Count</abbr></th><th align="right">&nbsp;&nbsp;&nbsp;<abbr title="Number of faculty who have published in these areas.">Faculty</abbr></th></th></tr></thead>';
	} else {
	    s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right">Adjusted&nbsp;Pub&nbsp;Count</th><th align="right">&nbsp;&nbsp;&nbsp;Faculty</th></tr></thead>';
	}
	s = s + "<tbody>";
	/* As long as there is at least one thing selected, compute and display a ranking. */
	if (numAreas > 0) {
	    let ties = 1;        /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
	    let rank = 0;        /* index */
	    let oldv : any = null;     /* old number - to track ties */
	    /* Sort the university aggregate count from largest to smallest. */
	    let keys2 = CSRankings.sortIndex(univagg);
	    /* Display rankings until we have shown `minToRank` items or
	       while there is a tie (those all get the same rank). */
	    for (let ind = 0; ind < keys2.length; ind++) {
		let dept = keys2[ind];
		let v = univagg[dept];
		
		if (CSRankings.useArithmeticMean || CSRankings.useHarmonicMean) {
		    v = (Math.floor(10000.0 * v) / (100.0));
		}
		if (CSRankings.useGeometricMean) {
		    v = (Math.floor(10.0 * v) / 10.0);
		}

		if ((ind >= minToRank) && (v != oldv)) {
		    break;
		}
		if (v === 0.0) {
		    break;
		}
		if (oldv != v) {
		    if (CSRankings.useDenseRankings) {
			rank = rank + 1;
		    } else {
			rank = rank + ties;
			ties = 0;
		    }
		}
		s += "\n<tr><td>" + rank + "</td>";
		s += "<font color=\"blue\"><td><span onclick=\"CSRankings.toggleFaculty('" + dept + "')\" class=\"hovertip\" id=\"" + dept + "-widget\">" + CSRankings.RightTriangle + "</span></font>&nbsp;" + dept;
		s += "&nbsp;<font color=\"blue\">" + "<span onclick=\"CSRankings.toggleChart('"
		    + escape(dept)
		    + "')\" class=\"hovertip\" id=\""
		    + escape(dept)
		    + "-widget\">" + CSRankings.PieChart + "</span></font>";
		//	    s += '<div style="display:none;" style="width: 100%; height: 350px;" id="' + escape(dept) + '">' + '</div>';
		s += "</td>";

		if (displayPercentages) {
		    /* Show average */
		    if (CSRankings.useArithmeticMean || CSRankings.useHarmonicMean) {
			s += '<td align="right">' + (Math.floor(10000.0 * v) / (100.0)).toPrecision(2)  + "%</td>";
		    }
		    if (CSRankings.useGeometricMean) {
			s += '<td align="right">' + (Math.floor(10.0 * v) / 10.0).toFixed(1)  + "</td>";
		    }
		} else {
		    /* Show count */
		    s += '<td align="right">' + (Math.floor(100.0 * v) / 100.0)  + "</td>";
		}
		s += '<td align="right">' + deptCounts[dept] + "<br />"; /* number of faculty */
		s += "</td>";
		s += "</tr>\n";
		s += '<tr><td colspan="4"><div style="display:none;" style="width: 100%; height: 350px;" id="'
		    + escape(dept)
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
		} else {
		    s += '<em><a class="only_these_areas" onClick="activateDenseRankings(); return false;"><font color="blue"><b>Using competition rankings. Click to use dense rankings.</b></font></a></em>';
		}
	    }
	    s += "</div>" + "</div>" + "\n";
	    s += "<br>" + "</body>" + "</html>";
	} else {
	    /* Nothing selected. */
	    s = "<h4>Please select at least one area.</h4>";
	}
	setTimeout((function(str : string) { CSRankings.redisplay(str); })(s), 0);
	return false; 
    }

    private static activateDenseRankings() : boolean {
	CSRankings.useDenseRankings = true;
	CSRankings.rank();
	return false;
    }

    private static deactivateDenseRankings() : boolean {
	CSRankings.useDenseRankings = false;
	CSRankings.rank();
	return false;
    }

}

function init() : void {
    var ranker = new CSRankings();
}

window.onload=init;
//	jQuery(document).ready(
