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
        ["toyear", "fromyear", "regions"].forEach((key) => {
            const widget = document.getElementById(key);
            widget!.addEventListener("change", () => {
                // Year/region change invalidates the incremental cache
                callbacks.invalidateIncrementalCache();
                callbacks.recomputeAuthorAreas();
                callbacks.rank();
                // Track user interaction for sponsorship
                recordUserInteraction();
            });
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
    }

}
