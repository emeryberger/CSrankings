# UI/CSS Learnings from CSRankings

## Table Structure

### Main Ranking Table
The institution ranking table has **3 rows per institution**:
1. **Data row** - visible, contains rank, name, count, faculty count
2. **Chart row** - hidden by default, contains `div.csr-chart`
3. **Faculty row** - hidden by default, contains `div[id$="-faculty"]`

### Faculty Tables
Faculty listings (when expanded) have **2 rows per faculty member**:
1. **Data row** - visible, contains name, areas, publication count
2. **Chart row** - hidden by default, for individual faculty charts

## Key CSS Selectors

### Targeting the Main Table
The main table is **not** a direct child of `#success`. The actual path is:
```
#success > div.table-responsive > table.table-fit
```

**Wrong:** `#success > table`
**Right:** `#success table.table-fit`

### Zebra Striping Formulas

**Institutions (3 rows per item):**
- Stripe every other institution: `nth-child(6n+1)` (stripes 1, 7, 13... = institutions 1, 3, 5...)
- Target only data rows: `nth-child(3n+1)` (rows 1, 4, 7, 10...)
- Target empty rows to collapse: `nth-child(3n+2)` and `nth-child(3n)`

**Faculty (2 rows per item):**
- Stripe odd faculty (1, 3, 5...): `nth-child(4n+1)` (rows 1, 5, 9...)
- Stripe even faculty (2, 4, 6...): `nth-child(4n+3)` (rows 3, 7, 11...)
- Target empty chart rows: `nth-child(even)`

## Common Gotchas

### 1. Empty Rows Create Visible Gaps
Hidden content divs don't collapse their parent `<tr>` elements. The rows still have padding.

**Problem:** `padding: 2px 0` on empty rows creates 4px visible gaps
**Solution:**
```css
tr:nth-child(3n+2) > td,
tr:nth-child(3n) > td {
  padding: 0 !important;
  line-height: 0 !important;
  font-size: 0 !important;
}
```

### 2. Direct Child Selectors May Not Match
Tables are often wrapped in container divs (`.table-responsive`, `.row`, `.col-*`).

**Problem:** `#success > table` doesn't match because table is nested
**Solution:** Use descendant selector with class: `#success table.table-fit`

### 3. `border-collapse: collapse` Can Break Sticky Headers
In some browsers, `border-collapse: collapse` prevents `position: sticky` from working on `thead` or `th` elements.

**Solution:** Use `border-collapse: separate; border-spacing: 0;`

### 4. Scroll Containers Break Sticky Positioning
Any ancestor with `overflow: auto` or `overflow: scroll` creates a new scroll context, breaking sticky positioning relative to the viewport.

**Problem:** `.table-responsive { overflow: auto }` breaks sticky headers
**Solution:** Override with `overflow: visible !important` (but loses horizontal scroll)

### 5. Bootstrap's Table Striping Conflicts
Bootstrap's `.table-striped` applies `background-color` to `tr:nth-of-type(odd)`. Custom striping needs higher specificity or `!important`.

## Recommended Colors

**Zebra stripe:** `#f5f5f5` (subtle gray, works with Bootstrap)
**Hover highlight:** `#e3f2fd` (light blue, noticeable but not harsh)

## Testing with Selenium

Useful diagnostic script:
```python
# Check computed styles
height = driver.execute_script(
    "return window.getComputedStyle(arguments[0]).height", element)
padding = driver.execute_script(
    "return window.getComputedStyle(arguments[0]).padding", element)

# Check if selector matches
matches = driver.execute_script(
    "return arguments[0].matches('your-selector')", element)

# Get bounding rect for position checking
rect = driver.execute_script(
    "return arguments[0].getBoundingClientRect()", element)
```

## Final Working CSS

```css
/* Institution zebra stripe (every other institution) */
#success table.table-fit > tbody > tr:nth-child(6n+1) > td {
  background-color: #f5f5f5;
}

/* Institution hover */
#success table.table-fit > tbody > tr:nth-child(3n+1):hover > td {
  background-color: #e3f2fd;
}

/* Collapse empty institution rows */
#success table.table-fit > tbody > tr:nth-child(3n+2) > td,
#success table.table-fit > tbody > tr:nth-child(3n) > td {
  padding: 0 !important;
  line-height: 0 !important;
  font-size: 0 !important;
}

/* Faculty zebra stripe */
#success div.table > table tbody tr:nth-child(4n+1) td {
  background-color: #f5f5f5;
}

/* Faculty hover */
#success div.table > table tbody tr:hover td {
  background-color: #e3f2fd;
}

/* Collapse empty faculty rows */
#success div.table > table tbody tr:nth-child(even) td {
  padding: 0 !important;
  line-height: 0 !important;
  font-size: 0 !important;
}
```
