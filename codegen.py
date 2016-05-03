template1 = """
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
CODEGEN_HERE
    // END CODEGEN
}
"""
template2 = """
    new Control.Slider(rank_slider[NUM].down('.handle'),
      rank_slider[NUM], {
      range: $R(0, 4),
      values: [0,1,2,3,4],
      sliderValue: 4,
      onSlide: function(value) {
        var str = "field_NUM";
        $(str).value = value.toFixed(2);
      },
      onChange: function(value) {
        var str = "field_NUM";
        $(str).value = value.toFixed(2);
      }
     });
"""

inner_templates = ""
for i in range(1,18):
    inner_templates += template2.replace("NUM", str(i))

with open("slider_codegen.js",'w') as f:
    print>>f, template1.replace("CODEGEN_HERE", inner_templates)
