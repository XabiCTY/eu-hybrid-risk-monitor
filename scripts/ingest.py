"""
Zero-Cost OSINT & CTI Ingestion Engine for European Hybrid & Geopolitical Risk Monitor.
Fetches CISA KEV (rolling 45 days), enriches CVEs in batches via the public FIRST EPSS API,
and ingests official/OSINT RSS feeds with strict 12s timeouts, HTML stripping, and fail-soft logging.
"""

from __future__ import annotations

import datetime
import email.utils
import html
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from zoneinfo import ZoneInfo

import feedparser
import requests
from bs4 import BeautifulSoup

# Ensure local imports from scripts/ work regardless of current working directory
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from taxonomy import (  # noqa: E402
    CANONICAL_ACTORS,
    CANONICAL_SECTORS,
    CANONICAL_THEATERS,
    classify_signal,
    is_relevant_signal,
)

DATA_DIR = PROJECT_ROOT / "data"
SIGNALS_PATH = DATA_DIR / "signals.json"
META_PATH = DATA_DIR / "meta.json"
BRIEFS_PATH = DATA_DIR / "briefs.json"

HTTP_TIMEOUT = 12
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; EU-Hybrid-Risk-Monitor/1.0; "
        "+https://github.com/xabierbarbero/eu-hybrid-risk-monitor; TLP:CLEAR OSINT)"
    ),
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*",
}

CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
FIRST_EPSS_URL = "https://api.first.org/data/v1/epss"

# Rolling windows and caps
KEV_WINDOW_DAYS = 45
KEV_MAX_ITEMS = 28
RSS_WINDOW_DAYS = 60
RSS_MAX_ITEMS_PER_FEED = 10

CVE_REGEX = re.compile(r"\bCVE-\d{4}-\d{4,7}\b", re.IGNORECASE)
DATE_ISO_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Primary RSS/Atom feeds with fallback candidate URLs for fail-soft resilience
RSS_FEEDS: List[Dict[str, Any]] = [
    {
        "name": "CERT-EU",
        "tier": "Official",
        "max_items": 10,
        "urls": [
            "https://cert.europa.eu/publications/security-advisories-rss",
            "https://cert.europa.eu/publications/threat-intelligence-rss",
            "https://media.cert.europa.eu/rss.xml",
        ],
    },
    {
        "name": "CERT-FR / ANSSI",
        "tier": "Official",
        "max_items": 8,
        "urls": [
            "https://www.cert.ssi.gouv.fr/avis/feed/",
            "https://www.cert.ssi.gouv.fr/feed/",
        ],
    },
    {
        "name": "NCSC-NL",
        "tier": "Official",
        "max_items": 8,
        "urls": [
            "https://advisories.ncsc.nl/rss/advisories",
        ],
    },
    {
        "name": "NCSC-UK",
        "tier": "Official",
        "max_items": 6,
        "urls": [
            "https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml",
            "https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml",
        ],
    },
    {
        "name": "EUvsDisinfo",
        "tier": "Official",
        "max_items": 6,
        "urls": [
            "https://euvsdisinfo.eu/feed/",
        ],
    },
    {
        "name": "EUISS",
        "tier": "Official",
        "max_items": 6,
        "urls": [
            "https://www.iss.europa.eu/rss.xml",
        ],
    },
    {
        "name": "CEPA",
        "tier": "Think Tank",
        "max_items": 6,
        "urls": [
            "https://cepa.org/feed/",
        ],
    },
    {
        "name": "Bellingcat",
        "tier": "OSINT",
        "max_items": 5,
        "urls": [
            "https://www.bellingcat.com/feed/",
        ],
    },
    {
        "name": "DFRLab",
        "tier": "OSINT",
        "max_items": 5,
        "urls": [
            "https://dfrlab.org/feed/",
            "https://medium.com/feed/dfrlab",
        ],
    },
]


# Leading promotional / newsletter boilerplates to strip
LEADING_BOILERPLATE_PATTERNS = [
    r"^sign up here to receive [^.]*\.\s*",
    r"^sign up for [^.]*\.\s*",
    r"^become a member and support our work here\.\s*",
    r"^subscribe to [^.]*\.\s*",
    r"^listen to this episode on [^.]*\.\s*",
    r"^welcome to [^.]*\.\s*",
    r"^every (other )?week, we(?:’|')ll provide you with [^.]*\.\s*",
    r"^read more below\.?\*?\*?\*?\s*",
    r"^\*+\s*",
]

# Trailing syndication footers to strip
TRAILING_BOILERPLATE_PATTERNS = [
    r"\s*the post .*? appeared first on .*?\.?$",
    r"\s*appeared first on .*?\.?$",
    r"\s*read more at .*?\.?$",
]


