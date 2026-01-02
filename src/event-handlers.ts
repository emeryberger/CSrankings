/*
  CSRankings - Event Handlers

  DOM event listener setup for dropdowns, checkboxes, and buttons.
*/

namespace CSRankings {

    /* Interface for event handler callbacks */
    export interface EventCallbacks {
        invalidateIncrementalCache: () => void;
        invalidateCheckboxCache: () => void;
        recomputeAuthorAreas: () => void;
        rank: (updateURL?: boolean) => void;
        toggleConferences: (area: string) => void;
        activateAll: () => void;
        activateNone: () => void;
        activateAI: () => void;
        deactivateAI: () => void;
        activateSystems: () => void;
        deactivateSystems: () => void;
        activateTheory: () => void;
        deactivateTheory: () => void;
        activateOthers: () => void;
        deactivateOthers: () => void;
    }

    /* Add event listeners for dropdown changes */
    export function addDropdownListeners(callbacks: EventCallbacks): void {
        // Note: year selects are now hidden and managed by the year slider (year-slider.ts)
        // Only add listener for regions dropdown
        const regionsWidget = document.getElementById("regions");
        regionsWidget!.addEventListener("change", () => {
            // Region change invalidates the incremental cache
            callbacks.invalidateIncrementalCache();
            callbacks.recomputeAuthorAreas();
            callbacks.rank();
            // Track user interaction for sponsorship
            recordUserInteraction();
        });
        // Chart type doesn't affect data, just visualization
        const charttypeWidget = document.getElementById("charttype");
        charttypeWidget!.addEventListener("change", () => { callbacks.rank(); });
    }

    /* Add event listeners for area widget toggles (conference expansion) */
    export function addAreaWidgetListeners(callbacks: EventCallbacks): void {
        for (let position = 0; position < areas.length; position++) {
            let area = areas[position];
            if (!(area in parentMap)) {
                // Not a child.
                const widget = document.getElementById(`${area}-widget`);
                if (widget) {
                    widget!.addEventListener("click", () => {
                        callbacks.toggleConferences(area);
                    });
                }
            }
        }
    }

