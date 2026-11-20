---
name: nis2-hybrid-taxonomy
description: Canonical classification taxonomy, exposure scoring rules, and intelligence standards for European hybrid and geopolitical risks.
---

# NIS2 & European Hybrid Threat Taxonomy

This document establishes the authoritative classification system shared by the automated Python ingestion pipeline (`scripts/taxonomy.py`) and the Next.js frontend presentation layers.

---

## 1. Six Canonical NIS2 Sectors

Signals must be mapped to one or more of the following 6 standard sectors, aligned with the European Union NIS2 Directive (Directive (EU) 2022/2555) and Critical Entities Resilience (CER) Directive:

1. **`Energy`**
   - Electricity generation, transmission, and distribution.
   - Oil and gas pipelines, LNG terminals, and offshore wind platforms.
   - Subsea power interconnections and nuclear facility management systems.
2. **`Defense`** (Defense & Dual-Use)
   - Sovereign defense industrial base (EDIRPA/ASAP recipients).
   - Military logistics, dual-use component manufacturing, and defense contractors.
   - Defense procurement systems and secure military communications.
3. **`Transport`** (Transport & Logistics)
   - Maritime shipping, port infrastructure, and automated container handling.
   - Rail signaling and freight traffic management.
   - Aviation air traffic control (Eurocontrol) and commercial air transport.
4. **`Digital`** (Digital Infrastructure)
   - Telecommunications networks (5G/6G) and Internet Exchange Points (IXPs).
   - Subsea fiber-optic telecommunications cables.
   - Cloud service providers, hyperscale data centers, DNS top-level domains, and trust service providers.
5. **`Space`** (Space & Financial Infrastructure)
   - Satellite constellations (Galileo, Copernicus, IRIS²), ground stations, and telemetry links.
   - Core financial market infrastructures, payment clearing systems (TARGET2/SWIFT), and central banks.
6. **`Public Admin`** (Public Administration)
   - EU institutions, national ministries (Foreign Affairs, Interior, Defense), and municipal governance.
   - Electoral infrastructure, identity verification services, and sovereign digital records.

---

## 2. Five Canonical Threat Vectors

Each monitored event or signal must be attributed to at least one of the 5 canonical hybrid vectors:

1. **`Cyber/KEV`**
   - Known Exploited Vulnerabilities (CISA KEV), zero-day exploits, ransomware campaigns, and distributed denial-of-service (DDoS) against critical operational technology (OT) or IT assets.
2. **`Espionage/Proxies`**
   - State-sponsored Advanced Persistent Threats (APTs), proxy commercial hacker rings, intellectual property theft targeting defense/clean-tech, and human intelligence (HUMINT) reconnaissance.
3. **`Sabotage`**
   - Physical or cyber-physical disruption of critical infrastructure: subsea cable severing, GPS/GNSS electronic warfare jamming, drone incursions over military/industrial sites, and industrial control system (ICS/SCADA) tampering.
4. **`Influence`**
   - Foreign Information Manipulation and Interference (FIMI), coordinated disinformation campaigns targeting European elections or social cohesion, synthetic media operations, and state-backed narrative warfare.
5. **`Reg/Sanc`**
   - Regulatory enforcement, export control crackdowns, EU sanction evasion networks, and compliance directives under NIS2, CER, and the EU AI Act.

---

## 3. EU Regulatory Frameworks & Compliance Timelines

### 3.1 NIS2 Incident Notification Mandates (Directive (EU) 2022/2555)
Entities subject to NIS2 must adhere to strict reporting deadlines upon becoming aware of a significant incident:
- **Within 24 Hours — Early Warning:** Initial alert to the national competent authority or CSIRT indicating whether the significant incident is suspected of being caused by unlawful or malicious acts, or could have a cross-border impact.
- **Within 72 Hours — Incident Notification:** Detailed notification updating the initial information, providing an initial assessment of the incident (its severity, impact, and indicators of compromise).
- **Within 1 Month — Final Report:** Detailed description of the incident, its root cause, applied mitigation measures, and estimated cross-border consequences.

### 3.2 Complementary Regulatory Directives
- **CER (Critical Entities Resilience Directive - EU 2022/2557):** Non-cyber physical resilience and cross-border risk assessments for critical entities.
- **EU AI Act (Regulation (EU) 2024/1689):** Governance and risk management for high-risk AI models deployed in critical infrastructure or border security.
- **EU Sanctions Regime:** Sanctions against cyber attacks threatening the Union or its Member States (Council Decision (CFSP) 2019/797).

---

## 4. Exposure Scoring Rules

Signals are classified into three deterministic exposure tiers:

1. **`HIGH`**
   - Active CISA KEV entry with documented ransomware campaign association.
   - FIRST EPSS score $\ge 0.50$ (50% probability of exploitation in the next 30 days) targeting critical infrastructure sectors.
   - Confirmed kinetic sabotage, physical asset tampering, or GNSS jamming affecting EU territorial critical infrastructure.
   - Significant operational downtime in Essential Entities under NIS2 Article 21.
2. **`MODERATE`**
   - Active CISA KEV vulnerability without confirmed ransomware campaigns, or EPSS between $0.15$ and $0.49$.
   - Targeted state-sponsored cyber espionage or supply-chain intrusion without confirmed destructive payload execution.
   - Direct regulatory enforcement or high-impact sanctions against strategic technology suppliers.
3. **`LOW`**
   - General geopolitical background, strategic think-tank policy analyses, or theoretical vulnerability disclosures without active exploitation telemetry.
   - Strategic situational monitoring with indirect exposure to European entities.

---

## 5. Classification & Analytic Standards

### 5.1 FIRST Traffic Light Protocol (TLP)
- **`TLP:CLEAR`**: Information is marked for public release without restriction. In accordance with platform OPSEC, **only `TLP:CLEAR` artifacts may be published or stored in this repository**.
- Information received at `TLP:GREEN`, `TLP:AMBER`, or `TLP:RED` must remain strictly within the private local pipeline and must never be committed.

### 5.2 Estimative Confidence Language
Standardized analytic confidence aligns with NATO and US Intelligence Community (ICD 203) tradecraft standards:
- **`High Confidence`**: Well-corroborated information from multiple independent primary sources; low probability of deception; established technical telemetry.
- **`Moderate Confidence`**: Credible single-source intelligence or partially corroborated reports; plausible technical indicators; some informational gaps remain.
- **`Low Confidence`**: Fragmentary, uncorroborated, or conflicting reporting; speculative technical attribution.
