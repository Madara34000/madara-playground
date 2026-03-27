"""Data models for the music newsletter agent."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Platform(str, Enum):
    SPOTIFY = "spotify"
    APPLE_MUSIC = "apple_music"
    DEEZER = "deezer"
    SHAZAM = "shazam"
    YOUTUBE = "youtube"
    SNEP = "snep"
    SNAP = "snapchat"
    GENIUS = "genius"
    SOUNDCHARTS = "soundcharts"
    CHARTMETRIC = "chartmetric"


class TrackEntry(BaseModel):
    """A single track in a chart or release list."""
    rank: Optional[int] = None
    title: str
    artist: str
    album: Optional[str] = None
    streams: Optional[int] = None
    views: Optional[int] = None
    shazams: Optional[int] = None
    snap_creations: Optional[int] = None
    label: Optional[str] = None
    release_date: Optional[date] = None
    platform: Platform
    chart_name: Optional[str] = None
    evolution: Optional[str] = None  # e.g. "+3", "NEW", "-1", "="
    peak_position: Optional[int] = None
    weeks_on_chart: Optional[int] = None
    url: Optional[str] = None
    isrc: Optional[str] = None


class ChartData(BaseModel):
    """Chart data from a single platform."""
    platform: Platform
    chart_name: str
    country: str = "FR"
    date_fetched: datetime = Field(default_factory=datetime.now)
    entries: list[TrackEntry] = Field(default_factory=list)
    source_url: Optional[str] = None


class NewRelease(BaseModel):
    """A new album or single release."""
    title: str
    artist: str
    release_type: str = "single"  # single, album, EP
    release_date: Optional[date] = None
    label: Optional[str] = None
    tracks_count: Optional[int] = None
    first_day_streams: Optional[int] = None
    platform_links: dict[str, str] = Field(default_factory=dict)
    genres: list[str] = Field(default_factory=list)


class ArtistStats(BaseModel):
    """Aggregated stats for an artist across platforms."""
    name: str
    monthly_listeners_spotify: Optional[int] = None
    followers_spotify: Optional[int] = None
    youtube_subscribers: Optional[int] = None
    youtube_total_views: Optional[int] = None
    shazam_count: Optional[int] = None
    deezer_fans: Optional[int] = None
    snap_total_creations: Optional[int] = None
    soundcharts_score: Optional[float] = None
    social_followers: dict[str, int] = Field(default_factory=dict)


class WeeklyDigest(BaseModel):
    """The full weekly newsletter data."""
    week_start: date
    week_end: date
    generated_at: datetime = Field(default_factory=datetime.now)

    # Charts by platform
    spotify_top_50: Optional[ChartData] = None
    apple_music_top_25: Optional[ChartData] = None
    deezer_top_50: Optional[ChartData] = None
    shazam_top_20: Optional[ChartData] = None
    youtube_trending: Optional[ChartData] = None
    snep_top_singles: Optional[ChartData] = None
    snep_top_albums: Optional[ChartData] = None
    snap_top_sounds: Optional[ChartData] = None

    # New releases
    new_releases: list[NewRelease] = Field(default_factory=list)
    yesterday_releases: list[NewRelease] = Field(default_factory=list)

    # Records and milestones
    biggest_first_day: Optional[TrackEntry] = None
    biggest_first_week: Optional[TrackEntry] = None
    milestones: list[str] = Field(default_factory=list)

    # Cross-platform analysis
    most_streamed_track: Optional[TrackEntry] = None
    fastest_rising: Optional[TrackEntry] = None
    top_artists: list[ArtistStats] = Field(default_factory=list)

    # Content creation metrics
    most_used_on_snap: Optional[TrackEntry] = None
    viral_tracks: list[TrackEntry] = Field(default_factory=list)
