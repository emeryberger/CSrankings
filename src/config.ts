/*
  CSRankings - Configuration

  Static maps, area definitions, and constants.
*/

namespace CSRankings {

    /* Parent-child mapping for conference hierarchy */
    export const parentMap: { [key: string]: string } = {
        'aaai': 'ai',
        'ijcai': 'ai',
        'cvpr': 'vision',
        'eccv': 'vision',
        'iccv': 'vision',
        'icml': 'mlmining',
        'iclr': 'mlmining',
        'kdd': 'mlmining',
        'nips': 'mlmining',
        'acl': 'nlp',
        'emnlp': 'nlp',
        'naacl': 'nlp',
        'sigir': 'inforet',
        'www': 'inforet',
        'asplos': 'arch',
        'isca': 'arch',
        'micro': 'arch',
        'hpca': 'arch', // next tier
        'ccs': 'sec',
        'oakland': 'sec',
        'usenixsec': 'sec',
        'ndss': 'sec', // next tier (for now)
        'pets': 'sec', // next tier
        'vldb': 'mod',
        'sigmod': 'mod',
        'icde': 'mod', // next tier
        'pods': 'mod',
        'dac': 'da',
        'iccad': 'da',
        'emsoft': 'bed',
        'rtas': 'bed',
        'rtss': 'bed',
        'sc': 'hpc',
        'hpdc': 'hpc',
        'ics': 'hpc',
        'mobicom': 'mobile',
        'mobisys': 'mobile',
        'sensys': 'mobile',
        'imc': 'metrics',
        'sigmetrics': 'metrics',
        'osdi': 'ops',
        'sosp': 'ops',
        'eurosys': 'ops',    // next tier (see below)
        'fast': 'ops',       // next tier
        'usenixatc': 'ops',  // next tier
        'popl': 'plan',
        'pldi': 'plan',
        'oopsla': 'plan', // next tier
        'icfp': 'plan',   // next tier
        'fse': 'soft',
        'icse': 'soft',
        'ase': 'soft',    // next tier
        'issta': 'soft',  // next tier
        'nsdi': 'comm',
        'sigcomm': 'comm',
        'siggraph': 'graph',
        'siggraph-asia': 'graph',
        'eurographics': 'graph', // next tier
        'focs': 'act',
        'soda': 'act',
        'stoc': 'act',
        'crypto': 'crypt',
        'eurocrypt': 'crypt',
        'cav': 'log',
        'lics': 'log',
        'ismb': 'bio',
        'recomb': 'bio',
        'ec': 'ecom',
        'wine': 'ecom',
        'chiconf': 'chi',
        'ubicomp': 'chi',
        'uist': 'chi',
        'icra': 'robotics',
        'iros': 'robotics',
        'rss': 'robotics',
        'vis': 'visualization',
        'vr': 'visualization',
        'sigcse': 'csed'
    };

    /* Next tier conferences (off by default) */
    export const nextTier: { [key: string]: boolean } = {
        'ase': true,
        'issta': true,
        'icde': true,
        'pods': true,
        'hpca': true,
        'ndss': true, // for now
        'pets': true,
        'eurosys': true,
        'eurographics': true,
        'fast': true,
        'usenixatc': true,
        'icfp': true,
        'oopsla': true,
        'kdd': true,
    };

    /* Child map - built dynamically from parentMap */
    export const childMap: { [key: string]: string[] } = {};

    /* Parent index for color lookups */
    export const parentIndex: { [key: string]: number } = {};

    /* All regions/countries */
    export const regions: Array<string> = [
        "europe", "northamerica", "southamerica", "australasia", "asia", "africa", "world",
        "ae", "ar", "at", "au", "bd", "be", "bg", "br", "ca", "ch", "cl", "cn", "co", "cy", "cz",
        "de", "dk", "ee", "eg", "es", "fi", "fr", "gr", "hk", "hu", "ie", "il", "in", "ir", "it",
        "jo", "jp", "kr", "lb", "lk", "lu", "mt", "my", "nl", "no", "nz", "ph", "pk", "pl", "pt",
        "qa", "ro", "ru", "sa", "se", "sg", "th", "tr", "tw", "uk", "us", "vn", "za"
    ];

