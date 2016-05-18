var slider = [];            /* The sliders themselves. */
var setup = false;          /* Have we initialized the sliders? */
var outputHTML = "";        /* The string containing the ranked list of institutions. */
var minToRank = 30;         /* Show the top 30 (with more if tied at the end) */
var totalCheckboxes = 19;      /* The number of checkboxes (research areas). */
var maxHoverFaculty = 40;   /* If more than this many, don't create a hover tip. */

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


function init() {
    jQuery(document).ready(
	function() {
	    for (var i = 1; i <= totalCheckboxes; i++) {
		var str = 'input[name=field_'+i+']';
		jQuery(str).prop('checked', true);
	    }
	});
    for (var i = 1; i <= totalCheckboxes; i++) {
	var str = 'input[name=field_'+i+']';
	jQuery(str).click(function() {
	    rank();
	});
    }
    rank();
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
    var univcounts = {};
    var univnames = {};
    var facultycount = {};
    var authcounts = {};
    var visited = {};
    var univagg = {}; /* (university, total number of papers) */
    var univwww = {}; /* (university, web page) */
    var authagg = {}; /* (author, number of papers) -- used to compute max papers from university per area */
    var authors = {};
    var weights = {};

    var areacount = {};
    
    Papa.parse("generated-author-info.csv", {
	download : true,
	header : true,
	complete: function(results) {
	    authors = results.data;
	    weights["proglang"] = jQuery('input[name=field_1]').prop('checked') ? 1.0 : 0.0;
	    weights["softeng"]  = jQuery('input[name=field_2]').prop('checked') ? 1.0 : 0.0;
	    weights["opsys"]    = jQuery('input[name=field_3]').prop('checked') ? 1.0 : 0.0;
	    weights["networks"] = jQuery('input[name=field_4]').prop('checked') ? 1.0 : 0.0;
	    weights["security"] = jQuery('input[name=field_5]').prop('checked') ? 1.0 : 0.0;
	    weights["database"] = jQuery('input[name=field_6]').prop('checked') ? 1.0 : 0.0;
	    weights["metrics"]  = jQuery('input[name=field_7]').prop('checked') ? 1.0 : 0.0;
	    weights["mlmining"] = jQuery('input[name=field_8]').prop('checked') ? 1.0 : 0.0;
	    weights["ai"]       = jQuery('input[name=field_9]').prop('checked') ? 1.0 : 0.0;
	    weights["nlp"]      = jQuery('input[name=field_10]').prop('checked') ? 1.0 : 0.0;
	    weights["web"]      = jQuery('input[name=field_11]').prop('checked') ? 1.0 : 0.0;
	    weights["vision"]   = jQuery('input[name=field_12]').prop('checked') ? 1.0 : 0.0;
	    weights["theory"]   = jQuery('input[name=field_13]').prop('checked') ? 1.0 : 0.0;
	    weights["logic"]    = jQuery('input[name=field_14]').prop('checked') ? 1.0 : 0.0;
	    weights["arch"]     = jQuery('input[name=field_15]').prop('checked') ? 1.0 : 0.0;
	    weights["graphics"] = jQuery('input[name=field_16]').prop('checked') ? 1.0 : 0.0;
	    weights["hci"]      = jQuery('input[name=field_17]').prop('checked') ? 1.0 : 0.0;
	    weights["mobile"]   = jQuery('input[name=field_18]').prop('checked') ? 1.0 : 0.0;
	    weights["robotics"]   = jQuery('input[name=field_19]').prop('checked') ? 1.0 : 0.0;
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
	    /* Build hover text for faculty names and paper counts. */
	    for (dept in univnames) {
		if (univcounts[dept] <= maxHoverFaculty) {
		    var s = "";
		    univnames[dept].sort(compareNames);
		    for (var name of univnames[dept]) {
			s += "\n" + name + ": " + facultycount[name+dept];
		    }
		    univnames[dept] = s.slice(1);
		} else {
		    univnames[dept] = "(can't display more than " + maxHoverFaculty + " faculty)";
		}
	    }

	    var s = "<html>"
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
		    s += "<td>" +  dept  + "</td>";
		    if (displayPercentages) {
			 /* Show average percentage */
			s += "<td align=\"right\">" + (Math.floor(v * 1000.0) / (10.0 * areaCount)).toPrecision(2)  + "%</td>";
		    } else {
			/* Show count */
			s += "<td align=\"right\">" + Math.floor(v)  + "</td>";
		    }
		    s += "<td align=\"right\">" + "<font color=\"blue\">"
			+ "<div title=\"" + univnames[dept] + "\">" + univcounts[dept] + "</div>" + "</font>" + "</td>"; /* number of faculty */
		    /*		s += "<td align=\"right\">" + Math.floor(10.0 * v / univcounts[dept]) / 10.0 + "</td>"; */
		    s += "</tr>\n";
		    oldv = v;
		}
		s += "</tbody>" + "</table>" + "</div>" + "</div>" + "\n";
		s += "<br>" + "</body>" + "</html>";
	    } else {
		s = "<h3>Nothing selected.</h3>";
	    }
	    outputHTML = s;
	    setTimeout(redisplay, 0);
	    return false; 
	}
    });
}


