import requests
import socket

from bs4 import BeautifulSoup, Comment
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ERROR = chr(0x274C)
WARN = chr(0x26A0) + chr(0xFE0F)
INFO = chr(0x2139) + chr(0xFE0F)

def is_visible_text(element):
    """Return True for visible elements (not script/style/comment/etc.)."""
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True

def extract_visible_text_from_webpage(text: str) -> str:
    soup = BeautifulSoup(text, 'html.parser')
    texts = soup.find_all(string=True)
    visible_texts = filter(is_visible_text, texts)
    return '\n'.join(t.strip() for t in visible_texts if t.strip())

# Define headers for the requests module
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/114.0.0.0 Safari/537.36",
#    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Connection": "keep-alive",
#    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
}

def is_hostname_resolvable(url: str) -> bool:
    global ERROR
    try:
        # Extract hostname from the URL
        hostname = urlparse(url).hostname
        if hostname:
            # Resolve the hostname to check if it's reachable
            socket.gethostbyname(hostname)
            return True
        else:
            print(f"{ERROR}: Unable to extract hostname from URL: {url}")
            return False
    except socket.error as e:
        print(f"{ERROR}: Hostname '{hostname}' is not resolvable: {e}")
        return False

def has_valid_homepage(homepage: str) -> str | None:
    global INFO, ERROR, WARN
    # First, check if the hostname is resolvable
    if not is_hostname_resolvable(homepage):
        return False

    # If the hostname is resolvable, proceed with requests
    try:
        response = requests.get(homepage, headers=HEADERS, timeout=15)
        if response.status_code == 200:
            print(f"{INFO}\tPage loaded successfully with requests.")
            return response.text
        elif response.status_code == 404:
            print(f"{ERROR}\tPage ({homepage}) not found (404 error).")
            return None
        else:
            print(f"{WARN}\tReceived error code {response.status_code} with requests. Failing over to Selenium...")
            result = has_valid_homepage_with_selenium(homepage)
            # print(result)
            return result
    except requests.exceptions.RequestException as e:
        print(f"{ERROR}\tAn exception occurred with requests: {e}. Failing over to Selenium...")
        result = has_valid_homepage_with_selenium(homepage)
        # print(result)
        return result

def has_valid_homepage_with_selenium(homepage: str) -> str | None:
    global INFO, ERROR, WARN
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
        print(f"{INFO}\tPage loaded successfully with Selenium.")
        return driver.page_source
    except Exception as e:
        print(f"{ERROR}\tAn exception occurred with Selenium: {e}")
        return None
    finally:
        driver.quit()
    return None

