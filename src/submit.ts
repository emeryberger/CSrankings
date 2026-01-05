/**
 * CSRankings Faculty Submission Form
 * Client-side validation and GitHub Issue creation
 */

// Types
interface Institution {
    institution: string;
    region: string;
    countryabbrv: string;
    homepage?: string;
}

interface FacultyEntry {
    name: string;
    institution: string;
    homepage: string;
    scholarid: string;
    isOld?: boolean;      // true if from old/ folder
    oldFile?: string;     // which old/ file (industry, emeritus, etc.)
}

interface ValidationState {
    valid: boolean;
    message: string;
}

type ActionType = 'add' | 'update' | 'remove';

// Configuration
const GITHUB_REPO = 'emeryberger/CSrankings';
// Note: OAuth requires a server-side component for code exchange.
// We offer two submission methods:
// 1. Direct PR (requires user to provide a Personal Access Token)
// 2. Issue-based (GitHub Actions creates the PR)

// Abbreviation mappings for fuzzy institution search
const ABBREVIATION_MAP: Record<string, string[]> = {
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
const ACRONYM_MAP: Record<string, string[]> = {
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
    'uc': ['univ. of california', 'california -'],
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
    'ui': ['university of illinois'],
    'uiuc': ['illinois at urbana-champaign'],
    'uic': ['illinois at chicago'],
    'iit': ['illinois institute of technology'],

    // Texas
    'ut': ['university of texas', 'texas at'],
    'ut austin': ['texas at austin'],
    'utexas': ['texas at austin'],
    'uta': ['texas at arlington'],
    'utd': ['texas at dallas'],
    'utsa': ['texas at san antonio'],
    'utep': ['texas - el paso'],
    'tamu': ['texas a&m university'],
    'texas a&m': ['texas a&m'],

    // Other Big State Schools
    'um': ['university of michigan', 'university of minnesota', 'university of maryland', 'university of miami', 'university of montana', 'university of maine', 'university of memphis'],
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
    'uw': ['university of washington', 'wisconsin - madison'],
    'umn': ['university of minnesota'],
    'minnesota': ['university of minnesota'],
    'ufl': ['university of florida'],
    'uf': ['university of florida'],
    'fsu': ['florida state'],
    'ucf': ['central florida'],
    'fiu': ['florida international'],
    'usf': ['south florida'],
    'ug': ['university of georgia'],
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
    'ua': ['university of arizona', 'university of alabama'],
    'uo': ['university of oregon'],
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
    'uk': ['university of kentucky'],
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
    'uq': ['university of queensland'],
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
let institutions: Institution[] = [];
let institutionMap: Map<string, Institution> = new Map(); // name -> full data
let facultyEntries: FacultyEntry[] = [];
let dblpAliases: Map<string, string> = new Map(); // alias -> canonical name
let currentAction: ActionType = 'add';
let selectedEntry: FacultyEntry | null = null;

let validationState: Record<string, ValidationState> = {
    name: { valid: false, message: '' },
    institution: { valid: false, message: '' },
    homepage: { valid: false, message: '' },
    scholarid: { valid: false, message: '' }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

async function init(): Promise<void> {
    await Promise.all([
        loadInstitutions(),
        loadFacultyEntries(),
        loadDBLPAliases()
    ]);
    setupEventListeners();
    updateUIForAction('add');
    updateSubmitButton();
}

/**
 * Convert country code to flag emoji
 */
function countryCodeToFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '';
    const code = countryCode.toUpperCase();
    // Convert to regional indicator symbols (flag emoji)
    const firstChar = String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65);
    const secondChar = String.fromCodePoint(0x1F1E6 + code.charCodeAt(1) - 65);
    return firstChar + secondChar;
}

/**
 * Load institutions from CSV for autocomplete
 */
async function loadInstitutions(): Promise<void> {
    try {
        const response = await fetch('/institutions.csv');
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        institutions = (parsed.data as Institution[]).filter(row => row.institution);
        // Build lookup map
        for (const inst of institutions) {
            institutionMap.set(inst.institution, inst);
        }
        console.log(`Loaded ${institutions.length} institutions`);
    } catch (error) {
        console.error('Failed to load institutions:', error);
        showError('Failed to load institution list. Please refresh the page.');
    }
}

/**
 * Load existing faculty entries for name autocomplete
 */
async function loadFacultyEntries(): Promise<void> {
    try {
        // Load all csrankings-*.csv files
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const activeFiles = letters.map(l => `csrankings-${l}.csv`);

        // Also load old/ files for faculty who left (can be added back)
        const oldFiles = [
            'old/industry.csv',    // Moved to industry
            'old/emeritus.csv',    // Retired/emeritus
            'old/other.csv',       // Left for other reasons
            'old/research.csv',    // Research positions
            'old/rip.csv'          // Deceased (for historical reference)
        ];

        const allFiles = [...activeFiles, ...oldFiles];

        const responses = await Promise.all(
            allFiles.map(f => fetch(`/${f}`).then(r => r.ok ? r.text() : '').catch(() => ''))
        );

        facultyEntries = [];
        let activeCount = 0;
        let oldCount = 0;

        for (let i = 0; i < responses.length; i++) {
            const text = responses[i];
            const isOldFile = i >= activeFiles.length;

            if (text) {
                const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
                for (const row of parsed.data as string[][]) {
                    if (row.length >= 4 && row[0] !== 'name') {
                        // Trim all values to handle mixed line endings (CRLF vs LF)
                        facultyEntries.push({
                            name: row[0].trim(),
                            institution: row[1].trim(),
                            homepage: row[2].trim(),
                            scholarid: row[3].trim(),
                            isOld: isOldFile,
                            oldFile: isOldFile ? allFiles[i] : undefined
                        } as FacultyEntry);

                        if (isOldFile) {
                            oldCount++;
                        } else {
                            activeCount++;
                        }
                    }
                }
            }
        }
        console.log(`Loaded ${activeCount} active + ${oldCount} former faculty entries`);
    } catch (error) {
        console.error('Failed to load faculty entries:', error);
    }
}

/**
 * Load DBLP aliases for name lookup
 * Maps alternative names to canonical DBLP names
 */
async function loadDBLPAliases(): Promise<void> {
    try {
        const response = await fetch('/dblp-aliases.csv');
        if (!response.ok) return;
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        for (const row of parsed.data as Array<{alias: string; name: string}>) {
            if (row.alias && row.name) {
                dblpAliases.set(row.alias.toLowerCase().trim(), row.name.trim());
            }
        }
        console.log(`Loaded ${dblpAliases.size} DBLP aliases`);
    } catch (error) {
        console.error('Failed to load DBLP aliases:', error);
    }
}

/**
 * Check if a name has a DBLP alias (canonical name)
 */
function getCanonicalDBLPName(name: string): string | null {
    const normalized = name.toLowerCase().trim();
    return dblpAliases.get(normalized) || null;
}

/**
 * Setup all event listeners
 */
function setupEventListeners(): void {
    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const action = target.dataset.action as ActionType;
            setAction(action);
        });
    });

    // Name field - autocomplete and validation
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.addEventListener('input', debounce(handleNameInput, 200));
    nameInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions.bind(null, 'name'), 200);
        if (currentAction === 'add') {
            validateName();
        } else {
            // For update/remove: auto-select if name matches an existing entry
            validateNameForUpdateRemove();
        }
    });

    // Institution field - autocomplete and validate
    const institutionInput = document.getElementById('institution') as HTMLInputElement;
    institutionInput.addEventListener('input', handleInstitutionInput);
    institutionInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions.bind(null, 'institution'), 200);
        validateInstitution();
    });

    // Homepage field - validate URL format
    const homepageInput = document.getElementById('homepage') as HTMLInputElement;
    homepageInput.addEventListener('blur', validateHomepage);
    homepageInput.addEventListener('input', () => {
        clearFieldStatus('homepage');
        updatePreview();
    });

    // Scholar ID field - validate format
    const scholaridInput = document.getElementById('scholarid') as HTMLInputElement;
    scholaridInput.addEventListener('input', validateScholarId);

    // Eligibility checkboxes
    document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', updateSubmitButton);
    });

    // Removal reason
    const removalReason = document.getElementById('removal-reason') as HTMLSelectElement;
    removalReason.addEventListener('change', () => {
        const otherInput = document.getElementById('removal-reason-other') as HTMLInputElement;
        const companyGroup = document.getElementById('company-name-group') as HTMLElement;

        otherInput.style.display = removalReason.value === 'other' ? 'block' : 'none';
        companyGroup.style.display = removalReason.value === 'industry' ? 'block' : 'none';

        updateSubmitButton();
    });

    // Form submission
    const form = document.getElementById('submit-form') as HTMLFormElement;
    form.addEventListener('submit', handleSubmit);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
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
function setAction(action: ActionType): void {
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
function switchToUpdateWithEntry(entry: FacultyEntry): void {
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
    (document.getElementById('name') as HTMLInputElement).value = entry.name;
    (document.getElementById('institution') as HTMLInputElement).value = entry.institution;
    (document.getElementById('homepage') as HTMLInputElement).value = entry.homepage;
    (document.getElementById('scholarid') as HTMLInputElement).value = entry.scholarid;

    // Show current info with clickable links
    (document.getElementById('current-institution') as HTMLElement).textContent = entry.institution;
    (document.getElementById('current-homepage') as HTMLElement).innerHTML =
        `<a href="${escapeHtml(entry.homepage)}" target="_blank">${escapeHtml(entry.homepage)}</a>`;
    const scholarUrl = entry.scholarid === 'NOSCHOLARPAGE' ? '' :
        `https://scholar.google.com/citations?user=${encodeURIComponent(entry.scholarid)}`;
    (document.getElementById('current-scholarid') as HTMLElement).innerHTML = scholarUrl
        ? `<a href="${escapeHtml(scholarUrl)}" target="_blank">${escapeHtml(entry.scholarid)}</a>`
        : entry.scholarid;

    // Handle former faculty status indicator
    const currentInfo = document.getElementById('current-info') as HTMLElement;
    let statusIndicator = currentInfo.querySelector('.former-status');
    if (entry.isOld) {
        const label = getOldFileLabel(entry.oldFile);
        if (!statusIndicator) {
            statusIndicator = document.createElement('p');
            statusIndicator.className = 'former-status';
            currentInfo.insertBefore(statusIndicator, currentInfo.firstChild);
        }
        statusIndicator.innerHTML = `<span class="label label-warning">${label}</span> <em>Former faculty member</em>`;
    } else if (statusIndicator) {
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
function updateUIForAction(action: ActionType): void {
    // Guidelines
    const show = (id: string, visible: boolean) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? 'block' : 'none';
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
    const nameInput = document.getElementById('name') as HTMLInputElement;
    if (nameInput) {
        nameInput.placeholder = action === 'add'
            ? 'Enter name as it appears in DBLP'
            : 'Start typing to search existing entries...';
    }

    // Update required fields
    const institutionInput = document.getElementById('institution') as HTMLInputElement;
    const homepageInput = document.getElementById('homepage') as HTMLInputElement;
    const scholaridInput = document.getElementById('scholarid') as HTMLInputElement;

    institutionInput.required = action !== 'remove';
    homepageInput.required = action !== 'remove';
    scholaridInput.required = action !== 'remove';

    // Toggle required on eligibility checkboxes (only required for 'add' action)
    document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
        (cb as HTMLInputElement).required = action === 'add';
    });
}

/**
 * Reset form to initial state
 */
function resetForm(): void {
    selectedEntry = null;
    validationState = {
        name: { valid: false, message: '' },
        institution: { valid: false, message: '' },
        homepage: { valid: false, message: '' },
        scholarid: { valid: false, message: '' }
    };

    (document.getElementById('name') as HTMLInputElement).value = '';
    (document.getElementById('institution') as HTMLInputElement).value = '';
    (document.getElementById('homepage') as HTMLInputElement).value = '';
    (document.getElementById('scholarid') as HTMLInputElement).value = '';
    (document.getElementById('notes') as HTMLTextAreaElement).value = '';
    (document.getElementById('removal-reason') as HTMLSelectElement).value = '';

    document.querySelectorAll('#eligibility-section input[type="checkbox"]').forEach(cb => {
        (cb as HTMLInputElement).checked = false;
    });

    clearFieldStatus('name');
    clearFieldStatus('institution');
    clearFieldStatus('homepage');
    clearFieldStatus('scholarid');

    (document.getElementById('preview-group') as HTMLElement).style.display = 'none';
    (document.getElementById('current-info-group') as HTMLElement).style.display = 'none';

    updateSubmitButton();
}

/**
 * Handle name input - autocomplete for update/remove
 */
function handleNameInput(): void {
    const input = document.getElementById('name') as HTMLInputElement;
    const query = input.value.trim().toLowerCase();

    clearFieldStatus('name');

    if (query.length < 2) {
        hideSuggestions('name');
        return;
    }

    // For update/remove, search existing entries
    if (currentAction !== 'add') {
        const matches = facultyEntries.filter(entry =>
            entry.name.toLowerCase().includes(query)
        ).slice(0, 10);

        showNameSuggestions(matches);
    }

    updatePreview();
}

/**
 * Get a friendly label for old file type
 */
function getOldFileLabel(oldFile: string | undefined): string {
    if (!oldFile) return '';
    if (oldFile.includes('industry')) return 'Industry';
    if (oldFile.includes('emeritus')) return 'Emeritus';
    if (oldFile.includes('rip')) return 'Deceased';
    if (oldFile.includes('research')) return 'Research';
    if (oldFile.includes('other')) return 'Former';
    return 'Former';
}

/**
 * Show name autocomplete suggestions
 */
function showNameSuggestions(matches: FacultyEntry[]): void {
    const container = document.getElementById('name-suggestions') as HTMLElement;

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
            const name = (item as HTMLElement).dataset.name || '';
            selectFacultyEntry(name);
            hideSuggestions('name');
        });
    });
}

