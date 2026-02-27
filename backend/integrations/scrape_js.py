from typing import Dict, Any, List, Set, Tuple, Optional
from utils import validate_inputs, logger
from urllib.parse import urljoin, urlparse, urldefrag
from bs4 import BeautifulSoup
import re
import httpx
import asyncio
from playwright.async_api import async_playwright, TimeoutError as PWTimeoutError

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "rootUrl": {"type": "string"},
        "maxPages": {"type": "integer"},
        "maxDepth": {"type": "integer"},
        "sameDomainOnly": {"type": "boolean"},
        "respectRobotsTxt": {"type": "boolean"},
        "timeoutMs": {"type": "integer"}
    },
    "required": ["rootUrl"]
}

_CAPTCHA_MARKERS = [
    "captcha", "recaptcha", "hcaptcha", "verify you are human",
    "cloudflare", "attention required", "challenge-platform", "security check"
]

def _normalize_url(base: str, link: str) -> str:
    full = urljoin(base, link)
    full, _ = urldefrag(full)
    return full.strip()

def _same_domain(root: str, url: str) -> bool:
    return urlparse(root).netloc == urlparse(url).netloc

def _extract_text_and_links_from_dom(html: str, base_url: str) -> Tuple[str, str, List[str]]:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    title = soup.title.get_text(strip=True) if soup.title else ""
    text = soup.get_text(" ")
    text = re.sub(r"\s+", " ", text).strip()

    links: List[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href:
            links.append(_normalize_url(base_url, href))

    # dedupe preserve order
    seen = set()
    deduped = []
    for l in links:
        if l not in seen:
            seen.add(l)
            deduped.append(l)

    return title, text, deduped

async def _fetch_robots_disallow(root_url: str, timeout_ms: int) -> Optional[List[str]]:
    try:
        robots_url = urljoin(root_url, "/robots.txt")
        timeout = httpx.Timeout(timeout_ms / 1000)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(robots_url, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code != 200:
                return None
            disallow = []
            current_agents = []
            for line in r.text.splitlines():
                line = line.strip()
                if not line or line.startswith("#") or ":" not in line:
                    continue
                k, v = [x.strip() for x in line.split(":", 1)]
                k = k.lower()
                if k == "user-agent":
                    current_agents = [v]
                elif k == "disallow":
                    if "*" in current_agents:
                        disallow.append(v)
            return disallow
    except Exception:
        return None

def _is_disallowed(url: str, disallow_rules: List[str]) -> bool:
    path = urlparse(url).path or "/"
    for rule in disallow_rules:
        if not rule:
            continue
        # very basic prefix match
        if path.startswith(rule):
            return True
    return False

def _detect_captcha_page(title: str, text: str, html: str) -> bool:
    blob = f"{title}\n{text}\n{html}".lower()
    return any(marker in blob for marker in _CAPTCHA_MARKERS)

async def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    """
    Crawl a JS-rendered site using Playwright, returning pages[] with title/text/links.
    Stops early if it detects CAPTCHA / bot-challenge pages (does NOT bypass them).
    """
    validate_inputs(PARAMETER_SCHEMA, inputs)

    root_url = inputs["rootUrl"].strip()
    max_pages = inputs.get("maxPages", 30)
    max_depth = inputs.get("maxDepth", 2)
    same_domain_only = inputs.get("sameDomainOnly", True)
    respect_robots = inputs.get("respectRobotsTxt", True)

    timeout_ms = inputs.get("timeoutMs", config.get("timeoutMs", 20000))

    disallow_rules: List[str] = []
    if respect_robots:
        fetched = await _fetch_robots_disallow(root_url, timeout_ms=timeout_ms)
        if fetched:
            disallow_rules = fetched

    visited: Set[str] = set()
    pages: List[Dict[str, Any]] = []
    errors: List[Dict[str, str]] = []
    stopped_due_to_captcha = False
    captcha_page_url = None

    queue: asyncio.Queue = asyncio.Queue()
    await queue.put((root_url, 0))

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        async def process_url(url: str, depth: int):
            nonlocal stopped_due_to_captcha, captcha_page_url

            if url in visited:
                return
            if depth > max_depth:
                return
            if len(visited) >= max_pages:
                return
            if same_domain_only and not _same_domain(root_url, url):
                return
            if respect_robots and disallow_rules and _is_disallowed(url, disallow_rules):
                return

            visited.add(url)

            page = await context.new_page()
            try:
                await page.goto(url, wait_until="networkidle", timeout=timeout_ms)

                # rendered DOM HTML
                html = await page.content()
                title = await page.title()

                # Extract text/links from rendered HTML
                t, text, links = _extract_text_and_links_from_dom(html, url)
                title = title or t

                # CAPTCHA detection: if detected, stop crawl early
                if _detect_captcha_page(title, text, html):
                    stopped_due_to_captcha = True
                    captcha_page_url = url
                    return

                pages.append({
                    "url": url,
                    "title": title.strip(),
                    "text": text,
                    "links": links,
                    "depth": depth
                })

                # enqueue next
                for link in links:
                    if link not in visited:
                        await queue.put((link, depth + 1))

            except PWTimeoutError:
                errors.append({"url": url, "reason": "Playwright timeout"})
            except Exception as e:
                errors.append({"url": url, "reason": str(e)})
            finally:
                await page.close()

        # Simple loop (serial). You can make it concurrent later.
        while not queue.empty() and not stopped_due_to_captcha and len(visited) < max_pages:
            url, depth = await queue.get()
            await process_url(url, depth)
            queue.task_done()

        await context.close()
        await browser.close()

    return {
        "success": True,
        "rootUrl": root_url,
        "summary": {
            "pagesCrawled": len(pages),
            "uniqueSeen": len(visited),
            "errors": len(errors),
            "stoppedDueToCaptcha": stopped_due_to_captcha
        },
        "robotsTxt": {
            "respected": respect_robots,
            "disallowCount": len(disallow_rules)
        },
        "captcha": {
            "detected": stopped_due_to_captcha,
            "pageUrl": captcha_page_url
        },
        "pages": pages,
        "errors": errors
    }
