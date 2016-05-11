var r = [];

var setup = false;

function updateRank() {
    setTimeout(rank, 250);
    // rank();
}

function slidersetup()
{
    if (!setup) {
	var rank_slider = [];
	var str = 'rank_slider_';

	for (i = 1; i <= 17; i++) {
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
					  updateRank();
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
					  updateRank();
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
					  updateRank();
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
					  updateRank();
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
					  updateRank();
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
					  updateRank();
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
					  updateRank();
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
					  updateRank();
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
					  updateRank();
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
					   updateRank();
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
					   updateRank();
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
					   updateRank();
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
					   updateRank();
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
					   updateRank();
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
					   updateRank();
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
					   updateRank();
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
					   updateRank();
				       }
				   });
	setup = true;
    }
}

window.onload=init;
form=document.getElementById("rankform");

function init() {
    slidersetup();
    rank();
}

function activatePL() {
    r[1].setValue(1.0);
    r[2].setValue(1.0);
    for (i = 3; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    rank();
    return false;
}

function activateSystems() {
    r[1].setValue(0.0);
    r[2].setValue(0.0);
    for (i = 3; i <= 7; i++) {
	r[i].setValue(1.0);
    }
    for (i = 8; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    rank();
    return false;
}

function activateAI() {
    for (i = 1; i <= 7; i++) {
	r[i].setValue(0.0);
    }
    for (i = 8; i <= 12; i++) {
	r[i].setValue(1.0);
    }
    for (i = 13; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    rank();
    return false;
}

function activateTheory() {
    for (i = 1; i <= 12; i++) {
	r[i].setValue(0.0);
    }
    for (i = 13; i <= 14; i++) {
	r[i].setValue(1.0);
    }
    for (i = 15; i <= 17; i++) {
	r[i].setValue(0.0);
    }
    rank();
    return false;
}

function activateOthers() {
    for (i = 1; i <= 14; i++) {
	r[i].setValue(0.0);
    }
    for (i = 15; i <= 17; i++) {
	r[i].setValue(1.0);
    }
    rank();
    return false;
}

function activateAll() {
    for (i = 1; i <= 17; i++) {
	r[i].setValue(1.0);
    }
}

function rank() {
    if (true) {
	univcounts = {};
	authcounts = {};
	visited = {};
	univagg = {}; /* (university, total number of papers) */
	univmax = {}; /* (university, max number of papers) */
	univwww = {}; /* (university, web page) */
	authagg = {}; /* (author, number of papers) -- used to compute max papers from university per area */
	univper = {}; /* (university, total papers divided by group size) */
	universities = {};
	authors = {};
	Papa.parse("universities-2.csv", {
		download : true,
		    header : true,
		    complete: function(results) {
		    universities = results.data;
		    Papa.parse("intauthors-all-2.csv", {
			    download : true,
				header : true,
				complete: function(results) {
				authors = results.data;
				weights = {};
				weights["proglang"] = parseFloat(jQuery("#field_1"));
				console.log(weights["proglang"]);
				/* 
				   weights['logic'] = float(form.getvalue('logic'))
				   weights['softeng'] = float(form.getvalue('softeng'))
				   weights['opsys'] = float(form.getvalue('opsys'))
				   weights['arch'] = float(form.getvalue('arch'))
				   weights['theory'] = float(form.getvalue('theory'))
				   weights['networks'] = float(form.getvalue('networks'))
				   weights['security'] = float(form.getvalue('security'))
				   weights['mlmining'] = float(form.getvalue('mlmining'))
				   weights['ai'] = float(form.getvalue('ai'))
				   weights['database'] = float(form.getvalue('database'))
				   weights['metrics'] = float(form.getvalue('metrics'))
				   weights['web'] = float(form.getvalue('web'))
				   weights['hci'] = float(form.getvalue('hci'))
				   weights['graphics'] = float(form.getvalue('graphics'))
				   weights['nlp'] = float(form.getvalue('nlp'))
				   weights['vision'] = float(form.getvalue('vision'))
				*/
				startyear = parseInt(jQuery("#startyear").find(":selected").text());
				endyear = parseInt(jQuery("#endyear").find(":selected").text());
				console.log(startyear);
				console.log(endyear);
				for (var r in authors) {
				    var name = authors[r].name;
				    var dept = authors[r].dept;
				    var area = authors[r].area;
				    var count = authors[r].count;
				    var year = authors[r].year;
				    console.log(authors[r]);
				    if ((year >= startyear) && (year <= endyear)) {
					if (!(dept in univagg)) {
					    univagg[dept] = 0;
					}
					univagg[dept] += parseInt(count) * weights[area];
					console.log(univagg[dept]);
				    }
				}
				s = "Content-type: text/html" + ""
				    + "<html>"
				    + "<head>"
				    + "<title>CS department rankings by productivity</title>"
				    + "</head>"
				    + "<body>" 
				    + "<div class=\"table-responsive\">"
				    + "<table class=\"table table-striped\""
				    + "id=\"ranking\" valign=\"top\">"
				    + "<thead><tr><th>Rank</th><th>Institution</th><th>Score</th><th>Faculty</th></tr></thead>"
				    + "<tbody>";

			    }
			});
		}
	    });
    }
    var formdata = form.serialize(); // Serialize all form data
    jQuery.get("cgi-bin/rankings-output.cgi", formdata, function( data ) {
	    jQuery("#success").html(data);
	});

    return false; 
}


