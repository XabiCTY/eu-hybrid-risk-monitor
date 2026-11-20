import type { Metadata } from "next";
import Link from "next/link";
import ExposureHeatmap from "@/components/ExposureHeatmap";
import SectionHeader from "@/components/SectionHeader";
import { NIS2_SECTORS, THREAT_VECTORS } from "@/lib/constants";
import { getMeta, getSignals } from "@/lib/data";
import { formatDelta } from "@/lib/export";
import { computeMatrix } from "@/lib/matrix";
import type { TempoMetric } from "@/lib/types";

export const metadata: Metadata = {
  title: "Exposure Matrix | European Hybrid & Geopolitical Risk Monitor",
  description:
    "30-day sector by threat vector distribution, 7-day operational theater tempo, and explicitly attributed actors under NIS2.",
};

function TempoBadge({ metric }: { metric: TempoMetric | undefined }) {
  if (!metric) {
    return <span className="font-mono text-xs text-muted">—</span>;
  }
  if (metric.status === "ELEVATED") {
    return (
      <span className="inline-block border border-alert bg-surface px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-alert">
        ▲ {formatDelta(metric.delta_pct)} ELEVATED
      </span>
    );
  }
  if (metric.status === "QUIET") {
    return (
      <span className="font-mono text-xs uppercase tracking-wide text-muted">
        QUIET (0)
      </span>
    );
  }
  return (
    <span className="font-mono text-xs uppercase tracking-wide text-ink">
      — BASELINE ({formatDelta(metric.delta_pct)})
    </span>
  );
}

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
    const tempo = meta.tempo.by_sector.find((t) => t.name === sector);
    return { sector, count: data.rowTotals[sector], high, primary, tempo };
  });

  const unattributed30d = data.windowed.filter(
    (s) => s.actors.length === 0,
  ).length;

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
          Sector Exposure Breakdown (30D) &amp; 7-Day Escalation Tempo
        </h3>
        <div className="mt-3 overflow-x-auto border border-rule">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-stone text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                <th scope="col" className="border border-rule px-3 py-2">
                  Sector
                </th>
                <th scope="col" className="border border-rule px-3 py-2">
                  30D Signals
                </th>
                <th scope="col" className="border border-rule px-3 py-2">
                  HIGH Exposure Alerts
                </th>
                <th scope="col" className="border border-rule px-3 py-2">
                  Primary Threat Vector
                </th>
                <th scope="col" className="border border-rule px-3 py-2">
                  7D Tempo
                </th>
                <th scope="col" className="border border-rule px-3 py-2">
                  Radar
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sector} className="odd:bg-surface even:bg-stone">
                  <th
                    scope="row"
                    className="border border-rule px-3 py-2 text-left font-medium text-ink"
                  >
                    {r.sector}
                  </th>
                  <td className="border border-rule px-3 py-2 font-mono text-ink">
                    {r.count}
                  </td>
                  <td
                    className={`border border-rule px-3 py-2 font-mono ${
                      r.high > 0 ? "text-alert font-semibold" : "text-ink"
                    }`}
                  >
                    {r.high}
                  </td>
                  <td className="border border-rule px-3 py-2 font-mono text-xs uppercase text-ink">
                    {r.primary}
                  </td>
                  <td className="border border-rule px-3 py-2">
                    <TempoBadge metric={r.tempo} />
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

      <section aria-labelledby="theater-tempo-heading" className="mt-12">
        <h3
          id="theater-tempo-heading"
          className="font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          OPERATIONAL THEATER TEMPO (7D VS. 30D BASELINE) &amp; ATTRIBUTED
          ACTORS (30D)
        </h3>
        <div className="mt-3 grid gap-8 lg:grid-cols-[64fr_36fr]">
          <div>
            <div className="overflow-x-auto border border-rule">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="bg-stone text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                    <th scope="col" className="border border-rule px-3 py-2">
                      Operational Theater
                    </th>
                    <th scope="col" className="border border-rule px-3 py-2">
                      7D Count
                    </th>
                    <th scope="col" className="border border-rule px-3 py-2">
                      30D Count
                    </th>
                    <th scope="col" className="border border-rule px-3 py-2">
                      Weekly Baseline
                    </th>
                    <th scope="col" className="border border-rule px-3 py-2">
                      7D Delta / Status
                    </th>
                    <th scope="col" className="border border-rule px-3 py-2">
                      7D Radar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meta.tempo.by_theater.map((t) => (
                    <tr key={t.name} className="odd:bg-surface even:bg-stone">
                      <th
                        scope="row"
                        className="border border-rule px-3 py-2 text-left font-medium text-ink"
                      >
                        {t.name}
                      </th>
                      <td className="border border-rule px-3 py-2 font-mono text-ink">
                        {t.count_7d}
                      </td>
                      <td className="border border-rule px-3 py-2 font-mono text-ink">
                        {t.count_30d}
                      </td>
                      <td className="border border-rule px-3 py-2 font-mono text-muted">
                        {t.weekly_baseline_30d.toFixed(2)}
                      </td>
                      <td className="border border-rule px-3 py-2">
                        <TempoBadge metric={t} />
                      </td>
                      <td className="border border-rule px-3 py-2">
                        <Link
                          href={{
                            pathname: "/",
                            query: { theater: t.name, window: "7d" },
                          }}
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
            <p className="mt-2 font-mono text-[11px] text-muted">
              Note: ELEVATED status requires both count_7d ≥ 3 and delta ≥ +30%
              above the rolling 30-day weekly baseline (count_30d / 4.29).
            </p>
          </div>

          <div className="flex flex-col justify-between border border-rule bg-surface p-4">
            <div>
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Explicitly Attributed Actors (30D Window)
              </h4>
              {meta.top_actors_30d.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  No explicitly attributed actors recorded in the current 30-day
                  window.
                </p>
              ) : (
                <div className="mt-3 border border-rule">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-stone text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                        <th scope="col" className="border border-rule px-3 py-2">
                          Attributed Actor
                        </th>
                        <th scope="col" className="border border-rule px-3 py-2">
                          30D Signals
                        </th>
                        <th scope="col" className="border border-rule px-3 py-2">
                          Radar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {meta.top_actors_30d.map((actor) => (
                        <tr
                          key={actor.name}
                          className="odd:bg-surface even:bg-stone"
                        >
                          <th
                            scope="row"
                            className="border border-rule px-3 py-2 text-left font-mono text-xs font-medium text-ink"
                          >
                            {actor.name}
                          </th>
                          <td className="border border-rule px-3 py-2 font-mono text-xs text-ink">
                            {actor.count}
                          </td>
                          <td className="border border-rule px-3 py-2">
                            <Link
                              href={{
                                pathname: "/",
                                query: { actor: actor.name },
                              }}
                              className="font-mono text-[11px] uppercase tracking-wide text-oxford underline underline-offset-2"
                            >
                              PIVOT →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="mt-4 border-t border-rule pt-3 text-xs leading-relaxed text-muted">
              Strict Explicit-Only Attribution Policy: Actors are recorded only
              when explicitly named in primary or OSINT source text. In the
              current 30-day window,{" "}
              <span className="font-mono text-ink">
                {unattributed30d} of {data.windowed.length}
              </span>{" "}
              signals remain unattributed and are never synthetically assigned.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
