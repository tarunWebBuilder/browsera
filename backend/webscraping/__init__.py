from .open_browser import execute as open_browser
from .close_browser import execute as close_browser
from .load_website import execute as load_website
from .refresh_page_source import execute as refresh_page_source
from .get_current_url import execute as get_current_url
from .scan_web_page import execute as scan_web_page
from .click import execute as click
from .click_id_element import execute as click_id_element
from .click_name_element import execute as click_name_element
from .click_xpath_element import execute as click_xpath_element
from .extract_xpath_element import execute as extract_xpath_element
from .extract_multiple_xpaths import execute as extract_multiple_xpaths
from .use_key import execute as use_key
from .wait import execute as wait
from .write import execute as write
from .solve_and_pagination import execute as solve_and_paginate
from .solve_captcha import execute as solve_captcha
from .solve_os_captcha import execute as solve_os_captcha

WEBSCRAPING_ACTIONS = {
    "openBrowser": open_browser,
    "closeBrowser": close_browser,
    "loadWebsite": load_website,
    "refreshPageSource": refresh_page_source,
    "getCurrentURL": get_current_url,
    "scanWebPage": scan_web_page,
    "click": click,
    "clickById": click_id_element,
    "clickByName": click_name_element,
    "clickByXPath": click_xpath_element,
    "extractXPath": extract_xpath_element,
    "extractMultipleXPaths": extract_multiple_xpaths,
    "useKey": use_key,
    "wait": wait,
    "write": write,
    "solveAndPaginateHtml": solve_and_paginate,
    "solveCaptcha": solve_captcha,
    "solveOpenSourceCaptcha": solve_os_captcha,
}
#metadata in mongo()compass - vector milvus
