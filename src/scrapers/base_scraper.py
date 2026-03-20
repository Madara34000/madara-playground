"""Base scraper class with common functionality."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Optional

from src.utils.http_client import HttpClient
from src.utils.models import ChartData, Platform

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Base class for all platform scrapers."""

    platform: Platform
    base_url: str = ""

    def __init__(self, http_client: Optional[HttpClient] = None):
        self.http = http_client or HttpClient()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    def fetch_chart(self, limit: int = 50) -> ChartData:
        """Fetch the main chart for this platform."""

    def safe_fetch(self, limit: int = 50) -> Optional[ChartData]:
        """Fetch chart with error handling — returns None on failure."""
        try:
            return self.fetch_chart(limit=limit)
        except Exception as e:
            self.logger.error("Failed to fetch %s chart: %s", self.platform.value, e)
            return None
