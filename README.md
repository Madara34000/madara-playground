# Music Weekly FR - Agent Newsletter Musique

Agent automatise de creation de newsletter musicale francaise.
Chaque vendredi, il collecte et analyse les classements de toutes les plateformes majeures.

## Sources de donnees

| Plateforme | Donnees | Source |
|---|---|---|
| **Spotify** | Top 50 France (streams hebdo, evolution, peak) | Kworb / Spotify Charts |
| **Apple Music** | Top 25 France | Apple RSS Feed API |
| **Deezer** | Top 50 France | Deezer Public API |
| **Shazam** | Top 20 France (nombre de shazams) | Shazam API |
| **YouTube** | Tendances France (vues hebdo) | Kworb YouTube Insights |
| **SNEP** | Top Singles + Top Albums officiels | snepmusique.com |
| **Snapchat** | Sons tendance + nombre de creations | Snapchat Sounds |
| **Genius** | Top paroles France | Genius Charts |
| **Soundcharts** | Analytics pro (playlists, listeners, score) | Soundcharts API |
| **Chartmetric** | Analytics label (streams cross-platform) | Chartmetric API |

## Fonctionnalites

- **Classements multi-plateformes** : Top Spotify, Apple Music, Deezer, YouTube, SNEP, Shazam
- **Chiffres Snap** : Sons tendance et nombre de creations de contenu
- **Analyse cross-plateforme** : Detection automatique des tracks viraux (present sur 3+ plateformes)
- **Records et milestones** : Track le plus streame, montee la plus rapide
- **Sorties de la semaine** : Nouveaux albums/singles + sorties de la veille
- **Outils pro** : Integration Soundcharts et Chartmetric pour les labels
- **3 formats** : Markdown, HTML (dark theme), JSON
- **Scheduler** : Execution automatique chaque vendredi a 08h00

## Usage

```bash
# Installation
pip install -r requirements.txt

# Execution immediate (genere la newsletter maintenant)
python run.py

# Mode dry-run (affiche les stats sans sauvegarder)
python run.py --dry-run

# Scheduler (execution automatique chaque vendredi)
python run.py --schedule
```

## Configuration API (optionnel)

Pour les donnees pro (Soundcharts/Chartmetric), definir les variables d'environnement :

```bash
export SOUNDCHARTS_API_KEY="app_id:api_key"
export CHARTMETRIC_API_KEY="your_refresh_token"
```

## Structure

```
src/
  agent.py                    # Orchestrateur principal
  scheduler.py                # Planificateur vendredi
  scrapers/
    spotify_scraper.py        # Spotify FR via Kworb
    apple_music_scraper.py    # Apple Music FR via RSS API
    deezer_scraper.py         # Deezer FR via API publique
    shazam_scraper.py         # Shazam FR
    youtube_scraper.py        # YouTube FR via Kworb
    snep_scraper.py           # SNEP Top Singles/Albums
    snap_scraper.py           # Snapchat Sounds
    genius_scraper.py         # Genius France
    soundcharts_scraper.py    # Soundcharts + Chartmetric
  generators/
    newsletter_generator.py   # Generateur Markdown/HTML/JSON
    cross_platform_analyzer.py # Analyse cross-plateforme
  utils/
    http_client.py            # Client HTTP avec retry
    models.py                 # Modeles de donnees Pydantic
templates/
  newsletter.md.j2            # Template Markdown
  newsletter.html.j2          # Template HTML dark theme
config/
  settings.py                 # Configuration
output/                       # Newsletters generees
```

## Output

Les newsletters sont generees dans le dossier `output/` :
- `newsletter_YYYY-MM-DD.md` : Version Markdown
- `newsletter_YYYY-MM-DD.html` : Version HTML avec dark theme
- `newsletter_YYYY-MM-DD.json` : Export JSON brut
