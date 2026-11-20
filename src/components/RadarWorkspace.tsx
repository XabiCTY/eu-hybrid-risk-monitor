"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DOMAINS,
  DOMAIN_LABELS,
  GEOPOLITICAL_THEATERS,
  NIS2_SECTORS,
  THREAT_VECTORS,
} from "@/lib/constants";
import { elevatedTheaters, formatDelta } from "@/lib/export";
import {
  EMPTY_FILTERS,
  TIME_WINDOWS,
  WINDOW_LABELS,
  describeFilters,
  hasActiveFilters,
  inWindow,
  matchesFilters,
  type FilterState,
  type TimeWindow,
} from "@/lib/filter";
import type {
  ExecutiveBrief,
  ExposureLevel,
  MetaData,
  NIS2Sector,
  Signal,
  SignalDomain,
  Theater,
  ThreatVector,
} from "@/lib/types";
import BoardPackExporter, { BoardPackSheet } from "./BoardPackExporter";
import ExposureHeatmap from "./ExposureHeatmap";
import FeaturedBriefModule from "./FeaturedBriefModule";
import RadarFilters, { type ActorOption } from "./RadarFilters";
import SignalCard from "./SignalCard";
import SignalDrawer from "./SignalDrawer";

const PAGE_SIZE = 25;

interface SharedProps {
  signals: Signal[];
  briefs: ExecutiveBrief[];
  meta: MetaData;
}

