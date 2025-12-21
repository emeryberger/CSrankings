/*
  CSRankings - Region Filtering

  Functions for filtering institutions by geographic region.
*/

namespace CSRankings {

    /* Check if an institution is in the selected region */
    export function inRegion(
        dept: string,
        selectedRegions: string,
        countryInfo: { [key: string]: string },
        countryAbbrv: { [key: string]: string }
    ): boolean {
        switch (selectedRegions) {
            case "northamerica":
                if (countryInfo[dept] != "northamerica") {
                    return false;
                }
                break;
            case "europe":
                if (countryInfo[dept] != "europe") {
                    return false;
                }
                break;
            case "australasia":
                if (countryInfo[dept] != "australasia") {
                    return false;
                }
                break;
            case "southamerica":
                if (countryInfo[dept] != "southamerica") {
                    return false;
                }
                break;
            case "asia":
                if (countryInfo[dept] != "asia") {
                    return false;
                }
                break;
            case "africa":
                if (countryInfo[dept] != "africa") {
                    return false;
                }
                break;
            case "world":
                break;
            default:
                if (countryAbbrv[dept] != selectedRegions) {
                    return false;
                }
                break;
        }
        return true;
    }

}
