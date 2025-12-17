/*
  CSRankings - Core Computation

  Core ranking algorithms including incremental computation and caching.
*/

namespace CSRankings {

    /* Build the incremental cache - processes all authors once and caches per-area data */
    export function buildIncrementalCache(
        authors: Array<Author>,
        startyear: number,
        endyear: number,
        selectedRegions: string,
        countryInfo: { [key: string]: string },
        countryAbbrv: { [key: string]: string },
        cache: IncrementalCache
    ): void {
        if (cache.valid &&
            cache.startyear === startyear &&
            cache.endyear === endyear &&
            cache.regions === selectedRegions) {
            return; // Cache is still valid
        }

        console.log("Building incremental cache...");
        const cacheStart = performance.now();

        // Reset cache
        cache.valid = true;
        cache.startyear = startyear;
        cache.endyear = endyear;
        cache.regions = selectedRegions;
        cache.areaData = {};
        cache.deptNames = {};
        cache.deptCounts = {};
        cache.facultyAreaData = {};
        cache.allFaculty = {};

        // Initialize area data for ALL areas (including children)
        // This is important because weights are checked against child areas
        for (let i = 0; i < areas.length; i++) {
            const area = areas[i];
            cache.areaData[area] = {};
            cache.facultyAreaData[area] = {};
        }

        // Track which faculty we've seen (for building deptNames/deptCounts)
        const visitedForDept: { [name: string]: boolean } = {};

        // Single pass through all authors
        for (const r in authors) {
            if (!authors.hasOwnProperty(r)) {
                continue;
            }
            const auth = authors[r];
            const dept = auth.dept;

            // Filter by region
            if (!inRegion(dept, selectedRegions, countryInfo, countryAbbrv)) {
                continue;
            }

            // Filter by year
            const year = auth.year;
            if ((year < startyear) || (year > endyear)) {
                continue;
            }

            if (typeof dept === 'undefined') {
                continue;
            }

            const name = auth.name;
            const rawArea = auth.area;  // Keep the raw area (could be child like 'aaai')

            // For areaDeptAdjustedCount, we need to map to parent area
            let parentArea = rawArea;
            if (rawArea in parentMap) {
                parentArea = parentMap[rawArea];
            }

            // Store data by RAW area (for weight checking)
            // Initialize dept entry for this raw area if needed
            if (!(dept in cache.areaData[rawArea])) {
                cache.areaData[rawArea][dept] = 0;
            }

            // Accumulate adjusted count for this rawArea+dept
            const adjustedCount = parseFloat(auth.adjustedcount);
            cache.areaData[rawArea][dept] += adjustedCount;

            // Track faculty data per RAW area
            if (!(name in cache.facultyAreaData[rawArea])) {
                cache.facultyAreaData[rawArea][name] = { count: 0, adjustedCount: 0 };
            }
            cache.facultyAreaData[rawArea][name].count += parseInt(auth.count);
            cache.facultyAreaData[rawArea][name].adjustedCount += adjustedCount;

            // Track all faculty and their departments
            if (!(name in cache.allFaculty)) {
                cache.allFaculty[name] = { dept: dept };
            }

            // Build deptNames and deptCounts (first time we see each faculty member)
            if (!(name in visitedForDept)) {
                visitedForDept[name] = true;
                if (!(dept in cache.deptNames)) {
                    cache.deptNames[dept] = [];
                    cache.deptCounts[dept] = 0;
                }
                cache.deptNames[dept].push(name);
                cache.deptCounts[dept] += 1;
            }
        }

        const cacheEnd = performance.now();
        console.log(`Incremental cache built in ${(cacheEnd - cacheStart).toFixed(1)}ms`);
    }

    /* Incremental version of buildDepartments - uses cached data */
    export function buildDepartmentsIncremental(
        cache: IncrementalCache,
        weights: { [key: string]: number },
        deptCounts: { [key: string]: number },
        deptNames: { [key: string]: Array<string> },
        facultycount: { [key: string]: number },
        facultyAdjustedCount: { [key: string]: number },
        areaDeptAdjustedCount: { [key: string]: number }
    ): void {

        // Build areaDeptAdjustedCount from cached per-area data
        // Iterate through ALL areas (including children) and check weights
        // But accumulate into PARENT area for areaDeptAdjustedCount
        for (let i = 0; i < areas.length; i++) {
            const rawArea = areas[i];
            if (weights[rawArea] === 0) {
                continue;
            }

            // Map to parent area for areaDeptAdjustedCount key
            let parentArea = rawArea;
            if (rawArea in parentMap) {
                parentArea = parentMap[rawArea];
            }

            const areaCache = cache.areaData[rawArea];
            if (!areaCache) continue;

            for (const dept in areaCache) {
                const areaDept = parentArea + dept;
                if (!(areaDept in areaDeptAdjustedCount)) {
                    areaDeptAdjustedCount[areaDept] = 0;
                }
                areaDeptAdjustedCount[areaDept] += areaCache[dept];
            }
        }

        // Track which faculty have publications in ANY selected area
        // A faculty member is counted once per department, regardless of how many areas
        const facultySeen: { [name: string]: boolean } = {};

        // Iterate through all areas (checking weights) and find faculty
        for (let i = 0; i < areas.length; i++) {
            const rawArea = areas[i];
            if (weights[rawArea] === 0) {
                continue;
            }

            const facultyArea = cache.facultyAreaData[rawArea];
            if (!facultyArea) continue;

            for (const name in facultyArea) {
                if (!(name in facultySeen)) {
                    facultySeen[name] = true;
                    facultycount[name] = 0;
                    facultyAdjustedCount[name] = 0;
                }
                facultycount[name] += facultyArea[name].count;
                facultyAdjustedCount[name] += facultyArea[name].adjustedCount;
            }
        }

        // Build deptNames and deptCounts from faculty we found
        for (const name in facultySeen) {
            const dept = cache.allFaculty[name].dept;
            if (!(dept in deptNames)) {
                deptNames[dept] = [];
                deptCounts[dept] = 0;
            }
            deptNames[dept].push(name);
            deptCounts[dept] += 1;
        }
    }

