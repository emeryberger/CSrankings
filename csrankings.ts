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

interface Article {
    readonly name : string;
    readonly conf : string;
    readonly area : string;
    readonly subarea : string;
    readonly year : number;
    readonly title : string;
    readonly institution : string;
};

interface Author {
    readonly name : string;
    readonly dept : string;
    readonly area : string;
    readonly subarea : string;
    readonly count : string;
    readonly adjustedcount : string;
    readonly year : number;
};

interface Coauthor {
    readonly author : string;
    readonly coauthor : string;
    readonly year : number;
    readonly area : string;
};

interface CountryInfo {
    readonly institution : string;
    readonly region : "USA" | "europe" | "canada" | "northamerica" | "australasia" | "asia" | "world";
};

interface Alias {
    readonly alias : string;
    readonly name : string;
};

interface HomePage {
    readonly name : string;
    readonly homepage : string;
};

interface AreaMap {
    readonly area : string;
    readonly title : string;
};

interface ChartData {
    readonly label : string;
    readonly value : number;
    readonly color : string;
};

class CSRankings {
    
    constructor() {
	/* Build the areaDict dictionary: areas -> names used in pie charts
	   and areaPosition dictionary: areas -> position in area array
	*/
	for (let position = 0; position < CSRankings.areaMap.length; position++) {
	    const { area, title } = CSRankings.areaMap[position];
	    CSRankings.areas[position]     = area;
	    CSRankings.areaNames[position] = title;
	    CSRankings.fields[position]    = area;
	    CSRankings.areaDict[area]      = CSRankings.areaNames[position];
	    CSRankings.areaPosition[area]  = position;
	}
	for (let area of CSRankings.aiAreas) {
	    CSRankings.aiFields.push (CSRankings.areaPosition[area]);
	}
	for (let area of CSRankings.systemsAreas) {
	    CSRankings.systemsFields.push (CSRankings.areaPosition[area]);
	}
	for (let area of CSRankings.theoryAreas) {
	    CSRankings.theoryFields.push (CSRankings.areaPosition[area]);
	}
	for (let area of CSRankings.interdisciplinaryAreas) {
	    CSRankings.otherFields.push (CSRankings.areaPosition[area]);
	}
	// CSRankings.setAllCheckboxes();
	let next = ()=> {
	    CSRankings.loadAliases(CSRankings.aliases, function() {
		CSRankings.loadHomepages(CSRankings.homepages,
					 function() {
					     CSRankings.loadAuthorInfo(function() {
						 CSRankings.loadCountryInfo(CSRankings.countryInfo,
									    CSRankings.rank);
					     });
					 });
	    });
	};
	CSRankings.activateAll();
	if (CSRankings.showCoauthors) {
	    CSRankings.loadCoauthors(next);
	} else {
	    next();
	}
    }

    private static readonly coauthorFile       = "faculty-coauthors.csv";
    private static readonly authorinfoFile     = "generated-author-info.csv";
    private static readonly countryinfoFile    = "country-info.csv";
    private static readonly aliasFile          = "dblp-aliases.csv";
    private static readonly homepagesFile      = "homepages.csv";
    private static readonly allowRankingChange = false;   /* Can we change the kind of rankings being used? */
    private static readonly showCoauthors      = false;
    private static readonly maxCoauthors       = 30;      /* Max co-authors to display. */

    private static readonly parentMap : {[key : string] : string }
	= { 'aaai' : 'ai',
	    'ijcai' : 'ai',
	    'cvpr' : 'vision',
	    'eccv' : 'vision',
	    'iccv' : 'vision'
	  };
    
    private static readonly childMap : {[key : string] : [string] }
	= { 'ai' : ['aaai', 'ijcai'],
	    'vision' : ['cvpr', 'eccv', 'iccv'] };
    
