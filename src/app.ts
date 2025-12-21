/*
  CSRankings - Main Application

  The main App class that orchestrates the ranking system.
*/

namespace CSRankings {

    export class App {

        private static theInstance: App; // singleton for this object

        private note: { [name: string]: string } = {};

        private navigoRouter: Navigo;

        // Return the singleton corresponding to this object.
        public static getInstance(): App {
            return App.theInstance;
        }

        // Promises polyfill.
        public static promise(cont: () => void): void {
            if (typeof Promise !== "undefined") {
                var resolved = Promise.resolve();
                resolved.then(cont);
            } else {
                setTimeout(cont, 0);
            }
        }

        private readonly allowRankingChange = false;   /* Can we change the kind of rankings being used? */

        /* Map names to Google Scholar IDs. */
        private readonly scholarInfo: { [key: string]: string } = {};

        /* Map aliases to canonical author name. */
        private readonly aliases: { [key: string]: string } = {};

        /* Map Turing award winners to year */
        private readonly turing: { [key: string]: number } = {};

        /* Map ACM Fellow award winners to year */
        private readonly acmfellow: { [key: string]: number } = {};

        /* Map institution to region. */
        private readonly countryInfo: { [key: string]: string } = {};

        /* Map country codes (abbreviations) to names. */
        private readonly countryNames: { [key: string]: string } = {};

        /* Map institution to (non-US) abbreviation. */
        private readonly countryAbbrv: { [key: string]: string } = {};

        /* Map name to home page. */
        private readonly homepages: { [key: string]: string } = {};

        /* Set to true for "dense rankings" vs. "competition rankings". */
        private readonly useDenseRankings: boolean = false;

        /* The data which will hold the parsed CSV of author info. */
        private authors: Array<Author> = [];

        /* The DBLP-transformed strings per author. */
        private dblpAuthors: { [name: string]: string } = {};

        /* Map authors to the areas they have published in (for pie chart display). */
        private authorAreas: { [name: string]: { [area: string]: number } } = {};

        /* Computed stats (univagg). */
        private stats: { [key: string]: number } = {};

        private areaDeptAdjustedCount: { [key: string]: number } = {}; /* area+dept */

        private areaStringMap: { [key: string]: string } = {}; // name -> areaString (memoized)

        private usePieChart: boolean = false;

        /* Cached checkbox states to avoid repeated DOM queries */
        private checkboxCache: { [key: string]: boolean } = {};
        private checkboxCacheValid: boolean = false;

        /* Debounce timer for rank() calls */
        private rankDebounceTimer: number | null = null;
        private readonly RANK_DEBOUNCE_MS: number = 16; // ~1 frame

        /* === INCREMENTAL UPDATE CACHING === */
        private incrementalCache: IncrementalCache = {
            valid: false,
            startyear: 0,
            endyear: 0,
            regions: '',
            areaData: {},
            deptNames: {},
            deptCounts: {},
            facultyAreaData: {},
            allFaculty: {}
        };

        /* Enable/disable verification mode to compare incremental vs full computation */
        /* Can be toggled from console: csr.setVerifyIncremental(true) */
        public verifyIncremental: boolean = false;

        /* === RENDERING OPTIMIZATION CACHING === */
        /* Cache for faculty dropdown HTML - only changes when year/region changes */
        private facultyDropdownCache: {
            valid: boolean;
            startyear: number;
            endyear: number;
            regions: string;
            html: { [dept: string]: string };
        } = {
                valid: false,
                startyear: 0,
                endyear: 0,
                regions: '',
                html: {}
            };

        /* Current chart icons */
        private ChartIcon = BarChartIcon;
        private OpenChartIcon = OpenBarChartIcon;

        /* Instance lookup tables (populated in constructor) */
        private readonly areaNames: Array<string> = [];
        private readonly fields: Array<string> = [];
        private readonly aiFields: Array<number> = [];
        private readonly systemsFields: Array<number> = [];
        private readonly theoryFields: Array<number> = [];
        private readonly otherFields: Array<number> = [];

        /* Map area to its name (from areaNames). */
        private readonly areaDict: { [key: string]: string } = {};

        /* Map area to its position in the list. */
        private readonly areaPosition: { [key: string]: number } = {};

        /* Map subareas to their areas. */
        private readonly subareas: { [key: string]: string } = {};

        /* Data for lazy rendering of faculty dropdowns */
        private lazyRenderData: LazyRenderData | null = null;

