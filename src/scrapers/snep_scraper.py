"""SNEP (Syndicat National de l'Édition Phonographique) official French charts scraper."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class SNEPScraper(BaseScraper):
    """Scrapes SNEP official French charts (Top Singles & Top Albums)."""

    platform = Platform.SNEP
    TOP_SINGLES_URL = "https://snepmusique.com/les-tops/le-top-de-la-semaine/top-singles/"
    TOP_ALBUMS_URL = "https://snepmusique.com/les-tops/le-top-de-la-semaine/top-albums/"
    # Fallback: use infodisc (historical SNEP data mirror)
    INFODISC_URL = "http://www.infodisc.fr/S_Clas.php"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 50) -> ChartData:
        """Fetch SNEP Top Singles France."""
        return self.fetch_singles(limit)

    def fetch_singles(self, limit: int = 50) -> ChartData:
        """Fetch SNEP Top Singles."""
        entries = self._scrape_snep_page(self.TOP_SINGLES_URL, "Top Singles", limit)
        return ChartData(
            platform=Platform.SNEP,
            chart_name="SNEP Top Singles",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.TOP_SINGLES_URL,
        )

    def fetch_albums(self, limit: int = 50) -> ChartData:
        """Fetch SNEP Top Albums."""
        entries = self._scrape_snep_page(self.TOP_ALBUMS_URL, "Top Albums", limit)
        return ChartData(
            platform=Platform.SNEP,
            chart_name="SNEP Top Albums",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.TOP_ALBUMS_URL,
        )

    def _scrape_snep_page(self, url: str, chart_name: str, limit: int) -> list[TrackEntry]:
        """Scrape a SNEP chart page."""
        try:
            html = self.http.get_text(url)
            soup = BeautifulSoup(html, "lxml")

            entries = []
            # SNEP uses structured chart items
            items = soup.select(
                ".chart-item, .top-item, [class*='chart'], "
                "[class*='top-list'] li, table.chart tr, .classement-item"
            )

            if not items:
                # Try parsing any table structure
                tables = soup.find_all("table")
                for table in tables:
                    rows = table.find_all("tr")[1:]
                    for rank, row in enumerate(rows[:limit], 1):
                        cols = row.find_all("td")
                        if len(cols) >= 2:
                            entries.append(self._parse_table_row(cols, rank, chart_name))
                    if entries:
                        break

            for rank, item in enumerate(items[:limit], 1):
                entry = self._parse_chart_item(item, rank, chart_name)
                if entry:
                    entries.append(entry)

            return entries
        except Exception as e:
            self.logger.warning("SNEP scrape failed for %s: %s", url, e)
            return []

    def _parse_chart_item(self, item, rank: int, chart_name: str) -> Optional[TrackEntry]:
        """Parse a single SNEP chart item."""
        try:
            # Try various selectors for title and artist
            title_el = item.select_one(
                ".title, .track-title, [class*='title'], h3, h4, strong"
            )
            artist_el = item.select_one(
                ".artist, .track-artist, [class*='artist'], .subtitle, em"
            )

            title = title_el.get_text(strip=True) if title_el else item.get_text(strip=True)[:80]
            artist = artist_el.get_text(strip=True) if artist_el else ""

            # Try to find evolution (change in rank)
            evolution = None
            evo_el = item.select_one("[class*='evolution'], [class*='move'], .change")
            if evo_el:
                evolution = evo_el.get_text(strip=True)

            # Try to find weeks on chart
            weeks = None
            weeks_el = item.select_one("[class*='week'], [class*='semaine']")
            if weeks_el:
                weeks_text = re.search(r"(\d+)", weeks_el.get_text())
                weeks = int(weeks_text.group(1)) if weeks_text else None

            return TrackEntry(
                rank=rank,
                title=title,
                artist=artist,
                platform=Platform.SNEP,
                chart_name=chart_name,
                evolution=evolution,
                weeks_on_chart=weeks,
            )
        except Exception:
            return None

    def _parse_table_row(self, cols, rank: int, chart_name: str) -> TrackEntry:
        """Parse a table row into a TrackEntry."""
        texts = [c.get_text(strip=True) for c in cols]
        return TrackEntry(
            rank=rank,
            title=texts[1] if len(texts) > 1 else texts[0],
            artist=texts[2] if len(texts) > 2 else "",
            platform=Platform.SNEP,
            chart_name=chart_name,
        )
