/**
 * CSRankings Faculty Submission Form
 * Client-side validation and GitHub Issue creation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Configuration
const GITHUB_REPO = 'emeryberger/CSrankings';
// Note: OAuth requires a server-side component for code exchange.
// We offer two submission methods:
// 1. Direct PR (requires user to provide a Personal Access Token)
// 2. Issue-based (GitHub Actions creates the PR)
// Abbreviation mappings for fuzzy institution search
const ABBREVIATION_MAP = {
    'university': ['univ.', 'univ', 'u.'],
    'institute': ['inst.', 'inst'],
    'technology': ['tech.', 'tech'],
    'engineering': ['eng.', 'eng'],
    'polytechnic': ['poly.', 'poly'],
    'national': ['natl.', 'natl'],
    'international': ['intl.', 'intl'],
    'california': ['cal.', 'cal'],
};
// Common university acronyms -> partial strings to match in institution names (lowercase)
const ACRONYM_MAP = {
    // Generic U? two-letter acronyms (match all "University of X" where X starts with that letter)
    'ua': ['university of arizona', 'university of alabama', 'university of arkansas', 'university of alberta', 'university of auckland', 'university of amsterdam', 'university of athens', 'university of antwerp', 'university of aberdeen'],
    'ub': ['university at buffalo', 'university of bath', 'university of bergen', 'university of bern', 'university of birmingham', 'university of bonn', 'university of bremen', 'university of bristol', 'university of british columbia'],
    'uc': ['univ. of california', 'california -', 'university of chicago', 'university of cincinnati', 'university of connecticut', 'university of colorado', 'university of cambridge', 'university of copenhagen', 'university of calgary', 'university of canterbury'],
    'ud': ['university of delaware', 'university of denver', 'university of dundee', 'university of delhi'],
    'ue': ['university of edinburgh', 'university of essex', 'university of exeter'],
    'uf': ['university of florida', 'university of freiburg'],
    'fau': ['florida atlantic'],
    'fit': ['florida institute of technology'],
    'ug': ['university of georgia', 'university of glasgow', 'university of guelph', 'university of groningen', 'university of geneva'],
    'uh': ['university of houston', 'university of hawaii', 'university of helsinki', 'university of hamburg', 'university of haifa'],
    'ui': ['university of illinois', 'university of idaho', 'university of iowa'],
    'uk': ['university of kentucky', 'university of kansas', 'university of kiel'],
    'ul': ['university of louisville', 'university of luxembourg', 'university of liverpool', 'university of leeds', 'university of leipzig', 'university of lausanne'],
    'um': ['university of michigan', 'university of minnesota', 'university of maryland', 'university of miami', 'university of memphis', 'university of melbourne', 'university of manchester', 'university of malta', 'university of montreal', 'university of macau'],
    'un': ['university of nebraska', 'university of nevada', 'university of new hampshire', 'university of new mexico', 'university of nottingham', 'university of newcastle', 'university of notre dame'],
    'uo': ['university of oregon', 'university of ottawa', 'university of otago', 'university of oxford', 'university of oklahoma', 'university of oslo'],
    'up': ['university of pennsylvania', 'university of pittsburgh', 'university of padova', 'university of pisa', 'university of potsdam'],
    'uq': ['university of queensland'],
    'ur': ['university of rochester', 'university of regina', 'university of richmond'],
    'us': ['university of sydney', 'university of southampton', 'university of south carolina', 'university of south florida', 'university of sussex', 'university of surrey', 'university of salzburg', 'university of sheffield', 'university of stuttgart', 'university of strathclyde'],
    'ut': ['university of texas', 'texas at', 'university of tennessee', 'university of toronto', 'university of tokyo', 'university of twente', 'university of utah', 'university of tulsa', 'university of tartu'],
    'uu': ['university of utah', 'university of ulm', 'university of udine', 'utrecht university'],
    'uv': ['university of vermont', 'university of virginia', 'university of vienna', 'university of victoria'],
    'uw': ['university of washington', 'wisconsin - madison', 'university of waterloo', 'university of warsaw', 'university of wollongong', 'university of warwick', 'university of windsor'],
    'uy': ['university of york'],
    'uz': ['university of zurich', 'university of zaragoza'],
    // Top US schools
    'mit': ['massachusetts inst. of technology'],
    'cmu': ['carnegie mellon'],
    'caltech': ['california inst. of technology'],
    'stanford': ['stanford'],
    'berkeley': ['california - berkeley'],
    'harvard': ['harvard'],
    'princeton': ['princeton'],
    'yale': ['yale'],
    'cornell': ['cornell'],
    'columbia': ['columbia university'],
    'brown': ['brown university'],
    'dartmouth': ['dartmouth'],
    'penn': ['university of pennsylvania'],
    'upenn': ['university of pennsylvania'],
    // UC System
    'uc berkeley': ['california - berkeley'],
    'ucb': ['california - berkeley'],
    'ucla': ['california - los angeles'],
    'ucsd': ['california - san diego'],
    'uci': ['california - irvine'],
    'ucd': ['california - davis'],
    'uc davis': ['california - davis'],
    'ucsb': ['california - santa barbara'],
    'ucsc': ['california - santa cruz'],
    'ucr': ['california - riverside'],
    'ucm': ['california - merced'],
    'uc merced': ['california - merced'],
    // Illinois
    'uiuc': ['illinois at urbana-champaign'],
    'uic': ['illinois at chicago'],
    'iit': ['illinois institute of technology'],
    // Texas
    'ut austin': ['texas at austin'],
    'utexas': ['texas at austin'],
    'uta': ['texas at arlington'],
    'utd': ['texas at dallas'],
    'utsa': ['texas at san antonio'],
    'utep': ['texas - el paso'],
    'tamu': ['texas a&m university'],
    'texas a&m': ['texas a&m'],
    // Other Big State Schools
    'umich': ['university of michigan'],
    'michigan': ['university of michigan'],
    'osu': ['ohio state', 'oregon state'],
    'ohio state': ['ohio state'],
    'psu': ['pennsylvania state'],
    'penn state': ['pennsylvania state'],
    'msu': ['michigan state'],
    'isu': ['iowa state'],
    'umd': ['maryland - college park'],
    'umbc': ['maryland - baltimore county'],
    'uw madison': ['wisconsin - madison'],
    'uw milwaukee': ['wisconsin - milwaukee'],
    'umn': ['university of minnesota'],
    'minnesota': ['university of minnesota'],
    'ufl': ['university of florida'],
    'fsu': ['florida state'],
    'ucf': ['central florida'],
    'fiu': ['florida international'],
    'usf': ['south florida'],
    'uga': ['university of georgia'],
    'gsu': ['georgia state'],
    'uva': ['university of virginia'],
    'vt': ['virginia tech'],
    'vtech': ['virginia tech'],
    'virginia tech': ['virginia tech'],
    'unc': ['north carolina'],
    'ncsu': ['north carolina state'],
    'nc state': ['north carolina state'],
    'usc': ['southern california'],
    'asu': ['arizona state'],
    'cu': ['university of colorado', 'colorado boulder'],
    'cu boulder': ['colorado boulder'],
    'colorado': ['colorado boulder'],
    'oregon': ['university of oregon'],
    'wsu': ['washington state'],
    'wustl': ['washington university in st. louis'],
    'washu': ['washington university in st. louis'],
    'rutgers': ['rutgers'],
    'purdue': ['purdue'],
    'indiana': ['indiana university'],
    'iu': ['indiana university'],
    'uiowa': ['university of iowa'],
    'utk': ['university of tennessee'],
    'ut knoxville': ['university of tennessee'],
    // Georgia Tech
    'gatech': ['georgia institute of technology'],
    'gt': ['georgia institute of technology'],
    'georgia tech': ['georgia institute of technology'],
    // New York
    'nyu': ['new york university'],
    'cuny': ['cuny'],
    'suny': ['suny', 'stony brook', 'buffalo'],
    'stony brook': ['stony brook'],
    'buffalo': ['buffalo'],
    // Boston area
    'bu': ['boston university'],
    'bc': ['boston college'],
    'neu': ['northeastern'],
    'northeastern': ['northeastern'],
    'tufts': ['tufts'],
    'umass': ['massachusetts amherst', 'massachusetts boston', 'massachusetts lowell'],
    'umass amherst': ['massachusetts amherst'],
    // European
    'eth': ['eth zurich'],
    'ethz': ['eth zurich'],
    'epfl': ['epfl'],
    'oxford': ['oxford'],
    'cambridge': ['cambridge'],
    'imperial': ['imperial college'],
    'ucl': ['university college london'],
    'edinburgh': ['edinburgh'],
    'tum': ['technical university of munich'],
    'rwth': ['rwth aachen'],
    'kit': ['karlsruhe'],
    'tu delft': ['delft'],
    'kth': ['kth royal'],
    'uva amsterdam': ['university of amsterdam'],
    'lmu': ['ludwig-maximilians', 'lmu munich'],
    'max planck': ['max planck'],
    'mpi': ['max planck'],
    'inria': ['inria'],
    // UK
    'lse': ['london school of economics'],
    'kcl': ['king\'s college london'],
    'qmul': ['queen mary'],
    'warwick': ['warwick'],
    'manchester': ['manchester'],
    'bristol': ['bristol'],
    'southampton': ['southampton'],
    'nottingham': ['nottingham'],
    'birmingham': ['birmingham'],
    'leeds': ['leeds'],
    'sheffield': ['sheffield'],
    'glasgow': ['glasgow'],
    'st andrews': ['st andrews'],
    // Canada
    'ubc': ['british columbia'],
    'uoft': ['university of toronto'],
    'toronto': ['university of toronto'],
    'mcgill': ['mcgill'],
    'waterloo': ['waterloo'],
    'uwaterloo': ['waterloo'],
    'ualberta': ['university of alberta'],
    'alberta': ['university of alberta'],
    'umontreal': ['montreal'],
    'sfu': ['simon fraser'],
    // Asia
    'nus': ['national university of singapore'],
    'ntu': ['nanyang technological'],
    'hku': ['university of hong kong'],
    'cuhk': ['chinese university of hong kong'],
    'hkust': ['hong kong university of science'],
    'cityu': ['city university of hong kong'],
    'tsinghua': ['tsinghua'],
    'pku': ['peking'],
    'peking': ['peking'],
    'fudan': ['fudan'],
    'sjtu': ['shanghai jiao tong'],
    'zju': ['zhejiang'],
    'ust': ['hong kong university of science'],
    'kaist': ['kaist'],
    'snu': ['seoul national'],
    'postech': ['postech'],
    'todai': ['university of tokyo'],
    'tokyo': ['university of tokyo'],
    'kyoto': ['kyoto'],
    'iisc': ['indian institute of science'],
    'iitb': ['iit bombay'],
    'iitd': ['iit delhi'],
    'iitk': ['iit kanpur'],
    'iitm': ['iit madras'],
    'iitkgp': ['iit kharagpur'],
    // Australia
    'anu': ['australian national'],
    'usyd': ['university of sydney'],
    'sydney': ['university of sydney'],
    'unsw': ['new south wales'],
    'unimelb': ['university of melbourne'],
    'melbourne': ['university of melbourne'],
    'monash': ['monash'],
    'adelaide': ['adelaide'],
    // Israel
    'technion': ['technion'],
    'tau': ['tel aviv'],
    'tel aviv': ['tel aviv'],
    'huji': ['hebrew university'],
    'hebrew': ['hebrew university'],
    'weizmann': ['weizmann'],
    'bgu': ['ben-gurion'],
};
// State
let institutions = [];
let institutionMap = new Map(); // name -> full data
let knownAcademicDomains = new Set(); // domains extracted from institution homepages
let facultyEntries = [];
let dblpAliases = new Map(); // alias -> canonical name
let currentAction = 'add';
let selectedEntry = null;
let batchEntries = []; // Entries queued for batch submission
let validationState = {
    name: { valid: false, message: '' },
    institution: { valid: false, message: '' },
    homepage: { valid: false, message: '' },
    scholarid: { valid: false, message: '' }
};
// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            loadInstitutions(),
            loadFacultyEntries(),
            loadDBLPAliases()
        ]);
        setupEventListeners();
        updateUIForAction('add');
        updateSubmitButton();
    });
}
/**
 * Convert country code to flag emoji
 */