        constructor() {
            App.theInstance = this;
            this.navigoRouter = new Navigo(null, true);

            /* Build dictionaries:
               areaDict: areas -> names used in pie charts
               areaPosition: areas -> position in area array
               subareas: subareas -> areas (e.g., "Vision" -> "ai")
            */
            for (let position = 0; position < areaMap.length; position++) {
                const { area, title } = areaMap[position];
                areas[position] = area;
                if (!(area in parentMap)) {
                    topLevelAreas[area] = area;
                }
                if (!(area in nextTier)) {
                    topTierAreas[area] = area;
                }
                this.areaNames[position] = title;
                this.fields[position] = area;
                this.areaDict[area] = title;
                this.areaPosition[area] = position;
            }
            const subareaList = [
                ...aiAreas.map(key =>
                    ({ [this.areaDict[key]]: "ai" })),
                ...systemsAreas.map(key =>
                    ({ [this.areaDict[key]]: "systems" })),
                ...theoryAreas.map(key =>
                    ({ [this.areaDict[key]]: "theory" })),
                ...interdisciplinaryAreas.map(key =>
                    ({ [this.areaDict[key]]: "interdisciplinary" })),
            ];
            for (const item of subareaList) {
                for (const key in item) {
                    this.subareas[key] = item[key];
                }
            }
            for (const area of aiAreas) {
                this.aiFields.push(this.areaPosition[area]);
            }
            for (const area of systemsAreas) {
                this.systemsFields.push(this.areaPosition[area]);
            }
            for (const area of theoryAreas) {
                this.theoryFields.push(this.areaPosition[area]);
            }
            for (const area of interdisciplinaryAreas) {
                this.otherFields.push(this.areaPosition[area]);
            }
            let parentCounter = 0;
            for (const child in parentMap) {
                const parent = parentMap[child];
                if (!(parent in childMap)) {
                    childMap[parent] = [child];
                    parentIndex[parent] = parentCounter;
                    parentCounter += 1;
                } else {
                    childMap[parent].push(child);
                }
            }
            (async () => {
                // Load all CSV files in parallel for faster initial load
                const loadStart = performance.now();
                await Promise.all([
                    loadTuring(this.turing),
                    loadACMFellow(this.acmfellow),
                    loadAuthorInfo(this.dblpAuthors, this.homepages, this.scholarInfo, this.note),
                    loadAuthors().then(authors => { this.authors = authors; }),
                    loadCountryInfo(this.countryInfo, this.countryAbbrv),
                    loadCountryNames(this.countryNames)
                ]);
                console.log(`All CSV files loaded in ${(performance.now() - loadStart).toFixed(1)}ms`);
                this.setAllOn();
                this.navigoRouter.on({
                    '/index': (params: { [key: string]: string }, query: string) => this.navigation(params, query),
                    '/fromyear/:fromyear/toyear/:toyear/index': (params: { [key: string]: string }, query: string) => this.navigation(params, query)
                }).resolve();
                this.recomputeAuthorAreas();
                this.addListeners();
                geoCheck(() => this.rank());
                this.rank();
                // Display survey or sponsorship request
                const surveyShown = tryDisplaySurvey({ disabled: true });
                initSponsorshipTracking(surveyShown);
            })();
        }

        private recomputeAuthorAreas(): void {
            const startyear = parseInt($("#fromyear").find(":selected").text());
            const endyear = parseInt($("#toyear").find(":selected").text());
            this.authorAreas = countAuthorAreas(this.authors, this.areaDict, startyear, endyear);
        }

