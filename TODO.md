# CSRankings UI Improvements

## Pending Tasks

(None at this time)

---

## Completed Tasks

### 8. Mobile Date Slider Alignment ✓
Fixed mobile slider alignment so dates stay attached to slider endpoints. Slider now shrinks responsively.
- Updated CSS media queries to use `flex-wrap: nowrap` and `flex: 1` for slider
- Added smaller breakpoint (576px) for very small screens

### 9. Sticky Banner Area Selection Indicators ✓
Added compact area indicators (AI, Systems, Theory, Interdisc.) to the sticky banner showing selection state via opacity:
- Full opacity = all selected
- Partial opacity (0.6) = some selected
- Dimmed (0.25) = none selected
- Click to toggle all on/off
- Files: `index.html`, `css/csrankings-extra.css`, `src/event-handlers.ts`, `src/app.ts`

### 10. Location Dropdown Country Flags ✓
Replaced native select with custom dropdown that displays country flags:
- Created `src/region-dropdown.ts` for dropdown initialization and sync
- Added CSS styling for custom dropdown with flag images
- Individual countries show their national flags
- Continents (North America, Europe, etc.) show no icon (empty placeholder)
- "The world" shows a round globe icon
- Syncs with hidden select for URL compatibility

### 11. Sticky Institution Table Header ✓
Made the institution ranking table header sticky inside the scrolling container:
- Added `position: sticky` to thead
- Changed `border-collapse` to `separate` to enable sticky behavior
- Header stays visible when scrolling through institutions

### 12. Area Triangle Tooltips ✓
Added `title="Click to show/hide conferences"` to all area expand/collapse widgets in `index.html`.

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
- Updated `data-loader.ts` to load homepage URLs (line 62-64 checks for non-empty homepage)
- Updated `rendering.ts` to render home icon next to institution name when URL available
- Home icon only appears when homepage URL is defined (not for empty values)
- Institution name click still toggles faculty list; home icon opens CS department page

### 7. Institution Homepage URL Verification ✓
Verified and corrected ~310 institution CS department homepage URLs:
- US institutions (~120): Ensured URLs contain CS-related paths (cs, cse, computing, eecs, etc.)
- European institutions (~60): UK, Germany, Nordic countries, etc.
- Asian institutions (~80): China, Korea, Japan, India, Singapore, etc.
- Canadian/Australian institutions (~35)
- South American/African institutions

## Learnings & Notes

### Institution URL Patterns
- US .edu URLs should contain CS-related terms: `cs`, `cse`, `cis`, `comp`, `eecs`, `computing`, `informatics`
- Valid abbreviations that don't contain "cs": `scai` (School of Computing & AI), `cc` (College of Computing), `ccs` (Computer & Cyber Sciences), `khoury`, `siebelschool`, `cics`, `luddy`
- Research institutions typically don't use .com domains (fixed Simula UiB from .com to simula.no)

### Data Fixes Applied
- Renamed "Royal Military College of Northamerica" to "Royal Military College of Canada"
- SUAT = Shenzhen University of Advanced Technology (China)
- Fixed Simula UiB URL from simula-uib.com to simula.no/research/projects/simula-uib

### Institutions Without Dedicated CS Pages
- Pabna Univ. of Science and Technology (Bangladesh) - relatively new university (2008), no dedicated CSE department webpage found

### Code Architecture Notes
- `data-loader.ts:62-64`: Only adds homepage to map if value is non-empty (`if (institutionHomepages && info.homepage)`)
- `rendering.ts:187-190`: Only renders home icon if `instHomepage` is truthy
- Empty homepage values in CSV are properly skipped, so no home icon appears

### CSS Color Scheme
- Primary blue: `#337ab7` (matches "consider sponsoring CSrankings" link color)
- Used for: sponsor button, year slider connect bar, year slider handles, year display badges

### Row Spacing
- Institution data rows have 4px vertical padding (`padding-top: 4px; padding-bottom: 4px`)
- Applied via `#success table.table-fit > tbody > tr:nth-child(3n+1) > td` selector

## Files Modified

### New Files
- `src/year-slider.ts` - noUiSlider initialization and sync with hidden selects
- `TODO.md` - this file

### Modified Files
- `index.html` - year slider markup, sponsor button, noUiSlider CDN
- `css/csrankings-extra.css` - slider styling, button styling, sticky banner, row spacing, zebra striping
- `src/data-loader.ts` - load institutionHomepages from CSV
- `src/rendering.ts` - render home icons, clickable faculty rows
- `src/types.ts` - added homepage field to CountryInfo interface
- `src/app.ts` - wire up institutionHomepages
- `src/navigation.ts` - sync slider from URL params
- `src/event-handlers.ts` - removed year dropdown listeners (replaced by slider)
- `institutions.csv` - added homepage column with ~310 verified CS department URLs
- `tsconfig.json` - added year-slider.ts to files array
