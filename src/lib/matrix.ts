import { NIS2_SECTORS, THREAT_VECTORS } from "./constants";
import type { NIS2Sector, Signal, ThreatVector } from "./types";

const DAY_MS = 86_400_000;
export const WINDOW_DAYS = 30;

export type MatrixCells = Record<NIS2Sector, Record<ThreatVector, number>>;

export interface MatrixData {
  cells: MatrixCells;
  /** Distinct signals per sector inside the window. */
  rowTotals: Record<NIS2Sector, number>;
  /** Distinct signals per vector inside the window. */
  colTotals: Record<ThreatVector, number>;
  /** Highest single-cell count (scale anchor). */
  max: number;
  /** Signals inside the window. */
  windowed: Signal[];
  windowStart: string;
  windowEnd: string;
}

function dayNumber(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY_MS;
}

function dayString(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Deterministic rolling window: anchored to the ingest timestamp (or the latest
 * signal date) so server and client render identically. Never reads the clock.
 */
export function computeMatrix(signals: Signal[], anchorUtc: string): MatrixData {
  let anchor = dayNumber(anchorUtc);
  if (anchor === null) {
    const days = signals
      .map((s) => dayNumber(s.published_at))
      .filter((d): d is number => d !== null);
    anchor = days.length > 0 ? Math.max(...days) : 0;
  }
  const cutoff = anchor - WINDOW_DAYS;

  const windowed = signals.filter((s) => {
    const d = dayNumber(s.published_at);
    return d !== null && d >= cutoff && d <= anchor;
  });

  const cells = Object.fromEntries(
    NIS2_SECTORS.map((s) => [
      s,
      Object.fromEntries(THREAT_VECTORS.map((v) => [v, 0])),
    ]),
  ) as MatrixCells;
  const rowTotals = Object.fromEntries(
    NIS2_SECTORS.map((s) => [s, 0]),
  ) as Record<NIS2Sector, number>;
  const colTotals = Object.fromEntries(
    THREAT_VECTORS.map((v) => [v, 0]),
  ) as Record<ThreatVector, number>;

  for (const sig of windowed) {
    for (const s of sig.sectors) {
      rowTotals[s] += 1;
      for (const v of sig.vectors) cells[s][v] += 1;
    }
    for (const v of sig.vectors) colTotals[v] += 1;
  }

  let max = 0;
  for (const s of NIS2_SECTORS)
    for (const v of THREAT_VECTORS) max = Math.max(max, cells[s][v]);

  return {
    cells,
    rowTotals,
    colTotals,
    max,
    windowed,
    windowStart: dayString(cutoff),
    windowEnd: dayString(anchor),
  };
}

export type Tier = 0 | 1 | 2 | 3 | 4;

export function tierFor(count: number, max: number): Tier {
  if (count <= 0 || max <= 0) return 0;
  const r = count / max;
  if (r <= 0.25) return 1;
  if (r <= 0.5) return 2;
  if (r <= 0.75) return 3;
  return 4;
}