function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2)
        return '';
    const code = countryCode.toUpperCase();
    // Convert to regional indicator symbols (flag emoji)
    const firstChar = String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65);
    const secondChar = String.fromCodePoint(0x1F1E6 + code.charCodeAt(1) - 65);
    return firstChar + secondChar;
}
/**
 * Load institutions from CSV for autocomplete
 */
function loadInstitutions() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/institutions.csv');
            const text = yield response.text();
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            institutions = parsed.data.filter(row => row.institution);
            // Build lookup map and extract domains from homepages
            for (const inst of institutions) {
                institutionMap.set(inst.institution, inst);
                // Extract domain from homepage URL
                if (inst.homepage) {
                    try {
                        const url = new URL(inst.homepage);
                        // Add the full domain and parent domains
                        const hostname = url.hostname.toLowerCase();
                        knownAcademicDomains.add(hostname);
                        // Also add parent domain (e.g., mit.edu from www.csail.mit.edu)
                        const parts = hostname.split('.');
                        if (parts.length >= 2) {
                            // Add the base domain (last two parts, e.g., mit.edu)
                            knownAcademicDomains.add(parts.slice(-2).join('.'));
                            // Add last 3 parts for country TLDs (e.g., ox.ac.uk)
                            if (parts.length >= 3) {
                                knownAcademicDomains.add(parts.slice(-3).join('.'));
                            }
                        }
                    }
                    catch (e) {
                        // Invalid URL, skip
                    }
                }
            }
            console.log(`Loaded ${institutions.length} institutions, ${knownAcademicDomains.size} academic domains`);
        }
        catch (error) {
            console.error('Failed to load institutions:', error);
            showError('Failed to load institution list. Please refresh the page.');
        }
    });
}
/**
 * Load existing faculty entries for name autocomplete
 */
function loadFacultyEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Load all csrankings-*.csv files
            const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
            const activeFiles = letters.map(l => `csrankings-${l}.csv`);
            // Also load old/ files for faculty who left (can be added back)
            const oldFiles = [
                'old/industry.csv', // Moved to industry
                'old/emeritus.csv', // Retired/emeritus
                'old/other.csv', // Left for other reasons
                'old/research.csv', // Research positions
                'old/rip.csv' // Deceased (for historical reference)
            ];
            const allFiles = [...activeFiles, ...oldFiles];
            const responses = yield Promise.all(allFiles.map(f => fetch(`/${f}`).then(r => r.ok ? r.text() : '').catch(() => '')));
            facultyEntries = [];
            let activeCount = 0;
            let oldCount = 0;
            for (let i = 0; i < responses.length; i++) {
                const text = responses[i];
                const isOldFile = i >= activeFiles.length;
                if (text) {
                    const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
                    for (const row of parsed.data) {
                        if (row.length >= 4 && row[0] !== 'name') {
                            // Trim all values to handle mixed line endings (CRLF vs LF)
                            facultyEntries.push({
                                name: row[0].trim(),
                                institution: row[1].trim(),
                                homepage: row[2].trim(),
                                scholarid: row[3].trim(),
                                isOld: isOldFile,
                                oldFile: isOldFile ? allFiles[i] : undefined
                            });
                            if (isOldFile) {
                                oldCount++;
                            }
                            else {
                                activeCount++;
                            }
                        }
                    }
                }
            }
            console.log(`Loaded ${activeCount} active + ${oldCount} former faculty entries`);
        }
        catch (error) {
            console.error('Failed to load faculty entries:', error);
        }
    });
}
/**
 * Load DBLP aliases for name lookup
 * Maps alternative names to canonical DBLP names
 */
function loadDBLPAliases() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/dblp-aliases.csv');
            if (!response.ok)
                return;
            const text = yield response.text();
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            for (const row of parsed.data) {
                if (row.alias && row.name) {
                    dblpAliases.set(row.alias.toLowerCase().trim(), row.name.trim());
                }
            }
            console.log(`Loaded ${dblpAliases.size} DBLP aliases`);
        }
        catch (error) {
            console.error('Failed to load DBLP aliases:', error);
        }
    });
}
/**
 * Check if a name has a DBLP alias (canonical name)
 */
function getCanonicalDBLPName(name) {
    const normalized = name.toLowerCase().trim();
    return dblpAliases.get(normalized) || null;
}
/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const action = target.dataset.action;
            setAction(action);
        });
    });
    // Name field - autocomplete and validation
    const nameInput = document.getElementById('name');
    nameInput.addEventListener('input', debounce(handleNameInput, 200));
    nameInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions.bind(null, 'name'), 200);
        if (currentAction === 'add') {
            validateName();
        }
        else {
            // For update/remove: auto-select if name matches an existing entry
            validateNameForUpdateRemove();
        }
    });
    // Institution field - autocomplete and validate
    const institutionInput = document.getElementById('institution');
    institutionInput.addEventListener('input', handleInstitutionInput);
    institutionInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions.bind(null, 'institution'), 200);
        validateInstitution();
    });
    // Homepage field - validate URL format
    const homepageInput = document.getElementById('homepage');
    homepageInput.addEventListener('blur', validateHomepage);
    homepageInput.addEventListener('input', () => {
        clearFieldStatus('homepage');
        updatePreview();
    });
    // Scholar ID field - validate format
    const scholaridInput = document.getElementById('scholarid');
    scholaridInput.addEventListener('input', validateScholarId);
    // Eligibility checkboxes
    document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', updateSubmitButton);
    });
    // Removal reason
    const removalReason = document.getElementById('removal-reason');
    removalReason.addEventListener('change', () => {
        const otherInput = document.getElementById('removal-reason-other');
        const companyGroup = document.getElementById('company-name-group');
        otherInput.style.display = removalReason.value === 'other' ? 'block' : 'none';
        companyGroup.style.display = removalReason.value === 'industry' ? 'block' : 'none';
        updateSubmitButton();
    });
    // Form submission
    const form = document.getElementById('submit-form');
    form.addEventListener('submit', handleSubmit);
    // Batch entry buttons
    const addToBatchBtn = document.getElementById('add-to-batch-btn');
    if (addToBatchBtn) {
        addToBatchBtn.addEventListener('click', handleAddToBatch);
    }
    const submitBatchBtn = document.getElementById('submit-batch-btn');
    if (submitBatchBtn) {
        submitBatchBtn.addEventListener('click', handleSubmitBatch);
    }
    const clearBatchBtn = document.getElementById('clear-batch-btn');
    if (clearBatchBtn) {
        clearBatchBtn.addEventListener('click', clearBatchEntries);
    }
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.closest('#name-group')) {
            hideSuggestions('name');
        }
        if (!target.closest('#institution-group')) {
            hideSuggestions('institution');
        }
    });
}
/**
 * Set the current action (add, update, remove)
 */
