from typing import Dict, Any, List, Optional
from utils import validate_inputs, logger
from urllib.parse import urljoin, urlparse
import re
import httpx
from bs4 import BeautifulSoup

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "rootUrl": {"type": "string"},
        "timeoutMs": {"type": "integer"},

        # NEW optional toggles
        "estimateFromSitemap": {"type": "boolean"},
        "maxSitemapUrls": {"type": "integer"},
        "checkDefaultSitemap": {"type": "boolean"},
    },
    "required": ["rootUrl"]
}

_CAPTCHA_PATTERNS = [
    r"captcha",
    r"recaptcha",
    r"hcaptcha",
    r"verify you are human",
    r"cloudflare",
    r"attention required",
    r"challenge-platform",
    r"security check",
]

DEFAULT_SITEMAP_PATHS = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap-index.xml",
    "/sitemap1.xml",
]
def _extract_links(html: str, root_url: str, limit: int = 200) -> Dict[str, List[str]]:
    soup = BeautifulSoup(html, "lxml")
    anchors = soup.find_all("a", href=True)

    root_host = urlparse(root_url).netloc
    internal = []
    external = []

    for a in anchors:
        href = a["href"].strip()
        if not href or href.startswith("#") or href.lower().startswith("javascript:"):
            continue

        full = urljoin(root_url, href)
        host = urlparse(full).netloc

        if not host:
            continue

        if host == root_host:
            internal.append(full)
        else:
            external.append(full)

        if len(internal) >= limit and len(external) >= limit:
            break

    # unique
    internal = list(dict.fromkeys(internal))
    external = list(dict.fromkeys(external))

    return {"internalUrlsSample": internal[:limit], "externalUrlsSample": external[:limit]}








def _looks_js_heavy(html: str) -> bool:
    lower = html.lower()
    has_app_root = any(x in lower for x in ['id="root"', 'id="app"', 'data-reactroot', 'nextjs', '__nuxt'])
    textish = re.sub(r"<[^>]+>", " ", html)
    textish = re.sub(r"\s+", " ", textish).strip()
    very_little_text = len(textish) < 1200
    return has_app_root and very_little_text

def _detect_captcha_signals(html: str) -> List[str]:
    lower = html.lower()
    hits = []
    for pat in _CAPTCHA_PATTERNS:
        if re.search(pat, lower):
            hits.append(pat)
    return hits

def _parse_robots_txt(robots_txt: str, user_agent: str = "*") -> Dict[str, Any]:
    lines = [l.strip() for l in robots_txt.splitlines()]
    current_agents = []
    disallow = []
    allow = []
    sitemaps = []

    for line in lines:
        if not line or line.startswith("#") or ":" not in line:
            continue

        k, v = [x.strip() for x in line.split(":", 1)]
        k_low = k.lower()

        if k_low == "user-agent":
            current_agents = [v]
        elif k_low == "disallow":
            if "*" in current_agents or user_agent in current_agents:
                disallow.append(v)
        elif k_low == "allow":
            if "*" in current_agents or user_agent in current_agents:
                allow.append(v)
        elif k_low == "sitemap":
            sitemaps.append(v)

    return {"disallow": disallow, "allow": allow, "sitemaps": sitemaps}

def _extract_meta(html: str, root_url: str) -> Dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")

    title = soup.title.get_text(strip=True) if soup.title else ""

    def meta(name: str) -> str:
        tag = soup.find("meta", attrs={"name": name})
        return (tag.get("content") or "").strip() if tag else ""

    def prop(property_name: str) -> str:
        tag = soup.find("meta", attrs={"property": property_name})
        return (tag.get("content") or "").strip() if tag else ""

    canonical = ""
    link_tag = soup.find("link", rel="canonical")
    if link_tag and link_tag.get("href"):
        canonical = urljoin(root_url, link_tag["href"].strip())

    description = meta("description") or prop("og:description")
    og_title = prop("og:title")
    og_description = prop("og:description")

    return {
        "title": title,
        "description": description,
        "ogTitle": og_title,
        "ogDescription": og_description,
        "canonical": canonical,
    }

def _count_links(html: str, root_url: str) -> Dict[str, int]:
    soup = BeautifulSoup(html, "lxml")
    anchors = soup.find_all("a", href=True)

    root_host = urlparse(root_url).netloc
    internal = 0
    external = 0

    for a in anchors:
        href = a["href"].strip()
        full = urljoin(root_url, href)
        host = urlparse(full).netloc

        if not host:
            continue

        if host == root_host:
            internal += 1
        else:
            external += 1

    return {"internalLinksFound": internal, "externalLinksFound": external}

