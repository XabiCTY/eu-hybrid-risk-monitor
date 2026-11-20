"use client";

import { EXPOSURE_LEVELS, NIS2_SECTORS, THREAT_VECTORS } from "@/lib/constants";
import type { FilterState } from "@/lib/filter";
import type { ExposureLevel, NIS2Sector, ThreatVector } from "@/lib/types";

interface RadarFiltersProps {
  filters: FilterState;
  sectorCounts: Record<NIS2Sector, number>;
  vectorCounts: Record<ThreatVector, number>;
  onToggleSector: (s: NIS2Sector) => void;
  onToggleVector: (v: ThreatVector) => void;
  onExposure: (e: ExposureLevel | "all") => void;
}

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
  onToggleSector,
  onToggleVector,
  onExposure,
}: RadarFiltersProps) {
  const exposureOptions: (ExposureLevel | "all")[] = ["all", ...EXPOSURE_LEVELS];

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 border-b border-rule pb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
          NIS2 Sector
        </legend>
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
        <legend className="mb-2 border-b border-rule pb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
          Threat Vector
        </legend>
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
        <legend className="mb-2 border-b border-rule pb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
          Exposure Level
        </legend>
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
