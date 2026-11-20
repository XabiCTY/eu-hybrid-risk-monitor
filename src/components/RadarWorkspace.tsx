"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DOMAINS, DOMAIN_LABELS, NIS2_SECTORS, THREAT_VECTORS } from "@/lib/constants";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  matchesFilters,
  type FilterState,
} from "@/lib/filter";
import type {
  ExecutiveBrief,
  ExposureLevel,
  NIS2Sector,
  Signal,
  SignalDomain,
  ThreatVector,
} from "@/lib/types";
import ExposureHeatmap from "./ExposureHeatmap";
import FeaturedBriefModule from "./FeaturedBriefModule";
import RadarFilters from "./RadarFilters";
import SignalCard from "./SignalCard";
import SignalDrawer from "./SignalDrawer";

const PAGE_SIZE = 25;

interface SharedProps {
  signals: Signal[];
  briefs: ExecutiveBrief[];
  anchorUtc: string;
}

interface InnerProps extends SharedProps {
  initialSector: NIS2Sector | null;
  initialVector: ThreatVector | null;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function RadarInner({
  signals,
  briefs,
  anchorUtc,
  initialSector,
  initialVector,
}: InnerProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    sectors: initialSector ? [initialSector] : [],
    vectors: initialVector ? [initialVector] : [],
  });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const update = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setVisible(PAGE_SIZE);
  }, []);

  const filtered = useMemo(
    () => signals.filter((s) => matchesFilters(s, filters)),
    [signals, filters],
  );

  const sectorCounts = useMemo(() => {
    const counts = Object.fromEntries(NIS2_SECTORS.map((s) => [s, 0])) as Record<NIS2Sector, number>;
    for (const sig of signals) {
      if (!matchesFilters(sig, filters, "sectors")) continue;
      for (const s of sig.sectors) counts[s] += 1;
    }
    return counts;
  }, [signals, filters]);

  const vectorCounts = useMemo(() => {
    const counts = Object.fromEntries(THREAT_VECTORS.map((v) => [v, 0])) as Record<ThreatVector, number>;
    for (const sig of signals) {
      if (!matchesFilters(sig, filters, "vectors")) continue;
      for (const v of sig.vectors) counts[v] += 1;
    }
    return counts;
  }, [signals, filters]);

  const selected = useMemo(
    () => signals.find((s) => s.id === selectedId) ?? null,
    [signals, selectedId],
  );

  const closeDrawer = useCallback(() => setSelectedId(null), []);

  function reset() {
    setFilters(EMPTY_FILTERS);
    setVisible(PAGE_SIZE);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  const featuredBrief = briefs.find((b) => b.featured) ?? briefs[0] ?? null;

  const activeSector = filters.sectors.length === 1 ? filters.sectors[0] : null;
  const activeVector = filters.vectors.length === 1 ? filters.vectors[0] : null;

  function handleMatrixSelect(sector: NIS2Sector, vector: ThreatVector) {
    if (activeSector === sector && activeVector === vector) {
      reset();
      return;
    }
    setFilters({ ...EMPTY_FILTERS, sectors: [sector], vectors: [vector] });
    setVisible(PAGE_SIZE);
    window.history.replaceState(
      null,
      "",
      `?sector=${encodeURIComponent(sector)}&vector=${encodeURIComponent(vector)}`,
    );
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document
        .getElementById("radar-feed")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const active = hasActiveFilters(filters);
  const secondaryActive =
    filters.sectors.length + filters.vectors.length + (filters.exposure !== "all" ? 1 : 0);

  const domainTabs: { value: SignalDomain | "all"; label: string }[] = [
    { value: "all", label: "All" },
    ...DOMAINS.map((d) => ({ value: d, label: DOMAIN_LABELS[d] })),
  ];

  const summaryParts: string[] = [];
  if (filters.query.trim()) summaryParts.push(`Search: "${filters.query.trim()}"`);
  if (filters.domain !== "all") summaryParts.push(`Domain: ${DOMAIN_LABELS[filters.domain]}`);
  if (filters.sectors.length) summaryParts.push(`Sector: ${filters.sectors.join(", ")}`);
  if (filters.vectors.length) summaryParts.push(`Vector: ${filters.vectors.join(", ")}`);
  if (filters.exposure !== "all") summaryParts.push(`Exposure: ${filters.exposure}`);

  const shown = filtered.slice(0, visible);

  return (
    <div className="lg:grid lg:grid-cols-[38fr_62fr] lg:gap-10">
      <aside aria-label="Radar filters" className="mb-6 lg:mb-0">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="radar-filter-panel"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex w-full items-center justify-between border border-rule bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink lg:hidden"
        >
          <span>
            Filters{secondaryActive > 0 ? ` (${secondaryActive} active)` : ""}
          </span>
          <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
        </button>

        <div
          id="radar-filter-panel"
          className={`${filtersOpen ? "block" : "hidden"} border border-t-0 border-rule bg-surface p-4 lg:block lg:border-t lg:p-5`}
        >
          <RadarFilters
            filters={filters}
            sectorCounts={sectorCounts}
            vectorCounts={vectorCounts}
            onToggleSector={(s) => update({ sectors: toggle(filters.sectors, s) })}
            onToggleVector={(v) => update({ vectors: toggle(filters.vectors, v) })}
            onExposure={(e: ExposureLevel | "all") => update({ exposure: e })}
          />
        </div>

        <div className="mt-6">
          <ExposureHeatmap
            signals={signals}
            anchorUtc={anchorUtc}
            variant="compact"
            activeSector={activeSector}
            activeVector={activeVector}
            onSelect={handleMatrixSelect}
          />
        </div>
      </aside>

      <section id="radar-feed" aria-label="Radar feed" className="scroll-mt-4">
        <div>
          <label htmlFor="radar-search" className="sr-only">
            Search signals
          </label>
          <input
            id="radar-search"
            type="search"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search title, summary, source, CVE, sector or vector"
            className="w-full border border-rule bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {domainTabs.map((t) => {
            const isActive = filters.domain === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => update({ domain: t.value })}
                className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide ${
                  isActive
                    ? "border-oxford bg-oxford text-paper"
                    : "border-rule bg-surface text-ink hover:border-oxford"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-rule bg-stone px-3 py-2">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted" aria-live="polite">
            Showing {filtered.length} of {signals.length} signals
            {summaryParts.length > 0 ? ` | ${summaryParts.join(" | ")}` : ""}
          </p>
          {active ? (
            <button
              type="button"
              onClick={reset}
              className="border border-oxford bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-oxford"
            >
              RESET FILTERS
            </button>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 border border-rule bg-surface p-6">
            <p className="font-serif text-lg text-ink">
              No signals match the active filters.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 border border-oxford bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-oxford"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {shown.map((s) => (
              <li key={s.id}>
                <SignalCard signal={s} onOpen={setSelectedId} />
              </li>
            ))}
          </ul>
        )}

        {filtered.length > shown.length ? (
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="mt-4 w-full border border-oxford bg-surface px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-oxford"
          >
            SHOW MORE ({filtered.length - shown.length} REMAINING)
          </button>
        ) : null}

        <FeaturedBriefModule brief={featuredBrief} />
      </section>

      <SignalDrawer signal={selected} onClose={closeDrawer} />
    </div>
  );
}

function ParamAware(props: SharedProps) {
  const params = useSearchParams();
  const sectorParam = params.get("sector");
  const vectorParam = params.get("vector");
  const sector = NIS2_SECTORS.find((s) => s === sectorParam) ?? null;
  const vector = THREAT_VECTORS.find((v) => v === vectorParam) ?? null;
  // Re-mount when the query string changes (e.g. arriving from the matrix).
  return (
    <RadarInner
      key={`${sector ?? ""}|${vector ?? ""}`}
      {...props}
      initialSector={sector}
      initialVector={vector}
    />
  );
}

export default function RadarWorkspace(props: SharedProps) {
  return (
    <Suspense
      fallback={
        <RadarInner {...props} initialSector={null} initialVector={null} />
      }
    >
      <ParamAware {...props} />
    </Suspense>
  );
}
