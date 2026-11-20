# Workflow: Sync Threat Intelligence (`/sync-intel`)

Executes the automated zero-cost data ingestion pipeline to fetch, normalize, and enrich European hybrid and cyber threat signals.

---

## Prerequisites
- Python 3.10+ installed.
- Required dependencies installed: `requests`, `feedparser`.

---

## Execution Steps

### 1. Run Ingestion Script
Execute the primary ingestion script from the project root:
```bash
python scripts/ingest.py
```

### 2. Validate Data Integrity Contracts
Upon execution completion, verify that the generated artifacts adhere strictly to the JSON contracts:
1. **JSON Validity:** Ensure both `data/signals.json` and `data/meta.json` parse without syntax errors.
2. **Date Hygiene:**
   - Verify all `published_at` values match `YYYY-MM-DD`.
   - Ensure zero occurrences of `Invalid Date`, `NaN`, or empty date strings.
3. **HTML Sanitization:**
   - Confirm all `summary` fields are stripped of raw HTML tags (`<p>`, `<a>`, `<br>`, etc.) and do not exceed 220 characters.
4. **URL Uniqueness:**
   - Ensure there are no duplicate `source_url` entries in `data/signals.json`.
5. **EPSS Telemetry Bounds:**
   - For all signals containing EPSS data, verify `0.0 <= epss_score <= 1.0` and `0.0 <= epss_percentile <= 1.0`.

### 3. Generate Ingestion Telemetry Report
Output a structured terminal summary detailing:
- Total signals collected in the rolling 30-day window.
- Breakdown of signals by Sector (`Energy`, `Defense`, `Transport`, `Digital`, `Space`, `Public Admin`).
- Breakdown of signals by Threat Vector (`Cyber/KEV`, `Espionage/Proxies`, `Sabotage`, `Influence`, `Reg/Sanc`).
- Total `HIGH` exposure NIS2 alerts identified.
- Feed operational health table from `data/meta.json` (Feed Name, Tier, Status, Items Ingested, Error logs if any).
