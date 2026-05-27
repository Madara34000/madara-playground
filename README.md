# C&D Motors · Le Centre Auto · V1 démo

Prototype interactif du nouveau site **le-centre-auto.fr** pour démo client (Barek).
Inclut une vraie IA conversationnelle branchée sur **Claude API**.

---

## 🚀 Déployer sur Vercel — 5 minutes

### Étape 1 · Récupérer une clé Anthropic API
1. Aller sur https://console.anthropic.com
2. Se connecter (le compte qui sert déjà pour Claude Code)
3. Menu → **API Keys** → **Create Key**
4. Copier la clé `sk-ant-...`

> 💡 La démo utilise `claude-haiku-4-5` (modèle ~10× moins cher). Coût estimé : **<1€ pour 1 000 conversations**.

### Étape 2 · Déployer sur Vercel
1. Aller sur https://vercel.com → **Add New… → Project**
2. **Import Git Repository** : sélectionner `madara-playground`
3. **Framework Preset** : « Other » (ne pas changer)
4. Ouvrir **Environment Variables** :
   - Name : `ANTHROPIC_API_KEY`
   - Value : `sk-ant-...` (collée à l'étape 1)
5. **Deploy** → attendre 30 secondes

### Étape 3 · Partager
Vercel donne une URL type `le-centre-auto-v1-xxxxx.vercel.app` → à envoyer à Barek par WhatsApp ou SMS.

---

## 🏃 Lancer en local

```bash
# Servir les fichiers statiques
python3 -m http.server 8000
# Ouvrir http://localhost:8000
```

⚠️ **En local, le chat IA fonctionne en mode fallback** (réponses scriptées) — la vraie API Claude ne marche qu'une fois déployée sur Vercel avec la clé configurée.

Pour tester la vraie IA en local : utiliser `vercel dev` après avoir installé Vercel CLI (`npm i -g vercel`).

---

## 📁 Structure

```
.
├── index.html              # SPA shell + 5 vues
├── assets/
│   ├── style.css           # Design system complet (41 Ko)
│   ├── app.js              # Router · animations · chat client (19 Ko)
│   └── favicon.svg
├── api/
│   └── chat.js             # Serverless Vercel → Claude API
├── vercel.json             # Config headers sécurité
└── package.json            # Métadonnées projet
```

Pas de framework · pas de build · pas de bundler.

---

## ✨ Ce que la démo montre

| Vue | Fonctionnalité |
|---|---|
| **Accueil** | Hero animé · scan plaque · 6 services rapides · avis Google · infos pratiques |
| **Devis IA** | Loading orbe 4 étapes · count-up des prix · breakdown détaillé · 5 prestations switchables |
| **Chat IA** | **Vrai Claude API** entraîné sur le garage · tarifs · horaires · RDV · CTA dynamiques |
| **RDV** | Calendrier interactif · créneaux · récap · toast confirmation SMS |
| **Compte** | Dashboard véhicule · alerte maintenance prédictive · historique passages |

## 🎨 Identité visuelle

- **Couleurs** : `#0A0E1A` bleu nuit · `#FFCC00` jaune · `#FF6B35` orange · `#4ECDC4` teal
- **Typo** : Inter (Google Fonts)
- **Animations** : courbes spring `cubic-bezier(0.34, 1.56, 0.64, 1)` (style Framer Motion)
- **Mobile-first** · Phone frame sur desktop ≥ 1024px

## 🤖 Le chatbot

- **Modèle** : Claude Haiku 4.5 (rapide + économique)
- **Connaissance** : tarifs précis, horaires, adresse, infos garage — injectés dans le system prompt
- **Mémoire conversationnelle** : 12 derniers messages conservés
- **Détection de prix** : extrait automatiquement les fourchettes `XX€ — YY€` de la réponse pour afficher un quote-card cliquable vers le RDV
- **Fallback gracieux** : si l'API n'est pas configurée, retombe sur des réponses scriptées

## 🔜 Prochaines étapes (post-démo)

- Brancher l'API SIV / HistoVec pour vraie reconnaissance de plaque
- RAG sur base de données interne (historique clients réels)
- Connecteur Google Calendar pour synchroniser les RDV en temps réel
- Espace client : auth Supabase + carnet d'entretien persistant
- Migrer vers Next.js 15 + React Server Components pour la prod
