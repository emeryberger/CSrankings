/*
  CSRankings - Data Loading

  Functions for loading CSV data files.
*/

namespace CSRankings {

    /* Load Turing Award winners */
    export async function loadTuring(turing: { [key: string]: number }): Promise<void> {
        const data = await new Promise((resolve) => {
            Papa.parse(turingFile, {
                header: true,
                download: true,
                complete: (results) => {
                    resolve(results.data);
                }
            });
        });
        const d = data as Array<Turing>;
        for (const turingPair of d) {
            turing[turingPair.name] = turingPair.year;
        }
    }

    /* Load ACM Fellows */
    export async function loadACMFellow(acmfellow: { [key: string]: number }): Promise<void> {
        const data = await new Promise((resolve) => {
            Papa.parse(acmfellowFile, {
                header: true,
                download: true,
                complete: (results) => {
                    resolve(results.data);
                }
            });
        });
        const d = data as Array<ACMFellow>;
        for (const acmfellowPair of d) {
            acmfellow[acmfellowPair.name] = acmfellowPair.year;
        }
    }

    /* Load country/region information for institutions */
    export async function loadCountryInfo(
        countryInfo: { [key: string]: string },
        countryAbbrv: { [key: string]: string }
    ): Promise<void> {
        const data = await new Promise((resolve) => {
            Papa.parse(countryinfoFile, {
                header: true,
                download: true,
                complete: (results) => {
                    resolve(results.data);
                }
            });
        });
        const ci = data as Array<CountryInfo>;
        for (const info of ci) {
            countryInfo[info.institution] = info.region;
            countryAbbrv[info.institution] = info.countryabbrv;
        }
    }

    /* Load country name mappings */
    export async function loadCountryNames(countryNames: { [key: string]: string }): Promise<void> {
        const data = await new Promise((resolve) => {
            Papa.parse(countrynamesFile, {
                header: true,
                download: true,
                complete: (results) => {
                    resolve(results.data);
                }
            });
        });
        const ci = data as Array<CountryName>;
        for (const info of ci) {
            countryNames[info.alpha_2] = info.name;
        }
    }

    /* Load author info (homepages, scholar IDs) */
    export async function loadAuthorInfo(
        dblpAuthors: { [name: string]: string },
        homepages: { [name: string]: string },
        scholarInfo: { [name: string]: string },
        note: { [name: string]: string }
    ): Promise<void> {
        const data = await new Promise((resolve) => {
            Papa.parse(authorFile, {
                download: true,
                header: true,
                complete: (results) => {
                    resolve(results.data);
                }
            });
        });
        const ai = data as Array<AuthorInfo>;
        for (let counter = 0; counter < ai.length; counter++) {
            const record = ai[counter];
            let name = record['name'].trim();
            const result = name.match(nameMatcher);
            if (result) {
                name = result[1].trim();
                note[name] = result[2];
            }
            if (name !== "") {
                dblpAuthors[name] = translateNameToDBLP(name);
                homepages[name] = record['homepage'];
                scholarInfo[name] = record['scholarid'];
            }
        }
    }

    /* Load publication data (authors) */
    export async function loadAuthors(): Promise<Array<Author>> {
        const data = await new Promise((resolve) => {
            Papa.parse(authorinfoFile, {
                download: true,
                header: true,
                complete: (results) => {
                    resolve(results.data);
                }
            });
        });
        return data as Array<Author>;
    }

}
