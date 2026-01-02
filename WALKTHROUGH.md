# CSRankings Interactive Walkthrough Implementation Plan

## Overview
Create a friendly, step-by-step interactive tour for prospective graduate students using **Shepherd.js**. The tour auto-shows on first visit and can be replayed via a Help button.

## Target Audience
Prospective PhD students looking for research advisors. Tone: approachable, encouraging, practical.

---

## Files to Create

### 1. `js/shepherd.min.js`
Download Shepherd.js v13.0.0 (UMD build, ~35KB minified):
```bash
curl -o js/shepherd.min.js "https://cdn.jsdelivr.net/npm/shepherd.js@13.0.0/dist/js/shepherd.min.js"
```

### 2. `css/shepherd.css`
Download base Shepherd styles:
```bash
curl -o css/shepherd.css "https://cdn.jsdelivr.net/npm/shepherd.js@13.0.0/dist/css/shepherd.css"
```

### 3. `css/csrankings-tour.css`
Custom styling to match CSRankings design:
- Blue header (#337ab7) matching site theme
- Rounded corners, subtle shadows
- Mobile-responsive (max-width constraints)
- Help button styling

### 4. `src/tour.ts`
Tour module with:
- `TourManager` singleton class
- 10 tour steps (see content below)
- localStorage tracking (`csrankings-tour-completed`)
- `initTour()` - called on page load
- `startTour()` - for Help button
- `resetTourStatus()` - for testing

---

## Files to Modify

### 1. `index.html`
Add to `<head>` (after line 52):
```html
<link rel="preload" as="style" href="css/shepherd.css">
<link rel="preload" as="style" href="css/csrankings-tour.css">
```

Add stylesheet links (around line 52):
```html
<link rel="stylesheet" href="css/shepherd.css">
<link rel="stylesheet" href="css/csrankings-tour.css">
```

Add script (after line 199):
```html
<script defer src="js/shepherd.min.js"></script>
```

Add Help button in `.rank-controls-sponsor` div (around line 432):
```html
<button class="btn-help-tour" onclick="CSRankings.startTour();" title="Take a guided tour">? Tour</button>
```

### 2. `tsconfig.json`
Add `"src/tour.ts"` before `"src/app.ts"` in files array.

### 3. `src/app.ts`
Add after line 243 (after sponsorship init):
```typescript
initTour();
```

---

## Tour Content (10 Steps)

Inspired by Philip Guo's approach: practical, balanced, focused on finding advisors.

| # | Title | Element | Key Message |
|---|-------|---------|-------------|
| 1 | **Welcome to CSRankings!** | (centered) | "Find CS programs and potential PhD advisors based on research output." |
| 2 | **How Rankings Work** | `.intro-panel` | "Metrics-based on publications at top venues. Transparent - see exactly who publishes where." |
| 3 | **Pick Your Region** | `#custom-region-dropdown` | "Filter by country or see global rankings." |
| 4 | **Focus on Recent Work** | `.year-slider-container` | "Recent years (5-7) show who's currently active - important for finding an advisor!" |
| 5 | **Choose Research Areas** | `.area-indicators` | "Toggle entire categories: AI, Systems, Theory, Interdisciplinary." |
| 6 | **Fine-Tune Conferences** | `#ai_toggle` | "Expand to select specific venues. Conferences below the line are 'second tier'." |
| 7 | **Explore the Rankings** | `#success` | "Schools ranked by adjusted publication count. Click to see faculty!" |
| 8 | **Find Potential Advisors** | `#success` | "Expand a school to see researchers. Look at their areas and publication counts." |
| 9 | **Research Before Reaching Out** | `.intro-panel` | "Click names for homepages, Scholar for papers, DBLP for co-authors. Read their work!" |
| 10 | **You're Ready!** | (centered) | "Remember: rankings are a starting point, not the whole picture. Good luck!" |

---

## localStorage

- **Key**: `csrankings-tour-completed`
- **Value**: `'true'` when tour completed/skipped
- **Reset**: `CSRankings.resetTourStatus()` from console

---

## Implementation Order

1. Download Shepherd.js and CSS to `js/` and `css/`
2. Create `css/csrankings-tour.css` with custom styles
3. Create `src/tour.ts` with tour logic and steps
4. Update `tsconfig.json` to include tour.ts
5. Update `index.html` (preloads, stylesheets, script, Help button)
6. Update `src/app.ts` to call `initTour()`
7. Compile TypeScript: `tsc --project tsconfig.json`
8. Test all steps locally

---

## Key CSS Considerations

- Tour modal z-index: 9001 (above sticky header's 100)
- Shepherd overlay z-index: 9000
- Max tooltip width: 400px (90vw on mobile)
- Match site's blue theme (#337ab7)
- Ensure sticky header visible during tour

---

## Testing Checklist

- [ ] Auto-shows on first visit
- [ ] Does NOT auto-show on return visits
- [ ] Help button starts tour anytime
- [ ] All 10 steps attach to correct elements
- [ ] Back/Next/Skip navigation works
- [ ] X button closes tour
- [ ] localStorage persists completion
- [ ] Works on mobile
- [ ] No console errors
