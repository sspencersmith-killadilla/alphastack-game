#!/usr/bin/env python3
"""Run a publish-parity build validation with preserved diagnostics.

This script is intentionally conservative: it runs the same production build
command used by publishing, saves the full stdout/stderr stream, and only then
boots a local production preview for route smoke checks.
"""
from __future__ import annotations

import os
import platform
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
DIAG_DIR = ROOT / ".lovable" / "diagnostics"
LOG_PATH = DIAG_DIR / "publish-validation.log"
ROUTES = ("/", "/play", "/leaderboard")
PREVIEW_PORT = int(os.environ.get("VALIDATE_PREVIEW_PORT", "4173"))
BASE_URL = f"http://127.0.0.1:{PREVIEW_PORT}"


def append_log(text: str) -> None:
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(text)
        if not text.endswith("\n"):
            handle.write("\n")


def run_logged(command: list[str], *, env: dict[str, str] | None = None) -> int:
    append_log(f"\n$ {' '.join(command)}\n")
    process = subprocess.Popen(
        command,
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert process.stdout is not None
    for line in process.stdout:
        print(line, end="")
        append_log(line.rstrip("\n"))
    return process.wait()


def write_header() -> None:
    DIAG_DIR.mkdir(parents=True, exist_ok=True)
    LOG_PATH.write_text("", encoding="utf-8")
    append_log("AlphaStack publish validation")
    append_log(f"Started: {datetime.now(timezone.utc).isoformat()}")
    append_log(f"Python: {sys.version.split()[0]}")
    append_log(f"Platform: {platform.platform()}")
    for command in (["bun", "--version"], ["node", "--version"]):
        try:
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)
            append_log(f"{command[0]}: {(result.stdout or result.stderr).strip()}")
        except FileNotFoundError:
            append_log(f"{command[0]}: not found")


def wait_for_preview(process: subprocess.Popen[str], timeout_seconds: int = 30) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if process.poll() is not None:
            append_log(f"Preview exited early with code {process.returncode}")
            return False
        try:
            with urlopen(BASE_URL, timeout=2) as response:
                return 200 <= response.status < 500
        except URLError:
            time.sleep(0.5)
    append_log("Preview did not become ready before timeout")
    return False


def smoke_routes() -> int:
    append_log("\nStarting local production preview")
    preview = subprocess.Popen(
        ["bun", "run", "preview", "--", "--host", "127.0.0.1", "--port", str(PREVIEW_PORT)],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        start_new_session=True,
    )
    try:
        if not wait_for_preview(preview):
            return 1

        failures: list[str] = []
        for route in ROUTES:
            url = f"{BASE_URL}{route}"
            try:
                with urlopen(url, timeout=10) as response:
                    body = response.read(4096).decode("utf-8", "replace")
                    ok = 200 <= response.status < 400 and "Rolldown" not in body and "Vite" not in body
                    status = "PASS" if ok else "FAIL"
                    print(f"[{status}] {route} returned HTTP {response.status}")
                    append_log(f"[{status}] {url} returned HTTP {response.status}")
                    if not ok:
                        failures.append(f"{route} returned HTTP {response.status}")
            except Exception as error:  # noqa: BLE001 - diagnostic script should record all failures
                print(f"[FAIL] {route}: {error}")
                append_log(f"[FAIL] {url}: {error}")
                failures.append(f"{route}: {error}")
        return 1 if failures else 0
    finally:
        if preview.poll() is None:
            os.killpg(preview.pid, signal.SIGTERM)
            try:
                preview.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(preview.pid, signal.SIGKILL)


def main() -> int:
    write_header()
    env = os.environ.copy()
    env.setdefault("NODE_ENV", "production")
    env.setdefault("CI", "1")

    build_code = run_logged(["bun", "run", "build"], env=env)
    if build_code != 0:
        append_log(f"\nBuild failed with exit code {build_code}")
        print(f"\nBuild failed. Full diagnostics saved to {LOG_PATH}", file=sys.stderr)
        return build_code

    smoke_code = smoke_routes()
    if smoke_code != 0:
        print(f"\nSmoke test failed. Full diagnostics saved to {LOG_PATH}", file=sys.stderr)
        return smoke_code

    append_log("\nPublish validation passed")
    print(f"\nPublish validation passed. Diagnostics saved to {LOG_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())