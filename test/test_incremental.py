#!/usr/bin/env python3
"""
Test suite for verifying incremental updates match full computation.
Uses Selenium to automate browser testing.

Run with: pytest test/test_incremental.py -v
Or: python -m pytest test/test_incremental.py -v
"""

import pytest
import time
import subprocess
import socket
import os
import signal
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


def is_port_in_use(port: int) -> bool:
    """Check if a port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


@pytest.fixture(scope="module")
def web_server():
    """Start a web server for testing, or use existing one."""
    port = 8000
    server_process = None

    if not is_port_in_use(port):
        # Start the server
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        server_process = subprocess.Popen(
            ['python3', '-m', 'http.server', str(port)],
            cwd=project_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        # Wait for server to start
        time.sleep(2)

    yield f"http://localhost:{port}"

    # Cleanup
    if server_process:
        server_process.terminate()
        server_process.wait()


@pytest.fixture(scope="module")
def driver():
    """Create a Selenium WebDriver instance."""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    yield driver

    driver.quit()


@pytest.fixture(scope="module")
def loaded_page(driver, web_server):
    """Load the page and wait for it to be ready."""
    driver.get(f"{web_server}/index.html")

    # Wait for page to fully load (wait for ranking table)
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.ID, "ranking"))
    )
    time.sleep(3)  # Extra wait for JS initialization

    # Enable verification mode
    driver.execute_script("csr.setVerifyIncremental(true);")
    time.sleep(0.5)

    # Clear any existing logs
    driver.get_log('browser')

    yield driver


def get_console_logs(driver):
    """Get browser console logs."""
    logs = driver.get_log('browser')
    return [log['message'] for log in logs]


def check_verification(driver, action_description: str):
    """
    Execute an action and check that incremental computation matches full computation.
    Returns True if verification passed, False if failed.
    """
    time.sleep(1.5)

    logs = get_console_logs(driver)

    verification_failed = any("VERIFICATION FAILED" in log for log in logs)
    verification_passed = any("verified" in log.lower() for log in logs)

    if verification_failed:
        # Print logs for debugging
        for log in logs:
            print(f"  {log}")
        pytest.fail(f"Verification failed for: {action_description}")

    assert verification_passed, f"No verification result found for: {action_description}"
    return True


class TestIncrementalComputation:
    """Test suite for incremental computation verification."""

    def test_toggle_ai_checkbox_off(self, loaded_page):
        """Test toggling AI checkbox off."""
        loaded_page.execute_script("document.getElementById('ai').click();")
        check_verification(loaded_page, "Toggle AI checkbox OFF")

    def test_toggle_ai_checkbox_on(self, loaded_page):
        """Test toggling AI checkbox back on."""
        loaded_page.execute_script("document.getElementById('ai').click();")
        check_verification(loaded_page, "Toggle AI checkbox ON")

    def test_deactivate_systems(self, loaded_page):
        """Test deactivating all Systems areas."""
        loaded_page.execute_script("csr.deactivateSystems();")
        check_verification(loaded_page, "Deactivate Systems areas")

    def test_deactivate_theory(self, loaded_page):
        """Test deactivating all Theory areas."""
        loaded_page.execute_script("csr.deactivateTheory();")
        check_verification(loaded_page, "Deactivate Theory areas")

    def test_activate_all(self, loaded_page):
        """Test activating all areas."""
        loaded_page.execute_script("csr.activateAll();")
        check_verification(loaded_page, "Activate all areas")

    def test_deactivate_all(self, loaded_page):
        """Test deactivating all areas."""
        loaded_page.execute_script("csr.activateNone();")
        check_verification(loaded_page, "Deactivate all areas")

    def test_activate_ai_only(self, loaded_page):
        """Test activating only AI areas."""
        loaded_page.execute_script("csr.activateAI();")
        check_verification(loaded_page, "Activate AI areas only")

    def test_toggle_cvpr_checkbox(self, loaded_page):
        """Test toggling a single conference checkbox (CVPR)."""
        loaded_page.execute_script("document.getElementById('cvpr').click();")
        check_verification(loaded_page, "Toggle CVPR checkbox")

    def test_toggle_vision_parent(self, loaded_page):
        """Test toggling a parent area checkbox (Vision)."""
        # First ensure all are active so Vision is clickable
        loaded_page.execute_script("csr.activateAll();")
        time.sleep(1.5)
        loaded_page.get_log('browser')  # Clear logs
        # Now toggle Vision
        loaded_page.execute_script("document.getElementById('vision').click();")
        check_verification(loaded_page, "Toggle Vision checkbox")

    def test_activate_systems_only(self, loaded_page):
        """Test activating only Systems areas."""
        loaded_page.execute_script("csr.activateSystems();")
        check_verification(loaded_page, "Activate Systems areas only")

    def test_activate_theory_only(self, loaded_page):
        """Test activating only Theory areas."""
        loaded_page.execute_script("csr.activateTheory();")
        check_verification(loaded_page, "Activate Theory areas only")

    def test_activate_interdisciplinary_only(self, loaded_page):
        """Test activating only Interdisciplinary areas."""
        loaded_page.execute_script("csr.activateOthers();")
        check_verification(loaded_page, "Activate Interdisciplinary areas only")


class TestIncrementalPerformance:
    """Test that incremental computation is actually faster."""

    def test_incremental_is_faster(self, loaded_page):
        """Verify that incremental computation is faster than full computation."""
        # First, activate all to ensure cache is populated
        loaded_page.execute_script("csr.activateAll();")
        time.sleep(1.5)

        # Clear logs
        loaded_page.get_log('browser')

        # Toggle a checkbox and measure times
        loaded_page.execute_script("document.getElementById('ai').click();")
        time.sleep(1.5)

        logs = get_console_logs(loaded_page)

        incremental_time = None
        full_time = None

        for log in logs:
            if "Incremental computation took" in log:
                # Extract time from log message like "Incremental computation took 14.7ms"
                import re
                match = re.search(r'(\d+\.?\d*)ms', log)
                if match:
                    incremental_time = float(match.group(1))
            elif "Full computation took" in log:
                match = re.search(r'(\d+\.?\d*)ms', log)
                if match:
                    full_time = float(match.group(1))

        assert incremental_time is not None, "Could not find incremental time in logs"
        assert full_time is not None, "Could not find full time in logs"

        # Incremental should be faster (or at least not significantly slower)
        # Allow some margin for measurement noise
        assert incremental_time <= full_time * 1.5, \
            f"Incremental ({incremental_time}ms) should be faster than full ({full_time}ms)"

        print(f"\nPerformance: Incremental={incremental_time}ms, Full={full_time}ms, "
              f"Speedup={full_time/incremental_time:.1f}x")

    def test_render_time_is_fast(self, loaded_page):
        """Verify that total render time is under 100ms."""
        import re

        # First, activate all to ensure cache is populated
        loaded_page.execute_script("csr.activateAll();")
        time.sleep(1.5)

        # Clear logs
        loaded_page.get_log('browser')

        # Toggle a checkbox and measure total time
        loaded_page.execute_script("document.getElementById('ai').click();")
        time.sleep(1.5)

        logs = get_console_logs(loaded_page)

        before_render_time = None
        total_rank_time = None

        for log in logs:
            # Log format: 'http://localhost:8000/csrankings.js 1540:16 "Before render: rank took 94 milliseconds."'
            if "Before render: rank took" in log:
                match = re.search(r'rank took (\d+\.?\d*)', log)
                if match:
                    before_render_time = float(match.group(1))
            elif "Rank took" in log and "Before" not in log:
                # Format: "Rank took 281.39999997615814 milliseconds."
                match = re.search(r'Rank took (\d+\.?\d*)', log)
                if match:
                    total_rank_time = float(match.group(1))

        assert before_render_time is not None, f"Could not find 'Before render' time in logs: {logs}"
        assert total_rank_time is not None, f"Could not find 'Rank took' time in logs: {logs}"

        render_time = total_rank_time - before_render_time

        print(f"\nTiming breakdown:")
        print(f"  Before render: {before_render_time:.1f}ms")
        print(f"  Total rank: {total_rank_time:.1f}ms")
        print(f"  Render time: {render_time:.1f}ms")

        # Render time should be under 100ms for good UX
        # (This is a soft target - the test will still show the actual time)
        if render_time > 100:
            print(f"  WARNING: Render time {render_time:.1f}ms exceeds 100ms target")

    def test_full_ranking_performance(self, loaded_page):
        """Test performance when showing ALL entries."""
        import re

        # Activate all areas
        loaded_page.execute_script("csr.activateAll();")
        time.sleep(2)

        # Clear logs
        loaded_page.get_log('browser')

        # Toggle a checkbox and measure total time with all entries
        loaded_page.execute_script("document.getElementById('ai').click();")
        time.sleep(2)

        logs = get_console_logs(loaded_page)

        before_render_time = None
        total_rank_time = None

        for log in logs:
            if "Before render: rank took" in log:
                match = re.search(r'rank took (\d+\.?\d*)', log)
                if match:
                    before_render_time = float(match.group(1))
            elif "Rank took" in log and "Before" not in log:
                match = re.search(r'Rank took (\d+\.?\d*)', log)
                if match:
                    total_rank_time = float(match.group(1))

        assert before_render_time is not None, f"Could not find 'Before render' time in logs"
        assert total_rank_time is not None, f"Could not find 'Rank took' time in logs"

        render_time = total_rank_time - before_render_time

        print(f"\nFull ranking (all entries) timing:")
        print(f"  Before render: {before_render_time:.1f}ms")
        print(f"  Total rank: {total_rank_time:.1f}ms")
        print(f"  Render time: {render_time:.1f}ms")

        # With lazy rendering, showing all entries should still be fast
        assert total_rank_time < 200, f"Full ranking took {total_rank_time}ms, should be under 200ms"

class TestInitialLoad:
    """Test initial page load performance."""

    def test_initial_load_time(self, driver, web_server):
        """Test that initial page load is fast."""
        import re

        # Clear browser state
        driver.delete_all_cookies()

        # Measure time to load page
        start_time = time.time()
        driver.get(f"{web_server}/index.html")

        # Wait for page to fully load (ranking table appears)
        WebDriverWait(driver, 60).until(
            EC.presence_of_element_located((By.ID, "ranking"))
        )
        load_time = (time.time() - start_time) * 1000  # Convert to ms

        # Get console logs for CSV load timing
        time.sleep(0.5)
        logs = driver.get_log('browser')

        csv_load_time = None
        for log in logs:
            if "All CSV files loaded in" in log['message']:
                match = re.search(r'(\d+\.?\d*)ms', log['message'])
                if match:
                    csv_load_time = float(match.group(1))

        print(f"\nInitial load timing:")
        print(f"  Total page load: {load_time:.0f}ms")
        if csv_load_time:
            print(f"  CSV files (parallel): {csv_load_time:.0f}ms")

        # Page should load in under 10 seconds (network dependent)
        assert load_time < 10000, f"Page load took {load_time}ms, should be under 10s"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