        private areaString(name: string): string {
            if (name in this.areaStringMap) {
                return this.areaStringMap[name];
            }
            // Create a summary of areas, separated by commas,
            // corresponding to a faculty member's publications.
            const pubThreshold = 0.2;
            const numStddevs = 1.0;
            const topN = 3;
            const minPubThreshold = 1;
            if (!this.authorAreas[name]) {
                return "";
            }
            // Create an object containing areas and number of publications.
            let datadict: { [key: string]: number } = {};
            const keys = topTierAreas;
            let maxValue = 0;
            for (let key in keys) {
                const value = this.authorAreas[name][key];
                if (key in parentMap) {
                    key = this.areaDict[key];
                }
                if (value > 0) {
                    if (!(key in datadict)) {
                        datadict[key] = 0;
                    }
                    datadict[key] += value;
                    maxValue = (datadict[key] > maxValue) ? datadict[key] : maxValue;
                }
            }
            // Now compute the standard deviation.
            let values: Array<number> = [];
            for (const key in datadict) {
                values.push(datadict[key]);
            }
            const sumVal = sum(values);
            let stddevs = 0.0;
            if (values.length > 1) {
                stddevs = Math.ceil(numStddevs * stddev(values));
            }
            // Strip out everything not within the desired number of
            // standard deviations of the max and not crossing the
            // publication threshold.
            let maxes: Array<string> = [];
            for (const key in datadict) {
                if ((datadict[key] >= maxValue - stddevs) &&
                    ((1.0 * datadict[key]) / sumVal >= pubThreshold) &&
                    (datadict[key] > minPubThreshold)) {
                    maxes.push(key);
                }
            }
            // Finally, pick at most the top N.
            const areaList = maxes.sort((x, y) => { return datadict[y] - datadict[x]; }).slice(0, topN);
            // Cache the result.
            this.areaStringMap[name] = areaList.map(n => `<span class="${this.subareas[n]}-area">${n}</span>`).join(",");
            // Return it.
            return this.areaStringMap[name];
        }

        private activateFields(value: boolean,
            fields: Array<number>): boolean {
            return activateFieldSet(
                value,
                fields,
                this.fields,
                () => this.invalidateCheckboxCache(),
                () => this.rank()
            );
        }

        /* Build drop down for faculty names and paper counts - OPTIMIZED with lazy rendering */
        private buildDropDown(deptNames: { [key: string]: Array<string> },
            facultycount: { [key: string]: number },
            facultyAdjustedCount: { [key: string]: number })
            : { [key: string]: string } {
            // Return empty - we'll render faculty HTML lazily when expanded
            let univtext: { [key: string]: string } = {};
            for (const dept in deptNames) {
                // Store placeholder - actual HTML generated on demand in toggleFaculty
                univtext[dept] = "";
            }
            // Store the data needed for lazy rendering
            this.lazyRenderData = { deptNames, facultycount, facultyAdjustedCount };
            return univtext;
        }

        /* Invalidate the checkbox cache - call this when checkboxes change */
        public invalidateCheckboxCache(): void {
            this.checkboxCacheValid = false;
        }

        /* Invalidate the incremental cache - call when year/region changes */
        private invalidateIncrementalCache(): void {
            this.incrementalCache.valid = false;
        }

        /* Refresh the checkbox cache by reading all checkbox states at once */
        private refreshCheckboxCache(): void {
            if (this.checkboxCacheValid) {
                return;
            }
            refreshCheckboxCache(this.fields, this.checkboxCache);
            this.checkboxCacheValid = true;
        }

        /* Get checkbox state from cache (refreshes cache if invalid) */
        private getCheckboxState(area: string): boolean {
            if (!this.checkboxCacheValid) {
                this.refreshCheckboxCache();
            }
            return this.checkboxCache[area] || false;
        }

        /* Updates the 'weights' of each area from the checkboxes. */
        /* Returns the number of areas selected (checked). */
        private updateWeights(weights: { [key: string]: number }): number {
            // Refresh cache once at the start
            this.refreshCheckboxCache();
            return updateWeightsFromCache(weights, this.checkboxCache);
        }

        /* This activates all checkboxes _without_ triggering ranking. */
        private setAllOn(value: boolean = true): void {
            setAllCheckboxes(this.fields, value, () => this.invalidateCheckboxCache());
        }

        /* PUBLIC METHODS */

        public rank(update: boolean = true): boolean {
            // Debounce rapid rank() calls
            if (this.rankDebounceTimer !== null) {
                window.clearTimeout(this.rankDebounceTimer);
            }

            // For immediate feedback, we execute synchronously but use requestAnimationFrame
            // to batch DOM updates with the browser's render cycle
            return this.doRank(update);
        }

