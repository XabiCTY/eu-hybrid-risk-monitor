import type { Metadata } from "next";
import SectionHeader from "@/components/SectionHeader";
import { AUTHOR_NAME, LINKEDIN_URL } from "@/lib/constants";
import { getMeta, getSignals } from "@/lib/data";

export const metadata: Metadata = {
  title: "Methodology | European Hybrid & Geopolitical Risk Monitor",
  description:
    "Two-tier analytical architecture, NIS2 and hybrid threat taxonomy, TLP and confidence standards, and live source status.",
};

interface Row {
  term: string;
  text: string;
}

const SECTORS: Row[] = [
  { term: "Energy", text: "Electricity, oil and gas, LNG terminals, offshore wind, subsea power interconnectors and nuclear facilities." },
  { term: "Defense", text: "Defense industrial base, dual-use manufacturing, military logistics, procurement and secure military communications." },
  { term: "Transport", text: "Maritime shipping and ports, rail signalling and freight, aviation and air traffic control." },
  { term: "Digital", text: "Telecommunications, internet exchange points, subsea fibre, cloud and data centres, DNS and trust services." },
  { term: "Space", text: "Satellite constellations and ground segments, together with core financial market infrastructure." },
  { term: "Public Admin", text: "EU institutions, national ministries, municipal governance, electoral and identity infrastructure." },
];

const VECTORS: Row[] = [
  { term: "Cyber/KEV", text: "Known exploited vulnerabilities, zero-days, ransomware and denial-of-service against IT and OT assets." },
  { term: "Espionage/Proxies", text: "State-sponsored intrusion sets, proxy actors, intellectual property theft and reconnaissance." },
  { term: "Sabotage", text: "Physical or cyber-physical disruption: subsea cable damage, GNSS jamming, drone incursions, ICS tampering." },
  { term: "Influence", text: "Foreign information manipulation and interference, disinformation and covert influence operations." },
  { term: "Reg/Sanc", text: "Regulatory enforcement, export controls, sanctions and compliance obligations under EU law." },
];

const REGULATIONS: Row[] = [
  { term: "NIS2", text: "Directive (EU) 2022/2555. Art. 23 incident reporting: early warning within 24 hours, incident notification within 72 hours, final report within one month." },
  { term: "CER", text: "Directive (EU) 2022/2557 on the resilience of critical entities against physical and non-cyber risks." },
  { term: "EU AI Act", text: "Regulation (EU) 2024/1689 governing high-risk AI systems, including those deployed in critical infrastructure." },
  { term: "EU Sanctions", text: "EU restrictive measures, including the cyber sanctions framework (Council Decision (CFSP) 2019/797)." },
];

const EXPOSURE: Row[] = [
  { term: "HIGH", text: "KEV entry with known ransomware use; EPSS of 0.50 or above on critical infrastructure; direct cyberattack or physical sabotage targeting an EU institution or critical infrastructure." },
  { term: "MODERATE", text: "Standard KEV entry or EPSS between 0.15 and 0.49; state espionage or supply-chain activity; direct regulatory or sanctions developments." },
  { term: "LOW", text: "Contextual and strategic monitoring with indirect exposure for European entities." },
];

const CONFIDENCE: Row[] = [
  { term: "High", text: "Well-corroborated by multiple independent primary sources; low probability of deception; established technical telemetry." },
  { term: "Moderate", text: "Credible but partially corroborated, or single-source reporting; plausible indicators with remaining gaps." },
  { term: "Low", text: "Fragmentary, uncorroborated or conflicting reporting; speculative attribution." },
];

function DefinitionTable({ head, rows }: { head: string; rows: Row[] }) {
  return (
    <div className="mt-3 overflow-x-auto border border-rule">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-stone text-left font-mono text-[10px] uppercase tracking-wider text-muted">
            <th scope="col" className="w-[28%] border border-rule px-3 py-2">{head}</th>
            <th scope="col" className="border border-rule px-3 py-2">Definition</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.term} className="align-top odd:bg-surface even:bg-stone">
              <th scope="row" className="border border-rule px-3 py-2 text-left font-mono text-xs font-medium text-ink">
                {r.term}
              </th>
              <td className="border border-rule px-3 py-2 leading-relaxed text-ink">{r.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-10 font-serif text-xl font-semibold text-ink">{children}</h3>
  );
}

