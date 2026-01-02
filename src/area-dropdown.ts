/*
  CSRankings - Area Dropdown Module

  Provides expandable dropdown panels for area category indicators.
  Each category (AI, Systems, Theory, Interdisciplinary) expands to show
  its parent areas, each of which can be expanded to show child conferences.
*/

namespace CSRankings {

    interface AreaInfo {
        id: string;
        label: string;
    }

    // Map category to parent areas with display labels
    const categoryAreas: { [key: string]: AreaInfo[] } = {
        'ai': [
            { id: 'ai', label: 'Artificial Intelligence' },
            { id: 'vision', label: 'Computer Vision' },
            { id: 'mlmining', label: 'Machine Learning' },
            { id: 'nlp', label: 'Natural Language Processing' },
            { id: 'inforet', label: 'Web & IR' }
        ],
        'systems': [
            { id: 'arch', label: 'Architecture' },
            { id: 'comm', label: 'Networks' },
            { id: 'sec', label: 'Security' },
            { id: 'mod', label: 'Databases' },
            { id: 'da', label: 'Design Automation' },
            { id: 'bed', label: 'Embedded Systems' },
            { id: 'hpc', label: 'High-Perf Computing' },
            { id: 'mobile', label: 'Mobile Computing' },
            { id: 'metrics', label: 'Measurement' },
            { id: 'ops', label: 'Operating Systems' },
            { id: 'plan', label: 'Programming Languages' },
            { id: 'soft', label: 'Software Engineering' }
        ],
        'theory': [
            { id: 'act', label: 'Algorithms & Complexity' },
            { id: 'crypt', label: 'Cryptography' },
            { id: 'log', label: 'Logic & Verification' }
        ],
        'interdisciplinary': [
            { id: 'bio', label: 'Comp. Biology' },
            { id: 'graph', label: 'Graphics' },
            { id: 'csed', label: 'CS Education' },
            { id: 'ecom', label: 'Economics' },
            { id: 'chi', label: 'HCI' },
            { id: 'robotics', label: 'Robotics' },
            { id: 'visualization', label: 'Visualization' }
        ]
    };

    // Conference display names (uppercase versions)
    const conferenceNames: { [key: string]: string } = {
        'aaai': 'AAAI', 'ijcai': 'IJCAI',
        'cvpr': 'CVPR', 'eccv': 'ECCV', 'iccv': 'ICCV',
        'icml': 'ICML', 'iclr': 'ICLR', 'kdd': 'KDD', 'nips': 'NeurIPS',
        'acl': 'ACL', 'emnlp': 'EMNLP', 'naacl': 'NAACL',
        'sigir': 'SIGIR', 'www': 'WWW',
        'asplos': 'ASPLOS', 'isca': 'ISCA', 'micro': 'MICRO', 'hpca': 'HPCA',
        'sigcomm': 'SIGCOMM', 'nsdi': 'NSDI',
        'ccs': 'CCS', 'oakland': 'S&P', 'usenixsec': 'USENIX Sec', 'ndss': 'NDSS', 'pets': 'PETS',
        'sigmod': 'SIGMOD', 'vldb': 'VLDB', 'icde': 'ICDE', 'pods': 'PODS',
        'dac': 'DAC', 'iccad': 'ICCAD',
        'emsoft': 'EMSOFT', 'rtas': 'RTAS', 'rtss': 'RTSS',
        'sc': 'SC', 'hpdc': 'HPDC', 'ics': 'ICS',
        'mobicom': 'MobiCom', 'mobisys': 'MobiSys', 'sensys': 'SenSys',
        'imc': 'IMC', 'sigmetrics': 'SIGMETRICS',
        'sosp': 'SOSP', 'osdi': 'OSDI', 'eurosys': 'EuroSys', 'fast': 'FAST', 'usenixatc': 'USENIX ATC',
        'popl': 'POPL', 'pldi': 'PLDI', 'oopsla': 'OOPSLA', 'icfp': 'ICFP',
        'fse': 'FSE', 'icse': 'ICSE', 'ase': 'ASE', 'issta': 'ISSTA',
        'focs': 'FOCS', 'soda': 'SODA', 'stoc': 'STOC',
        'crypto': 'CRYPTO', 'eurocrypt': 'EUROCRYPT',
        'cav': 'CAV', 'lics': 'LICS',
        'siggraph': 'SIGGRAPH', 'siggraph-asia': 'SIGGRAPH Asia', 'eurographics': 'Eurographics',
        'chiconf': 'CHI', 'ubicomp': 'UbiComp', 'uist': 'UIST',
        'icra': 'ICRA', 'iros': 'IROS', 'rss': 'RSS',
        'ismb': 'ISMB', 'recomb': 'RECOMB',
        'vis': 'VIS', 'vr': 'IEEE VR',
        'ec': 'EC', 'wine': 'WINE',
        'sigcse': 'SIGCSE'
    };

