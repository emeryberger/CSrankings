export function whichContinent (latitude : number, longitude : number): string;

// whichContinent = continents.whichContinent;

declare module 'continents' {
  export = whichContinent;
}