export default function MethodologyPage() {
  const meta = getMeta();
  const signals = getSignals();
  const official = signals.filter((s) => s.source_tier === "Official").length;
  const officialShare =
    signals.length > 0 ? ((official / signals.length) * 100).toFixed(1) : "0.0";

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeader title="04 // METHODOLOGY, TAXONOMY & SOURCES">
        <p>
          How signals are collected, classified and released, and which public
          sources are monitored.
        </p>
      </SectionHeader>

      <div className="max-w-[760px] text-[15px] leading-relaxed text-ink">
        <h3 className="font-serif text-xl font-semibold text-ink">
          Two-Tier Analytical Architecture
        </h3>
        <p className="mt-3">
          <strong>Tier 1 — Automated primary-source signals.</strong> A
          deterministic Python pipeline ingests the CISA Known Exploited
          Vulnerabilities catalogue, enriched with the FIRST EPSS 30-day
          exploitation probability, together with official European CSIRTs and
          EU institutions. Classification is rule-based on keywords and
          metadata, with no language-model inference. A signal indicates
          exposure; it is not an attribution or an impact assessment.
        </p>
        <p className="mt-3">
          <strong>Tier 2 — Executive Briefs (2-page PDF).</strong> Strategic
          assessments drafted with multi-agent assistance, fact-checked
          against primary sources and audited by a human analyst before
          release at TLP:CLEAR.
        </p>

        <H3>NIS2 &amp; Hybrid Threat Taxonomy</H3>
        <p className="mt-3">
          Every signal is mapped to at least one of six NIS2 critical sectors
          and one of five hybrid threat vectors.
        </p>
        <DefinitionTable head="Sector" rows={SECTORS} />
        <DefinitionTable head="Threat vector" rows={VECTORS} />
        <DefinitionTable head="EU framework" rows={REGULATIONS} />
        <DefinitionTable head="Exposure" rows={EXPOSURE} />

        <H3>FIRST TLP &amp; Estimative Confidence</H3>
        <p className="mt-3">
          <strong>TLP:CLEAR</strong> denotes information that may be disclosed
          without restriction. Only TLP:CLEAR material is published on this
          site; anything received at a more restrictive marking never leaves
          the private analytical pipeline. Confidence statements follow
          IC/NATO-aligned estimative language.
        </p>
        <DefinitionTable head="Confidence" rows={CONFIDENCE} />
      </div>

      <section aria-labelledby="sources-heading" className="mt-12">
        <h3
          id="sources-heading"
          className="font-serif text-xl font-semibold text-ink"
        >
          Live Monitored Sources &amp; Operational Health
        </h3>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-muted">
          Last ingest (CET): {meta.last_ingest_cet} | Official institutional
          share: {officialShare}% ({official} of {signals.length} signals)
        </p>
        <div className="mt-3 overflow-x-auto border border-rule">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-stone text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                <th scope="col" className="border border-rule px-3 py-2">Source</th>
                <th scope="col" className="border border-rule px-3 py-2">Tier</th>
                <th scope="col" className="border border-rule px-3 py-2">Status</th>
                <th scope="col" className="border border-rule px-3 py-2">Items Ingested</th>
                <th scope="col" className="border border-rule px-3 py-2">Endpoint / Notes</th>
              </tr>
            </thead>
            <tbody>
              {meta.feeds_status.map((f) => (
                <tr key={f.name} className="align-top odd:bg-surface even:bg-stone">
                  <th scope="row" className="border border-rule px-3 py-2 text-left font-medium text-ink">
                    {f.name}
                  </th>
                  <td className="border border-rule px-3 py-2 font-mono text-xs text-ink">{f.tier}</td>
                  <td
                    className={`border border-rule px-3 py-2 font-mono text-xs font-medium ${
                      f.status === "OK" ? "text-oxford" : "text-alert"
                    }`}
                  >
                    {f.status}
                  </td>
                  <td className="border border-rule px-3 py-2 font-mono text-xs text-ink">{f.items_ingested}</td>
                  <td className="border border-rule px-3 py-2 text-xs">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-oxford underline underline-offset-2"
                    >
                      {f.url}
                    </a>
                    {f.error ? (
                      <span className="mt-1 block text-alert">{f.error}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-labelledby="governance-heading"
        className="mt-12 max-w-[760px] border border-rule bg-stone p-5"
      >
        <h3
          id="governance-heading"
          className="font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          Authorship &amp; Governance
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-ink">
          Curated and analysed by <strong>{AUTHOR_NAME}</strong>,
          International Relations, Security &amp; CTI Analyst. This public
          portal is strictly separated from the author&apos;s private
          brief-generation pipeline and is built exclusively on public,
          keyless sources.
        </p>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-[11px] uppercase tracking-wide text-oxford underline underline-offset-2"
        >
          LINKEDIN ↗
        </a>
      </section>
    </main>
  );
}
