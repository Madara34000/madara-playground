# C&D Motors · Le Centre Auto · V1 démo

Prototype interactif du nouveau site **le-centre-auto.fr** pour démo client.

## 🚀 Lancer la démo

### Option 1 — Local (5 secondes)
```bash
python3 -m http.server 8000
# Puis ouvrir http://localhost:8000
```

### Option 2 — Déployer en ligne (gratuit, 1 minute)
1. Aller sur https://vercel.com (compte gratuit avec GitHub)
2. Import du repo → Deploy
3. URL publique disponible immédiatement

Alternative : https://app.netlify.com/drop → drag-drop du dossier.

## 📁 Structure

```
.
├── index.html           # SPA shell + 5 vues
└── assets/
    ├── style.css        # Design system + composants
    ├── app.js           # Router + animations + chat IA
    └── favicon.svg
```

Aucune dépendance · aucun build · pure HTML/CSS/JS.

## ✨ Ce que la démo montre

1. **Accueil** — hero avec scan plaque + IA, services grid, avis Google, infos pratiques
2. **Devis IA** — flow complet avec loading orbe animé puis résultat avec count-up des prix
3. **Chat IA** — assistant conversationnel qui répond aux tarifs, RDV, horaires, diagnostic
4. **Prise de RDV** — calendrier + sélection créneau + récap + confirmation
5. **Espace client** — dashboard véhicule + alerte maintenance prédictive + historique

## 🎨 Identité

- **Couleurs** : bleu nuit `#0A0E1A` · jaune `#FFCC00` · orange `#FF6B35` · teal `#4ECDC4`
- **Typo** : Inter (Google Fonts)
- **Animations** : courbes spring `cubic-bezier(0.34, 1.56, 0.64, 1)` (framer-style)
- **Mobile-first** · Phone frame sur desktop (≥1024px)

## 📱 Recommandation démo

Pour Barek, **ouvrir l'URL sur un téléphone** pour la vraie expérience. Sur desktop, l'app s'affiche dans une frame iPhone à droite, avec le pitch à gauche.

## 🔜 Prochaines étapes (post-démo)

- Brancher la vraie API SIV / HistoVec pour reconnaissance plaque
- Connecter l'API Claude pour le vrai chatbot
- Backend Supabase pour les comptes clients
- Déploiement Next.js + Vercel pour la prod
