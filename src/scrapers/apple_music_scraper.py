"""Apple Music France Top 25 scraper via RSS feed & web."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Optional

from xml.etree import ElementTree

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class AppleMusicScraper(BaseScraper):
    """Scrapes Apple Music France charts via public RSS/API."""

    platform = Platform.APPLE_MUSIC
    # Apple Music public RSS feed for top songs France
    RSS_URL = "https://rss.marketingtools.apple.com/api/v2/fr/music/most-played/25/songs.json"
    # Fallback RSS XML
    RSS_XML_URL = "https://rss.marketingtools.apple.com/api/v2/fr/music/most-played/25/songs.xml"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 25) -> ChartData:
        """Fetch Apple Music France Top 25."""
        entries = self._try_json_feed(limit)
        if not entries:
            entries = self._try_rss_xml(limit)

        return ChartData(
            platform=Platform.APPLE_MUSIC,
            chart_name="Top 25 France",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.RSS_URL,
        )

    def _try_json_feed(self, limit: int) -> list[TrackEntry]:
        """Parse Apple Music JSON RSS feed."""
        try:
            data = self.http.get_json(self.RSS_URL)
            feed = data.get("feed", {})
            results = feed.get("results", [])

            entries = []
            for rank, item in enumerate(results[:limit], 1):
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=item.get("name", "Unknown"),
                        artist=item.get("artistName", "Unknown"),
                        album=item.get("collectionName"),
                        release_date=None,
                        platform=Platform.APPLE_MUSIC,
                        chart_name="Top 25 France",
                        url=item.get("url"),
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Apple Music JSON feed failed: %s", e)
            return []

    def _try_rss_xml(self, limit: int) -> list[TrackEntry]:
        """Fallback: parse RSS XML feed using stdlib ElementTree."""
        try:
            text = self.http.get_text(self.RSS_XML_URL)
            root = ElementTree.fromstring(text)
            # Handle Atom namespace
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            items = root.findall(".//item") or root.findall(".//atom:entry", ns)

            entries = []
            for rank, item in enumerate(items[:limit], 1):
                title_el = item.find("title") or item.find("atom:title", ns)
                link_el = item.find("link") or item.find("atom:link", ns)
                title_text = title_el.text if title_el is not None and title_el.text else ""
                link_text = link_el.text if link_el is not None and link_el.text else (
                    link_el.get("href", "") if link_el is not None else ""
                )
                title_parts = title_text.split(" - ", 1)
                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=title_parts[-1].strip() if len(title_parts) > 1 else title_parts[0],
                        artist=title_parts[0].strip() if len(title_parts) > 1 else "Unknown",
                        platform=Platform.APPLE_MUSIC,
                        chart_name="Top 25 France",
                        url=link_text,
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("Apple Music RSS XML failed: %s", e)
            return []
