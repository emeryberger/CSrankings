var outputHTML = "";        /* The string containing the ranked list of institutions. */
var minToRank = 30;         /* Show the top 30 (with more if tied at the end) */
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

function activateAll() {
    for (var i = 1; i <= totalCheckboxes; i++) {
	var str = "input[name=field_"+i+"]";
	jQuery(str).prop('checked', true);
    }
    rank();
    return false;
}

function activateNone() {
    for (var i = 1; i <= totalCheckboxes; i++) {
	var str = "input[name=field_"+i+"]";
	jQuery(str).prop('checked', false);
    }
    rank();
    return false;
}

function activatePL() {
    jQuery('input[name=field_1]').prop('checked', true);
    jQuery('input[name=field_2]').prop('checked', true);
    rank();
    return false;
}

function activateSystems() {
    jQuery('input[name=field_1]').prop('checked', true);
    jQuery('input[name=field_2]').prop('checked', true);
    for (var i = 3; i <= 7; i++) {
	var str = "input[name=field_"+i+"]";
	jQuery(str).prop('checked', true);
    }
    jQuery('input[name=field_18]').prop('checked', true);
    rank();
    return false;
}

function activateAI() {
    for (var i = 8; i <= 12; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked',true);
    }
    rank();
    return false;
}

function activateTheory() {
    for (var i = 13; i <= 14; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked',true);
    }
    rank();
    return false;
}

function activateOthers() {
    for (var i = 15; i <= 17; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked',true);
    }
    jQuery('input[name=field_19]').prop('checked', true);
    rank();
    return false;
}

function deactivatePL() {
    jQuery('input[name=field_1]').prop('checked', false);
    jQuery('input[name=field_2]').prop('checked', false);
    rank();
    return false;
}

function deactivateSystems() {
    deactivatePL();
    for (var i = 3; i <= 7; i++) {
	var str = "input[name=field_"+i+"]";
	jQuery(str).prop('checked', false);
    }
    jQuery('input[name=field_18]').prop('checked', false);
    rank();
    return false;
}

function deactivateAI() {
    for (var i = 8; i <= 12; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked',false);
    }
    rank();
    return false;
}

function deactivateTheory() {
    for (var i = 13; i <= 14; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked',false);
    }
    rank();
    return false;
}

function deactivateOthers() {
    for (var i = 15; i <= 17; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).prop('checked',false);
    }
    jQuery('input[name=field_19]').prop('checked', false);
    rank();
    return false;
}

function rank() {
    var form = document.getElementById("rankform");
    var s = "";
    var univnames = {};
    var univcounts = {};
    var facultycount = {};
    var authcounts = {};
    var visited = {};
    var univagg = {}; /* (university, total number of papers) */
    var univwww = {}; /* (university, web page) */
    var authagg = {}; /* (author, number of papers) -- used to compute max papers from university per area */
    var weights = {};
    var areacount = {};

    /* Update the 'weights' of each area from the checkboxes. */
    for (var ind = 0; ind < areas.length; ind++) {
	weights[areas[ind]] = jQuery('input[name=field_'+(ind+1)+']').prop('checked') ? 1.0 : 0.0;
    }
    var startyear = parseInt(jQuery("#startyear").find(":selected").text());
    var endyear = parseInt(jQuery("#endyear").find(":selected").text());
    var displayPercentages = parseInt(jQuery("#displayPercent").find(":selected").val());
    /* First, count the total number of papers in each area. */
    for (var r in authors) {
	var area = authors[r].area;
	var count = parseFloat(authors[r].count);
	var year = authors[r].year;
	if ((year >= startyear) && (year <= endyear)) {
	    if (!(area in areacount)) {
		areacount[area] = 0;
	    }
	    areacount[area] += count;
	}
    }
    /* Count up the number of areas being used. */
    var areaCount = 0;
    for (var a in areacount) {
	if (weights[a] != 0) {
	    areaCount += 1; 
	}
    }
    /* Build the dictionary of departments (and count) to be ranked. */
    for (var r in authors) {
	var name = authors[r].name;
	var dept = authors[r].dept;
	var area = authors[r].area;
	var count = parseInt(authors[r].count);
	var adjustedCount = parseFloat(authors[r].adjustedcount);
	var year = authors[r].year;
	if ((year >= startyear) && (year <= endyear)) {
	    if (!(dept in univagg)) {
		univagg[dept] = 0;
	    }
	    if (weights[area] != 0) {
		if (displayPercentages) {
		    univagg[dept] += (1.0 * adjustedCount) / areacount[area];
		} else {
		    univagg[dept] += adjustedCount;
		}
		/* Is this the first time we have seen this person? */
		if (!(name in visited)) {
		    visited[name] = true;
		    facultycount[name+dept] = 0;
		    if (!(dept in univcounts)) {
			univcounts[dept] = 0;
			univnames[dept] = [];
		    }
		    univnames[dept].push(name);
		    univcounts[dept] += 1;
		}
		facultycount[name+dept] += count;
	    }
	}
    }
    var s = prologue;
    var univtext = {};

    /* Build drop down for faculty names and paper counts. */
    for (dept in univnames) {
	var p = "<div class=\"row\"><div class=\"table\"><table class=\"table-striped\" width=\"400px\"><thead><th></th><td><small><em>Faculty</em></small></td><td align=\"right\"><small><em>Publication Count</em></small></td></thead><tbody>";
	/* univnames[dept].sort(compareNames); */
	var fc = {};
	for (var ind = 0; ind < univnames[dept].length; ind++) {
	    /* for (var name of univnames[dept]) {*/
	    name = univnames[dept][ind];
	    fc[name] = facultycount[name+dept];
	}
	var keys = Object.keys(fc);
	keys.sort(function(a,b){ return fc[b] - fc[a];});
	for (var ind = 0; ind < keys.length; ind++) {
	    /* for (var name of keys) { */
	    name = keys[ind];
	    p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>" + name + "</small></td><td align=\"right\"><small>" + facultycount[name+dept] + "</small></td></tr>";
	}
	p += "</tbody></table></div></div>";
	univtext[dept] = p;
    }
    
    if (displayPercentages) {
	s = s + "<thead><tr><th align=\"left\">Rank&nbsp;</th><th align=\"right\">Institution&nbsp;</th><th align=\"right\">Percent&nbsp;</th><th align=\"right\">Faculty</th></th></tr></thead>";
    } else {
	s = s + "<thead><tr><th align=\"left\">Rank&nbsp;</th><th align=\"right\">Institution&nbsp;</th><th align=\"right\">Sum&nbsp;</th><th align=\"right\">Faculty</th></tr></thead>";
    }
    s = s + "<tbody>";
    /* As long as there is at least one thing selected, compute and display a ranking. */
    if (areaCount > 0) {
	var rank = 0;        /* index */
	var oldv = -100;  /* old number - to track ties */
	/* Sort the university aggregate count from largest to smallest. */
	var keys = Object.keys(univagg);
	keys.sort(function(a,b){return univagg[b] - univagg[a];});
	
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
		/* Show average percentage */
		s += "<td align=\"right\">" + (Math.floor(v * 1000.0) / (10.0 * areaCount)).toPrecision(2)  + "%</td>";
	    } else {
		/* Show count */
		s += "<td align=\"right\">" + Math.floor(v)  + "</td>";
	    }
	    s += "<td align=\"right\">" + univcounts[dept] + "<br />"; /* number of faculty */
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


