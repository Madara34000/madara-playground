"""Newsletter generator — produces the weekly music digest in multiple formats."""

from __future__ import annotations

import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader

from src.utils.models import ChartData, TrackEntry, WeeklyDigest

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "output"
DOCS_DIR = Path(__file__).resolve().parent.parent.parent / "docs"


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

        # Copy HTML to docs/ for GitHub Pages
        self._publish_to_docs(html_path, date_str)

        return paths

    def _publish_to_docs(self, html_path: Path, date_str: str) -> None:
        """Copy the HTML newsletter to docs/ and update the index page."""
        docs_dir = DOCS_DIR
        docs_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(html_path, docs_dir / html_path.name)

        # Collect all newsletters in docs/
        newsletters = sorted(
            [f for f in docs_dir.glob("newsletter_*.html")],
            reverse=True,
        )

        # Generate index.html
        items_html = ""
        for i, f in enumerate(newsletters):
            name = f.stem.replace("newsletter_", "")
            badge = '<span class="badge">Derniere</span>' if i == 0 else ""
            items_html += (
                f'<li><a href="{f.name}">Semaine du {name}{badge}</a></li>\n'
            )

        index_html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Weekly FR</title>
    <style>
        :root {{
            --bg: #0a0a0f; --card: #13131a; --accent: #7c3aed;
            --text: #e2e8f0; --muted: #94a3b8; --border: #1e1e2e;
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg); color: var(--text); line-height: 1.6;
            display: flex; align-items: center; justify-content: center; min-height: 100vh;
        }}
        .container {{ max-width: 600px; padding: 40px; text-align: center; }}
        h1 {{ font-size: 2rem; margin-bottom: 8px; }}
        .subtitle {{ color: var(--muted); margin-bottom: 40px; }}
        .newsletter-list {{ list-style: none; }}
        .newsletter-list li {{ margin-bottom: 12px; }}
        .newsletter-list a {{
            display: block; padding: 16px 24px; background: var(--card);
            border: 1px solid var(--border); border-radius: 12px;
            color: var(--text); text-decoration: none; transition: all 0.2s;
        }}
        .newsletter-list a:hover {{ border-color: var(--accent); transform: translateY(-2px); }}
        .badge {{
            display: inline-block; background: var(--accent); color: white;
            padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; margin-left: 8px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Music Weekly FR</h1>
        <p class="subtitle">Newsletter hebdomadaire des charts musicaux francais</p>
        <ul class="newsletter-list">
            {items_html}
        </ul>
    </div>
</body>
</html>"""
        (docs_dir / "index.html").write_text(index_html, encoding="utf-8")

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
