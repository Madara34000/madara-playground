"""Spotify France Top 50 scraper via public chart page & API."""

from __future__ import annotations

import re
import json
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class SpotifyScraper(BaseScraper):
    """Scrapes Spotify Charts France (Top 50 / Viral 50)."""

    platform = Platform.SPOTIFY
    # Public Spotify Charts API endpoint
    CHARTS_API = "https://charts-spotify-com-service.spotify.com/public/v0/charts"
    # Fallback: scrape the public web page
    CHARTS_WEB = "https://charts.spotify.com/charts/view/regional-fr-weekly/latest"
    # Kworb as secondary data source for streaming numbers
    KWORB_URL = "https://kworb.net/spotify/country/fr_weekly.html"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 50) -> ChartData:
        """Fetch Spotify France Top 50 chart."""
        entries = self._try_kworb(limit)
        if not entries:
            entries = self._try_web_scrape(limit)

        return ChartData(
            platform=Platform.SPOTIFY,
            chart_name="Top 50 France",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.KWORB_URL,
        )

    def _try_kworb(self, limit: int) -> list[TrackEntry]:
        """Parse Kworb's Spotify France weekly chart (reliable public data)."""
        try:
            html = self.http.get_text(self.KWORB_URL)
            soup = BeautifulSoup(html, "lxml")
            table = soup.find("table")
            if not table:
                return []

            entries = []
            rows = table.find_all("tr")[1 : limit + 1]
            for row in rows:
                cols = row.find_all("td")
                if len(cols) < 7:
                    continue

                # Kworb format: [0]=rank, [1]=evo, [2]=artist-title, [3]=peak,
                #               [4]=pos, [5]=weeks, [6]=streams_week, [7]=diff, [8]=total
                rank_text = cols[0].get_text(strip=True)
                rank = int(rank_text) if rank_text.isdigit() else None
                evolution = cols[1].get_text(strip=True) or None

                # Parse "artist-title" from col[2]
                title_cell = cols[2].get_text(strip=True)
                parts = title_cell.split("-", 1)
                artist = parts[0].strip() if len(parts) > 1 else "Unknown"
                title = parts[1].strip() if len(parts) > 1 else title_cell

                # Weekly streams in col[6]
                streams_text = cols[6].get_text(strip=True).replace(",", "").replace(".", "")
                streams = int(streams_text) if streams_text.isdigit() else None

                # Peak position
                peak_text = cols[3].get_text(strip=True)
                peak = int(peak_text) if peak_text.isdigit() else None

                # Weeks on chart
                weeks_text = cols[5].get_text(strip=True)
                weeks_match = re.search(r"\d+", weeks_text)
                weeks = int(weeks_match.group()) if weeks_match else None

                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=title,
                        artist=artist,
                        streams=streams,
                        platform=Platform.SPOTIFY,
                        chart_name="Top 50 France Weekly",
                        evolution=evolution,
                        peak_position=peak,
                        weeks_on_chart=weeks,
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Kworb scrape failed: %s", e)
            return []

    def _try_web_scrape(self, limit: int) -> list[TrackEntry]:
        """Fallback: scrape Spotify Charts website directly."""
        try:
            html = self.http.get_text(self.CHARTS_WEB)
            soup = BeautifulSoup(html, "lxml")

            entries = []
            # Look for chart entries in script data
            scripts = soup.find_all("script", type="application/json")
            for script in scripts:
                try:
                    data = json.loads(script.string or "")
                    if isinstance(data, dict) and "chartEntryViewResponses" in str(data):
                        chart_entries = self._extract_from_json(data, limit)
                        if chart_entries:
                            return chart_entries
                except (json.JSONDecodeError, TypeError):
                    continue

            # Fallback to HTML parsing
            items = soup.select("[class*='ChartEntry'], [class*='chart-entry'], tr[class*='Row']")
            for rank, item in enumerate(items[:limit], 1):
                text = item.get_text(" ", strip=True)
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=text[:100],
                        artist="",
                        platform=Platform.SPOTIFY,
                        chart_name="Top 50 France",
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Spotify web scrape failed: %s", e)
            return []

    def _extract_from_json(self, data: dict, limit: int) -> list[TrackEntry]:
        """Extract chart entries from Spotify's embedded JSON."""
        entries = []
        try:
            # Navigate nested structure
            items = data.get("chartEntryViewResponses", data.get("entries", []))
            if not isinstance(items, list):
                return []

            for rank, item in enumerate(items[:limit], 1):
                entry_data = item if isinstance(item, dict) else {}
                track = entry_data.get("track", entry_data)
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=track.get("trackName", track.get("name", "Unknown")),
                        artist=track.get("artists", [{}])[0].get("name", "Unknown")
                        if isinstance(track.get("artists"), list)
                        else track.get("artistName", "Unknown"),
                        streams=entry_data.get("streams"),
                        platform=Platform.SPOTIFY,
                        chart_name="Top 50 France",
                    )
                )
        except Exception:
            pass
        return entries
