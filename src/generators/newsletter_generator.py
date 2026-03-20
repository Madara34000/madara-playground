"""Newsletter generator — produces the weekly music digest in multiple formats."""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader

from src.utils.models import ChartData, TrackEntry, WeeklyDigest

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "output"


class NewsletterGenerator:
    """Generates newsletter content from a WeeklyDigest."""

    def __init__(self, templates_dir: Optional[Path] = None, output_dir: Optional[Path] = None):
        self.templates_dir = templates_dir or TEMPLATES_DIR
        self.output_dir = output_dir or OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True,
        )
        self.env.filters["format_number"] = self._format_number
        self.env.filters["format_streams"] = self._format_streams
        self.env.filters["rank_emoji"] = self._rank_emoji
        self.env.filters["evolution_display"] = self._evolution_display

    def generate_markdown(self, digest: WeeklyDigest) -> str:
        """Generate markdown newsletter."""
        template = self.env.get_template("newsletter.md.j2")
        return template.render(digest=digest, generated_at=datetime.now())

    def generate_html(self, digest: WeeklyDigest) -> str:
        """Generate HTML newsletter."""
        template = self.env.get_template("newsletter.html.j2")
        return template.render(digest=digest, generated_at=datetime.now())

    def generate_json(self, digest: WeeklyDigest) -> str:
        """Generate JSON export of the digest."""
        return digest.model_dump_json(indent=2)

    def save_all(self, digest: WeeklyDigest) -> dict[str, Path]:
        """Generate and save all formats. Returns dict of format->filepath."""
        date_str = digest.week_end.strftime("%Y-%m-%d")
        paths = {}

        # Markdown
        md_content = self.generate_markdown(digest)
        md_path = self.output_dir / f"newsletter_{date_str}.md"
        md_path.write_text(md_content, encoding="utf-8")
        paths["markdown"] = md_path

        # HTML
        html_content = self.generate_html(digest)
        html_path = self.output_dir / f"newsletter_{date_str}.html"
        html_path.write_text(html_content, encoding="utf-8")
        paths["html"] = html_path

        # JSON
        json_content = self.generate_json(digest)
        json_path = self.output_dir / f"newsletter_{date_str}.json"
        json_path.write_text(json_content, encoding="utf-8")
        paths["json"] = json_path

        return paths

    @staticmethod
    def _format_number(value: Optional[int]) -> str:
        """Format large numbers: 1234567 -> 1 234 567."""
        if value is None:
            return "N/A"
        return f"{value:,}".replace(",", " ")

    @staticmethod
    def _format_streams(value: Optional[int]) -> str:
        """Format streaming numbers with K/M suffix."""
        if value is None:
            return "N/A"
        if value >= 1_000_000:
            return f"{value / 1_000_000:.1f}M"
        if value >= 1_000:
            return f"{value / 1_000:.0f}K"
        return str(value)

    @staticmethod
    def _rank_emoji(rank: Optional[int]) -> str:
        """Return emoji for top 3 ranks."""
        if rank == 1:
            return "#1"
        if rank == 2:
            return "#2"
        if rank == 3:
            return "#3"
        return f"#{rank}" if rank else ""

    @staticmethod
    def _evolution_display(evolution: Optional[str]) -> str:
        """Format evolution indicator."""
        if not evolution:
            return ""
        evo = evolution.strip().upper()
        if evo in ("NEW", "NOUVEAU", "N"):
            return "[NEW]"
        if evo == "=" or evo == "0":
            return "[=]"
        if evo.startswith("+"):
            return f"[+{evo[1:]}]"
        if evo.startswith("-"):
            return f"[{evo}]"
        return f"[{evo}]"
