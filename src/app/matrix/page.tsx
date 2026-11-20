import type { Metadata } from "next";
import Link from "next/link";
import ExposureHeatmap from "@/components/ExposureHeatmap";
import SectionHeader from "@/components/SectionHeader";
import { NIS2_SECTORS, THREAT_VECTORS } from "@/lib/constants";
import { getMeta, getSignals } from "@/lib/data";
import { computeMatrix } from "@/lib/matrix";

export const metadata: Metadata = {
  title: "Exposure Matrix | European Hybrid & Geopolitical Risk Monitor",
  description:
    "30-day sector by threat vector distribution of monitored signals under NIS2.",
};

export default function MatrixPage() {
  const signals = getSignals();
  const meta = getMeta();
  const data = computeMatrix(signals, meta.last_ingest_utc);

  const rows = NIS2_SECTORS.map((sector) => {
    const high = data.windowed.filter(
      (s) => s.exposure === "HIGH" && s.sectors.includes(sector),
    ).length;
    let primary: string = "—";
    let best = 0;
    for (const v of THREAT_VECTORS) {
      const c = data.cells[sector][v];
      if (c > best) {
        best = c;
        primary = v;
      }
    }
    return { sector, count: data.rowTotals[sector], high, primary };
  });

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeader title="02 // EXPOSURE MATRIX — 30-DAY SECTOR × VECTOR DISTRIBUTION">
        <p>
          Signals published within the rolling 30-day window ending{" "}
          {data.windowEnd}, distributed across the six NIS2 critical sectors
          and five hybrid threat vectors. A signal attributed to several
          sectors or vectors is counted in each corresponding cell, so cell
          values are not additive; row and column totals count distinct
          signals. Select any active cell to pivot directly into the filtered
          Radar Feed.
        </p>
      </SectionHeader>

      <ExposureHeatmap
        signals={signals}
        anchorUtc={meta.last_ingest_utc}
        variant="full"
      />

      <section aria-labelledby="sector-breakdown" className="mt-12">
        <h3
          id="sector-breakdown"
          className="font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          Sector Exposure Breakdown (30D)
        </h3>
        <div className="mt-3 overflow-x-auto border border-rule">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-stone text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                <th scope="col" className="border border-rule px-3 py-2">Sector</th>
                <th scope="col" className="border border-rule px-3 py-2">30D Signals</th>
                <th scope="col" className="border border-rule px-3 py-2">HIGH Exposure Alerts</th>
                <th scope="col" className="border border-rule px-3 py-2">Primary Threat Vector</th>
                <th scope="col" className="border border-rule px-3 py-2">Radar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sector} className="odd:bg-surface even:bg-stone">
                  <th scope="row" className="border border-rule px-3 py-2 text-left font-medium text-ink">
                    {r.sector}
                  </th>
                  <td className="border border-rule px-3 py-2 font-mono text-ink">{r.count}</td>
                  <td
                    className={`border border-rule px-3 py-2 font-mono ${
                      r.high > 0 ? "text-alert" : "text-ink"
                    }`}
                  >
                    {r.high}
                  </td>
                  <td className="border border-rule px-3 py-2 font-mono text-xs uppercase text-ink">
                    {r.primary}
                  </td>
                  <td className="border border-rule px-3 py-2">
                    <Link
                      href={{ pathname: "/", query: { sector: r.sector } }}
                      className="font-mono text-[11px] uppercase tracking-wide text-oxford underline underline-offset-2"
                    >
                      FILTER RADAR →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
