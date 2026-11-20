import Link from "next/link";
import type { ExecutiveBrief } from "@/lib/types";
import { KeyJudgmentList } from "./BriefCard";

export default function FeaturedBriefModule({
  brief,
}: {
  brief: ExecutiveBrief | null;
}) {
  return (
    <section
      aria-labelledby="featured-brief-heading"
      className="mt-10 border-t border-rule pt-6"
    >
      <h3
        id="featured-brief-heading"
        className="font-mono text-[11px] uppercase tracking-wider text-muted"
      >
        FEATURED EXECUTIVE BRIEF
      </h3>

      {brief ? (
        <article className="mt-3 border border-rule bg-surface p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            {brief.id} | {brief.tlp} | {brief.date}
          </p>
          <h4 className="mt-3 font-serif text-2xl font-semibold leading-snug text-ink">
            {brief.title}
          </h4>
          <KeyJudgmentList items={brief.key_judgments} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={brief.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-oxford bg-oxford px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wide text-paper"
            >
              OPEN PDF ↗
            </a>
            <a
              href={brief.pdf_url}
              download
              className="border border-oxford bg-surface px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wide text-oxford"
            >
              DOWNLOAD 2P PDF
            </a>
            <Link
              href="/briefs"
              className="font-mono text-[11px] uppercase tracking-wide text-oxford underline underline-offset-2 sm:ml-auto"
            >
              VIEW ALL BRIEFS →
            </Link>
          </div>
        </article>
      ) : (
        <div className="mt-3 border border-rule bg-stone p-5">
          <p className="max-w-[560px] text-sm leading-relaxed text-ink">
            Tier 2 Executive Briefs (2-page PDF, TLP:CLEAR) are published only
            after human analyst audit. No brief has been released yet.
          </p>
          <Link
            href="/briefs"
            className="mt-3 inline-block font-mono text-[11px] uppercase tracking-wide text-oxford underline underline-offset-2"
          >
            VIEW BRIEFS ARCHIVE →
          </Link>
        </div>
      )}
    </section>
  );
}
