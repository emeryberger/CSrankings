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
        const listeners: { [key: string]: () => void } =
        {
            'all_areas_on': (() => { callbacks.activateAll(); }),
            'all_areas_off': (() => { callbacks.activateNone(); }),
            'ai_areas_on': (() => { callbacks.activateAI(); }),
            'ai_areas_off': (() => { callbacks.deactivateAI(); }),
            'systems_areas_on': (() => { callbacks.activateSystems(); }),
            'systems_areas_off': (() => { callbacks.deactivateSystems(); }),
            'theory_areas_on': (() => { callbacks.activateTheory(); }),
            'theory_areas_off': (() => { callbacks.deactivateTheory(); }),
            'other_areas_on': (() => { callbacks.activateOthers(); }),
            'other_areas_off': (() => { callbacks.deactivateOthers(); })
        };
        for (const item in listeners) {
            const widget = document.getElementById(item);
            widget!.addEventListener("click", () => {
                listeners[item]();
                // Track user interaction for sponsorship
                recordUserInteraction();
            });
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
        addAreaIndicatorListeners(callbacks);
    }

    /* Update area selection indicators based on checkbox states */
    export function updateAreaIndicators(): void {
        const areaGroups: { [key: string]: string[] } = {
            'ai': aiAreas,
            'systems': systemsAreas,
            'theory': theoryAreas,
            'interdisciplinary': interdisciplinaryAreas
        };

        for (const group in areaGroups) {
            const areas = areaGroups[group];
            let checkedCount = 0;
            let totalCount = 0;

            for (const area of areas) {
                const checkbox = document.getElementById(area) as HTMLInputElement;
                if (checkbox) {
                    totalCount++;
                    if (checkbox.checked) {
                        checkedCount++;
                    }
                }
            }

            const indicator = document.querySelector(`.${group}-indicator`) as HTMLElement;
            if (indicator) {
                indicator.classList.remove('selection-none', 'selection-partial', 'selection-all');
                if (checkedCount === 0) {
                    indicator.classList.add('selection-none');
                } else if (checkedCount === totalCount) {
                    indicator.classList.add('selection-all');
                } else {
                    indicator.classList.add('selection-partial');
                }
            }
        }
    }

    /* Add click listeners to area indicators for toggling */
    export function addAreaIndicatorListeners(callbacks: EventCallbacks): void {
        const indicatorActions: { [key: string]: { on: () => void, off: () => void } } = {
            'ai': { on: callbacks.activateAI, off: callbacks.deactivateAI },
            'systems': { on: callbacks.activateSystems, off: callbacks.deactivateSystems },
            'theory': { on: callbacks.activateTheory, off: callbacks.deactivateTheory },
            'interdisciplinary': { on: callbacks.activateOthers, off: callbacks.deactivateOthers }
        };

        for (const group in indicatorActions) {
            const indicator = document.querySelector(`.${group}-indicator`) as HTMLElement;
            if (indicator) {
                indicator.addEventListener('click', () => {
                    // Toggle: if any selected, turn all off; if none selected, turn all on
                    if (indicator.classList.contains('selection-none')) {
                        indicatorActions[group].on();
                    } else {
                        indicatorActions[group].off();
                    }
                    recordUserInteraction();
                });
            }
        }
    }

}
