"use client";

import { useEffect, useRef, useState } from "react";
import { DOMAIN_LABELS } from "@/lib/constants";
import { writeClipboard } from "@/lib/export";
import type { Signal } from "@/lib/types";
import { ExposureBadge, formatPercent } from "./SignalCard";

interface SignalDrawerProps {
  signal: Signal | null;
  onClose: () => void;
}

function buildCitation(s: Signal): string {
  const actor =
    s.actors.length > 0 ? ` Attributed actor: ${s.actors.join(", ")}.` : "";
  return `[${s.id}] "${s.title}" — ${s.source_name}, ${s.published_at}. Sectors: ${s.sectors.join(", ")}. Theater: ${s.theaters.join(", ")}.${actor} Exposure: ${s.exposure}. URL: ${s.source_url}`;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function Panel({ signal, onClose }: { signal: Signal; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  async function handleCopy() {
    await writeClipboard(buildCitation(signal));
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }

  const epss = formatPercent(signal.epss_score);
  const percentile = formatPercent(signal.epss_percentile);
  const hasNis2 = signal.regulations.includes("NIS2");

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[#161616]/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-rule bg-surface sm:w-[540px]"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
            {signal.id} | {signal.published_at}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="border border-rule bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink hover:border-oxford"
          >
            CLOSE [ESC]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <ExposureBadge level={signal.exposure} />
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
              {DOMAIN_LABELS[signal.domain]}
            </span>
          </div>

          <h2
            id="drawer-title"
            className="mt-3 font-serif text-2xl font-semibold leading-snug text-ink"
          >
            {signal.title}
          </h2>

          <p className="mt-3 text-sm text-muted">
            Source: {signal.source_name} ({signal.source_tier})
          </p>

          <p className="mt-4 text-[15px] leading-relaxed text-ink">
            {signal.summary}
          </p>

          {signal.cve_ids.length > 0 ? (
            <section className="mt-6 border border-rule p-4">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Vulnerability telemetry
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {signal.cve_ids.map((cve) => (
                  <li
                    key={cve}
                    className="border border-rule bg-stone px-2 py-0.5 font-mono text-xs text-ink"
                  >
                    {cve}
                  </li>
                ))}
              </ul>
              <dl className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted">
                    EPSS (30-day exploitation probability)
                  </dt>
                  <dd className="mt-1 text-base text-ink">{epss ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted">
                    EPSS percentile
                  </dt>
                  <dd className="mt-1 text-base text-ink">
                    {percentile ?? "N/A"}
                  </dd>
                </div>
              </dl>
              {signal.ransomware_known ? (
                <p className="mt-3 border border-alert px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-alert">
                  Warning: known ransomware campaign use
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="mt-6">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Sectors
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {signal.sectors.map((s) => (
                <li
                  key={s}
                  className="border border-rule px-2 py-0.5 font-mono text-[11px] uppercase text-ink"
                >
                  {s}
                </li>
              ))}
            </ul>
            <h3 className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
              Threat vectors
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {signal.vectors.map((v) => (
                <li
                  key={v}
                  className="border border-rule px-2 py-0.5 font-mono text-[11px] uppercase text-ink"
                >
                  {v}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Operational Theaters
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {signal.theaters.map((t) => (
                <li
                  key={t}
                  className="border border-rule bg-stone px-2 py-0.5 font-mono text-[11px] uppercase text-ink"
                >
                  {t}
                </li>
              ))}
            </ul>
            {signal.actors.length > 0 ? (
              <>
                <h3 className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                  Explicitly Attributed Actors
                </h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {signal.actors.map((a) => (
                    <li
                      key={a}
                      className="border border-oxford px-2 py-0.5 font-mono text-[11px] uppercase text-oxford"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Named in the source text; never inferred by this platform.
                </p>
              </>
            ) : null}
          </section>

          <section className="mt-6 border border-rule bg-stone p-4">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Regulatory &amp; NIS2 impact
            </h3>
            <p className="mt-2 font-mono text-xs uppercase text-ink">
              Frameworks: {signal.regulations.join(" · ")}
            </p>
            {hasNis2 ? (
              <div className="mt-3">
                <p className="text-[13px] leading-relaxed text-ink">
                  Indicative NIS2 Art. 23 incident notification guidance for
                  essential and important entities affected by a significant
                  incident:
                </p>
                <ul className="mt-2 space-y-1 font-mono text-xs text-ink">
                  <li>24h — Early Warning to the CSIRT or competent authority</li>
                  <li>72h — Incident Assessment (severity, impact, indicators)</li>
                  <li>1 month — Final Report (root cause and mitigation)</li>
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Applicability depends on entity classification and incident
                  significance; this is analytic guidance, not legal advice.
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-rule px-5 py-4 sm:flex-row">
          <a
            href={signal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 border border-oxford bg-oxford px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wide text-paper"
          >
            {signal.source_tier === "Official"
              ? "OPEN OFFICIAL PRIMARY SOURCE ↗"
              : "OPEN SOURCE REPORT ↗"}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 border border-oxford bg-surface px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-oxford"
          >
            {copied ? "COPIED" : "COPY ANALYTIC CITATION"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignalDrawer({ signal, onClose }: SignalDrawerProps) {
  if (!signal) return null;
  return <Panel key={signal.id} signal={signal} onClose={onClose} />;
}
