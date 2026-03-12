export default {
  name: "Calendrier de Contenu 30 Jours",
  description: "Génère un calendrier de contenu social media complet sur 30 jours, prêt à exécuter.",
  prompt: `Crée un calendrier de contenu social media 30 jours pour ma niche.
Ma niche : [précise]
Plateformes : [Instagram/LinkedIn/Twitter/TikTok/etc.]
Fréquence cible : [X posts/semaine]

Pour chaque jour, fournis :

JOUR 1 :
→ Idée de post : [Titre/sujet précis]
→ Format recommandé : [Carrousel/Reel/Thread/Image+caption/etc.]
→ Pilier de contenu : [Quel pilier]
→ Objectif : [Notoriété/Engagement/Génération leads/Conversion]
→ Hook suggéré : [Première ligne accrocheuse]

[Répète pour 30 jours]

Répartition stratégique :
→ Semaine 1 : Notoriété et découverte
→ Semaine 2 : Engagement et interaction
→ Semaine 3 : Valeur et éducation
→ Semaine 4 : Conversion et appel à l'action

Événements/Tendances à intégrer :
→ [Journées internationales pertinentes]
→ [Tendances saisonnières]

Fournis calendrier complet prêt à exécuter.`,
  variables: [
    { key: "niche", label: "Niche", placeholder: "Ex: Fitness et nutrition pour femmes actives" },
    { key: "plateformes", label: "Plateformes", placeholder: "Ex: Instagram, TikTok" },
    { key: "frequence", label: "Fréquence cible", placeholder: "Ex: 5 posts/semaine" }
  ]
};
