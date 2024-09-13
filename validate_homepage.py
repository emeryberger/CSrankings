import requests
import socket
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Define headers for the requests module
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Connection": "keep-alive",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
}

def is_hostname_resolvable(url: str) -> bool:
    try:
        # Extract hostname from the URL
        hostname = urlparse(url).hostname
        if hostname:
            # Resolve the hostname to check if it's reachable
            socket.gethostbyname(hostname)
            return True
        else:
            print(f"ERROR: Unable to extract hostname from URL: {url}")
            return False
    except socket.error as e:
        print(f"ERROR: Hostname '{hostname}' is not resolvable: {e}")
        return False

def has_valid_homepage(homepage: str) -> bool:
    # First, check if the hostname is resolvable
    if not is_hostname_resolvable(homepage):
        return False

    # If the hostname is resolvable, proceed with requests
    try:
        response = requests.get(homepage, headers=HEADERS, timeout=15)
        if response.status_code == 200:
            print("SUCCESS: Page loaded successfully with requests.")
            return True
        else:
            print(f"WARNING: Received error code {response.status_code} with requests. Failing over to Selenium...")
            return has_valid_homepage_with_selenium(homepage)
    except requests.exceptions.RequestException as e:
        print(f"ERROR: An exception occurred with requests: {e}. Failing over to Selenium...")
        return has_valid_homepage_with_selenium(homepage)

def has_valid_homepage_with_selenium(homepage: str) -> bool:
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode (no GUI)
    chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
    chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
    chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")  # Avoid detection as automation

    # Use webdriver-manager to handle ChromeDriver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

    try:
        driver.get(homepage)
        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        print("SUCCESS: Page loaded successfully with Selenium.")
        return True
    except Exception as e:
        print(f"ERROR: An exception occurred with Selenium: {e}")
        return False
    finally:
        driver.quit()