function setAction(action) {
    currentAction = action;
    // Update button states
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-default');
    });
    const activeBtn = document.querySelector(`[data-action="${action}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'btn-primary');
        activeBtn.classList.remove('btn-default');
    }
    updateUIForAction(action);
    resetForm();
}
/**
 * Switch to update mode with a pre-selected entry (for duplicate detection)
 */
function switchToUpdateWithEntry(entry) {
    // Update action state without full reset
    currentAction = 'update';
    // Update button states
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-default');
    });
    const activeBtn = document.querySelector('[data-action="update"]');
    if (activeBtn) {
        activeBtn.classList.add('active', 'btn-primary');
        activeBtn.classList.remove('btn-default');
    }
    // Update UI for update mode
    updateUIForAction('update');
    // Now populate with the existing entry
    selectedEntry = entry;
    document.getElementById('name').value = entry.name;
    document.getElementById('institution').value = entry.institution;
    document.getElementById('homepage').value = entry.homepage;
    document.getElementById('scholarid').value = entry.scholarid;
    // Show current info with clickable links
    document.getElementById('current-institution').textContent = entry.institution;
    document.getElementById('current-homepage').innerHTML =
        `<a href="${escapeHtml(entry.homepage)}" target="_blank">${escapeHtml(entry.homepage)}</a>`;
    const scholarUrl = entry.scholarid === 'NOSCHOLARPAGE' ? '' :
        `https://scholar.google.com/citations?user=${encodeURIComponent(entry.scholarid)}`;
    document.getElementById('current-scholarid').innerHTML = scholarUrl
        ? `<a href="${escapeHtml(scholarUrl)}" target="_blank">${escapeHtml(entry.scholarid)}</a>`
        : entry.scholarid;
    // Handle former faculty status indicator
    const currentInfo = document.getElementById('current-info');
    let statusIndicator = currentInfo.querySelector('.former-status');
    if (entry.isOld) {
        const label = getOldFileLabel(entry.oldFile);
        if (!statusIndicator) {
            statusIndicator = document.createElement('p');
            statusIndicator.className = 'former-status';
            currentInfo.insertBefore(statusIndicator, currentInfo.firstChild);
        }
        statusIndicator.innerHTML = `<span class="label label-warning">${label}</span> <em>Former faculty member</em>`;
    }
    else if (statusIndicator) {
        statusIndicator.remove();
    }
    // Show message about auto-switch
    const msg = entry.isOld
        ? `Found in ${getOldFileLabel(entry.oldFile)} - switched to Update mode`
        : 'Entry exists - switched to Update mode';
    setFieldStatus('name', 'warning', msg);
    // Validate other fields and update preview
    validateInstitution();
    validateHomepage();
    validateScholarId();
    updatePreview();
    updateSubmitButton();
}
/**
 * Update UI elements based on selected action
 */
function updateUIForAction(action) {
    // Guidelines
    const show = (id, visible) => {
        const el = document.getElementById(id);
        if (el)
            el.style.display = visible ? 'block' : 'none';
    };
    show('guidelines-add', action === 'add');
    show('guidelines-update', action === 'update');
    show('guidelines-remove', action === 'remove');
    // Name help text
    show('name-help-add', action === 'add');
    show('name-help-update', action !== 'add');
    // Current info panel (for update/remove)
    show('current-info-group', action !== 'add');
    // Institution label
    show('institution-label-new', action === 'add');
    show('institution-label-update', action !== 'add');
    // Fields visibility for remove
    const hideForRemove = ['institution-group', 'homepage-group', 'scholarid-group'];
    hideForRemove.forEach(id => show(id, action !== 'remove'));
    // Removal reason
    show('removal-reason-group', action === 'remove');
    // Eligibility section
    show('eligibility-section', action === 'add');
    // Preview text
    show('preview-add', action === 'add');
    show('preview-update', action === 'update');
    show('preview-remove', action === 'remove');
    // Submit button text
    const submitText = document.getElementById('submit-text');
    if (submitText) {
        switch (action) {
            case 'add':
                submitText.textContent = 'Submit New Entry';
                break;
            case 'update':
                submitText.textContent = 'Submit Update';
                break;
            case 'remove':
                submitText.textContent = 'Submit Removal';
                break;
        }
    }
    // Name field placeholder
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.placeholder = action === 'add'
            ? 'Enter name as it appears in DBLP'
            : 'Start typing to search existing entries...';
    }
    // Update required fields
    const institutionInput = document.getElementById('institution');
    const homepageInput = document.getElementById('homepage');
    const scholaridInput = document.getElementById('scholarid');
    institutionInput.required = action !== 'remove';
    homepageInput.required = action !== 'remove';
    scholaridInput.required = action !== 'remove';
    // Toggle required on eligibility checkboxes (only required for 'add' action)
    document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
        cb.required = action === 'add';
    });
    // Show/hide batch UI based on action
    const singleSubmit = document.getElementById('single-submit-group');
    const batchButtons = document.getElementById('batch-buttons-group');
    const batchSection = document.getElementById('batch-entries-section');
    if (singleSubmit)
        singleSubmit.style.display = action !== 'add' ? 'block' : 'none';
    if (batchButtons)
        batchButtons.style.display = action === 'add' ? 'block' : 'none';
    if (batchSection)
        batchSection.style.display = action === 'add' ? 'block' : 'none';
    // Clear batch entries when switching away from add
    if (action !== 'add' && batchEntries.length > 0) {
        clearBatchEntries();
    }
}
/**
 * Reset form to initial state
 */
function resetForm() {
    selectedEntry = null;
    validationState = {
        name: { valid: false, message: '' },
        institution: { valid: false, message: '' },
        homepage: { valid: false, message: '' },
        scholarid: { valid: false, message: '' }
    };
    document.getElementById('name').value = '';
    document.getElementById('institution').value = '';
    document.getElementById('homepage').value = '';
    document.getElementById('scholarid').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('removal-reason').value = '';
    document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    clearFieldStatus('name');
    clearFieldStatus('institution');
    clearFieldStatus('homepage');
    clearFieldStatus('scholarid');
    document.getElementById('preview-group').style.display = 'none';
    document.getElementById('current-info-group').style.display = 'none';
    updateSubmitButton();
}
/**
 * Handle name input - autocomplete for update/remove
 */
function handleNameInput() {
    const input = document.getElementById('name');
    const query = input.value.trim().toLowerCase();
    clearFieldStatus('name');
    if (query.length < 2) {
        hideSuggestions('name');
        return;
    }
    // For update/remove, search existing entries
    if (currentAction !== 'add') {
        const matches = facultyEntries.filter(entry => entry.name.toLowerCase().includes(query)).slice(0, 10);
        showNameSuggestions(matches);
    }
    updatePreview();
}
/**
 * Get a friendly label for old file type
 */
function getOldFileLabel(oldFile) {
    if (!oldFile)
        return '';
    if (oldFile.includes('industry'))
        return 'Industry';
    if (oldFile.includes('emeritus'))
        return 'Emeritus';
    if (oldFile.includes('rip'))
        return 'Deceased';
    if (oldFile.includes('research'))
        return 'Research';
    if (oldFile.includes('other'))
        return 'Former';
    return 'Former';
}
/**
 * Pre-populate fields from an old/ entry (for re-adding former faculty)
 */
function populateFromOldEntry(entry) {
    const label = getOldFileLabel(entry.oldFile);
    // Populate institution, homepage, and scholarid fields
    document.getElementById('institution').value = entry.institution;
    document.getElementById('homepage').value = entry.homepage;
    document.getElementById('scholarid').value = entry.scholarid;
    // Show status message
    setFieldStatus('name', 'warning', `Found in ${label} - fields pre-populated. Verify and update if needed.`);
    // Validate the populated fields
    validateInstitution();
    validateHomepage();
    validateScholarId();
    updatePreview();
}
/**
 * Show name autocomplete suggestions
 */
function showNameSuggestions(matches) {
    const container = document.getElementById('name-suggestions');
    if (matches.length === 0) {
        hideSuggestions('name');
        return;
    }
    container.innerHTML = matches.map(entry => {
        const statusBadge = entry.isOld
            ? `<span class="label label-warning">${getOldFileLabel(entry.oldFile)}</span> `
            : '';
        return `<div class="suggestion-item${entry.isOld ? ' former-faculty' : ''}" data-name="${escapeHtml(entry.name)}">
            ${statusBadge}<strong>${escapeHtml(entry.name)}</strong>
            <br><small class="text-muted">${escapeHtml(entry.institution)}</small>
        </div>`;
    }).join('');
    container.style.display = 'block';
    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name || '';
            selectFacultyEntry(name);
            hideSuggestions('name');
        });
    });
}
/**
 * Select a faculty entry (for update/remove)
 */
