# Rule: Web Engineering Standards

All frontend code, data ingestion scripts, and static assets in `eu-hybrid-risk-monitor` must strictly follow these engineering guidelines.

---

## 1. TypeScript Strictness
- **Zero `any` Policy:** Explicit TypeScript types or interfaces must be written for all props, states, API payloads, and utility returns.
- **Contract Enforcement:** All signal data consumed in components must conform strictly to `data/signals.json`, `data/meta.json`, and `data/briefs.json` type definitions.
- **Validation:** Every release or pull request must pass `npx tsc --noEmit` and `npm run lint` with zero errors and zero warnings.

---

## 2. Zero Secrets & OPSEC
- **No `.env` or Credentials:** The repository is fully public and static. Under no circumstances should API keys, private tokens, webhook URLs, or `.env*` files be committed.
- **Public Feeds Only:** Ingestion must rely strictly on open, keyless endpoints (CISA KEV JSON, FIRST EPSS API, and public RSS feeds).

---

## 3. Data Loading & Deterministic Behavior
- **Static JSON Architecture:** Next.js pages must read JSON files deterministically from `data/` or bundled assets. Avoid runtime client-side fetching to third-party endpoints that could fail or cause CORS issues.
- **Fail-Safe Ingestion:** If an individual external RSS feed is unreachable, the pipeline must log the failure in `data/meta.json` without failing the overall build or corrupting `data/signals.json`.

---

## 4. Accessibility & Navigation
- **Keyboard Navigation:**
  - The slide-over Detail Drawer must close immediately on pressing `Escape`.
  - Modals and drawers must trap focus properly when open.
- **Focus Indicators:**
  - Focus outlines must use the crisp Oxford accent (`outline: 2px solid #1C2836; outline-offset: 1px`).
- **External Links:**
  - All outbound hyperlinks (to source reports, CVE databases, LinkedIn) must include `target="_blank"` and `rel="noopener noreferrer"`.

---

## 5. File System & Case Sensitivity (Linux / Vercel Compatibility)
- **Strict Case Matching:** All PDF filenames in `public/briefs/` must match their corresponding `pdf_url` path in `data/briefs.json` with exact case sensitivity.
- **Safe Naming:** Use kebab-case or standard uppercase doc identifiers (e.g., `EHRM-EB-2026-001-threat-assessment.pdf`) with no spaces or non-standard symbols.
