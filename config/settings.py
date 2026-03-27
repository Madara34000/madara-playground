"""Configuration for the Music Weekly FR agent."""

from __future__ import annotations

import os
from pathlib import Path

# ===== Scheduling =====
# Cron: every Friday at 08:00 Paris time
SCHEDULE_DAY = "friday"
SCHEDULE_TIME = "08:00"  # HH:MM in Europe/Paris timezone
TIMEZONE = "Europe/Paris"

# ===== Scraping limits =====
SPOTIFY_LIMIT = 50
APPLE_MUSIC_LIMIT = 25
DEEZER_LIMIT = 50
SHAZAM_LIMIT = 20
YOUTUBE_LIMIT = 25
SNEP_LIMIT = 50
SNAP_LIMIT = 20
GENIUS_LIMIT = 25

# ===== API Keys (from environment) =====
SOUNDCHARTS_API_KEY = os.environ.get("SOUNDCHARTS_API_KEY", "")
CHARTMETRIC_API_KEY = os.environ.get("CHARTMETRIC_API_KEY", "")
SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")

# ===== Output =====
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "output"
TEMPLATES_DIR = PROJECT_ROOT / "templates"

# ===== Features =====
ENABLE_SOUNDCHARTS = bool(SOUNDCHARTS_API_KEY)
ENABLE_CHARTMETRIC = bool(CHARTMETRIC_API_KEY)
ENABLE_HTML_OUTPUT = True
ENABLE_JSON_OUTPUT = True
ENABLE_MARKDOWN_OUTPUT = True

# ===== Logging =====
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s [%(name)s] %(levelname)s: %(message)s"
