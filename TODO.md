# CSRankings UI Improvements

## Completed Tasks

### 1. Date Selection Slider ✓
Replaced year dropdowns with a noUiSlider range slider. Added:
- `src/year-slider.ts` - slider initialization and management
- CSS styling in `css/csrankings-extra.css`
- Hidden selects maintained for URL compatibility

### 2. Sponsor Button in Banner ✓
Moved "Sponsor CSrankings" button to the right side of the rank controls banner using flexbox layout.

### 3. Sticky Banner ✓
Made the rank controls panel sticky with `position: sticky`. Tests verified it stays at top when scrolling.

### 4. Added Tooltips ✓
Added title attributes to:
- Region selector
- Chart type selector
- Year slider elements
- Chart icons (in intro and dynamic)
- Google Scholar and DBLP icons
- Expand/collapse widgets
- Institution names
- Group selectors (on/off links)

### 5. Clickable Faculty Rows ✓
Made entire faculty data rows clickable to navigate to homepage:
- Added `cursor:pointer` and row-level onclick
- Used `event.stopPropagation()` on nested links (Scholar, DBLP, chart icons)
- Added helpful tooltip

### 6. Institution Homepage Links ✓
Added institution CS department homepage links:
- Added `homepage` column to `institutions.csv`
- Auto-populated 665 institutions from faculty homepage patterns
- Updated `data-loader.ts` to load homepage URLs
- Updated `rendering.ts` to render institution names as links when URL available