    private static readonly areaMap : Array<AreaMap>
	= [ { area : "ai", title : "AI" },
//	    { area : "aaai", title : "AI" },
//	    { area : "ijcai", title : "AI" },
	    { area : "vision", title : "Vision" },
//	    { area : "cvpr", title : "Vision" },
//	    { area : "eccv", title : "Vision" },
//	    { area : "iccv", title : "Vision" },
	    { area : "mlmining", title : "ML" },
	    { area : "nlp",  title : "NLP" },
	    { area : "ir", title : "Web & IR" },
	    { area : "arch", title : "Arch" },
	    { area : "comm", title : "Networks"},
	    { area : "sec", title : "Security"},
	    { area : "mod", title : "DB"},
	    { area : "hpc", title : "HPC"},
	    { area : "mobile", title : "Mobile"},
	    { area : "metrics", title : "Metrics"},
	    { area : "ops", title : "OS" },
	    { area : "plan", title : "PL" },
	    { area : "soft", title : "SE" },
	    { area : "act", title : "Theory" },
	    { area : "crypt", title: "Crypto" },
	    { area : "log", title : "Logic" },
	    { area : "graph", title : "Graphics" },
	    { area : "chi", title : "HCI" },
	    { area : "robotics", title : "Robotics" },
	    { area : "bio", title : "Comp. Biology" },
	    { area : "da", title : "EDA" },
	    { area : "bed", title : "Embedded" },
	    { area : "vis", title : "Visualization" }
	    //,{ area : "ecom", title : "ECom" }
	    //,{ area : "cse", title : "CSEd" }
	  ];

    private static readonly aiAreas      = [ "ai", "vision", "mlmining", "nlp", "ir" ];
    private static readonly systemsAreas = [ "arch", "comm", "sec", "mod", "hpc", "mobile", "metrics", "ops", "plan", "soft", "da", "bed" ];
    private static readonly theoryAreas  = [ "act", "crypt", "log" ];
    private static readonly interdisciplinaryAreas   = [ "graph", "chi", "robotics", "bio", "vis", "ecom" ];
    
    private static readonly areas : Array<string> = [];
    private static readonly areaNames : Array<string> = [];
    private static readonly fields : Array<string> = [];
    private static readonly aiFields : Array<number> = [];
    private static readonly systemsFields : Array<number> = [];
    private static readonly theoryFields : Array<number> = [];
    private static readonly otherFields : Array<number> = [];
    
    /* Map area to its name (from areaNames). */
    private static readonly areaDict : {[key : string] : string } = {};

    /* Map area to its position in the list. */
    private static readonly areaPosition : {[key : string] : number } = {};

    /* Map aliases to canonical author name. */
    private static readonly aliases : {[key : string] : string } = {};

    /* Map institution to (non-US) region. */
    private static readonly countryInfo : {[key : string] : string } = {};

    private static articles : Array<Article>;
    
    /* Map name to home page. */
    private static readonly homepages : {[key : string] : string } = {}; 

    /* Set to true for "dense rankings" vs. "competition rankings". */
    private static readonly useDenseRankings : boolean = false;    

    /* The data which will hold the parsed CSV of author info. */
    private static authors   : Array<Author> = [];

    /* The data which will hold the parsed CSV of co-author info. */    
    private static coauthors : Array<Coauthor> = [];
    
    /* Map authors to the areas they have published in (for pie chart display). */
    private static authorAreas : {[name : string] : {[area : string] : number } } = {};

    /* Computed stats (univagg). */
    private static stats : {[key: string] : number} = {};

    private static areaDeptAdjustedCount : {[key: string] : number} = {}; /* area+dept */
    
    /* Colors for all areas. */
    private static readonly color : Array<string> =
	["#f30000", "#0600f3", "#00b109", "#14e4b4", "#0fe7fb", "#67f200", "#ff7e00", "#8fe4fa", "#ff5300", "#640000", "#3854d1", "#d00ed8", "#7890ff", "#01664d", "#04231b", "#e9f117", "#f3228e", "#7ce8ca", "#ff5300", "#ff5300", "#7eff30", "#9a8cf6", "#79aff9", "#bfbfbf", "#56b510", "#00e2f6", "#ff4141",      "#61ff41" ];

    private static readonly RightTriangle = "&#9658;"; // right-facing triangle symbol (collapsed view)
    private static readonly DownTriangle  = "&#9660;"; // downward-facing triangle symbol (expanded view)
    private static readonly PieChart      = "&#9685;"; // symbol that looks close enough to a pie chart