    /* Add event listeners for area checkboxes */
    export function addCheckboxListeners(
        fields: Array<string>,
        callbacks: EventCallbacks
    ): void {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const fieldElement = document.getElementById(field) as HTMLInputElement;
            if (!fieldElement) {
                continue;
            }
            fieldElement.addEventListener("click", () => {
                // Invalidate cache since a checkbox changed
                callbacks.invalidateCheckboxCache();

                let updateURL: boolean = true;
                if (field in parentMap) {
                    // Child checkbox - handle parent state update
                    updateURL = handleChildCheckboxClick(field, callbacks.invalidateCheckboxCache);
                } else {
                    // Parent checkbox - propagate to children
                    handleParentCheckboxClick(field, fieldElement, callbacks.invalidateCheckboxCache);
                }
                callbacks.rank(updateURL);
                // Track user interaction for sponsorship
                recordUserInteraction();
            });
        }
    }

    /* Add event listeners for group selector buttons */
    export function addGroupSelectorListeners(callbacks: EventCallbacks): void {
        // All areas on/off buttons
        const allOnWidget = document.getElementById('all_areas_on');
        if (allOnWidget) {
            allOnWidget.addEventListener("click", () => {
                callbacks.activateAll();
                recordUserInteraction();
            });
        }
        const allOffWidget = document.getElementById('all_areas_off');
        if (allOffWidget) {
            allOffWidget.addEventListener("click", () => {
                callbacks.activateNone();
                recordUserInteraction();
            });
        }
    }

    /* Add event listeners for area toggle buttons (the section header buttons) */
    export function addAreaToggleListeners(callbacks: EventCallbacks): void {
        const toggleActions: { [key: string]: { on: () => void, off: () => void, areas: string[] } } = {
            'ai_toggle': { on: callbacks.activateAI, off: callbacks.deactivateAI, areas: aiAreas },
            'systems_toggle': { on: callbacks.activateSystems, off: callbacks.deactivateSystems, areas: systemsAreas },
            'theory_toggle': { on: callbacks.activateTheory, off: callbacks.deactivateTheory, areas: theoryAreas },
            'other_toggle': { on: callbacks.activateOthers, off: callbacks.deactivateOthers, areas: interdisciplinaryAreas }
        };

        for (const toggleId in toggleActions) {
            const btn = document.getElementById(toggleId) as HTMLElement;
            if (btn) {
                btn.addEventListener('click', () => {
                    // Check if any areas are currently selected
                    const areas = toggleActions[toggleId].areas;
                    let anyChecked = false;
                    for (const area of areas) {
                        const checkbox = document.getElementById(area) as HTMLInputElement;
                        if (checkbox && checkbox.checked) {
                            anyChecked = true;
                            break;
                        }
                    }
                    // Toggle: if any selected, turn all off; if none selected, turn all on
                    if (anyChecked) {
                        toggleActions[toggleId].off();
                    } else {
                        toggleActions[toggleId].on();
                    }
                    recordUserInteraction();
                });
            }
        }
    }

    /* Add all event listeners */
    export function addAllListeners(
        fields: Array<string>,
        callbacks: EventCallbacks
    ): void {
        addDropdownListeners(callbacks);
        addAreaWidgetListeners(callbacks);
        addCheckboxListeners(fields, callbacks);
        addGroupSelectorListeners(callbacks);
        addAreaToggleListeners(callbacks);
        addAreaIndicatorListeners(callbacks);
    }

    /* Update area selection indicators based on checkbox states */
    export function updateAreaIndicators(): void {
        const areaGroups: { [key: string]: { areas: string[], toggleId: string } } = {
            'ai': { areas: aiAreas, toggleId: 'ai_toggle' },
            'systems': { areas: systemsAreas, toggleId: 'systems_toggle' },
            'theory': { areas: theoryAreas, toggleId: 'theory_toggle' },
            'interdisciplinary': { areas: interdisciplinaryAreas, toggleId: 'other_toggle' }
        };

        for (const group in areaGroups) {
            const parentAreas = areaGroups[group].areas;
            let anyChecked = false;
            let isDefaultState = true;

            // Check if current state matches the default state:
            // - All parent areas checked
            // - All top-tier (non-nextTier) children checked
            // - All next-tier children NOT checked
            for (const area of parentAreas) {
                // Check parent checkbox - should be checked in default state
                const parentCheckbox = document.getElementById(area) as HTMLInputElement;
                if (parentCheckbox) {
                    if (parentCheckbox.checked) {
                        anyChecked = true;
                    } else {
                        isDefaultState = false;
                    }
                }

                // Check child checkboxes
                if (area in childMap) {
                    for (const child of childMap[area]) {
                        const childCheckbox = document.getElementById(child) as HTMLInputElement;
                        if (childCheckbox) {
                            const isNextTier = child in nextTier;
                            if (childCheckbox.checked) {
                                anyChecked = true;
                                // Next-tier should NOT be checked in default state
                                if (isNextTier) {
                                    isDefaultState = false;
                                }
                            } else {
                                // Top-tier should be checked in default state
                                if (!isNextTier) {
                                    isDefaultState = false;
                                }
                            }
                        }
                    }
                }
            }

            // Determine selection state
            let selectionClass: string;
            if (!anyChecked) {
                selectionClass = 'selection-none';
            } else if (isDefaultState) {
                selectionClass = 'selection-all';
            } else {
                selectionClass = 'selection-partial';
            }

            // Update banner indicator
            const indicator = document.querySelector(`.${group}-indicator`) as HTMLElement;
            if (indicator) {
                indicator.classList.remove('selection-none', 'selection-partial', 'selection-all');
                indicator.classList.add(selectionClass);
            }

            // Update section toggle button
            const toggleBtn = document.getElementById(areaGroups[group].toggleId) as HTMLElement;
            if (toggleBtn) {
                toggleBtn.classList.remove('selection-none', 'selection-partial', 'selection-all');
                toggleBtn.classList.add(selectionClass);
            }
        }
    }

    /* Area indicator click handling moved to area-dropdown.ts */
    export function addAreaIndicatorListeners(_callbacks: EventCallbacks): void {
        // Click handlers now managed by initAreaDropdowns() in area-dropdown.ts
    }

}