function selectFacultyEntry(name) {
    const entry = facultyEntries.find(e => e.name === name);
    if (!entry)
        return;
    selectedEntry = entry;
    // Populate fields
    document.getElementById('name').value = entry.name;
    if (currentAction === 'update') {
        document.getElementById('institution').value = entry.institution;
        document.getElementById('homepage').value = entry.homepage;
        document.getElementById('scholarid').value = entry.scholarid;
    }
    // Show current info with status indicator for former faculty
    const currentInfoGroup = document.getElementById('current-info-group');
    const currentInfo = document.getElementById('current-info');
    document.getElementById('current-institution').textContent = entry.institution;
    document.getElementById('current-homepage').innerHTML =
        `<a href="${escapeHtml(entry.homepage)}" target="_blank">${escapeHtml(entry.homepage)}</a>`;
    const scholarUrl2 = entry.scholarid === 'NOSCHOLARPAGE' ? '' :
        `https://scholar.google.com/citations?user=${encodeURIComponent(entry.scholarid)}`;
    document.getElementById('current-scholarid').innerHTML = scholarUrl2
        ? `<a href="${escapeHtml(scholarUrl2)}" target="_blank">${escapeHtml(entry.scholarid)}</a>`
        : entry.scholarid;
    // Add/update status indicator for former faculty
    let statusIndicator = currentInfo.querySelector('.former-status');
    if (entry.isOld) {
        const label = getOldFileLabel(entry.oldFile);
        if (!statusIndicator) {
            statusIndicator = document.createElement('p');
            statusIndicator.className = 'former-status';
            currentInfo.insertBefore(statusIndicator, currentInfo.firstChild);
        }
        statusIndicator.innerHTML = `<span class="label label-warning">${label}</span> <em>Former faculty member</em>`;
    }
    else if (statusIndicator) {
        statusIndicator.remove();
    }
    currentInfoGroup.style.display = 'block';
    // Validate - show appropriate message for former vs current faculty
    const statusMsg = entry.isOld
        ? `Former faculty (${getOldFileLabel(entry.oldFile)})`
        : 'Entry found';
    validationState.name = { valid: true, message: statusMsg };
    setFieldStatus('name', 'valid', statusMsg);
    if (currentAction === 'update') {
        validateInstitution();
        validateHomepage();
        validateScholarId();
    }
    updatePreview();
    updateSubmitButton();
}
/**
 * Normalize text for fuzzy matching - expands abbreviations
 */
function normalizeForFuzzyMatch(text) {
    let normalized = text.toLowerCase();
    // Replace abbreviations with full forms for matching
    for (const [full, abbrevs] of Object.entries(ABBREVIATION_MAP)) {
        for (const abbrev of abbrevs) {
            // For abbreviations ending with period, use lookahead for word boundary
            // since \b doesn't work correctly after punctuation
            const escapedAbbrev = escapeRegex(abbrev);
            const regex = abbrev.endsWith('.')
                ? new RegExp(`\\b${escapedAbbrev}(?=\\s|$)`, 'gi') // Period: followed by space or end
                : new RegExp(`\\b${escapedAbbrev}\\b`, 'gi'); // No period: normal word boundary
            normalized = normalized.replace(regex, full);
        }
    }
    return normalized;
}
/**
 * Escape special regex characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Check if institution matches query with fuzzy abbreviation support
 */
function institutionMatchesFuzzy(institution, query) {
    const instLower = institution.toLowerCase();
    const instNorm = normalizeForFuzzyMatch(institution);
    const queryLower = query.toLowerCase().trim();
    const queryNorm = normalizeForFuzzyMatch(query);
    // Direct match after normalization
    if (instNorm.includes(queryNorm)) {
        return true;
    }
    // Also try matching the original query against normalized institution
    if (instNorm.includes(queryLower)) {
        return true;
    }
    // And try matching normalized query against original institution
    if (instLower.includes(queryNorm)) {
        return true;
    }
    // Check if query is a known acronym
    const expansions = ACRONYM_MAP[queryLower];
    if (expansions) {
        for (const expansion of expansions) {
            if (instLower.includes(expansion)) {
                return true;
            }
        }
    }
    return false;
}
// Primary institutions for common acronyms (shown first in results)
// Can be a single institution or array of institutions/patterns
const ACRONYM_PRIMARY = {
    'ut': 'University of Texas at Austin',
    'uf': 'University of Florida',
    'um': 'University of Michigan',
    'uw': ['University of Washington', 'Wisconsin'], // Both UW schools
    'ua': 'University of Arizona',
    'uc': 'california -', // All UC schools (pattern match)
    'ui': 'Univ. of Illinois at Urbana-Champaign',
    'uo': 'University of Oregon',
    'uk': 'University of Kentucky',
    'uq': 'University of Queensland',
    'uv': 'University of Virginia',
    'us': 'University of Sydney',
    'un': 'University of Nebraska',
    'up': 'University of Pennsylvania',
    'ub': 'University at Buffalo',
    'ud': 'University of Delaware',
    'ue': 'University of Edinburgh',
    'ug': 'University of Georgia',
    'uh': 'University of Houston',
    'ul': 'University of Louisville',
    'ur': 'University of Rochester',
    'uy': 'University of York',
    'uz': 'University of Zurich',
};
/**
 * Handle institution input - show autocomplete suggestions
 */
function handleInstitutionInput() {
    const input = document.getElementById('institution');
    const query = input.value.trim();
    clearFieldStatus('institution');
    if (query.length < 2) {
        hideSuggestions('institution');
        return;
    }
    // Filter matching institutions with fuzzy abbreviation support
    const allMatches = institutions.filter(inst => institutionMatchesFuzzy(inst.institution, query));
    // Sort to prioritize primary institutions for acronyms
    const queryLower = query.toLowerCase().trim();
    const primaryConfig = ACRONYM_PRIMARY[queryLower];
    // Helper to check if institution matches primary config
    const isPrimary = (inst) => {
        if (!primaryConfig)
            return false;
        const instLower = inst.toLowerCase();
        if (Array.isArray(primaryConfig)) {
            return primaryConfig.some(p => instLower.includes(p.toLowerCase()));
        }
        return instLower.includes(primaryConfig.toLowerCase());
    };
    allMatches.sort((a, b) => {
        const aIsPrimary = isPrimary(a.institution);
        const bIsPrimary = isPrimary(b.institution);
        // Primary institutions come first
        if (aIsPrimary && !bIsPrimary)
            return -1;
        if (!aIsPrimary && bIsPrimary)
            return 1;
        // Then sort alphabetically
        return a.institution.localeCompare(b.institution);
    });
    const matches = allMatches.slice(0, 10);
    showInstitutionSuggestions(matches);
    updatePreview();
}
/**
 * Show institution autocomplete suggestions with country flags
 */
function showInstitutionSuggestions(matches) {
    const container = document.getElementById('institution-suggestions');
    if (matches.length === 0) {
        hideSuggestions('institution');
        return;
    }
    container.innerHTML = matches.map(inst => {
        const flag = countryCodeToFlag(inst.countryabbrv);
        return `<div class="suggestion-item" data-value="${escapeHtml(inst.institution)}">${flag} ${escapeHtml(inst.institution)}</div>`;
    }).join('');
    container.style.display = 'block';
    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.value || '';
            document.getElementById('institution').value = value;
            hideSuggestions('institution');
            validateInstitution();
            updatePreview();
        });
    });
}
/**
 * Hide autocomplete suggestions
 */
function hideSuggestions(field) {
    const container = document.getElementById(`${field}-suggestions`);
    if (container) {
        container.style.display = 'none';
    }
}
/**
 * Translate name to DBLP URL format
 */
function translateNameToDBLP(name) {
    // Remove periods
    let cleanName = name.replace(/\./g, '');
    const parts = cleanName.split(/\s+/);
    if (parts.length === 0)
        return '';
    // Check for disambiguation number at end (e.g., "0001")
    let disambiguation = '';
    if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
        disambiguation = parts.pop();
    }
    if (parts.length === 0)
        return '';
    // DBLP format: FirstName_MiddleName_LastName (underscores for spaces, = for hyphens)
    // Join all parts with underscores and replace hyphens with =
    let result = parts.join('_').replace(/-/g, '=');
    // Add disambiguation number if present
    if (disambiguation) {
        result = `${result}_${disambiguation}`;
    }
    return result;
}
/**
 * Check DBLP for name existence
 */
