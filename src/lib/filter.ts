import { DOMAIN_LABELS } from "./constants";
import type {
  ExposureLevel,
  NIS2Sector,
  Signal,
  SignalDomain,
  Theater,
  ThreatVector,
} from "./types";

export type TimeWindow = "all" | "30d" | "7d";

export const TIME_WINDOWS: readonly TimeWindow[] = ["all", "30d", "7d"];

export const WINDOW_LABELS: Record<TimeWindow, string> = {
  all: "ALL (60D)",
  "30d": "30D",
  "7d": "7D",
};

export interface FilterState {
  query: string;
  domain: SignalDomain | "all";
  sectors: NIS2Sector[];
  vectors: ThreatVector[];
  exposure: ExposureLevel | "all";
  theater: Theater | "all";
  actor: string | "all";
  window: TimeWindow;
}

export type FilterGroup =
  | "domain"
  | "sectors"
  | "vectors"
  | "exposure"
  | "theater"
  | "actor"
  | "window";

export const EMPTY_FILTERS: FilterState = {
  query: "",
  domain: "all",
  sectors: [],
  vectors: [],
  exposure: "all",
  theater: "all",
  actor: "all",
  window: "all",
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.query.trim() !== "" ||
    f.domain !== "all" ||
    f.sectors.length > 0 ||
    f.vectors.length > 0 ||
    f.exposure !== "all" ||
    f.theater !== "all" ||
    f.actor !== "all" ||
    f.window !== "all"
  );
}

function haystack(s: Signal): string {
  return [
    s.id,
    s.title,
    s.summary,
    s.source_name,
    s.cve_ids.join(" "),
    s.sectors.join(" "),
    s.vectors.join(" "),
    s.theaters.join(" "),
    s.actors.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

const DAY_MS = 86_400_000;

/**
 * Deterministic window cutoff (YYYY-MM-DD, inclusive) anchored to the ingest
 * timestamp. Never reads the system clock.
 */
export function windowCutoff(anchorUtc: string, window: TimeWindow): string | null {
  if (window === "all") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(anchorUtc);
  if (!m) return null;
  const days = window === "7d" ? 7 : 30;
  const anchor = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(anchor - days * DAY_MS).toISOString().slice(0, 10);
}

export function inWindow(
  s: Signal,
  window: TimeWindow,
  anchorUtc: string,
): boolean {
  const cutoff = windowCutoff(anchorUtc, window);
  if (cutoff === null) return true;
  return s.published_at >= cutoff;
}

/**
 * Within a group selections combine with OR; across groups with AND.
 * `skip` omits one group (used to compute live facet counts).
 */
export function matchesFilters(
  s: Signal,
  f: FilterState,
  anchorUtc: string,
  skip?: FilterGroup,
): boolean {
  const q = f.query.trim().toLowerCase();
  if (q && !haystack(s).includes(q)) return false;
  if (skip !== "domain" && f.domain !== "all" && s.domain !== f.domain)
    return false;
  if (
    skip !== "sectors" &&
    f.sectors.length > 0 &&
    !f.sectors.some((x) => s.sectors.includes(x))
  )
    return false;
  if (
    skip !== "vectors" &&
    f.vectors.length > 0 &&
    !f.vectors.some((x) => s.vectors.includes(x))
  )
    return false;
  if (skip !== "exposure" && f.exposure !== "all" && s.exposure !== f.exposure)
    return false;
  if (
    skip !== "theater" &&
    f.theater !== "all" &&
    !s.theaters.includes(f.theater)
  )
    return false;
  if (skip !== "actor" && f.actor !== "all" && !s.actors.includes(f.actor))
    return false;
  if (skip !== "window" && !inWindow(s, f.window, anchorUtc)) return false;
  return true;
}

/** Human-readable active scope, shared by the feed summary and board pack. */
export function describeFilters(f: FilterState): string[] {
  const parts: string[] = [];
  if (f.query.trim()) parts.push(`Search: "${f.query.trim()}"`);
  if (f.domain !== "all") parts.push(`Domain: ${DOMAIN_LABELS[f.domain]}`);
  if (f.sectors.length) parts.push(`Sector: ${f.sectors.join(", ")}`);
  if (f.vectors.length) parts.push(`Vector: ${f.vectors.join(", ")}`);
  if (f.exposure !== "all") parts.push(`Exposure: ${f.exposure}`);
  if (f.theater !== "all") parts.push(`Theater: ${f.theater}`);
  if (f.actor !== "all") parts.push(`Actor: ${f.actor}`);
  if (f.window !== "all")
    parts.push(`Window: LAST ${WINDOW_LABELS[f.window]}`);
  return parts;
}
