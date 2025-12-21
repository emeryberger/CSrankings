/*
  CSRankings - Navigation and URL Handling

  URL construction, navigation routing, and geolocation handling.
*/

namespace CSRankings {

    /* Build the URL string based on current checkbox selections */
    export function buildURLString(
        fields: Array<string>,
        getCheckboxState: (field: string) => boolean
    ): { s: string; count: number; totalParents: number } {
        let s = '';
        let count = 0;
        let totalParents = 0;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (!(field in parentMap)) {
                totalParents += 1;
            }
            if (getCheckboxState(field)) {
                // Only add parents.
                if (!(field in parentMap)) {
                    // And only add if every top tier child is checked
                    // and only if every next tier child is NOT
                    // checked.
                    let allChecked = 1;
                    if (field in childMap) {
                        childMap[field].forEach((k) => {
                            const val = getCheckboxState(k) ? 1 : 0;
                            if (!(k in nextTier)) {
                                allChecked &= val;
                            } else {
                                allChecked &= val ? 0 : 1;
                            }
                        });
                    }
                    if (allChecked) {
                        s += `${field}&`;
                        count += 1;
                    }
                }
            }
        }
        if (count > 0) {
            // Trim off the trailing '&'.
            s = s.slice(0, -1);
        }
        return { s, count, totalParents };
    }

    /* Build full URL with year, region, and chart type parameters */
    export function buildFullURL(
        fields: Array<string>,
        getCheckboxState: (field: string) => boolean,
        _usePieChart: boolean
    ): { url: string; usePieChart: boolean; ChartIcon: string; OpenChartIcon: string } {
        const { s, count, totalParents } = buildURLString(fields, getCheckboxState);

        const region = $("#regions").find(":selected").val();
        let start = '';
        // Check the dates.
        const d = new Date();
        const currYear = d.getFullYear();
        const startyear = parseInt($("#fromyear").find(":selected").text());
        const endyear = parseInt($("#toyear").find(":selected").text());
        if ((startyear != currYear - 10) || (endyear != currYear)) {
            start += `/fromyear/${startyear.toString()}`;
            start += `/toyear/${endyear.toString()}`;
        }

        if (count == totalParents) {
            start += '/index?all'; // Distinguished special URL - default = all selected.
        } else if (count == 0) {
            start += '/index?none'; // Distinguished special URL - none selected.
        } else {
            start += `/index?${s}`;
        }
        if (region != "USA") {
            start += `&${region}`;
        }

        let newUsePieChart = _usePieChart;
        let ChartIcon = BarChartIcon;
        let OpenChartIcon = OpenBarChartIcon;

        const chartType = $("#charttype").find(":selected").val();
        if (chartType == "pie") {
            newUsePieChart = true;
            for (const elt of document.getElementsByClassName("chart_icon")) {
                (<HTMLInputElement>elt).src = "png/piechart.png";
            }
            for (const elt of document.getElementsByClassName("open_chart_icon")) {
                (<HTMLInputElement>elt).src = "png/piechart-open.png";
            }
            for (const elt of document.getElementsByClassName("closed_chart_icon")) {
                (<HTMLInputElement>elt).src = "png/piechart.png";
            }
            ChartIcon = PieChartIcon;
            OpenChartIcon = OpenPieChartIcon;
            start += '&pie';
        } else {
            newUsePieChart = false;
            for (const elt of document.getElementsByClassName("chart_icon")) {
                (<HTMLInputElement>elt).src = "png/barchart.png";
            }
            for (const elt of document.getElementsByClassName("open_chart_icon")) {
                (<HTMLInputElement>elt).src = "png/barchart-open.png";
            }
            for (const elt of document.getElementsByClassName("closed_chart_icon")) {
                (<HTMLInputElement>elt).src = "png/barchart.png";
            }
        }

        return { url: start, usePieChart: newUsePieChart, ChartIcon, OpenChartIcon };
    }

    /* Handle navigation from URL query parameters */
    export function handleNavigation(
        params: { [key: string]: string } | null,
        query: string,
        invalidateCheckboxCache: () => void
    ): void {
        if (params !== null) {
            // Set params (fromyear and toyear).
            Object.keys(params).forEach((key) => {
                $(`#${key}`).prop('value', params[key].toString());
            });
        }
        // Clear everything *unless* there are subsets / below-the-fold selected.
        clearNonSubsetted(invalidateCheckboxCache);
        // Now check everything listed in the query string.
        let q = query.split('&');
        // If there is an 'all' in the query string, set everything to true.
        const foundAll = q.some((elem) => {
            return (elem == "all");
        });
        // For testing: if 'survey' is in the query string, reveal the survey overlay.
        const foundSurvey = q.some((elem) => {
            return (elem == "survey");
        });
        if (foundSurvey) {
            document!.getElementById("overlay-survey")!.style.display = "block";
        }
        const foundNone = q.some((elem) => {
            return (elem == "none");
        });
        // Check for regions and strip them out.
        const foundRegion = q.some((elem) => {
            return regions.indexOf(elem) >= 0;
        });
        if (foundRegion) {
            let index = 0;
            q.forEach((elem) => {
                // Splice it out.
                if (regions.indexOf(elem) >= 0) {
                    q.splice(index, 1);
                    // Set the region.
                    $("#regions").val(elem);
                }
                index += 1;
            });
        }
        // Check for pie chart
        const foundPie = q.some((elem) => {
            return (elem == "pie");
        });
        if (foundPie) {
            $("#charttype").val("pie");
        }

        if (foundAll) {
            // Set everything.
            for (const item in topTierAreas) {
                const element = document.getElementById(item) as HTMLInputElement;
                if (element) {
                    element.checked = true;
                    if (item in childMap) {
                        // It's a parent. Enable it.
                        element.disabled = false;
                        // and activate all children.
                        childMap[item].forEach((k) => {
                            if (!(k in nextTier)) {
                                const childElement = document.getElementById(k) as HTMLInputElement;
                                if (childElement) {
                                    childElement.checked = true;
                                }
                            }
                        });
                    }
                }
            }
            // And we're out.
            invalidateCheckboxCache();
            return;
        }
        if (foundNone) {
            // Clear everything and return.
            clearNonSubsetted(invalidateCheckboxCache);
            return;
        }
        // Just a list of areas.
        // First, clear everything that isn't subsetted.
        clearNonSubsetted(invalidateCheckboxCache);
        // Then, activate the areas in the query.
        for (const item of q) {
            if ((item != "none") && (item != "")) {
                const element = document.getElementById(item) as HTMLInputElement;
                if (element) {
                    element.checked = true;
                    element.disabled = false;
                    if (item in childMap) {
                        // Activate all children.
                        childMap[item].forEach((k) => {
                            if (!(k in nextTier)) {
                                const childElement = document.getElementById(k) as HTMLInputElement;
                                if (childElement) {
                                    childElement.checked = true;
                                }
                            }
                        });
                    }
                }
            }
        }
        invalidateCheckboxCache();
    }

    /* Clear all checkboxes that are not subsetted */
    export function clearNonSubsetted(invalidateCheckboxCache: () => void): void {
        for (const item of areas) {
            if (item in childMap) {
                const kids = childMap[item];
                if (!subsetting(kids)) {
                    const element = document.getElementById(item) as HTMLInputElement;
                    if (element) {
                        element.checked = false;
                        element.disabled = false;
                    }
                    kids.forEach((kid) => {
                        const kidElement = document.getElementById(kid) as HTMLInputElement;
                        if (kidElement) {
                            kidElement.checked = false;
                        }
                    });
                }
            }
        }
        // Invalidate the checkbox cache since we modified checkboxes
        invalidateCheckboxCache();
    }

    /* Check if siblings are subsetted (some but not all selected) */
    export function subsetting(sibs: string[]): boolean {
        // Separate the siblings into above and below the fold.
        let aboveFold: string[] = [];
        let belowFold: string[] = [];
        sibs.forEach((elem) => {
            if (elem in nextTier) {
                belowFold.push(elem);
            } else {
                aboveFold.push(elem);
            }
        });
        // Count how many are checked above and below.
        let numCheckedAbove = 0;
        aboveFold.forEach((elem) => {
            const element = document.getElementById(elem) as HTMLInputElement;
            if (element && element.checked) {
                numCheckedAbove++;
            }
        });
        let numCheckedBelow = 0;
        belowFold.forEach((elem) => {
            const element = document.getElementById(elem) as HTMLInputElement;
            if (element && element.checked) {
                numCheckedBelow++;
            }
        });
        const subsettedAbove = ((numCheckedAbove > 0) && (numCheckedAbove < aboveFold.length));
        const subsettedBelow = ((numCheckedBelow > 0) && (belowFold.length != 0));
        return subsettedAbove || subsettedBelow;
    }

    /* Check geolocation and set region accordingly */
    export function geoCheck(rankCallback: () => void): void {
        navigator.geolocation?.getCurrentPosition((position) => {
            const continent = whichContinent(position.coords.latitude, position.coords.longitude);
            let regionsEl = (<HTMLInputElement>document.getElementById("regions"));
            switch (continent) {
                case "northamerica":
                    return;
                case "europe":
                case "asia":
                case "southamerica":
                case "africa":
                    regionsEl!.value = continent;
                    break;
                default:
                    regionsEl!.value = "world";
                    break;
            }
            rankCallback();
        });
    }

}