/**
 * Select a faculty entry (for update/remove)
 */
function selectFacultyEntry(name: string): void {
    const entry = facultyEntries.find(e => e.name === name);
    if (!entry) return;

    selectedEntry = entry;

    // Populate fields
    (document.getElementById('name') as HTMLInputElement).value = entry.name;

    if (currentAction === 'update') {
        (document.getElementById('institution') as HTMLInputElement).value = entry.institution;
        (document.getElementById('homepage') as HTMLInputElement).value = entry.homepage;
        (document.getElementById('scholarid') as HTMLInputElement).value = entry.scholarid;
    }

    // Show current info with status indicator for former faculty
    const currentInfoGroup = document.getElementById('current-info-group') as HTMLElement;
    const currentInfo = document.getElementById('current-info') as HTMLElement;

    (document.getElementById('current-institution') as HTMLElement).textContent = entry.institution;
    (document.getElementById('current-homepage') as HTMLElement).innerHTML =
        `<a href="${escapeHtml(entry.homepage)}" target="_blank">${escapeHtml(entry.homepage)}</a>`;
    const scholarUrl2 = entry.scholarid === 'NOSCHOLARPAGE' ? '' :
        `https://scholar.google.com/citations?user=${encodeURIComponent(entry.scholarid)}`;
    (document.getElementById('current-scholarid') as HTMLElement).innerHTML = scholarUrl2
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
    } else if (statusIndicator) {
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
function normalizeForFuzzyMatch(text: string): string {
    let normalized = text.toLowerCase();

    // Replace abbreviations with full forms for matching
    for (const [full, abbrevs] of Object.entries(ABBREVIATION_MAP)) {
        for (const abbrev of abbrevs) {
            // For abbreviations ending with period, use lookahead for word boundary
            // since \b doesn't work correctly after punctuation
            const escapedAbbrev = escapeRegex(abbrev);
            const regex = abbrev.endsWith('.')
                ? new RegExp(`\\b${escapedAbbrev}(?=\\s|$)`, 'gi')  // Period: followed by space or end
                : new RegExp(`\\b${escapedAbbrev}\\b`, 'gi');       // No period: normal word boundary
            normalized = normalized.replace(regex, full);
        }
    }

    return normalized;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if institution matches query with fuzzy abbreviation support
 */
function institutionMatchesFuzzy(institution: string, query: string): boolean {
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

/**
 * Handle institution input - show autocomplete suggestions
 */
function handleInstitutionInput(): void {
    const input = document.getElementById('institution') as HTMLInputElement;
    const query = input.value.trim();

    clearFieldStatus('institution');

    if (query.length < 2) {
        hideSuggestions('institution');
        return;
    }

    // Filter matching institutions with fuzzy abbreviation support
    const matches = institutions.filter(inst =>
        institutionMatchesFuzzy(inst.institution, query)
    ).slice(0, 10);

    showInstitutionSuggestions(matches);
    updatePreview();
}

/**
 * Show institution autocomplete suggestions with country flags
 */
function showInstitutionSuggestions(matches: Institution[]): void {
    const container = document.getElementById('institution-suggestions') as HTMLElement;

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
            const value = (item as HTMLElement).dataset.value || '';
            (document.getElementById('institution') as HTMLInputElement).value = value;
            hideSuggestions('institution');
            validateInstitution();
            updatePreview();
        });
    });
}

