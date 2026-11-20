"use client";

import Link from "next/link";
import { useMemo } from "react";
import { NIS2_SECTORS, THREAT_VECTORS } from "@/lib/constants";
import { computeMatrix, tierFor, type Tier } from "@/lib/matrix";
import type { NIS2Sector, Signal, ThreatVector } from "@/lib/types";

const TIER_BG: Record<Tier, string> = {
  0: "bg-stone",
  1: "bg-[#DADDE0]",
  2: "bg-[#A7AFB8]",
  3: "bg-[#5C6776]",
  4: "bg-oxford",
};

const TIER_TEXT: Record<Tier, string> = {
  0: "text-[#8A8A85]",
  1: "text-ink",
  2: "text-ink",
  3: "text-paper",
  4: "text-paper",
};

const TIER_LABEL: Record<Tier, string> = {
  0: "0",
  1: "≤25%",
  2: "≤50%",
  3: "≤75%",
  4: ">75%",
};

const VECTOR_SHORT: Record<ThreatVector, string> = {
  "Cyber/KEV": "CYBER",
  "Espionage/Proxies": "ESPION.",
  Sabotage: "SABOT.",
  Influence: "INFLU.",
  "Reg/Sanc": "REG/SANC",
};

interface ExposureHeatmapProps {
  signals: Signal[];
  /** meta.last_ingest_utc: deterministic anchor of the 30-day window. */
  anchorUtc: string;
  variant: "compact" | "full";
  activeSector?: NIS2Sector | null;
  activeVector?: ThreatVector | null;
  /** Compact variant: apply the sector x vector filter in place. */
  onSelect?: (sector: NIS2Sector, vector: ThreatVector) => void;
}

export default function ExposureHeatmap({
  signals,
  anchorUtc,
  variant,
  activeSector = null,
  activeVector = null,
  onSelect,
}: ExposureHeatmapProps) {
  const data = useMemo(() => computeMatrix(signals, anchorUtc), [signals, anchorUtc]);
  const compact = variant === "compact";

  function renderCell(sector: NIS2Sector, vector: ThreatVector) {
    const count = data.cells[sector][vector];
    const tier = tierFor(count, data.max);
    const label = `${sector} × ${vector}: ${count} ${count === 1 ? "signal" : "signals"}`;
    const size = compact ? "h-10 text-xs" : "h-16 text-base";
    const base = `flex w-full items-center justify-center font-mono ${size} ${TIER_BG[tier]} ${TIER_TEXT[tier]}`;

    if (count === 0) {
      return (
        <div className={base} title={label}>
          <span aria-hidden="true">0</span>
          <span className="sr-only">{label}</span>
        </div>
      );
    }

    const active = activeSector === sector && activeVector === vector;
    const interactive = `cursor-pointer hover:outline-2 hover:-outline-offset-2 hover:outline-ink ${
      active ? "outline-2 -outline-offset-2 outline-alert" : ""
    }`;

    if (compact) {
      return (
        <button
          type="button"
          aria-pressed={active}
          aria-label={`${label}. Filter radar feed`}
          title={`${label}. Click to filter radar feed`}
          onClick={() => onSelect?.(sector, vector)}
          className={`${base} ${interactive}`}
        >
          {count}
        </button>
      );
    }

    return (
      <Link
        href={{ pathname: "/", query: { sector, vector } }}
        aria-label={`${label}. Filter radar feed`}
        title={`${label}. Click to filter radar feed`}
        className={`${base} ${interactive}`}
      >
        {count}
      </Link>
    );
  }

  const headCell =
    "border border-rule bg-stone px-1 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-muted";

  return (
    <section aria-label="30-day exposure matrix">
      {compact ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted">
            30D Exposure Matrix
          </h2>
          <Link
            href="/matrix"
            className="font-mono text-[11px] uppercase tracking-wide text-oxford underline underline-offset-2"
          >
            EXPAND FULL MATRIX ↗
          </Link>
        </div>
      ) : null}

      <div className={compact ? "border border-rule bg-surface" : "overflow-x-auto border border-rule bg-surface"}>
        <table className={`w-full border-collapse ${compact ? "" : "min-w-[760px]"}`}>
          <caption className="sr-only">
            Signals per NIS2 sector and threat vector over the rolling 30-day window
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={`sticky left-0 z-10 ${headCell} text-left ${compact ? "w-[84px]" : "w-[150px]"}`}
              >
                Sector
              </th>
              {THREAT_VECTORS.map((v) => (
                <th key={v} scope="col" title={v} className={headCell}>
                  {compact ? VECTOR_SHORT[v] : v.replace("/", "/\u200b")}
                </th>
              ))}
              {compact ? null : (
                <th scope="col" className={`${headCell} w-[80px]`}>
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {NIS2_SECTORS.map((sector) => (
              <tr key={sector}>
                <th
                  scope="row"
                  className={`sticky left-0 z-10 border border-rule bg-surface px-2 py-1 text-left text-xs font-medium text-ink ${compact ? "" : "text-sm"}`}
                >
                  {sector}
                </th>
                {THREAT_VECTORS.map((vector) => (
                  <td key={vector} className="border border-rule p-0">
                    {renderCell(sector, vector)}
                  </td>
                ))}
                {compact ? null : (
                  <td className="border border-rule bg-stone px-2 text-center font-mono text-sm text-ink">
                    {data.rowTotals[sector]}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {compact ? null : (
            <tfoot>
              <tr>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border border-rule bg-stone px-2 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted"
                >
                  Total
                </th>
                {THREAT_VECTORS.map((v) => (
                  <td
                    key={v}
                    className="border border-rule bg-stone px-2 py-2 text-center font-mono text-sm text-ink"
                  >
                    {data.colTotals[v]}
                  </td>
                ))}
                <td className="border border-rule bg-stone px-2 py-2 text-center font-mono text-sm font-medium text-ink">
                  {data.windowed.length}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted">
        30D window: {data.windowStart} → {data.windowEnd} | {data.windowed.length} signals
      </p>

      {compact ? null : (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wide text-muted">
          <span>Intensity relative to peak cell ({data.max}):</span>
          {([0, 1, 2, 3, 4] as const).map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={`inline-block h-4 w-6 border border-rule ${TIER_BG[t]}`} />
              {TIER_LABEL[t]}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
