import csv
import time
import requests
import click
import os
import re
import threading
import xml.etree.ElementTree as ET
import unicodedata
from urllib.parse import urlparse
from typing import Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

###############################################################################
# PID controller
###############################################################################
class PIDController:
    def __init__(self, kp, ki, kd, setpoint):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.setpoint = setpoint
        self.integral = 0.0
        self.prev_error = None
        self.lock = threading.Lock()

    def update(self, measured_value):
        with self.lock:
            error = self.setpoint - measured_value
            self.integral += error
            derivative = 0.0 if self.prev_error is None else error - self.prev_error
            self.prev_error = error
            return self.kp * error + self.ki * self.integral + self.kd * derivative

###############################################################################
# Helpers for normalization
###############################################################################
def normalize_input_name(name: str) -> str:
    return re.sub(r"\s*\[.*?\]\s*", "", name).strip()

def canonicalize(name: str) -> str:
    name = unicodedata.normalize("NFKC", name)
    name = re.sub(r"\s+", " ", name)
    name = name.replace(".", "").lower().strip()
    return name

def extract_pid_path(dblp_pid_url: str) -> Optional[str]:
    try:
        path = urlparse(dblp_pid_url).path
        if path.startswith("/pid/"):
            return path[len("/pid/"):]
    except Exception as e:
        print(f"Failed to parse PID from {dblp_pid_url}: {e}")
    return None

###############################################################################
# Alias matching from XML <author> elements
###############################################################################
def has_alias_match(dblp_pid_url: str, normalized_query: str) -> bool:
    pid_path = extract_pid_path(dblp_pid_url)
    if not pid_path:
        return False

    try:
        xml_url = f"https://dblp.org/pid/{pid_path}.xml"
        response = requests.get(xml_url, timeout=10)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        target_pid = pid_path
        canon_query = canonicalize(normalized_query)

        for author in root.findall(".//author"):
            if author.attrib.get("pid") == target_pid:
                if canonicalize(author.text or "") == canon_query:
                    return True
    except Exception as e:
        print(f"Error fetching alias info from {dblp_pid_url}: {e}")
    return False

###############################################################################
# DBLP lookup (single name)
###############################################################################
def dblp_author_search(name: str) -> Tuple[str, str]:
    normalized = normalize_input_name(name)
    canon_query = canonicalize(normalized)
    base_url = "https://dblp.org/search/author/api"
    params = {"q": normalized, "format": "json"}

    try:
        response = requests.get(base_url, params=params, timeout=10)
        if response.status_code == 429:
            raise requests.exceptions.RequestException("HTTP 429: Too Many Requests")
        response.raise_for_status()
        data = response.json()
        hits = data.get("result", {}).get("hits", {}).get("hit", [])

        found_exact = False
        found_alias = False

        for hit in hits:
            info = hit.get("info", {})
            author_name = info.get("author", "")
            dblp_url = info.get("url", "")
            if canonicalize(author_name) == canon_query:
                found_exact = True
            elif dblp_url and has_alias_match(dblp_url, normalized):
                found_alias = True

        if found_exact:
            return name, "EXACT"
        elif found_alias:
            return name, "ALIAS"
        else:
            return name, "NOT_FOUND"

    except Exception as e:
        return name, "ERROR"

###############################################################################
# Parallel worker loop
###############################################################################
def process_batch(rows, output_csv, progress_file, log_file, lock, seen, already_output, pid_controller, max_workers):
    total_requests = 0
    total_errors = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor, \
         open(output_csv, "a", newline='', encoding='utf-8') as out_csv, \
         open(log_file, "a", encoding='utf-8') as out_log:

        writer = csv.DictWriter(out_csv, fieldnames=rows[0].keys())
        log_lock = threading.Lock()
        csv_lock = threading.Lock()

        futures = {
            executor.submit(dblp_author_search, row["name"]): row for row in rows if row["name"] not in seen
        }

        for future in as_completed(futures):
            row = futures[future]
            name = row["name"]

            try:
                name, result = future.result()
                with log_lock:
                    out_log.write(f"{name} -> {result}\n")
                    out_log.flush()

                if result == "NOT_FOUND" and name not in already_output:
                    with csv_lock:
                        writer.writerow(row)
                        out_csv.flush()
                        already_output.add(name)

                if result == "ERROR":
                    total_errors += 1

            except Exception as e:
                with log_lock:
                    out_log.write(f"{name} -> EXCEPTION: {e}\n")
                    out_log.flush()
                total_errors += 1

            with open(progress_file, "a", encoding='utf-8') as f:
                f.write(f"{name}\n")

            seen.add(name)
            total_requests += 1

            if total_requests > 0:
                error_rate = total_errors / total_requests
                sleep_adjustment = pid_controller.update(error_rate)
                sleep_time = max(0.1, 1.0 + sleep_adjustment)
                time.sleep(sleep_time)

###############################################################################
# CLI wrapper
###############################################################################
@click.command()
@click.argument("input_csv", type=click.Path(exists=True))
@click.argument("output_csv", type=click.Path())
@click.option("--log_file", default="match.log", help="Log file for match diagnostics")
@click.option("--max-workers", default=32, type=int, show_default=True,
              help="Max number of parallel threads to use")
def find_missing_names(input_csv, output_csv, log_file, max_workers):
    progress_file = input_csv + ".progress"
    seen = set()
    already_output = set()
    lock = threading.Lock()

    try:
        with open(progress_file, encoding="utf-8") as f:
            seen.update(line.strip() for line in f if line.strip())
    except FileNotFoundError:
        pass

    try:
        with open(output_csv, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                already_output.add(row["name"])
    except FileNotFoundError:
        pass

    with open(input_csv, newline='', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))

    if not reader:
        print("No data.")
        return

    if not os.path.exists(output_csv):
        with open(output_csv, "w", newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=reader[0].keys())
            writer.writeheader()

    pid = PIDController(kp=5.0, ki=0.5, kd=0.2, setpoint=0.01)
    process_batch(reader, output_csv, progress_file, log_file, lock, seen, already_output, pid, max_workers)


if __name__ == "__main__":
    find_missing_names()
