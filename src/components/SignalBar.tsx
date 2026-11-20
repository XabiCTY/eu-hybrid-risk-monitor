import type { MetaData } from "@/lib/types";

interface Metric {
  label: string;
  value: string;
  alert?: boolean;
}

export default function SignalBar({ meta }: { meta: MetaData }) {
  const metrics: Metric[] = [
    { label: "LAST INGEST", value: meta.last_ingest_cet },
    { label: "SIGNALS MONITORED (30D)", value: String(meta.signals_total_30d) },
    {
      label: "EXPOSURE ALERTS (NIS2)",
      value: String(meta.nis2_exposure_alerts),
      alert: meta.nis2_exposure_alerts > 0,
    },
    { label: "HYBRID / KINETIC", value: String(meta.hybrid_kinetic_count) },
    { label: "EXECUTIVE BRIEFS", value: String(meta.briefs_count) },
  ];

  return (
    <section
      aria-label="Operational status"
      className="border-b border-t border-rule bg-stone"
    >
      <dl className="mx-auto grid w-full max-w-[1440px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="border-b border-r border-rule px-4 py-3 last:border-r-0 sm:px-6 lg:border-b-0 lg:px-8"
          >
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {m.label}
            </dt>
            <dd
              className={`mt-1 font-mono text-lg font-medium ${
                m.alert ? "text-alert" : "text-ink"
              }`}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
