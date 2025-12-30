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
    const MAX_YEAR = 2025;
    const DEFAULT_FROM_YEAR = 2015;
    const DEFAULT_TO_YEAR = 2025;

    /* Initialize the year range slider */
    export function initYearSlider(onChangeCallback: () => void): void {
        const sliderElement = document.getElementById('year-slider');
        if (!sliderElement) {
            console.error('Year slider element not found');
            return;
        }

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

            // Update display elements
            const fromDisplay = document.getElementById('year-display-from');
            const toDisplay = document.getElementById('year-display-to');
            if (fromDisplay) fromDisplay.textContent = fromYear.toString();
            if (toDisplay) toDisplay.textContent = toYear.toString();
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
