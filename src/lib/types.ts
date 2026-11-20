/**
 * Shared data contracts. Mirrors SPEC.md section 5 and the JSON emitted by
 * scripts/ingest.py (data/signals.json, data/meta.json) and the Executive Brief
 * catalogue (data/briefs.json).
 */

export type NIS2Sector =
  | "Energy"
  | "Defense"
  | "Transport"
  | "Digital"
  | "Space"
  | "Public Admin";

export type ThreatVector =
  | "Cyber/KEV"
  | "Espionage/Proxies"
  | "Sabotage"
  | "Influence"
  | "Reg/Sanc";

export type SignalDomain = "cyber_kev" | "hybrid_geo" | "defense_reg";

export type ExposureLevel = "HIGH" | "MODERATE" | "LOW";

export type SourceTier = "Official" | "OSINT" | "Think Tank" | "CTI";

export type EURegulation = "NIS2" | "CER" | "EU AI Act" | "EU Sanctions";

export type EstimativeConfidence = "High" | "Moderate" | "Low";

export interface Signal {
  /** SIG-YYYYMMDD-NNN */
  id: string;
  /** YYYY-MM-DD */
  published_at: string;
  title: string;
  /** Plain text, max 220 characters. */
  summary: string;
  source_name: string;
  source_tier: SourceTier;
  source_url: string;
  domain: SignalDomain;
  vectors: ThreatVector[];
  sectors: NIS2Sector[];
  regulations: EURegulation[];
  exposure: ExposureLevel;
  cve_ids: string[];
  /** FIRST EPSS 30-day exploitation probability, 0..1. */
  epss_score: number | null;
  /** FIRST EPSS percentile, 0..1. */
  epss_percentile: number | null;
  ransomware_known: boolean;
}

export interface FeedStatus {
  name: string;
  tier: SourceTier;
  url: string;
  status: "OK" | "ERROR";
  items_ingested: number;
  error: string | null;
}

export interface MetaData {
  last_ingest_utc: string;
  last_ingest_cet: string;
  signals_total_30d: number;
  nis2_exposure_alerts: number;
  hybrid_kinetic_count: number;
  briefs_count: number;
  feeds_status: FeedStatus[];
}

export interface ExecutiveBrief {
  /** Doc ID, e.g. EHRM-EB-2026-001 */
  id: string;
  title: string;
  subtitle: string;
  pillar: string;
  /** YYYY-MM-DD */
  date: string;
  tlp: "TLP:CLEAR";
  confidence: EstimativeConfidence;
  featured: boolean;
  /** /briefs/<exact-case-sensitive-filename>.pdf */
  pdf_url: string;
  key_judgments: string[];
  /** Optional taxonomy tags carried over from the local pipeline's brief_data.json. */
  sectors?: NIS2Sector[];
  vectors?: ThreatVector[];
}
