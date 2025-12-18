/*
  CSRankings - Verification Helpers

  Debug helpers for verifying incremental computation correctness.
*/

namespace CSRankings {

    /* Compare two objects for equality (for verification) */
    export function deepEqual(obj1: any, obj2: any, path: string = ""): boolean {
        if (obj1 === obj2) return true;
        if (typeof obj1 !== typeof obj2) {
            console.error(`Type mismatch at ${path}: ${typeof obj1} vs ${typeof obj2}`);
            return false;
        }
        if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
            if (typeof obj1 === 'number' && typeof obj2 === 'number') {
                // Allow small floating point differences
                if (Math.abs(obj1 - obj2) < 0.0001) return true;
            }
            console.error(`Value mismatch at ${path}: ${obj1} vs ${obj2}`);
            return false;
        }
        const keys1 = Object.keys(obj1).sort();
        const keys2 = Object.keys(obj2).sort();
        if (keys1.length !== keys2.length) {
            console.error(`Key count mismatch at ${path}: ${keys1.length} vs ${keys2.length}`);
            console.error(`Keys in obj1 but not obj2: ${keys1.filter(k => keys2.indexOf(k) === -1)}`);
            console.error(`Keys in obj2 but not obj1: ${keys2.filter(k => keys1.indexOf(k) === -1)}`);
            return false;
        }
        for (const key of keys1) {
            if (!deepEqual(obj1[key], obj2[key], `${path}.${key}`)) {
                return false;
            }
        }
        return true;
    }

    /* Verify incremental results match full computation */
    export function verifyIncrementalResults(
        fullStats: { [key: string]: number },
        fullDeptCounts: { [key: string]: number },
        fullDeptNames: { [key: string]: Array<string> },
        fullFacultycount: { [key: string]: number },
        fullFacultyAdjustedCount: { [key: string]: number },
        incrStats: { [key: string]: number },
        incrDeptCounts: { [key: string]: number },
        incrDeptNames: { [key: string]: Array<string> },
        incrFacultycount: { [key: string]: number },
        incrFacultyAdjustedCount: { [key: string]: number }
    ): boolean {
        let allMatch = true;

        // Sort deptNames arrays for comparison
        const sortedFullDeptNames: { [key: string]: Array<string> } = {};
        const sortedIncrDeptNames: { [key: string]: Array<string> } = {};
        for (const dept in fullDeptNames) {
            sortedFullDeptNames[dept] = [...fullDeptNames[dept]].sort();
        }
        for (const dept in incrDeptNames) {
            sortedIncrDeptNames[dept] = [...incrDeptNames[dept]].sort();
        }

        if (!deepEqual(fullStats, incrStats, "stats")) {
            console.error("VERIFICATION FAILED: stats mismatch");
            allMatch = false;
        }
        if (!deepEqual(fullDeptCounts, incrDeptCounts, "deptCounts")) {
            console.error("VERIFICATION FAILED: deptCounts mismatch");
            allMatch = false;
        }
        if (!deepEqual(sortedFullDeptNames, sortedIncrDeptNames, "deptNames")) {
            console.error("VERIFICATION FAILED: deptNames mismatch");
            allMatch = false;
        }
        if (!deepEqual(fullFacultycount, incrFacultycount, "facultycount")) {
            console.error("VERIFICATION FAILED: facultycount mismatch");
            allMatch = false;
        }
        if (!deepEqual(fullFacultyAdjustedCount, incrFacultyAdjustedCount, "facultyAdjustedCount")) {
            console.error("VERIFICATION FAILED: facultyAdjustedCount mismatch");
            allMatch = false;
        }

        if (allMatch) {
            console.log("✓ Incremental computation verified - matches full computation");
        }
        return allMatch;
    }

}
