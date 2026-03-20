"""Genius France trending songs scraper."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class GeniusScraper(BaseScraper):
    """Scrapes Genius France charts for trending lyrics/songs."""

    platform = Platform.GENIUS
    CHARTS_URL = "https://genius.com/charts/songs/france"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 25) -> ChartData:
        """Fetch Genius France trending songs."""
        entries = self._scrape_genius(limit)
        return ChartData(
            platform=Platform.GENIUS,
            chart_name="Genius Top France",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.CHARTS_URL,
        )

    def _scrape_genius(self, limit: int) -> list[TrackEntry]:
        """Scrape Genius France chart page."""
        try:
            html = self.http.get_text(self.CHARTS_URL)
            soup = BeautifulSoup(html, "lxml")

            entries = []
            # Genius chart items
            items = soup.select(
                "[class*='ChartItem'], [class*='chart_item'], "
                "[class*='PageGriddesktop'], .chart-item"
            )

            if not items:
                # Try embedded JSON (Next.js / React)
                scripts = soup.find_all("script", {"type": "application/json"})
                for script in scripts:
                    try:
                        data = json.loads(script.string or "")
                        if "chart_items" in str(data):
                            entries = self._extract_chart_items(data, limit)
                            if entries:
                                return entries
                    except (json.JSONDecodeError, TypeError):
                        continue

            for rank, item in enumerate(items[:limit], 1):
                title_el = item.select_one(
                    "[class*='title'], [class*='Title'], h3, .chart-item-title"
                )
                artist_el = item.select_one(
                    "[class*='artist'], [class*='Artist'], .chart-item-artist"
                )
                link_el = item.select_one("a[href*='genius.com']") or item.find("a")

                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=title_el.get_text(strip=True) if title_el else "Unknown",
                        artist=artist_el.get_text(strip=True) if artist_el else "Unknown",
                        platform=Platform.GENIUS,
                        chart_name="Genius Top France",
                        url=link_el["href"] if link_el and link_el.get("href") else None,
                    )
                )

            return entries
        except Exception as e:
            self.logger.warning("Genius scrape failed: %s", e)
            return []

    def _extract_chart_items(self, data: dict, limit: int) -> list[TrackEntry]:
        """Extract from Genius embedded JSON."""
        entries = []
        try:
            # Recursively search for chart items
            items = self._find_chart_items(data)
            for rank, item in enumerate(items[:limit], 1):
                song = item.get("item", item)
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=song.get("title", "Unknown"),
                        artist=song.get("primary_artist", {}).get("name", "Unknown")
                        if isinstance(song.get("primary_artist"), dict)
                        else song.get("artist_names", "Unknown"),
                        platform=Platform.GENIUS,
                        chart_name="Genius Top France",
                        url=song.get("url"),
                    )
                )
        except Exception:
            pass
        return entries

    def _find_chart_items(self, data, depth: int = 0) -> list:
        """Recursively find chart_items in nested data."""
        if depth > 5:
            return []
        if isinstance(data, dict):
            if "chart_items" in data:
                return data["chart_items"]
            for value in data.values():
                result = self._find_chart_items(value, depth + 1)
                if result:
                    return result
        elif isinstance(data, list):
            for item in data:
                result = self._find_chart_items(item, depth + 1)
                if result:
                    return result
        return []