function checkDBLPName(name) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const result = { found: false, exactMatch: false, suggestions: [], error: undefined };
        try {
            // Use simple search query - DBLP will add wildcards automatically
            // This works better than the strict author:Name: format for middle initials
            const url = `https://dblp.org/search/author/api?q=${encodeURIComponent(name)}&format=json&c=10`;
            const response = yield fetch(url);
            if (response.status === 429) {
                result.error = 'DBLP rate limited - try again later';
                return result;
            }
            if (!response.ok) {
                result.error = `DBLP returned ${response.status}`;
                return result;
            }
            const data = yield response.json();
            const hits = ((_b = (_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a.hits) === null || _b === void 0 ? void 0 : _b.hit) || [];
            const totalHits = parseInt(((_d = (_c = data === null || data === void 0 ? void 0 : data.result) === null || _c === void 0 ? void 0 : _c.hits) === null || _d === void 0 ? void 0 : _d['@total']) || '0', 10);
            if (totalHits > 0) {
                result.found = true;
                // Normalize input name for comparison (lowercase, collapse spaces, remove periods)
                const normalizedInput = name.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
                for (const hit of hits.slice(0, 5)) {
                    const author = ((_e = hit === null || hit === void 0 ? void 0 : hit.info) === null || _e === void 0 ? void 0 : _e.author) || '';
                    if (author) {
                        result.suggestions.push(author);
                        // Normalize author name for comparison
                        const normalizedAuthor = author.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
                        if (normalizedAuthor === normalizedInput) {
                            result.exactMatch = true;
                        }
                    }
                }
            }
        }
        catch (e) {
            result.error = e.message || 'DBLP check failed';
        }
        return result;
    });
}
/**
 * Validate name field
 */
function validateName() {
    const name = document.getElementById('name').value.trim();
    if (!name) {
        setFieldStatus('name', 'error', 'Name is required');
        return;
    }
    if (name.length < 2) {
        setFieldStatus('name', 'error', 'Name is too short');
        return;
    }
    // Check for Excel corruption patterns
    const excelPatterns = ['#NAME?', '#REF?', '#VALUE?', '#DIV/0!', '#NULL!', '#N/A', '#NUM!'];
    if (excelPatterns.some(p => name.includes(p))) {
        setFieldStatus('name', 'error', 'Name contains Excel error - do not use Excel');
        return;
    }
    // For add action, check it doesn't already exist and verify DBLP
    if (currentAction === 'add') {
        const existingEntry = facultyEntries.find(e => e.name.toLowerCase() === name.toLowerCase());
        if (existingEntry) {
            if (existingEntry.isOld) {
                // Pre-populate fields from old/ entry but stay in Add mode
                populateFromOldEntry(existingEntry);
                return;
            }
            else {
                // Active entry - auto-switch to update mode
                switchToUpdateWithEntry(existingEntry);
                return;
            }
        }
        // Show checking status and verify against DBLP
        setFieldStatus('name', 'valid', 'Checking DBLP...');
        checkDBLPNameAsync(name);
        return;
    }
    setFieldStatus('name', 'valid', 'Name validated');
    updatePreview();
}
/**
 * Validate name for update/remove modes - auto-select if exact match found
 */
function validateNameForUpdateRemove() {
    const name = document.getElementById('name').value.trim();
    if (!name) {
        setFieldStatus('name', 'error', 'Name is required');
        return;
    }
    if (name.length < 2) {
        setFieldStatus('name', 'error', 'Name is too short');
        return;
    }
    // If entry already selected and name matches, we're good
    if (selectedEntry && selectedEntry.name.toLowerCase() === name.toLowerCase()) {
        return;
    }
    // Look for exact match (case-insensitive)
    const exactMatch = facultyEntries.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (exactMatch) {
        // Auto-select the matching entry
        selectFacultyEntry(exactMatch.name);
    }
    else {
        // Check for close matches to provide helpful message
        const closeMatches = facultyEntries.filter(e => e.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(e.name.toLowerCase())).slice(0, 3);
        if (closeMatches.length > 0) {
            const suggestions = closeMatches.map(e => `"${e.name}"`).join(', ');
            setFieldStatus('name', 'error', `Name not found. Did you mean: ${suggestions}?`);
        }
        else {
            setFieldStatus('name', 'error', 'Name not found in CSRankings. Use the dropdown to select an existing entry.');
        }
    }
}
/**
 * Async DBLP name check with debouncing
 */
let dblpCheckTimeout;
function checkDBLPNameAsync(name) {
    return __awaiter(this, void 0, void 0, function* () {
        // Debounce DBLP checks
        if (dblpCheckTimeout) {
            clearTimeout(dblpCheckTimeout);
        }
        dblpCheckTimeout = window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const result = yield checkDBLPName(name);
            // Make sure the name hasn't changed while we were checking
            const currentName = document.getElementById('name').value.trim();
            if (currentName !== name)
                return;
            if (result.error) {
                setFieldStatus('name', 'warning', `DBLP check failed: ${result.error}`);
            }
            else if (!result.found) {
                // Check if this name is a known alias
                const canonicalName = getCanonicalDBLPName(name);
                if (canonicalName) {
                    setFieldStatus('name', 'warning', `This name is an alias. Use the canonical DBLP name: <strong>${canonicalName}</strong>`);
                }
                else {
                    setFieldStatus('name', 'error', `Name not found in DBLP. Check <a href="https://dblp.org/search?q=${encodeURIComponent(name)}" target="_blank">DBLP</a> for exact spelling.`);
                }
            }
            else if (!result.exactMatch && result.suggestions.length > 0) {
                const suggestions = result.suggestions.slice(0, 3).map(s => `"${s}"`).join(', ');
                setFieldStatus('name', 'warning', `Not exact match. Did you mean: ${suggestions}?`);
            }
            else {
                setFieldStatus('name', 'valid', 'Found in DBLP');
            }
            updatePreview();
        }), 500);
    });
}
/**
 * Validate institution field
 */
function validateInstitution() {
    if (currentAction === 'remove') {
        validationState.institution = { valid: true, message: '' };
        updateSubmitButton();
        return;
    }
    const institution = document.getElementById('institution').value.trim();
    if (!institution) {
        setFieldStatus('institution', 'error', 'Institution is required');
        return;
    }
    // Check if institution exists
    const exists = institutions.some(inst => inst.institution.toLowerCase() === institution.toLowerCase());
    if (exists) {
        // Find exact casing
        const exactInst = institutions.find(inst => inst.institution.toLowerCase() === institution.toLowerCase());
        if (exactInst) {
            document.getElementById('institution').value = exactInst.institution;
        }
        setFieldStatus('institution', 'valid', 'Institution found');
    }
    else {
        setFieldStatus('institution', 'error', 'Institution not in CSRankings. <a href="https://github.com/emeryberger/CSrankings/issues/new?template=new-institution.md" target="_blank">Request it first</a>.');
    }
    updatePreview();
}
/**
 * Validate homepage URL
 */
function validateHomepage() {
    const testLink = document.getElementById('test-homepage-link');
    if (currentAction === 'remove') {
        validationState.homepage = { valid: true, message: '' };
        testLink.style.display = 'none';
        updateSubmitButton();
        return;
    }
    const homepage = document.getElementById('homepage').value.trim();
    if (!homepage) {
        setFieldStatus('homepage', 'error', 'Homepage URL is required');
        testLink.style.display = 'none';
        return;
    }
    // Check URL format
    try {
        const url = new URL(homepage);
        if (!['http:', 'https:'].includes(url.protocol)) {
            setFieldStatus('homepage', 'error', 'URL must start with http:// or https://');
            testLink.style.display = 'none';
            return;
        }
        // Show test link
        testLink.href = homepage;
        testLink.style.display = 'inline';
        // Format valid, now check accessibility
        setFieldStatus('homepage', 'valid', 'Checking accessibility...');
        checkHomepageAsync(homepage);
    }
    catch (e) {
        setFieldStatus('homepage', 'error', 'Invalid URL format');
        testLink.style.display = 'none';
        return;
    }
}
/**
 * Async homepage check with debouncing
 */
