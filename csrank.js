var r = [];
var setup = false;
var outputHTML = "";
var rankingsInProgress = 0;
var minToRank = 30;         /* Show the top 30 (with more if tied at the end) */
var totalSliders = 19;      /* The number of sliders (research areas). */
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

function slidersetup()
{
    if (!setup) {
	var rank_slider = [];
	var str = 'rank_slider_';

	for (var i = 1; i <= totalSliders; i++) {
	    rank_slider[i] = $(str.concat(i.toString()));
	}

	r[1] = new Control.Slider(rank_slider[1].down('.handle'),
				  rank_slider[1], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_1";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_1";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[2] = new Control.Slider(rank_slider[2].down('.handle'),
				  rank_slider[2], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_2";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_2";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[3] = new Control.Slider(rank_slider[3].down('.handle'),
				  rank_slider[3], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_3";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_3";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[4] = new Control.Slider(rank_slider[4].down('.handle'),
				  rank_slider[4], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_4";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_4";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[5] = new Control.Slider(rank_slider[5].down('.handle'),
				  rank_slider[5], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_5";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_5";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[6] = new Control.Slider(rank_slider[6].down('.handle'),
				  rank_slider[6], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_6";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_6";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[7] = new Control.Slider(rank_slider[7].down('.handle'),
				  rank_slider[7], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_7";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_7";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[8] = new Control.Slider(rank_slider[8].down('.handle'),
				  rank_slider[8], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_8";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_8";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[9] = new Control.Slider(rank_slider[9].down('.handle'),
				  rank_slider[9], {
				      range: $R(0, 1),
				      values: [0,1],
				      sliderValue: 1,
				      onSlide: function(value) {
					  var str = "field_9";
					  $(str).value = value.toFixed(2);
				      },
				      onChange: function(value) {
					  var str = "field_9";
					  $(str).value = value.toFixed(2);
					  rank();
				      }
				  });

	r[10] = new Control.Slider(rank_slider[10].down('.handle'),
				   rank_slider[10], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_10";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_10";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

	r[11] = new Control.Slider(rank_slider[11].down('.handle'),
				   rank_slider[11], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_11";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_11";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

	r[12] = new Control.Slider(rank_slider[12].down('.handle'),
				   rank_slider[12], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_12";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_12";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

	r[13] = new Control.Slider(rank_slider[13].down('.handle'),
				   rank_slider[13], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_13";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_13";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

	r[14] = new Control.Slider(rank_slider[14].down('.handle'),
				   rank_slider[14], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_14";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_14";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

	r[15] = new Control.Slider(rank_slider[15].down('.handle'),
				   rank_slider[15], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_15";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_15";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

	r[16] = new Control.Slider(rank_slider[16].down('.handle'),
				   rank_slider[16], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_16";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_16";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

	r[17] = new Control.Slider(rank_slider[17].down('.handle'),
				   rank_slider[17], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_17";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_17";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });

		r[18] = new Control.Slider(rank_slider[18].down('.handle'),
				   rank_slider[18], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_18";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_18";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });
		r[19] = new Control.Slider(rank_slider[19].down('.handle'),
				   rank_slider[19], {
				       range: $R(0, 1),
				       values: [0,1],
				       sliderValue: 1,
				       onSlide: function(value) {
					   var str = "field_19";
					   $(str).value = value.toFixed(2);
				       },
				       onChange: function(value) {
					   var str = "field_19";
					   $(str).value = value.toFixed(2);
					   rank();
				       }
				   });
	setup = true;
    }
}

function init() {
    slidersetup();
    rank();
}

window.onload=init;

function activateAll() {
    for (var i = 1; i <= totalSliders; i++) {
	r[i].setValue(1.0);
    }
    return false;
}

function activateNone() {
    for (var i = 1; i <= totalSliders; i++) {
	r[i].setValue(0.0);
    }
    return false;
}

function activatePL() {
    r[1].setValue(1.0);
    r[2].setValue(1.0);
/*
    for (var i = 3; i <= totalSliders; i++) {
	r[i].setValue(0.0);
    }
*/
    return false;
}

function activateSystems() {
/*
    r[1].setValue(0.0);
    r[2].setValue(0.0);
*/
    for (var i = 3; i <= 7; i++) {
	r[i].setValue(1.0);
    }
    r[18].setValue(1.0);
/*
    for (var i = 8; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    r[totalSliders].setValue(0.0);
*/
    return false;
}

function activateAI() {
/*
    for (var i = 1; i <= 7; i++) {
	r[i].setValue(0.0);
    }
*/
    for (var i = 8; i <= 12; i++) {
	r[i].setValue(1.0);
    }
/*
  for (var i = 13; i <= totalSliders; i++) {
	r[i].setValue(0.0);
    }
*/
    return false;
}

function activateTheory() {
    /*
    for (var i = 1; i <= 12; i++) {
	r[i].setValue(0.0);
    }
    */
    
    for (var i = 13; i <= 14; i++) {
	r[i].setValue(1.0);
    }
    /*
    for (var i = 15; i <= totalSliders; i++) {
	r[i].setValue(0.0);
    }
    */
    return false;
}

function activateOthers() {
    /*
    for (var i = 1; i <= 14; i++) {
	r[i].setValue(0.0);
    }
    */
    for (var i = 15; i <= 17; i++) {
	r[i].setValue(1.0);
    }
    r[totalSliders].setValue(1.0);
    /*    r[18].setValue(0.0); */
    return false;
}

function deactivatePL() {
    r[1].setValue(0.0);
    r[2].setValue(0.0);
/*
    for (var i = 3; i <= totalSliders; i++) {
	r[i].setValue(0.0);
    }
*/
    return false;
}

function deactivateSystems() {
/*
    r[1].setValue(0.0);
    r[2].setValue(0.0);
*/
    for (var i = 3; i <= 7; i++) {
	r[i].setValue(0.0);
    }
    r[18].setValue(0.0);
/*
    for (var i = 8; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    r[totalSliders].setValue(0.0);
*/
    return false;
}

function deactivateAI() {
/*
    for (var i = 1; i <= 7; i++) {
	r[i].setValue(0.0);
    }
*/
    for (var i = 8; i <= 12; i++) {
	r[i].setValue(0.0);
    }
/*
  for (var i = 13; i <= totalSliders; i++) {
	r[i].setValue(0.0);
    }
*/
    return false;
}

function deactivateTheory() {
    /*
    for (var i = 1; i <= 12; i++) {
	r[i].setValue(0.0);
    }
    */
    
    for (var i = 13; i <= 14; i++) {
	r[i].setValue(0.0);
    }
    /*
    for (var i = 15; i <= totalSliders; i++) {
	r[i].setValue(0.0);
    }
    */
    return false;
}

function deactivateOthers() {
    /*
    for (var i = 1; i <= 14; i++) {
	r[i].setValue(0.0);
    }
    */
    for (var i = 15; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    r[totalSliders].setValue(0.0);
    /*    r[18].setValue(0.0); */
    return false;
}

function rank() {
    rankingsInProgress++;
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
	    weights["proglang"] = parseFloat($("field_1").value);
	    weights["softeng"]  = parseFloat($("field_2").value);
	    weights["opsys"]    = parseFloat($("field_3").value);
	    weights["networks"] = parseFloat($("field_4").value);
	    weights["security"] = parseFloat($("field_5").value);
	    weights["database"] = parseFloat($("field_6").value);
	    weights["metrics"]  = parseFloat($("field_7").value);
	    weights["mlmining"] = parseFloat($("field_8").value);
	    weights["ai"]       = parseFloat($("field_9").value);
	    weights["nlp"]      = parseFloat($("field_10").value);
	    weights["web"]      = parseFloat($("field_11").value);
	    weights["vision"]   = parseFloat($("field_12").value);
	    weights["theory"]   = parseFloat($("field_13").value);
	    weights["logic"]    = parseFloat($("field_14").value);
	    weights["arch"]     = parseFloat($("field_15").value);
	    weights["graphics"] = parseFloat($("field_16").value);
	    weights["hci"]      = parseFloat($("field_17").value);
	    weights["mobile"]   = parseFloat($("field_18").value);
	    weights["robotics"]   = parseFloat($("field_19").value);
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
		    s += "<td align=\"right\">" + "<font color=\"blue\">" + "<div  title=\"" + univnames[dept] + "\">" + univcounts[dept] + "</div>" + "</font>" + "</td>"; /* number of faculty */
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
	    rankingsInProgress--;
	    setTimeout(redisplay, 0);
	    return false; 
	}
    });
}


