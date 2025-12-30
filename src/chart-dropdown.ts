/*
  CSRankings - Custom Chart Type Dropdown

  Creates a custom dropdown for chart type selection with icons.
  Syncs with the hidden original select for compatibility.
*/

namespace CSRankings {

    const chartIcons: { [key: string]: string } = {
        'bar': 'png/barchart.png',
        'pie': 'png/piechart.png'
    };

    export function initChartDropdown(): void {
        const select = document.getElementById('charttype') as HTMLSelectElement;
        const selectedDiv = document.getElementById('chart-selected');
        const optionsDiv = document.getElementById('chart-options');
        const selectedText = document.getElementById('chart-selected-text');
        const selectedIcon = document.getElementById('chart-selected-icon') as HTMLImageElement;

        if (!select || !selectedDiv || !optionsDiv) {
            return;
        }

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
            const target = (e.target as HTMLElement).closest('.chart-option') as HTMLElement;
            if (!target) return;

            const value = target.getAttribute('data-value');
            if (!value) return;

            // Update the hidden select
            select.value = value;

            // Update the visible selected display
            const text = target.querySelector('span')?.textContent || value;
            if (selectedText) selectedText.textContent = text;
            if (selectedIcon && chartIcons[value]) {
                selectedIcon.src = chartIcons[value];
            }

            // Update selected state in options
            optionsDiv.querySelectorAll('.chart-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            target.classList.add('selected');

            // Close the dropdown
            optionsDiv.classList.remove('open');

            // Trigger change event on the select
            select.dispatchEvent(new Event('change'));
        });
    }

    // Sync custom dropdown when select changes programmatically
    export function syncChartDropdown(): void {
        const select = document.getElementById('charttype') as HTMLSelectElement;
        const selectedText = document.getElementById('chart-selected-text');
        const selectedIcon = document.getElementById('chart-selected-icon') as HTMLImageElement;
        const optionsDiv = document.getElementById('chart-options');

        if (!select || !optionsDiv) return;

        const value = select.value;
        const selectedOption = select.options[select.selectedIndex];
        const text = selectedOption?.textContent || value;

        if (selectedText) selectedText.textContent = text;
        if (selectedIcon && chartIcons[value]) {
            selectedIcon.src = chartIcons[value];
        }

        // Update selected state in options
        optionsDiv.querySelectorAll('.chart-option').forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-value') === value);
        });
    }
}
