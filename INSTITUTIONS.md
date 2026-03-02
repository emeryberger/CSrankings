# Adding Institutions to CSRankings

## Eligibility Criteria

1. **PhD Program Required**: The institution must offer a PhD program in computer science (or the local equivalent).

2. **Wikipedia Entry Required**: The institution must have an English Wikipedia entry. If no Wikipedia entry exists, the institution should not be added.

3. **Name Length Limit**: Institution names must not exceed **37 characters** (the length of "Univ. of Illinois at Urbana-Champaign").

## Naming Conventions

- Only abbreviate when necessary to fit within the 37-character limit.
- If the name fits without abbreviation, use the full name (e.g., "Rowan University", not "Rowan Univ.").
- When abbreviation is needed, apply these standard abbreviations:
  - `University` -> `Univ.`
  - `Institute` -> `Inst.`
  - `Technology` -> `Tech.`
  - `Information` -> `Info.`
- Use the institution's English name as given in its Wikipedia entry whenever possible.
- If the name still exceeds 37 characters after standard abbreviations, use the abbreviation per its Wikipedia entry.

## Process

1. Open a GitHub issue using the "Add institution" template.
2. A maintainer will verify the institution meets all criteria above.
3. Once approved, the institution is added to `institutions.csv` in alphabetical order.
4. After the institution is added, submit a **single PR** adding **all** CS faculty at the institution.

## CSV Format

Entries in `institutions.csv` follow this format:

```
institution,region,countryabbrv,homepage
```

- **institution**: Name (≤37 characters, using abbreviations as needed)
- **region**: One of `northamerica`, `southamerica`, `europe`, `asia`, `australasia`, `africa`
- **countryabbrv**: ISO 3166-1 alpha-2 country code (lowercase)
- **homepage**: URL of the CS department homepage
