# CSRankings Performance Optimization Guide

This document describes optimization strategies that have proven effective for this codebase, along with lessons learned from profiling and benchmarking.

## General Principles

1. **Profile before optimizing** - Use `cProfile` or similar tools to identify actual bottlenecks. Intuition about performance is often wrong.

2. **Bottlenecks are often in C code** - When profiling shows 90%+ time in C libraries (XML parsers, JSON encoders), Python-level optimizations like Cython won't help. Switch libraries instead.

3. **Measure with real data** - Test with full-size datasets. Performance characteristics differ dramatically between small test files and production data.

## XML Processing

### Use lxml instead of expat-based parsers

The DBLP XML files are large (3-5GB uncompressed). We evaluated several approaches:

| Approach | Time | Notes |
|----------|------|-------|
| xml.sax (expat) | 183s | Python's built-in SAX parser |
| xmltodict | ~20s | Expat-based, builds dict structures |
| lxml iterparse | 68s | libxml2-based, 2.7x faster than expat |

**Winner: lxml iterparse** - Provides streaming processing with ~2.7x speedup.

### Key lxml patterns

```python
from lxml import etree

# Streaming parse with memory management
context = etree.iterparse(
    file_handle,
    events=('end',),
    tag=('inproceedings', 'article'),
    load_dtd=True,        # Required for entity resolution
    resolve_entities=True, # Convert &Eacute; to É
    huge_tree=True,       # Allow large text content
)

for event, elem in context:
    # Process element...

    # Critical: free memory after processing
    elem.clear()
    while elem.getprevious() is not None:
        del elem.getparent()[0]
```

### Entity resolution requires DTD

XML entities like `&Eacute;` require the DTD file for resolution. This means:
- The `dblp.dtd` file must be in the working directory
- Parallelization of XML parsing is not feasible (DTD must be loaded once)
- Use `load_dtd=True` and `resolve_entities=True`

## JSON Serialization

### Use orjson for large JSON files

The stdlib `json` module is slow for large files. orjson provides dramatic speedups:

| Library | Time | Speedup |
|---------|------|---------|
| json.dump | 17s | baseline |
| orjson.dumps | 0.2s | 80x faster |

```python
try:
    import orjson
    HAS_ORJSON = True
except ImportError:
    HAS_ORJSON = False

# Usage with fallback
if HAS_ORJSON:
    with open("output.json", "wb") as f:
        f.write(orjson.dumps(data, option=orjson.OPT_INDENT_2))
else:
    with open("output.json", "w") as f:
        json.dump(data, f, indent=2)
```

## CSV Processing

### Use Papa Parse for browser-side CSV

The frontend uses Papa Parse for CSV parsing with parallel loading:

```javascript
// Load all CSV files in parallel
const results = await Promise.all([
    loadCSV('file1.csv'),
    loadCSV('file2.csv'),
    // ...
]);
```

### Use csv.DictReader for Python

For server-side CSV processing, Python's built-in `csv` module is fast enough:

```python
import csv
with open('data.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        process(row)
```

## Frontend (TypeScript) Optimizations

### Incremental computation

Cache intermediate results and only recompute what changed:

```typescript
private incrementalCache: {
    valid: boolean;
    startyear: number;
    endyear: number;
    // ... cached data
}
```

Invalidate cache only when relevant parameters change (year, region), not on every checkbox click.

### Lazy rendering

Don't render content until it's needed:

```typescript
// Only generate faculty HTML when department row is expanded
buildDropDown(dept: string): string {
    if (!this.expanded[dept]) return '';
    // ... generate HTML
}
```

### Native DOM over jQuery

For hot paths, native DOM is 5-10x faster:

```typescript
// Fast
const elem = document.getElementById(id) as HTMLInputElement;
elem.checked = true;

// Slow
$(`input[name=${id}]`).prop('checked', true);
```

## What Doesn't Work

### Cython for C-bound code

When profiling shows 98% of time in C code (like expat XML parsing), Cython provides no benefit. The Python code is already just calling into C.

**Lesson:** Profile first. If the bottleneck is C code, switch libraries rather than optimizing Python.

### Parallel XML parsing with entities

XML entity resolution requires loading the DTD, which requires sequential access to the file. Attempts to parallelize by splitting the file fail because entities can't be resolved without the DTD context.

### Premature optimization

Always measure first. Some "optimizations" that seemed promising but didn't help:
- Output buffering in SAX handlers (I/O wasn't the bottleneck)
- String interning (memory wasn't the bottleneck)
- Custom escape functions (C code was already optimal)

## Benchmarking Commands

```bash
# Time a Python script
time python3 script.py

# Profile with cProfile (sorted by cumulative time)
python3 -m cProfile -s cumtime script.py 2>&1 | head -40

# Profile a specific function
python3 -m cProfile -s cumtime script.py 2>&1 | grep function_name

# Memory profiling (requires memory_profiler)
python3 -m memory_profiler script.py
```

## Summary of Optimizations Applied

| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| filter-dblp.py (XML filter) | 183s (expat SAX) | 68s (lxml) | 2.7x |
| regenerate_data.py (total) | 20s | 16s | 1.25x |
| regenerate_data.py (JSON) | 17s | 0.2s | 80x |
| Frontend initial load | 2-3s | 900ms | 2-3x |
| Frontend checkbox response | 750ms | 65ms | 12x |

## Dependencies for Optimal Performance

Required in `requirements.txt`:
- `lxml>=4.9.3` - Fast XML parsing
- `orjson>=3.9.0` - Fast JSON serialization (optional, falls back to stdlib)
