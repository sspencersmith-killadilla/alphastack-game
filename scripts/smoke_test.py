#!/usr/bin/env python3
"""
AlphaStack production smoke test.

Boots a headless Chromium against a running build of the app, loads /play,
and asserts the game UI renders and accepts keyboard input.

Usage:
    # against the local dev server (default http://localhost:8080)
    python3 scripts/smoke_test.py

    # against a deployed/preview URL
    BASE_URL=https://your-app.lovable.app python3 scripts/smoke_test.py

Exit codes:
    0 = all checks passed
    1 = at least one check failed (details printed to stderr)

Requires the `playwright` Python package and a Chromium install.
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")
ARTIFACTS = Path(os.environ.get("SMOKE_ARTIFACTS", "/tmp/alphastack-smoke"))
ARTIFACTS.mkdir(parents=True, exist_ok=True)


class Check:
    def __init__(self) -> None:
        self.failures: list[str] = []

    def expect(self, ok: bool, message: str) -> None:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {message}")
        if not ok:
            self.failures.append(message)


async def run() -> int:
    check = Check()
    url = f"{BASE_URL}/play"
    print(f"Smoke test → {url}")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        page_errors: list[str] = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        response = await page.goto(url, wait_until="networkidle", timeout=20_000)
        check.expect(response is not None and response.ok, f"GET {url} returned 2xx")

        # Allow the client-side game to mount and auto-start.
        await page.wait_for_timeout(800)
        await page.screenshot(path=str(ARTIFACTS / "01_loaded.png"))

        # Core UI landmarks
        title = await page.locator("text=AlphaStack").first.is_visible()
        check.expect(title, "AlphaStack title is visible")

        for label in ("Score", "Best", "Lines", "Level", "Lives", "Next"):
            visible = await page.locator(f"text={label}").first.is_visible()
            check.expect(visible, f"Sidebar shows {label}")

        guesses_label = await page.locator("text=/\\d\\/6 guesses/").first.is_visible()
        check.expect(guesses_label, "Guess counter is rendered")

        kb_visible = await page.get_by_role("button", name="Q").is_visible()
        check.expect(kb_visible, "On-screen keyboard is rendered")

        # Detect word length from the panel header (e.g. "5-letter word")
        header = await page.locator("text=/\\d-letter word/").first.inner_text()
        word_len = int(header.split("-")[0])
        check.expect(4 <= word_len <= 6, f"Word length is between 4 and 6 (got {word_len})")

        # Type a length-matched filler string via physical keyboard, then
        # press Enter. We don't expect it to be a real word; we just verify
        # the page accepts input without crashing.
        sample = ("about", "about", "abouts")[word_len - 4]
        await page.keyboard.type(sample)
        await page.wait_for_timeout(150)
        await page.screenshot(path=str(ARTIFACTS / "02_typed.png"))

        # Letters should appear in the current guess row.
        first_letter_visible = await page.locator(
            f"div:has-text('{sample[0].upper()}')"
        ).first.is_visible()
        check.expect(first_letter_visible, "Typed letter appears in the guess row")

        await page.keyboard.press("Enter")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(ARTIFACTS / "03_submitted.png"))

        # On-screen keyboard click should also work without throwing.
        await page.get_by_role("button", name="Q").click()
        await page.wait_for_timeout(150)
        await page.screenshot(path=str(ARTIFACTS / "04_kb_click.png"))

        check.expect(not page_errors, f"No uncaught page errors (saw {len(page_errors)})")
        for err in page_errors:
            print(f"    pageerror: {err}", file=sys.stderr)

        await browser.close()

    print(f"\nArtifacts: {ARTIFACTS}")
    if check.failures:
        print(f"\nFAILED ({len(check.failures)}):", file=sys.stderr)
        for f in check.failures:
            print(f"  - {f}", file=sys.stderr)
        return 1
    print("\nAll smoke checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))