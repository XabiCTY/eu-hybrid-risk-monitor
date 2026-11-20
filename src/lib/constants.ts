import type {
  ExposureLevel,
  NIS2Sector,
  SignalDomain,
  Theater,
  ThreatVector,
} from "./types";

export const AUTHOR_NAME = "Xabier Barbero";

/** Central, easy-to-update outbound profile link. */
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/xabier-barbero-del-alamo";

export const SITE_TITLE = "European Hybrid & Geopolitical Risk Monitor";

export const NIS2_SECTORS: readonly NIS2Sector[] = [
  "Energy",
  "Defense",
  "Transport",
  "Digital",
  "Space",
  "Public Admin",
];

export const THREAT_VECTORS: readonly ThreatVector[] = [
  "Cyber/KEV",
  "Espionage/Proxies",
  "Sabotage",
  "Influence",
  "Reg/Sanc",
];

export const GEOPOLITICAL_THEATERS: readonly Theater[] = [
  "EU-Wide",
  "Baltics & Nordics",
  "Eastern Flank",
  "Western Europe",
  "Southern Europe & Med",
  "Subsea & Maritime",
  "Transatlantic / Global",
];

export const DOMAINS: readonly SignalDomain[] = [
  "cyber_kev",
  "hybrid_geo",
  "defense_reg",
];

export const EXPOSURE_LEVELS: readonly ExposureLevel[] = [
  "HIGH",
  "MODERATE",
  "LOW",
];

export const DOMAIN_LABELS: Record<SignalDomain, string> = {
  cyber_kev: "Cyber / KEV",
  hybrid_geo: "Hybrid & Geopolitics",
  defense_reg: "Defense & EU Reg",
};

export const NAV_ITEMS: readonly { href: string; label: string }[] = [
  { href: "/", label: "01 RADAR FEED" },
  { href: "/matrix", label: "02 EXPOSURE MATRIX" },
  { href: "/briefs", label: "03 EXECUTIVE BRIEFS (2P PDF)" },
  { href: "/methodology", label: "04 METHODOLOGY" },
];
