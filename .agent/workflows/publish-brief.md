# Workflow: Publish Executive Brief (`/publish-brief`)

Facilitates the controlled release of a 2-page analyst-curated Executive Brief from the author's private local generation pipeline into the public repository.

---

## Input Parameters
- `SOURCE_PATH`: Local directory path containing the exported brief artifacts (including the 2-page PDF and `brief_data.json`).

---

## Execution Steps

### 1. OPSEC & Handling Markings Audit
Before staging any file:
1. Inspect the source document metadata and header to confirm the intelligence handling marking is strictly **`TLP:CLEAR`**.
2. If marked `TLP:GREEN`, `TLP:AMBER`, or `TLP:RED`, **ABORT IMMEDIATELY**. Under no circumstances should non-public intelligence artifacts be copied to this public repository.

### 2. PDF Asset Ingestion & Case Sensitivity Verification
1. Copy the 2-page PDF from the source directory to `public/briefs/`.
2. Ensure the filename uses strictly lowercase/kebab-case or standard uppercase identifier format (e.g., `EHRM-EB-2026-001-subsea-cables.pdf`).
3. Verify the target file exists on disk with exact case-sensitive matching to ensure zero 404 errors on Linux-based production hosts (e.g., Vercel).

### 3. Catalog Synchronization (`data/briefs.json`)
1. Read the brief metadata from `brief_data.json` or equivalent source schema:
   - `id`: Document identifier (e.g., `EHRM-EB-2026-001`).
   - `title`: Institutional headline.
   - `subtitle`: Summary statement.
   - `pillar`: Strategic domain (e.g., `Critical Infrastructure & Hybrid Threats`).
   - `date`: Publication date in `YYYY-MM-DD`.
   - `tlp`: `TLP:CLEAR`.
   - `confidence`: `High` | `Moderate` | `Low`.
   - `key_judgments`: Array containing exactly three (3) concise analytical judgments.
2. Read `data/briefs.json`.
3. Set `featured: false` on all existing entries in the array.
4. Construct the new brief object with:
   - `pdf_url: "/briefs/<exact_filename>.pdf"`
   - `featured: true`
5. Prepend the new brief object to `data/briefs.json` and save formatted with 2-space indentation.

### 4. Link & Artifact Verification
1. Confirm that `public/briefs/<exact_filename>.pdf` is readable.
2. Verify that `data/briefs.json` is valid JSON and that the total brief count matches expectations.
3. Update `briefs_count` in `data/meta.json` if applicable.
