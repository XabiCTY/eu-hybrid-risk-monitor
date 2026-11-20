"use client";

import {
  EXPOSURE_LEVELS,
  GEOPOLITICAL_THEATERS,
  NIS2_SECTORS,
  THREAT_VECTORS,
} from "@/lib/constants";
import type { FilterState } from "@/lib/filter";
import type {
  ExposureLevel,
  NIS2Sector,
  Theater,
  ThreatVector,
} from "@/lib/types";

export interface ActorOption {
  name: string;
  count: number;
}

interface RadarFiltersProps {
  filters: FilterState;
  sectorCounts: Record<NIS2Sector, number>;
  vectorCounts: Record<ThreatVector, number>;
  theaterCounts: Record<Theater, number>;
  actorOptions: ActorOption[];
  onTheater: (t: Theater | "all") => void;
  onActor: (a: string) => void;
  onToggleSector: (s: NIS2Sector) => void;
  onToggleVector: (v: ThreatVector) => void;
  onExposure: (e: ExposureLevel | "all") => void;
}

const LEGEND =
  "mb-2 border-b border-rule pb-2 font-mono text-[11px] uppercase tracking-wider text-muted";

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink">
        <input
          type="checkbox"
          className="rule-check"
          checked={checked}
          onChange={onChange}
        />
        <span className="flex-1">{label}</span>
        <span className="font-mono text-xs text-muted">{count}</span>
      </label>
    </li>
  );
}

export default function RadarFilters({
  filters,
  sectorCounts,
  vectorCounts,
  theaterCounts,
  actorOptions,
  onTheater,
  onActor,
  onToggleSector,
  onToggleVector,
  onExposure,
}: RadarFiltersProps) {
  const exposureOptions: (ExposureLevel | "all")[] = ["all", ...EXPOSURE_LEVELS];

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={LEGEND}>Operational Theater</legend>
        <ul>
          {GEOPOLITICAL_THEATERS.map((t) => {
            const active = filters.theater === t;
            return (
              <li key={t}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onTheater(active ? "all" : t)}
                  className={`flex w-full items-center justify-between border px-2 py-1.5 text-left text-sm ${
                    active
                      ? "border-oxford bg-oxford text-paper"
                      : "border-transparent text-ink hover:border-rule"
                  }`}
                >
                  <span>{t}</span>
                  <span
                    className={`font-mono text-xs ${active ? "text-paper" : "text-muted"}`}
                  >
                    {theaterCounts[t]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className={LEGEND}>Attributed Actor</legend>
        <label htmlFor="actor-filter" className="sr-only">
          Attributed actor
        </label>
        <select
          id="actor-filter"
          value={filters.actor}
          onChange={(e) => onActor(e.target.value)}
          className="w-full border border-rule bg-surface px-2 py-2 font-mono text-xs text-ink"
        >
          <option value="all">All Actors / Unfiltered</option>
          {actorOptions.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name} ({a.count})
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Only explicitly named actors are listed; unattributed signals are
          never assigned an actor.
        </p>
      </fieldset>

      <fieldset>
        <legend className={LEGEND}>NIS2 Sector</legend>
        <ul>
          {NIS2_SECTORS.map((s) => (
            <CheckRow
              key={s}
              label={s}
              count={sectorCounts[s]}
              checked={filters.sectors.includes(s)}
              onChange={() => onToggleSector(s)}
            />
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className={LEGEND}>Threat Vector</legend>
        <ul>
          {THREAT_VECTORS.map((v) => (
            <CheckRow
              key={v}
              label={v}
              count={vectorCounts[v]}
              checked={filters.vectors.includes(v)}
              onChange={() => onToggleVector(v)}
            />
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className={LEGEND}>Exposure Level</legend>
        <div className="flex flex-wrap gap-2">
          {exposureOptions.map((e) => {
            const active = filters.exposure === e;
            return (
              <button
                key={e}
                type="button"
                aria-pressed={active}
                onClick={() => onExposure(e)}
                className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide ${
                  active
                    ? "border-oxford bg-oxford text-paper"
                    : "border-rule bg-surface text-ink hover:border-oxford"
                }`}
              >
                {e === "all" ? "All" : e}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
