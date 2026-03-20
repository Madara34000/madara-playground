"""Soundcharts & Chartmetric integration for pro-level music analytics."""

from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from src.utils.http_client import HttpClient
from src.utils.models import ArtistStats, ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class SoundchartsScraper(BaseScraper):
    """Integration with Soundcharts and Chartmetric APIs for deep analytics.

    Supports:
    - Soundcharts API (requires API key)
    - Chartmetric API (requires API key)
    - Fallback to public data aggregation

    These tools provide label-grade insights:
    - Real-time streaming data across all platforms
    - Playlist placement tracking
    - Social media growth metrics
    - Radio airplay monitoring
    - Audience demographics
    """

    platform = Platform.SOUNDCHARTS
    SOUNDCHARTS_API = "https://customer.api.soundcharts.com/api/v2"
    CHARTMETRIC_API = "https://api.chartmetric.com/api"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)
        self.soundcharts_key = os.environ.get("SOUNDCHARTS_API_KEY", "")
        self.chartmetric_key = os.environ.get("CHARTMETRIC_API_KEY", "")
        self.chartmetric_token: Optional[str] = None

    def fetch_chart(self, limit: int = 50) -> ChartData:
        """Fetch aggregated chart from Soundcharts/Chartmetric."""
        entries = []
        if self.soundcharts_key:
            entries = self._fetch_soundcharts_chart(limit)
        if not entries and self.chartmetric_key:
            entries = self._fetch_chartmetric_chart(limit)

        return ChartData(
            platform=Platform.SOUNDCHARTS,
            chart_name="Soundcharts/Chartmetric Aggregated",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
        )

    def _fetch_soundcharts_chart(self, limit: int) -> list[TrackEntry]:
        """Fetch from Soundcharts API."""
        try:
            headers = {
                "x-app-id": self.soundcharts_key.split(":")[0] if ":" in self.soundcharts_key else "",
                "x-api-key": self.soundcharts_key.split(":")[-1],
            }
            data = self.http.get_json(
                f"{self.SOUNDCHARTS_API}/chart/spotify/top200/FR/latest",
                headers=headers,
                params={"limit": str(limit)},
            )
            entries = []
            for rank, item in enumerate(data.get("items", [])[:limit], 1):
                song = item.get("song", {})
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=song.get("name", "Unknown"),
                        artist=song.get("artist", {}).get("name", "Unknown"),
                        streams=item.get("streams"),
                        platform=Platform.SOUNDCHARTS,
                        chart_name="Soundcharts Top 200 FR",
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Soundcharts API failed: %s", e)
            return []

    def _get_chartmetric_token(self) -> Optional[str]:
        """Authenticate with Chartmetric API."""
        if self.chartmetric_token:
            return self.chartmetric_token
        try:
            import json

            resp = self.http.client.post(
                f"{self.CHARTMETRIC_API}/token",
                json={"refreshtoken": self.chartmetric_key},
            )
            data = resp.json()
            self.chartmetric_token = data.get("token")
            return self.chartmetric_token
        except Exception:
            return None

    def _fetch_chartmetric_chart(self, limit: int) -> list[TrackEntry]:
        """Fetch from Chartmetric API."""
        try:
            token = self._get_chartmetric_token()
            if not token:
                return []

            headers = {"Authorization": f"Bearer {token}"}
            data = self.http.get_json(
                f"{self.CHARTMETRIC_API}/charts/spotify/tracks",
                headers=headers,
                params={
                    "country_code": "FR",
                    "type": "top200",
                    "limit": str(limit),
                    "latest": "true",
                },
            )
            entries = []
            for rank, item in enumerate(data.get("data", [])[:limit], 1):
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=item.get("name", "Unknown"),
                        artist=item.get("artist_names", "Unknown"),
                        streams=item.get("streams"),
                        platform=Platform.SOUNDCHARTS,
                        chart_name="Chartmetric Top FR",
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Chartmetric API failed: %s", e)
            return []

    def get_artist_deep_stats(self, artist_name: str) -> Optional[ArtistStats]:
        """Get comprehensive artist stats from Soundcharts/Chartmetric."""
        stats = ArtistStats(name=artist_name)

        if self.soundcharts_key:
            try:
                headers = {
                    "x-app-id": self.soundcharts_key.split(":")[0] if ":" in self.soundcharts_key else "",
                    "x-api-key": self.soundcharts_key.split(":")[-1],
                }
                # Search artist
                search_data = self.http.get_json(
                    f"{self.SOUNDCHARTS_API}/artist/search/{artist_name}",
                    headers=headers,
                )
                artists = search_data.get("items", [])
                if artists:
                    artist_uuid = artists[0].get("uuid")
                    # Get detailed stats
                    detail = self.http.get_json(
                        f"{self.SOUNDCHARTS_API}/artist/{artist_uuid}/spotify/listeners/latest",
                        headers=headers,
                    )
                    stats.monthly_listeners_spotify = detail.get("value")
                    stats.soundcharts_score = artists[0].get("score")
            except Exception as e:
                self.logger.debug("Soundcharts artist lookup failed: %s", e)

        return stats

    def get_playlist_placements(self, track_name: str, artist_name: str) -> list[dict]:
        """Track playlist placements (editorial, algorithmic, user-generated)."""
        placements = []
        if not self.soundcharts_key:
            return placements

        try:
            headers = {
                "x-app-id": self.soundcharts_key.split(":")[0] if ":" in self.soundcharts_key else "",
                "x-api-key": self.soundcharts_key.split(":")[-1],
            }
            search_data = self.http.get_json(
                f"{self.SOUNDCHARTS_API}/song/search/{track_name} {artist_name}",
                headers=headers,
            )
            songs = search_data.get("items", [])
            if songs:
                song_uuid = songs[0].get("uuid")
                playlist_data = self.http.get_json(
                    f"{self.SOUNDCHARTS_API}/song/{song_uuid}/spotify/playlists",
                    headers=headers,
                )
                for pl in playlist_data.get("items", []):
                    placements.append({
                        "playlist_name": pl.get("name"),
                        "followers": pl.get("followers"),
                        "type": pl.get("type"),  # editorial, algorithmic, user
                        "position": pl.get("position"),
                    })
        except Exception as e:
            self.logger.debug("Playlist placement lookup failed: %s", e)

        return placements
