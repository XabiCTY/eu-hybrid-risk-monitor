"""
Canonical NIS2 & European Hybrid Threat Taxonomy Classifier.
100% deterministic, zero-API-cost classification aligned with
.agent/skills/nis2-hybrid-taxonomy/SKILL.md.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

CANONICAL_SECTORS: List[str] = [
    "Energy",
    "Defense",
    "Transport",
    "Digital",
    "Space",
    "Public Admin",
]

CANONICAL_VECTORS: List[str] = [
    "Cyber/KEV",
    "Espionage/Proxies",
    "Sabotage",
    "Influence",
    "Reg/Sanc",
]

CANONICAL_REGULATIONS: List[str] = [
    "NIS2",
    "CER",
    "EU AI Act",
    "EU Sanctions",
]

CANONICAL_THEATERS: List[str] = [
    "EU-Wide",
    "Baltics & Nordics",
    "Eastern Flank",
    "Western Europe",
    "Southern Europe & Med",
    "Subsea & Maritime",
    "Transatlantic / Global",
]

CANONICAL_ACTORS: List[str] = [
    "Russia / Kremlin",
    "GRU / Unit 29155",
    "APT28",
    "Sandworm",
    "APT29",
    "China / PRC",
    "Volt Typhoon",
    "Salt Typhoon",
    "Iran / IRGC",
    "DPRK / Lazarus",
    "Belarus",
    "Hezbollah / Proxies",
    "Wagner / Africa Corps",
]

# Specificity-ordered operational theater patterns (strict word boundaries \b...\b)
THEATER_PATTERNS: List[Tuple[str, List[Tuple[str, int]]]] = [
    (
        "Subsea & Maritime",
        [
            (
                r"\b(subsea|undersea|balticconnector|nord stream|pipeline|pipelines|"
                r"shadow fleet|maritime|red sea|anchor drag|tanker|tankers|"
                r"subsea cable|undersea cable|subsea infrastructure|undersea infrastructure|"
                r"shipping corridor|gas infrastructure|offshore pipeline|offshore wind)\b",
                re.IGNORECASE,
            ),
        ],
    ),
    (
        "Baltics & Nordics",
        [
            (
                r"\b(baltic|baltics|baltic sea|nordic|nordics|finland|finnish|helsinki|"
                r"sweden|swedish|stockholm|norway|norwegian|oslo|denmark|danish|copenhagen|"
                r"estonia|estonian|tallinn|latvia|latvian|riga|lithuania|lithuanian|vilnius|"
                r"arctic|svalbard|gotland|kaliningrad|barents)\b",
                re.IGNORECASE,
            ),
        ],
    ),
    (
        "Eastern Flank",
        [
            (
                r"\b(eastern flank|poland|polish|warsaw|romania|romanian|bucharest|"
                r"czechia|czech|prague|slovakia|slovak|bratislava|bulgaria|bulgarian|sofia|"
                r"hungary|hungarian|budapest|moldova|moldovan|chisinau|transnistria|"
                r"ukraine|ukrainian|kyiv|black sea|crimea|donbas|bucha|suwalki)\b",
                re.IGNORECASE,
            ),
        ],
    ),
    (
        "Western Europe",
        [
            (
                r"\b(western europe|france|french|paris|anssi|germany|german|berlin|bundestag|"
                r"netherlands|dutch|amsterdam|the hague|belgium|belgian|brussels|"
                r"united kingdom|british|britain|london|ireland|irish|dublin|"
                r"switzerland|swiss|zurich|geneva|austria|austrian|vienna|luxembourg|"
                r"north sea|asml)\b",
                re.IGNORECASE,
            ),
            (r"\b(UK|U\.K\.)\b", 0),
        ],
    ),
    (
        "Southern Europe & Med",
        [
            (
                r"\b(southern europe|mediterranean|spain|spanish|madrid|italy|italian|rome|"
                r"portugal|portuguese|lisbon|greece|greek|athens|cyprus|cypriot|nicosia|"
                r"malta|maltese|valletta|gibraltar|adriatic|aegean|kosovo|western balkans)\b",
                re.IGNORECASE,
            ),
        ],
    ),
    (
        "EU-Wide",
        [
            (
                r"\b(eu-wide|european union|pan-european|europe|european|"
                r"european commission|european parliament|council of the eu|eu council|"
                r"european council|enisa|cert-eu|eeas|euvsdisinfo|euiss|europol|frontex|"
                r"ecb|nis2|cer directive|eu ai act|cyber resilience act|dora|eurocontrol|"
                r"galileo|iris2|copernicus|member states|schengen|eurozone|"
                r"single reporting platform)\b",
                re.IGNORECASE,
            ),
            (r"\bEU\b", 0),
        ],
    ),
    (
        "Transatlantic / Global",
        [
            (
                r"\b(transatlantic|nato|united states|america|american|washington|"
                r"pentagon|white house|cisa|aukus|un general assembly|unga|iaea|"
                r"indo-pacific|global|worldwide|middle east|gaza|abu dhabi|somalia|"
                r"armenia|armenian|azerbaijan)\b",
                re.IGNORECASE,
            ),
            (r"\b(US|U\.S\.)\b", 0),
        ],
    ),
]

# Strict word-boundary regexes for explicitly named state sponsors, intelligence services, proxies, and APTs
ACTOR_PATTERNS: List[Tuple[str, str]] = [
    (
        "Russia / Kremlin",
        r"\b(russia|russian|kremlin|moscow|putin|pro-kremlin|fsb|svr)\b",
    ),
    (
        "GRU / Unit 29155",
        r"\b(gru|unit 29155|unit 26165|unit 74455|cadet blizzard)\b",
    ),
    (
        "APT28",
        r"\b(apt28|apt 28|fancy bear|forest blizzard|sofacy|pawn storm|strontium)\b",
    ),
    (
        "Sandworm",
        r"\b(sandworm|seashell blizzard|iridium|voodoo bear|electrum)\b",
    ),
    (
        "APT29",
        r"\b(apt29|apt 29|cozy bear|midnight blizzard|nobelium|the dukes)\b",
    ),
    (
        "China / PRC",
        r"\b(china|chinese|prc|beijing|ccp|people's republic of china|people’s republic of china|"
        r"people's republic|people’s republic|mss|ministry of state security|mustang panda|flax typhoon)\b",
    ),
    (
        "Volt Typhoon",
        r"\b(volt typhoon|vanguard panda|bronze silhouette)\b",
    ),
    (
        "Salt Typhoon",
        r"\b(salt typhoon|famous sparrow|ghostemperor)\b",
    ),
    (
        "Iran / IRGC",
        r"\b(iran|iranian|tehran|irgc|islamic revolutionary guard|muddywater|charming kitten|"
        r"apt33|apt34|apt35|apt42)\b",
    ),
    (
        "DPRK / Lazarus",
        r"\b(dprk|north korea|north korean|pyongyang|lazarus|lazarus group|kimsuky|andariel|"
        r"bluenoroff|apt38)\b",
    ),
    (
        "Belarus",
        r"\b(belarus|belarusian|minsk|lukashenko|ghostwriter|unc1151)\b",
    ),
    (
        "Hezbollah / Proxies",
        r"\b(hezbollah|houthi|houthis|ansar allah|hamas|islamic jihad)\b",
    ),
    (
        "Wagner / Africa Corps",
        r"\b(wagner|wagner group|africa corps|prigozhin)\b",
    ),
]

# Keywords that indicate consumer / off-topic promotional noise or HR job postings
NOISE_PATTERNS: List[str] = [
    r"\bbest vpn\b",
    r"\bcoupon code\b",
    r"\bblack friday\b",
    r"\bcyber monday\b",
    r"\bgaming pc\b",
    r"\bwordle\b",
    r"\bsponsored post\b",
    r"\bwebinar registration\b",
    r"\bpodcast episode\s+#?\d+\b",
    r"\bgift guide\b",
    r"\bsmartphone review\b",
    r"\bjob vacancy\b",
    r"\bappointed hr director\b",
    r"\bdata protection notice for applicant\b",
]

# Relevant CTI / European security / geopolitical anchor keywords to ensure analytical density
RELEVANCE_KEYWORDS: List[str] = [
    "cve-", "kev", "zero-day", "0-day", "exploit", "vulnerability", "vulnerabilities",
    "vulnérabilité", "vulnérabilités", "kwetsbaarheden", "kwetsbaarheid", "ransomware",
    "apt", "malware", "botnet", "backdoor", "ddos", "phishing", "espionage",
    "sabotage", "subsea", "undersea", "cable", "pipeline", "gnss", "gps jamming",
    "spoofing", "hybrid", "disinformation", "fimi", "propaganda", "influence",
    "sanction", "sanctions", "nis2", "enisa", "cert-eu", "cert-fr", "ncsc", "cisa",
    "nato", "european union", "eu ", "ukraine", "russia", "china", "iran", "dprk",
    "north korea", "belarus", "baltic", "nordic", "black sea", "arctic", "defense",
    "defence", "military", "grid", "energy", "nuclear", "lng", "telecom", "5g",
    "satellite", "space", "maritime", "aviation", "rail", "port", "shipping",
    "shadow fleet", "critical infrastructure", "scada", "ics", "operational technology",
    "ministry", "parliament", "election", "sovereign", "export control",
    "dual-use", "drone", "uav", "incursion", "reconnaissance", "threat actor",
    "cyberattack", "cyber attack", "breach", "intrusion", "compromise",
    "firewall", "router", "vpn", "active directory", "hypervisor", "cloud",
    "restrictive measures", "chemical weapons", "deterrence", "artificial intelligence",
    "security", "cyber",
]

SECTOR_KEYWORDS: Dict[str, List[str]] = {
    "Energy": [
        "energy", "electricity", "power grid", "electrical grid", "substation",
        "oil", "gas", "pipeline", "lng", "liquefied natural gas", "offshore wind",
        "wind farm", "turbine", "nuclear", "reactor", "hydroelectric", "solar",
        "utility", "utilities", "scada", "ics", "plc", "siemens energy",
        "schneider electric", "hitachi energy", "abb", "interconnector",
        "nord stream", "balticconnector", "power plant", "refinery", "fuel",
    ],
    "Defense": [
        "defense", "defence", "military", "nato", "armed forces", "pentagon",
        "ministry of defence", "ministry of defense", "mod", "dual-use",
        "weapons", "munition", "ammunition", "artillery", "missile", "air defense",
        "air defence", "drone", "uav", "unmanned", "fighter jet", "naval",
        "warship", "submarine", "frigate", "armored", "contractor", "lockheed",
        "rheinmetall", "thales", "bae systems", "leonardo", "saab", "airbus defence",
        "edirpa", "asap", "battlefield", "warfare", "troops", "deterrence",
        "reconnaissance", "kinetic", "army", "navy", "air force",
    ],
    "Transport": [
        "transport", "transportation", "maritime", "shipping", "vessel", "tanker",
        "shadow fleet", "port", "harbor", "harbour", "container", "logistics",
        "supply chain", "aviation", "airline", "airport", "air traffic",
        "eurocontrol", "aircraft", "rail", "railway", "train", "signaling",
        "freight", "cargo", "strait", "red sea", "baltic sea", "black sea",
        "ais", "navigation", "locomotive", "transit",
    ],
    "Digital": [
        "digital", "telecom", "telecommunications", "5g", "6g", "isp", "ixp",
        "subsea cable", "undersea cable", "fiber-optic", "fibre-optic", "cloud",
        "data center", "datacenter", "dns", "bgp", "router", "firewall", "vpn",
        "gateway", "appliance", "hypervisor", "vmware", "esxi", "citrix",
        "fortinet", "fortios", "palo alto", "pan-os", "cisco", "ivanti",
        "juniper", "sophos", "checkpoint", "check point", "sonicwall", "f5",
        "big-ip", "microsoft exchange", "sharepoint", "active directory",
        "linux kernel", "apache", "nginx", "openssl", "kubernetes", "docker",
        "chrome", "firefox", "edge", "safari", "android", "ios", "windows",
        "server", "software", "saas", "identity", "oauth", "okta", "gitlab",
        "github", "supply-chain attack", "npm", "pypi", "open source",
    ],
    "Space": [
        "space", "satellite", "constellation", "galileo", "copernicus", "iris2",
        "starlink", "viasat", "eutelsat", "esa", "orbital", "orbit", "launch",
        "ground station", "gnss", "gps", "telemetry", "transponder", "spacecraft",
        "financial", "banking", "bank", "central bank", "ecb", "swift",
        "target2", "payment", "clearing", "fintech", "treasury", "stock exchange",
        "crypto", "sanctions evasion finance",
    ],
    "Public Admin": [
        "public admin", "public administration", "government", "ministry",
        "parliament", "european commission", "eu council", "council of the eu",
        "bundestag", "municipal", "municipality", "city council", "diplomatic",
        "embassy", "consulate", "foreign affairs", "interior ministry",
        "election", "electoral", "voting", "voter", "judiciary", "court",
        "police", "law enforcement", "europol", "agency", "federal",
        "state department", "civil service", "e-government", "tax authority",
        "customs", "border", "frontex", "healthcare", "hospital", "nhs",
    ],
}

VECTOR_KEYWORDS: Dict[str, List[str]] = {
    "Cyber/KEV": [
        "cve-", "kev", "known exploited", "zero-day", "0-day", "vulnerability",
        "vulnerabilities", "vulnérabilité", "vulnérabilités", "kwetsbaarheden",
        "kwetsbaarheid", "exploit", "exploitation", "rce", "remote code execution",
        "privilege escalation", "authentication bypass", "sql injection",
        "command injection", "buffer overflow", "ransomware", "lockbit",
        "blackbasta", "clop", "akira", "play ransomware", "ddos",
        "denial of service", " denial-of-service", "wiper", "malware",
        "botnet", "trojan", "infostealer", "patch", "security advisory",
        "unauthenticated", "arbitrary code", "cyberattack", "cyber attack",
        "cyber incident", "phishing", "backdoor", "breach", "intrusion",
        "hacking", "hacker", "compromise", "c2", "command and control",
        "threat hunting", "ai hacking", "ai tool", "artex", "malicious cyber",
    ],
    "Espionage/Proxies": [
        "espionage", "apt", "apt28", "apt29", "sandworm", "turla", "fancy bear",
        "cozy bear", "volt typhoon", "salt typhoon", "flax typhoon", "mustang panda",
        "lazarus", "kimsuky", "muddywater", "charming kitten", "state-sponsored",
        "state-backed", "nation-state", "cyber espionage", "spy", "spying",
        "intelligence agency", "gru", "fsb", "svr", "mss", "irgc", "proxy",
        "proxies", "hacktivist", "noName057", "killnet", "backdoor",
        "reconnaissance", "exfiltration", "credential harvesting", "spear-phishing",
        "spearphishing", "persistence", "c2", "command and control", "humint",
        "intellectual property", "stealth", "shadow fleet", "clandestine",
        "incursion", "covert", "chinese hackers", "russian hackers", "iranian hackers",
        "adversarial",
    ],
    "Sabotage": [
        "sabotage", "subsea cable", "undersea cable", "pipeline", "explosion",
        "severed", "cut cable", "anchor drag", "shadow fleet", "jamming",
        "gps jamming", "gnss jamming", "spoofing", "electronic warfare", "ew",
        "kinetic", "arson", "derailment", "rail sabotage", "assassination",
        "plot", "drone incursion", "unidentified drone", "airspace violation",
        "hybrid attack", "hybrid warfare", "hybrid operation", "grey zone",
        "gray zone", "physical security", "scada attack", "ics disruption",
        "blackout", "grid disruption", "outage", "baltic sea", "north sea",
        "undersea infrastructure", "physical disruption", "refrigeration systems",
        "critical infrastructure targeted",
    ],
    "Influence": [
        "influence", "disinformation", "misinformation", "fimi",
        "information manipulation", "propaganda", "doppelganger", "narrative",
        "deepfake", "synthetic media", "election interference", "interference",
        "influence operation", "information warfare", "psychological operation",
        "psyop", "bot farm", "troll", "social media manipulation", "telegram",
        "polarization", "cognitive warfare", "media manipulation",
        "euvsdisinfo", "kremlin narrative", "disinfo", "covert influence",
        "political messaging",
    ],
    "Reg/Sanc": [
        "nis2", "cer directive", "critical entities resilience", "eu ai act",
        "ai act", "dora", "cyber resilience act", "cra", "gdpr", "regulation",
        "regulatory", "directive", "compliance", "sanction", "sanctions",
        "export control", "embargo", "tariff", "dual-use regulation",
        "enforcement", "fine", "penalty", "ofac", "eu council decision",
        "restrictive measures", "asset freeze", "designation", "policy",
        "legislation", "sovereignty", "governance", "sanctions evasion",
        "export restrictions", "dual-use", "single reporting platform",
        "cabs accreditation", "incident reporting", "mandate",
    ],
}

REGULATION_KEYWORDS: Dict[str, List[str]] = {
    "NIS2": [
        "nis2", "directive 2022/2555", "csirt", "cert-eu", "enisa",
        "essential entities", "important entities", "vulnerability",
        "cve-", "ransomware", "zero-day", "incident notification",
        "cyberattack", "critical infrastructure", "telecom", "energy",
        "single reporting platform", "cyber resilience act", "cra",
        "state of cybersecurity in the union", "threat landscape",
    ],
    "CER": [
        "cer", "critical entities resilience", "directive 2022/2557",
        "sabotage", "subsea", "undersea", "pipeline", "rail", "port",
        "airport", "gnss", "jamming", "physical resilience", "power grid",
        "offshore", "energy infrastructure", "maritime security",
        "refrigeration systems", "gas from russia", "undersea infrastructure",
    ],
    "EU AI Act": [
        "ai act", "eu ai act", "artificial intelligence", "deepfake",
        "synthetic media", "llm", "generative ai", "foundation model",
        "autonomous system", "algorithmic", "facial recognition",
        "frontier ai", "ai tool", "artex", "ai hacking", "ai-powered",
    ],
    "EU Sanctions": [
        "sanction", "sanctions", "export control", "shadow fleet",
        "restrictive measures", "embargo", "asset freeze", "evasion",
        "dual-use export", "oligarch", "council decision", "cfsp",
        "sanctions packages", "sanctions evasion", "export restrictions",
        "dual-use restrictions",
    ],
}

HIGH_EXPOSURE_TARGETS: List[str] = [
    "european commission", "european parliament", "council of the eu",
    "eu council", "cert-eu", "enisa", "nato", "critical infrastructure",
    "power grid", "subsea cable", "pipeline", "gnss jamming", "gps jamming",
    "shadow fleet", "severed cable", "refrigeration systems across the eu",
]


def is_relevant_signal(title: str, summary: str, is_kev: bool = False) -> bool:
    """
    Filter out off-topic consumer tech or promotional noise while preserving
    all CISA KEV entries and authoritative CTI / European security items.
    """
    if is_kev:
        return True
    combined = f"{title} {summary}".lower()
    for pattern in NOISE_PATTERNS:
        if re.search(pattern, combined):
            return False
    return any(kw.lower() in combined for kw in RELEVANCE_KEYWORDS)


def _match_keywords(text_lower: str, keyword_map: Dict[str, List[str]]) -> List[str]:
    matched: List[str] = []
    for category, keywords in keyword_map.items():
        for kw in keywords:
            kw_clean = kw.strip().lower()
            if not kw_clean:
                continue
            pattern = r"(?<![a-z0-9])" + re.escape(kw_clean) + r"(?![a-z0-9])"
            if re.search(pattern, text_lower):
                matched.append(category)
                break
    return matched


def classify_theaters(
    title: str,
    summary: str,
    source_name: str,
    is_kev: bool = False,
) -> List[str]:
    """
    Classify a signal into 1-2 canonical geopolitical theaters based on
    geographic and institutional references in title + summary using strict
    word-boundary regex matching. Guarantees at least 1 canonical theater.
    """
    text_raw = f"{title} {summary}"
    matched: List[str] = []

    for theater, pattern_specs in THEATER_PATTERNS:
        for pat, flags in pattern_specs:
            if re.search(pat, text_raw, flags=flags):
                matched.append(theater)
                break

    # Prioritize specific regional/functional theaters first, cap at 2
    selected = matched[:2]

    if not selected:
        if is_kev or source_name == "CISA KEV Catalog":
            selected = ["Transatlantic / Global"]
        elif source_name in (
            "CERT-EU",
            "ENISA",
            "EEAS",
            "EUvsDisinfo",
            "EUISS",
            "Hybrid CoE",
            "CERT-FR / ANSSI",
            "NCSC-NL",
            "NCSC-UK",
        ):
            selected = ["EU-Wide"]
        else:
            selected = ["Transatlantic / Global"]

    return [t for t in CANONICAL_THEATERS if t in selected]


def extract_actors(title: str, summary: str) -> List[str]:
    """
    Extract ONLY explicitly named state sponsors, intelligence services, proxies,
    or APT groups using strict word-boundary regexes. Returns [] when unattributed.
    """
    text_raw = f"{title} {summary}"
    matched: List[str] = []

    for actor_name, pattern in ACTOR_PATTERNS:
        if re.search(pattern, text_raw, flags=re.IGNORECASE):
            if actor_name not in matched:
                matched.append(actor_name)

    return matched


def classify_signal(
    title: str,
    summary: str,
    source_name: str,
    source_tier: str,
    is_kev: bool = False,
    cve_ids: Optional[List[str]] = None,
    epss_score: Optional[float] = None,
    ransomware_known: bool = False,
) -> Dict[str, object]:
    """
    Deterministically map a signal onto canonical NIS2 sectors, threat vectors,
    domain, EU regulations, exposure tier (HIGH | MODERATE | LOW), geopolitical
    theaters, and explicitly attributed threat actors.
    Guarantees non-empty sectors, vectors, regulations, and theaters arrays.
    """
    cves = cve_ids or []
    combined = f"{title} {summary} {source_name}".lower()

    # 1. Sectors
    sectors = _match_keywords(combined, SECTOR_KEYWORDS)
    if not sectors:
        if (
            is_kev
            or cves
            or source_tier == "CTI"
            or source_name in ("CERT-EU", "ENISA", "CERT-FR / ANSSI", "NCSC-NL", "NCSC-UK")
        ):
            sectors = ["Digital"]
        elif source_name in ("EEAS", "Hybrid CoE", "EUISS"):
            sectors = ["Defense", "Public Admin"]
        elif source_name in ("CEPA",):
            sectors = ["Defense", "Public Admin"]
        elif source_name in ("Bellingcat", "DFRLab", "EUvsDisinfo"):
            sectors = ["Public Admin"]
        else:
            sectors = ["Digital"]
    # Keep deterministic canonical order and cap at 3 most relevant sectors
    sectors = [s for s in CANONICAL_SECTORS if s in sectors][:3]

    # 2. Threat Vectors (allow up to 2 canonical vectors when clearly warranted)
    vectors = _match_keywords(combined, VECTOR_KEYWORDS)
    if is_kev or cves:
        if "Cyber/KEV" not in vectors:
            vectors.insert(0, "Cyber/KEV")
    if not vectors:
        if source_name in ("CERT-EU", "ENISA", "CERT-FR / ANSSI", "NCSC-NL", "NCSC-UK"):
            vectors = ["Cyber/KEV"]
        elif source_name in ("DFRLab", "EUvsDisinfo"):
            vectors = ["Influence"]
        elif source_name == "EEAS":
            vectors = ["Reg/Sanc"]
        elif source_name in ("Hybrid CoE", "EUISS", "Bellingcat", "CEPA"):
            vectors = ["Espionage/Proxies"]
        else:
            vectors = ["Cyber/KEV"]
    # Allow up to 2 canonical vectors for analytical nuance
    vectors = [v for v in CANONICAL_VECTORS if v in vectors][:2]

    # 3. Domain ('cyber_kev' | 'hybrid_geo' | 'defense_reg')
    if is_kev or ("Cyber/KEV" in vectors and (cves or source_tier in ("Official", "CTI"))):
        domain = "cyber_kev"
    elif "Reg/Sanc" in vectors and "Sabotage" not in vectors and "Espionage/Proxies" not in vectors:
        domain = "defense_reg"
    elif any(v in vectors for v in ("Sabotage", "Influence", "Espionage/Proxies")):
        domain = "hybrid_geo"
    elif "Defense" in sectors or "Reg/Sanc" in vectors:
        domain = "defense_reg"
    else:
        domain = "cyber_kev"

    # 4. EU Regulatory Frameworks
    regulations = _match_keywords(combined, REGULATION_KEYWORDS)
    if is_kev or "Cyber/KEV" in vectors or "Espionage/Proxies" in vectors:
        if "NIS2" not in regulations:
            regulations.insert(0, "NIS2")
    if "Sabotage" in vectors or any(s in sectors for s in ("Energy", "Transport", "Space")):
        if "CER" not in regulations and ("Sabotage" in vectors or "Energy" in sectors or "Transport" in sectors):
            regulations.append("CER")
    if not regulations:
        regulations = ["NIS2"]
    regulations = [r for r in CANONICAL_REGULATIONS if r in regulations]

    # 5. Deterministic Exposure Scoring (HIGH | MODERATE | LOW)
    has_high_target = any(kw in combined for kw in HIGH_EXPOSURE_TARGETS)
    has_high_attack = any(
        kw in combined
        for kw in (
            "cyberattack", "cyber attack", "hacked", "hackers", "sabotage",
            "compromise", "breach", "zero-day", "wiper", "outage", "disruption",
        )
    )
    direct_eu_attack = has_high_target and has_high_attack and any(
        v in vectors for v in ("Cyber/KEV", "Sabotage", "Espionage/Proxies")
    )

    has_critical_sector = any(
        s in sectors for s in ("Energy", "Defense", "Transport", "Digital", "Space", "Public Admin")
    )

    if (
        (is_kev and ransomware_known)
        or (epss_score is not None and epss_score >= 0.50 and has_critical_sector)
        or ("Sabotage" in vectors and (has_high_target or "Energy" in sectors or "Transport" in sectors))
        or direct_eu_attack
    ):
        exposure = "HIGH"
    elif (
        is_kev
        or (epss_score is not None and epss_score >= 0.15)
        or "Espionage/Proxies" in vectors
        or "Sabotage" in vectors
        or "Reg/Sanc" in vectors
        or bool(cves)
    ):
        exposure = "MODERATE"
    else:
        exposure = "LOW"

    # 6. Geopolitical Theaters & Attributed Actors
    theaters = classify_theaters(
        title=title,
        summary=summary,
        source_name=source_name,
        is_kev=is_kev,
    )
    actors = extract_actors(title=title, summary=summary)

    return {
        "domain": domain,
        "vectors": vectors,
        "sectors": sectors,
        "regulations": regulations,
        "exposure": exposure,
        "theaters": theaters,
        "actors": actors,
    }
