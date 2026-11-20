# SPEC.md: Master Project Contract

## 1. Project Identity & Operational Security (OPSEC)
- **Project Name:** `eu-hybrid-risk-monitor` (European Hybrid & Geopolitical Risk Monitor)
- **Mission:** A public, zero-cost (0 EUR/month) European Open-Source Intelligence (OSINT) and Cyber Threat Intelligence (CTI) monitoring portal, strictly separated from the author's private local brief-generation pipeline.
- **Operating Philosophy:**
  - Zero paid APIs or commercial data feeds.
  - Zero paid cloud databases or hosted backend services.
  - Zero runtime `.env` secrets or credentials in the public codebase.
  - Strictly `TLP:CLEAR` public intelligence artifacts.
- **Analyst & Curation:** Curated by Analyst Xabier Barbero.

---

## 2. Editorial Design System ("Zero-AI Aesthetic")
A disciplined, publication-grade design language evocative of European defense institutes, intelligence reviews, and sovereign risk observatories. Reject consumer web templates and AI-generated SaaS visual tropes.

### 2.1 Color Palette (CSS Tokens)
- `--bg-paper: #FAF9F6` (Primary canvas background)
- `--bg-surface: #FFFFFF` (Card and panel background)
- `--bg-stone: #F4F4F1` (Subtle muted containers and secondary table rows)
- `--border-rule: #D4D4D0` (1px solid architectural hairline borders)
- `--ink-primary: #161616` (Deep charcoal headline and high-contrast body text)
- `--ink-muted: #525252` (Secondary captions, metadata labels, tertiary text)
- `--accent-oxford: #1C2836` (Naval/diplomatic deep blue-gray for active states, primary badges, navigation accents)
- `--accent-alert: #7A1C1C` (Subdued crimson, strictly reserved for HIGH NIS2 exposure, active KEV exploitation, or critical kinetic alerts)

