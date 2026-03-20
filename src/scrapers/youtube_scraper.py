"""YouTube Music France trending scraper."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform, TrackEntry

from .base_scraper import BaseScraper


class YouTubeScraper(BaseScraper):
    """Scrapes YouTube Music trending / charts France via Kworb and public pages."""

    platform = Platform.YOUTUBE
    # Kworb YouTube France insights chart
    KWORB_URL = "https://kworb.net/youtube/insights/fr.html"
    # YouTube Music Charts (public)
    YT_CHARTS_URL = "https://charts.youtube.com/charts/TopSongs/fr"

    def __init__(self, http_client: Optional[HttpClient] = None):
        super().__init__(http_client)

    def fetch_chart(self, limit: int = 25) -> ChartData:
        """Fetch YouTube France trending music."""
        entries = self._try_kworb(limit)

        return ChartData(
            platform=Platform.YOUTUBE,
            chart_name="Top YouTube Music France",
            country="FR",
            date_fetched=datetime.now(),
            entries=entries,
            source_url=self.KWORB_URL,
        )

    def _try_kworb(self, limit: int) -> list[TrackEntry]:
        """Scrape Kworb YouTube France chart."""
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

                # Kworb format: [0]=rank, [1]=evo, [2]=artist-title, [3]=weeks,
                #               [4]=peak, [5]=x-weeks, [6]=views_week, [7]=diff
                rank_text = cols[0].get_text(strip=True)
                rank = int(rank_text) if rank_text.isdigit() else None
                evolution = cols[1].get_text(strip=True) or None

                title_text = cols[2].get_text(strip=True)
                parts = title_text.split(" - ", 1)
                artist = parts[0].strip() if len(parts) > 1 else "Unknown"
                title = parts[1].strip() if len(parts) > 1 else title_text

                views_text = cols[6].get_text(strip=True).replace(",", "").replace(".", "")
                views = int(views_text) if views_text.isdigit() else None

                link_tag = cols[2].find("a")
                url = None
                if link_tag and link_tag.get("href"):
                    href = link_tag["href"]
                    if not href.startswith("http"):
                        url = f"https://www.youtube.com/watch?v={href}" if len(href) == 11 else None
                    else:
                        url = href

                entries.append(
                    TrackEntry(
                        rank=rank,
                        title=title,
                        artist=artist,
                        views=views,
                        platform=Platform.YOUTUBE,
                        chart_name="Top YouTube France",
                        url=url,
                        evolution=evolution,
                    )
                )
            return entries
        except Exception as e:
            self.logger.warning("YouTube Kworb scrape failed: %s", e)
            return []
