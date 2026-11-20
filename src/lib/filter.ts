import type {
  ExposureLevel,
  NIS2Sector,
  Signal,
  SignalDomain,
  ThreatVector,
} from "./types";

export interface FilterState {
  query: string;
  domain: SignalDomain | "all";
  sectors: NIS2Sector[];
  vectors: ThreatVector[];
  exposure: ExposureLevel | "all";
}

export type FilterGroup = "domain" | "sectors" | "vectors" | "exposure";

export const EMPTY_FILTERS: FilterState = {
  query: "",
  domain: "all",
  sectors: [],
  vectors: [],
  exposure: "all",
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.query.trim() !== "" ||
    f.domain !== "all" ||
    f.sectors.length > 0 ||
    f.vectors.length > 0 ||
    f.exposure !== "all"
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
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Within a group selections combine with OR; across groups with AND.
 * `skip` omits one group (used to compute live facet counts).
 */
export function matchesFilters(
  s: Signal,
  f: FilterState,
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
  return true;
}