### 2.2 Typography Hierarchy
- **Editorial Headlines & Masthead:** Classic Editorial Serif (`Newsreader`, `Source Serif Pro`, or system `Georgia`).
- **UI Elements, Form Controls & Body Text:** Neutral, high-legibility Sans-Serif (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`).
- **Technical Metadata & Telemetry:** Monospace (`JetBrains Mono`, `Consolas`, `ui-monospace`) for `CVE-ID`, `EPSS`, `Doc ID`, `TLP`, timestamps, hashes, and vector tags.

### 2.3 Strict Visual Constraints (Hard Bans)
- **NO Dark Neon Themes:** No pitch-black backgrounds with glowing cyan/green neon borders.
- **NO Gradients:** No linear or radial color sweeps across backgrounds, buttons, or text.
- **NO Box Shadows:** No blurred drop-shadows or elevated glow layers; hierarchy is established via hairlines (`1px solid #D4D4D0`) and surface contrast.
- **Zero Border Radius:** Strict `border-radius: 0px` globally enforced on all buttons, badges, inputs, modals, cards, and tooltips.
- **NO Decorative Emojis:** Zero consumer emoji icons in the UI, labels, or badges.
- **NO 3D Charts or Unnecessary Animations:** No canvas 3D models, spinning decorative particles, or bouncy transitions.
- **NO Placeholder Data:** Zero `Lorem Ipsum`, dummy text, or synthetic placeholder signals in production views.

---

## 3. Four Connected Views & Navigation

The navigation bar presents institutional section indexing (`01 RADAR FEED`, `02 EXPOSURE MATRIX`, `03 EXECUTIVE BRIEFS (2P PDF)`, `04 METHODOLOGY`), accompanied by an external `LINKEDIN` reference.

### 3.1 `01 /` — Radar Feed & Active Threats
- **Institutional Top Bar:** Constant `TLP:CLEAR` classification banner with institutional header and release jurisdiction.
- **Masthead:** Formal publication masthead with title, scope, and editorial attribution.
- **Real-Time Signal Bar:** Top telemetry ticker displaying:
  1. Last Ingest CET
  2. Signals Monitored (Rolling 30-Day window)
  3. NIS2 Exposure Alerts (`HIGH`)
  4. Hybrid/Kinetic Threat Count
  5. Published Executive Briefs Count
- **Two-Column Desktop Architecture:**
  - **Left Rail (38% width):**
    - Non-duplicated sector and threat vector filter controls with instant reset capability.
    - Compact 30-Day 6x5 Exposure Matrix overview widget.
  - **Right Rail (62% width):**
    - Instant live search input (queries title, summary, CVEs, and vectors).
    - Radar Feed cards with monospaced timestamps, severity flags, source provenance tags, and sector indicators.
    - Featured Executive Brief highlight card pinned at the conclusion of the feed.
- **Slide-Over Right-Hand Detail Drawer:**
  - Accessible via feed card selection; supports keyboard navigation (`Esc` to dismiss).
  - Displays full threat intelligence summary, CVE references, EPSS score & percentile indicators.
  - NIS2 24h Early Warning / 72h Incident Notification regulatory action guidance.
  - Direct outbound hyperlink to authoritative primary source.
  - One-click "Copy Analytic Citation" button (formatted in standard CTI citation style).
- **Mobile Adaptations:** Collapsible filter accordion, single-column feed stack, and full-screen responsive detail modal.

### 3.2 `02 /matrix` — 30-Day Cross-Sector Exposure Matrix
- **Full-Width Interactive 6x5 Heatmap:**
  - **6 Sectors:** `Energy`, `Defense`, `Transport`, `Digital`, `Space`, `Public Admin`.
  - **5 Threat Vectors:** `Cyber/KEV`, `Espionage/Proxies`, `Sabotage`, `Influence`, `Reg/Sanc`.
- **Styling:** Monochrome stone-to-Oxford stepped color scale representing threat density.
- **Interactive Routing:** Clicking any non-zero coordinate redirects to `/?sector={sector}&vector={vector}` with an active filter alert banner and quick-reset action.

### 3.3 `03 /briefs` — Executive Briefs Archive (2-Page PDFs)
- **Editorial Archive Grid:** Two-column structured publication grid reading directly from `data/briefs.json` and linked to static 2-page PDF artifacts in `public/briefs/`.
- **Card Metadata:**
  - Unique Document Identifier (`Doc ID` e.g., `EHRM-EB-2026-001`).
  - Handling Marking (`TLP:CLEAR`).
  - Strategic Pillar & Date of Assessment.
  - Analytic Confidence Level (`High`, `Moderate`, `Low`).
  - Headline & Subtitle.
  - Three (3) Bulleted Key Judgments.
  - Action Controls: "Open PDF" (in-browser inspection) and "Download 2P PDF".

### 3.4 `04 /methodology` — Methodology, Taxonomy & Sources
- **Editorial Reading Column:** Constrained max-width container (`760px`) engineered for focused institutional reading.
- **Intel Architecture Documentation:**
  - **Tier 1:** Deterministic automated signals from primary sovereign sources, updated daily.
  - **Tier 2:** Human-audited, analyst-curated 2-page Executive Briefs produced with rigorous analytic tradecraft.
- **Taxonomy Frameworks:** NIS2 directive incident reporting requirements, Hybrid Threat vectors, FIRST TLP standards, and NATO/IC-aligned estimative language.
- **Dynamic Live Source-Status Table:** Ingested directly from `data/meta.json` displaying monitored feed names, tiers, URLs, ingestion status, and error diagnostic logs.
- **Analyst Attribution Block:** Formal attribution to Analyst Xabier Barbero with outbound LinkedIn verification link.

---

## 4. Primary Data Sources & Zero-Key Ingestion
Automated daily execution scheduled at 07:00 UTC (08:00 CET) via GitHub Actions using Python (`scripts/ingest.py`).

### 4.1 Ingestion Sources
1. **Official CISA KEV JSON Catalog:** Rolling 45-day window evaluation, deterministically enriched via the free public FIRST EPSS API (`https://api.first.org/data/v1/epss`) to calculate 30-day exploitation probability (`epss_score` and `epss_percentile`).
2. **Official European Union, National CERT & Multilateral Security Sources (`Official` tier — ≥75% of total signals):**
   - **European Union CSIRTs & Cyber Authorities:** CERT-EU (`cert.europa.eu`), ENISA (`enisa.europa.eu`), CERT-FR / ANSSI (`cert.ssi.gouv.fr`), NCSC-NL (`advisories.ncsc.nl`), and NCSC-UK (`ncsc.gov.uk`).
   - **European Union Diplomatic, Sanctions & FIMI Authorities:** European External Action Service / Council of the EU Press Material (`eeas.europa.eu`), EUvsDisinfo (`euvsdisinfo.eu`), and EU Institute for Security Studies (`EUISS`, `iss.europa.eu`).
   - **Joint EU/NATO Counter-Hybrid Institution:** European Centre of Excellence for Countering Hybrid Threats (`Hybrid CoE`, `hybridcoe.fi`).
3. **Specialized OSINT & European Strategic Research (strictly capped per source):**
   - Hybrid Threat & OSINT Observatories: Bellingcat (`bellingcat.com`), Atlantic Council DFRLab (`dfrlab.org`).
   - European Strategic Policy: Center for European Policy Analysis (`CEPA`, `cepa.org`).

---

## 5. Master JSON Data Contracts

### 5.1 `data/signals.json`
An array of individual threat signals conforming to the following structure:
```json
[
  {
    "id": "SIG-20261119-001",
    "published_at": "2026-11-19",
    "title": "Signal Title in Institutional Style",
    "summary": "Plain text factual summary stripped of all HTML tags, truncated to maximum 220 characters.",
    "source_name": "CERT-EU",
    "source_tier": "Official",
    "source_url": "https://...",
    "domain": "cyber_kev",
    "vectors": ["Cyber/KEV"],
    "sectors": ["Energy", "Digital"],
    "regulations": ["NIS2"],
    "exposure": "HIGH",
    "cve_ids": ["CVE-2026-1234"],
    "epss_score": 0.654,
    "epss_percentile": 0.942,
    "ransomware_known": true
  }
]
```
- `source_tier`: `"Official"` | `"OSINT"` | `"Think Tank"` | `"CTI"`
- `domain`: `"cyber_kev"` | `"hybrid_geo"` | `"defense_reg"`
- `exposure`: `"HIGH"` | `"MODERATE"` | `"LOW"`

### 5.2 `data/meta.json`
Telemetry summary and feed operational health:
```json
{
  "last_ingest_utc": "2026-11-19T07:00:00Z",
  "last_ingest_cet": "2026-11-19 08:00 CET",
  "signals_total_30d": 142,
  "nis2_exposure_alerts": 18,
  "hybrid_kinetic_count": 7,
  "briefs_count": 4,
  "feeds_status": [
    {
      "name": "CERT-EU Security Advisories",
      "tier": "Official",
      "url": "https://cert.europa.eu/feed",
      "status": "OK",
      "items_ingested": 12,
      "error": null
    }
  ]
}
```

### 5.3 `data/briefs.json`
Published Executive Brief catalog:
```json
[
  {
    "id": "EHRM-EB-2026-001",
    "title": "Baltic Undersea Infrastructure: Sabotage Vulnerabilities & NIS2 Maritime Energy Impact",
    "subtitle": "Analysis of hybrid maritime surveillance and critical subsea cable vulnerabilities.",
    "pillar": "Critical Infrastructure & Hybrid Threats",
    "date": "2026-11-15",
    "tlp": "TLP:CLEAR",
    "confidence": "High",
    "featured": true,
    "pdf_url": "/briefs/EHRM-EB-2026-001-baltic-undersea-infrastructure.pdf",
    "key_judgments": [
      "Subsea fiber and power interconnections remain primary targets for deniable Russian state-affiliated maritime reconnaissance.",
      "NIS2 Article 21 risk management mandates necessitate cross-border incident correlation within 24 hours of telemetry disruption.",
      "Multi-vector defense postures combining coastal radar with satellite AIS anomaly detection provide optimal early warning."
    ]
  }
]
```
