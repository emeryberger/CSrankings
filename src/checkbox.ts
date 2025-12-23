/*
  CSRankings - Checkbox State Management

  Functions for managing checkbox state, weights, and field activation.
*/

namespace CSRankings {

    /* Refresh checkbox cache by reading all checkbox states */
    export function refreshCheckboxCache(
        fields: Array<string>,
        cache: { [key: string]: boolean }
    ): void {
        for (let ind = 0; ind < areas.length; ind++) {
            const area = areas[ind];
            const element = document.getElementById(fields[ind]) as HTMLInputElement;
            cache[area] = element ? element.checked : false;
        }
    }

    /* Get checkbox state, refreshing cache if needed */
    export function getCheckboxStateFromCache(
        area: string,
        cache: { [key: string]: boolean },
        cacheValid: boolean,
        _fields: Array<string>,
        refreshCache: () => void
    ): boolean {
        if (!cacheValid) {
            refreshCache();
        }
        return cache[area] || false;
    }

    /* Update weights from checkbox states, returns number of areas selected */
    export function updateWeightsFromCache(
        weights: { [key: string]: number },
        cache: { [key: string]: boolean }
    ): number {
        let numAreas = 0;
        for (let ind = 0; ind < areas.length; ind++) {
            const area = areas[ind];
            weights[area] = cache[area] ? 1 : 0;
            if (weights[area] === 1) {
                if (area in parentMap) {
                    // Don't count children.
                    continue;
                }
                /* One more area checked. */
                numAreas++;
            }
        }
        return numAreas;
    }

    /* Set all checkboxes on or off without triggering ranking */
    export function setAllCheckboxes(
        fields: Array<string>,
        value: boolean,
        invalidateCache: () => void
    ): void {
        for (let i = 0; i < areas.length; i++) {
            const item = fields[i];
            const element = document.getElementById(item) as HTMLInputElement;
            if (!element) continue;
            if (value) {
                // Turn off all next tier venues.
                if (item in nextTier) {
                    element.checked = false;
                } else {
                    element.checked = true;
                    element.disabled = false;
                }
            } else {
                // turn everything off.
                element.checked = false;
                element.disabled = false;
            }
        }
        invalidateCache();
    }

    /* Activate or deactivate a set of fields */
    export function activateFieldSet(
        value: boolean,
        fieldIndices: Array<number>,
        fields: Array<string>,
        invalidateCache: () => void,
        rankCallback: () => void
    ): boolean {
        for (let i = 0; i < fieldIndices.length; i++) {
            const item = fields[fieldIndices[i]];
            const element = document.getElementById(item) as HTMLInputElement;
            if (element) {
                element.checked = value;
                if (item in childMap) {
                    // It's a parent.
                    element.disabled = false;
                    // Activate / deactivate all children as appropriate.
                    childMap[item].forEach((k) => {
                        const childElement = document.getElementById(k) as HTMLInputElement;
                        if (childElement) {
                            if (k in nextTier) {
                                childElement.checked = false;
                            } else {
                                childElement.checked = value;
                            }
                        }
                    });
                }
            }
        }
        invalidateCache();
        rankCallback();
        return false;
    }

    /* Handle parent checkbox click - propagates to children */
    export function handleParentCheckboxClick(
        field: string,
        fieldElement: HTMLInputElement,
        _invalidateCache: () => void
    ): void {
        const val = fieldElement.checked;
        if (field in childMap) {
            for (const child of childMap[field]) {
                const childElement = document.getElementById(child) as HTMLInputElement;
                if (childElement) {
                    if (!(child in nextTier)) {
                        childElement.checked = val;
                    } else {
                        // Always deactivate next tier conferences.
                        childElement.checked = false;
                    }
                }
            }
        }
    }

    /* Handle child checkbox click - updates parent state */
    export function handleChildCheckboxClick(
        field: string,
        _invalidateCache: () => void
    ): boolean {
        // Child: If any child is on, activate the parent.
        // If all are off, deactivate parent.
        const parent = parentMap[field];
        const parentElement = document.getElementById(parent) as HTMLInputElement;
        let anyChecked = 0;
        let allChecked = 1;
        childMap[parent].forEach((k) => {
            const childElement = document.getElementById(k) as HTMLInputElement;
            const val = childElement ? (childElement.checked ? 1 : 0) : 0;
            anyChecked |= val;
            // allChecked means all top tier conferences
            // are on and all next tier conferences are
            // off.
            if (!(k in nextTier)) {
                // All need to be on.
                allChecked &= val;
            } else {
                // All need to be off.
                allChecked &= val ? 0 : 1;
            }
        });
        // Activate parent if any checked.
        if (parentElement) {
            parentElement.checked = anyChecked ? true : false;
            // Mark the parent as disabled unless all are checked.
            if (!anyChecked || allChecked) {
                parentElement.disabled = false;
            }
            if (anyChecked && !allChecked) {
                parentElement.disabled = true;
            }
        }
        // Return false to indicate URL should not be updated (child click)
        return false;
    }

}