let homepageCheckTimeout;
function checkHomepageAsync(homepage) {
    return __awaiter(this, void 0, void 0, function* () {
        // Debounce checks
        if (homepageCheckTimeout) {
            clearTimeout(homepageCheckTimeout);
        }
        homepageCheckTimeout = window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const name = document.getElementById('name').value.trim();
            const institution = document.getElementById('institution').value.trim();
            // Make sure the homepage hasn't changed while we were waiting
            const currentHomepage = document.getElementById('homepage').value.trim();
            if (currentHomepage !== homepage)
                return;
            // Check for social media / non-academic URLs
            const url = new URL(homepage);
            const blockedDomains = [
                // Social media
                { domains: ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com'],
                    message: 'Use official academic/institutional page, not social media' },
                // Code hosting (not homepages)
                { domains: ['github.com', 'gitlab.com', 'bitbucket.org'],
                    message: 'Use official academic page, not code repository' },
                // Blogging platforms
                { domains: ['medium.com', 'substack.com', 'wordpress.com', 'blogger.com', 'tumblr.com'],
                    message: 'Use official academic page, not blog platform' },
                // Video platforms
                { domains: ['youtube.com', 'youtu.be', 'vimeo.com'],
                    message: 'Use official academic page, not video platform' },
                // Academic profile aggregators (not true homepages)
                { domains: ['researchgate.net'],
                    message: 'Use official academic page, not ResearchGate profile' },
                { domains: ['scholar.google.com', 'scholar.google.'],
                    message: 'Use official academic page. Put Scholar ID in the Scholar field below.' },
                { domains: ['dblp.org', 'dblp.uni-trier.de'],
                    message: 'Use official academic page, not DBLP profile' },
                { domains: ['semanticscholar.org'],
                    message: 'Use official academic page, not Semantic Scholar profile' },
                { domains: ['orcid.org'],
                    message: 'Use official academic page, not ORCID profile' },
                { domains: ['wikipedia.org'],
                    message: 'Use official academic page, not Wikipedia' },
                // Link aggregators
                { domains: ['linktr.ee', 'linkin.bio', 'about.me', 'bio.link'],
                    message: 'Use official academic page, not link aggregator' },
            ];
            for (const blocked of blockedDomains) {
                if (blocked.domains.some(d => url.hostname.includes(d))) {
                    setFieldStatus('homepage', 'error', blocked.message);
                    updatePreview();
                    return;
                }
            }
            // Check for document files (not a homepage)
            const pathLower = url.pathname.toLowerCase();
            const documentExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'];
            const matchedExt = documentExtensions.find(ext => pathLower.endsWith(ext));
            if (matchedExt) {
                setFieldStatus('homepage', 'error', `Link to homepage, not a ${matchedExt.substring(1).toUpperCase()} file`);
                updatePreview();
                return;
            }
            // Check for image files
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
            if (imageExtensions.some(ext => pathLower.endsWith(ext))) {
                setFieldStatus('homepage', 'error', 'Link to homepage, not an image file');
                updatePreview();
                return;
            }
            // Track website builder warning (don't block, but add warning suffix)
            const websiteBuilders = ['wix.com', 'weebly.com', 'squarespace.com', 'sites.google.com',
                'webflow.io', 'carrd.co', 'notion.site', 'notion.so'];
            const isWebsiteBuilder = websiteBuilders.some(d => url.hostname.includes(d));
            // Check for overly long URLs or excessive query parameters
            if (homepage.length > 200) {
                setFieldStatus('homepage', 'warning', 'URL is unusually long. Verify this is the correct homepage.');
                // Continue checking but flag it
            }
            // Check for common email/webmail URLs
            const webmailDomains = ['outlook.office.com', 'mail.google.com', 'webmail.'];
            if (webmailDomains.some(d => url.hostname.includes(d) || url.href.includes(d))) {
                setFieldStatus('homepage', 'error', 'Use academic homepage, not email/webmail link');
                updatePreview();
                return;
            }
            // Check for directory-style URLs that aren't personal pages
            // These patterns suggest a department listing, not an individual's page
            const directoryPatterns = [
                /\/faculty\/?$/i, // ends with /faculty or /faculty/
                /\/people\/?$/i, // ends with /people or /people/
                /\/staff\/?$/i, // ends with /staff or /staff/
                /\/directory\/?$/i, // ends with /directory
                /\/members\/?$/i, // ends with /members
                /\/team\/?$/i, // ends with /team
            ];
            if (directoryPatterns.some(pattern => pattern.test(pathLower))) {
                setFieldStatus('homepage', 'warning', 'This looks like a department directory. Link to the individual\'s page.');
                // Don't block - some faculty pages do end with /people/name format
            }
            // Check for academic portal URLs that aren't homepages
            const portalDomains = ['avesis.', 'pure.', 'portal.', 'profiles.'];
            const isAcademicPortal = portalDomains.some(d => url.hostname.includes(d));
            // Verify the URL uses a known academic domain
            // Uses domains extracted from institutions.csv + common academic TLD patterns
            const hostname = url.hostname.toLowerCase();
            const hostParts = hostname.split('.');
            // Check against known institution domains from institutions.csv
            let matchesKnownInstitution = false;
            if (knownAcademicDomains.size > 0) {
                // Check if hostname or any parent domain is in our known set
                matchesKnownInstitution = knownAcademicDomains.has(hostname) ||
                    (hostParts.length >= 2 && knownAcademicDomains.has(hostParts.slice(-2).join('.'))) ||
                    (hostParts.length >= 3 && knownAcademicDomains.has(hostParts.slice(-3).join('.')));
            }
            // Common academic TLD patterns (fallback for institutions not in CSV)
            const academicTLDPatterns = [
                /\.edu$/, // US universities
                /\.ac\.[a-z]{2}$/, // Academic domains (ac.uk, ac.jp, ac.kr, ac.il, ac.nz, ac.in, etc.)
                /\.edu\.[a-z]{2}$/, // Educational (edu.au, edu.cn, edu.sg, edu.tw, etc.)
            ];
            // Common academic domain patterns
            const academicDomainPatterns = [
                /\.(edu|ac|uni|university|college|institute|school)\./, // generic academic
                /^(www\.)?(cs|cse|eecs|ece|engineering|computing)\./, // CS departments
            ];
            const matchesAcademicTLD = academicTLDPatterns.some(pattern => pattern.test(hostname));
            const matchesAcademicPattern = academicDomainPatterns.some(pattern => pattern.test(url.href));
            const isAcademicDomain = matchesKnownInstitution || matchesAcademicTLD || matchesAcademicPattern;
            // Track if it's a non-academic domain for warning purposes
            const isNonAcademicDomain = !isAcademicDomain;
            try {
                // Try to fetch the homepage (may fail due to CORS)
                const response = yield fetch(homepage, {
                    method: 'GET',
                    mode: 'cors',
                    headers: { 'Accept': 'text/html' }
                });
                if (!response.ok) {
                    setFieldStatus('homepage', 'error', `Page returned HTTP ${response.status}`);
                    updatePreview();
                    return;
                }
                const text = yield response.text();
                const lowerText = text.toLowerCase();
                // Smart name matching - check full name, first name, or last name
                const nameParts = name.toLowerCase().split(/\s+/);
                const firstName = nameParts[0] || '';
                const lastName = nameParts[nameParts.length - 1] || '';
                // Check for name variations
                const fullNameFound = name && lowerText.includes(name.toLowerCase());
                const lastNameFound = lastName && lastName.length > 2 && lowerText.includes(lastName);
                const firstNameFound = firstName && firstName.length > 2 && lowerText.includes(firstName);
                const nameFound = fullNameFound || (lastNameFound && firstNameFound);
                // Smart institution matching - check full name or common abbreviations
                let instFound = institution && lowerText.includes(institution.toLowerCase());
                if (!instFound && institution) {
                    // Try abbreviation matching
                    const instLower = institution.toLowerCase();
                    const abbrevs = [
                        instLower.replace(/university/gi, 'univ'),
                        instLower.replace(/institute/gi, 'inst'),
                        instLower.replace(/technology/gi, 'tech'),
                        // Also try just key words
                        ...instLower.split(/\s+/).filter(w => w.length > 3)
                    ];
                    instFound = abbrevs.some(a => a && lowerText.includes(a));
                }
                // Check for academic page indicators
                const academicIndicators = ['professor', 'faculty', 'research', 'publications',
                    'teaching', 'courses', 'phd', 'lab', 'scholar'];
                const hasAcademicContent = academicIndicators.some(ind => lowerText.includes(ind));
                // Build status message with optional warnings
                const needsWarning = isWebsiteBuilder || isAcademicPortal || isNonAcademicDomain;
                let warningNote = '';
                if (isNonAcademicDomain && !isWebsiteBuilder && !isAcademicPortal) {
                    warningNote = ' (non-academic domain - verify this is official)';
                }
                else if (isWebsiteBuilder) {
                    warningNote = ' (institutional page preferred)';
                }
                else if (isAcademicPortal) {
                    warningNote = ' (direct faculty page preferred over portal)';
                }
                if (nameFound && instFound) {
                    if (needsWarning) {
                        setFieldStatus('homepage', 'warning', 'Name & institution found' + warningNote);
                    }
                    else {
                        setFieldStatus('homepage', 'valid', 'Page accessible, name & institution found');
                    }
                }
                else if (nameFound && hasAcademicContent) {
                    if (needsWarning) {
                        setFieldStatus('homepage', 'warning', 'Name found on academic page' + warningNote);
                    }
                    else {
                        setFieldStatus('homepage', 'valid', 'Page accessible, name found on academic page');
                    }
                }
                else if (lastNameFound && hasAcademicContent) {
                    setFieldStatus('homepage', 'warning', 'Last name found - verify full name' + warningNote);
                }
                else if (nameFound) {
                    setFieldStatus('homepage', 'warning', 'Verify it\'s the correct person' + warningNote);
                }
                else if (hasAcademicContent) {
                    setFieldStatus('homepage', 'warning', 'Academic page found, but name not detected' + warningNote);
                }
                else {
                    setFieldStatus('homepage', 'warning', 'Page accessible, verify it shows faculty info' + warningNote);
                }
            }
            catch (e) {
                // CORS error or network failure - can't verify from browser
                // This is common and not necessarily an error
                if (isWebsiteBuilder) {
                    setFieldStatus('homepage', 'warning', 'URL format valid, but institutional page preferred');
                }
                else if (isAcademicPortal) {
                    setFieldStatus('homepage', 'warning', 'URL format valid, but direct faculty page preferred');
                }
                else if (isNonAcademicDomain) {
                    setFieldStatus('homepage', 'warning', 'Non-academic domain. Verify this is the official faculty page.');
                }
                else {
                    setFieldStatus('homepage', 'valid', 'URL format valid. Will be verified during review.');
                }
            }
            updatePreview();
        }), 500);
    });
}
/**
 * Validate Google Scholar ID format
 */
