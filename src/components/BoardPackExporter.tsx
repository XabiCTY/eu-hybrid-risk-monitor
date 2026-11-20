"use client";

import { useEffect, useRef, useState } from "react";
import { AUTHOR_NAME } from "@/lib/constants";
import {
  PRINT_LIMIT,
  buildCsv,
  buildExecSummary,
  countHigh,
  downloadCsv,
  sortRecent,
  writeClipboard,
} from "@/lib/export";
import type { MetaData, Signal } from "@/lib/types";

interface ExporterProps {
  signals: Signal[];
  meta: MetaData;
  scope: string;
}

const BTN =
  "border border-oxford bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-oxford hover:bg-stone";

/** Screen-only utility bar: print, copy and CSV export of the filtered radar. */
export default function BoardPackExporter({
  signals,
  meta,
  scope,
}: ExporterProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  async function handleCopy() {
    await writeClipboard(buildExecSummary(signals, meta, scope));
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }

  function handleCsv() {
    downloadCsv(
      `eu-hybrid-risk-pack-${meta.last_ingest_utc.slice(0, 10)}.csv`,
      buildCsv(signals),
    );
  }

  return (
    <div
      role="group"
      aria-label="Weekly board pack export"
      className="mt-4 flex flex-wrap items-center gap-2 border border-rule bg-surface px-3 py-2 print:hidden"
    >
      <span className="mr-2 font-mono text-[11px] uppercase tracking-wide text-muted">
        Board Pack ({signals.length})
      </span>
      <button
        type="button"
        onClick={() => window.print()}
        disabled={signals.length === 0}
        className={`${BTN} disabled:opacity-50`}
      >
        PRINT / SAVE PDF BRIEF
      </button>
      <button
        type="button"
        onClick={handleCopy}
        disabled={signals.length === 0}
        className={`${BTN} disabled:opacity-50`}
        aria-live="polite"
      >
        {copied ? "COPIED ✓" : "COPY EXEC SUMMARY"}
      </button>
      <button
        type="button"
        onClick={handleCsv}
        disabled={signals.length === 0}
        className={`${BTN} disabled:opacity-50`}
      >
        EXPORT CSV
      </button>
    </div>
  );
}

/** Print-only Executive Board Pack sheet (hidden on screen). */
export function BoardPackSheet({ signals, meta, scope }: ExporterProps) {
  const ordered = sortRecent(signals);
  const rows = ordered.slice(0, PRINT_LIMIT);
  const high = countHigh(signals);

  return (
    <section
      className="print-board-pack hidden print:block"
      aria-label="Executive board pack"
    >
      <p className="pack-band">
        TLP: CLEAR // EUROPEAN HYBRID &amp; GEOPOLITICAL RISK MONITOR —
        EXECUTIVE BRIEFING PACK
      </p>
      <dl className="pack-meta">
        <div>
          <dt>GENERATED FROM INGEST</dt>
          <dd>{meta.last_ingest_cet}</dd>
        </div>
        <div>
          <dt>ACTIVE SCOPE</dt>
          <dd>{scope}</dd>
        </div>
        <div>
          <dt>SIGNALS INCLUDED</dt>
          <dd>
            {signals.length} (HIGH EXPOSURE: {high})
          </dd>
        </div>
        <div>
          <dt>CURATED BY</dt>
          <dd>{AUTHOR_NAME.toUpperCase()}</dd>
        </div>
      </dl>

      {signals.length > rows.length ? (
        <p className="pack-note">
          Showing the {rows.length} most recent of {signals.length} signals in
          scope. Use EXPORT CSV for the complete list.
        </p>
      ) : null}

      <table className="pack-table">
        <thead>
          <tr>
            <th scope="col">Date / Signal ID</th>
            <th scope="col">Exposure</th>
            <th scope="col">Title / Source / URL</th>
            <th scope="col">Operational Theater</th>
            <th scope="col">NIS2 Sectors</th>
            <th scope="col">Attributed Actor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="mono">
                {s.published_at}
                <br />
                {s.id}
              </td>
              <td className={`mono ${s.exposure === "HIGH" ? "alert" : ""}`}>
                {s.exposure}
              </td>
              <td>
                <strong>{s.title}</strong>
                <br />
                <span className="mono">
                  {s.source_name} ({s.source_tier})
                </span>
                <br />
                <span className="mono url">{s.source_url}</span>
              </td>
              <td>{s.theaters.join("; ")}</td>
              <td>{s.sectors.join("; ")}</td>
              <td>{s.actors.length > 0 ? s.actors.join("; ") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pack-note">
        TLP:CLEAR. Automated signals indicate exposure; they are not an
        attribution or impact assessment. Source: public, keyless feeds.
      </p>
    </section>
  );
}
