import csv
import time
import re
import requests
import click
import os
from typing import Optional
from requests.exceptions import RequestException


class PIDController:
    def __init__(self, kp: float, ki: float, kd: float, setpoint: float):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.setpoint = setpoint

        self.integral = 0.0
        self.prev_error: Optional[float] = None

    def update(self, measured_value: float) -> float:
        error = self.setpoint - measured_value
        self.integral += error
        derivative = 0.0 if self.prev_error is None else error - self.prev_error
        self.prev_error = error

        return self.kp * error + self.ki * self.integral + self.kd * derivative


def dblp_author_search(name: str) -> Optional[bool]:
    """Returns True if found, False if not, None on error."""
    base_url = "https://dblp.org/search/author/api"
    params = {"q": name, "format": "json"}
    try:
        response = requests.get(base_url, params=params, timeout=10)
        if response.status_code == 429:
            raise RequestException("HTTP 429: Too Many Requests")
        response.raise_for_status()
        data = response.json()
        hits = data.get("result", {}).get("hits", {}).get("hit", [])
        return len(hits) > 0
    except RequestException as e:
        print(f"Error for {name}: {e}")
        return None


def load_progress(progress_file: str) -> set[str]:
    if not os.path.exists(progress_file):
        return set()
    with open(progress_file, "r", encoding="utf-8") as f:
        return set(line.strip() for line in f if line.strip())


def append_to_progress(progress_file: str, name: str):
    with open(progress_file, "a", encoding="utf-8") as f:
        f.write(f"{name}\n")


@click.command()
@click.argument("input_csv", type=click.Path(exists=True))
@click.argument("output_csv", type=click.Path())
def find_missing_names(input_csv: str, output_csv: str):
    """Checks names in INPUT_CSV against DBLP and appends unfound ones to OUTPUT_CSV."""
    progress_file = input_csv + ".progress"
    seen = load_progress(progress_file)

    pid = PIDController(kp=5.0, ki=0.5, kd=0.2, setpoint=0.01)

    # Also avoid duplicates in output
    already_output = set()
    try:
        with open(output_csv, newline='', encoding='utf-8') as existing:
            reader = csv.DictReader(existing)
            for row in reader:
                already_output.add(row["name"])
    except FileNotFoundError:
        pass

    total_requests = 0
    total_errors = 0
    sleep_time = 1.0

    with open(input_csv, newline='', encoding='utf-8') as infile, \
         open(output_csv, "a", newline='', encoding='utf-8') as outfile:
        reader = csv.DictReader(infile)
        writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)

        if outfile.tell() == 0:
            writer.writeheader()

        for row in reader:
            name = row["name"]
            if name in seen:
                continue

            # Remove anything in square brackets
            clean_name = re.sub(r"\s*\[.*?\]\s*", "", name).strip()

            result = dblp_author_search(clean_name)
            total_requests += 1

            if result is None:
                total_errors += 1
                error_rate = total_errors / total_requests
                adjustment = pid.update(error_rate)
                sleep_time = max(0.1, sleep_time + adjustment)
                print(f"Error! Adjusting sleep time to {sleep_time:.2f}s (error rate: {error_rate:.2%})")
            else:
                if result is False and name not in already_output:
                    writer.writerow(row)
                    outfile.flush()
                    already_output.add(name)

            seen.add(name)
            append_to_progress(progress_file, name)

            print(f"Checked {name:30s} - {'FOUND' if result else 'NOT FOUND' if result is False else 'ERROR'} | Sleep={sleep_time:.2f}s")
            time.sleep(sleep_time)

    print(f"\nDone. Total requests: {total_requests}, errors: {total_errors}, final sleep time: {sleep_time:.2f}s")


if __name__ == "__main__":
    find_missing_names()