        private doRank(update: boolean): boolean {
            const start = performance.now();

            let deptNames: { [key: string]: Array<string> } = {};    /* names of departments. */
            let deptCounts: { [key: string]: number } = {};           /* number of faculty in each department. */
            let facultycount: { [key: string]: number } = {};         /* name -> raw count of pubs per name / department */
            let facultyAdjustedCount: { [key: string]: number } = {}; /* name -> adjusted count of pubs per name / department */
            let currentWeights: { [key: string]: number } = {};       /* array to hold 1 or 0, depending on if the area is checked or not. */
            this.areaDeptAdjustedCount = {};

            const startyear = parseInt($("#fromyear").find(":selected").text());
            const endyear = parseInt($("#toyear").find(":selected").text());
            const whichRegions = String($("#regions").find(":selected").val());

            const numAreas = this.updateWeights(currentWeights);

            // Build/update the incremental cache (only rebuilds if year/region changed)
            buildIncrementalCache(
                this.authors,
                startyear,
                endyear,
                whichRegions,
                this.countryInfo,
                this.countryAbbrv,
                this.incrementalCache
            );

            // Use incremental computation
            const incrStart = performance.now();
            buildDepartmentsIncremental(
                this.incrementalCache,
                currentWeights,
                deptCounts,
                deptNames,
                facultycount,
                facultyAdjustedCount,
                this.areaDeptAdjustedCount);

            /* (university, total or average number of papers) */
            this.stats = computeStats(deptNames,
                numAreas,
                currentWeights,
                this.areaDeptAdjustedCount);
            const incrEnd = performance.now();
            console.log(`Incremental computation took ${(incrEnd - incrStart).toFixed(1)}ms`);

            // VERIFICATION: Compare with full computation if enabled
            // Toggle from console: csr.verifyIncremental = true; then click a checkbox
            if (this.verifyIncremental) {
                const fullStart = performance.now();
                let fullDeptNames: { [key: string]: Array<string> } = {};
                let fullDeptCounts: { [key: string]: number } = {};
                let fullFacultycount: { [key: string]: number } = {};
                let fullFacultyAdjustedCount: { [key: string]: number } = {};
                const savedAreaDeptAdjustedCount = { ...this.areaDeptAdjustedCount };
                const fullAreaDeptAdjustedCount: { [key: string]: number } = {};

                buildDepartments(
                    this.authors,
                    startyear,
                    endyear,
                    currentWeights,
                    whichRegions,
                    fullDeptCounts,
                    fullDeptNames,
                    fullFacultycount,
                    fullFacultyAdjustedCount,
                    this.countryInfo,
                    this.countryAbbrv,
                    fullAreaDeptAdjustedCount);

                const fullStats = computeStats(fullDeptNames, numAreas, currentWeights, fullAreaDeptAdjustedCount);

                const fullEnd = performance.now();
                console.log(`Full computation took ${(fullEnd - fullStart).toFixed(1)}ms`);

                // Verify results match
                verifyIncrementalResults(
                    fullStats, fullDeptCounts, fullDeptNames, fullFacultycount, fullFacultyAdjustedCount,
                    this.stats, deptCounts, deptNames, facultycount, facultyAdjustedCount
                );

                // Restore incremental results (we use those for rendering)
                this.areaDeptAdjustedCount = savedAreaDeptAdjustedCount;
            }

            const univtext = this.buildDropDown(deptNames,
                facultycount,
                facultyAdjustedCount);

            /* Start building up the string to output. */
            const s = buildOutputString(numAreas,
                this.countryAbbrv,
                this.countryNames,
                deptCounts,
                univtext,
                this.stats,
                this.useDenseRankings,
                this.ChartIcon);

            let stop = performance.now();
            console.log(`Before render: rank took ${(stop - start)} milliseconds.`);

            /* Finally done. Redraw! */
            document.getElementById("success")!.innerHTML = s;

            if (!update) {
                this.navigoRouter.pause();
            } else {
                this.navigoRouter.resume();
            }
            const str = this.updatedURL();

            this.navigoRouter.navigate(str);

            stop = performance.now();
            console.log(`Rank took ${(stop - start)} milliseconds.`);

            return false;
        }

        /* Turn the chart display on or off. */
        public toggleChart(name: string): void {
            const chart = document.getElementById(name + "-chart");
            const chartwidget = document.getElementById(name + "-chartwidget");
            if (chart!.style.display === 'block') {
                chart!.style.display = 'none';
                chart!.innerHTML = '';
                chartwidget!.innerHTML = this.ChartIcon;
            } else {
                chart!.style.display = 'block';
                makeChart(name, this.usePieChart, this.authorAreas, this.areaDict);
                chartwidget!.innerHTML = this.OpenChartIcon;
            }

        }

