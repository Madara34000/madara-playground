# 🎬 SHERKO LIVE · Studio de production

App de production pour les lives Twitch **SHERKO LIVE**. Elle génère à la demande
le **conducteur officiel** de chaque live (façon « Feuille De Route »), le
**planning chronométré**, et gère le **casting** — avec boutons pour **activer**
et **inviter** chaque agent.

Pré-remplie avec le live **SHERKO LIVE × BENJAY** (28 juin 2026) issu du conducteur officiel.

---

## ✨ Ce que fait l'app

| Vue | Fonctionnalité |
|---|---|
| **Lives** | Tableau de bord · statut · compte à rebours · prochain live · statut Twitch de la chaîne en direct |
| **Conducteur** | Brief par segments (façon PDF) · **édition inline** · ajout/suppression · **export PDF** · copier |
| **Planning** | Timeline chronométrée : crew → invité → live → segments minutés → clap de fin |
| **Casting** | **Toggle Activer/au repos** · **Inviter** (WhatsApp/Email/Discord) · **RSVP** (présent/peut-être/absent) · statut live + stats Twitch |
| **Outils live** | **Checklist régie cochable** (progression) · banque de **sons à react** · **questions du chat** |
| **Équipe** | Roster des twitcheurs · photos auto Twitch · contacts · activer/inviter/sync |
| **Générateur IA** | Décris l'invité + l'angle → **Claude** propose questions & segments. Fallback gabarit local. |

### 🟣 Intégration Twitch (vraie API)
- **Statut live / offline + viewers + jeu + followers** en temps réel (rafraîchi toutes les 90 s)
- **Photos de profil récupérées automatiquement** dès qu'un pseudo Twitch est renseigné
- **Schedule** et **clips** de la chaîne (avec clés API Helix)
- Marche en **zéro config** via decapi.me ; complet avec `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET`

### 💬 Intégration Discord (webhooks)
Depuis chaque live : **annoncer le live**, notifier **« ON EST EN LIVE »** (avec `@everyone` + mentions des agents), envoyer le **conducteur**, le **planning**, ou **inviter le casting**. Configure une fois l'URL de webhook (ou `DISCORD_WEBHOOK_URL`).

### 🎬 Mode production
- **Mode Régie live** plein écran : horloge globale, segment en cours, **timer par segment + alerte dépassement**, checklist cochable, nav Préc./Suivant
- **Téléprompteur** défilant pour le host (vitesse réglable)

### 📲 PWA
Installable sur mobile/desktop, **fonctionne hors-ligne** (service worker).

### Les agents
SHERKO (host, permanent 100%) · MADARA (régie) · JDOS · DiWiiD · DOPE · OLB · BENJAY (invité).
Chaque agent : **photo** (auto Twitch ou import), rôle, mission, pseudo Twitch, ID Discord, contacts.

---

## 🚀 Déployer sur Vercel — 5 minutes

1. **Vercel** → *Add New… → Project* → importer `madara-playground` (branche `claude/sherko-app-live-briefs-hwagfs`).
2. **Framework Preset** : « Other ».
3. *(optionnel)* **Environment Variables** :
   - `ANTHROPIC_API_KEY` — `sk-ant-…` → active le **Générateur IA** (console.anthropic.com)
   - `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET` → API Twitch **Helix** complète (viewers exacts, schedule, clips) — dev.twitch.tv/console
   - `DISCORD_WEBHOOK_URL` — webhook par défaut (sinon configurable dans l'app)
4. **Deploy** → l'URL `…vercel.app` est prête à partager.

> Sans aucune clé : l'app marche, **Twitch en mode zéro-config** (photos + live via decapi.me), Discord se configure in-app, et le générateur retombe sur un gabarit local.

## 🏃 Lancer en local

```bash
python3 -m http.server 8000
# http://localhost:8000
```

La génération IA nécessite la fonction serverless → utiliser `vercel dev` avec la clé configurée.

---

## 📁 Structure

```
.
├── index.html            # Shell SPA + fond animé + PWA
├── manifest.webmanifest  # PWA
├── sw.js                 # Service worker (offline)
├── assets/
│   ├── sherko.css        # Design system futuriste (glass · aurora · glow)
│   ├── sherko.js         # App : routeur · vues · générateur · Twitch · Discord · régie · prompteur
│   └── favicon.svg
├── api/
│   ├── generate.js       # Serverless → Claude API (conducteur JSON)
│   ├── twitch.js         # Serverless → Twitch Helix (+ fallback decapi)
│   └── discord.js        # Serverless → webhook Discord (embeds)
└── vercel.json           # Headers sécurité
```

Pas de framework · pas de build · données persistées en **localStorage**.

---

## 🎨 Identité
- **Couleurs** : nuit `#0B0B12` · violet Twitch `#9146FF` · magenta `#FF3B7B` · or `#FFC93C` · cyan `#3CE0FF` · vert live `#1FE086`
- **Typo** : Inter + Space Grotesk
- **Couleur par rôle** : SHERKO violet · BENJAY or · JDOS cyan · DiWiiD vert · MADARA magenta

## 🔜 Suite possible
- Photos des twitcheurs en dur (les remplacer dans chaque fiche agent)
- Backend partagé (Supabase) pour synchro multi-appareils
- Génération automatique du planning depuis la durée réelle des segments
- Export PNG du conducteur pour les stories