def strip_html_and_truncate(raw_text: str, max_len: int = 220) -> str:
    """
    Strip all HTML tags, decode HTML entities, remove newsletter and RSS
    syndication boilerplate, collapse whitespace, and cleanly truncate to
    max_len characters without trailing HTML fragments or mid-word cuts.
    """
    if not raw_text:
        return ""
    unescaped = html.unescape(raw_text)
    soup = BeautifulSoup(unescaped, "html.parser")
    # Remove script and style elements completely
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text(separator=" ")
    text = html.unescape(text)
    # Remove any residual angle-bracket tags if double-encoded
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    # Iteratively strip leading boilerplate sentences
    changed = True
    while changed:
        changed = False
        for pattern in LEADING_BOILERPLATE_PATTERNS:
            new_text = re.sub(pattern, "", text, flags=re.IGNORECASE).strip()
            if new_text != text:
                text = new_text
                changed = True

    # Strip trailing syndication footers
    for pattern in TRAILING_BOILERPLATE_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE).strip()

    text = re.sub(r"\s+", " ", text).strip()

    if len(text) <= max_len:
        return text

    truncated = text[: max_len - 3].rsplit(" ", 1)[0].strip()
    # Strip any trailing punctuation hanging before ellipsis
    truncated = re.sub(r"[,;:\s]+$", "", truncated)
    if not truncated:
        truncated = text[: max_len - 3]
    return f"{truncated}..."


def extract_cves(text: str) -> List[str]:
    """Extract unique uppercase CVE identifiers in deterministic sorted order."""
    if not text:
        return []
    found = {m.upper() for m in CVE_REGEX.findall(text)}
    return sorted(found)


def parse_entry_date(entry: Any, reference_today: datetime.date) -> Optional[str]:
    """
    Parse an RSS/Atom entry date into strict YYYY-MM-DD format.
    Returns None if no valid date can be extracted. Never returns future dates > today.
    """
    # 1. Try feedparser struct_time tuples
    for key in ("published_parsed", "updated_parsed", "created_parsed"):
        st = getattr(entry, key, None) or entry.get(key)
        if st:
            try:
                dt = datetime.date(st.tm_year, st.tm_mon, st.tm_mday)
                if dt > reference_today:
                    dt = reference_today
                return dt.strftime("%Y-%m-%d")
            except Exception:
                pass

    # 2. Try string date fields
    for key in ("published", "updated", "created", "date"):
        val = getattr(entry, key, None) or entry.get(key)
        if not val or not isinstance(val, str):
            continue
        val_str = val.strip()
        # Try RFC 2822
        try:
            parsed_dt = email.utils.parsedate_to_datetime(val_str)
            dt = parsed_dt.date()
            if dt > reference_today:
                dt = reference_today
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass
        # Try ISO-8601 prefix YYYY-MM-DD
        m = re.search(r"(\d{4}-\d{2}-\d{2})", val_str)
        if m:
            try:
                dt = datetime.date.fromisoformat(m.group(1))
                if dt > reference_today:
                    dt = reference_today
                return dt.strftime("%Y-%m-%d")
            except Exception:
                pass

    return None