def _looks_like_sitemap_xml(text: str) -> bool:
    low = text.lower()
    return "<urlset" in low or "<sitemapindex" in low

async def _find_default_sitemaps(client: httpx.AsyncClient, root_url: str) -> List[str]:
    found = []

    for path in DEFAULT_SITEMAP_PATHS:
        url = urljoin(root_url, path)
        try:
            r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200 and r.text.strip() and _looks_like_sitemap_xml(r.text):
                found.append(url)
        except Exception:
            continue

    return found

async def _estimate_urls_from_sitemap(
    client: httpx.AsyncClient,
    sitemap_url: str,
    max_urls: int
) -> Optional[int]:
    """
    Returns count of <loc> entries in a sitemap XML.
    Supports sitemapindex recursively.
    Safety: stops after max_urls locs total.
    """
    try:
        r = await client.get(sitemap_url, headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code != 200 or not r.text.strip():
            return None

        xml = r.text
        locs = re.findall(r"<loc>\s*([^<]+)\s*</loc>", xml, flags=re.IGNORECASE)
        if not locs:
            return 0

        is_index = "<sitemapindex" in xml.lower()
        if not is_index:
            return min(len(locs), max_urls)

        total = 0
        for sub in locs:
            if total >= max_urls:
                break
            sub_count = await _estimate_urls_from_sitemap(client, sub.strip(), max_urls - total)
            if sub_count is None:
                continue
            total += sub_count

        return total

    except Exception:
        return None


async def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    root_url = inputs["rootUrl"].strip()
    timeout_ms = inputs.get("timeoutMs", config.get("timeoutMs", 12000))
    timeout = httpx.Timeout(timeout_ms / 1000)

    estimate_from_sitemap = inputs.get("estimateFromSitemap", True)
    max_sitemap_urls = inputs.get("maxSitemapUrls", 5000)
    check_default_sitemap = inputs.get("checkDefaultSitemap", True)

    robots_url = urljoin(root_url, "/robots.txt")

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        # Fetch main page (raw HTML)
        try:
            r = await client.get(root_url, headers={"User-Agent": "Mozilla/5.0"})
            html = r.text
            status_code = r.status_code
            links_sample = _extract_links(html, root_url, limit=200)


            js_heavy = _looks_js_heavy(html)
            captcha_signals = _detect_captcha_signals(html)

            meta = _extract_meta(html, root_url)
            link_counts = _count_links(html, root_url)

            headers = {
                "contentType": r.headers.get("content-type"),
                "contentLength": r.headers.get("content-length"),
                "server": r.headers.get("server"),
            }

        except Exception as e:
            logger.error(str(e))
            return {"success": False, "error": f"Failed to fetch rootUrl: {e}"}

        # Fetch robots.txt
        robots_exists = False
        robots_info = None
        sitemap_urls: List[str] = []

        try:
            rr = await client.get(robots_url, headers={"User-Agent": "Mozilla/5.0"})
            if rr.status_code == 200 and rr.text.strip():
                robots_exists = True
                robots_info = _parse_robots_txt(rr.text, user_agent="*")
                sitemap_urls = (robots_info.get("sitemaps") or [])[:10]
        except Exception:
            robots_exists = False

        # NEW: if robots doesn't list sitemap, try default sitemap paths
        default_sitemap_found = False
        default_sitemaps = []
        if check_default_sitemap and not sitemap_urls:
            default_sitemaps = await _find_default_sitemaps(client, root_url)
            if default_sitemaps:
                default_sitemap_found = True
                sitemap_urls = default_sitemaps[:10]

        # NEW: estimate URL count from sitemap(s)
        url_count_estimate = None
        if estimate_from_sitemap and sitemap_urls:
            url_count_estimate = await _estimate_urls_from_sitemap(
                client,
                sitemap_urls[0],
                max_urls=max_sitemap_urls
            )

    return {
        "success": True,
        "rootUrl": root_url,
        "analysis": {
            "httpStatus": status_code,
            "likelyJsRendered": js_heavy,
            "captchaSignalsDetected": len(captcha_signals) > 0,
            "captchaSignals": captcha_signals[:8],
            "linkSamples": links_sample,


            # NEW fields
            "metadata": meta,
            "headers": headers,
            "homepageLinks": link_counts,

            "robotsTxt": {
                "exists": robots_exists,
                "url": robots_url,
                "parsed": robots_info
            },

            # NEW sitemap info (your "sburl")
            "sitemapUrls": sitemap_urls,
            "defaultSitemapChecked": check_default_sitemap,
            "defaultSitemapFound": default_sitemap_found,
            "urlCountEstimate": url_count_estimate,

            "note": "This analysis is heuristic-based. URL count is estimated from sitemap when available."
        }
    }