interface InnerProps extends SharedProps {
  initial: FilterState;
  paramKey: string;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** URL-addressable subset of the filter state. */
function urlValues(f: FilterState): string[] {
  return [
    f.sectors.length === 1 ? f.sectors[0] : "",
    f.vectors.length === 1 ? f.vectors[0] : "",
    f.theater === "all" ? "" : f.theater,
    f.actor === "all" ? "" : f.actor,
    f.window === "all" ? "" : f.window,
  ];
}

const URL_KEYS = ["sector", "vector", "theater", "actor", "window"] as const;

function keyOfFilters(f: FilterState): string {
  return urlValues(f).join("|");
}

function writeUrl(f: FilterState): void {
  const params = new URLSearchParams();
  urlValues(f).forEach((v, i) => {
    if (v) params.set(URL_KEYS[i], v);
  });
  const qs = params.toString();
  const path = window.location.pathname;
  window.history.replaceState(null, "", qs ? `${path}?${qs}` : path);
}

function RadarInner({ signals, briefs, meta, initial, paramKey }: InnerProps) {
  const anchorUtc = meta.last_ingest_utc;
  const [filters, setFilters] = useState<FilterState>(initial);
  const [prevKey, setPrevKey] = useState(paramKey);
  const [selfKey, setSelfKey] = useState(paramKey);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // External URL change (e.g. arriving from the matrix): re-sync the filters.
  if (paramKey !== prevKey) {
    setPrevKey(paramKey);
    if (paramKey !== selfKey) {
      setSelfKey(paramKey);
      setFilters(initial);
      setVisible(PAGE_SIZE);
    }
  }

  const apply = useCallback(
    (next: FilterState) => {
      setFilters(next);
      setVisible(PAGE_SIZE);
      const key = keyOfFilters(next);
      if (key !== selfKey) {
        writeUrl(next);
        setSelfKey(key);
      }
    },
    [selfKey],
  );

  const update = useCallback(
    (patch: Partial<FilterState>) => apply({ ...filters, ...patch }),
    [apply, filters],
  );

  const filtered = useMemo(
    () => signals.filter((s) => matchesFilters(s, filters, anchorUtc)),
    [signals, filters, anchorUtc],
  );

  const sectorCounts = useMemo(() => {
    const counts = Object.fromEntries(NIS2_SECTORS.map((s) => [s, 0])) as Record<NIS2Sector, number>;
    for (const sig of signals) {
      if (!matchesFilters(sig, filters, anchorUtc, "sectors")) continue;
      for (const s of sig.sectors) counts[s] += 1;
    }
    return counts;
  }, [signals, filters, anchorUtc]);

  const vectorCounts = useMemo(() => {
    const counts = Object.fromEntries(THREAT_VECTORS.map((v) => [v, 0])) as Record<ThreatVector, number>;
    for (const sig of signals) {
      if (!matchesFilters(sig, filters, anchorUtc, "vectors")) continue;
      for (const v of sig.vectors) counts[v] += 1;
    }
    return counts;
  }, [signals, filters, anchorUtc]);

  const theaterCounts = useMemo(() => {
    const counts = Object.fromEntries(GEOPOLITICAL_THEATERS.map((t) => [t, 0])) as Record<Theater, number>;
    for (const sig of signals) {
      if (!matchesFilters(sig, filters, anchorUtc, "theater")) continue;
      for (const t of sig.theaters) counts[t] += 1;
    }
    return counts;
  }, [signals, filters, anchorUtc]);

  const actorOptions = useMemo<ActorOption[]>(() => {
    const counts = new Map<string, number>();
    for (const sig of signals) {
      const live = matchesFilters(sig, filters, anchorUtc, "actor");
      for (const a of sig.actors) {
        counts.set(a, (counts.get(a) ?? 0) + (live ? 1 : 0));
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [signals, filters, anchorUtc]);

  const windowCounts = useMemo(() => {
    const counts: Record<TimeWindow, number> = { all: 0, "30d": 0, "7d": 0 };
    for (const sig of signals) {
      if (!matchesFilters(sig, filters, anchorUtc, "window")) continue;
      for (const w of TIME_WINDOWS) {
        if (inWindow(sig, w, anchorUtc)) counts[w] += 1;
      }
    }
    return counts;
  }, [signals, filters, anchorUtc]);

  const elevated = useMemo(() => elevatedTheaters(meta), [meta]);

  const selected = useMemo(
    () => signals.find((s) => s.id === selectedId) ?? null,
    [signals, selectedId],
  );

  const closeDrawer = useCallback(() => setSelectedId(null), []);

  function reset() {
    apply(EMPTY_FILTERS);
  }

  function scrollToFeedOnMobile() {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document
        .getElementById("radar-feed")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    apply({ ...EMPTY_FILTERS, sectors: [sector], vectors: [vector] });
    scrollToFeedOnMobile();
  }

  function handleElevatedSelect(theater: Theater) {
    apply({ ...EMPTY_FILTERS, theater, window: "7d" });
    scrollToFeedOnMobile();
  }

  const active = hasActiveFilters(filters);
  const secondaryActive =
    filters.sectors.length +
    filters.vectors.length +
    (filters.exposure !== "all" ? 1 : 0) +
    (filters.theater !== "all" ? 1 : 0) +
    (filters.actor !== "all" ? 1 : 0);

  const domainTabs: { value: SignalDomain | "all"; label: string }[] = [
    { value: "all", label: "All" },
    ...DOMAINS.map((d) => ({ value: d, label: DOMAIN_LABELS[d] })),
  ];

  const summaryParts = describeFilters(filters);
  const scope = summaryParts.length > 0 ? summaryParts.join(" | ") : "All Signals";

  const shown = filtered.slice(0, visible);

  return (
    <>
      <div className="print:hidden">
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
                theaterCounts={theaterCounts}
                actorOptions={actorOptions}
                onTheater={(t) => update({ theater: t })}
                onActor={(a) => update({ actor: a })}
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
            <div
              className="border border-rule bg-stone px-3 py-2"
              aria-label="7-day escalation watch"
            >
              {elevated.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-alert">
                    ▲ 7D TEMPO ELEVATED:
                  </span>
                  {elevated.map((t) => {
                    const isActive =
                      filters.theater === t.name && filters.window === "7d";
                    return (
                      <button
                        key={t.name}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleElevatedSelect(t.name)}
                        className={`border border-alert px-2 py-1 font-mono text-[11px] uppercase tracking-wide ${
                          isActive
                            ? "bg-alert text-paper"
                            : "bg-surface text-alert hover:bg-stone"
                        }`}
                      >
                        {t.name} ({formatDelta(t.delta_pct)})
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
                  7D TEMPO: NO THEATER ELEVATED
                </p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="radar-search" className="sr-only">
                Search signals
              </label>
              <input
                id="radar-search"
                type="search"
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder="Search title, summary, source, CVE, sector, theater or actor"
                className="w-full border border-rule bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[11px] uppercase tracking-wide text-muted">
                Time Window
              </span>
              <div role="group" aria-label="Time window" className="flex">
                {TIME_WINDOWS.map((w, i) => {
                  const isActive = filters.window === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => update({ window: w })}
                      className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide ${
                        i > 0 ? "-ml-px" : ""
                      } ${
                        isActive
                          ? "border-oxford bg-oxford text-paper"
                          : "border-rule bg-surface text-ink hover:border-oxford"
                      }`}
                    >
                      {WINDOW_LABELS[w]} · {windowCounts[w]}
                    </button>
                  );
                })}
              </div>
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

            {summaryParts.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="Active filters">
                {summaryParts.map((p) => (
                  <li
                    key={p}
                    className="border border-rule bg-surface px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}

            <BoardPackExporter signals={filtered} meta={meta} scope={scope} />

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
      </div>

      <BoardPackSheet signals={filtered} meta={meta} scope={scope} />
    </>
  );
}

function ParamAware(props: SharedProps) {
  const params = useSearchParams();
  const sectorParam = params.get("sector");
  const vectorParam = params.get("vector");
  const theaterParam = params.get("theater");
  const actorParam = params.get("actor");
  const windowParam = params.get("window");

  const sector = NIS2_SECTORS.find((s) => s === sectorParam) ?? null;
  const vector = THREAT_VECTORS.find((v) => v === vectorParam) ?? null;
  const theater = GEOPOLITICAL_THEATERS.find((t) => t === theaterParam) ?? "all";
  const actor =
    actorParam && props.signals.some((s) => s.actors.includes(actorParam))
      ? actorParam
      : "all";
  const timeWindow = TIME_WINDOWS.find((w) => w === windowParam) ?? "all";

  const initial: FilterState = {
    ...EMPTY_FILTERS,
    sectors: sector ? [sector] : [],
    vectors: vector ? [vector] : [],
    theater,
    actor,
    window: timeWindow,
  };

  return <RadarInner {...props} initial={initial} paramKey={keyOfFilters(initial)} />;
}

export default function RadarWorkspace(props: SharedProps) {
  return (
    <Suspense
      fallback={
        <RadarInner
          {...props}
          initial={EMPTY_FILTERS}
          paramKey={keyOfFilters(EMPTY_FILTERS)}
        />
      }
    >
      <ParamAware {...props} />
    </Suspense>
  );
}