def fetch_cisa_kev(reference_today: datetime.date) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fetch the official CISA KEV JSON catalog and return raw candidate items
    within the rolling 45-day window (or most recent entries if window is sparse).
    """
    status_entry: Dict[str, Any] = {
        "name": "CISA KEV Catalog",
        "tier": "Official",
        "url": CISA_KEV_URL,
        "status": "OK",
        "items_ingested": 0,
        "error": None,
    }
    raw_items: List[Dict[str, Any]] = []

    try:
        resp = requests.get(CISA_KEV_URL, headers=HEADERS, timeout=HTTP_TIMEOUT)
        resp.raise_for_status()
        payload = resp.json()
        vulnerabilities = payload.get("vulnerabilities", [])

        # Sort vulnerabilities descending by dateAdded
        def _kev_date_key(v: Dict[str, Any]) -> str:
            d = str(v.get("dateAdded", "")).strip()
            return d if DATE_ISO_REGEX.match(d) else "1970-01-01"

        vulnerabilities.sort(key=_kev_date_key, reverse=True)

        # Anchor rolling 45-day cutoff against the catalog's latest dateAdded (or reference_today)
        latest_date_str = _kev_date_key(vulnerabilities[0]) if vulnerabilities else reference_today.strftime("%Y-%m-%d")
        try:
            latest_kev_date = datetime.date.fromisoformat(latest_date_str)
        except ValueError:
            latest_kev_date = reference_today

        anchor_date = min(reference_today, latest_kev_date)
        cutoff_date = anchor_date - datetime.timedelta(days=KEV_WINDOW_DAYS)

        filtered: List[Dict[str, Any]] = []
        for vuln in vulnerabilities:
            date_str = _kev_date_key(vuln)
            try:
                v_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                continue
            if v_date >= cutoff_date:
                filtered.append(vuln)

        # Fallback if rolling 45-day window has fewer than 12 entries
        if len(filtered) < 12:
            filtered = vulnerabilities[:20]

        for vuln in filtered[:KEV_MAX_ITEMS]:
            cve_id = str(vuln.get("cveID", "")).strip().upper()
            if not cve_id:
                continue
            date_added = _kev_date_key(vuln)
            vendor = str(vuln.get("vendorProject", "")).strip()
            product = str(vuln.get("product", "")).strip()
            vuln_name = str(vuln.get("vulnerabilityName", "")).strip()
            short_desc = str(vuln.get("shortDescription", "")).strip()
            ransomware_str = str(vuln.get("knownRansomwareCampaignUse", "Unknown")).strip()
            ransomware_known = ransomware_str.lower() == "known"

            title = f"{cve_id}: {vendor} {product} — {vuln_name}".strip(" —")
            title = strip_html_and_truncate(title, max_len=160)
            summary = strip_html_and_truncate(short_desc, max_len=220)
            source_url = f"https://nvd.nist.gov/vuln/detail/{cve_id}"

            raw_items.append(
                {
                    "published_at": date_added,
                    "title": title,
                    "summary": summary,
                    "source_name": "CISA KEV",
                    "source_tier": "Official",
                    "source_url": source_url,
                    "cve_ids": [cve_id],
                    "ransomware_known": ransomware_known,
                    "is_kev": True,
                }
            )

        status_entry["items_ingested"] = len(raw_items)
    except Exception as exc:
        status_entry["status"] = "ERROR"
        status_entry["error"] = f"{type(exc).__name__}: {str(exc)[:140]}"

    return raw_items, status_entry


def fetch_rss_feed(
    feed_cfg: Dict[str, Any],
    reference_today: datetime.date,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fetch a single RSS/Atom feed with fallback URLs, 12-second timeout,
    HTML stripping, relevance filtering, and rolling 60-day window.
    """
    name = feed_cfg["name"]
    tier = feed_cfg["tier"]
    max_items = int(feed_cfg.get("max_items", RSS_MAX_ITEMS_PER_FEED))
    candidate_urls: List[str] = feed_cfg["urls"]

    status_entry: Dict[str, Any] = {
        "name": name,
        "tier": tier,
        "url": candidate_urls[0],
        "status": "ERROR",
        "items_ingested": 0,
        "error": None,
    }
    collected: List[Dict[str, Any]] = []
    last_error = "No items returned"

    for url in candidate_urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=HTTP_TIMEOUT)
            resp.raise_for_status()
            parsed = feedparser.parse(resp.content)
            entries = list(getattr(parsed, "entries", []) or [])

            if not entries:
                last_error = f"Empty feed payload from {url}"
                continue

            # Determine cutoff date (60 days before reference_today)
            cutoff_date = reference_today - datetime.timedelta(days=RSS_WINDOW_DAYS)

            # Sort entries newest-first so ascending feeds (e.g. CERT-FR) yield latest 2026 advisories
            scored_entries: List[Tuple[str, Any]] = []
            for entry in entries:
                d_str = parse_entry_date(entry, reference_today)
                if d_str and DATE_ISO_REGEX.match(d_str):
                    scored_entries.append((d_str, entry))
            scored_entries.sort(key=lambda x: x[0], reverse=True)

            feed_items: List[Dict[str, Any]] = []
            for pub_date_str, entry in scored_entries:
                try:
                    pub_date = datetime.date.fromisoformat(pub_date_str)
                except ValueError:
                    continue

                if pub_date < cutoff_date:
                    continue

                raw_title = getattr(entry, "title", "") or entry.get("title", "")
                link = getattr(entry, "link", "") or entry.get("link", "")
                raw_summary = (
                    getattr(entry, "summary", "")
                    or entry.get("summary", "")
                    or getattr(entry, "description", "")
                    or entry.get("description", "")
                )

                clean_title = strip_html_and_truncate(str(raw_title), max_len=160)
                clean_summary = strip_html_and_truncate(str(raw_summary), max_len=220)
                clean_url = str(link).strip()

                if not clean_title or not clean_url.startswith("http"):
                    continue

                if not clean_summary:
                    clean_summary = clean_title

                # Apply deterministic relevance filter
                if not is_relevant_signal(clean_title, clean_summary, is_kev=False) and name not in (
                    "CERT-EU",
                    "CERT-FR / ANSSI",
                    "NCSC-NL",
                    "NCSC-UK",
                    "EUvsDisinfo",
                ):
                    continue

                cves = extract_cves(f"{clean_title} {clean_summary}")
                ransomware_flag = "ransomware" in f"{clean_title} {clean_summary}".lower()

                feed_items.append(
                    {
                        "published_at": pub_date_str,
                        "title": clean_title,
                        "summary": clean_summary,
                        "source_name": name,
                        "source_tier": tier,
                        "source_url": clean_url,
                        "cve_ids": cves,
                        "ransomware_known": ransomware_flag,
                        "is_kev": False,
                    }
                )

                if len(feed_items) >= max_items:
                    break

            # Success with this URL
            status_entry["url"] = url
            status_entry["status"] = "OK"
            status_entry["items_ingested"] = len(feed_items)
            status_entry["error"] = None
            collected = feed_items
            return collected, status_entry

        except Exception as exc:
            last_error = f"{type(exc).__name__}: {str(exc)[:140]}"

    status_entry["status"] = "ERROR"
    status_entry["error"] = last_error
    return collected, status_entry


