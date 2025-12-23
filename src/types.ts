/*
  CSRankings - Type Definitions

  All interfaces and type declarations for the CSRankings application.
*/

/// <reference path="../typescript/he/index.d.ts" />
/// <reference path="../typescript/jquery.d.ts" />
/// <reference path="../typescript/vega-embed.d.ts" />
/// <reference path="../typescript/papaparse.d.ts" />
/// <reference path="../typescript/navigo.d.ts" />
/// <reference path="../typescript/continents.d.ts" />

declare function escape(s: string): string;
declare function unescape(s: string): string;

namespace CSRankings {

    export interface AuthorInfo {
        readonly name: string;
        readonly affiliation: string;
        readonly homepage: string;
        readonly scholarid: string;
    }

    export interface DBLPName {
        readonly name: string;
        readonly dblpname: string;
    }

    export interface Author {
        name: string;
        readonly dept: string;
        readonly area: string;
        readonly subarea: string;
        readonly count: string;
        readonly adjustedcount: string;
        readonly year: number;
    }

    export interface CountryInfo {
        readonly institution: string;
        readonly region: "us" | "europe" | "ca" | "northamerica" | "australasia" | "southamerica" | "asia" | "africa" | "world";
        readonly countryabbrv: string;
    }

    export interface CountryName {
        readonly name: string;
        readonly alpha_2: string;
    }

    export interface Alias {
        readonly alias: string;
        readonly name: string;
    }

    export interface Turing {
        readonly name: string;
        readonly year: number;
    }

    export interface ACMFellow {
        readonly name: string;
        readonly year: number;
    }

    export interface HomePage {
        readonly name: string;
        readonly homepage: string;
    }

    export interface ScholarID {
        readonly name: string;
        readonly scholarid: string;
    }

    export interface AreaMap {
        readonly area: string;
        readonly title: string;
    }

    export interface ChartData {
        readonly area: string;
        readonly value: number;
    }

    /* Incremental cache structure for optimized computation */
    export interface IncrementalCache {
        valid: boolean;
        startyear: number;
        endyear: number;
        regions: string;
        /* Per-area adjusted counts: area -> dept -> adjustedCount */
        areaData: { [area: string]: { [dept: string]: number } };
        /* Department names (faculty lists) - independent of area selection */
        deptNames: { [dept: string]: Array<string> };
        /* Department faculty counts */
        deptCounts: { [dept: string]: number };
        /* Faculty publication counts per area: area -> name -> {count, adjustedCount} */
        facultyAreaData: { [area: string]: { [name: string]: { count: number; adjustedCount: number } } };
        /* All faculty with any publications in any area */
        allFaculty: { [name: string]: { dept: string } };
    }

    /* Data for lazy rendering of faculty dropdowns */
    export interface LazyRenderData {
        deptNames: { [key: string]: Array<string> };
        facultycount: { [key: string]: number };
        facultyAdjustedCount: { [key: string]: number };
    }

}
