var r = [];
var setup = false;
var outputHTML = "";
var rankingsInProgress = 0;
var minToRank = 30;

function redisplay() {
    jQuery("#success").html(outputHTML);
}

function slidersetup()
{
    if (!setup) {
	var rank_slider = [];
	var str = 'rank_slider_';

	for (i = 1; i <= 18; i++) {
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
	setup = true;
    }
}

function init() {
    slidersetup();
    rank();
}

window.onload=init;

function activatePL() {
    r[1].setValue(1.0);
    r[2].setValue(1.0);
    for (i = 3; i <= 18; i++) {
	r[i].setValue(0.0);
    }
    return false;
}

function activateSystems() {
    r[1].setValue(0.0);
    r[2].setValue(0.0);
    for (i = 3; i <= 7; i++) {
	r[i].setValue(1.0);
    }
    r[18].setValue(1.0);
    for (i = 8; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    return false;
}

function activateAI() {
    for (i = 1; i <= 7; i++) {
	r[i].setValue(0.0);
    }
    for (i = 8; i <= 12; i++) {
	r[i].setValue(1.0);
    }
    for (i = 13; i <= 18; i++) {
	r[i].setValue(0.0);
    }
    return false;
}

function activateTheory() {
    for (i = 1; i <= 12; i++) {
	r[i].setValue(0.0);
    }
    for (i = 13; i <= 14; i++) {
	r[i].setValue(1.0);
    }
    for (i = 15; i <= 18; i++) {
	r[i].setValue(0.0);
    }
    return false;
}

function activateOthers() {
    for (i = 1; i <= 14; i++) {
	r[i].setValue(0.0);
    }
    r[18].setValue(0.0);
    for (i = 15; i <= 17; i++) {
	r[i].setValue(1.0);
    }
    return false;
}

function activateAll() {
    for (i = 1; i <= 18; i++) {
	r[i].setValue(1.0);
    }
    return false;
}

function rank() {
    rankingsInProgress++;
    var form = document.getElementById("rankform");
    var s = "";
    var univcounts = {};
    var authcounts = {};
    var visited = {};
    var univagg = {}; /* (university, total number of papers) */
    var univwww = {}; /* (university, web page) */
    var authagg = {}; /* (author, number of papers) -- used to compute max papers from university per area */
    var authors = {};
    Papa.parse("authorinfo.csv", {
	download : true,
	header : true,
	complete: function(results) {
	    authors = results.data;
	    weights = {};
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
	    startyear = parseInt(jQuery("#startyear").find(":selected").text());
	    endyear = parseInt(jQuery("#endyear").find(":selected").text());
	    for (var r in authors) {
		var name = authors[r].name;
		var dept = authors[r].dept;
		var area = authors[r].area;
		var count = authors[r].count;
		var year = authors[r].year;
		if ((year >= startyear) && (year <= endyear)) {
		    if (!(dept in univagg)) {
			univagg[dept] = 0;
		    }
		    univagg[dept] += parseInt(count) * weights[area];
		    if (weights[area] > 0) {
			if (!(name in visited)) {
			    visited[name] = true;
			    if (!(dept in univcounts)) {
				univcounts[dept] = 0;
			    }
			    univcounts[dept] += 1;
			}
		    }
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
		+ "id=\"ranking\" valign=\"top\">"
		+ "<thead><tr><th align=\"left\">Rank&nbsp;</th><th align=\"right\">Institution&nbsp;</th><th align=\"right\">Count&nbsp;</th><th align=\"right\">Faculty</th></tr></thead>"
		+ "<tbody>";
	    var i = 0;
	    var oldv = -100;
	    var keys = Object.keys(univagg);
	    keys.sort(function(a,b){return univagg[b] - univagg[a];});
	    for (ind = 0; ind < keys.length; ind++) {
		var k = keys[ind];
		var v = univagg[k];
		if ((ind >= minToRank) && (v != oldv)) {
		    break;
		}
		if (v < 1) {
		    break;
		}
		if (oldv != v) {
		    i = i + 1;
		}
		s += "\n<tr><td>" + i + "</td>";
		s += "<td>" +  k  + "</td>";
		s += "<td align=\"right\">" + v + "</td>";
		s += "<td align=\"right\">" + univcounts[k] + "</td>";
		s += "</tr>\n";
		oldv = v;
	    }
	    s += "</tbody>" + "</table>" + "</div>" + "</div>" + "\n";
	    s += "<br>" + "</body>" + "</html>";
	    outputHTML = s;
	    rankingsInProgress--;
	    setTimeout(redisplay, 0);
	    return false; 
	}
    });
}