/**
 * Hide autocomplete suggestions
 */
function hideSuggestions(field: 'name' | 'institution'): void {
    const container = document.getElementById(`${field}-suggestions`) as HTMLElement;
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Translate name to DBLP URL format
 */
function translateNameToDBLP(name: string): string {
    // Remove periods
    let cleanName = name.replace(/\./g, '');

    const parts = cleanName.split(/\s+/);
    if (parts.length === 0) return '';

    // Check for disambiguation number at end (e.g., "0001")
    let disambiguation = '';
    if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
        disambiguation = parts.pop()!;
    }

    if (parts.length === 0) return '';

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
async function checkDBLPName(name: string): Promise<{found: boolean; exactMatch: boolean; suggestions: string[]; error?: string}> {
    const result = { found: false, exactMatch: false, suggestions: [] as string[], error: undefined as string | undefined };

    try {
        const authorQuery = translateNameToDBLP(name);
        if (!authorQuery) {
            result.error = 'Could not parse name';
            return result;
        }

        // Use DBLP author search API
        // Format: author:FirstName_LastName: (URL encoded)
        const url = `https://dblp.org/search/author/api?q=author%3A${encodeURIComponent(authorQuery)}%3A&format=json&c=10`;

        const response = await fetch(url);

        if (response.status === 429) {
            result.error = 'DBLP rate limited - try again later';
            return result;
        }

        if (!response.ok) {
            result.error = `DBLP returned ${response.status}`;
            return result;
        }

        const data = await response.json();
        const total = parseInt(data?.result?.completions?.['@total'] || '0', 10);

        if (total > 0) {
            result.found = true;
            const hits = data?.result?.hits?.hit || [];

            for (const hit of hits.slice(0, 5)) {
                const author = hit?.info?.author || '';
                if (author) {
                    result.suggestions.push(author);
                    if (author.toLowerCase() === name.toLowerCase()) {
                        result.exactMatch = true;
                    }
                }
            }
        }
    } catch (e: any) {
        result.error = e.message || 'DBLP check failed';
    }

    return result;
}

/**
 * Validate name field
 */
function validateName(): void {
    const name = (document.getElementById('name') as HTMLInputElement).value.trim();

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
        const existingEntry = facultyEntries.find(e =>
            e.name.toLowerCase() === name.toLowerCase()
        );
        if (existingEntry) {
            // Auto-switch to update mode and populate fields
            switchToUpdateWithEntry(existingEntry);
            return;
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
function validateNameForUpdateRemove(): void {
    const name = (document.getElementById('name') as HTMLInputElement).value.trim();

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
    const exactMatch = facultyEntries.find(e =>
        e.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch) {
        // Auto-select the matching entry
        selectFacultyEntry(exactMatch.name);
    } else {
        // Check for close matches to provide helpful message
        const closeMatches = facultyEntries.filter(e =>
            e.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(e.name.toLowerCase())
        ).slice(0, 3);

        if (closeMatches.length > 0) {
            const suggestions = closeMatches.map(e => `"${e.name}"`).join(', ');
            setFieldStatus('name', 'error', `Name not found. Did you mean: ${suggestions}?`);
        } else {
            setFieldStatus('name', 'error', 'Name not found in CSRankings. Use the dropdown to select an existing entry.');
        }
    }
}

/**
 * Async DBLP name check with debouncing
 */
let dblpCheckTimeout: number | undefined;
async function checkDBLPNameAsync(name: string): Promise<void> {
    // Debounce DBLP checks
    if (dblpCheckTimeout) {
        clearTimeout(dblpCheckTimeout);
    }

    dblpCheckTimeout = window.setTimeout(async () => {
        const result = await checkDBLPName(name);

        // Make sure the name hasn't changed while we were checking
        const currentName = (document.getElementById('name') as HTMLInputElement).value.trim();
        if (currentName !== name) return;

        if (result.error) {
            setFieldStatus('name', 'warning', `DBLP check failed: ${result.error}`);
        } else if (!result.found) {
            // Check if this name is a known alias
            const canonicalName = getCanonicalDBLPName(name);
            if (canonicalName) {
                setFieldStatus('name', 'warning',
                    `This name is an alias. Use the canonical DBLP name: <strong>${canonicalName}</strong>`);
            } else {
                setFieldStatus('name', 'error',
                    `Name not found in DBLP. Check <a href="https://dblp.org/search?q=${encodeURIComponent(name)}" target="_blank">DBLP</a> for exact spelling.`);
            }
        } else if (!result.exactMatch && result.suggestions.length > 0) {
            const suggestions = result.suggestions.slice(0, 3).map(s => `"${s}"`).join(', ');
            setFieldStatus('name', 'warning', `Not exact match. Did you mean: ${suggestions}?`);
        } else {
            setFieldStatus('name', 'valid', 'Found in DBLP');
        }

        updatePreview();
    }, 500);
}

/**
 * Validate institution field
 */
function validateInstitution(): void {
    if (currentAction === 'remove') {
        validationState.institution = { valid: true, message: '' };
        updateSubmitButton();
        return;
    }

    const institution = (document.getElementById('institution') as HTMLInputElement).value.trim();

    if (!institution) {
        setFieldStatus('institution', 'error', 'Institution is required');
        return;
    }

    // Check if institution exists
    const exists = institutions.some(inst =>
        inst.institution.toLowerCase() === institution.toLowerCase()
    );

    if (exists) {
        // Find exact casing
        const exactInst = institutions.find(inst =>
            inst.institution.toLowerCase() === institution.toLowerCase()
        );
        if (exactInst) {
            (document.getElementById('institution') as HTMLInputElement).value = exactInst.institution;
        }
        setFieldStatus('institution', 'valid', 'Institution found');
    } else {
        setFieldStatus('institution', 'error',
            'Institution not in CSRankings. <a href="https://github.com/emeryberger/CSrankings/issues/new?template=new-institution.md" target="_blank">Request it first</a>.');
    }

    updatePreview();
}

/**
 * Validate homepage URL
 */
function validateHomepage(): void {
    const testLink = document.getElementById('test-homepage-link') as HTMLAnchorElement;

    if (currentAction === 'remove') {
        validationState.homepage = { valid: true, message: '' };
        testLink.style.display = 'none';
        updateSubmitButton();
        return;
    }

    const homepage = (document.getElementById('homepage') as HTMLInputElement).value.trim();

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

    } catch (e) {
        setFieldStatus('homepage', 'error', 'Invalid URL format');
        testLink.style.display = 'none';
        return;
    }
}

/**
 * Async homepage check with debouncing
 */
let homepageCheckTimeout: number | undefined;
async function checkHomepageAsync(homepage: string): Promise<void> {
    // Debounce checks
    if (homepageCheckTimeout) {
        clearTimeout(homepageCheckTimeout);
    }

    homepageCheckTimeout = window.setTimeout(async () => {
        const name = (document.getElementById('name') as HTMLInputElement).value.trim();
        const institution = (document.getElementById('institution') as HTMLInputElement).value.trim();

        // Make sure the homepage hasn't changed while we were waiting
        const currentHomepage = (document.getElementById('homepage') as HTMLInputElement).value.trim();
        if (currentHomepage !== homepage) return;

        // Check for social media / non-academic URLs
        const url = new URL(homepage);
        const socialDomains = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com',
                               'github.com', 'medium.com', 'substack.com', 'youtube.com'];
        if (socialDomains.some(d => url.hostname.includes(d))) {
            setFieldStatus('homepage', 'error',
                'Use official academic/institutional page, not social media');
            updatePreview();
            return;
        }

        try {
            // Try to fetch the homepage (may fail due to CORS)
            const response = await fetch(homepage, {
                method: 'GET',
                mode: 'cors',
                headers: { 'Accept': 'text/html' }
            });

            if (!response.ok) {
                setFieldStatus('homepage', 'error', `Page returned HTTP ${response.status}`);
                updatePreview();
                return;
            }

            const text = await response.text();
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

            // Build status message
            if (nameFound && instFound) {
                setFieldStatus('homepage', 'valid', 'Page accessible, name & institution found');
            } else if (nameFound && hasAcademicContent) {
                setFieldStatus('homepage', 'valid', 'Page accessible, name found on academic page');
            } else if (lastNameFound && hasAcademicContent) {
                setFieldStatus('homepage', 'warning', 'Page accessible, last name found - verify full name');
            } else if (nameFound) {
                setFieldStatus('homepage', 'warning', 'Page accessible, but verify it\'s the correct person');
            } else if (hasAcademicContent) {
                setFieldStatus('homepage', 'warning', 'Academic page found, but name not detected');
            } else {
                setFieldStatus('homepage', 'warning', 'Page accessible, verify it shows faculty info');
            }

        } catch (e) {
            // CORS error or network failure - can't verify from browser
            // This is common and not necessarily an error
            setFieldStatus('homepage', 'valid', 'URL format valid. Will be verified during review.');
        }

        updatePreview();
    }, 500);
}

/**
 * Validate Google Scholar ID format
 */
function validateScholarId(): void {
    if (currentAction === 'remove') {
        validationState.scholarid = { valid: true, message: '' };
        updateSubmitButton();
        return;
    }

    const scholarid = (document.getElementById('scholarid') as HTMLInputElement).value.trim();

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
        setFieldStatus('scholarid', 'error',
            'Must be exactly 12 characters ending in C or J, or NOSCHOLARPAGE');
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
function checkScholarIdAsync(scholarid: string): void {
    // Google Scholar has no free API - just provide link for manual check
    const scholarUrl = `https://scholar.google.com/citations?user=${scholarid}`;
    setFieldStatus('scholarid', 'valid',
        `Format valid. <a href="${scholarUrl}" target="_blank">Verify profile ↗</a>`);
}

/**
 * Update field status display
 */
function setFieldStatus(field: string, status: 'valid' | 'error' | 'warning', message: string): void {
    const group = document.getElementById(`${field}-group`);
    const statusEl = document.getElementById(`${field}-status`);

    if (!group || !statusEl) return;

    // Update validation state
    validationState[field] = { valid: status === 'valid' || status === 'warning', message };

    // Update UI
    group.classList.remove('has-success', 'has-error', 'has-warning');

    if (status === 'valid') {
        group.classList.add('has-success');
        statusEl.innerHTML = `<span class="text-success">&#10003; ${message}</span>`;
    } else if (status === 'error') {
        group.classList.add('has-error');
        statusEl.innerHTML = `<span class="text-danger">&#10007; ${message}</span>`;
    } else if (status === 'warning') {
        group.classList.add('has-warning');
        statusEl.innerHTML = `<span class="text-warning">&#9888; ${message}</span>`;
    }

    updateSubmitButton();
}

/**
 * Clear field status
 */
function clearFieldStatus(field: string): void {
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
function updateSubmitButton(): void {
    let canSubmit = false;
    const submitText = document.getElementById('submit-text');

    switch (currentAction) {
        case 'add':
            // All fields valid + all checkboxes checked
            const fieldsValid = Object.values(validationState).every((v: ValidationState) => v.valid);
            const checkboxes = document.querySelectorAll('#eligibility-section input[type="checkbox"][required]');
            const allChecked = Array.from(checkboxes).every(cb => (cb as HTMLInputElement).checked);
            canSubmit = fieldsValid && allChecked;
            if (submitText) submitText.textContent = 'Submit New Entry';
            break;

        case 'update':
            // Selected entry + all fields valid
            canSubmit = selectedEntry !== null && Object.values(validationState).every((v: ValidationState) => v.valid);
            // Update button text based on whether this is a reinstatement
            if (submitText) {
                submitText.textContent = selectedEntry?.isOld
                    ? 'Submit Reinstatement'
                    : 'Submit Update';
            }
            break;

        case 'remove':
            // Selected entry + reason selected
            const reasonSelected = (document.getElementById('removal-reason') as HTMLSelectElement).value !== '';
            canSubmit = selectedEntry !== null && validationState.name.valid && reasonSelected;
            if (submitText) submitText.textContent = 'Submit Removal';
            break;
    }

    (document.getElementById('submit-btn') as HTMLButtonElement).disabled = !canSubmit;
}

/**
 * Update CSV preview
 */
function updatePreview(): void {
    const name = (document.getElementById('name') as HTMLInputElement).value.trim();
    const institution = (document.getElementById('institution') as HTMLInputElement).value.trim();
    const homepage = (document.getElementById('homepage') as HTMLInputElement).value.trim();
    const scholarid = (document.getElementById('scholarid') as HTMLInputElement).value.trim();

    const previewGroup = document.getElementById('preview-group') as HTMLElement;

    if (currentAction === 'remove') {
        if (selectedEntry) {
            (document.getElementById('csv-preview') as HTMLElement).textContent =
                `${selectedEntry.name},${selectedEntry.institution},${selectedEntry.homepage},${selectedEntry.scholarid}`;
            previewGroup.style.display = 'block';
        } else {
            previewGroup.style.display = 'none';
        }
        return;
    }

    if (name && institution && homepage && scholarid) {
        const csvLine = `${name},${institution},${homepage},${scholarid}`;
        (document.getElementById('csv-preview') as HTMLElement).textContent = csvLine;

        // Determine target file
        const firstLetter = name.charAt(0).toLowerCase();
        const targetFile = /[a-z]/.test(firstLetter)
            ? `csrankings-${firstLetter}.csv`
            : 'csrankings-0.csv';

        const targetFileEl = document.getElementById('target-file');
        const targetFileUpdateEl = document.getElementById('target-file-update');
        if (targetFileEl) targetFileEl.textContent = targetFile;
        if (targetFileUpdateEl) targetFileUpdateEl.textContent = targetFile;

        previewGroup.style.display = 'block';
    } else {
        previewGroup.style.display = 'none';
    }
}

/**
 * Handle form submission
 */
function handleSubmit(e: Event): void {
    e.preventDefault();

    const name = (document.getElementById('name') as HTMLInputElement).value.trim();
    const institution = (document.getElementById('institution') as HTMLInputElement).value.trim();
    const homepage = (document.getElementById('homepage') as HTMLInputElement).value.trim();
    const scholarid = (document.getElementById('scholarid') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('notes') as HTMLTextAreaElement).value.trim();

    // Build submission data
    const entry: FacultyEntry = { name, institution, homepage, scholarid };
    let issueUrl: string;

    switch (currentAction) {
        case 'add':
            issueUrl = createAddIssueUrl(entry, notes);
            break;
        case 'update':
            issueUrl = createUpdateIssueUrl(selectedEntry!, entry, notes);
            break;
        case 'remove':
            const reason = (document.getElementById('removal-reason') as HTMLSelectElement).value;
            const reasonOther = (document.getElementById('removal-reason-other') as HTMLInputElement).value;
            const companyName = (document.getElementById('company-name') as HTMLInputElement)?.value.trim() || '';
            const fullReason = reason === 'other' ? reasonOther :
                               reason === 'industry' && companyName ? `${reason} (${companyName})` : reason;
            issueUrl = createRemoveIssueUrl(selectedEntry!, fullReason, notes);
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
function createAddIssueUrl(data: FacultyEntry, notes: string): string {
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
function createUpdateIssueUrl(oldEntry: FacultyEntry, newEntry: FacultyEntry, notes: string): string {
    // Check if this is a reinstatement (from old/ folder back to active)
    const isReinstatement = oldEntry.isOld === true;
    const oldFileLabel = oldEntry.oldFile ? getOldFileLabel(oldEntry.oldFile) : '';

    const title = isReinstatement
        ? `[CSrankings form submission] Reinstate ${newEntry.name} (${newEntry.institution})`
        : `[CSrankings form submission] Update ${newEntry.name}`;

    const changes: string[] = [];
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
function createRemoveIssueUrl(entry: FacultyEntry, reason: string, notes: string): string {
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
function showError(message: string): void {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.innerHTML = `<strong>Error:</strong> ${message}`;
    document.querySelector('.container')?.prepend(alert);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Utility: Debounce function
 */
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timeout: number;
    return ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    }) as T;
}




/**
 * Show progress indicator
 */
function showProgress(message: string): void {
    let progressDiv = document.getElementById('progress-indicator');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'progress-indicator';
        progressDiv.className = 'alert alert-info';
        document.querySelector('.container')?.prepend(progressDiv);
    }
    progressDiv.innerHTML = `<span class="spinning">&#8635;</span> ${message}`;
    progressDiv.style.display = 'block';
}

/**
 * Hide progress indicator
 */
function hideProgress(): void {
    const progressDiv = document.getElementById('progress-indicator');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

/**
 * Show success message
 */
function showSuccess(message: string): void {
    const existingAlerts = document.querySelectorAll('.alert-success');
    existingAlerts.forEach(el => el.remove());

    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `<strong>Success!</strong> ${message}`;
    document.querySelector('.container')?.prepend(alert);

    // Auto-dismiss after 5 seconds
    setTimeout(() => alert.remove(), 5000);
}

// Declare external dependencies
declare const Papa: {
    parse(text: string, config: { header: boolean; skipEmptyLines: boolean }): {
        data: any[];
    };
};

declare function ga(command: string, ...args: any[]): void;
