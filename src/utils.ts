/*
  CSRankings - Utility Functions

  Pure utility functions for data transformation and statistics.
*/

namespace CSRankings {

    /* Sum of array elements */
    export function sum(n: Array<number>): number {
        let s = 0.0;
        for (let i = 0; i < n.length; i++) {
            s += n[i];
        }
        return s;
    }

    /* Average of array elements */
    export function average(n: Array<number>): number {
        return sum(n) / n.length;
    }

    /* Standard deviation of array elements */
    export function stddev(n: Array<number>): number {
        const avg = average(n);
        const squareDiffs = n.map(function(value) {
            const diff = value - avg;
            return (diff * diff);
        });
        const sigma = Math.sqrt(sum(squareDiffs) / (n.length - 1));
        return sigma;
    }

    /* Create the prologue that we preface each generated HTML page with (the results). */
    export function makePrologue(): string {
        const s = '<div class="table-responsive" style="overflow:auto; height:700px;">'
            + '<table class="table table-fit table-sm table-striped"'
            + 'id="ranking" valign="top">';
        return s;
    }

    /* Translate a name to DBLP URL format */
    export function translateNameToDBLP(name: string): string {
        // Ex: "Emery D. Berger" -> "http://dblp.uni-trier.de/pers/hd/b/Berger:Emery_D="
        // First, replace spaces and non-ASCII characters (not complete).
        name = name.replace(/ Jr\./g, "_Jr.");
        name = name.replace(/ II/g, "_II");
        name = name.replace(/ III/g, "_III");
        name = name.replace(/'|\-|\./g, "=");
        // Now replace diacritics.
        name = he.encode(name, { 'useNamedReferences': true, 'allowUnsafeSymbols': true });
        name = name.replace(/&/g, "=");
        name = name.replace(/;/g, "=");

        let splitName = name.split(" ");
        let lastName = splitName[splitName.length - 1];
        let disambiguation = "";
        if (parseInt(lastName) > 0) {
            // this was a disambiguation entry; go back.
            disambiguation = lastName;
            splitName.pop();
            lastName = splitName[splitName.length - 1] + "_" + disambiguation;
        }
        splitName.pop();
        let newName = splitName.join(" ");
        newName = newName.replace(/\s/g, "_");
        newName = newName.replace(/\-/g, "=");
        newName = encodeURIComponent(newName);
        let str = "https://dblp.org/pers/hd";
        const lastInitial = lastName[0].toLowerCase();
        str += `/${lastInitial}/${lastName}:${newName}`;
        return str;
    }

    /* Remove disambiguation suffix (4-digit year) from name */
    export function removeDisambiguationSuffix(str: string): string {
        // Matches a space followed by a four-digit number at the end of the string
        const regex = /\s\d{4}$/;
        return str.replace(regex, '');
    }

    /* Compare names by last name for sorting
       from http://hubrik.com/2015/11/16/sort-by-last-name-with-javascript/ */
    export function compareNames(a: string, b: string): number {
        // Split the names as strings into arrays,
        // removing any disambiguation suffixes first.
        const aName = removeDisambiguationSuffix(a).split(" ");
        const bName = removeDisambiguationSuffix(b).split(" ");

        // get the last names by selecting
        // the last element in the name arrays
        // using array.length - 1 since full names
        // may also have a middle name or initial
        const aLastName = aName[aName.length - 1];
        const bLastName = bName[bName.length - 1];

        let returnValue: number;

        // compare the names and return either
        // a negative number, positive number
        // or zero.
        if (aLastName < bLastName) {
            returnValue = -1;
        } else if (aLastName > bLastName) {
            returnValue = 1;
        } else {
            returnValue = 0;
        }

        return returnValue;
    }

}
