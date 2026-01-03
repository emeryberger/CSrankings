/*
  CSRankings - Year Range Slider

  Initialization and management of the year range slider using noUiSlider.
*/

// Declare noUiSlider types
declare var noUiSlider: {
    create(element: HTMLElement, options: {
        start: number[];
        connect: boolean;
        range: { min: number; max: number };
        step: number;
        behaviour?: string;
    }): void;
};

interface noUiSliderInstance {
    on(event: string, callback: (values: string[], handle: number) => void): void;
    set(values: number[]): void;
    get(): string[];
}

namespace CSRankings {

    let yearSliderInstance: noUiSliderInstance | null = null;
    const MIN_YEAR = 1970;
    const MAX_YEAR = new Date().getFullYear();
    const DEFAULT_FROM_YEAR = MAX_YEAR - 10;
    const DEFAULT_TO_YEAR = MAX_YEAR;

    // Store the callback for use in year input handlers
    let yearChangeCallback: (() => void) | null = null;

    /* Populate the hidden year select elements dynamically */
    export function populateYearSelects(): void {
        const fromYearSelect = document.getElementById('fromyear') as HTMLSelectElement;
        const toYearSelect = document.getElementById('toyear') as HTMLSelectElement;

        if (!fromYearSelect || !toYearSelect) return;

        // Clear existing options
        fromYearSelect.innerHTML = '';
        toYearSelect.innerHTML = '';

        // Populate with years from MIN_YEAR to MAX_YEAR
        for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
            const fromOption = document.createElement('option');
            fromOption.value = year.toString();
            fromOption.textContent = year.toString();
            if (year === DEFAULT_FROM_YEAR) {
                fromOption.selected = true;
            }
            fromYearSelect.appendChild(fromOption);

            const toOption = document.createElement('option');
            toOption.value = year.toString();
            toOption.textContent = year.toString();
            if (year === DEFAULT_TO_YEAR) {
                toOption.selected = true;
            }
            toYearSelect.appendChild(toOption);
        }
    }

    /* Initialize the year range slider */
    export function initYearSlider(onChangeCallback: () => void): void {
        const sliderElement = document.getElementById('year-slider');
        if (!sliderElement) {
            console.error('Year slider element not found');
            return;
        }

        yearChangeCallback = onChangeCallback;

        // Populate hidden selects dynamically
        populateYearSelects();

        // Initialize display spans with default values
        const fromDisplay = document.getElementById('year-display-from');
        const toDisplay = document.getElementById('year-display-to');
        if (fromDisplay) fromDisplay.textContent = DEFAULT_FROM_YEAR.toString();
        if (toDisplay) toDisplay.textContent = DEFAULT_TO_YEAR.toString();

        // Get initial values from hidden selects (for URL param support)
        const fromYearSelect = document.getElementById('fromyear') as HTMLSelectElement;
        const toYearSelect = document.getElementById('toyear') as HTMLSelectElement;

        let initialFrom = DEFAULT_FROM_YEAR;
        let initialTo = DEFAULT_TO_YEAR;

        if (fromYearSelect && fromYearSelect.value) {
            initialFrom = parseInt(fromYearSelect.value) || DEFAULT_FROM_YEAR;
        }
        if (toYearSelect && toYearSelect.value) {
            initialTo = parseInt(toYearSelect.value) || DEFAULT_TO_YEAR;
        }

        // Create the slider
        noUiSlider.create(sliderElement, {
            start: [initialFrom, initialTo],
            connect: true,
            range: {
                'min': MIN_YEAR,
                'max': MAX_YEAR
            },
            step: 1,
            behaviour: 'tap-drag'
        });

        yearSliderInstance = (sliderElement as any).noUiSlider;

        // Update displays and hidden selects on slide
        yearSliderInstance!.on('update', (values: string[], _handle: number) => {
            const fromYear = Math.round(parseFloat(values[0]));
            const toYear = Math.round(parseFloat(values[1]));

            // Update display elements (only if not being edited)
            const fromDisplay = document.getElementById('year-display-from');
            const toDisplay = document.getElementById('year-display-to');
            if (fromDisplay && document.activeElement !== fromDisplay) {
                fromDisplay.textContent = fromYear.toString();
            }
            if (toDisplay && document.activeElement !== toDisplay) {
                toDisplay.textContent = toYear.toString();
            }
        });

        // Trigger callback only on change (when user releases)
        yearSliderInstance!.on('change', (values: string[], _handle: number) => {
            const fromYear = Math.round(parseFloat(values[0]));
            const toYear = Math.round(parseFloat(values[1]));

            // Update hidden selects for URL compatibility
            updateHiddenSelect('fromyear', fromYear);
            updateHiddenSelect('toyear', toYear);

            // Trigger the callback
            onChangeCallback();
        });

        // Initialize editable year displays
        initEditableYearDisplays();
    }

    /* Initialize editable year display elements */
    function initEditableYearDisplays(): void {
        const fromDisplay = document.getElementById('year-display-from');
        const toDisplay = document.getElementById('year-display-to');

        if (fromDisplay) {
            setupEditableYear(fromDisplay, 'from');
        }
        if (toDisplay) {
            setupEditableYear(toDisplay, 'to');
        }
    }

    /* Set up an editable year display element */
    function setupEditableYear(element: HTMLElement, type: 'from' | 'to'): void {
        // Make it focusable and editable
        element.setAttribute('contenteditable', 'true');
        element.setAttribute('inputmode', 'numeric');
        element.style.cursor = 'text';
        element.title = `Click to edit ${type === 'from' ? 'start' : 'end'} year (${MIN_YEAR}-${MAX_YEAR})`;

        // Select all text on focus
        element.addEventListener('focus', () => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });

        // Handle Enter key
        element.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                element.blur();
            }
            // Only allow digits
            if (e.key.length === 1 && !/\d/.test(e.key)) {
                e.preventDefault();
            }
        });

        // Validate and apply on blur
        element.addEventListener('blur', () => {
            applyYearInput(element, type);
        });
    }

    /* Validate and apply year input */
    function applyYearInput(element: HTMLElement, type: 'from' | 'to'): void {
        const inputValue = parseInt(element.textContent || '', 10);
        const currentValues = getYearSliderValues();

        let newFrom = currentValues.fromYear;
        let newTo = currentValues.toYear;

        if (isNaN(inputValue)) {
            // Invalid input, restore previous value
            element.textContent = (type === 'from' ? newFrom : newTo).toString();
            return;
        }

        // Clamp to valid range
        const clampedValue = Math.max(MIN_YEAR, Math.min(MAX_YEAR, inputValue));

        if (type === 'from') {
            newFrom = clampedValue;
            // Ensure from <= to
            if (newFrom > newTo) {
                newTo = newFrom;
            }
        } else {
            newTo = clampedValue;
            // Ensure to >= from
            if (newTo < newFrom) {
                newFrom = newTo;
            }
        }

        // Update slider and displays
        if (yearSliderInstance) {
            yearSliderInstance.set([newFrom, newTo]);
        }

        // Update hidden selects
        updateHiddenSelect('fromyear', newFrom);
        updateHiddenSelect('toyear', newTo);

        // Update display text
        const fromDisplay = document.getElementById('year-display-from');
        const toDisplay = document.getElementById('year-display-to');
        if (fromDisplay) fromDisplay.textContent = newFrom.toString();
        if (toDisplay) toDisplay.textContent = newTo.toString();

        // Trigger callback
        if (yearChangeCallback) {
            yearChangeCallback();
        }
    }

    /* Update hidden select element, adding option if needed */
    function updateHiddenSelect(selectId: string, value: number): void {
        const select = document.getElementById(selectId) as HTMLSelectElement;
        if (!select) return;

        // Check if option exists, if not create it
        let option = select.querySelector(`option[value="${value}"]`) as HTMLOptionElement;
        if (!option) {
            option = document.createElement('option');
            option.value = value.toString();
            option.textContent = value.toString();
            select.appendChild(option);
        }

        select.value = value.toString();
    }

    /* Set slider values programmatically (for URL navigation) */
    export function setYearSliderValues(fromYear: number, toYear: number): void {
        if (yearSliderInstance) {
            yearSliderInstance.set([fromYear, toYear]);
        }

        // Also update displays
        const fromDisplay = document.getElementById('year-display-from');
        const toDisplay = document.getElementById('year-display-to');
        if (fromDisplay) fromDisplay.textContent = fromYear.toString();
        if (toDisplay) toDisplay.textContent = toYear.toString();
    }

    /* Get current slider values */
    export function getYearSliderValues(): { fromYear: number; toYear: number } {
        if (yearSliderInstance) {
            const values = yearSliderInstance.get();
            return {
                fromYear: Math.round(parseFloat(values[0])),
                toYear: Math.round(parseFloat(values[1]))
            };
        }
        return { fromYear: DEFAULT_FROM_YEAR, toYear: DEFAULT_TO_YEAR };
    }

}
