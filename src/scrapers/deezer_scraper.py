"""Deezer France Top 50 scraper via public API."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class DeezerScraper(BaseScraper):
    """Scrapes Deezer France chart via public API."""

    platform = Platform.DEEZER
    # Deezer public API — chart endpoint (France by default for .fr)
    API_URL = "https://api.deezer.com/chart/0/tracks"
    PLAYLIST_URL = "https://api.deezer.com/playlist/1109890291/tracks"  # Top France

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 50) -> ChartData:
        """Fetch Deezer France Top chart."""
        entries = self._try_chart_api(limit)
        if not entries:
            entries = self._try_playlist_api(limit)

        return ChartData(
            platform=Platform.DEEZER,
            chart_name="Top 50 France",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.API_URL,
        )

    def _try_chart_api(self, limit: int) -> list[TrackEntry]:
        """Use Deezer public chart API."""
        try:
            data = self.http.get_json(self.API_URL, params={"limit": str(limit)})
            tracks = data.get("data", [])

            entries = []
            for rank, track in enumerate(tracks[:limit], 1):
                artist_info = track.get("artist", {})
                album_info = track.get("album", {})
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=track.get("title", "Unknown"),
                        artist=artist_info.get("name", "Unknown"),
                        album=album_info.get("title"),
                        platform=Platform.DEEZER,
                        chart_name="Top France",
                        url=track.get("link"),
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Deezer chart API failed: %s", e)
            return []

    def _try_playlist_api(self, limit: int) -> list[TrackEntry]:
        """Fallback: use Deezer playlist API for Top France playlist."""
        try:
            data = self.http.get_json(self.PLAYLIST_URL, params={"limit": str(limit)})
            tracks = data.get("data", [])

            entries = []
            for rank, track in enumerate(tracks[:limit], 1):
                artist_info = track.get("artist", {})
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=track.get("title", "Unknown"),
                        artist=artist_info.get("name", "Unknown"),
                        platform=Platform.DEEZER,
                        chart_name="Top France Playlist",
                        url=track.get("link"),
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Deezer playlist API failed: %s", e)
            return []