ENISA_NEWS_URL = "https://www.enisa.europa.eu/news"
ENISA_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def parse_enisa_date(date_text: str) -> Optional[str]:
    """Parse ENISA listing date strings such as '10 Nov 2026' into YYYY-MM-DD."""
    m = re.search(r"(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})", date_text)
    if not m:
        return None
    day = int(m.group(1))
    mon = ENISA_MONTHS.get(m.group(2).lower()[:3])
    year = int(m.group(3))
    if not mon:
        return None
    try:
        return datetime.date(year, mon, day).strftime("%Y-%m-%d")
    except Exception:
        return None


def fetch_enisa_official_news(reference_today: datetime.date) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fail-soft HTML scraper for ENISA's official newsroom (https://www.enisa.europa.eu/news).
    Extracts publication date, title, target article link, and summary within the rolling 60-day cutoff.
    """
    status_entry: Dict[str, Any] = {
        "name": "ENISA",
        "tier": "Official",
        "url": ENISA_NEWS_URL,
        "status": "OK",
        "items_ingested": 0,
        "error": None,
    }
    collected: List[Dict[str, Any]] = []
    cutoff_date = reference_today - datetime.timedelta(days=RSS_WINDOW_DAYS)

    try:
        resp = requests.get(ENISA_NEWS_URL, headers=HEADERS, timeout=HTTP_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        seen_hrefs: Set[str] = set()
        for time_tag in soup.find_all("time"):
            parent = time_tag.find_parent(
                lambda tag: tag.name in ["div", "article", "li"]
                and tag.find("a", href=lambda h: h and "/news/" in h and len(h) > 8)
            )
            if not parent:
                continue
            a_tag = parent.find("a", href=lambda h: h and "/news/" in h and len(h) > 8)
            if not a_tag:
                continue

            href = a_tag.get("href", "").strip()
            if not href or href in seen_hrefs:
                continue

            raw_title = a_tag.get_text(strip=True)
            if not raw_title:
                h = parent.find(["h2", "h3", "h4"])
                if h:
                    raw_title = h.get_text(strip=True)

            if not raw_title or len(raw_title) < 10:
                continue

            raw_date_str = time_tag.get_text(strip=True)
            pub_date_str = parse_enisa_date(raw_date_str)
            if not pub_date_str:
                continue

            try:
                pub_date = datetime.date.fromisoformat(pub_date_str)
            except ValueError:
                continue

            if pub_date < cutoff_date:
                continue

            seen_hrefs.add(href)
            full_url = f"https://www.enisa.europa.eu{href}" if href.startswith("/") else href
            clean_title = strip_html_and_truncate(raw_title, max_len=160)

            # Try to fetch summary from article detail page (fail-soft fallback to clean_title)
            clean_summary = clean_title
            try:
                sub_resp = requests.get(full_url, headers=HEADERS, timeout=4)
                if sub_resp.ok:
                    sub_soup = BeautifulSoup(sub_resp.text, "html.parser")
                    for body_elem in sub_soup.find_all("div", class_="field--name-body"):
                        t = body_elem.get_text(separator=" ", strip=True)
                        if len(t) > 70 and not t.endswith("Access") and "©" not in t and "EU Agencies Network" not in t:
                            clean_summary = strip_html_and_truncate(t, max_len=220)
                            break
            except Exception:
                pass

            cves = extract_cves(f"{clean_title} {clean_summary}")
            ransomware_flag = "ransomware" in f"{clean_title} {clean_summary}".lower()

            collected.append(
                {
                    "published_at": pub_date_str,
                    "title": clean_title,
                    "summary": clean_summary,
                    "source_name": "ENISA",
                    "source_tier": "Official",
                    "source_url": full_url,
                    "cve_ids": cves,
                    "ransomware_known": ransomware_flag,
                    "is_kev": False,
                }
            )
            if len(collected) >= RSS_MAX_ITEMS_PER_FEED:
                break

        status_entry["items_ingested"] = len(collected)
        if not collected:
            status_entry["status"] = "OK"
            status_entry["error"] = "0 recent news items within 60D window"

    except Exception as exc:
        status_entry["status"] = "ERROR"
        status_entry["error"] = f"{type(exc).__name__}: {str(exc)[:140]}"

    return collected, status_entry


EEAS_PRESS_URL = "https://www.eeas.europa.eu/eeas/press-material_en"
HYBRID_COE_NEWS_URL = "https://www.hybridcoe.fi/news/"


def parse_dotted_date(date_text: str) -> Optional[str]:
    """Parse European dotted date strings such as '19.11.2026' into YYYY-MM-DD."""
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", date_text)
    if not m:
        return None
    day = int(m.group(1))
    month = int(m.group(2))
    year = int(m.group(3))
    try:
        return datetime.date(year, month, day).strftime("%Y-%m-%d")
    except Exception:
        return None


def fetch_eeas_official_press(reference_today: datetime.date) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fail-soft HTML scraper for EEAS / Council of the EU Press Material
    (https://www.eeas.europa.eu/eeas/press-material_en).
    Prioritizes European security, sanctions, FIMI, cyber, Ukraine, nuclear, and defense statements.
    """
    status_entry: Dict[str, Any] = {
        "name": "EEAS",
        "tier": "Official",
        "url": EEAS_PRESS_URL,
        "status": "OK",
        "items_ingested": 0,
        "error": None,
    }
    collected: List[Dict[str, Any]] = []
    cutoff_date = reference_today - datetime.timedelta(days=RSS_WINDOW_DAYS)

    eeas_priority_keywords = [
        "sanction", "fimi", "cyber", "hybrid", "ukraine", "russia", "nuclear",
        "security", "defense", "defence", "chemical weapons", "artificial intelligence",
        "nato", "iran", "dprk", "china", "belarus", "baltic", "maritime", "kosovo",
    ]

    try:
        resp = requests.get(EEAS_PRESS_URL, headers=HEADERS, timeout=HTTP_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        seen_hrefs: Set[str] = set()
        for card in soup.select(".card"):
            h3 = card.find("h3", class_="card-title")
            if not h3:
                continue
            a_tag = h3.find("a", href=True)
            if not a_tag:
                continue
            href = a_tag.get("href", "").strip()
            # Keep only official eeas.europa.eu links
            if not href or (not href.startswith("/") and "eeas.europa.eu" not in href):
                continue
            if href in seen_hrefs:
                continue

            raw_title = a_tag.get_text(" ", strip=True)
            if not raw_title or len(raw_title) < 15:
                continue

            # Filter for European security / sanctions / hybrid / foreign policy relevance
            title_lower = raw_title.lower()
            if not any(kw in title_lower for kw in eeas_priority_keywords):
                continue

            footer = card.select_one(".card-footer")
            pub_date_str = parse_dotted_date(footer.get_text(" ", strip=True)) if footer else None
            if not pub_date_str:
                continue

            try:
                pub_date = datetime.date.fromisoformat(pub_date_str)
            except ValueError:
                continue
            if pub_date < cutoff_date:
                continue

            seen_hrefs.add(href)
            full_url = f"https://www.eeas.europa.eu{href}" if href.startswith("/") else href
            clean_title = strip_html_and_truncate(raw_title, max_len=160)
            clean_summary = clean_title

            try:
                sub_resp = requests.get(full_url, headers=HEADERS, timeout=4)
                if sub_resp.ok:
                    sub_soup = BeautifulSoup(sub_resp.text, "html.parser")
                    paragraphs = [
                        p.get_text(" ", strip=True)
                        for p in sub_soup.select(".field--name-body p, article p")
                        if len(p.get_text(strip=True)) > 45
                    ]
                    if paragraphs:
                        combined_p = " ".join(paragraphs[:2])
                        clean_summary = strip_html_and_truncate(combined_p, max_len=220)
            except Exception:
                pass

            cves = extract_cves(f"{clean_title} {clean_summary}")
            ransomware_flag = "ransomware" in f"{clean_title} {clean_summary}".lower()

            collected.append(
                {
                    "published_at": pub_date_str,
                    "title": clean_title,
                    "summary": clean_summary,
                    "source_name": "EEAS",
                    "source_tier": "Official",
                    "source_url": full_url,
                    "cve_ids": cves,
                    "ransomware_known": ransomware_flag,
                    "is_kev": False,
                }
            )
            if len(collected) >= 8:
                break

        status_entry["items_ingested"] = len(collected)
    except Exception as exc:
        status_entry["status"] = "ERROR"
        status_entry["error"] = f"{type(exc).__name__}: {str(exc)[:140]}"

    return collected, status_entry


def fetch_hybrid_coe_news(reference_today: datetime.date) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fail-soft HTML scraper for the European Centre of Excellence for Countering Hybrid Threats
    (https://www.hybridcoe.fi/news/).
    """
    status_entry: Dict[str, Any] = {
        "name": "Hybrid CoE",
        "tier": "Official",
        "url": HYBRID_COE_NEWS_URL,
        "status": "OK",
        "items_ingested": 0,
        "error": None,
    }
    collected: List[Dict[str, Any]] = []
    # Use a 90-day window for Hybrid CoE research papers/news
    cutoff_date = reference_today - datetime.timedelta(days=90)

    try:
        resp = requests.get(HYBRID_COE_NEWS_URL, headers=HEADERS, timeout=HTTP_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        seen_hrefs: Set[str] = set()
        for a_tag in soup.select("a.hcoe2020-liftup-item"):
            href = a_tag.get("href", "").strip()
            if not href or "hybridcoe.fi/news/" not in href or href in seen_hrefs:
                continue

            h3 = a_tag.find("h3", class_="liftup-title")
            raw_title = h3.get_text(" ", strip=True) if h3 else a_tag.get_text(" ", strip=True)
            if not raw_title or len(raw_title) < 12:
                continue

            if not is_relevant_signal(raw_title, raw_title, is_kev=False):
                continue

            date_span = a_tag.find("span", class_="liftup-date")
            pub_date_str = parse_dotted_date(date_span.get_text(" ", strip=True)) if date_span else None
            if not pub_date_str:
                continue

            try:
                pub_date = datetime.date.fromisoformat(pub_date_str)
            except ValueError:
                continue
            if pub_date < cutoff_date:
                continue

            seen_hrefs.add(href)
            clean_title = strip_html_and_truncate(raw_title, max_len=160)
            clean_summary = clean_title

            try:
                sub_resp = requests.get(href, headers=HEADERS, timeout=4)
                if sub_resp.ok:
                    sub_soup = BeautifulSoup(sub_resp.text, "html.parser")
                    paragraphs = [
                        p.get_text(" ", strip=True)
                        for p in sub_soup.select("article p, .entry-content p, main p")
                        if len(p.get_text(strip=True)) > 45
                    ]
                    if paragraphs:
                        clean_summary = strip_html_and_truncate(paragraphs[0], max_len=220)
            except Exception:
                pass

            cves = extract_cves(f"{clean_title} {clean_summary}")
            collected.append(
                {
                    "published_at": pub_date_str,
                    "title": clean_title,
                    "summary": clean_summary,
                    "source_name": "Hybrid CoE",
                    "source_tier": "Official",
                    "source_url": href,
                    "cve_ids": cves,
                    "ransomware_known": False,
                    "is_kev": False,
                }
            )
            if len(collected) >= 6:
                break

        status_entry["items_ingested"] = len(collected)
    except Exception as exc:
        status_entry["status"] = "ERROR"
        status_entry["error"] = f"{type(exc).__name__}: {str(exc)[:140]}"

    return collected, status_entry


def fetch_epss_scores(cve_ids: List[str]) -> Dict[str, Tuple[float, float]]:
    """
    Query the public FIRST EPSS API in batches of up to 50 CVEs.
    Returns a dict mapping CVE-ID -> (epss_score, epss_percentile).
    Fails soft to empty dict on network or API error.
    """
    unique_cves = sorted({c.upper() for c in cve_ids if CVE_REGEX.fullmatch(c.strip())})
    epss_map: Dict[str, Tuple[float, float]] = {}
    if not unique_cves:
        return epss_map

    batch_size = 50
    for i in range(0, len(unique_cves), batch_size):
        batch = unique_cves[i : i + batch_size]
        cve_param = ",".join(batch)
        try:
            resp = requests.get(
                FIRST_EPSS_URL,
                params={"cve": cve_param},
                headers={"User-Agent": HEADERS["User-Agent"], "Accept": "application/json"},
                timeout=HTTP_TIMEOUT,
            )
            resp.raise_for_status()
            payload = resp.json()
            for row in payload.get("data", []):
                cve_key = str(row.get("cve", "")).upper()
                try:
                    score = round(float(row.get("epss", 0.0)), 4)
                    percentile = round(float(row.get("percentile", 0.0)), 4)
                    if 0.0 <= score <= 1.0 and 0.0 <= percentile <= 1.0:
                        epss_map[cve_key] = (score, percentile)
                except (ValueError, TypeError):
                    continue
        except Exception as exc:
            print(f"[EPSS WARN] Batch enrichment error: {exc}", file=sys.stderr)
            continue

    return epss_map


def normalize_url(url: str) -> str:
    """Normalize URL for deterministic deduplication."""
    u = url.strip().lower()
    u = re.sub(r"#.*$", "", u)
    return u.rstrip("/")


def normalize_title(title: str) -> str:
    """Normalize title for deterministic deduplication."""
    return re.sub(r"[^a-z0-9]+", "", title.lower())


def load_briefs_count() -> int:
    """Read published briefs count from data/briefs.json."""
    if not BRIEFS_PATH.exists():
        return 0
    try:
        with open(BRIEFS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return len(data) if isinstance(data, list) else 0
    except Exception:
        return 0


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    try:
        cet_tz = ZoneInfo("Europe/Brussels")
        now_cet = now_utc.astimezone(cet_tz)
        tz_abbr = now_cet.tzname() or "CET"
        last_ingest_cet = f"{now_cet.strftime('%Y-%m-%d %H:%M')} {tz_abbr}"
    except Exception:
        now_cet = now_utc + datetime.timedelta(hours=1)
        last_ingest_cet = f"{now_cet.strftime('%Y-%m-%d %H:%M')} CET"

    last_ingest_utc = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
    reference_today = now_utc.date()

    raw_candidates: List[Dict[str, Any]] = []
    feeds_status: List[Dict[str, Any]] = []

    # 1. Fetch CISA KEV
    kev_items, kev_status = fetch_cisa_kev(reference_today)
    raw_candidates.extend(kev_items)
    feeds_status.append(kev_status)

    # 2. Fetch Official & OSINT RSS Feeds
    for feed_cfg in RSS_FEEDS:
        rss_items, rss_status = fetch_rss_feed(feed_cfg, reference_today)
        raw_candidates.extend(rss_items)
        feeds_status.append(rss_status)

    # 3. Fetch Official European Portal Newsrooms via fail-soft scrapers
    enisa_items, enisa_status = fetch_enisa_official_news(reference_today)
    raw_candidates.extend(enisa_items)
    feeds_status.append(enisa_status)

    eeas_items, eeas_status = fetch_eeas_official_press(reference_today)
    raw_candidates.extend(eeas_items)
    feeds_status.append(eeas_status)

    hcoe_items, hcoe_status = fetch_hybrid_coe_news(reference_today)
    raw_candidates.extend(hcoe_items)
    feeds_status.append(hcoe_status)

    # 4. Collect all CVEs and enrich in batches via FIRST EPSS API
    all_cves: List[str] = []
    for item in raw_candidates:
        all_cves.extend(item.get("cve_ids", []))

    epss_lookup = fetch_epss_scores(all_cves)

    # 4. Deduplicate, enrich, and classify signals
    seen_urls: Set[str] = set()
    seen_titles: Set[str] = set()
    enriched_signals: List[Dict[str, Any]] = []

    for item in raw_candidates:
        norm_u = normalize_url(item["source_url"])
        norm_t = normalize_title(item["title"])
        if not norm_u or not norm_t:
            continue
        if norm_u in seen_urls or norm_t in seen_titles:
            continue
        seen_urls.add(norm_u)
        seen_titles.add(norm_t)

        cves: List[str] = item.get("cve_ids", [])
        best_epss: Optional[float] = None
        best_percentile: Optional[float] = None

        for cve in cves:
            if cve in epss_lookup:
                score, pct = epss_lookup[cve]
                if best_epss is None or score > best_epss:
                    best_epss = score
                    best_percentile = pct

        classification = classify_signal(
            title=item["title"],
            summary=item["summary"],
            source_name=item["source_name"],
            source_tier=item["source_tier"],
            is_kev=bool(item.get("is_kev", False)),
            cve_ids=cves,
            epss_score=best_epss,
            ransomware_known=bool(item.get("ransomware_known", False)),
        )

        enriched_signals.append(
            {
                "published_at": item["published_at"],
                "title": item["title"],
                "summary": item["summary"],
                "source_name": item["source_name"],
                "source_tier": item["source_tier"],
                "source_url": item["source_url"],
                "domain": classification["domain"],
                "vectors": classification["vectors"],
                "sectors": classification["sectors"],
                "theaters": classification["theaters"],
                "actors": classification["actors"],
                "regulations": classification["regulations"],
                "exposure": classification["exposure"],
                "cve_ids": cves,
                "epss_score": best_epss,
                "epss_percentile": best_percentile,
                "ransomware_known": bool(item.get("ransomware_known", False)),
            }
        )

    # 5. Sort descending by published_at, then by exposure weight (HIGH > MODERATE > LOW)
    exposure_rank = {"HIGH": 3, "MODERATE": 2, "LOW": 1}
    enriched_signals.sort(
        key=lambda s: (
            s["published_at"],
            exposure_rank.get(s["exposure"], 0),
            s["epss_score"] or -1.0,
        ),
        reverse=True,
    )

    # 6. Assign deterministic IDs: SIG-YYYYMMDD-NNN
    date_counters: Dict[str, int] = {}
    final_signals: List[Dict[str, Any]] = []
    for sig in enriched_signals:
        ymd = sig["published_at"].replace("-", "")
        date_counters[ymd] = date_counters.get(ymd, 0) + 1
        seq = date_counters[ymd]
        sig_id = f"SIG-{ymd}-{seq:03d}"

        ordered_signal: Dict[str, Any] = {
            "id": sig_id,
            "published_at": sig["published_at"],
            "title": sig["title"],
            "summary": sig["summary"],
            "source_name": sig["source_name"],
            "source_tier": sig["source_tier"],
            "source_url": sig["source_url"],
            "domain": sig["domain"],
            "vectors": sig["vectors"],
            "sectors": sig["sectors"],
            "theaters": sig["theaters"],
            "actors": sig["actors"],
            "regulations": sig["regulations"],
            "exposure": sig["exposure"],
            "cve_ids": sig["cve_ids"],
            "epss_score": sig["epss_score"],
            "epss_percentile": sig["epss_percentile"],
            "ransomware_known": sig["ransomware_known"],
        }
        final_signals.append(ordered_signal)

    # 7. Compute 7-day & 30-day rolling metrics anchored strictly to last_ingest_utc
    anchor_date = datetime.date.fromisoformat(last_ingest_utc[:10])
    cutoff_7d = anchor_date - datetime.timedelta(days=7)
    cutoff_30d = anchor_date - datetime.timedelta(days=30)

    signals_7d: List[Dict[str, Any]] = []
    signals_30d: List[Dict[str, Any]] = []
    for sig in final_signals:
        try:
            d = datetime.date.fromisoformat(sig["published_at"])
            if cutoff_30d <= d <= anchor_date:
                signals_30d.append(sig)
            if cutoff_7d <= d <= anchor_date:
                signals_7d.append(sig)
        except ValueError:
            pass

    signals_total_30d = len(signals_30d)

    def _build_tempo_entry(name: str, count_7d: int, count_30d: int) -> Dict[str, Any]:
        weekly_baseline_30d = round(count_30d / (30.0 / 7.0), 2)
        if weekly_baseline_30d > 0:
            delta_pct = int(round(((count_7d - weekly_baseline_30d) / weekly_baseline_30d) * 100))
        else:
            delta_pct = 0

        if count_7d >= 3 and delta_pct >= 30:
            status = "ELEVATED"
        elif count_7d == 0:
            status = "QUIET"
        else:
            status = "BASELINE"

        return {
            "name": name,
            "count_7d": count_7d,
            "count_30d": count_30d,
            "weekly_baseline_30d": weekly_baseline_30d,
            "delta_pct": delta_pct,
            "status": status,
        }

    tempo_by_sector: List[Dict[str, Any]] = []
    for sector in CANONICAL_SECTORS:
        c7 = sum(1 for s in signals_7d if sector in s["sectors"])
        c30 = sum(1 for s in signals_30d if sector in s["sectors"])
        tempo_by_sector.append(_build_tempo_entry(sector, c7, c30))

    tempo_by_theater: List[Dict[str, Any]] = []
    for theater in CANONICAL_THEATERS:
        c7 = sum(1 for s in signals_7d if theater in s["theaters"])
        c30 = sum(1 for s in signals_30d if theater in s["theaters"])
        tempo_by_theater.append(_build_tempo_entry(theater, c7, c30))

    actor_counts_map: Dict[str, int] = {}
    for sig in signals_30d:
        for actor in sig["actors"]:
            actor_counts_map[actor] = actor_counts_map.get(actor, 0) + 1

    actor_order = {name: idx for idx, name in enumerate(CANONICAL_ACTORS)}
    top_actors_30d: List[Dict[str, Any]] = [
        {"name": actor, "count": count}
        for actor, count in sorted(
            actor_counts_map.items(),
            key=lambda kv: (-kv[1], actor_order.get(kv[0], 999)),
        )
        if count > 0
    ]

    nis2_exposure_alerts = sum(1 for s in final_signals if s["exposure"] == "HIGH")
    hybrid_kinetic_count = sum(
        1
        for s in final_signals
        if any(v in s["vectors"] for v in ("Sabotage", "Espionage/Proxies", "Influence"))
    )
    briefs_count = load_briefs_count()

    meta_payload: Dict[str, Any] = {
        "last_ingest_utc": last_ingest_utc,
        "last_ingest_cet": last_ingest_cet,
        "signals_total_30d": signals_total_30d,
        "nis2_exposure_alerts": nis2_exposure_alerts,
        "hybrid_kinetic_count": hybrid_kinetic_count,
        "briefs_count": briefs_count,
        "tempo": {
            "by_sector": tempo_by_sector,
            "by_theater": tempo_by_theater,
        },
        "top_actors_30d": top_actors_30d,
        "feeds_status": feeds_status,
    }

    with open(SIGNALS_PATH, "w", encoding="utf-8") as f:
        json.dump(final_signals, f, indent=2, ensure_ascii=False)
        f.write("\n")

    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(
        f"[INGEST COMPLETE] {len(final_signals)} signals saved "
        f"({signals_total_30d} in 30D window, {nis2_exposure_alerts} HIGH exposure alerts)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
