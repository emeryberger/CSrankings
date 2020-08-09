
  // This script is adapted from https://bost.ocks.org/mike/uberdata/
  
  var layout;
  var svg;
  var arc;
  var radialHeight = 36;
  var path;
  var drawnOne = false;
  
function redraw() {
  var institution = jQuery("#institution").find(":selected").text();
  
    var width =  800,
	height = 800,
    outerRadius = Math.min(width, height) / 2 - 10,
    innerRadius = outerRadius - radialHeight;

arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

layout = d3.layout.chord()
    .padding(.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.ascending);

path = d3.svg.chord()
    .radius(innerRadius);

svg = d3.select("body").select("table").select("td").select("div").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("circle")
    .attr("r", outerRadius);

    queue()
    .defer(d3.csv, "graphs/" + institution + "-graph-nodes.csv")
    .defer(d3.json, "graphs/" + institution + "-graph-matrix.json")
    .await(ready);
  }
  
function ready(error, authors, matrix) {
  if (error) throw error;

  if (drawnOne) {
    d3.select("svg").remove();
  }
  // Compute the chord layout.
  layout.matrix(matrix);

  // Add a group per neighborhood.
  var group = svg.selectAll(".group")
      .data(layout.groups)
    .enter().append("g")
      .attr("class", "group")
      .on("mouseover", mouseover);

  // Add a mouseover title.
  group.append("title").text(function(d, i) {
    return authors[i].name + " (" + d.value + ")";
  });

  // Add the group arc.
  var groupPath = group.append("path")
      .attr("id", function(d, i) { return "group" + i; })
      .attr("d", arc)
      .style("fill", function(d, i) { return authors[i].color; });

  // Add a text label.
  var groupText = group.append("text")
      .attr("x", 6)
      .attr("dy", 15);

  groupText.append("textPath")
      .attr("xlink:href", function(d, i) { return "#group" + i; })
      .text(function(d, i) { return authors[i].abbrv; });

  // Remove the labels that don't fit. :(
  groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - 1.1 * radialHeight < this.getComputedTextLength(); })
      .remove();

  // Add the chords.
  var chord = svg.selectAll(".chord")
      .data(layout.chords)
    .enter().append("path")
      .attr("class", "chord")
     .style("fill", function(d) { if (authors[d.source.index].coauthored === "0") { return "none"; } else { return authors[d.source.index].color; }})
     .style("stroke", function(d) { if (authors[d.source.index].coauthored === "0") { return "none"; } else { return "#000000"; }})
      .attr("d", path);

  // Add an elaborate mouseover title for each chord.
    chord.append("title").text(function(d) {
	// Sort names.
	n1 = authors[d.source.index].name;
	n2 = authors[d.target.index].name;
	if (n1 > n2) {
	    [n1, n2] = [n2, n1]
	}
	return n1 + " - " + n2 + " (" + d.target.value + ")";
  });

  function mouseover(d, i) {
    chord.classed("fade", function(p) {
      return p.source.index != i
          && p.target.index != i;
    });
    }
    drawnOne = true;
}
window.onload=redraw;
