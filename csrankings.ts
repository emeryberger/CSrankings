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

const coauthorFile       = "faculty-coauthors.csv";
const authorinfoFile     = "generated-author-info.csv";
const countryinfoFile    = "country-info.csv";
const aliasFile          = "dblp-aliases.csv";
const homepagesFile      = "homepages.csv";
const allowRankingChange = false;   /* Can we change the kind of rankings being used? */
const showCoauthors      = false;
const maxCoauthors       = 30;      /* Max co-authors to display. */

const useArithmeticMean = false;
const useGeometricMean  = true;    /* This is the default and arguably only principled choice. */
const useHarmonicMean   = false;

var useDenseRankings    = false;   /* Set to true for "dense rankings" vs. "competition rankings". */

/* All the areas, in order by their 'field_' number (the checkboxes) in index.html. */

const areas : Array<string> = [ "ai", "vision", "mlmining",  "nlp",  "web", 
				"arch",  "networks",  "security", "database", "highperf", "mobile", "metrics", "opsys", "proglang", "softeng",
				"theory",  "crypto", "logic",
				"graphics", "hci", "robotics"];

const areaNames : Array<string> = ["AI", "Vision", "ML", "NLP", "Web & IR",
				   "Arch", "Networks", "Security", "DB", "HPC", "Mobile", "Metrics", "OS", "PL", "SE",
				   "Theory", "Crypto", "Logic",
				   "Graphics", "HCI", "Robotics"];

var areaDict : {[key : string] : string } = {};
var areaPosition : {[key : string] : number } = {};

/* Colors for all areas. */
const color : Array<string> =
    ["#f30000", "#0600f3", "#00b109", "#14e4b4", "#0fe7fb", "#67f200", "#ff7e00", "#8fe4fa", "#ff5300", "#640000", "#3854d1", "#d00ed8", "#7890ff", "#01664d", "#04231b", "#e9f117", "#f3228e", "#7ce8ca", "#ff5300", "#ff5300", "#7eff30", "#9a8cf6", "#79aff9", "#bfbfbf", "#56b510", "#00e2f6", "#ff4141",      "#61ff41" ];

const RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
const DownTriangle  = "&#9660;"; // downward-facing triangle symbol (expanded view)
const PieChart      = "&#9685;"; // symbol that looks close enough to a pie chart


function translateNameToDBLP(name : string) : string {
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
    var splitName = name.split(" ");
    var newname = "";
    var lastName = splitName[splitName.length - 1];
    splitName.pop();
    var newName = splitName.join(" ");
    newName = newName.replace(/\s/g, "_");
    newName = newName.replace(/\-/g, "=");
    var str = "http://dblp.uni-trier.de/pers/hd";
    var lastInitial = lastName[0].toLowerCase();
    str += "/" + lastInitial + "/" + lastName + ":" + newName;
    return str;
}


/* Build the areaDict dictionary: areas -> names used in pie charts
   and areaPosition dictionary: areas -> position in area array
*/
function initAreaDict() : void {
    for (var i = 0; i < areaNames.length; i++) {
	areaDict[areas[i]] = areaNames[i];
	areaPosition[areas[i]] = i;
    }
}

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


var authors   : Array<Author> = [];       /* The data which will hold the parsed CSV of author info. */
var coauthors : Array<Coauthor> = [];     /* The data which will hold the parsed CSV of co-author info. */
var countryInfo : {[key : string] : string } = {}; /* Maps institutions to (non-US) regions. */
var aliases : {[key : string] : string } = {}; /* Maps aliases to canonical author name. */
var homepages : {[key : string] : string } = {}; /* Maps names to home pages. */
var authorAreas : {[name : string] : {[area : string] : number } } = {};
/* Maps authors to the areas they have published in (for pie chart display). */

