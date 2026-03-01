/*
  CSRankings - Max Papers Per Year Slider

  A checkbox + slider control that lets users limit the maximum adjusted papers
  per year that count toward rankings. When enabled, each faculty member's
  adjusted paper count is capped per year before being summed.
*/

// noUiSlider types are declared in year-slider.ts

namespace CSRankings {

    let maxPapersSliderInstance: noUiSliderInstance | null = null;
    const MIN_VALUE = 0.1;
    const MAX_VALUE = 10.0;
    const DEFAULT_VALUE = 5.0;
    const STEP = 0.1;

    // Store the callback for use in event handlers
    let maxPapersChangeCallback: (() => void) | null = null;

    /* Initialize the max papers per year control (checkbox + slider) */
    export function initMaxPapersSlider(onChangeCallback: () => void): void {
        const checkbox = document.getElementById('maxpapers-enabled') as HTMLInputElement;
        const sliderContainer = document.getElementById('max-papers-slider-container');
        const sliderElement = document.getElementById('max-papers-slider');
        const display = document.getElementById('max-papers-display');

        if (!checkbox || !sliderContainer || !sliderElement) {
            console.error('Max papers slider elements not found');
            return;
        }

        maxPapersChangeCallback = onChangeCallback;

        // Initialize display with default value
        if (display) {
            display.textContent = DEFAULT_VALUE.toFixed(1);
        }

        // Create the slider
        noUiSlider.create(sliderElement, {
            start: [DEFAULT_VALUE],
            connect: true,
            range: {
                'min': MIN_VALUE,
                'max': MAX_VALUE
            },
            step: STEP,
            behaviour: 'tap-drag'
        });

        maxPapersSliderInstance = (sliderElement as any).noUiSlider;

        // Update display on slide
        maxPapersSliderInstance!.on('update', (values: string[], _handle: number) => {
            const value = parseFloat(values[0]);
            if (display) {
                display.textContent = value.toFixed(1);
            }
        });

        // Trigger callback on change (when user releases)
        maxPapersSliderInstance!.on('change', (_values: string[], _handle: number) => {
            updateHiddenSelect();
            if (maxPapersChangeCallback) {
                maxPapersChangeCallback();
            }
        });

        // Handle checkbox toggle
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                sliderContainer.style.display = 'inline-flex';
            } else {
                sliderContainer.style.display = 'none';
            }
            updateHiddenSelect();
            if (maxPapersChangeCallback) {
                maxPapersChangeCallback();
            }
        });

        // Initialize visibility based on checkbox state
        sliderContainer.style.display = checkbox.checked ? 'inline-flex' : 'none';

        // Initialize hidden select
        updateHiddenSelect();
    }

    /* Update the hidden select element for URL compatibility */
    function updateHiddenSelect(): void {
        const select = document.getElementById('maxpapers') as HTMLSelectElement;
        const checkbox = document.getElementById('maxpapers-enabled') as HTMLInputElement;

        if (!select) return;

        // Clear existing options
        select.innerHTML = '';

        // Get current value
        const value = getMaxPapersValue();

        // Create option
        const option = document.createElement('option');
        if (value === null) {
            option.value = '0';  // 0 means disabled
            option.textContent = 'No limit';
        } else {
            option.value = value.toFixed(1);
            option.textContent = value.toFixed(1);
        }
        option.selected = true;
        select.appendChild(option);
    }

    /* Get current max papers per year value (null = no limit) */
    export function getMaxPapersValue(): number | null {
        const checkbox = document.getElementById('maxpapers-enabled') as HTMLInputElement;
        if (!checkbox || !checkbox.checked) {
            return null;  // No limit
        }

        if (maxPapersSliderInstance) {
            const values = maxPapersSliderInstance.get();
            return parseFloat(values[0]);
        }

        return DEFAULT_VALUE;
    }

    /* Set max papers value programmatically (for URL navigation) */
    export function setMaxPapersValue(value: number | null): void {
        const checkbox = document.getElementById('maxpapers-enabled') as HTMLInputElement;
        const sliderContainer = document.getElementById('max-papers-slider-container');

        if (!checkbox || !sliderContainer) return;

        if (value === null || value === 0) {
            // Disable the cap
            checkbox.checked = false;
            sliderContainer.style.display = 'none';
        } else {
            // Enable the cap and set value
            checkbox.checked = true;
            sliderContainer.style.display = 'inline-flex';

            // Clamp value to valid range
            const clampedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));

            if (maxPapersSliderInstance) {
                maxPapersSliderInstance.set([clampedValue]);
            }

            // Update display
            const display = document.getElementById('max-papers-display');
            if (display) {
                display.textContent = clampedValue.toFixed(1);
            }
        }

        updateHiddenSelect();
    }

}
