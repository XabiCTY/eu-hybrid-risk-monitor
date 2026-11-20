import type { ExecutiveBrief } from "@/lib/types";

export function KeyJudgmentList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((kj, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-oxford" />
          <span>{kj}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BriefCard({ brief }: { brief: ExecutiveBrief }) {
  const tags = [brief.pillar, ...(brief.sectors ?? []), ...(brief.vectors ?? [])];

  return (
    <article className="flex flex-col border border-rule bg-surface p-5">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
        {brief.id} | {brief.tlp} | {brief.date} | CONFIDENCE: {brief.confidence.toUpperCase()}
      </p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {tags.map((t) => (
          <li
            key={t}
            className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase text-ink"
          >
            {t}
          </li>
        ))}
      </ul>

      <h3 className="mt-4 font-serif text-2xl font-semibold leading-snug text-ink">
        {brief.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{brief.subtitle}</p>

      <h4 className="mt-5 font-mono text-[11px] uppercase tracking-wider text-muted">
        Key Judgments
      </h4>
      <KeyJudgmentList items={brief.key_judgments} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={brief.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 border border-oxford bg-oxford px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wide text-paper"
        >
          OPEN PDF IN BROWSER ↗
        </a>
        <a
          href={brief.pdf_url}
          download
          className="flex-1 border border-oxford bg-surface px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wide text-oxford"
        >
          DOWNLOAD 2P PDF
        </a>
      </div>
    </article>
  );
}
