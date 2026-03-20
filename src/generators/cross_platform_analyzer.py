"""Cross-platform analysis engine — finds patterns, records, and viral tracks."""

from __future__ import annotations

from collections import defaultdict
from typing import Optional

from src.utils.models import ChartData, TrackEntry, WeeklyDigest


class CrossPlatformAnalyzer:
    """Analyzes data across all platforms to find insights."""

    def analyze(self, digest: WeeklyDigest) -> WeeklyDigest:
        """Enrich the digest with cross-platform analysis."""
        all_entries = self._collect_all_entries(digest)
        artist_tracks = self._group_by_artist(all_entries)
        track_appearances = self._group_by_track(all_entries)

        # Find most streamed track (highest streams across platforms)
        digest.most_streamed_track = self._find_most_streamed(all_entries)

        # Find fastest rising track (appears on most charts with high ranks)
        digest.fastest_rising = self._find_fastest_rising(track_appearances)

        # Find most used on Snap
        digest.most_used_on_snap = self._find_top_snap(all_entries)

        # Find viral tracks (appearing on 3+ platforms)
        digest.viral_tracks = self._find_viral_tracks(track_appearances)

        # Generate milestones
        digest.milestones = self._detect_milestones(all_entries, artist_tracks)

        return digest

    def _collect_all_entries(self, digest: WeeklyDigest) -> list[TrackEntry]:
        """Collect all track entries from all charts."""
        entries = []
        charts = [
            digest.spotify_top_50,
            digest.apple_music_top_25,
            digest.deezer_top_50,
            digest.shazam_top_20,
            digest.youtube_trending,
            digest.snep_top_singles,
            digest.snap_top_sounds,
        ]
        for chart in charts:
            if chart and chart.entries:
                entries.extend(chart.entries)
        return entries

    def _group_by_artist(self, entries: list[TrackEntry]) -> dict[str, list[TrackEntry]]:
        """Group entries by normalized artist name."""
        grouped: dict[str, list[TrackEntry]] = defaultdict(list)
        for entry in entries:
            key = self._normalize(entry.artist)
            grouped[key].append(entry)
        return grouped

    def _group_by_track(self, entries: list[TrackEntry]) -> dict[str, list[TrackEntry]]:
        """Group entries by normalized track name."""
        grouped: dict[str, list[TrackEntry]] = defaultdict(list)
        for entry in entries:
            key = f"{self._normalize(entry.artist)}|{self._normalize(entry.title)}"
            grouped[key].append(entry)
        return grouped

    def _find_most_streamed(self, entries: list[TrackEntry]) -> Optional[TrackEntry]:
        """Find the track with the highest stream count."""
        streamed = [e for e in entries if e.streams and e.streams > 0]
        if not streamed:
            return None
        return max(streamed, key=lambda e: e.streams or 0)

    def _find_fastest_rising(self, track_groups: dict[str, list[TrackEntry]]) -> Optional[TrackEntry]:
        """Find track appearing on most platforms with best average rank."""
        best = None
        best_score = -1
        for key, entries in track_groups.items():
            platforms = {e.platform for e in entries}
            avg_rank = sum(e.rank or 50 for e in entries) / len(entries)
            # Score: more platforms + lower avg rank = better
            score = len(platforms) * 100 - avg_rank
            if score > best_score:
                best_score = score
                best = entries[0]
        return best

    def _find_top_snap(self, entries: list[TrackEntry]) -> Optional[TrackEntry]:
        """Find track with most Snap creations."""
        snap_entries = [e for e in entries if e.snap_creations and e.snap_creations > 0]
        if not snap_entries:
            # Fallback: take top ranked Snap entry
            snap_entries = [e for e in entries if e.platform.value == "snapchat"]
            if snap_entries:
                return min(snap_entries, key=lambda e: e.rank or 999)
            return None
        return max(snap_entries, key=lambda e: e.snap_creations or 0)

    def _find_viral_tracks(self, track_groups: dict[str, list[TrackEntry]]) -> list[TrackEntry]:
        """Find tracks appearing on 3+ different platforms."""
        viral = []
        for key, entries in track_groups.items():
            platforms = {e.platform for e in entries}
            if len(platforms) >= 3:
                # Return the entry with best data
                best = max(entries, key=lambda e: (e.streams or 0) + (e.views or 0))
                viral.append(best)
        return sorted(viral, key=lambda e: len({ee.platform for ee in track_groups.get(
            f"{self._normalize(e.artist)}|{self._normalize(e.title)}", []
        )}), reverse=True)[:10]

    def _detect_milestones(
        self, entries: list[TrackEntry], artist_tracks: dict[str, list[TrackEntry]]
    ) -> list[str]:
        """Detect notable milestones and records."""
        milestones = []

        # Artist with most entries across all charts
        if artist_tracks:
            top_artist = max(artist_tracks.items(), key=lambda x: len(x[1]))
            if len(top_artist[1]) >= 3:
                name = top_artist[1][0].artist
                milestones.append(
                    f"{name} domine les charts avec {len(top_artist[1])} "
                    f"entrees sur l'ensemble des plateformes"
                )

        # Tracks at #1 on multiple platforms
        number_ones = [e for e in entries if e.rank == 1]
        if len(number_ones) >= 2:
            # Group #1s by track
            n1_groups: dict[str, list[TrackEntry]] = defaultdict(list)
            for e in number_ones:
                key = self._normalize(e.artist)
                n1_groups[key].append(e)
            for key, n1_entries in n1_groups.items():
                if len(n1_entries) >= 2:
                    platforms = ", ".join(e.platform.value for e in n1_entries)
                    milestones.append(
                        f"{n1_entries[0].artist} - {n1_entries[0].title} est #1 sur {platforms}"
                    )

        # High stream counts
        big_streams = [e for e in entries if e.streams and e.streams >= 5_000_000]
        for e in big_streams:
            milestones.append(
                f"{e.artist} - {e.title} depasse les {e.streams // 1_000_000}M de streams ({e.platform.value})"
            )

        return milestones[:10]

    @staticmethod
    def _normalize(text: str) -> str:
        """Normalize text for comparison."""
        return text.strip().lower().replace("'", "'").replace("  ", " ")
