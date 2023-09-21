function whichContinent(latitude, longitude) {
    const point = [longitude, latitude];
    for (const cont in continents) {
        if (inPolygon(point, pathToList(continents[cont]))) {
            return cont;
        }
    }
    return "unknown";
}
// Adapted from https://stackoverflow.com/questions/13905646/get-the-continent-given-the-latitude-and-longitude
// Rough shape of continents.
const continents = {
    "northamerica": { latitude: [90, 90, 78.13, 57.5, 15, 15, 1.25, 1.25, 51, 60, 60, 51, 51, 60], longitude: [-168.75, -10, -10, -37.5, -30, -75, -82.5, -105, -180, -180, -168.75, 166.6, 180, 180] },
    "asia": { latitude: [90, 42.5, 42.5, 40.79, 41, 40.55, 40.4, 40.05, 39.17, 35.46, 33, 31.74, 29.54, 27.78, 11.3, 12.5, -60, -60, -31.88, -11.88, -10.27, 33.13, 51, 60, 90, 90, 90, 60, 60], longitude: [77.5, 48.8, 30, 28.81, 29, 27.31, 26.75, 26.36, 25.19, 27.91, 27.5, 34.58, 34.92, 34.46, 44.3, 52, 75, 110, 110, 110, 140, 140, 166.6, 180, 180, -180, -168.75, -168.75, -180] },
    "europe": { latitude: [90, 90, 42.5, 42.5, 40.79, 41, 40.55, 40.40, 40.05, 39.17, 35.46, 33, 38, 35.42, 28.25, 15, 57.5, 78.13], longitude: [-10, 77.5, 48.8, 30, 28.81, 29, 27.31, 26.75, 26.36, 25.19, 27.91, 27.5, 10, -10, -13, -30, -37.5, -10] },
    "australia": { latitude: [-11.88, -10.27, -10, -30, -52.5, -31.88], longitude: [110, 140, 145, 161.25, 142.5, 110] },
    "southamerica": { latitude: [1.25, 1.25, 15, 15, -60, -60], longitude: [-105, -82.5, -75, -30, -30, -105] },
    "africa": { latitude: [15, 28.25, 35.42, 38, 33, 31.74, 29.54, 27.78, 11.3, 12.5, -60, -60], longitude: [-30, -13, -10, 10, 27.5, 34.58, 34.92, 34.46, 44.3, 52, 75, -30] },
    //    "asia2" : { latitude: [90, 90, 60, 60], longitude: [-180, -168.75, -168.75, -180] },
    //    "northAmerica2" : { latitude: [51, 51, 60], longitude: [166.6, 180, 180] },
    "antarctica": { latitude: [-60, -60, -90, -90], longitude: [-180, 180, 180, -180] }
};
function inPolygon(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect)
            inside = !inside;
    }
    return inside;
}
function pathToList(path) {
    let l = [];
    for (let i = 0; i < path["longitude"].length; i++) {
        l.push([path["longitude"][i], path["latitude"][i]]);
    }
    return l;
}