    /* Note map for special institution URLs */
    export const noteMap: { [note: string]: string } = {
        'Tech': 'https://tech.cornell.edu/',
        'CBG': 'https://www.cis.mpg.de/cbg/',
        'INF': 'https://www.cis.mpg.de/mpi-inf/',
        'IS': 'https://www.cis.mpg.de/is/',
        'MG': 'https://www.cis.mpg.de/molgen/',
        'SP': 'https://www.cis.mpg.de/mpi-for-security-and-privacy/',
        'SWS': 'https://www.cis.mpg.de/mpi-sws/'
    };

    /* Area definitions with titles */
    export const areaMap: Array<AreaMap> = [
        { area: "ai", title: "AI" },
        { area: "aaai", title: "AI" },
        { area: "ijcai", title: "AI" },
        { area: "vision", title: "Vision" },
        { area: "cvpr", title: "Vision" },
        { area: "eccv", title: "Vision" },
        { area: "iccv", title: "Vision" },
        { area: "mlmining", title: "ML" },
        { area: "icml", title: "ML" },
        { area: "kdd", title: "ML" },
        { area: "iclr", title: "ML" },
        { area: "nips", title: "ML" },
        { area: "nlp", title: "NLP" },
        { area: "acl", title: "NLP" },
        { area: "emnlp", title: "NLP" },
        { area: "naacl", title: "NLP" },
        { area: "inforet", title: "Web+IR" },
        { area: "sigir", title: "Web+IR" },
        { area: "www", title: "Web+IR" },
        { area: "arch", title: "Arch" },
        { area: "asplos", title: "Arch" },
        { area: "isca", title: "Arch" },
        { area: "micro", title: "Arch" },
        { area: "hpca", title: "Arch" },
        { area: "comm", title: "Networks" },
        { area: "sigcomm", title: "Networks" },
        { area: "nsdi", title: "Networks" },
        { area: "sec", title: "Security" },
        { area: "ccs", title: "Security" },
        { area: "oakland", title: "Security" },
        { area: "usenixsec", title: "Security" },
        { area: "ndss", title: "Security" },
        { area: "pets", title: "Security" },
        { area: "mod", title: "DB" },
        { area: "sigmod", title: "DB" },
        { area: "vldb", title: "DB" },
        { area: "icde", title: "DB" }, // next tier
        { area: "pods", title: "DB" }, // next tier
        { area: "hpc", title: "HPC" },
        { area: "sc", title: "HPC" },
        { area: "hpdc", title: "HPC" },
        { area: "ics", title: "HPC" },
        { area: "mobile", title: "Mobile" },
        { area: "mobicom", title: "Mobile" },
        { area: "mobisys", title: "Mobile" },
        { area: "sensys", title: "Mobile" },
        { area: "metrics", title: "Metrics" },
        { area: "imc", title: "Metrics" },
        { area: "sigmetrics", title: "Metrics" },
        { area: "ops", title: "OS" },
        { area: "sosp", title: "OS" },
        { area: "osdi", title: "OS" },
        { area: "fast", title: "OS" },   // next tier
        { area: "usenixatc", title: "OS" },   // next tier
        { area: "eurosys", title: "OS" },
        { area: "pldi", title: "PL" },
        { area: "popl", title: "PL" },
        { area: "icfp", title: "PL" },   // next tier
        { area: "oopsla", title: "PL" }, // next tier
        { area: "plan", title: "PL" },
        { area: "soft", title: "SE" },
        { area: "fse", title: "SE" },
        { area: "icse", title: "SE" },
        { area: "ase", title: "SE" },    // next tier
        { area: "issta", title: "SE" },  // next tier
        { area: "act", title: "Theory" },
        { area: "focs", title: "Theory" },
        { area: "soda", title: "Theory" },
        { area: "stoc", title: "Theory" },
        { area: "crypt", title: "Crypto" },
        { area: "crypto", title: "Crypto" },
        { area: "eurocrypt", title: "Crypto" },
        { area: "log", title: "Logic" },
        { area: "cav", title: "Logic" },
        { area: "lics", title: "Logic" },
        { area: "graph", title: "Graphics" },
        { area: "siggraph", title: "Graphics" },
        { area: "siggraph-asia", title: "Graphics" },
        { area: "eurographics", title: "Graphics" },
        { area: "chi", title: "HCI" },
        { area: "chiconf", title: "HCI" },
        { area: "ubicomp", title: "HCI" },
        { area: "uist", title: "HCI" },
        { area: "robotics", title: "Robotics" },
        { area: "icra", title: "Robotics" },
        { area: "iros", title: "Robotics" },
        { area: "rss", title: "Robotics" },
        { area: "bio", title: "Comp. Bio" },
        { area: "ismb", title: "Comp. Bio" },
        { area: "recomb", title: "Comp. Bio" },
        { area: "da", title: "EDA" },
        { area: "dac", title: "EDA" },
        { area: "iccad", title: "EDA" },
        { area: "bed", title: "Embedded" },
        { area: "emsoft", title: "Embedded" },
        { area: "rtas", title: "Embedded" },
        { area: "rtss", title: "Embedded" },
        { area: "visualization", title: "Visualization" },
        { area: "vis", title: "Visualization" },
        { area: "vr", title: "Visualization" },
        { area: "ecom", title: "ECom" },
        { area: "ec", title: "ECom" },
        { area: "wine", title: "ECom" },
        { area: "csed", title: "CSEd" },
        { area: "sigcse", title: "CSEd" }
    ];

