"""Snapchat Sounds / Spotlight trending music scraper."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class SnapScraper(BaseScraper):
    """Scrapes Snapchat trending sounds and creation metrics.

    Snapchat Sounds data is sourced from:
    1. Snapchat's public sounds page
    2. Soundcharts/Chartmetric Snap integration data
    3. Community-reported Snap sound rankings
    """

    platform = Platform.SNAP
    # Snapchat Sounds trending page
    SOUNDS_URL = "https://www.snapchat.com/discover/sounds"
    # Snapchat Spotlight trending
    SPOTLIGHT_URL = "https://story.snapchat.com/discover"
    # Chartmetric Snap data (public subset)
    CHARTMETRIC_SNAP = "https://api.chartmetric.com/api/chart/snapshot/latest"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 20) -> ChartData:
        """Fetch Snapchat trending sounds."""
        entries = self._try_snap_sounds(limit)

        return ChartData(
            platform=Platform.SNAP,
            chart_name="Snapchat Top Sounds France",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.SOUNDS_URL,
        )

    def _try_snap_sounds(self, limit: int) -> list[TrackEntry]:
        """Scrape Snapchat Sounds page for trending tracks."""
        try:
            html = self.http.get_text(self.SOUNDS_URL)
            soup = BeautifulSoup(html, "lxml")

            entries = []

            # Parse from embedded JSON data (Snap uses React SSR)
            scripts = soup.find_all("script")
            for script in scripts:
                text = script.string or ""
                if "sounds" in text.lower() or "track" in text.lower():
                    try:
                        # Try to find JSON object in script
                        start = text.find("{")
                        end = text.rfind("}") + 1
                        if start >= 0 and end > start:
                            data = json.loads(text[start:end])
                            entries = self._extract_from_json(data, limit)
                            if entries:
                                return entries
                    except (json.JSONDecodeError, ValueError):
                        continue

            # Fallback: parse HTML elements
            items = soup.select(
                "[class*='sound'], [class*='Sound'], [class*='track'], "
                "[class*='Track'], [class*='music']"
            )
            for rank, item in enumerate(items[:limit], 1):
                title_el = item.select_one("[class*='title'], [class*='name'], h3, h4, span")
                artist_el = item.select_one("[class*='artist'], [class*='subtitle'], p")

                # Try to find creation count
                count_el = item.select_one("[class*='count'], [class*='creation'], [class*='use']")
                creations = None
                if count_el:
                    count_text = count_el.get_text(strip=True).replace(",", "").replace(" ", "")
                    import re
                    numbers = re.findall(r"\d+", count_text)
                    if numbers:
                        creations = int(numbers[0])

                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=title_el.get_text(strip=True) if title_el else "Unknown",
                        artist=artist_el.get_text(strip=True) if artist_el else "Unknown",
                        snap_creations=creations,
                        platform=Platform.SNAP,
                        chart_name="Snapchat Trending Sounds",
                    )
                )

            return entries
        except Exception as e:
            self.logger.warning("Snapchat sounds scrape failed: %s", e)
            return []

    def _extract_from_json(self, data: dict, limit: int) -> list[TrackEntry]:
        """Extract sound data from embedded JSON."""
        entries = []
        try:
            # Navigate common React/Next.js data structures
            sounds = []
            if isinstance(data, dict):
                for key, value in data.items():
                    if isinstance(value, list) and len(value) > 0:
                        if isinstance(value[0], dict) and any(
                            k in value[0] for k in ["title", "name", "trackName", "soundName"]
                        ):
                            sounds = value
                            break

            for rank, sound in enumerate(sounds[:limit], 1):
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=sound.get("title", sound.get("name", sound.get("soundName", "Unknown"))),
                        artist=sound.get("artist", sound.get("artistName", "Unknown")),
                        snap_creations=sound.get("creationCount", sound.get("useCount")),
                        platform=Platform.SNAP,
                        chart_name="Snapchat Trending Sounds",
                    )
                )
        except Exception:
            pass
        return entries
