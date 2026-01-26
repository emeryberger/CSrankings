/*
  CSRankings - Custom Region Dropdown with Flags

  Creates a custom dropdown that displays country flags alongside region names.
  Multi-country regions use globe icons instead of flags.
  Syncs with the hidden original select for data compatibility.
*/

namespace CSRankings {

    // Globe icons for multi-country regions (centered on appropriate region)
    const regionGlobeIcons: { [key: string]: string } = {
        'northamerica': 'globe-americas',
        'southamerica': 'globe-americas',
        'europe': 'globe-europe-africa',
        'africa': 'globe-europe-africa',
        'asia': 'globe-asia-australia',
        'australasia': 'globe-asia-australia',
        'world': 'globe-world'
    };

    // Generate icon HTML based on region type
    function getRegionIcon(region: string): string {
        if (regionGlobeIcons[region]) {
            const iconFile = regionGlobeIcons[region];
            return `<img src="/flags/${iconFile}.png" alt="${region}" class="region-globe-img">`;
        }
        return '';
    }

    // Check if region is multi-country (uses globe icon)
    function isMultiCountryRegion(value: string): boolean {
        return regionGlobeIcons[value] !== undefined;
    }

    export function initRegionDropdown(): void {
        const select = document.getElementById('regions') as HTMLSelectElement;
        const customDropdown = document.getElementById('custom-region-dropdown');
        const selectedDiv = document.getElementById('region-selected');
        const optionsDiv = document.getElementById('region-options');
        const selectedText = document.getElementById('region-selected-text');
        const selectedFlag = document.getElementById('region-selected-flag') as HTMLImageElement;

        if (!select || !customDropdown || !optionsDiv || !selectedDiv) {
            console.error('Region dropdown elements not found');
            return;
        }

        // Build the options from the select element
        let optionsHTML = '';
        const optgroups = select.querySelectorAll('optgroup');

        optgroups.forEach((group) => {
            const label = group.getAttribute('label') || '';
            optionsHTML += `<div class="region-option-group">${label}</div>`;

            const options = group.querySelectorAll('option');
            options.forEach((option) => {
                const value = option.value;
                const text = option.textContent || '';
                const selected = option.selected ? 'selected' : '';

                if (isMultiCountryRegion(value)) {
                    // Multi-country region - use globe or empty icon
                    optionsHTML += `<div class="region-option ${selected}" data-value="${value}">
                        ${getRegionIcon(value)}
                        <span>${text}</span>
                    </div>`;
                } else {
                    // Country with flag
                    optionsHTML += `<div class="region-option ${selected}" data-value="${value}">
                        <img src="/flags/${value}.png" alt="${value}">
                        <span>${text}</span>
                    </div>`;
                }
            });
        });

        optionsDiv.innerHTML = optionsHTML;

        // Toggle dropdown open/closed
        selectedDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsDiv.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            optionsDiv.classList.remove('open');
        });

        // Handle option selection
        optionsDiv.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('.region-option') as HTMLElement;
            if (!target) return;

            const value = target.getAttribute('data-value');
            if (!value) return;

            // Update the hidden select
            select.value = value;

            // Update the visible selected display
            const text = target.querySelector('span')?.textContent || value;
            const img = target.querySelector('img') as HTMLImageElement;

            if (selectedText) selectedText.textContent = text;
            if (selectedFlag && img) {
                selectedFlag.src = img.src;
                selectedFlag.style.display = 'block';
            } else if (selectedFlag) {
                selectedFlag.style.display = 'none';
            }

            // Update selected state in options
            optionsDiv.querySelectorAll('.region-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            target.classList.add('selected');

            // Close the dropdown
            optionsDiv.classList.remove('open');

            // Trigger change event on the select
            select.dispatchEvent(new Event('change'));
        });

        // Set initial state based on selected option
        updateRegionDisplay(select, selectedText, selectedFlag);
    }

    function updateRegionDisplay(
        select: HTMLSelectElement,
        textEl: HTMLElement | null,
        flagEl: HTMLImageElement | null
    ): void {
        const selected = select.options[select.selectedIndex];
        if (!selected) return;

        const value = selected.value;
        const text = selected.textContent || value;

        if (textEl) textEl.textContent = text;

        if (flagEl) {
            if (regionGlobeIcons[value]) {
                // Multi-country region - show globe icon
                flagEl.src = `/flags/${regionGlobeIcons[value]}.png`;
                flagEl.style.display = 'block';
            } else {
                // Country - show flag
                flagEl.src = `/flags/${value}.png`;
                flagEl.style.display = 'block';
            }
        }
    }

    // Sync custom dropdown when select changes programmatically (e.g., from URL)
    export function syncRegionDropdown(): void {
        const select = document.getElementById('regions') as HTMLSelectElement;
        const selectedText = document.getElementById('region-selected-text');
        const selectedFlag = document.getElementById('region-selected-flag') as HTMLImageElement;
        const optionsDiv = document.getElementById('region-options');

        if (!select || !optionsDiv) return;

        updateRegionDisplay(select, selectedText, selectedFlag);

        // Update selected state in options
        const value = select.value;
        optionsDiv.querySelectorAll('.region-option').forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-value') === value);
        });
    }
}
