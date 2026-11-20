import type { ExposureLevel, Signal } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/constants";

export function formatPercent(value: number | null): string | null {
  return value === null ? null : `${(value * 100).toFixed(1)}%`;
}

export function ExposureBadge({ level }: { level: ExposureLevel }) {
  const tone =
    level === "HIGH"
      ? "border-alert text-alert"
      : level === "MODERATE"
        ? "border-ink text-ink"
        : "border-rule text-muted";
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone}`}
    >
      {level}
    </span>
  );
}

interface SignalCardProps {
  signal: Signal;
  onOpen: (id: string) => void;
}

export default function SignalCard({ signal, onOpen }: SignalCardProps) {
  const epss = formatPercent(signal.epss_score);
  const firstCve = signal.cve_ids[0];
  const extraCves = signal.cve_ids.length - 1;
  const alertTone = signal.exposure === "HIGH" || signal.ransomware_known;

  return (
    <article>
      <button
        type="button"
        onClick={() => onOpen(signal.id)}
        aria-label={`Open signal details: ${signal.title}`}
        className="block w-full border border-rule bg-surface p-4 text-left hover:border-oxford sm:p-5"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="block font-mono text-[11px] uppercase tracking-wide text-muted">
            {signal.published_at} | {signal.id} | {DOMAIN_LABELS[signal.domain]}
          </span>
          <ExposureBadge level={signal.exposure} />
        </span>

        <span className="mt-3 block font-serif text-xl font-semibold leading-snug text-ink">
          {signal.title}
        </span>

        <span className="mt-2 block text-sm leading-relaxed text-muted">
          {signal.summary}
        </span>

        <span className="mt-3 block text-xs text-muted">
          Source: {signal.source_name} ({signal.source_tier})
        </span>

        {firstCve ? (
          <span className="mt-2 block font-mono text-[11px] text-ink">
            {firstCve}
            {extraCves > 0 ? ` +${extraCves}` : ""}
            {epss ? ` | EPSS ${epss}` : ""}
            {signal.ransomware_known ? (
              <span className="text-alert"> | RANSOMWARE: KNOWN</span>
            ) : null}
          </span>
        ) : null}

        <span className="mt-3 block font-mono text-[11px] uppercase tracking-wide text-muted">
          [{signal.regulations.join(" · ")} | {signal.sectors.join(" · ")} |{" "}
          {signal.vectors.join(" · ")} |{" "}
          <span className={alertTone ? "text-alert" : undefined}>
            EXPOSURE: {signal.exposure}
          </span>
          ]
        </span>
      </button>
    </article>
  );
}
