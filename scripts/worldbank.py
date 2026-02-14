"""Fetch economic indicators from the World Bank API v2."""

import logging
import time

import requests

from scripts.country_codes import COUNTRY_ID_TO_ISO2, ISO2_TO_COUNTRY_ID

logger = logging.getLogger(__name__)

# World Bank indicator codes → (our field name, conversion function)
INDICATORS = {
    "NY.GDP.MKTP.CD": ("gdp", lambda v: round(v / 1e9, 1)),
    "NY.GDP.PCAP.CD": ("gdp_per_capita", lambda v: round(v)),
    "NY.GNP.PCAP.CD": ("gni_per_capita", lambda v: round(v)),
    "FP.CPI.TOTL.ZG": ("inflation", lambda v: round(v, 1)),
    "SL.UEM.TOTL.ZS": ("unemployment", lambda v: round(v, 1)),
    "GC.DOD.TOTL.GD.ZS": ("public_debt_pct", lambda v: round(v, 1)),
    "NE.EXP.GNFS.CD": ("exports", lambda v: round(v / 1e9, 1)),
    "NE.IMP.GNFS.CD": ("imports", lambda v: round(v / 1e9, 1)),
    "NE.EXP.GNFS.ZS": ("exports_pct_gdp", lambda v: round(v, 1)),
    "GC.REV.XGRT.GD.ZS": ("revenue_pct_gdp", lambda v: round(v, 1)),
    "GC.XPN.TOTL.GD.ZS": ("expense_pct_gdp", lambda v: round(v, 1)),
}

BASE_URL = "https://api.worldbank.org/v2"
DATE_RANGE = "2022:2025"
REQUEST_DELAY = 0.5  # seconds between API calls


def _fetch_indicator(indicator_code, iso2_codes):
    """Fetch a single indicator for all countries. Returns raw API response."""
    countries = ";".join(iso2_codes)
    url = f"{BASE_URL}/country/{countries}/indicator/{indicator_code}"
    params = {
        "format": "json",
        "date": DATE_RANGE,
        "per_page": 500,
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    # API returns [metadata, records] — if no records, data may be length 1
    if not isinstance(data, list) or len(data) < 2:
        return []
    return data[1] or []


def _most_recent_value(records):
    """From a list of year-records for one country, return (value, year) of
    the most recent non-null entry."""
    # Sort descending by year so we pick the freshest value
    by_year = sorted(records, key=lambda r: r.get("date", ""), reverse=True)
    for rec in by_year:
        if rec.get("value") is not None:
            return rec["value"], rec["date"]
    return None, None


def fetch_all(country_ids=None):
    """Fetch all indicators for the given countries (or all 50).

    Returns: dict[country_id, dict[field, (converted_value, year)]]
    """
    if country_ids is None:
        country_ids = list(COUNTRY_ID_TO_ISO2.keys())

    iso2_codes = []
    for cid in country_ids:
        iso2 = COUNTRY_ID_TO_ISO2.get(cid)
        if iso2 is None:
            logger.warning("Unknown country ID: %s — skipping", cid)
        else:
            iso2_codes.append(iso2)

    if not iso2_codes:
        return {}

    # Initialise result structure
    results = {cid: {} for cid in country_ids if cid in COUNTRY_ID_TO_ISO2}

    for i, (wb_code, (field, convert)) in enumerate(INDICATORS.items()):
        if i > 0:
            time.sleep(REQUEST_DELAY)

        logger.info("Fetching %s (%s) …", field, wb_code)
        try:
            records = _fetch_indicator(wb_code, iso2_codes)
        except requests.RequestException as exc:
            logger.warning("API error for %s: %s — skipping", wb_code, exc)
            continue

        # Group records by country ISO2
        by_country = {}
        for rec in records:
            iso2 = rec.get("countryiso3code")
            # API returns ISO3; fall back to the 'country.id' which is ISO2
            ccode = rec.get("country", {}).get("id", "")
            if ccode in ISO2_TO_COUNTRY_ID:
                by_country.setdefault(ccode, []).append(rec)

        for iso2, recs in by_country.items():
            cid = ISO2_TO_COUNTRY_ID[iso2]
            if cid not in results:
                continue
            raw_val, year = _most_recent_value(recs)
            if raw_val is not None:
                results[cid][field] = (convert(raw_val), year)

    # Compute trade_balance where both exports and imports are available
    for cid, fields in results.items():
        if "exports" in fields and "imports" in fields:
            exp_val, exp_year = fields["exports"]
            imp_val, imp_year = fields["imports"]
            balance = round(exp_val - imp_val, 1)
            year = min(exp_year, imp_year)
            fields["trade_balance"] = (balance, year)

    return results
