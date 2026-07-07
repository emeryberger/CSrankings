#!/usr/bin/env python3
"""Graph the growth of CS faculty (and departments) over time, with a fitted curve.

Uses this repo's generated-author-info.csv. Counts, per publication year, the
number of unique authors whose *lifetime* tracked-publication total is at least
K (default 5), and the number of departments those authors belong to. Produces a
dual-axis chart: green bars for faculty (unique authors) with a blue line for the
rough faculty-per-department ratio, plus a fitted growth curve over the faculty
bars (exponential by default).

Caveats (CSrankings data semantics):
  * Every paper is attributed to the author's *current* department, so this is a
    "total over time," not a true historical department census. For a global
    total this is fine (a faculty move just shifts which dept a person counts in).
  * A department/author appears in a year only with >=1 tracked publication;
    "faculty" means publishing authors, not an HR roster.
  * Recent years are undercounted (DBLP indexing lag), so the series is capped at
    --end-year (default 2024). Default window starts at --start-year (2000).
"""

import argparse
import csv
import os
from collections import defaultdict

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

DEFAULT_DATA = os.path.join(os.path.dirname(__file__), "generated-author-info.csv")


def evenly_spaced_items(lst, N):
    """Return N items evenly spaced across lst."""
    if N == 1:
        return [lst[len(lst) // 2]]
    if N >= len(lst):
        return lst.copy()
    step = (len(lst) - 1) / (N - 1)
    out = [lst[0]]
    for i in range(1, N - 1):
        out.append(lst[int(i * step)])
    out.append(lst[-1])
    return out


def load(path):
    """Read generated-author-info.csv -> lifetime pubs, active years, dept per author."""
    total_pubs = defaultdict(float)
    active_years = defaultdict(set)
    dept_of = {}
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            name = row["name"]
            year = int(float(row["year"]))
            total_pubs[name] += float(row["count"])
            active_years[name].add(year)
            dept_of[name] = row["dept"]  # current affiliation, constant per author
    return total_pubs, active_years, dept_of


def series(total_pubs, active_years, dept_of, min_total_pubs, start_year, end_year):
    """Per-year eligible-author count and the departments they span."""
    eligible = [n for n, t in total_pubs.items() if t >= min_total_pubs]
    authors_by_year = defaultdict(int)
    depts_by_year = defaultdict(set)
    for name in eligible:
        dept = dept_of[name]
        for y in active_years[name]:
            if start_year <= y <= end_year:
                authors_by_year[y] += 1
                depts_by_year[y].add(dept)
    years = sorted(authors_by_year)
    authors = [authors_by_year[y] for y in years]
    depts = [len(depts_by_year[y]) for y in years]
    fac_per_dept = [a / d if d else 0 for a, d in zip(authors, depts)]
    return years, authors, depts, fac_per_dept


def fit_curve(years, authors, model):
    """Fit a growth model. Returns (smooth_x, smooth_y, label, r2)."""
    x = np.array(years, dtype=float)
    y = np.array(authors, dtype=float)
    xs = np.linspace(x.min(), x.max(), 200)
    if model == "linear":
        c = np.polyfit(x, y, 1)
        pred = np.polyval(c, x)
        ys = np.polyval(c, xs)
        label = f"linear fit (+{c[0]:.0f}/yr)"
    elif model == "quadratic":
        c = np.polyfit(x, y, 2)
        pred = np.polyval(c, x)
        ys = np.polyval(c, xs)
        label = "quadratic fit"
    else:  # exponential: y = a * exp(b * (year - year0))
        x0 = x.min()
        lc = np.polyfit(x - x0, np.log(y), 1)
        pred = np.exp(np.polyval(lc, x - x0))
        ys = np.exp(np.polyval(lc, xs - x0))
        label = f"exponential fit ({np.exp(lc[0]) - 1:.1%}/yr)"
    r2 = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()
    return xs, ys, label, r2


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", default=DEFAULT_DATA,
                    help="path to generated-author-info.csv (default: alongside this script)")
    ap.add_argument("--min-total-pubs", type=int, default=5,
                    help="author counts if lifetime tracked pubs >= this (default: 5)")
    ap.add_argument("--start-year", type=int, default=2000)
    ap.add_argument("--end-year", type=int, default=2024,
                    help="cap the series here; later years are DBLP-incomplete (default: 2024)")
    ap.add_argument("--fit", default="exponential,quadratic",
                    help="comma-separated growth curves to overlay: any of "
                         "exponential, linear, quadratic (or 'none'). "
                         "Default: exponential,quadratic")
    ap.add_argument("--out", default="faculty_growth",
                    help="output path stem (writes .png and .pdf)")
    args = ap.parse_args()

    total_pubs, active_years, dept_of = load(args.data)
    years, authors, depts, fac_per_dept = series(
        total_pubs, active_years, dept_of,
        args.min_total_pubs, args.start_year, args.end_year)

    print(f"# faculty growth (lifetime pubs >= {args.min_total_pubs}), "
          f"{years[0]}-{years[-1]}")
    print("year\tfaculty\tdepts\tfac/dept")
    for y, a, d, r in zip(years, authors, depts, fac_per_dept):
        print(f"{y}\t{a}\t{d}\t{r:.1f}")

    sns.set_theme()
    fig = plt.figure()
    ax1 = fig.add_subplot()

    ax1.bar(years, authors, color="green", label="Faculty (unique authors)")
    fit_colors = {"exponential": "darkorange", "quadratic": "purple", "linear": "red"}
    models = [m.strip() for m in args.fit.split(",") if m.strip() and m.strip() != "none"]
    for model in models:
        xs, ys, label, r2 = fit_curve(years, authors, model)
        ax1.plot(xs, ys, color=fit_colors.get(model, "black"), linewidth=2.5,
                 label=f"{label}, $R^2$={r2:.3f}")
        print(f"\n{label}  R^2={r2:.4f}")
    ax1.set_xticks(evenly_spaced_items(years, 5))
    ax1.set_ylabel("Faculty (unique authors)", color="black", fontsize=12)
    ax1.legend(loc="upper left")

    ax2 = ax1.twinx()
    ax2.plot(years, fac_per_dept, color="blue")
    ax2.set_ylim(0, max(fac_per_dept) * 1.15)
    ax2.set_ylabel("Faculty / department", color="blue")
    ax2.tick_params(axis="y", labelcolor="blue")

    plt.title("Growth of CS Faculty Over Time", fontsize=16)

    metadata = {"CreationDate": None, "ModDate": None, "Creator": None,
                "Producer": None, "Author": None, "Version": None}
    plt.savefig(f"{args.out}.pdf", bbox_inches="tight", metadata=metadata)
    plt.savefig(f"{args.out}.png", bbox_inches="tight", metadata=metadata)
    plt.close()
    print(f"\nWrote {args.out}.png and {args.out}.pdf")


if __name__ == "__main__":
    main()