        /* Expand or collape the view of conferences in a given area. */
        public toggleConferences(area: string): void {
            const e = document.getElementById(area + "-conferences");
            const widget = document.getElementById(area + "-widget");
            if (e!.style.display === 'block') {
                e!.style.display = 'none';
                widget!.innerHTML = RightTriangle;
            } else {
                e!.style.display = 'block';
                widget!.innerHTML = DownTriangle;
            }
        }


        /* Expand or collape the view of all faculty in a department. */
        public toggleFaculty(dept: string): void {
            const e = document.getElementById(dept + "-faculty");
            const widget = document.getElementById(dept + "-widget");
            // Track user interaction for sponsorship
            recordUserInteraction();
            if (e!.style.display === 'block') {
                e!.style.display = 'none';
                widget!.innerHTML = RightTriangle;
            } else {
                // Lazy render: generate HTML on first expansion
                if (e!.innerHTML === '' && this.lazyRenderData) {
                    const deptUnescaped = unescape(dept);
                    if (deptUnescaped in this.lazyRenderData.deptNames) {
                        e!.innerHTML = buildFacultyHTML(
                            deptUnescaped,
                            this.lazyRenderData.deptNames[deptUnescaped],
                            this.lazyRenderData.facultycount,
                            this.lazyRenderData.facultyAdjustedCount,
                            this.homepages,
                            this.dblpAuthors,
                            this.note,
                            this.acmfellow,
                            this.turing,
                            this.scholarInfo,
                            (name: string) => this.areaString(name),
                            this.ChartIcon,
                            this.subareas
                        );
                    }
                }
                e!.style.display = 'block';
                widget!.innerHTML = DownTriangle;
            }
        }

        /* Toggle verification mode from console: csr.setVerifyIncremental(true) */
        public setVerifyIncremental(enabled: boolean): void {
            this.verifyIncremental = enabled;
            console.log(`Verification mode ${enabled ? 'ENABLED' : 'DISABLED'}. Click a checkbox to test.`);
        }

        public activateAll(value: boolean = true): boolean {
            this.setAllOn(value);
            this.rank();
            return false;
        }

        public activateNone(): boolean {
            return this.activateAll(false);
        }

        public activateSystems(value: boolean = true): boolean {
            return this.activateFields(value, this.systemsFields);
        }

        public activateAI(value: boolean = true): boolean {
            return this.activateFields(value, this.aiFields);
        }

        public activateTheory(value: boolean = true): boolean {
            return this.activateFields(value, this.theoryFields);
        }

        public activateOthers(value: boolean = true): boolean {
            return this.activateFields(value, this.otherFields);
        }

        public deactivateSystems(): boolean {
            return this.activateSystems(false);
        }

        public deactivateAI(): boolean {
            return this.activateAI(false);
        }

        public deactivateTheory(): boolean {
            return this.activateTheory(false);
        }

        public deactivateOthers(): boolean {
            return this.activateOthers(false);
        }

        // Update the URL according to the selected checkboxes.
        private updatedURL(): string {
            const result = buildFullURL(
                this.fields,
                (field: string) => this.getCheckboxState(field),
                this.usePieChart
            );
            this.usePieChart = result.usePieChart;
            this.ChartIcon = result.ChartIcon;
            this.OpenChartIcon = result.OpenChartIcon;
            return result.url;
        }

        public navigation(params: { [key: string]: string }, query: string): void {
            handleNavigation(params, query, () => this.invalidateCheckboxCache());
        }

        private addListeners(): void {
            const callbacks: EventCallbacks = {
                invalidateIncrementalCache: () => this.invalidateIncrementalCache(),
                invalidateCheckboxCache: () => this.invalidateCheckboxCache(),
                recomputeAuthorAreas: () => this.recomputeAuthorAreas(),
                rank: (updateURL?: boolean) => this.rank(updateURL),
                toggleConferences: (area: string) => this.toggleConferences(area),
                activateAll: () => this.activateAll(),
                activateNone: () => this.activateNone(),
                activateAI: () => this.activateAI(),
                deactivateAI: () => this.deactivateAI(),
                activateSystems: () => this.activateSystems(),
                deactivateSystems: () => this.deactivateSystems(),
                activateTheory: () => this.activateTheory(),
                deactivateTheory: () => this.deactivateTheory(),
                activateOthers: () => this.activateOthers(),
                deactivateOthers: () => this.deactivateOthers()
            };
            addAllListeners(this.fields, callbacks);
        }
    }

}

var csr: CSRankings.App = new CSRankings.App();
