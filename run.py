#!/usr/bin/env python3
"""
Music Weekly FR - Agent de newsletter musicale francaise.

Usage:
    python run.py              # Execute immediatement (generation unique)
    python run.py --schedule   # Lance le scheduler (chaque vendredi a 08h00)
    python run.py --dry-run    # Execute sans sauvegarder de fichiers
"""

import sys
from pathlib import Path

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent))


def main():
    if "--schedule" in sys.argv:
        from src.scheduler import main as scheduler_main
        scheduler_main()
    elif "--dry-run" in sys.argv:
        from src.agent import MusicWeeklyAgent
        agent = MusicWeeklyAgent()
        digest = agent.run_dry()
        print(f"\nDigest genere: {digest.week_start} -> {digest.week_end}")
        print(f"Spotify entries: {len(digest.spotify_top_50.entries) if digest.spotify_top_50 else 0}")
        print(f"Apple Music entries: {len(digest.apple_music_top_25.entries) if digest.apple_music_top_25 else 0}")
        print(f"Deezer entries: {len(digest.deezer_top_50.entries) if digest.deezer_top_50 else 0}")
        print(f"Shazam entries: {len(digest.shazam_top_20.entries) if digest.shazam_top_20 else 0}")
        print(f"YouTube entries: {len(digest.youtube_trending.entries) if digest.youtube_trending else 0}")
        print(f"SNEP entries: {len(digest.snep_top_singles.entries) if digest.snep_top_singles else 0}")
        print(f"Snap entries: {len(digest.snap_top_sounds.entries) if digest.snap_top_sounds else 0}")
        print(f"Milestones: {len(digest.milestones)}")
        print(f"Viral tracks: {len(digest.viral_tracks)}")
    else:
        from src.agent import main as agent_main
        agent_main()


if __name__ == "__main__":
    main()
