from playwright.async_api import async_playwright
from typing import Dict, Any
from engine.session_store import SESSION_STORE
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {"type": "string"}
    },
    "required": ["url"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    include_frames = config.get("includeFrames", False)
    session_id = config.get("sessionId")

    playwright = None
    browser = None
    page = None
    forms = []
    tables = []
    captcha_selectors: Dict[str, str] = {}
    captcha_types = set()
    created_ephemeral_session = False

    try:
        if session_id:
            if session_id not in SESSION_STORE:
                playwright = await async_playwright().start()
                browser = await playwright.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                SESSION_STORE[session_id] = {
                    "playwright": playwright,
                    "browser": browser,
                    "context": context,
                    "page": page,
                }
            else:
                page = SESSION_STORE[session_id]["page"]
        else:
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            created_ephemeral_session = True

        await page.goto(inputs["url"], wait_until="domcontentloaded")
        # Basic form extraction
        forms = await page.eval_on_selector_all(
            "form",
            """forms => forms.map(form => {
                const inputs = Array.from(form.querySelectorAll("input, textarea, select")).map(el => {
                    const id = el.getAttribute("id") || "";
                    const name = el.getAttribute("name") || "";
                    let selector = "";
                    try {
                        if (id) selector = `#${CSS.escape(id)}`;
                        else if (name) selector = `[name="${CSS.escape(name)}"]`;
                        else selector = el.tagName.toLowerCase();
                    } catch (e) {
                        selector = el.tagName.toLowerCase();
                    }
                    return {
                        name,
                        id,
                        selector,
                        type: el.getAttribute("type") || el.tagName.toLowerCase(),
                        placeholder: el.getAttribute("placeholder") || ""
                    };
                });
                const buildSelector = (el) => {
                    if (!el) return "";
                    const sid = el.getAttribute && el.getAttribute("id");
                    const sname = el.getAttribute && el.getAttribute("name");
                    const sclass = el.getAttribute && el.getAttribute("class");
                    if (sid) return `#${CSS.escape(sid)}`;
                    if (sname) return `[name="${CSS.escape(sname)}"]`;
                    if (sclass) return `${el.tagName.toLowerCase()}.${sclass.split(/\\s+/).map(c => CSS.escape(c)).join(".")}`;
                    const parent = el.parentElement;
                    if (!parent) return el.tagName.toLowerCase();
                    const siblings = Array.from(parent.children).filter(child => child.tagName === el.tagName);
                    const index = siblings.indexOf(el) + 1;
                    return `${el.tagName.toLowerCase()}:nth-of-type(${index})`;
                };
                const submitTextMatch = (el) => {
                    const text = (el.innerText || el.value || "").trim().toLowerCase();
                    return text === "submit" || text.includes("submit");
                };
                const submitSelectors = [
                    "button[type='submit']",
                    "input[type='submit']",
                    "button:not([type])",
                    "input[type='button']",
                    "button"
                ];
                let submitEl =
                    form.querySelector(submitSelectors.join(",")) ||
                    (form.getAttribute("id")
                        ? document.querySelector(`button[form="${form.getAttribute("id")}"], input[form="${form.getAttribute("id")}"]`)
                        : null);
                if (!submitEl) {
                    const container = form.parentElement || document.body;
                    submitEl = Array.from(container.querySelectorAll(submitSelectors.join(",")))
                        .find((el) => submitTextMatch(el)) || null;
                }
                if (!submitEl) {
                    submitEl = Array.from(document.querySelectorAll(submitSelectors.join(",")))
                        .find((el) => submitTextMatch(el)) || null;
                }
                const submitSelector = buildSelector(submitEl);
                return {
                    action: form.getAttribute("action") || "",
                    method: (form.getAttribute("method") || "get").toLowerCase(),
                    id: form.getAttribute("id") || "",
                    name: form.getAttribute("name") || "",
                    inputs,
                    submitSelector
                };
            })"""
        )

        captcha_selectors = await page.evaluate(
            """() => {
                const buildSelector = (el) => {
                    if (!el) return "";
                    const id = el.getAttribute && el.getAttribute("id");
                    const name = el.getAttribute && el.getAttribute("name");
                    if (id) return `#${CSS.escape(id)}`;
                    if (name) return `[name="${CSS.escape(name)}"]`;
                    return el.tagName ? el.tagName.toLowerCase() : "";
                };

                const input = document.querySelector(
                    "input[name*='captcha' i], input[id*='captcha' i], input[placeholder*='captcha' i], textarea[name*='captcha' i], textarea[id*='captcha' i]"
                );
                const img = document.querySelector(
                    "img[src*='captcha' i], img[id*='captcha' i], img[class*='captcha' i], canvas[id*='captcha' i], canvas[class*='captcha' i]"
                );
                const textEl = document.querySelector(
                    "#captcha-code, [id*='captcha' i], [class*='captcha' i]"
                );

                const textSelector = textEl && textEl.textContent && textEl.textContent.trim() ? buildSelector(textEl) : "";

                return {
                    inputSelector: buildSelector(input),
                    imageSelector: buildSelector(img),
                    textSelector
                };
            }"""
        )

        max_table_rows = config.get("maxTableRows", 25)
        max_table_cols = config.get("maxTableCols", 20)
        tables = await page.evaluate(
            """({ maxRows, maxCols }) => {
                const tables = Array.from(document.querySelectorAll("table"));
                return tables.map((table, idx) => {
                    const id = table.getAttribute("id") || "";
                    const cls = table.getAttribute("class") || "";
                    let selector = "";
                    try {
                        if (id) selector = `#${CSS.escape(id)}`;
                        else if (cls) selector = `table.${cls.split(/\\s+/).map(c => CSS.escape(c)).join(".")}`;
                        else selector = `table:nth-of-type(${idx + 1})`;
                    } catch (e) {
                        selector = `table:nth-of-type(${idx + 1})`;
                    }

                    const headerCells = Array.from(table.querySelectorAll("thead th"));
                    const headers = headerCells.map(th => (th.innerText || "").trim()).slice(0, maxCols);

                    let rows = Array.from(table.querySelectorAll("tbody tr"));
                    if (!rows.length) rows = Array.from(table.querySelectorAll("tr"));

                    const bodyRows = rows.slice(0, maxRows).map(tr => {
                        const cells = Array.from(tr.querySelectorAll("th, td"));
                        return cells.slice(0, maxCols).map(td => (td.innerText || "").trim());
                    });

                    return { index: idx, selector, headers, rows: bodyRows };
                });
            }""",
            {"maxRows": max_table_rows, "maxCols": max_table_cols},
        )

        def classify_detection(detection: Dict[str, Any]) -> None:
            # reCAPTCHA variants
            if detection["recaptchaRender"]:
                captcha_types.add("recaptcha_v3")
            elif detection["hasGRecaptcha"] or detection["hasRecaptchaApi"]:
                if detection["hasRecaptchaInvisible"]:
                    captcha_types.add("recaptcha_v2_invisible")
                else:
                    captcha_types.add("recaptcha_v2")

            # Other provider captchas
            if detection["hasHcaptcha"] or detection["hasHcaptchaApi"]:
                captcha_types.add("hcaptcha")
            if detection["hasTurnstile"] or detection["hasTurnstileApi"]:
                captcha_types.add("turnstile")
            if detection["hasGeetest"]:
                captcha_types.add("geetest")
            if detection["hasFuncaptcha"]:
                captcha_types.add("funcaptcha")
            if detection["hasKeycaptcha"]:
                captcha_types.add("keycaptcha")
            if detection["hasCapy"]:
                captcha_types.add("capy")
            if detection["hasDatadome"]:
                captcha_types.add("datadome")

            # Generic / image / text / math / number
            if detection["imgCaptcha"]:
                captcha_types.add("image")
                captcha_types.add("normal")
            if detection["hasCaptchaInputs"] or detection["imgCaptcha"]:
                hint_text = " ".join(detection["hints"])
                if any(token in hint_text for token in ["math", "sum", "add", "plus", "subtract", "solve", "+", "-", "="]):
                    captcha_types.add("math")
                if any(token in hint_text for token in ["number", "digit", "digits", "numbers"]):
                    captcha_types.add("number")
                if detection["imgCaptcha"] and "math" not in captcha_types and "number" not in captcha_types:
                    captcha_types.add("number")
                if any(token in hint_text for token in ["text", "letter", "letters", "word", "characters"]):
                    captcha_types.add("text")
                if not any(t in captcha_types for t in ["math", "number", "text"]):
                    captcha_types.add("text")

        # Captcha detection (heuristic)
        detection = await page.evaluate(
            """() => {
                const scripts = Array.from(document.querySelectorAll("script[src]")).map(s => s.src || "");
                const hasRecaptchaApi = scripts.some(src => /recaptcha\\/api\\.js/i.test(src));
                const recaptchaRender = scripts.find(src => /recaptcha\\/api\\.js\\?render=/i.test(src));
                const hasGRecaptcha = !!document.querySelector(".g-recaptcha, iframe[src*='google.com/recaptcha']");
                const hasRecaptchaInvisible = !!document.querySelector(".g-recaptcha[data-size='invisible'], [data-callback][data-sitekey]");

                const hasHcaptcha = !!document.querySelector(".h-captcha, iframe[src*='hcaptcha.com']");
                const hasHcaptchaApi = scripts.some(src => /hcaptcha\\/1\\/api\\.js/i.test(src));

                const hasTurnstile = !!document.querySelector(".cf-turnstile, iframe[src*='challenges.cloudflare.com']");
                const hasTurnstileApi = scripts.some(src => /turnstile\\/v0\\/api\\.js/i.test(src));

                const hasGeetest = scripts.some(src => /geetest/i.test(src)) || !!document.querySelector("[data-geetest], .geetest_captcha");
                const hasFuncaptcha = scripts.some(src => /funcaptcha|arkoselabs/i.test(src)) || !!document.querySelector("[data-fc-token]");
                const hasKeycaptcha = scripts.some(src => /keycaptcha/i.test(src));
                const hasCapy = scripts.some(src => /capy/i.test(src));
                const hasDatadome = scripts.some(src => /datadome/i.test(src)) || !!document.querySelector("[data-dd-captcha]");

                const inputs = Array.from(document.querySelectorAll("input, textarea")).filter(el => {
                    const name = (el.getAttribute("name") || "").toLowerCase();
                    const id = (el.getAttribute("id") || "").toLowerCase();
                    const ph = (el.getAttribute("placeholder") || "").toLowerCase();
                    return name.includes("captcha") || id.includes("captcha") || ph.includes("captcha");
                });

                const imgCaptcha = !!document.querySelector("img[src*='captcha' i], img[id*='captcha' i], img[class*='captcha' i], canvas[id*='captcha' i], canvas[class*='captcha' i]");

                const hints = inputs.map(el => {
                    let text = "";
                    if (el.labels && el.labels.length) {
                        text += Array.from(el.labels).map(l => l.innerText || "").join(" ");
                    }
                    const aria = el.getAttribute("aria-label");
                    if (aria) text += " " + aria;
                    const ph = el.getAttribute("placeholder");
                    if (ph) text += " " + ph;
                    const parent = el.closest("label, .captcha, .form-group, .field, .input") || el.parentElement;
                    if (parent) text += " " + (parent.innerText || "");
                    return text.toLowerCase();
                });

                return {
                    hasRecaptchaApi,
                    recaptchaRender: recaptchaRender || "",
                    hasGRecaptcha,
                    hasRecaptchaInvisible,
                    hasHcaptcha,
                    hasHcaptchaApi,
                    hasTurnstile,
                    hasTurnstileApi,
                    hasGeetest,
                    hasFuncaptcha,
                    hasKeycaptcha,
                    hasCapy,
                    hasDatadome,
                    imgCaptcha,
                    hints,
                    hasCaptchaInputs: inputs.length > 0
                };
            }"""
        )
        classify_detection(detection)

        if include_frames:
            for frame in page.frames:
                if frame == page.main_frame:
                    continue
                try:
                    frame_detection = await frame.evaluate(
                        """() => {
                            const scripts = Array.from(document.querySelectorAll("script[src]")).map(s => s.src || "");
                            const hasRecaptchaApi = scripts.some(src => /recaptcha\\/api\\.js/i.test(src));
                            const recaptchaRender = scripts.find(src => /recaptcha\\/api\\.js\\?render=/i.test(src));
                            const hasGRecaptcha = !!document.querySelector(".g-recaptcha, iframe[src*='google.com/recaptcha']");
                            const hasRecaptchaInvisible = !!document.querySelector(".g-recaptcha[data-size='invisible'], [data-callback][data-sitekey]");

                            const hasHcaptcha = !!document.querySelector(".h-captcha, iframe[src*='hcaptcha.com']");
                            const hasHcaptchaApi = scripts.some(src => /hcaptcha\\/1\\/api\\.js/i.test(src));

                            const hasTurnstile = !!document.querySelector(".cf-turnstile, iframe[src*='challenges.cloudflare.com']");
                            const hasTurnstileApi = scripts.some(src => /turnstile\\/v0\\/api\\.js/i.test(src));

                            const hasGeetest = scripts.some(src => /geetest/i.test(src)) || !!document.querySelector("[data-geetest], .geetest_captcha");
                            const hasFuncaptcha = scripts.some(src => /funcaptcha|arkoselabs/i.test(src)) || !!document.querySelector("[data-fc-token]");
                            const hasKeycaptcha = scripts.some(src => /keycaptcha/i.test(src));
                            const hasCapy = scripts.some(src => /capy/i.test(src));
                            const hasDatadome = scripts.some(src => /datadome/i.test(src)) || !!document.querySelector("[data-dd-captcha]");

                            const inputs = Array.from(document.querySelectorAll("input, textarea")).filter(el => {
                                const name = (el.getAttribute("name") || "").toLowerCase();
                                const id = (el.getAttribute("id") || "").toLowerCase();
                                const ph = (el.getAttribute("placeholder") || "").toLowerCase();
                                return name.includes("captcha") || id.includes("captcha") || ph.includes("captcha");
                            });

                            const imgCaptcha = !!document.querySelector("img[src*='captcha' i], img[id*='captcha' i], img[class*='captcha' i], canvas[id*='captcha' i], canvas[class*='captcha' i]");

                            const hints = inputs.map(el => {
                                let text = "";
                                if (el.labels && el.labels.length) {
                                    text += Array.from(el.labels).map(l => l.innerText || "").join(" ");
                                }
                                const aria = el.getAttribute("aria-label");
                                if (aria) text += " " + aria;
                                const ph = el.getAttribute("placeholder");
                                if (ph) text += " " + ph;
                                const parent = el.closest("label, .captcha, .form-group, .field, .input") || el.parentElement;
                                if (parent) text += " " + (parent.innerText || "");
                                return text.toLowerCase();
                            });

                            return {
                                hasRecaptchaApi,
                                recaptchaRender: recaptchaRender || "",
                                hasGRecaptcha,
                                hasRecaptchaInvisible,
                                hasHcaptcha,
                                hasHcaptchaApi,
                                hasTurnstile,
                                hasTurnstileApi,
                                hasGeetest,
                                hasFuncaptcha,
                                hasKeycaptcha,
                                hasCapy,
                                hasDatadome,
                                imgCaptcha,
                                hints,
                                hasCaptchaInputs: inputs.length > 0
                            };
                        }"""
                    )
                    classify_detection(frame_detection)

                    if not captcha_selectors.get("textSelector") or not captcha_selectors.get("imageSelector") or not captcha_selectors.get("inputSelector"):
                        frame_selectors = await frame.evaluate(
                            """() => {
                                const buildSelector = (el) => {
                                    if (!el) return "";
                                    const id = el.getAttribute && el.getAttribute("id");
                                    const name = el.getAttribute && el.getAttribute("name");
                                    if (id) return `#${CSS.escape(id)}`;
                                    if (name) return `[name="${CSS.escape(name)}"]`;
                                    return el.tagName ? el.tagName.toLowerCase() : "";
                                };

                                const input = document.querySelector(
                                    "input[name*='captcha' i], input[id*='captcha' i], input[placeholder*='captcha' i], textarea[name*='captcha' i], textarea[id*='captcha' i]"
                                );
                                const img = document.querySelector(
                                    "img[src*='captcha' i], img[id*='captcha' i], img[class*='captcha' i], canvas[id*='captcha' i], canvas[class*='captcha' i]"
                                );
                                const textEl = document.querySelector(
                                    "#captcha-code, [id*='captcha' i], [class*='captcha' i]"
                                );

                                const textSelector = textEl && textEl.textContent && textEl.textContent.trim() ? buildSelector(textEl) : "";

                                return {
                                    inputSelector: buildSelector(input),
                                    imageSelector: buildSelector(img),
                                    textSelector
                                };
                            }"""
                        )
                        if frame_selectors.get("inputSelector") and not captcha_selectors.get("inputSelector"):
                            captcha_selectors["inputSelector"] = frame_selectors["inputSelector"]
                        if frame_selectors.get("imageSelector") and not captcha_selectors.get("imageSelector"):
                            captcha_selectors["imageSelector"] = frame_selectors["imageSelector"]
                        if frame_selectors.get("textSelector") and not captcha_selectors.get("textSelector"):
                            captcha_selectors["textSelector"] = frame_selectors["textSelector"]
                except Exception:
                    continue
    except Exception as e:
        logger.error(f"Scan error: {str(e)}")
    finally:
        if created_ephemeral_session:
            try:
                await browser.close()
            finally:
                if playwright:
                    await playwright.stop()

    return {
        "forms": forms,
        "captchaTypes": sorted(captcha_types),
        "captchaSelectors": captcha_selectors,
        "tables": tables,
    }