    private static translateNameToDBLP(name : string) : string {
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
	let splitName = name.split(" ");
	let lastName = splitName[splitName.length - 1];
	let disambiguation = ""
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
	let str = "http://dblp.uni-trier.de/pers/hd";
	const lastInitial = lastName[0].toLowerCase();
	str += "/" + lastInitial + "/" + lastName + ":" + newName;
	return str;
    }

    /* Create the prologue that we preface each generated HTML page with (the results). */
    private static makePrologue() : string {
	const s = "<html>"
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
	const aName = a.split(" ");
	const bName = b.split(" ");

	// get the last names by selecting
	// the last element in the name arrays
	// using array.length - 1 since full names
	// may also have a middle name or initial
	const aLastName = aName[aName.length - 1];
	const bLastName = bName[bName.length - 1];

	// compare the names and return either
	// a negative number, positive number
	// or zero.
	if (aLastName < bLastName) return -1;
	if (aLastName > bLastName) return 1;
	return 0;
    }

    /* Create a pie chart */
    private static makeChart(name : string) : void
    {
	console.assert (CSRankings.color.length >= CSRankings.areas.length, "Houston, we have a problem.");
	let data : Array<ChartData> = [];
	let datadict : {[key : string] : number } = {};
	const keys = CSRankings.areas;
	const uname = unescape(name);
	for (let i = 0; i < keys.length; i++) {
	    let key = keys[i];
	    let value = CSRankings.authorAreas[uname][key];
	    // Use adjusted count if this is for a department.
	    if (uname in CSRankings.stats) {
		value = CSRankings.areaDeptAdjustedCount[key+uname] + 1;
		if (value == 1) {
		    value = 0;
		}
	    }
	    // Round it to the nearest 0.1.
	    value = Math.round(value * 10) / 10;
	    if (value > 0) {
		if (key in CSRankings.parentMap) {
		    // key = CSRankings.parentMap[key];
		}
		if (!(key in datadict)) {
		    datadict[key] = 0;
		}
		datadict[key] += value;
	    }
	}
	for (let key in datadict) {
	    data.push({ "label" : CSRankings.areaDict[key],
			"value" : datadict[key],
			"color" : CSRankings.color[CSRankings.areaPosition[key]] });
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
		},
	    },
	    "labels": {
		"outer": {
		    "pieDistance": 32
		},
		"inner": {
		    //"format": "percentage", // "value",
		    //"hideWhenLessThanPercentage": 0 // 2 // 100 // 2
		    "format": "value",
		    "hideWhenLessThanPercentage": 2 // 100 // 2
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

    private static loadCoauthors(cont : () => void ) : void {
	Papa.parse(CSRankings.coauthorFile, {
	    download : true,
	    header: true,
	    complete : (results)=> {
		const data : any = results.data;
		CSRankings.coauthors = data as Array<Coauthor>;
		setTimeout(cont, 0);
	    }
	});
    }
    
    
    private static loadAliases(aliases: {[key : string] : string },
			       cont : ()=> void ) : void {
	Papa.parse(CSRankings.aliasFile, {
	    header: true,
	    download : true,
	    complete : (results)=> {
		const data : any = results.data;
		const d = data as Array<Alias>;
		for (let aliasPair of d) {
		    aliases[aliasPair.alias] = aliasPair.name;
		}
		setTimeout(cont, 0);
	    }
	});
    }

    private static loadArticles(cont : () => void) : void {
	jQuery.getJSON("articles.json", (_ : Array<Article>) => {
/* disabled for now
	    CSRankings.articles = data; */
	    setTimeout(cont, 0);
	});
    }
    
    private static loadCountryInfo(countryInfo : {[key : string] : string },
				   cont : () => void ) : void {
	Papa.parse(CSRankings.countryinfoFile, {
	    header: true,
	    download : true,
	    complete : (results)=> {
		const data : any = results.data;
		const ci = data as Array<CountryInfo>;
		for (let info of ci) {
		    countryInfo[info.institution] = info.region;
		}
		setTimeout(cont, 0);
	    }
	});
    }

    private static loadAuthorInfo(cont : () => void) : void {
	Papa.parse(CSRankings.authorinfoFile, {
	    download : true,
	    header : true,
	    complete: (results)=> {
		const data : any = results.data;
		this.authors = data as Array<Author>;
		for (let i = 0; i < CSRankings.fields.length; i++) {
		    const str = 'input[name='+CSRankings.fields[i]+']';
		    jQuery(str).click(()=>{
/*			if (jQuery(str).hasClass("parent")) {
			    // Parent (un)checked => all children (un)checked
			    let isChecked = jQuery(str).prop('checked');
			    let parent = CSRankings.fields[i];
			    for (let kid of CSRankings.childMap[parent]) {
				jQuery("input[name="+kid+"]").prop('checked', isChecked);
			    }
			}
			if (jQuery(str).hasClass("child")) {
			    let s = jQuery(str).attr("id");
			    let parent = CSRankings.parentMap[s];
			    // Uncheck a child => uncheck the parent.
			    if (!jQuery("input[name="+CSRankings.fields[i]+"]").prop('checked')) {
				jQuery("input[name="+parent+"]").prop('checked', false);
			    } else {
				// All children checked => check the parent.
				let v = true;
				for (let kid of CSRankings.childMap[parent]) {
				    let checked = jQuery("input[name="+kid+"]").prop('checked');
				    if (!checked) {
					v = false;
					break;
				    }
				}
				if (v) {
				    jQuery("input[name="+parent+"]").prop('checked', true);
				}
			    }
			} */
			this.rank();
		    });
		}
		setTimeout(cont, 0);
	    }
	});
    }

    private static loadHomepages(homepages : {[key : string] : string },
				 cont : ()=> void ) : void {
	Papa.parse(CSRankings.homepagesFile, {
	    header: true,
	    download : true,
	    complete : (results)=> {
		const data : any = results.data;
		const d = data as Array<HomePage>;
		for (let namePage of d) {
		    if (typeof namePage.homepage === 'undefined') {
        		continue
		    }
		    homepages[namePage.name.trim()] = namePage.homepage.trim();
		}
		setTimeout(cont, 0);
	    }
	});
    }


    private static inRegion(dept : string,
			    regions : string): boolean
    {
	switch (regions) {
	case "world":
	    break;
	case "USA":
	    if (dept in CSRankings.countryInfo) {
		return false;
	    }
	    break;
	case "europe":
	    if (!(dept in CSRankings.countryInfo)) { // USA
		return false;
	    }
	    if (CSRankings.countryInfo[dept] != "europe") {
		return false;
	    }
	    break;
	case "canada":
	    if (!(dept in CSRankings.countryInfo)) { // USA
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
	    if (!(dept in CSRankings.countryInfo)) { // USA
		return false;
	    }
	    if (CSRankings.countryInfo[dept] != "australasia") {
		return false;
	    }
	    break;
	case "southamerica":
	    if (!(dept in CSRankings.countryInfo)) { // USA
		return false;
	    }
	    if (CSRankings.countryInfo[dept] != "southamerica") {
		return false;
	    }
	    break;
	case "asia":
	    if (!(dept in CSRankings.countryInfo)) { // USA
		return false;
	    }
	    if (CSRankings.countryInfo[dept] != "asia") {
		return false;
	    }
	    break;
	}
	return true;
    }
    
    private static activateFields(value : boolean,
				  fields : Array<number>) : boolean
    {
	for (let i = 0; i < fields.length; i++) {
	    const str = "input[name=" + CSRankings.fields[fields[i]] + "]";
	    jQuery(str).prop('checked', value);
	}
	CSRankings.rank();
	return false;
    }

    private static sortIndex(univagg : {[key: string] : number}) : string[]
    {
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
	    const { author, coauthor, year, area } = coauthors[c];
	    if ((weights[area] === 0) || (year < startyear) || (year > endyear)) {
		continue;
	    }
	    if (!(author in coauthorList)) {
		coauthorList[author] = new Set([]);
	    }
	    coauthorList[author].add(coauthor);
	}
	return coauthorList;
    }

    private static countAuthorAreas(authors : Array<Author>,
				    startyear : number,
				    endyear : number,
				    weights : {[key:string] : number},
				    authorAreas : {[name : string] : {[area : string] : number }}) : void
    
    {
	for (let r in authors) {
	    if (!authors.hasOwnProperty(r)) {
		continue;
	    }
	    const auth = authors[r];
	    const year = auth.year;
	    if ((year < startyear) || (year > endyear)) {
		continue;
	    }
	    const theArea  = auth.area;
	    if (weights[theArea] === 0) {
		continue;
	    }
	    const theDept  = auth.dept;
	    const theCount = parseFloat(auth.count);
//	    const theCount = parseFloat(auth.adjustedcount);
	    let name : string  = auth.name;
	    if (name in CSRankings.aliases) {
		name = CSRankings.aliases[name];
	    }
	    if (!(name in authorAreas)) {
		authorAreas[name] = {};
		for (let area in CSRankings.areaDict) {
		    if (CSRankings.areaDict.hasOwnProperty(area)) {
			authorAreas[name][area] = 0;
		    }
		}
	    }
	    if (!(theDept in authorAreas)) {
		authorAreas[theDept] = {};
		for (let area in CSRankings.areaDict) {
		    if (CSRankings.areaDict.hasOwnProperty(area)) {
			authorAreas[theDept][area] = 0;
		    }
		}
	    }
	    authorAreas[name][theArea] += theCount;
	    authorAreas[theDept][theArea] += theCount;
	}
    }

    /* Build the dictionary of departments (and count) to be ranked. */
    private static buildDepartments(authors : Array<Author>,
				    startyear : number,
				    endyear : number,
				    weights : {[key:string] : number},
				    regions : string,
				    areaDeptAdjustedCount : {[key:string] : number},
				    deptCounts : {[key:string] : number},
				    deptNames  : {[key:string] : Array<string>},
				    facultycount : {[key:string] : number},
				    facultyAdjustedCount : {[key:string] : number}) : void
    {
	/* contains an author name if that author has been processed. */
	let visited : {[key:string] : boolean} = {}; 
	for (let r in authors) {
	    if (!authors.hasOwnProperty(r)) {
		continue;
	    }
	    let { name, year, area, dept } = authors[r];
	    if (name in CSRankings.aliases) {
		name = CSRankings.aliases[name];
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
	    const areaDept : string = area+dept;
	    const nameDept : string = name+dept;
	    if (!(areaDept in areaDeptAdjustedCount)) {
		areaDeptAdjustedCount[areaDept] = 0;
	    }
	    const count : number = parseInt(authors[r].count);
	    const adjustedCount : number = parseFloat(authors[r].adjustedcount);
	    areaDeptAdjustedCount[areaDept] += adjustedCount;
	    /* Is this the first time we have seen this person? */
	    if (!(name in visited)) {
		visited[name] = true;
		facultycount[nameDept] = 0;
		facultyAdjustedCount[nameDept] = 0;
		if (!(dept in deptCounts)) {
		    deptCounts[dept] = 0;
		    deptNames[dept] = <Array<string>>[];
		}
		deptNames[dept].push(name);
		deptCounts[dept] += 1;
	    }
	    facultycount[nameDept] += count;
	    facultyAdjustedCount[nameDept] += adjustedCount;
	}
    }

    /* Compute aggregate statistics. */
    private static computeStats(deptNames : {[key:string] : Array<string> },
				areaDeptAdjustedCount : {[key:string] : number},
				areas : Array<string>,
				numAreas : number,
				displayPercentages : boolean,
				weights : {[key:string] : number})
    : {[key: string] : number}
    {
	CSRankings.stats = {};
	let univagg : {[key: string] : number} = {};
	for (let dept in deptNames) {
	    if (!deptNames.hasOwnProperty(dept)) {
		continue;
	    }
	    if (displayPercentages) {
		univagg[dept] = 1;
	    } else {
		univagg[dept] = 0;
	    }
	    for (let area of areas) {
		// If the area is a child, ignore it.
		if (area in CSRankings.parentMap) {
		    continue;
		}
		let areaDept = area+dept;
		if (!(areaDept in areaDeptAdjustedCount)) {
		    areaDeptAdjustedCount[areaDept] = 0;
		}
		if (weights[area] != 0) {
		    if (displayPercentages) {
			// Adjusted (smoothed) geometric mean.
			univagg[dept] *= (areaDeptAdjustedCount[areaDept] + 1.0);
		    } else {
			univagg[dept] += areaDeptAdjustedCount[areaDept];
		    }
		}
	    }
	    if (displayPercentages) {
		// finally compute geometric mean.
		univagg[dept] = Math.pow(univagg[dept], 1/numAreas);
	    }
	}
	return univagg;
    }

    /* Updates the 'weights' of each area from the checkboxes. */
    /* Returns the number of areas selected (checked). */
    private static updateWeights(weights : {[key: string] : number}) : number
    {
	let numAreas = 0;
	for (let ind = 0; ind < CSRankings.areas.length; ind++) {
	    let area = CSRankings.areas[ind];
	    weights[area] = jQuery('input[name=' + CSRankings.fields[ind] + ']').prop('checked') ? 1 : 0;
	    if (weights[area] === 1) {
		/* One more area checked. */
		numAreas++;
	    }
	}
	return numAreas;
    }

    private static canonicalizeNames(deptNames : {[key: string] : Array<string> },
				     facultycount :  {[key: string] : number},
				     facultyAdjustedCount: {[key: string] : number}) : void
    {
	for (let dept in deptNames) {
	    if (!deptNames.hasOwnProperty(dept)) {
		continue;
	    }
	    for (let ind = 0; ind < deptNames[dept].length; ind++) {
		let name = deptNames[dept][ind];
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
    }

    /* Build drop down for faculty names and paper counts. */
    private static buildDropDown(deptNames : {[key: string] : Array<string> },
				 facultycount :  {[key: string] : number},
				 facultyAdjustedCount: {[key: string] : number},
				 coauthorList : {[key : string] : Set<string> })
    : {[key: string] : string}
    {
	let univtext : {[key:string] : string} = {};

	for (let dept in deptNames) {
	    if (!deptNames.hasOwnProperty(dept)) {
		continue;
	    }
	    
	    let p = '<div class="row"><div class="table"><table class="table-striped" width="100%"><thead><th></th><td><small><em><abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">Raw&nbsp;\#&nbsp;Pubs</abbr></em></small></td><td align="right"><small><em>&nbsp;&nbsp;<abbr title="Count divided by number of co-authors">Adjusted&nbsp;&nbsp;\#</abbr></em></small></td></thead><tbody>';
	    /* Build a dict of just faculty from this department for sorting purposes. */
	    let fc : {[key:string] : number} = {};
	    for (let name of deptNames[dept]) {
		fc[name] = facultycount[name+dept];
	    }
	    let keys = Object.keys(fc);
	    keys.sort(function(a : string, b : string){
		if (fc[b] === fc[a]) {
		    let fb = Math.round(10.0 * facultyAdjustedCount[b+dept]) / 10.0;
		    let fa = Math.round(10.0 * facultyAdjustedCount[a+dept]) / 10.0;
		    if (fb === fa) {
			return CSRankings.compareNames(a, b);
		    }
		    return fb - fa;
		} else {
		    return fc[b] - fc[a];
		}
	    });
	    for (let name of keys) {
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
		    coauthorList[name].forEach((item, _)=>{
			l.push(item);
		    });
		    if (l.length > CSRankings.maxCoauthors) {
			coauthorStr = "(more than "+CSRankings.maxCoauthors+" senior co-authors)";
		    } else {
			l.sort(CSRankings.compareNames);
			l.forEach((item, _)=>{
			    coauthorStr += item + "\n";
			});
			/* Trim off the trailing newline. */
			coauthorStr = coauthorStr.slice(0,coauthorStr.length-1);
		    }
		}

		let homePage = encodeURI(CSRankings.homepages[name]);
		let dblpName = CSRankings.translateNameToDBLP(name);
		
		p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
		    + '<a title="Click for author\'s home page." target="_blank" href="'
		    + homePage
		    + '" '
		    + 'onclick="trackOutboundLink(\''
		    + homePage
		    + '\', true); return false;"'
		    + '>' 
		    + name
		    + '</a>&nbsp;'
		    + "<span onclick=\"CSRankings.toggleChart('"
		    + escape(name)
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
		    + fc[name]
		    + '</a>'
		    + "</small></td>"
		    + '<td align="right"><small>'
		//		+ '<abbr title="' + coauthorStr + '">'
		    + (Math.round(10.0 * facultyAdjustedCount[name+dept]) / 10.0).toFixed(1)
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
	return univtext;
    }


    private static buildOutputString(displayPercentages : boolean,
				     numAreas : number,
			             univagg : {[key: string] : number},
				     deptCounts: {[key: string] : number},
				     univtext: {[key:string] : string}) : string
    {
	let s = CSRankings.makePrologue();
	/* Show the top N (with more if tied at the end) */
	let minToRank            = parseInt(jQuery("#minToRank").find(":selected").val());

	if (displayPercentages) {
	    s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right"><abbr title="Geometric mean count of papers published across all areas.">Average&nbsp;Count</abbr></th><th align="right">&nbsp;&nbsp;&nbsp;<abbr title="Number of faculty who have published in these areas.">Faculty</abbr></th></th></tr></thead>';
	} else {
	    s = s + '<thead><tr><th align="left">Rank&nbsp;&nbsp;</th><th align="right">Institution&nbsp;&nbsp;</th><th align="right">Adjusted&nbsp;Pub&nbsp;Count</th><th align="right">&nbsp;&nbsp;&nbsp;Faculty</th></tr></thead>';
	}
	s = s + "<tbody>";
	/* As long as there is at least one thing selected, compute and display a ranking. */
	if (numAreas > 0) {
	    let ties = 1;               /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
	    let rank = 0;               /* index */
	    let oldv = 9999999.999;     /* old number - to track ties */
	    /* Sort the university aggregate count from largest to smallest. */
	    let keys2 = CSRankings.sortIndex(univagg);
	    /* Display rankings until we have shown `minToRank` items or
	       while there is a tie (those all get the same rank). */
	    for (let ind = 0; ind < keys2.length; ind++) {
		const dept = keys2[ind];
		const v = Math.round(10.0 * univagg[dept]) / 10.0;

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
		const esc = escape(dept);
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

		s += '<td align="right">' + (Math.round(10.0 * v) / 10.0).toFixed(1)  + "</td>";
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
	return s;
    }

    /* Set all checkboxes to true. */
    private static setAllCheckboxes() : void {
	CSRankings.activateAll();
    }

    /* PUBLIC METHODS */
    
    public static rank() : boolean {
	let deptNames : {[key: string] : Array<string> } = {};              /* names of departments. */
	let deptCounts : {[key: string] : number} = {};         /* number of faculty in each department. */
	let facultycount : {[key: string] : number} = {};       /* name + dept -> raw count of pubs per name / department */
	let facultyAdjustedCount : {[key: string] : number} = {}; /* name + dept -> adjusted count of pubs per name / department */
	let currentWeights : {[key: string] : number} = {};            /* array to hold 1 or 0, depending on if the area is checked or not. */
	CSRankings.areaDeptAdjustedCount = {};
	
	const startyear          = parseInt(jQuery("#startyear").find(":selected").text());
	const endyear            = parseInt(jQuery("#endyear").find(":selected").text());
	const displayPercentages = true; // Boolean(parseInt(jQuery("#displayPercent").find(":selected").val()));
	const whichRegions       = jQuery("#regions").find(":selected").val();

	let numAreas = CSRankings.updateWeights(currentWeights);
	
	let coauthorList : {[key : string] : Set<string> } = {};
	if (CSRankings.showCoauthors) {
	    coauthorList = CSRankings.computeCoauthors(CSRankings.coauthors,
						       startyear,
						       endyear,
						       currentWeights);
	}

	CSRankings.authorAreas = {}
	CSRankings.countAuthorAreas(CSRankings.authors,
				    startyear,
				    endyear,
				    currentWeights,
				    CSRankings.authorAreas);
	
	CSRankings.buildDepartments(CSRankings.authors,
				    startyear,
				    endyear,
				    currentWeights,
				    whichRegions,
				    CSRankings.areaDeptAdjustedCount,
				    deptCounts,
				    deptNames,
				    facultycount,
				    facultyAdjustedCount);
	
	/* (university, total or average number of papers) */
	CSRankings.stats = CSRankings.computeStats(deptNames,
						   CSRankings.areaDeptAdjustedCount,
						   CSRankings.areas,
						   numAreas,
						   displayPercentages,
						   currentWeights);

	/* Canonicalize names. */
	CSRankings.canonicalizeNames(deptNames,
				     facultycount,
				     facultyAdjustedCount);

	const univtext = CSRankings.buildDropDown(deptNames,
						  facultycount,
						  facultyAdjustedCount,
						  coauthorList);

	/* Start building up the string to output. */
	const s = CSRankings.buildOutputString(displayPercentages,
					     numAreas,
					     CSRankings.stats,
					     deptCounts,
					     univtext);

	/* Finally done. Redraw! */
	setTimeout(()=>{ jQuery("#success").html(s); }, 0);
	return false; 
    }

    /* Turn the chart display on or off. */
    public static toggleChart(name : string) : void {
	const chart = document.getElementById(name+"-chart");
	if (chart!.style.display === 'block') {
	    chart!.style.display = 'none';
	    chart!.innerHTML = '';
	} else {
	    chart!.style.display = 'block';
	    CSRankings.makeChart(name);
	}
	
    }

    /* Expand or collape the view of conferences in a given area. */
    public static toggleConferences(area : string) : void {
	const e = document.getElementById(area+"-conferences");
	const widget = document.getElementById(area+"-widget");
	if (e!.style.display === 'block') {
	    e!.style.display = 'none';
	    widget!.innerHTML = "<font color=\"blue\">" + CSRankings.RightTriangle + "</font>";
	} else {
	    e!.style.display = 'block';
	    widget!.innerHTML = "<font color=\"blue\">" + CSRankings.DownTriangle + "</font>";
	}
	const boxes = document.getElementById(area+"-conferences-checkboxes");
	if (boxes!.style.display === 'block') {
	    boxes!.style.display = 'none';
	} else {
	    boxes!.style.display = 'block';
	}
    }


    /* Expand or collape the view of all faculty in a department. */
    public static toggleFaculty(dept : string) : void {
	const e = document.getElementById(dept+"-faculty");
	const widget = document.getElementById(dept+"-widget");
	if (e!.style.display === 'block') {
	    e!.style.display = 'none';
	    widget!.innerHTML = "<font color=\"blue\">" + CSRankings.RightTriangle + "</font>";
	} else {
	    e!.style.display = 'block';
	    widget!.innerHTML = "<font color=\"blue\">" + CSRankings.DownTriangle + "</font>";
	}
    }

    public static activateAll(value : boolean = true) : boolean {
	for (let i = 0; i < CSRankings.areas.length; i++) {
	    const str = "input[name=" + CSRankings.fields[i] + "]";
	    jQuery(str).prop('checked', value);
	    if (CSRankings.fields[i] in CSRankings.childMap) {
		let parent = CSRankings.fields[i];
		for (let kid of CSRankings.childMap[parent]) {
		    jQuery("input[name="+kid+"]").prop('checked', value);
		}
	    }
	}
	CSRankings.rank();
	return false;
    }

    public static activateNone() : boolean {
	return CSRankings.activateAll(false);
    }

    public static activateSystems(value : boolean = true) : boolean {
	return CSRankings.activateFields(value, CSRankings.systemsFields);
    }

    public static activateAI(value : boolean = true) : boolean {
	return CSRankings.activateFields(value, CSRankings.aiFields);
    }

    public static activateTheory(value : boolean = true) : boolean {
	return CSRankings.activateFields(value, CSRankings.theoryFields);
    }

    public static activateOthers(value : boolean = true) : boolean {
	return CSRankings.activateFields(value, CSRankings.otherFields);
    }

    public static deactivateSystems() : boolean {
	return CSRankings.activateSystems(false);
    }

    public static deactivateAI() : boolean {
	return CSRankings.activateAI(false);
    }

    public static deactivateTheory() : boolean {
	return CSRankings.activateTheory(false);
    }

    public static deactivateOthers() : boolean {
	return CSRankings.activateOthers(false);
    }
    
}

function init() : void {
    new CSRankings();
}

window.onload=init;
//	jQuery(document).ready(
