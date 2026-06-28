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
| **Lives** | Tableau de bord des lives · statut · compte à rebours · prochain live en avant |
| **Conducteur** | Brief complet par segments (façon PDF) · **édition inline** · ajout/suppression de segments · **export PDF** · copier en texte |
| **Planning** | Timeline chronométrée : arrivée crew → arrivée invité → live → segments minutés → clap de fin |
| **Casting** | Liste des agents du live · **toggle Activer/au repos** · **bouton Inviter** (WhatsApp / Email / copier) |
| **Équipe** | Roster permanent des twitcheurs · photos · contacts · activer/inviter |
| **Générateur IA** | Décris l'invité + l'angle → **Claude** propose questions d'interview & segments. Fallback gabarit local sans clé API. |

### Les agents
SHERKO (host) · BENJAY (invité) · JDOS · DiWiiD · MADARA (régie) · DOPE · OLB.
Chaque agent a une **photo** (importée depuis l'appareil ou via URL), un rôle, une mission et des contacts.

---

## 🚀 Déployer sur Vercel — 5 minutes

1. **Vercel** → *Add New… → Project* → importer `madara-playground` (branche `claude/sherko-app-live-briefs-hwagfs`).
2. **Framework Preset** : « Other ».
3. *(optionnel, pour le Générateur IA)* **Environment Variables** :
   - Name : `ANTHROPIC_API_KEY`
   - Value : `sk-ant-...` (console.anthropic.com → API Keys)
4. **Deploy** → l'URL `…vercel.app` est prête à partager.

> Sans clé API, tout marche **sauf** la génération IA, qui retombe sur un gabarit local.

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
├── index.html            # Shell SPA
├── assets/
│   ├── sherko.css        # Design system studio/streamer
│   ├── sherko.js         # App : routeur · vues · générateur · invites · persistance
│   └── favicon.svg
├── api/
│   └── generate.js       # Serverless Vercel → Claude API (conducteur JSON)
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
