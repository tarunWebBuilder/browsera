from __future__ import annotations

import json
import os
import re
import time
from typing import Any, Dict, List, Optional

import requests
from engine.session_store import SESSION_STORE
from playwright.async_api import TimeoutError, async_playwright
from utils import logger
from webscraping.solve_captcha import execute as solve_captcha_execute
from webscraping.solve_os_captcha import execute as solve_os_captcha_execute


async def _ensure_session(session_id: str, headers: Dict[str, str]) -> Any:
    if session_id not in SESSION_STORE:
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()
        if headers:
            await page.set_extra_http_headers(headers)
        SESSION_STORE[session_id] = {
            "browser": browser,
            "page": page,
            "playwright": playwright,
        }
    return SESSION_STORE[session_id]["page"]


async def _read_text_selector(page, selector: str) -> Optional[str]:
    try:
        el = await page.query_selector(selector)
        if not el:
            return None
        return (await el.inner_text()).strip()
    except Exception:
        return None


async def _extract_table_rows(page, table_selector: str) -> List[Dict[str, Any]]:
    headers: List[str] = []
    records: List[Dict[str, Any]] = []

    # Allow callers to pass either a table selector or a row selector.
    if "tr" in table_selector:
        rows_selector = table_selector
        header_selector = None
    else:
        rows_selector = f"{table_selector} tbody tr"
        header_selector = f"{table_selector} thead th"

    try:
        if header_selector:
            header_cells = await page.query_selector_all(header_selector)
            for cell in header_cells:
                text = (await cell.inner_text()).strip()
                headers.append(text or f"col_{len(headers) + 1}")
    except Exception:
        headers = []

    row_cells = await page.query_selector_all(rows_selector)
    for row in row_cells:
        try:
            cells = await row.query_selector_all("td")
            values = [(await cell.inner_text()).strip() for cell in cells]
            if not any(values):
                continue
            if headers and len(headers) == len(values):
                records.append(dict(zip(headers, values)))
            else:
                records.append({f"col_{idx + 1}": value for idx, value in enumerate(values)})
        except Exception:
            continue

    return records



def _solve_captcha_with_2captcha(img_bytes: bytes, api_key: str, timeout: int = 120) -> Optional[str]:
    try:
        submit_resp = requests.post(
            "http://2captcha.com/in.php",
            files={"file": ("captcha.jpg", img_bytes)},
            data={"key": api_key, "method": "post"},
            timeout=30,
        )
        if "OK|" not in submit_resp.text:
            logger.error(f"2Captcha submit failed: {submit_resp.text}")
            return None
        captcha_id = submit_resp.text.split("|", 1)[1]

        start = time.time()
        while time.time() - start < timeout:
            time.sleep(5)
            res = requests.get(
                "http://2captcha.com/res.php",
                params={"key": api_key, "action": "get", "id": captcha_id},
                timeout=15,
            )
            if res.text == "CAPCHA_NOT_READY":
                continue
            if "OK|" in res.text:
                return res.text.split("|", 1)[1]
            logger.error(f"2Captcha error: {res.text}")
            return None
    except Exception as exc:
        logger.error(f"2Captcha exception: {exc}")
    return None


async def _solve_captcha(page, captcha_image_selector: str, captcha_input_selector: str, api_key: str) -> bool:
    try:
        img_el = await page.query_selector(captcha_image_selector)
        if not img_el:
            logger.error("Captcha image element not found")
            return False
        img_bytes = await img_el.screenshot()
        solved = _solve_captcha_with_2captcha(img_bytes, api_key)
        if not solved:
            return False
        await page.fill(captcha_input_selector, solved)
        return True
    except Exception as exc:
        logger.error(f"Captcha solving failed: {exc}")
        return False


def _extract_captcha_text(solution: Any) -> Optional[str]:
    if solution is None:
        return None
    if isinstance(solution, dict):
        if "code" in solution:
            return str(solution["code"]).strip()
        if "text" in solution:
            return str(solution["text"]).strip()
    return str(solution).strip()