function validateScholarId() {
    if (currentAction === 'remove') {
        validationState.scholarid = { valid: true, message: '' };
        updateSubmitButton();
        return;
    }
    const scholarid = document.getElementById('scholarid').value.trim();
    if (!scholarid) {
        setFieldStatus('scholarid', 'error', 'Google Scholar ID is required');
        return;
    }
    // NOSCHOLARPAGE is always valid
    if (scholarid === 'NOSCHOLARPAGE') {
        setFieldStatus('scholarid', 'valid', 'Valid (no Scholar page)');
        updatePreview();
        return;
    }
    // Valid format: 12 alphanumeric characters ending in J (Google Scholar pattern)
    const validFormat = /^[a-zA-Z0-9_-]{11}[CJ]$/.test(scholarid);
    if (!validFormat) {
        setFieldStatus('scholarid', 'error', 'Must be exactly 12 characters ending in C or J, or NOSCHOLARPAGE');
        updatePreview();
        return;
    }
    // Format valid, now check online
    setFieldStatus('scholarid', 'valid', 'Checking Scholar profile...');
    checkScholarIdAsync(scholarid);
    updatePreview();
}
/**
 * Check Google Scholar ID - no official API available, so just validate format
 * and provide a link for manual verification. Server-side will do full check.
 */
function checkScholarIdAsync(scholarid) {
    // Google Scholar has no free API - just provide link for manual check
    const scholarUrl = `https://scholar.google.com/citations?user=${scholarid}`;
    setFieldStatus('scholarid', 'valid', `Format valid. <a href="${scholarUrl}" target="_blank">Verify profile ↗</a>`);
}
/**
 * Update field status display
 */
function setFieldStatus(field, status, message) {
    const group = document.getElementById(`${field}-group`);
    const statusEl = document.getElementById(`${field}-status`);
    if (!group || !statusEl)
        return;
    // Update validation state
    validationState[field] = { valid: status === 'valid' || status === 'warning', message };
    // Update UI
    group.classList.remove('has-success', 'has-error', 'has-warning');
    if (status === 'valid') {
        group.classList.add('has-success');
        statusEl.innerHTML = `<span class="text-success">&#10003; ${message}</span>`;
    }
    else if (status === 'error') {
        group.classList.add('has-error');
        statusEl.innerHTML = `<span class="text-danger">&#10007; ${message}</span>`;
    }
    else if (status === 'warning') {
        group.classList.add('has-warning');
        statusEl.innerHTML = `<span class="text-warning">&#9888; ${message}</span>`;
    }
    updateSubmitButton();
}
/**
 * Clear field status
 */
function clearFieldStatus(field) {
    const group = document.getElementById(`${field}-group`);
    const statusEl = document.getElementById(`${field}-status`);
    if (group) {
        group.classList.remove('has-success', 'has-error', 'has-warning');
    }
    if (statusEl) {
        statusEl.innerHTML = '';
    }
    validationState[field] = { valid: false, message: '' };
    updateSubmitButton();
}
/**
 * Update submit button state
 */
function updateSubmitButton() {
    let canSubmit = false;
    const submitText = document.getElementById('submit-text');
    switch (currentAction) {
        case 'add':
            // All fields valid + all checkboxes checked
            const fieldsValid = Object.values(validationState).every((v) => v.valid);
            const checkboxes = document.querySelectorAll('#eligibility-section input[type="checkbox"][required]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            canSubmit = fieldsValid && allChecked;
            if (submitText)
                submitText.textContent = 'Submit New Entry';
            // Update batch buttons
            const addToBatchBtn = document.getElementById('add-to-batch-btn');
            const submitBtnAdd = document.getElementById('submit-btn-add');
            const submitBatchBtn = document.getElementById('submit-batch-btn');
            if (addToBatchBtn)
                addToBatchBtn.disabled = !canSubmit;
            if (submitBtnAdd)
                submitBtnAdd.disabled = !canSubmit;
            if (submitBatchBtn)
                submitBatchBtn.disabled = batchEntries.length === 0;
            break;
        case 'update':
            // Selected entry + all fields valid + something actually changed
            const updateFieldsValid = Object.values(validationState).every((v) => v.valid);
            let hasChanges = false;
            if (selectedEntry) {
                const currentHomepage = document.getElementById('homepage').value.trim();
                const currentScholarid = document.getElementById('scholarid').value.trim();
                const originalHomepage = selectedEntry.homepage.trim();
                const originalScholarid = selectedEntry.scholarid.trim();
                hasChanges = currentHomepage !== originalHomepage ||
                    currentScholarid !== originalScholarid;
            }
            // For reinstatements (from old/), always allow (moving back to active is a change)
            const isReinstatement = (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.isOld) === true;
            canSubmit = selectedEntry !== null && updateFieldsValid && (hasChanges || isReinstatement);
            // Update button text based on whether this is a reinstatement
            if (submitText) {
                if (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.isOld) {
                    submitText.textContent = 'Submit Reinstatement';
                }
                else if (!hasChanges && selectedEntry) {
                    submitText.textContent = 'No Changes';
                }
                else {
                    submitText.textContent = 'Submit Update';
                }
            }
            break;
        case 'remove':
            // Selected entry + reason selected
            const reasonSelected = document.getElementById('removal-reason').value !== '';
            canSubmit = selectedEntry !== null && validationState.name.valid && reasonSelected;
            if (submitText)
                submitText.textContent = 'Submit Removal';
            break;
    }
    document.getElementById('submit-btn').disabled = !canSubmit;
}
/**
 * Update CSV preview
 */
function updatePreview() {
    const name = document.getElementById('name').value.trim();
    const institution = document.getElementById('institution').value.trim();
    const homepage = document.getElementById('homepage').value.trim();
    const scholarid = document.getElementById('scholarid').value.trim();
    const previewGroup = document.getElementById('preview-group');
    if (currentAction === 'remove') {
        if (selectedEntry) {
            document.getElementById('csv-preview').textContent =
                `${selectedEntry.name},${selectedEntry.institution},${selectedEntry.homepage},${selectedEntry.scholarid}`;
            previewGroup.style.display = 'block';
        }
        else {
            previewGroup.style.display = 'none';
        }
        return;
    }
    if (name && institution && homepage && scholarid) {
        const csvLine = `${name},${institution},${homepage},${scholarid}`;
        document.getElementById('csv-preview').textContent = csvLine;
        // Determine target file
        const firstLetter = name.charAt(0).toLowerCase();
        const targetFile = /[a-z]/.test(firstLetter)
            ? `csrankings-${firstLetter}.csv`
            : 'csrankings-0.csv';
        const targetFileEl = document.getElementById('target-file');
        const targetFileUpdateEl = document.getElementById('target-file-update');
        if (targetFileEl)
            targetFileEl.textContent = targetFile;
        if (targetFileUpdateEl)
            targetFileUpdateEl.textContent = targetFile;
        previewGroup.style.display = 'block';
    }
    else {
        previewGroup.style.display = 'none';
    }
}
/**
 * Handle form submission
 */
function handleSubmit(e) {
    var _a;
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const institution = document.getElementById('institution').value.trim();
    const homepage = document.getElementById('homepage').value.trim();
    const scholarid = document.getElementById('scholarid').value.trim();
    const notes = document.getElementById('notes').value.trim();
    // Build submission data
    const entry = { name, institution, homepage, scholarid };
    let issueUrl;
    switch (currentAction) {
        case 'add':
            issueUrl = createAddIssueUrl(entry, notes);
            break;
        case 'update':
            issueUrl = createUpdateIssueUrl(selectedEntry, entry, notes);
            break;
        case 'remove':
            const reason = document.getElementById('removal-reason').value;
            const reasonOther = document.getElementById('removal-reason-other').value;
            const companyName = ((_a = document.getElementById('company-name')) === null || _a === void 0 ? void 0 : _a.value.trim()) || '';
            const fullReason = reason === 'other' ? reasonOther :
                reason === 'industry' && companyName ? `${reason} (${companyName})` : reason;
            issueUrl = createRemoveIssueUrl(selectedEntry, fullReason, notes);
            break;
        default:
            return;
    }
    // Track submission
    if (typeof ga !== 'undefined') {
        ga('send', 'event', 'submission', currentAction, institution || name);
    }
    // Redirect to GitHub Issue creation
    // The GitHub Action will process this and create a PR
    window.location.href = issueUrl;
}
/**
 * Create GitHub Issue URL for adding new faculty
 */
function createAddIssueUrl(data, notes) {
    const title = `[CSrankings form submission] Add ${data.name} (${data.institution})`;
    const body = `### Action
Add new faculty entry

### Name (as it appears in DBLP)
${data.name}

### Institution
${data.institution}

### Homepage URL
${data.homepage}

### Google Scholar ID
${data.scholarid}

### Eligibility Confirmation
- [X] Full-time, tenure-track faculty
- [X] Can solely advise CS PhD students
- [X] Name matches DBLP exactly
- [X] Homepage URL works and shows name/affiliation

${notes ? `### Notes\n${notes}` : ''}`;
    // Note: labels can only be set via URL by users with write access
    // The hourly workflow will identify issues by title prefix instead
    const params = new URLSearchParams({
        title: title
    });
    // Don't use template - we construct the full body with all required fields
    return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}&body=${encodeURIComponent(body)}`;
}
/**
 * Create GitHub Issue URL for updating existing faculty
 */
function createUpdateIssueUrl(oldEntry, newEntry, notes) {
    // Check if this is a reinstatement (from old/ folder back to active)
    const isReinstatement = oldEntry.isOld === true;
    const oldFileLabel = oldEntry.oldFile ? getOldFileLabel(oldEntry.oldFile) : '';
    const title = isReinstatement
        ? `[CSrankings form submission] Reinstate ${newEntry.name} (${newEntry.institution})`
        : `[CSrankings form submission] Update ${newEntry.name}`;
    const changes = [];
    if (oldEntry.institution !== newEntry.institution) {
        changes.push(`- Institution: ${oldEntry.institution} → ${newEntry.institution}`);
    }
    if (oldEntry.homepage !== newEntry.homepage) {
        changes.push(`- Homepage: ${oldEntry.homepage} → ${newEntry.homepage}`);
    }
    if (oldEntry.scholarid !== newEntry.scholarid) {
        changes.push(`- Scholar ID: ${oldEntry.scholarid} → ${newEntry.scholarid}`);
    }
    const actionLine = isReinstatement
        ? `Reinstate former faculty (was in ${oldFileLabel || 'old/'} folder)`
        : 'Update existing faculty entry';
    const sourceFile = isReinstatement && oldEntry.oldFile
        ? `\n### Source File\n\`${oldEntry.oldFile}\``
        : '';
    const body = `### Action
${actionLine}

### Name
${newEntry.name}

### Changes
${changes.join('\n') || 'No changes specified'}
${sourceFile}

### New Entry
\`\`\`
${newEntry.name},${newEntry.institution},${newEntry.homepage},${newEntry.scholarid}
\`\`\`

### Old Entry
\`\`\`
${oldEntry.name},${oldEntry.institution},${oldEntry.homepage},${oldEntry.scholarid}
\`\`\`

${notes ? `### Notes\n${notes}` : ''}`;
    const params = new URLSearchParams({
        title: title
    });
    return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}&body=${encodeURIComponent(body)}`;
}
/**
 * Create GitHub Issue URL for removing faculty
 */
function createRemoveIssueUrl(entry, reason, notes) {
    const title = `[CSrankings form submission] Remove ${entry.name} (${entry.institution})`;
    const body = `### Action
