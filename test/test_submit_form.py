#!/usr/bin/env python3
"""Regression tests for the CSRankings faculty submission form."""

from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


REPO_ROOT = Path(__file__).resolve().parents[1]
FACULTY_NAME = "Test Faculty"
OLD_INSTITUTION = "Old University"
NEW_INSTITUTION = "New University"
SCHOLAR_ID = "NOSCHOLARPAGE"
ORCID = "0000-0002-1825-0097"
FACULTY_CSV_HEADER = "name,affiliation,homepage,scholarid,orcid\n"


class SubmitFormHandler(SimpleHTTPRequestHandler):
    """Serve the real form with a small, deterministic faculty dataset."""

    def _send_text(self, body: str, content_type: str = "text/csv") -> None:
        encoded = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        path = urlsplit(self.path).path
        port = self.server.server_address[1]

        if path == "/institutions.csv":
            self._send_text(
                "institution,region,countryabbrv,homepage\n"
                f"{OLD_INSTITUTION},northamerica,us,\n"
                f"{NEW_INSTITUTION},northamerica,us,\n"
            )
            return

        if path == "/csrankings-t.csv":
            homepage = f"http://127.0.0.1:{port}/test-homepage.html"
            faculty_row = (
                f"{FACULTY_NAME},{OLD_INSTITUTION},{homepage},{SCHOLAR_ID},{ORCID}\n"
            )
            self._send_text(FACULTY_CSV_HEADER + faculty_row)
            return

        if path.startswith("/csrankings-") and path.endswith(".csv"):
            self._send_text("")
            return

        if path.startswith("/old/") and path.endswith(".csv"):
            self._send_text("")
            return

        if path == "/dblp-aliases.csv":
            self._send_text("alias,name\n")
            return

        if path == "/test-homepage.html":
            self._send_text(
                f"<html><body>{FACULTY_NAME}, professor of computer science at "
                f"{OLD_INSTITUTION}. Research faculty profile for {NEW_INSTITUTION}."
                "</body></html>",
                "text/html",
            )
            return

        super().do_GET()

    def log_message(self, format: str, *args: object) -> None:
        """Keep successful test output free of HTTP request noise."""


@pytest.fixture(scope="module")
def submit_server():
    """Run the submit form and its synthetic data on an ephemeral local port."""
    handler = partial(SubmitFormHandler, directory=str(REPO_ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


@pytest.fixture(scope="module")
def driver(submit_server):
    """Create a headless Chrome session following test_incremental.py."""
    options = webdriver.ChromeOptions()
    options.page_load_strategy = "eager"
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)
    browser.set_page_load_timeout(15)
    browser.execute_cdp_cmd("Network.enable", {})
    browser.execute_cdp_cmd(
        "Network.setBlockedURLs",
        {"urls": ["*://*.google-analytics.com/*"]},
    )

    try:
        yield browser
    finally:
        browser.quit()


@pytest.fixture
def loaded_submit_form(submit_server, driver):
    """Load the form and enter update mode after async data initialization."""
    driver.get(f"{submit_server}/submit/index.html")
    wait = WebDriverWait(driver, 10)

    def enter_update_mode(browser) -> bool:
        update_button = browser.find_element(By.CSS_SELECTOR, '[data-action="update"]')
        update_button.click()
        classes = update_button.get_attribute("class").split()
        return "active" in classes and "btn-primary" in classes

    wait.until(enter_update_mode, "submit form did not finish initialization")
    return driver


def choose_institution(driver, wait: WebDriverWait, institution: str) -> None:
    """Choose an institution through the same autocomplete path a user follows."""
    institution_input = driver.find_element(By.ID, "institution")
    institution_input.clear()
    institution_input.send_keys(institution)

    suggestion = wait.until(EC.element_to_be_clickable((
        By.CSS_SELECTOR,
        f'#institution-suggestions .suggestion-item[data-value="{institution}"]',
    )))
    suggestion.click()
    wait.until(lambda browser: browser.find_element(By.ID, "institution").get_attribute("value") == institution)


def test_institution_only_change_enables_update(loaded_submit_form):
    """Changing only institution enables an otherwise unchanged update."""
    driver = loaded_submit_form
    wait = WebDriverWait(driver, 10)

    name_input = driver.find_element(By.ID, "name")
    name_input.send_keys(FACULTY_NAME)
    name_suggestion = wait.until(EC.element_to_be_clickable((
        By.CSS_SELECTOR,
        f'#name-suggestions .suggestion-item[data-name="{FACULTY_NAME}"]',
    )))
    name_suggestion.click()

    submit_button = driver.find_element(By.ID, "submit-btn")
    submit_text = driver.find_element(By.ID, "submit-text")
    wait.until(lambda browser: browser.find_element(By.ID, "current-institution").text == OLD_INSTITUTION)
    wait.until(lambda _: not submit_button.is_enabled() and submit_text.text == "No Changes")

    unchanged_values = {
        field: driver.find_element(By.ID, field).get_attribute("value")
        for field in ("name", "new-name", "homepage", "scholarid", "orcid")
    }

    choose_institution(driver, wait, NEW_INSTITUTION)

    wait.until(
        lambda _: submit_button.is_enabled() and submit_text.text == "Submit Update",
        "institution-only change did not enable Submit Update",
    )
    assert driver.find_element(By.ID, "current-institution").text == OLD_INSTITUTION
    assert {
        field: driver.find_element(By.ID, field).get_attribute("value")
        for field in unchanged_values
    } == unchanged_values

    choose_institution(driver, wait, OLD_INSTITUTION)
    wait.until(lambda _: not submit_button.is_enabled() and submit_text.text == "No Changes")