    /* Area category arrays */
    export const aiAreas = ["ai", "vision", "mlmining", "nlp", "inforet"];
    export const systemsAreas = ["arch", "comm", "sec", "mod", "da", "bed", "hpc", "mobile", "metrics", "ops", "plan", "soft"];
    export const theoryAreas = ["act", "crypt", "log"];
    export const interdisciplinaryAreas = ["bio", "graph", "csed", "ecom", "chi", "robotics", "visualization"];

    /* Arrays populated by App constructor */
    export const areas: Array<string> = [];
    export const topLevelAreas: { [key: string]: string } = {};
    export const topTierAreas: { [key: string]: string } = {};

    /* File paths */
    export const authorFile = "./csrankings.csv";
    export const authorinfoFile = "./generated-author-info.csv";
    export const countryinfoFile = "./institutions.csv";
    export const countrynamesFile = "./countries.csv";
    export const turingFile = "./turing.csv";
    export const acmfellowFile = "./acm-fellows.csv";

    /* Image paths */
    export const turingImage = "./png/acm-turing-award.png";
    export const acmfellowImage = "./png/acm.png";
    export const homepageImage = "./png/house-logo.png";

    /* UI constants */
    export const RightTriangle = "&#9658;";   // right-facing triangle symbol (collapsed view)
    export const DownTriangle = "&#9660;";   // downward-facing triangle symbol (expanded view)
    export const BarChartIcon = "<img class='closed_chart_icon chart_icon' alt='closed chart' src='png/barchart.png'>"; // bar chart image
    export const OpenBarChartIcon = "<img class='open_chart_icon chart_icon' alt='opened chart' src='png/barchart-open.png'>"; // opened bar chart image
    export const PieChartIcon = "<img class='closed_chart_icon chart_icon' alt='closed chart' src='png/piechart.png'>";
    export const OpenPieChartIcon = "<img class='open_chart_icon chart_icon' alt='opened chart' src='png/piechart-open.png'>";

    /* Ranking configuration */
    export const minToRank = 5000; // show all entries (lazy rendering makes this fast)

    /* Name matcher regex for notes in brackets */
    export const nameMatcher = new RegExp('(.*)\\s+\\[(.*)\\]');

}