    let activeDropdown: string | null = null;
    let expandedAreas: Set<string> = new Set();
    let isUpdatingCheckbox: boolean = false;
    let dropdownJustOpened: boolean = false;

    /**
     * Get child conferences for a parent area
     */
    function getChildConferences(parentId: string): string[] {
        return childMap[parentId] || [];
    }

    /**
     * Check if an area/conference checkbox is currently checked
     */
    function isAreaChecked(areaId: string): boolean {
        const checkbox = document.getElementById(areaId) as HTMLInputElement;
        return checkbox ? checkbox.checked : false;
    }

    /**
     * Toggle an area checkbox and trigger ranking update
     */
    function toggleArea(areaId: string, checked: boolean): void {
        const checkbox = document.getElementById(areaId) as HTMLInputElement;
        if (checkbox && checkbox.checked !== checked) {
            isUpdatingCheckbox = true;
            checkbox.click();
            // Reset flag after a short delay to allow event to process
            setTimeout(() => { isUpdatingCheckbox = false; }, 50);
        }
    }

    /**
     * Create the dropdown panel HTML for a category
     */
    function createDropdownPanel(category: string): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'area-dropdown-panel';
        panel.id = `area-dropdown-${category}`;

        const areas = categoryAreas[category] || [];
        const categoryLabels: { [key: string]: string } = {
            'ai': 'AI',
            'systems': 'Systems',
            'theory': 'Theory',
            'interdisciplinary': 'Interdisciplinary'
        };

        // Check if all areas in this category are checked
        const allChecked = areas.every(a => isAreaChecked(a.id));

        let html = '<div class="area-dropdown-content">';

        // Add "All" toggle at top
        html += `
            <div class="area-dropdown-item area-all-toggle">
                <label>
                    <input type="checkbox" class="area-dropdown-checkbox all-checkbox" data-category="${category}" ${allChecked ? 'checked' : ''}>
                    <span><strong>All ${categoryLabels[category]}</strong></span>
                </label>
            </div>
            <div class="area-dropdown-divider"></div>
        `;