/* Create the prologue that we preface each generated HTML page with (the results). */
function makePrologue() : string {
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
function compareNames (a : string, b : string) : number {

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
    if (aLastName < bLastName) return -1;
    if (aLastName > bLastName) return 1;
    return 0;
}

function redisplay(str : string) : void {
    jQuery("#success").html(str);
}

/* Create a pie chart */
function makeChart(name : string) : void {
    console.assert (color.length >= areas.length, "Houston, we have a problem.");
    var data : any = [];
    var keys = areas;
    for (var i = 0; i < keys.length; i++) {
	data.push({ "label" : areaDict[keys[i]],
		    "value" : authorAreas[unescape(name)][keys[i]],
		    "color" : color[i] });
    }
    var pie = new d3pie(name + "-chart", {
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
function toggleChart(name : string) : void {
    var chart = document.getElementById(name+"-chart");
    var widget = document.getElementById(name+"-widget");
    if (chart.style.display == 'block') {
	chart.style.display = 'none';
	chart.innerHTML = '';
    } else {
	chart.style.display = 'block';
	makeChart(name);
    }
    
}

/* Expand or collape the view of all faculty in a department. */
function toggleFaculty(dept : string) : void {
    var e = document.getElementById(dept+"-faculty");
    var widget = document.getElementById(dept+"-widget");
    if (e.style.display == 'block') {
	e.style.display = 'none';
	widget.innerHTML = RightTriangle;
    } else {
	e.style.display = 'block';
	widget.innerHTML = DownTriangle;
    }
}

/* Set all checkboxes to true. */
function setAllCheckboxes() : void {
    for (var i = 1; i <= areas.length; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked', true);
    }
}

/* A convenience function for ending a pipeline of function calls executed in continuation-passing style. */
function nop() : void {}

function loadCoauthors(cont : () => void ) : void {
    Papa.parse(coauthorFile, {
	download : true,
	header: true,
	complete : function(results) {
	    var data : any = results.data;
	    coauthors = data as Array<Coauthor>;
	    cont();
	}
    });
}

function loadAliases(cont : ()=> void ) : void {
    Papa.parse(aliasFile, {
	header: true,
	download : true,
	complete : function(results) {
	    var data : any = results.data;
	    var d = data as Array<Alias>;
	    for (var i = 0; i < d.length; i++) {
		aliases[d[i].alias] = d[i].name;
	    }
	    cont();
	}
    });
}

function loadCountryInfo(cont : () => void ) : void {
    Papa.parse(countryinfoFile, {
	header: true,
	download : true,
	complete : function(results) {
	    var data : any = results.data;
	    var ci = data as Array<CountryInfo>;
	    for (var i = 0; i < ci.length; i++) {
		countryInfo[ci[i].institution] = ci[i].region;
	    }
	    cont();
	}
    });
}

function loadAuthorInfo(cont : () => void) : void {
    Papa.parse(authorinfoFile, {
	download : true,
	header : true,
	complete: function(results) {
	    var data : any = results.data;
	    authors = data as Array<Author>;
	    for (var i = 1; i <= areas.length; i++) {
		var str = 'input[name=field_'+i+']';
		(function(s : string) {
		    jQuery(s).click(function() {
			rank();
		    });})(str);
	    }
	    cont();
/*	    rank(); */
	}
    });
}

function loadHomepages(cont : ()=> void ) : void {
    Papa.parse(homepagesFile, {
	header: true,
	download : true,
	complete : function(results) {
	    var data : any = results.data;
	    var d = data as Array<HomePage>;
	    for (var i = 0; i < d.length; i++) {
		homepages[d[i].name] = d[i].homepage;
	    }
	    cont();
	}
    });
}

function init() : void {
    jQuery(document).ready(
	function() {
	    setAllCheckboxes();
	    initAreaDict();
	    loadAliases(function() {
		loadHomepages(function() {
		    loadAuthorInfo(function() {
			loadCountryInfo(rank);
		    });
		});
	    });
	});
}

function activateAll(value : boolean) : boolean {
    if (value === undefined) {
	value = true;
    }
    for (var i = 1; i <= areas.length; i++) {
	var str = "input[name=field_"+i+"]";
	jQuery(str).prop('checked', value);
    }
    rank();
    return false;
}

function activateNone() : boolean {
    return activateAll(false);
}

function activateFields(value : boolean, fields : Array<number>) : boolean {
    if (value === undefined) {
	value = true;
    }
    for (var i = 0; i <= fields.length; i++) {
	var str = "input[name=field_"+fields[i]+"]";
	jQuery(str).prop('checked', value);
    }
    rank();
    return false;
}

function activateSystems(value : boolean) : boolean {
    const systemsFields : Array<number> = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    return activateFields(value, systemsFields);
}

function activateAI(value : boolean) : boolean {
    const aiFields      : Array<number> = [1, 2, 3, 4, 5];
    return activateFields(value, aiFields);
}

function activateTheory(value : boolean) : boolean {
    const theoryFields  : Array<number> = [16, 17, 18];
    return activateFields(value, theoryFields);
}

function activateOthers(value : boolean) : boolean {
    const otherFields   : Array<number> = [19, 20, 21];
    return activateFields(value, otherFields);
}

function deactivateSystems() : boolean {
    return activateSystems(false);
}

function deactivateAI() : boolean {
    return activateAI(false);
}

function deactivateTheory() : boolean {
    return activateTheory(false);
}

function deactivateOthers() : boolean {
    return activateOthers(false);
}

function toggleAI(cb : any) : boolean {
    if (cb.checked) {
	activateAI(false);
    } else {
	activateAI(true);
    }
    return false;
}

function sortIndex(univagg : {[key: string] : number}) : string[] {
    var keys = Object.keys(univagg);
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

function computeCoauthors(coauthors : Array<Coauthor>,
			  startyear : number,
			  endyear : number,
			  weights : {[key:string] : number})
: {[key : string] : Set<string> }
{
    var coauthorList : {[key : string] : Set<string> } = {};
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

function countAuthorAreas(areacount : {[key:string] : number},
			  authors : Array<Author>,
			  startyear : number,
			  endyear : number,
			  weights : {[key:string] : number}) : void
			  
{
    /* Delete everything from authorAreas. */
    // Build up an associative array of depts.
    var depts : {[key:string] : number} = {}; 
    for (var r in authors) {
	// If we haven't seen this dept yet, add it.
	const dept = authors[r].dept;
	if (!depts.hasOwnProperty(dept)) {
	    depts[dept] = 1;
	}
	// Now trash the existing name entry.
	const name : string  = authors[r].name;
	if (authorAreas.hasOwnProperty(name)) {
	    delete authorAreas[name];
	}
    }
    // Clean up department entries, too.
    for (var d in depts) {
	if (authorAreas.hasOwnProperty(d)) {
	    delete authorAreas[d];
	}
    }
    /* Now rebuild. */
    for (var r in authors) {
	const dept  = authors[r].dept;
	const area  = authors[r].area;
	const count = parseFloat(authors[r].count);
	var name : string  = authors[r].name;
	if (name in aliases) {
	    name = aliases[name];
	}
	var year = authors[r].year;
	if ((weights[area] == 0) || (year < startyear) || (year > endyear)) {
	    continue;
	}
	if (!(name in authorAreas)) {
	    authorAreas[name] = {};
	    for (var area in areas) {
		authorAreas[name][area] = 0;
	    }
	}
	if (!(dept in authorAreas)) {
	    authorAreas[dept] = {};
	    for (var area in areas) {
		authorAreas[dept][area] = 0;
	    }
	}
	if (!(area in authorAreas[name])) {
	    authorAreas[name][area] = 0;
	}
	if (!(area in authorAreas[dept])) {
	    authorAreas[dept][area] = 0;
	}
	authorAreas[name][area] += count;
	authorAreas[dept][area] += count;
    }
    
}

function countPapers(areacount : {[key:string] : number},
		     areaAdjustedCount : {[key:string] : number},
		     areaDeptAdjustedCount  : {[key:string] : number},
		     authors : Array<Author>,
		     startyear : number,
		     endyear : number,
		     weights : {[key:string] : number}) : void
{
    /* Count the total number of papers (raw and adjusted) in each area. */
    for (var r in authors) {
	const area = authors[r].area;
	const dept = authors[r].dept;
	const year = authors[r].year;
	const areaDept = area+dept;
	areaDeptAdjustedCount[areaDept] = 0;
	if ((weights[area] == 0) || (year < startyear) || (year > endyear)) {
	    continue;
	}
	const count = parseFloat(authors[r].count);
	const adjustedCount = parseFloat(authors[r].adjustedcount);
	areacount[area] += count;
	areaAdjustedCount[area] += adjustedCount;
    }
}


function buildDepartments(areaDeptAdjustedCount : {[key:string] : number},
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
    var visited : {[key:string] : boolean} = {};            /* contains an author name if that author has been processed. */
    for (var r in authors) {
	const area : string = authors[r].area;
	const dept : string = authors[r].dept;
	switch (regions) {
	case "USA":
	    if (dept in countryInfo) {
		continue;
	    }
	    break;
	case "europe":
	    if (!(dept in countryInfo)) { // USA
		continue;
	    }
	    if (countryInfo[dept] != "europe") {
		continue;
	    }
	    break;
	case "canada":
	    if (!(dept in countryInfo)) { // USA
		continue;
	    }
	    if (countryInfo[dept] != "canada") {
		continue;
	    }
	    break;
	case "australasia":
	    if (!(dept in countryInfo)) { // USA
		continue;
	    }
	    if (countryInfo[dept] != "australasia") {
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
	if (weights[area] == 0) {
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
function computeStats(deptNames : {[key:string] : Array<string> },
		      areaAdjustedCount : {[key:string] : number},
		      areaDeptAdjustedCount : {[key:string] : number},
		      areas : Array<string>,
		      numAreas : number,
		      displayPercentages : boolean,
		      weights : {[key:string] : number})
: {[key: string] : number}
{
   
    var univagg : {[key: string] : number} = {};
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
	} else {
	    univagg[dept] = 0;
	}
	for (var ind = 0; ind < areas.length; ind++) {
	    var area = areas[ind];
	    var areaDept = area+dept;
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
		    } else {
			/* n--; */
		    }
		} else {
		    univagg[dept] += areaDeptAdjustedCount[areaDept];
		}
	    }
	}
	if (displayPercentages) {
	    if (useArithmeticMean) {
		univagg[dept] = univagg[dept] / numAreas;
	    }
	    if (useGeometricMean) {
		univagg[dept] = Math.pow(univagg[dept], 1/numAreas);
	    }
	    if (useHarmonicMean) {
		univagg[dept] = numAreas / univagg[dept];
	    }
	}
    }
    return univagg;
}

function rank() : boolean {
    var form = document.getElementById("rankform");
    var s : string = "";
    var deptNames : {[key: string] : Array<string> } = {};              /* names of departments. */
    var deptCounts : {[key: string] : number} = {};         /* number of faculty in each department. */
    var facultycount : {[key: string] : number} = {};       /* name + dept -> raw count of pubs per name / department */
    var facultyAdjustedCount : {[key: string] : number} = {}; /* name + dept -> adjusted count of pubs per name / department */
    var weights : {[key: string] : number} = {};            /* array to hold 1 or 0, depending on if the area is checked or not. */
    var areacount : {[key: string] : number} = {};          /* raw number of papers in each area */
    var areaAdjustedCount : {[key: string] : number} = {};  /* adjusted number of papers in each area (split among faculty authors). */
    var areaDeptAdjustedCount : {[key: string] : number} = {}; /* as above, but for area+dept. */
    
    const startyear          = parseInt(jQuery("#startyear").find(":selected").text());
    const endyear            = parseInt(jQuery("#endyear").find(":selected").text());
    const displayPercentages = Boolean(parseInt(jQuery("#displayPercent").find(":selected").val()));
    /* Show the top N (with more if tied at the end) */
    var minToRank            = parseInt(jQuery("#minToRank").find(":selected").val());
    const whichRegions       = jQuery("#regions").find(":selected").val();

    var numAreas = 0; /* Total number of areas checked */

    /* Update the 'weights' of each area from the checkboxes. */
    for (var ind = 0; ind < areas.length; ind++) {
	weights[areas[ind]] = jQuery('input[name=field_'+(ind+1)+']').prop('checked') ? 1 : 0;
	if (weights[areas[ind]] == 1) {
	    /* One more area checked. */
	    numAreas++;
	}
	areacount[areas[ind]] = 0;
	areaAdjustedCount[areas[ind]] = 0;
    }

    var coauthorList : {[key : string] : Set<string> } = {};
    if (showCoauthors) {
	coauthorList = computeCoauthors(coauthors, startyear, endyear, weights);
    }
    countPapers(areacount, areaAdjustedCount, areaDeptAdjustedCount, authors, startyear, endyear, weights);
    countAuthorAreas(areacount, authors, startyear, endyear, weights);
    buildDepartments(areaDeptAdjustedCount, deptCounts, deptNames, facultycount, facultyAdjustedCount, authors, startyear, endyear, weights, whichRegions);
    
    /* (university, total or average number of papers) */
    var univagg = computeStats(deptNames, areaAdjustedCount, areaDeptAdjustedCount, areas, numAreas, displayPercentages, weights);

    var univtext : {[key:string] : string} = {};

    /* Canonicalize names. */
    for (dept in deptNames) {
	for (var ind = 0; ind < deptNames[dept].length; ind++) {
	    name = deptNames[dept][ind];
	    if (name in aliases) {
		deptNames[dept][ind] = aliases[name];
		if (!(aliases[name]+dept in facultycount)) {
		    facultycount[aliases[name]+dept] = facultycount[name+dept];
		    facultyAdjustedCount[aliases[name]+dept] = facultyAdjustedCount[name+dept];
		} else {
		    facultycount[aliases[name]+dept] += facultycount[name+dept];
		    facultyAdjustedCount[aliases[name]+dept] += facultyAdjustedCount[name+dept];
		}
	    }
	}
    }
    
    /* Build drop down for faculty names and paper counts. */
    for (dept in deptNames) {
	var p = '<div class="row"><div class="table"><table class="table-striped" width="100%"><thead><th></th><td><small><em><abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">Raw&nbsp;\#&nbsp;Pubs</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Count divided by number of co-authors">Adjusted&nbsp;&nbsp;\#</abbr></em></small></td></thead><tbody>';
	/* Build a dict of just faculty from this department for sorting purposes. */
	var fc : {[key:string] : number} = {};
	for (var ind = 0; ind < deptNames[dept].length; ind++) {
	    name = deptNames[dept][ind];
	    fc[name] = facultycount[name+dept];
	}
	var keys = Object.keys(fc);
	keys.sort(function(a : string, b : string){ return fc[b] - fc[a];});
	for (var ind = 0; ind < keys.length; ind++) {
	    name = keys[ind];
	    if (showCoauthors) {
		/* Build up text for co-authors. */
		var coauthorStr = "";
		if ((!(name in coauthorList)) || (coauthorList[name].size == 0)) {
		    coauthorList[name] = new Set([]);
		    coauthorStr = "(no senior co-authors on these papers)";
		} else {
		    coauthorStr = "Senior co-authors on these papers:\n";
		}
		/* Sort it by last name. */
		var l : Array<string> = [];
		coauthorList[name].forEach(function (item, coauthors) {
		    l.push(item);
		});
		if (l.length > maxCoauthors) {
		    coauthorStr = "(more than "+maxCoauthors+" senior co-authors)";
		} else {
		    l.sort(compareNames);
		    l.forEach(function (item, coauthors) {
			coauthorStr += item + "\n";
		    });
		    /* Trim off the trailing newline. */
		    coauthorStr = coauthorStr.slice(0,coauthorStr.length-1);
		}
	    }

	    p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
		+ '<a title="Click for author\'s home page." target="_blank" href="'
		+ encodeURI(homepages[name])
		+ '">' 
		+ name
		+ '</a>&nbsp;'
		+ "<span onclick=\"toggleChart('"
		+ escape(name)
		+ "')\" class=\"hovertip\" ><font color=\"blue\">" + PieChart + "</font></span>"
		+ '</small>'
		+ '</td><td align="right"><small>'
		+ '<a title="Click for author\'s DBLP entry." target="_blank" href="'
		+ translateNameToDBLP(name) + '">'
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
    var s = makePrologue();

    if (displayPercentages) {
	s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean number of papers published across all areas.">Average&nbsp;Count</abbr></th><th align="right">&nbsp;&nbsp;&nbsp;<abbr title="Number of faculty who have published in these areas.">Faculty</abbr></th></th></tr></thead>';
    } else {
	s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right">Adjusted&nbsp;Pub&nbsp;Count</th><th align="right">&nbsp;&nbsp;&nbsp;Faculty</th></tr></thead>';
    }
    s = s + "<tbody>";
    /* As long as there is at least one thing selected, compute and display a ranking. */
    if (numAreas > 0) {
	var ties = 1;        /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
	var rank = 0;        /* index */
	var oldv : any = null;     /* old number - to track ties */
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
		} else {
		    rank = rank + ties;
		    ties = 0;
		}
	    }
	    s += "\n<tr><td>" + rank + "</td>";
	    s += "<font color=\"blue\"><td><span onclick=\"toggleFaculty('" + dept + "')\" class=\"hovertip\" id=\"" + dept + "-widget\">" + RightTriangle + "</span></font>&nbsp;" + dept;
	    s += "&nbsp;<font color=\"blue\">" + "<span onclick=\"toggleChart('"
		+ escape(dept)
		+ "')\" class=\"hovertip\" id=\""
		+ escape(dept)
		+ "-widget\">" + PieChart + "</span></font>";
//	    s += '<div style="display:none;" style="width: 100%; height: 350px;" id="' + escape(dept) + '">' + '</div>';
	    s += "</td>";

	    if (displayPercentages) {
		/* Show average */
		if (useArithmeticMean || useHarmonicMean) {
		    s += '<td align="right">' + (Math.floor(10000.0 * v) / (100.0)).toPrecision(2)  + "%</td>";
		}
		if (useGeometricMean) {
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
	if (allowRankingChange) {
	    /* Disable option to change ranking approach for now. */
	    if (useDenseRankings) {
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
    setTimeout((function(str : string) { redisplay(str); })(s), 0);
    return false; 
}

function activateDenseRankings() : boolean {
    useDenseRankings = true;
    rank();
    return false;
}

function deactivateDenseRankings() : boolean {
    useDenseRankings = false;
    rank();
    return false;
}

window.onload=init;
