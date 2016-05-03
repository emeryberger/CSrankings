

function slidersetup()
{
    var rank_slider = [];
    var str = 'rank_slider_';
    for (i = 1; i <= 17; i++) {
       rank_slider[i] = $(str.concat(i.toString()));
    }

    // Define a whole bunch of slider controls
    // BTO: i think they did it with copied code bcs getting closure variables to work
    // in js is a pain. have to use "this" somehow.
    // START CODEGEN

    new Control.Slider(rank_slider[1].down('.handle'),
      rank_slider[1], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_1";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_1";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[2].down('.handle'),
      rank_slider[2], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_2";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_2";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[3].down('.handle'),
      rank_slider[3], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_3";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_3";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[4].down('.handle'),
      rank_slider[4], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_4";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_4";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[5].down('.handle'),
      rank_slider[5], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_5";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_5";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[6].down('.handle'),
      rank_slider[6], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_6";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_6";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[7].down('.handle'),
      rank_slider[7], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_7";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_7";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[8].down('.handle'),
      rank_slider[8], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_8";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_8";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[9].down('.handle'),
      rank_slider[9], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_9";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_9";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[10].down('.handle'),
      rank_slider[10], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_10";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_10";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[11].down('.handle'),
      rank_slider[11], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_11";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_11";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[12].down('.handle'),
      rank_slider[12], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_12";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_12";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[13].down('.handle'),
      rank_slider[13], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_13";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_13";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[14].down('.handle'),
      rank_slider[14], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_14";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_14";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[15].down('.handle'),
      rank_slider[15], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_15";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_15";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[16].down('.handle'),
      rank_slider[16], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_16";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_16";
        $(str).value = value.toFixed(2);
      }
     });

    new Control.Slider(rank_slider[17].down('.handle'),
      rank_slider[17], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_17";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_17";
        $(str).value = value.toFixed(2);
      }
     });

    // END CODEGEN
}