        for (const area of areas) {
            const parentChecked = isAreaChecked(area.id);
            const children = getChildConferences(area.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedAreas.has(area.id);

            html += `
                <div class="area-dropdown-item area-parent" data-area="${area.id}">
                    <div class="area-parent-row">
                        ${hasChildren ? `<span class="area-expand-icon ${isExpanded ? 'expanded' : ''}" data-parent="${area.id}">&#9658;</span>` : '<span class="area-expand-spacer"></span>'}
                        <label>
                            <input type="checkbox" class="area-dropdown-checkbox parent-checkbox" data-area="${area.id}" ${parentChecked ? 'checked' : ''}>
                            <span>${area.label}</span>
                        </label>
                    </div>
            `;

            if (hasChildren) {
                // Separate top-tier and next-tier conferences
                const topTierChildren = children.filter(id => !nextTier[id]);
                const nextTierChildren = children.filter(id => nextTier[id]);

                html += `<div class="area-children ${isExpanded ? 'expanded' : ''}" data-parent="${area.id}">`;

                // Top-tier conferences first
                for (const childId of topTierChildren) {
                    const childChecked = isAreaChecked(childId);
                    const confName = conferenceNames[childId] || childId.toUpperCase();
                    html += `
                        <div class="area-dropdown-item area-child">
                            <label>
                                <input type="checkbox" class="area-dropdown-checkbox child-checkbox" data-area="${childId}" data-parent="${area.id}" ${childChecked ? 'checked' : ''}>
                                <span>${confName}</span>
                            </label>
                        </div>
                    `;
                }

                // Divider and next-tier conferences (if any)
                if (nextTierChildren.length > 0) {
                    html += '<div class="area-child-divider"></div>';
                    for (const childId of nextTierChildren) {
                        const childChecked = isAreaChecked(childId);
                        const confName = conferenceNames[childId] || childId.toUpperCase();
                        html += `
                            <div class="area-dropdown-item area-child next-tier">
                                <label>
                                    <input type="checkbox" class="area-dropdown-checkbox child-checkbox" data-area="${childId}" data-parent="${area.id}" ${childChecked ? 'checked' : ''}>
                                    <span>${confName}</span>
                                </label>
                            </div>
                        `;
                    }
                }

                html += '</div>';
            }

            html += '</div>';
        }

        html += '</div>';
        panel.innerHTML = html;

        return panel;
    }

    /**
     * Toggle expand/collapse of child conferences
     */
    function toggleExpand(parentId: string): void {
        const isExpanded = expandedAreas.has(parentId);
        if (isExpanded) {
            expandedAreas.delete(parentId);
        } else {
            expandedAreas.add(parentId);
        }

        // Update UI
        document.querySelectorAll(`.area-expand-icon[data-parent="${parentId}"]`).forEach(icon => {
            icon.classList.toggle('expanded', !isExpanded);
        });
        document.querySelectorAll(`.area-children[data-parent="${parentId}"]`).forEach(container => {
            container.classList.toggle('expanded', !isExpanded);
        });
    }

    /**
     * Sync dropdown checkbox states from main checkboxes
     */
    function syncDropdownFromMain(category: string): void {
        const panel = document.getElementById(`area-dropdown-${category}`);
        if (!panel) return;

        const areas = categoryAreas[category] || [];

        // Sync "All" checkbox
        const allCheckbox = panel.querySelector('.all-checkbox') as HTMLInputElement;
        if (allCheckbox) {
            allCheckbox.checked = areas.every(a => isAreaChecked(a.id));
        }

        for (const area of areas) {
            // Sync parent checkbox
            const parentCheckbox = panel.querySelector(`[data-area="${area.id}"].parent-checkbox`) as HTMLInputElement;
            if (parentCheckbox) {
                parentCheckbox.checked = isAreaChecked(area.id);
            }

            // Sync child checkboxes
            const children = getChildConferences(area.id);
            for (const childId of children) {
                const childCheckbox = panel.querySelector(`[data-area="${childId}"].child-checkbox`) as HTMLInputElement;
                if (childCheckbox) {
                    childCheckbox.checked = isAreaChecked(childId);
                }
            }
        }
    }

    /**
     * Toggle dropdown visibility
     */
    function toggleDropdown(category: string): void {
        const indicator = document.querySelector(`.area-indicator[data-area="${category}"]`);
        if (!indicator) return;

        // Close any open dropdown
        if (activeDropdown && activeDropdown !== category) {
            closeDropdown(activeDropdown);
        }

        let panel = document.getElementById(`area-dropdown-${category}`);

        if (panel && panel.classList.contains('open')) {
            closeDropdown(category);
        } else {
            // Create panel if it doesn't exist
            if (!panel) {
                panel = createDropdownPanel(category);
                indicator.parentElement!.appendChild(panel);
                attachDropdownListeners(category, panel);
            } else {
                // Sync state before opening
                syncDropdownFromMain(category);
            }

            // Open
            panel.classList.add('open');
            indicator.classList.add('active');
            activeDropdown = category;
            // Prevent immediate close on touch devices
            dropdownJustOpened = true;
            setTimeout(() => { dropdownJustOpened = false; }, 100);
        }
    }

    /**
     * Close a dropdown
     */
    function closeDropdown(category: string): void {
        const panel = document.getElementById(`area-dropdown-${category}`);
        const indicator = document.querySelector(`.area-indicator[data-area="${category}"]`);

        if (panel) {
            panel.classList.remove('open');
        }
        if (indicator) {
            indicator.classList.remove('active');
        }
        if (activeDropdown === category) {
            activeDropdown = null;
        }
    }

    /**
     * Attach event listeners to dropdown elements
     */
    function attachDropdownListeners(category: string, panel: HTMLElement): void {
        // Expand/collapse icons
        panel.querySelectorAll('.area-expand-icon').forEach(icon => {
            const handleExpand = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                const parentId = (icon as HTMLElement).dataset.parent!;
                toggleExpand(parentId);
            };
            icon.addEventListener('click', handleExpand);
            icon.addEventListener('touchend', handleExpand);
        });

        // "All" checkbox for category
        const allCheckbox = panel.querySelector('.all-checkbox') as HTMLInputElement;
        if (allCheckbox) {
            allCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const input = e.target as HTMLInputElement;
                const checked = input.checked;
                const areas = categoryAreas[category] || [];

                // Toggle all parent areas in this category
                for (const area of areas) {
                    toggleArea(area.id, checked);
                }

                // Sync all checkboxes in dropdown
                setTimeout(() => {
                    syncDropdownFromMain(category);
                    updateIndicatorState(category);
                }, 10);
            });
        }

        // Parent checkboxes
        panel.querySelectorAll('.parent-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const input = e.target as HTMLInputElement;
                const areaId = input.dataset.area!;
                toggleArea(areaId, input.checked);

                // Sync all checkboxes in dropdown to match main state
                setTimeout(() => {
                    syncDropdownFromMain(category);
                    updateIndicatorState(category);
                }, 10);
            });
        });

        // Child checkboxes
        panel.querySelectorAll('.child-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const input = e.target as HTMLInputElement;
                const areaId = input.dataset.area!;
                const parentId = input.dataset.parent!;
                toggleArea(areaId, input.checked);

                // Sync all checkboxes in dropdown to match main state
                setTimeout(() => {
                    syncDropdownFromMain(category);
                    updateIndicatorState(category);
                }, 10);
            });
        });
    }

    /**
     * Update indicator opacity based on selection state
     */
    function updateIndicatorState(category: string): void {
        const indicator = document.querySelector(`.area-indicator[data-area="${category}"]`);
        if (!indicator) return;

        const areas = categoryAreas[category] || [];
        const checkedCount = areas.filter(a => isAreaChecked(a.id)).length;

        indicator.classList.remove('selection-none', 'selection-partial', 'selection-all');

        if (checkedCount === 0) {
            indicator.classList.add('selection-none');
        } else if (checkedCount === areas.length) {
            indicator.classList.add('selection-all');
        } else {
            indicator.classList.add('selection-partial');
        }
    }

    /**
     * Initialize area dropdowns
     */
    export function initAreaDropdowns(): void {
        // Attach click/touch handlers to indicators
        document.querySelectorAll('.area-indicator').forEach(indicator => {
            // Use both click and touchend for better iPad support
            const handleActivate = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                const category = (indicator as HTMLElement).dataset.area!;
                toggleDropdown(category);
            };

            indicator.addEventListener('click', handleActivate);
            // For iPad Safari: touchend provides more reliable activation
            indicator.addEventListener('touchend', handleActivate);
        });

        // Close dropdown when clicking/touching outside
        const closeHandler = (e: Event) => {
            if (activeDropdown && !isUpdatingCheckbox && !dropdownJustOpened) {
                const target = e.target as HTMLElement;
                if (!target.closest('.area-indicators') && !target.closest('.area-dropdown-panel')) {
                    closeDropdown(activeDropdown);
                }
            }
        };

        document.addEventListener('click', closeHandler);
        document.addEventListener('touchend', closeHandler);

        // Initialize indicator states
        ['ai', 'systems', 'theory', 'interdisciplinary'].forEach(updateIndicatorState);

        // Listen for changes to main checkboxes to sync dropdowns
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('click', () => {
                setTimeout(() => {
                    ['ai', 'systems', 'theory', 'interdisciplinary'].forEach(cat => {
                        updateIndicatorState(cat);
                        if (activeDropdown === cat) {
                            syncDropdownFromMain(cat);
                        }
                    });
                }, 10);
            });
        });
    }

}
