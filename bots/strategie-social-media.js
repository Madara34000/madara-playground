export default {
  name: "Architecte de Stratégie Social Media",
  description: "Analyse ton business et construit une stratégie social media complète et actionnable.",
  prompt: `Agis comme social media manager expert gérant des comptes de marques majeures et créateurs influents.

Analyse mon business complet :
→ Business/Offre : [décris]
→ Niche : [précise]
→ Audience cible : [démographie + psychographie]
→ Concurrents : [liste 3-5]
→ Objectifs : [notoriété/engagement/ventes/communauté]

Construis une stratégie social media claire incluant :

1. Positionnement :
→ Angle unique vs concurrents
→ Ton de voix et personnalité de marque
→ Promesse de valeur pour l'audience

2. Thèmes de contenu principaux :
→ 5-7 thèmes récurrents alignés avec objectifs
→ % de répartition recommandé par thème

3. Opportunités de croissance :
→ Plateformes prioritaires (et pourquoi)
→ Formats à privilégier
→ Collaborations potentielles
→ Tactiques de croissance rapide

4. KPIs à tracker :
→ Métriques essentielles par objectif
→ Benchmarks réalistes

Fournis stratégie actionnable et prête à exécuter.`,
  variables: [
    { key: "business", label: "Business/Offre", placeholder: "Ex: Agence de marketing digital spécialisée en e-commerce" },
    { key: "niche", label: "Niche", placeholder: "Ex: E-commerce mode féminine" },
    { key: "audience", label: "Audience cible", placeholder: "Ex: Femmes 25-40 ans, urbaines, CSP+, passionnées de mode éthique" },
    { key: "concurrents", label: "Concurrents (3-5)", placeholder: "Ex: Sézane, Rouje, Balzac Paris, Asphalte" },
    { key: "objectifs", label: "Objectifs", placeholder: "Ex: notoriété + engagement + ventes" }
  ]
};
