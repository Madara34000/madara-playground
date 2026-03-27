"""Music Weekly FR Agent — orchestrates all scrapers and generates the newsletter."""

from __future__ import annotations

import logging
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

from config.settings import (
    APPLE_MUSIC_LIMIT,
    DEEZER_LIMIT,
    GENIUS_LIMIT,
    LOG_FORMAT,
    LOG_LEVEL,
    SHAZAM_LIMIT,
    SNAP_LIMIT,
    SNEP_LIMIT,
    SPOTIFY_LIMIT,
    YOUTUBE_LIMIT,
)
from src.generators.cross_platform_analyzer import CrossPlatformAnalyzer
from src.generators.newsletter_generator import NewsletterGenerator
from src.scrapers.apple_music_scraper import AppleMusicScraper
from src.scrapers.deezer_scraper import DeezerScraper
from src.scrapers.genius_scraper import GeniusScraper
from src.scrapers.shazam_scraper import ShazamScraper
from src.scrapers.snap_scraper import SnapScraper
from src.scrapers.snep_scraper import SNEPScraper
from src.scrapers.soundcharts_scraper import SoundchartsScraper
from src.scrapers.spotify_scraper import SpotifyScraper
from src.scrapers.youtube_scraper import YouTubeScraper
from src.utils.http_client import HttpClient
from src.utils.models import WeeklyDigest

logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)
logger = logging.getLogger("MusicWeeklyFR")


class MusicWeeklyAgent:
    """Main agent that collects data from all sources and produces the newsletter."""

    def __init__(self):
        self.http = HttpClient()
        # Initialize all scrapers
        self.spotify = SpotifyScraper(self.http)
        self.apple = AppleMusicScraper(self.http)
        self.deezer = DeezerScraper(self.http)
        self.shazam = ShazamScraper(self.http)
        self.youtube = YouTubeScraper(self.http)
        self.snep = SNEPScraper(self.http)
        self.snap = SnapScraper(self.http)
        self.genius = GeniusScraper(self.http)
        self.soundcharts = SoundchartsScraper(self.http)

        self.analyzer = CrossPlatformAnalyzer()
        self.generator = NewsletterGenerator()

    def run(self) -> dict[str, Path]:
        """Execute the full pipeline: scrape -> analyze -> generate."""
        logger.info("=== Music Weekly FR Agent - Demarrage ===")

        # Determine the week range
        today = date.today()
        week_end = today
        week_start = today - timedelta(days=7)
        logger.info("Periode: %s -> %s", week_start, week_end)

        # Step 1: Scrape all platforms in parallel
        logger.info("--- Etape 1: Collecte des donnees ---")
        digest = self._scrape_all(week_start, week_end)

        # Step 2: Cross-platform analysis
        logger.info("--- Etape 2: Analyse cross-plateforme ---")
        digest = self.analyzer.analyze(digest)

        # Step 3: Generate newsletter
        logger.info("--- Etape 3: Generation de la newsletter ---")
        paths = self.generator.save_all(digest)

        logger.info("=== Newsletter generee avec succes ! ===")
        for fmt, path in paths.items():
            logger.info("  %s: %s", fmt, path)

        return paths

    def _scrape_all(self, week_start: date, week_end: date) -> WeeklyDigest:
        """Scrape all platforms concurrently."""
        digest = WeeklyDigest(week_start=week_start, week_end=week_end)

        # Define scraping tasks: (attribute_name, scraper_method, limit)
        tasks = [
            ("spotify_top_50", self.spotify.safe_fetch, SPOTIFY_LIMIT),
            ("apple_music_top_25", self.apple.safe_fetch, APPLE_MUSIC_LIMIT),
            ("deezer_top_50", self.deezer.safe_fetch, DEEZER_LIMIT),
            ("shazam_top_20", self.shazam.safe_fetch, SHAZAM_LIMIT),
            ("youtube_trending", self.youtube.safe_fetch, YOUTUBE_LIMIT),
            ("snep_top_singles", lambda limit: self.snep.safe_fetch(limit), SNEP_LIMIT),
            ("snap_top_sounds", self.snap.safe_fetch, SNAP_LIMIT),
        ]

        # Run scrapers in parallel
        with ThreadPoolExecutor(max_workers=6) as executor:
            future_to_attr = {}
            for attr_name, fetch_fn, limit in tasks:
                future = executor.submit(fetch_fn, limit)
                future_to_attr[future] = attr_name

            for future in as_completed(future_to_attr):
                attr_name = future_to_attr[future]
                try:
                    result = future.result()
                    if result:
                        setattr(digest, attr_name, result)
                        entry_count = len(result.entries) if result.entries else 0
                        logger.info(
                            "  [OK] %s: %d entrees collectees", attr_name, entry_count
                        )
                    else:
                        logger.warning("  [--] %s: aucune donnee", attr_name)
                except Exception as e:
                    logger.error("  [!!] %s: erreur - %s", attr_name, e)

        # SNEP Albums (separate call)
        try:
            albums = self.snep.fetch_albums(SNEP_LIMIT)
            if albums and albums.entries:
                digest.snep_top_albums = albums
                logger.info("  [OK] snep_top_albums: %d entrees", len(albums.entries))
        except Exception as e:
            logger.warning("  [--] snep_top_albums: %s", e)

        # Soundcharts/Chartmetric (if API keys available)
        sc_chart = self.soundcharts.safe_fetch()
        if sc_chart and sc_chart.entries:
            logger.info("  [OK] soundcharts: %d entrees", len(sc_chart.entries))

        return digest

    def run_dry(self) -> WeeklyDigest:
        """Run scraping and analysis without saving files. Useful for testing."""
        today = date.today()
        digest = self._scrape_all(today - timedelta(days=7), today)
        return self.analyzer.analyze(digest)


def main():
    """Entry point for the agent."""
    agent = MusicWeeklyAgent()
    paths = agent.run()
    print("\n" + "=" * 60)
    print("  MUSIC WEEKLY FR - Newsletter prete !")
    print("=" * 60)
    for fmt, path in paths.items():
        print(f"  {fmt:10s} -> {path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
