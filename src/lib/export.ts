import { AUTHOR_NAME } from "./constants";
import type { MetaData, Signal, TempoMetric, Theater } from "./types";

export const SUMMARY_LIMIT = 15;
export const PRINT_LIMIT = 25;

export async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }
}

export function elevatedTheaters(meta: MetaData): TempoMetric<Theater>[] {
  return meta.tempo.by_theater.filter((t) => t.status === "ELEVATED");
}

export function formatDelta(delta: number): string {
  return `${delta >= 0 ? "+" : ""}${delta}%`;
}

export function countHigh(signals: Signal[]): number {
  return signals.filter((s) => s.exposure === "HIGH").length;
}

export function sortRecent(signals: Signal[]): Signal[] {
  return [...signals].sort((a, b) =>
    a.published_at === b.published_at
      ? a.id.localeCompare(b.id)
      : b.published_at.localeCompare(a.published_at),
  );
}

/** Plain-text executive summary for e-mail, Teams or Slack (no Markdown). */
export function buildExecSummary(
  signals: Signal[],
  meta: MetaData,
  scope: string,
): string {
  const lines: string[] = [];
  const elevated = elevatedTheaters(meta);
  lines.push(
    "TLP:CLEAR // EUROPEAN HYBRID & GEOPOLITICAL RISK MONITOR - EXECUTIVE BRIEFING",
  );
  lines.push(`Generated from ingest: ${meta.last_ingest_cet}`);
  lines.push(`Active scope: ${scope}`);
  lines.push(
    `Signals included: ${signals.length} (HIGH exposure: ${countHigh(signals)})`,
  );
  lines.push(
    `Elevated 7D tempo: ${
      elevated.length > 0
        ? elevated
            .map((t) => `${t.name} (${formatDelta(t.delta_pct)})`)
            .join("; ")
        : "no theater elevated"
    }`,
  );
  lines.push(`Curated by: ${AUTHOR_NAME}`);
  lines.push("");

  const top = sortRecent(signals).slice(0, SUMMARY_LIMIT);
  lines.push(
    signals.length > top.length
      ? `TOP SIGNALS (${top.length} of ${signals.length})`
      : "SIGNALS",
  );
  top.forEach((s, i) => {
    lines.push(`${i + 1}. [${s.exposure}] ${s.published_at} - ${s.title}`);
    const detail = [
      `Source: ${s.source_name}`,
      `Theater: ${s.theaters.join(", ")}`,
    ];
    if (s.actors.length > 0) detail.push(`Actor: ${s.actors.join(", ")}`);
    lines.push(`   ${detail.join(" | ")}`);
    lines.push(`   ${s.source_url}`);
  });
  return lines.join("\n");
}

const CSV_COLUMNS = [
  "id",
  "published_at",
  "exposure",
  "domain",
  "title",
  "source_name",
  "source_tier",
  "theaters",
  "sectors",
  "vectors",
  "actors",
  "regulations",
  "cve_ids",
  "epss_score",
  "source_url",
] as const;

function csvField(value: string): string {
  // Neutralise spreadsheet formula injection from third-party text.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 CSV (CRLF records, quoted fields) with a UTF-8 BOM for Excel. */
export function buildCsv(signals: Signal[]): string {
  const rows = signals.map((s) =>
    [
      s.id,
      s.published_at,
      s.exposure,
      s.domain,
      s.title,
      s.source_name,
      s.source_tier,
      s.theaters.join("; "),
      s.sectors.join("; "),
      s.vectors.join("; "),
      s.actors.join("; "),
      s.regulations.join("; "),
      s.cve_ids.join("; "),
      s.epss_score === null ? "" : String(s.epss_score),
      s.source_url,
    ]
      .map(csvField)
      .join(","),
  );
  return `\uFEFF${[CSV_COLUMNS.join(","), ...rows].join("\r\n")}\r\n`;
}

export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
