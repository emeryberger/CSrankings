var outputHTML = "";        /* The string containing the ranked list of institutions. */
var minToRank = 50;         /* Show the top 30 (with more if tied at the end) */
var totalCheckboxes = 19;   /* The number of checkboxes (research areas). */

var authors = "";           /* The data which will hold the parsed CSV of author info. */

/* All the areas, in order by their 'field_' number (the checkboxes) in index.html. */

var areas = ["proglang", "softeng", "opsys", "networks", "security", "database", "metrics", "mlmining", "ai", "nlp", "web", "vision", "theory", "logic", "arch", "graphics", "hci", "mobile", "robotics" ];

/* The prologue that we preface each generated HTML page with (the results). */

var prologue = 	"<html>"
    + "<head>"
    + "<title>CS department rankings by productivity</title>"
    + "<style type=\"text/css\">"
    + "  body { font-family: \"Helvetica\", \"Arial\"; }"
    + "  table td { vertical-align: top; }"
    + "</style>"
    + "</head>"
    + "<body>"
    + "<div class=\"row\">"
    + "<div class=\"table\">"
    + "<table class=\"table-sm table-striped\""
    + "id=\"ranking\" valign=\"top\">";

/* from http://hubrik.com/2015/11/16/sort-by-last-name-with-javascript/ */
function compareNames (a,b) {

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

function redisplay() {
    jQuery("#success").html(outputHTML);
}

function toggle(dept) {
    var e = document.getElementById(dept);
    var widget = document.getElementById(dept+"-widget");
    if (e.style.display == 'block') {
	e.style.display = 'none';
	widget.innerHTML = "&#9658;&nbsp;" + dept;
    } else {
	e.style.display = 'block';
	widget.innerHTML = "&#9660;&nbsp;" + dept;
    }
}

function init() {
    jQuery(document).ready(
	function() {
	    /* Set the checkboxes to true. */
	    for (var i = 1; i <= totalCheckboxes; i++) {
		var str = 'input[name=field_'+i+']';
		jQuery(str).prop('checked', true);
	    }
	    /* Load up the CSV. */
	    Papa.parse("generated-author-info.csv", {
		download : true,
		header : true,
		complete: function(results) {
		    authors = results.data;
		    for (var i = 1; i <= totalCheckboxes; i++) {
			var str = 'input[name=field_'+i+']';
			(function(s) {
			    jQuery(s).click(function() {
				rank();
			    });})(str);
		    }
		    activateAll();
		    rank();
		}
	    });
	});
}

window.onload=init;

function activateAll(value = true) {
    for (var i = 1; i <= totalCheckboxes; i++) {
	var str = "input[name=field_"+i+"]";
	jQuery(str).prop('checked', value);
    }
    rank();
    return false;
}

function activateNone() {
    return activateAll(false);
}

function activatePL(value = true) {
    jQuery('input[name=field_1]').prop('checked', value);
    jQuery('input[name=field_2]').prop('checked', value);
    rank();
    return false;
}

function activateSystems(value = true) {
    for (var i = 3; i <= 7; i++) {
	var str = "input[name=field_"+i+"]";
	jQuery(str).prop('checked', value);
    }
    jQuery('input[name=field_15]').prop('checked', value);
    jQuery('input[name=field_18]').prop('checked', value);
    rank();
    return false;
}

function activateAI(value = true) {
    for (var i = 8; i <= 12; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked', value);
    }
    rank();
    return false;
}

function activateTheory(value = true) {
    for (var i = 13; i <= 14; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked', value);
    }
    rank();
    return false;
}

function activateOthers(value = true) {
    for (var i = 16; i <= 17; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked', value);
    }
    jQuery('input[name=field_19]').prop('checked', value);
    rank();
    return false;
}

function deactivatePL() {
    return activatePL(false);
}

function deactivateSystems() {
    return activateSystems(false);
    return false;
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


function sortIndex(univagg) {
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

function rank() {
    var form = document.getElementById("rankform");
    var s = "";
    var deptNames = {};          /* names of departments. */
    var deptCounts = {};         /* number of faculty in each department. */
    var facultycount = {};       /* name + dept -> raw count of pubs per name / department */
    var visited = {};            /* contains an author name if that author has been processed. */
    var authagg = {};            /* (author, number of papers) -- used to compute max papers from university per area */
    var weights = {};            /* array to hold 1 or 0, depending on if the area is checked or not. */
    var areacount = {};          /* raw number of papers in each area */
    var areaAdjustedCount = {};  /* adjusted number of papers in each area (split among faculty authors). */
    var areaDeptAdjustedCount = {}; /* as above, but for area+dept. */
    var univagg = {};            /* (university, total or average number of papers) */
    
    var startyear          = parseInt(jQuery("#startyear").find(":selected").text());
    var endyear            = parseInt(jQuery("#endyear").find(":selected").text());
    var displayPercentages = parseInt(jQuery("#displayPercent").find(":selected").val());

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
    /* First, count the total number of papers (raw and adjusted) in each area. */
    for (var r in authors) {
	var area = authors[r].area;
	var dept = authors[r].dept;
	var year = authors[r].year;
	var areaDept = area+dept;
	areaDeptAdjustedCount[areaDept] = 0;
	if ((weights[area] == 0) || (year < startyear) || (year > endyear)) {
	    continue;
	}
	var count = parseFloat(authors[r].count);
	var adjustedCount = parseFloat(authors[r].adjustedcount);
	areacount[area] += count;
	areaAdjustedCount[area] += adjustedCount;
    }
    /* Build the dictionary of departments (and count) to be ranked. */
    for (var r in authors) {
	var area = authors[r].area;
	var dept = authors[r].dept;
	var areaDept = area+dept;
	if (!(areaDept in areaDeptAdjustedCount)) {
	    areaDeptAdjustedCount[areaDept] = 0;
	}
	if (weights[area] == 0) {
	    continue;
	}
	var name = authors[r].name;
	var count = parseInt(authors[r].count);
	var adjustedCount = parseFloat(authors[r].adjustedcount);
	var year = authors[r].year;
	if ((year >= startyear) && (year <= endyear)) {
	    areaDeptAdjustedCount[areaDept] += adjustedCount;
	    /* Is this the first time we have seen this person? */
	    if (!(name in visited)) {
		visited[name] = true;
		facultycount[name+dept] = 0;
		if (!(dept in deptCounts)) {
		    deptCounts[dept] = 0;
		    deptNames[dept] = [];
		}
		deptNames[dept].push(name);
		deptCounts[dept] += 1;
	    }
	    facultycount[name+dept] += count;
	}
    }

    /* Now compute aggregate statistics. */
    
    for (dept in deptNames) {
	var n = numAreas;
	if (displayPercentages) {
	    univagg[dept] = 0;
/*	GEOMEAN:    univagg[dept] = 1; */
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
			univagg[dept] += areaDeptAdjustedCount[areaDept] / areaAdjustedCount[area];
			/* GEOMEAN: univagg[dept] *= areaDeptAdjustedCount[areaDept]; */
		    } else {
			n--;
		    }
		} else {
		    univagg[dept] += areaDeptAdjustedCount[areaDept];
		}
	    }
	}
	if (displayPercentages) {
	    univagg[dept] = univagg[dept] / numAreas;
	    univagg[dept] = (Math.floor(1000.0 * univagg[dept]) / 1000.0); /* Force rounding. */
/*	GEOMEAN:    univagg[dept] = univagg[dept] / n; */
	}
    }

    var s = prologue;
    var univtext = {};

    /* Build drop down for faculty names and paper counts. */
    for (dept in deptNames) {
	var p = "<div class=\"row\"><div class=\"table\"><table class=\"table-striped\" width=\"400px\"><thead><th></th><td><small><em>Faculty</em></small></td><td align=\"right\"><small><em>Raw Publication Count</em></small></td></thead><tbody>";
	var fc = {};
	for (var ind = 0; ind < deptNames[dept].length; ind++) {
	    name = deptNames[dept][ind];
	    fc[name] = facultycount[name+dept];
	}
	var keys = Object.keys(fc);
	keys.sort(function(a,b){ return fc[b] - fc[a];});
	for (var ind = 0; ind < keys.length; ind++) {
	    name = keys[ind];
	    p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
		+ "<a href=\"https://www.google.com/search?q="
		+ encodeURI(name + " " + dept)
		+ "&gws_rd=ssl\">"
		+ name
		+ "</a></small></td><td align=\"right\"><small>"
		+ facultycount[name+dept]
		+ "</small></td></tr>";
	}
	p += "</tbody></table></div></div>";
	univtext[dept] = p;
    }
    
    if (displayPercentages) {
	s = s + "<thead><tr><th align=\"left\">Rank&nbsp;&nbsp;</th><th align=\"right\">Institution&nbsp;&nbsp;</th><th align=\"right\">Average&nbsp;%</th><th align=\"right\">&nbsp;&nbsp;&nbsp;Faculty</th></th></tr></thead>";
    } else {
	s = s + "<thead><tr><th align=\"left\">Rank&nbsp;&nbsp;</th><th align=\"right\">Institution&nbsp;&nbsp;</th><th align=\"right\">Adjusted&nbsp;Pub&nbsp;Count</th><th align=\"right\">&nbsp;&nbsp;&nbsp;Faculty</th></tr></thead>";
    }
    s = s + "<tbody>";
    /* As long as there is at least one thing selected, compute and display a ranking. */
    if (numAreas > 0) {
	var rank = 0;        /* index */
	var oldv = null;     /* old number - to track ties */
	/* Sort the university aggregate count from largest to smallest. */
	var keys = sortIndex(univagg);
	/* Display rankings until we have shown `minToRank` items or
	   while there is a tie (those all get the same rank). */
	for (var ind = 0; ind < keys.length; ind++) {
	    var dept = keys[ind];
	    var v = univagg[dept];
	    if ((ind >= minToRank) && (v != oldv)) {
		break;
	    }
	    if (v === 0.0) {
		break;
	    }
	    if (oldv != v) {
		rank = rank + 1;
	    }
	    s += "\n<tr><td>" + rank + "</td>";
	    s += "<td><div onclick=\"toggle('" + dept + "')\" class=\"hovertip\" id=\"" + dept + "-widget\">&#9658;&nbsp" + dept + "</div>";
	    s += "<div style=\"display:none;\" id=\""+dept+"\">" + univtext[dept] + "</div>";
    
	    s += "</td>";

	    if (displayPercentages) {
		/* Show average */
		s += "<td align=\"right\">" + (Math.floor(10000.0 * v) / (100.0)).toPrecision(2)  + "%</td>";
		/* GEO MEAN: s += "<td align=\"right\">" + (10.0 * Math.floor(v) / (10.0))  + "</td>"; */
	    } else {
		/* Show count */
		s += "<td align=\"right\">" + (Math.floor(100.0 * v) / 100.0)  + "</td>";
	    }
	    s += "<td align=\"right\">" + deptCounts[dept] + "<br />"; /* number of faculty */
	    s += "</td>";
	    s += "</tr>\n";
	    oldv = v;
	}
	s += "</tbody>" + "</table>" + "</div>" + "</div>" + "\n";
	s += "<br>" + "</body>" + "</html>";
    } else {
	s = "<h4>Please select at least one area.</h4>";
    }
    outputHTML = s;
    setTimeout(redisplay, 0);
    return false; 
}


