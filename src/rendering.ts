/*
  CSRankings - HTML Rendering

  Functions for generating HTML output and Vega charts.
*/

namespace CSRankings {

    /* Build drop down HTML for a single department's faculty */
    export function buildFacultyHTML(
        _dept: string,
        names: Array<string>,
        facultycount: { [key: string]: number },
        facultyAdjustedCount: { [key: string]: number },
        homepages: { [key: string]: string },
        dblpAuthors: { [key: string]: string },
        note: { [key: string]: string },
        acmfellow: { [key: string]: number },
        turing: { [key: string]: number },
        scholarInfo: { [key: string]: string },
        areaStringFn: (name: string) => string,
        ChartIcon: string,
        _subareas: { [key: string]: string }
    ): string {

        let p = '<div class="table"><table class="table table-sm table-striped"><thead><th></th><td><small><em>'
            + '<abbr title="Click on an author\'s name to go to their home page.">Faculty</abbr></em></small></td>'
            + '<td align="right"><small><em>&nbsp;&nbsp;<abbr title="Total number of publications (click for DBLP entry).">\#&nbsp;Pubs</abbr>'
            + ' </em></small></td><td align="right"><small><em><abbr title="Count divided by number of co-authors">Adj.&nbsp;\#</abbr></em>'
            + '</small></td></thead><tbody>';

        /* Build a dict of just faculty from this department for sorting purposes. */
        let fc: { [key: string]: number } = {};
        for (const name of names) {
            fc[name] = facultycount[name];
        }
        let keys = Object.keys(fc);
        keys.sort((a: string, b: string) => {
            if (fc[b] === fc[a]) {
                const fb = Math.round(10.0 * facultyAdjustedCount[b]) / 10.0;
                const fa = Math.round(10.0 * facultyAdjustedCount[a]) / 10.0;
                if (fb === fa) {
                    return compareNames(a, b);
                } else {
                    return fb - fa;
                }
            } else {
                return fc[b] - fc[a];
            }
        });

        for (const name of keys) {
            const homePage = encodeURI(homepages[name]);
            const dblpName = dblpAuthors[name];

            p += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td><small>"
                + `<a title="Click for author\'s home page." target="_blank" href="${homePage}" `
                + `onclick="trackOutboundLink('${homePage}', true); return false;"`
                + `>${name}</a>&nbsp;`;
            if (note.hasOwnProperty(name)) {
                const url = noteMap[note[name]];
                const href = `<a href="${url}">`;
                p += `<span class="note" title="Note">[${href + note[name]}</a>]</span>&nbsp;`;
            }
            if (acmfellow.hasOwnProperty(name)) {
                p += `<span title="ACM Fellow (${acmfellow[name]})"><img alt="ACM Fellow" src="${acmfellowImage}"></span>&nbsp;`;
            }
            if (turing.hasOwnProperty(name)) {
                p += `<span title="Turing Award"><img alt="Turing Award" src="${turingImage}"></span>&nbsp;`;
            }
            const areaStr = areaStringFn(name);
            p += `<span class="areaname">${areaStr.toLowerCase()}</span>&nbsp;`;

            p += `<a title="Click for author\'s home page." target="_blank" href="${homePage}" `
                + `onclick="trackOutboundLink(\'${homePage}\', true); return false;"`
                + '>'
                + `<img alt=\"Home page\" src=\"${homepageImage}\"></a>&nbsp;`;

            if (scholarInfo.hasOwnProperty(name)) {
                if (scholarInfo[name] != "NOSCHOLARPAGE") {
                    const url = `https://scholar.google.com/citations?user=${scholarInfo[name]}&hl=en&oi=ao`;
                    p += `<a title="Click for author\'s Google Scholar page." target="_blank" href="${url}" onclick="trackOutboundLink('${url}', true); return false;">`
                        + '<img alt="Google Scholar" src="scholar-favicon.ico" height="10" width="10"></a>&nbsp;';
                }
            }

            p += `<a title="Click for author\'s DBLP entry." target="_blank" href="${dblpName}" onclick="trackOutboundLink('${dblpName}', true); return false;">`;
            p += '<img alt="DBLP" src="dblp.png">'
                + '</a>';

            p += `<span onclick='csr.toggleChart("${escape(name)}"); ga("send", "event", "chart", "toggle", "toggle ${escape(name)} ${$("#charttype").find(":selected").val()} chart");' title="Click for author's publication profile." class="hovertip" id="${escape(name) + '-chartwidget'}">`;
            p += ChartIcon + "</span>"
                + '</small>'
                + '</td><td align="right"><small>'
                + `<a title="Click for author's DBLP entry." target="_blank" href="${dblpName}" `
                + `onclick="trackOutboundLink('${dblpName}', true); return false;">${fc[name]}</a>`
                + "</small></td>"
                + '<td align="right"><small>'
                + (Math.round(10.0 * facultyAdjustedCount[name]) / 10.0).toFixed(1)
                + "</small></td></tr>"
                + "<tr><td colspan=\"4\">"
                + `<div class="csr-chart" id="${escape(name)}-chart">`
                + '</div>'
                + "</td></tr>";
        }
        p += "</tbody></table></div>";
        return p;
    }

