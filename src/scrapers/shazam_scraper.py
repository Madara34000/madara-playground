"""Shazam France Top 200 scraper via public API."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class ShazamScraper(BaseScraper):
    """Scrapes Shazam Discovery Top 200 France."""

    platform = Platform.SHAZAM
    # Shazam public API for top tracks by country
    API_URL = "https://www.shazam.com/services/charts/csv/discovery/fr"
    API_JSON_URL = "https://www.shazam.com/shazam/v3/fr/FR/web/-/tracks/country-chart-FR"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 20) -> ChartData:
        """Fetch Shazam France top chart."""
        entries = self._try_json_api(limit)

        return ChartData(
            platform=Platform.SHAZAM,
            chart_name="Top Shazam France",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.API_JSON_URL,
        )

    def _try_json_api(self, limit: int) -> list[TrackEntry]:
        """Parse Shazam JSON chart API."""
        try:
            headers = {
                "Accept": "application/json",
                "Accept-Language": "fr-FR,fr;q=0.9",
            }
            data = self.http.get_json(
                self.API_JSON_URL,
                headers=headers,
                params={"limit": str(limit), "offset": "0"},
            )
            tracks = data.get("tracks", data.get("data", []))

            entries = []
            for rank, track in enumerate(tracks[:limit], 1):
                attrs = track.get("attributes", track)
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=attrs.get("title", attrs.get("name", "Unknown")),
                        artist=attrs.get("subtitle", attrs.get("artistName", "Unknown")),
                        shazams=attrs.get("shazamCount"),
                        platform=Platform.SHAZAM,
                        chart_name="Top Shazam France",
                        url=attrs.get("url", attrs.get("webUrl")),
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Shazam JSON API failed: %s", e)
            return []
