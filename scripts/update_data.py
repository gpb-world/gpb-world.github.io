#!/usr/bin/env python3
"""Update economics.json with fresh World Bank data.

Usage:
    python3 scripts/update_data.py                          # dry-run (default)
    python3 scripts/update_data.py --apply                  # write changes
    python3 scripts/update_data.py --countries norway,sweden # subset
"""

import argparse
import json
import logging
import sys
from pathlib import Path

# Ensure project root is on sys.path so `scripts.*` imports work
# regardless of where the script is invoked from.
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from scripts.worldbank import fetch_all

ECONOMICS_PATH = Path(__file__).resolve().parent.parent / "data" / "economics.json"

# These fields are never overwritten by the API
PROTECTED_FIELDS = {"revenue", "expenditure", "top_exports"}

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


def load_economics():
    with open(ECONOMICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_economics(data):
    with open(ECONOMICS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def print_diff(changes):
    """Print a formatted table of changes."""
    if not changes:
        print("\nNo changes detected.")
        return

    # Column widths
    cw = max(len(c["country"]) for c in changes)
    fw = max(len(c["field"]) for c in changes)
    ow = max(len(str(c["old"])) for c in changes)
    nw = max(len(str(c["new"])) for c in changes)

    header = (
        f"  {'Country':<{cw}}  {'Field':<{fw}}  "
        f"{'Old':>{ow}}  →  {'New':>{nw}}  Year"
    )
    print(f"\n{header}")
    print("  " + "─" * (len(header) - 2))

    for c in changes:
        print(
            f"  {c['country']:<{cw}}  {c['field']:<{fw}}  "
            f"{str(c['old']):>{ow}}  →  {str(c['new']):>{nw}}  {c['year']}"
        )

    print(f"\n  {len(changes)} field(s) changed across "
          f"{len({c['country'] for c in changes})} country/countries.")


def compute_diff(economics, api_data):
    """Compare existing data with API data and return list of changes."""
    changes = []
    for country_id, fields in sorted(api_data.items()):
        existing = economics.get(country_id, {})
        for field, (new_val, year) in sorted(fields.items()):
            if field in PROTECTED_FIELDS:
                continue
            old_val = existing.get(field)
            if old_val != new_val:
                changes.append({
                    "country": country_id,
                    "field": field,
                    "old": old_val,
                    "new": new_val,
                    "year": year,
                })
    return changes


def apply_changes(economics, api_data):
    """Merge API data into economics dict, respecting protected fields."""
    for country_id, fields in api_data.items():
        if country_id not in economics:
            economics[country_id] = {}
        for field, (value, _year) in fields.items():
            if field not in PROTECTED_FIELDS:
                economics[country_id][field] = value
    return economics


def main():
    parser = argparse.ArgumentParser(
        description="Update economics.json from World Bank API."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write changes to disk (default is dry-run).",
    )
    parser.add_argument(
        "--countries",
        type=str,
        default=None,
        help="Comma-separated list of country IDs to update (default: all).",
    )
    args = parser.parse_args()

    country_ids = None
    if args.countries:
        country_ids = [c.strip() for c in args.countries.split(",")]

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] Loading {ECONOMICS_PATH.name} …")
    economics = load_economics()

    target = country_ids or list(economics.keys())
    print(f"[{mode}] Fetching data for {len(target)} countries …\n")
    api_data = fetch_all(country_ids)

    changes = compute_diff(economics, api_data)
    print_diff(changes)

    if not changes:
        return 0

    if args.apply:
        economics = apply_changes(economics, api_data)
        save_economics(economics)
        print(f"\n  ✓ Written to {ECONOMICS_PATH}")
    else:
        print(f"\n  Dry-run complete. Re-run with --apply to write changes.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