    /* Build the main output ranking table */
    export function buildOutputString(
        numAreas: number,
        countryAbbrv: { [key: string]: string },
        countryNames: { [key: string]: string },
        deptCounts: { [key: string]: number },
        univtext: { [key: string]: string },
        stats: { [key: string]: number },
        useDenseRankings: boolean,
        ChartIcon: string
    ): string {
        let s = makePrologue();
        /* Show the top N (with more if tied at the end) */

        s = s + '<thead><tr><th align="left"><font color="#777">#</font></th><th align="left"><font color="#777">Institution</font>'
            + '&nbsp;'.repeat(20)      /* Hopefully max length of an institution. */
            + '</th><th align="right">'
            + '<abbr title="Geometric mean count of papers published across all areas."><font color="#777">Count</font>'
            + '</abbr></th><th align="right">&nbsp;<abbr title="Number of faculty who have published in these areas."><font color="#777">Faculty</font>'
            + '</abbr></th></th></tr></thead>';

        s = s + "<tbody>";
        /* As long as there is at least one thing selected, compute and display a ranking. */
        if (numAreas > 0) {
            let ties = 1;               /* number of tied entries so far (1 = no tie yet); used to implement "competition rankings" */
            let rank = 0;               /* index */
            let oldv = 9999999.999;     /* old number - to track ties */
            /* Sort the university aggregate count from largest to smallest. */
            // First, round the stats.
            for (const k in stats) {
                const v = Math.round(10.0 * stats[k]) / 10.0;
                stats[k] = v;
            }
            // Now sort them,
            const keys2 = sortIndex(stats);
            /* Display rankings until we have shown `minToRank` items or
               while there is a tie (those all get the same rank). */
            for (let ind = 0; ind < keys2.length; ind++) {
                const dept = keys2[ind];
                const v = stats[dept];

                if ((ind >= minToRank) && (v != oldv)) {
                    break;
                }
                if (v === 0.0) {
                    break;
                }
                if (oldv != v) {
                    if (useDenseRankings) {
                        rank = rank + 1;
                    } else {
                        rank = rank + ties;
                        ties = 0;
                    }
                }
                const esc = escape(dept);
                s += "\n<tr><td>" + rank;
                // Print spaces to hold up to 4 digits of ranked schools.
                s += "&nbsp;".repeat(4 - Math.ceil(Math.log10(rank)));
                s += "</td>";
                s += "<td>"
                    + `<span class="hovertip" onclick="csr.toggleFaculty('${esc}');" id="${esc}-widget">`
                    + RightTriangle
                    + "</span>";

                let abbrv = "us";
                if (dept in countryAbbrv) {
                    abbrv = countryAbbrv[dept];
                }

                const country = countryNames[abbrv.toUpperCase()] ?? abbrv.toUpperCase();

                s += "&nbsp;" + `<span onclick="csr.toggleFaculty('${esc}');">${dept}</span>`
                    + `&nbsp;<img  title="${country}" src="/flags/${abbrv}.png">&nbsp;`
                    + `<span class="hovertip" onclick='csr.toggleChart("${esc}"); ga("send", "event", "chart", "toggle-department", "toggle ${esc} ${$("#charttype").find(":selected").val()} chart");' id='${esc + "-chartwidget"}'>`
                    + ChartIcon + "</span>";
                s += "</td>";

                s += `<td align="right">${(Math.round(10.0 * v) / 10.0).toFixed(1)}</td>`;
                s += `<td align="right">${deptCounts[dept]}`; /* number of faculty */
                s += "</td>";
                s += "</tr>\n";
                // style="width: 100%; height: 350px;"
                s += `<tr><td colspan="4"><div class="csr-chart" id="${esc}-chart"></div></td></tr>`;
                s += `<tr><td colspan="4"><div style="display:none;" id="${esc}-faculty">${univtext[dept]}</div></td></tr>`;
                ties++;
                oldv = v;
            }
            s += "</tbody>" + "</table>" + "<br />";
            s += "</div>" + "</div>" + "\n";
            s += "<br>" + "</body>" + "</html>";
        } else {
            /* Nothing selected. */
            s = "<h3>Please select at least one area by clicking one or more checkboxes.</h3>";
        }
        return s;
    }