    /* Build the dictionary of departments (and count) to be ranked (non-incremental version). */
    export function buildDepartments(
        authors: Array<Author>,
        startyear: number,
        endyear: number,
        weights: { [key: string]: number },
        selectedRegions: string,
        deptCounts: { [key: string]: number },
        deptNames: { [key: string]: Array<string> },
        facultycount: { [key: string]: number },
        facultyAdjustedCount: { [key: string]: number },
        countryInfo: { [key: string]: string },
        countryAbbrv: { [key: string]: string },
        areaDeptAdjustedCount: { [key: string]: number }
    ): void {
        /* contains an author name if that author has been processed. */
        const visited: { [key: string]: boolean } = {};
        for (const r in authors) {
            if (!authors.hasOwnProperty(r)) {
                continue;
            }
            const auth = authors[r];
            const dept = auth.dept;
            if (!inRegion(dept, selectedRegions, countryInfo, countryAbbrv)) {
                continue;
            }
            let area = auth.area;
            if (weights[area] === 0) {
                continue;
            }
            const year = auth.year;
            if ((year < startyear) || (year > endyear)) {
                continue;
            }
            if (typeof dept === 'undefined') {
                continue;
            }
            const name = auth.name;
            // If this area is a child area, accumulate totals for parent.
            if (area in parentMap) {
                area = parentMap[area];
            }
            const areaDept: string = area + dept;
            if (!(areaDept in areaDeptAdjustedCount)) {
                areaDeptAdjustedCount[areaDept] = 0;
            }
            const count: number = parseInt(authors[r].count);
            const adjustedCount: number = parseFloat(authors[r].adjustedcount);
            areaDeptAdjustedCount[areaDept] += adjustedCount;
            /* Is this the first time we have seen this person? */
            if (!(name in visited)) {
                visited[name] = true;
                facultycount[name] = 0;
                facultyAdjustedCount[name] = 0;
                if (!(dept in deptCounts)) {
                    deptCounts[dept] = 0;
                    deptNames[dept] = <Array<string>>[];
                }
                deptNames[dept].push(name);
                deptCounts[dept] += 1;
            }
            facultycount[name] += count;
            facultyAdjustedCount[name] += adjustedCount;
        }
    }

    /* Compute aggregate statistics. */
    export function computeStats(
        deptNames: { [key: string]: Array<string> },
        numAreas: number,
        weights: { [key: string]: number },
        areaDeptAdjustedCount: { [key: string]: number }
    ): { [key: string]: number } {
        const stats: { [key: string]: number } = {};
        for (const dept in deptNames) {
            if (!deptNames.hasOwnProperty(dept)) {
                continue;
            }
            stats[dept] = 1;
            for (const area in topLevelAreas) {
                const areaDept = area + dept;
                if (!(areaDept in areaDeptAdjustedCount)) {
                    areaDeptAdjustedCount[areaDept] = 0;
                }
                if (weights[area] != 0) {
                    // Adjusted (smoothed) geometric mean.
                    stats[dept] *= (areaDeptAdjustedCount[areaDept] + 1.0);
                }
            }
            // finally compute geometric mean.
            stats[dept] = Math.pow(stats[dept], 1 / numAreas); // - 1.0;
        }
        return stats;
    }

    /* Count author publications per area for pie charts */
    export function countAuthorAreas(
        authors: Array<Author>,
        areaDict: { [key: string]: string },
        startyear: number,
        endyear: number
    ): { [name: string]: { [area: string]: number } } {
        const authorAreas: { [name: string]: { [area: string]: number } } = {};
        // Pre-compute area list once instead of iterating areaDict each time
        const areaList = Object.keys(areaDict);
        const numAuthors = authors.length;
        for (let r = 0; r < numAuthors; r++) {
            const record = authors[r];
            const { area, year } = record;
            if (area in nextTier) {
                continue;
            }
            if ((year < startyear) || (year > endyear)) {
                continue;
            }
            const { name, dept, count } = record;
            const theCount = parseFloat(count);
            // Initialize area counts lazily - only create entry when needed
            if (!(name in authorAreas)) {
                const entry: { [key: string]: number } = {};
                for (let i = 0; i < areaList.length; i++) {
                    entry[areaList[i]] = 0;
                }
                authorAreas[name] = entry;
            }
            if (!(dept in authorAreas)) {
                const entry: { [key: string]: number } = {};
                for (let i = 0; i < areaList.length; i++) {
                    entry[areaList[i]] = 0;
                }
                authorAreas[dept] = entry;
            }
            authorAreas[name][area] += theCount;
            authorAreas[dept][area] += theCount;
        }
        return authorAreas;
    }

    /* Sort universities by aggregate score */
    export function sortIndex(univagg: { [key: string]: number }): string[] {
        let keys = Object.keys(univagg);
        keys.sort((a, b) => {
            if (univagg[a] != univagg[b]) {
                return univagg[b] - univagg[a];
            }
            if (a < b) {
                return -1;
            }
            if (b < a) {
                return 1;
            }
            return 0;
        });
        return keys;
    }

}