async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    session_id = config.get("sessionId")
    if not session_id:
        raise ValueError("Missing sessionId")
    print(inputs)
    url = inputs.get("url")
    if not url or not re.match(r"^https?://", url):
        raise ValueError("Invalid URL")

    timeout_ms = config.get("timeoutMs", 45000)
    headers = config.get("headers", {})

    page = await _ensure_session(session_id, headers)

    # Lightweight network debug: log XHR/Fetch URLs and status codes
    async def _log_resp(resp):
        try:
            if resp.request.resource_type in ("xhr", "fetch"):
                print(f"[solveAndPaginate][resp] {resp.request.method} {resp.url} {resp.status}")
        except Exception:
            pass
    page.on("response", _log_resp)

    selectors_raw = inputs.get("selectors", {})
    if selectors_raw in (None, ""):
        selectors_raw = {}

    def _coerce_selectors(val: Any) -> Dict[str, Any]:
        if isinstance(val, dict):
            return val
        if isinstance(val, str):
            try:
                return json.loads(val)
            except Exception:
                # Fallback: try safe literal eval for slightly malformed JSON (e.g., single quotes)
                import ast

                try:
                    parsed = ast.literal_eval(val)
                    if isinstance(parsed, dict):
                        return parsed
                except Exception:
                    pass

                # Last resort: if the string looks like it already has a "selectors": {...} fragment without braces
                frag = val.strip()
                if '"selectors":' in frag and not frag.lstrip().startswith("{"):
                    wrapped = "{" + frag + "}"
                    try:
                        parsed = json.loads(wrapped)
                        if isinstance(parsed, dict):
                            if "selectors" in parsed and isinstance(parsed["selectors"], dict):
                                return parsed["selectors"]
                            return parsed
                    except Exception:
                        try:
                            parsed = ast.literal_eval(wrapped)
                            if isinstance(parsed, dict):
                                if "selectors" in parsed and isinstance(parsed["selectors"], dict):
                                    return parsed["selectors"]
                                return parsed
                        except Exception:
                            pass
        raise ValueError(f"selectors must be an object (or JSON object string); got {type(val).__name__}: {val}")

    selectors = _coerce_selectors(selectors_raw)
    print(f"[solveAndPaginate] selectors received (type={type(selectors).__name__}): {selectors}")
    # Prefer user-supplied selector; fall back to a generic table rows selector.
    rows_selector = selectors.get("rowsSelector") 
    next_selector = selectors.get("nextSelector")
    submit_selector = selectors.get("submitSelector")
    form_fields: Dict[str, Any] = selectors.get("formFields", {}) or {}
    captcha_image_selector = selectors.get("captchaImageSelector")
    captcha_input_selector = selectors.get("captchaInputSelector")
    captcha_text_selector = selectors.get("captchaTextSelector", "#captcha-code")

    solve_captcha = inputs.get("solveCaptcha", False)
    captcha_api_key = (
        inputs.get("captchaApiKey")
        or os.getenv("CAPTCHA_API_KEY")
        or os.getenv("TWO_CAPTCHA_API_KEY")
        or os.getenv("TWOCAPTCHA_API_KEY")
    )
    captcha_type = inputs.get("captchaType")  # optional: align with solve_captcha
    use_os_solver = (captcha_type or "image") in ("image", "normal", "number", "text", "math")

    follow_pagination = inputs.get("followPagination", True)
    max_pages = inputs.get("maxPages", 200)
    max_records = inputs.get("maxRecords", 10000)

    stats = {"captchasSolved": 0, "failedCaptchas": 0}
    records: List[Dict[str, Any]] = []
    pages_fetched = 0
    last_page_html = ""

    start = time.time()
    try:
        logger.info(f"[solveAndPaginate] session={session_id} url={url} captchaType={captcha_type} useOsSolver={use_os_solver} solveCaptcha={solve_captcha}")
        await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)

        # Fill dynamic form fields (e.g., date ranges)
        for selector, value in form_fields.items():
            if value is None:
                continue
            try:
                await page.fill(selector, str(value))
            except Exception as exc:
                logger.warning(f"Could not fill selector {selector}: {exc}")

        if solve_captcha and captcha_input_selector:
            # Prefer unified solve_captcha action so users can choose captchaType; fallback to inline image solve.
            if captcha_image_selector or captcha_type:
                logger.info(
                    f"[solveAndPaginate] captcha start type={captcha_type} imageSelector={captcha_image_selector} textSelector={captcha_text_selector} inputSelector={captcha_input_selector}"
                )
                try:
                    solve_result = None
                    solved_text: Optional[str] = None

                    if use_os_solver:
                        # If captcha text is directly in the DOM, read it before trying OCR.
                        if captcha_text_selector:
                            solved_text = await _read_text_selector(page, captcha_text_selector)
                            if not solved_text:
                                raise ValueError("captchaTextSelector provided but no text found")
                            logger.info(f"[solveAndPaginate] captcha text read from selector '{captcha_text_selector}': {solved_text}")
                        else:
                            if not (captcha_image_selector or inputs.get("imagePath") or inputs.get("imageBase64")):
                                raise ValueError("Provide imagePath, imageBase64, or imageSelector for image captcha")
                            base_payload: Dict[str, Any] = {
                                "captchaType": captcha_type or "image",
                                "imageSelector": captcha_image_selector,
                                "imagePath": inputs.get("imagePath"),
                                "imageBase64": inputs.get("imageBase64"),
                                "text": inputs.get("text"),
                            }
                            payload = {k: v for k, v in base_payload.items() if v not in (None, "")}
                            logger.info(f"[solveAndPaginate] captcha payload (os): {payload}")
                            solve_result = await solve_os_captcha_execute(payload, config)
                    else:
                        if not captcha_api_key:
                            raise ValueError("solveCaptcha enabled but no captchaApiKey provided")
                        # Build payload aligned with solve_captcha inputs.
                        base_payload = {
                            "captchaType": captcha_type or "image",
                            "captchaApiKey": captcha_api_key,
                            "imageSelector": captcha_image_selector,
                            "pageUrl": inputs.get("pageUrl") or url,
                            "siteKey": inputs.get("siteKey"),
                            "score": inputs.get("score", 0.3),
                            "gt": inputs.get("gt"),
                            "challenge": inputs.get("challenge"),
                            "apiServer": inputs.get("apiServer"),
                            "surl": inputs.get("surl"),
                            "captchaUrl": inputs.get("captchaUrl"),
                            "userAgent": inputs.get("userAgent"),
                            "text": inputs.get("text"),
                        }
                        payload = {k: v for k, v in base_payload.items() if v not in (None, "")}
                        logger.info(f"[solveAndPaginate] captcha payload (2captcha): {payload}")
                        solve_result = await solve_captcha_execute(payload, config)

                    # If we already solved via direct text read, fill and skip extraction
                    if solved_text is not None:
                        await page.fill(captcha_input_selector, solved_text)
                        stats["captchasSolved"] += 1
                        logger.info("[solveAndPaginate] captcha solved via direct text selector and filled")
                    else:
                        logger.info(f"[solveAndPaginate] captcha solve_result: {solve_result}")
                        solved_text = _extract_captcha_text(solve_result.get("solution"))
                        logger.info(f"[solveAndPaginate] captcha solved_text: {solved_text}")
                    if solved_text:
                        await page.fill(captcha_input_selector, solved_text)
                        stats["captchasSolved"] += 1
                        logger.info("[solveAndPaginate] captcha filled successfully")
                    else:
                        stats["failedCaptchas"] += 1
                        logger.info("[solveAndPaginate] captcha solution missing; marked failed")
                except Exception as exc:
                    logger.error(f"[solveAndPaginate] solveCaptcha action failed: {exc}")
                    solved = False
                    if not use_os_solver and captcha_api_key:
                        solved = await _solve_captcha(page, captcha_image_selector or "", captcha_input_selector, captcha_api_key)
                    if solved:
                        stats["captchasSolved"] += 1
                        logger.info("[solveAndPaginate] fallback 2captcha inline succeeded")
                    else:
                        stats["failedCaptchas"] += 1
                        logger.info("[solveAndPaginate] fallback captcha solve failed")
            else:
                captcha_text = await _read_text_selector(page, captcha_text_selector) or await _read_text_selector(page, "#randomid")
                if captcha_text:
                    await page.fill(captcha_input_selector, captcha_text)
                    stats["captchasSolved"] += 1
                    logger.info(f"[solveAndPaginate] captcha solved via fallback text read: {captcha_text}")
                else:
                    stats["failedCaptchas"] += 1
                    logger.info("[solveAndPaginate] captcha text fallback failed")

        if submit_selector:
            try:
                await page.click(submit_selector, timeout=timeout_ms)
            except Exception as exc:
                logger.error(f"Submit click failed: {exc}")

        # Give the page a chance to render results after submit.
        try:
            await page.wait_for_load_state("networkidle", timeout=timeout_ms)
        except Exception:
            pass

        # DEBUG: dump page HTML and current records snapshot after captcha + submit
        try:
            page_html = await page.content()
            print(f"[solveAndPaginate] page HTML after submit (first 5000 chars): {page_html[:5000]}")
        except Exception as exc:
            print(f"[solveAndPaginate] could not read page content: {exc}")

        # Wait briefly for rows to render (and support selectors that already point to tr)
        try:
            await page.wait_for_timeout(1000)
            if "tr" in rows_selector:
                await page.wait_for_selector(rows_selector, timeout=5000)
            else:
                await page.wait_for_selector(f"{rows_selector} tbody tr, {rows_selector}", timeout=5000)
            print(f"[solveAndPaginate] rows selector appeared")
        except Exception as exc:
            print(f"[solveAndPaginate] rows selector not ready yet: {exc}")

        try:
            rows_el = await page.query_selector(rows_selector)
            if rows_el:
                snippet = await rows_el.inner_html()
                print(f"[solveAndPaginate] rows selector innerHTML (first 2000 chars): {snippet[:2000]}")
            else:
                print("[solveAndPaginate] rows selector not found for innerHTML dump")
        except Exception as exc:
            print(f"[solveAndPaginate] error dumping rows selector HTML: {exc}")

        while pages_fetched < max_pages and len(records) < max_records:
            await page.wait_for_timeout(500)
            try:
                print(f"[solveAndPaginate] extracting rows with selector: {rows_selector}")
                page_records = await _extract_table_rows(page, rows_selector)
                print(f"[solveAndPaginate] rows found: {len(page_records)}")
                if page_records:
                    print(f"[solveAndPaginate] first row sample: {page_records[0]}")
                for record in page_records:
                    records.append(record)
                    if len(records) >= max_records:
                        break
            except Exception as exc:
                print(f"[solveAndPaginate] row selection error: {exc}")
                logger.error(f"Row selection failed: {exc}")

            pages_fetched += 1
            last_page_html = await page.content()

            if not follow_pagination or len(records) >= max_records:
                break

            if not next_selector:
                next_el = await page.query_selector("a:has-text('Next')")
            else:
                next_el = await page.query_selector(next_selector)
            if not next_el:
                break

            try:
                disabled = await next_el.is_disabled()
            except Exception:
                disabled = False

            if disabled:
                break

            try:
                await next_el.click()
            except TimeoutError:
                break
            except Exception as exc:
                logger.error(f"Next click failed: {exc}")
                break

        success = True
    except Exception as exc:
        logger.error(f"solveAndPaginateHtml error: {exc}")
        success = False

    elapsed_ms = int((time.time() - start) * 1000)
    return {
        "success": success,
        "rootUrl": url,
        "pagesFetched": pages_fetched,
        "recordsCollected": len(records),
        "records": records[:max_records],
     #   "lastPageHtml": last_page_html[:200000],  # cap payload
        "debug": {**stats, "elapsedMs": elapsed_ms},
        "sessionId": session_id,
    }