    /* Create a bar or pie chart using Vega. Modified by Minsuk Kahng (https://minsuk.com) */
    export function makeChart(
        name: string,
        isPieChart: boolean,
        authorAreas: { [name: string]: { [area: string]: number } },
        areaDict: { [key: string]: string }
    ): void {
        let data: Array<any> = [];
        let datadict: { [key: string]: number } = {};
        const keys = topTierAreas;
        const uname = unescape(name);

        // Areas with their category info for color map (from https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=4).
        const chartAreas = [
            ...aiAreas.map(key =>
                ({ key: key, label: areaDict[key], color: "#377eb8" })),
            ...systemsAreas.map(key =>
                ({ key: key, label: areaDict[key], color: "#ff7f00" })),
            ...theoryAreas.map(key =>
                ({ key: key, label: areaDict[key], color: "#4daf4a" })),
            ...interdisciplinaryAreas.map(key =>
                ({ key: key, label: areaDict[key], color: "#984ea3" }))
        ];
        chartAreas.forEach(area => datadict[area.key] = 0);

        for (let key in keys) {
            if (!(uname in authorAreas)) {
                // Defensive programming.
                // This should only happen if we have an error in the aliases file.
                return;
            }
            // Round it to the nearest 0.1.
            const value = Math.round(authorAreas[uname][key] * 10) / 10;

            if (value > 0) {
                if (key in parentMap) {
                    key = parentMap[key];
                }
                datadict[key] += value;
            }
        }

        let valueSum = 0;
        chartAreas.forEach(area => {
            valueSum += datadict[area.key];
        });
        chartAreas.forEach((area, index) => {
            const newSlice = {
                index: index,
                area: areaDict[area.key],
                value: Math.round(datadict[area.key] * 10) / 10,
                ratio: datadict[area.key] / valueSum
            };
            data.push(newSlice);

            area.label = areaDict[area.key];
        });

        const colors = chartAreas.sort((a, b) =>
            a.label > b.label ? 1 : (a.label < b.label ? -1 : 0)
        ).map(area => area.color);

        const vegaLiteBarChartSpec = {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            data: {
                values: data
            },
            mark: "bar",
            encoding: {
                x: {
                    field: "area",
                    type: "nominal",
                    sort: null,
                    axis: { title: null }
                },
                y: {
                    field: "value",
                    type: "quantitative",
                    axis: { title: null }
                },
                tooltip: [
                    { "field": "area", "type": "nominal", "title": "Area" },
                    { "field": "value", "type": "quantitative", "title": "Count" }
                ],
                color: {
                    field: "area",
                    type: "nominal",
                    scale: { "range": colors },
                    legend: null
                }
            },
            width: 420,
            height: 80,
            padding: { left: 25, top: 3 }
        };

        const vegaLitePieChartSpec = {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            data: {
                values: data
            },
            encoding: {
                theta: {
                    field: "value",
                    type: "quantitative",
                    stack: true
                },
                color: {
                    field: "area",
                    type: "nominal",
                    scale: { "range": colors },
                    legend: null
                },
                order: { field: "index" },
                tooltip: [
                    { field: "area", type: "nominal", title: "Area" },
                    { field: "value", type: "quantitative", title: "Count" },
                    { field: "ratio", type: "quantitative", title: "Ratio", format: ".1%" }
                ]
            },
            layer: [
                {
                    mark: { type: "arc", outerRadius: 90, stroke: "#fdfdfd", strokeWidth: 1 }
                },
                {
                    mark: { type: "text", radius: 108, dy: -3 },
                    encoding: {
                        text: { field: "area", type: "nominal" },
                        color: {
                            condition: { test: "datum.ratio < 0.03", value: "rgba(255, 255, 255, 0)" },
                            field: "area",
                            type: "nominal",
                            scale: { "range": colors }
                        }
                    }
                },
                {
                    mark: { type: "text", radius: 108, fontSize: 9, dy: 7 },
                    encoding: {
                        text: { field: "value", type: "quantitative" },
                        color: {
                            condition: { test: "datum.ratio < 0.03", value: "rgba(255, 255, 255, 0)" },
                            field: "area",
                            type: "nominal",
                            scale: { "range": colors }
                        }
                    }
                }
            ],
            width: 400,
            height: 250,
            padding: { left: 25, top: 3 }
        };

        vegaEmbed(`div[id="${name}-chart"]`,
            isPieChart ? vegaLitePieChartSpec : vegaLiteBarChartSpec,
            { actions: false }
        );
    }

}
