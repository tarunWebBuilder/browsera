from typing import Dict, Any, List, Set, Tuple
from utils import validate_inputs, logger
from urllib.parse import urljoin, urlparse, urldefrag
import httpx
from bs4 import BeautifulSoup
import re
import asyncio

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "rootUrl": {"type": "string"},
        "maxPages": {"type": "integer"},
        "maxDepth": {"type": "integer"},
        "sameDomainOnly": {"type": "boolean"},
        "timeoutMs": {"type": "integer"}
    },
    "required": ["rootUrl"]
}

def _normalize_url(base: str, link: str) -> str:
    full = urljoin(base, link)
    full, _ = urldefrag(full)  # remove #hash
    return full.strip()

def _same_domain(root: str, url: str) -> bool:
    return urlparse(root).netloc == urlparse(url).netloc

def _extract_text_and_links(html: str, base_url: str) -> Tuple[str, str, List[str]]:
    soup = BeautifulSoup(html, "lxml")

    # Remove noisy tags
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    title = soup.title.get_text(strip=True) if soup.title else ""

    text = soup.get_text(" ")
    text = re.sub(r"\s+", " ", text).strip()

    links = []
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


async def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    """
    Crawl a static/HTML site and return list of pages with title/text/links.
    Works without Playwright sessions.
    """
    validate_inputs(PARAMETER_SCHEMA, inputs)

    root_url = inputs["rootUrl"].strip()
    max_pages = inputs.get("maxPages", 50)
    max_depth = inputs.get("maxDepth", 2)
    same_domain_only = inputs.get("sameDomainOnly", True)

    timeout_ms = inputs.get("timeoutMs", config.get("timeoutMs", 15000))
    timeout = httpx.Timeout(timeout_ms / 1000)

    visited: Set[str] = set()
    results: List[Dict[str, Any]] = []
    errors: List[Dict[str, str]] = []

    queue: asyncio.Queue = asyncio.Queue()
    await queue.put((root_url, 0))

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:

        async def worker():
            while True:
                try:
                    url, depth = queue.get_nowait()
                except asyncio.QueueEmpty:
                    return

                if url in visited:
                    queue.task_done()
                    continue

                if depth > max_depth:
                    queue.task_done()
                    continue

                if len(visited) >= max_pages:
                    queue.task_done()
                    continue

                visited.add(url)

                try:
                    resp = await client.get(url)
                    if resp.status_code >= 400:
                        errors.append({"url": url, "reason": f"HTTP {resp.status_code}"})
                        queue.task_done()
                        continue

                    content_type = resp.headers.get("content-type", "")
                    if "text/html" not in content_type:
                        # skip non-html
                        queue.task_done()
                        continue

                    title, text, links = _extract_text_and_links(resp.text, url)

                    results.append({
                        "url": url,
                        "title": title,
                        "text": text,
                        "links": links
                    })

                    # enqueue new links
                    for link in links:
                        if same_domain_only and not _same_domain(root_url, link):
                            continue
                        if link not in visited:
                            await queue.put((link, depth + 1))

                except Exception as e:
                    errors.append({"url": url, "reason": str(e)})
                finally:
                    queue.task_done()

        # Run multiple workers for speed
        concurrency = config.get("concurrency", 5)
        tasks = [asyncio.create_task(worker()) for _ in range(concurrency)]
        await asyncio.gather(*tasks)

    return {
        "success": True,
        "rootUrl": root_url,
        "summary": {
            "pagesCrawled": len(results),
            "uniqueSeen": len(visited),
            "errors": len(errors),
        },
        "pages": results,
        "errors": errors,
    }