Remove faculty entry

### Name
${entry.name}

### Institution
${entry.institution}

### Reason for Removal
${reason}

### Current Entry
\`\`\`
${entry.name},${entry.institution},${entry.homepage},${entry.scholarid}
\`\`\`

${notes ? `### Notes\n${notes}` : ''}`;
    const params = new URLSearchParams({
        title: title
    });
    return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}&body=${encodeURIComponent(body)}`;
}
/**
 * Show error message
 */
function showError(message) {
    var _a;
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.innerHTML = `<strong>Error:</strong> ${message}`;
    (_a = document.querySelector('.container')) === null || _a === void 0 ? void 0 : _a.prepend(alert);
}
/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Utility: Debounce function
 */
function debounce(fn, delay) {
    let timeout;
    return ((...args) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    });
}
/**
 * Show progress indicator
 */
function showProgress(message) {
    var _a;
    let progressDiv = document.getElementById('progress-indicator');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'progress-indicator';
        progressDiv.className = 'alert alert-info';
        (_a = document.querySelector('.container')) === null || _a === void 0 ? void 0 : _a.prepend(progressDiv);
    }
    progressDiv.innerHTML = `<span class="spinning">&#8635;</span> ${message}`;
    progressDiv.style.display = 'block';
}
/**
 * Hide progress indicator
 */
function hideProgress() {
    const progressDiv = document.getElementById('progress-indicator');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}
/**
 * Show success message
 */
function showSuccess(message) {
    var _a;
    const existingAlerts = document.querySelectorAll('.alert-success');
    existingAlerts.forEach(el => el.remove());
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `<strong>Success!</strong> ${message}`;
    (_a = document.querySelector('.container')) === null || _a === void 0 ? void 0 : _a.prepend(alert);
    // Auto-dismiss after 5 seconds
    setTimeout(() => alert.remove(), 5000);
}
/**
 * Handle adding current entry to batch
 */
function handleAddToBatch() {
    const name = document.getElementById('name').value.trim();
    const institution = document.getElementById('institution').value.trim();
    const homepage = document.getElementById('homepage').value.trim();
    const scholarid = document.getElementById('scholarid').value.trim();
    // Check for duplicate name in batch
    if (batchEntries.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        alert(`"${name}" is already in the batch.`);
        return;
    }
    // Check for duplicate homepage in batch
    if (batchEntries.some(e => e.homepage.toLowerCase() === homepage.toLowerCase())) {
        alert(`Homepage "${homepage}" is already used by another entry in the batch.`);
        return;
    }
    // Add to batch
    const entry = { name, institution, homepage, scholarid };
    batchEntries.push(entry);
    // Update batch UI
    updateBatchUI();
    // Clear form for next entry (keep institution and checkboxes)
    document.getElementById('name').value = '';
    document.getElementById('homepage').value = '';
    document.getElementById('scholarid').value = '';
    // Reset validation for cleared fields
    validationState.name = { valid: false, message: '' };
    validationState.homepage = { valid: false, message: '' };
    validationState.scholarid = { valid: false, message: '' };
    clearFieldStatus('name');
    clearFieldStatus('homepage');
    clearFieldStatus('scholarid');
    // Hide preview
    const previewGroup = document.getElementById('preview-group');
    if (previewGroup)
        previewGroup.style.display = 'none';
    // Focus name field
    document.getElementById('name').focus();
    // Show success message
    showSuccess(`Added "${name}" to batch (${batchEntries.length} total)`);
}
/**
 * Update batch entries UI
 */
function updateBatchUI() {
    const tbody = document.getElementById('batch-entries-body');
    const countBadge = document.getElementById('batch-count');
    const countBtn = document.getElementById('batch-count-btn');
    const submitBatchBtn = document.getElementById('submit-batch-btn');
    if (!tbody)
        return;
    // Update count badges
    if (countBadge)
        countBadge.textContent = String(batchEntries.length);
    if (countBtn)
        countBtn.textContent = String(batchEntries.length);
    // Update submit batch button
    if (submitBatchBtn)
        submitBatchBtn.disabled = batchEntries.length === 0;
    // Rebuild table
    tbody.innerHTML = '';
    batchEntries.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(entry.name)}</td>
            <td><a href="${escapeHtml(entry.homepage)}" target="_blank" title="${escapeHtml(entry.homepage)}">${escapeHtml(truncateUrl(entry.homepage))}</a></td>
            <td><code>${escapeHtml(entry.scholarid)}</code></td>
            <td><button type="button" class="btn btn-xs btn-danger" data-index="${index}" title="Remove">&#10007;</button></td>
        `;
        tbody.appendChild(row);
    });
    // Add click handlers for remove buttons
    tbody.querySelectorAll('button[data-index]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index') || '0');
            removeBatchEntry(index);
        });
    });
}
/**
 * Truncate URL for display
 */
function truncateUrl(url) {
    if (url.length <= 40)
        return url;
    try {
        const parsed = new URL(url);
        const path = parsed.pathname;
        if (path.length > 20) {
            return parsed.hostname + '/...' + path.slice(-15);
        }
        return parsed.hostname + path;
    }
    catch (_a) {
        return url.slice(0, 37) + '...';
    }
}
/**
 * Remove entry from batch
 */
function removeBatchEntry(index) {
    const removed = batchEntries.splice(index, 1)[0];
    updateBatchUI();
    showSuccess(`Removed "${removed.name}" from batch`);
}
/**
 * Clear all batch entries
 */
function clearBatchEntries() {
    batchEntries = [];
    updateBatchUI();
}
/**
 * Handle submitting batch entries
 */
function handleSubmitBatch() {
    if (batchEntries.length === 0)
        return;
    const institution = batchEntries[0].institution;
    const notes = document.getElementById('notes').value.trim();
    // Create batch issue URL
    const issueUrl = createBatchIssueUrl(batchEntries, institution, notes);
    // Track submission
    if (typeof ga !== 'undefined') {
        ga('send', 'event', 'submission', 'batch-add', institution, batchEntries.length);
    }
    // Redirect to GitHub
    window.location.href = issueUrl;
}
/**
 * Create GitHub Issue URL for batch submission
 */
function createBatchIssueUrl(entries, institution, notes) {
    const title = `[CSrankings form submission] Add ${entries.length} faculty from ${institution}`;
    const entriesList = entries.map((e, i) => `${i + 1}. **${e.name}**\n   - Homepage: ${e.homepage}\n   - Scholar ID: \`${e.scholarid}\``).join('\n\n');
    const csvLines = entries.map(e => `${e.name},${e.institution},${e.homepage},${e.scholarid}`).join('\n');
    const body = `### Action
Add ${entries.length} new faculty entries (batch submission)

### Institution
${institution}

### Faculty Entries
${entriesList}

### CSV Lines
\`\`\`
${csvLines}
\`\`\`

### Notes
${notes || 'None'}

---
*Submitted via CSRankings batch submission form*`;
    const params = new URLSearchParams({
        title: title,
        labels: 'submission,batch'
    });
    return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}&body=${encodeURIComponent(body)}`;
}
