export default {
  name: "Script Vidéo Courte Virale",
  description: "Rédige un script de vidéo courte optimisé pour Instagram Reels, TikTok ou YouTube Shorts.",
  prompt: `Rédige un script de vidéo courte pour Instagram Reels/TikTok/YouTube Shorts.
Sujet : [TON SUJET]
Contexte :
→ Plateforme : [Instagram Reels/TikTok/YouTube Shorts]
→ Durée cible : [15s/30s/60s/90s]
→ Audience : [qui]
→ Objectif : [viralité/éducation/conversion/divertissement]

Structure du script :

1. ACCROCHE (0-3 secondes) :
→ Phrase choc qui retient immédiatement
→ Pattern interrupt visuel suggéré
→ Mouvement/geste recommandé

2. DÉVELOPPEMENT (corps de la vidéo) :
→ Points clés à aborder (3-5 max)
→ Transitions suggérées entre les points
→ Éléments visuels/texte à l'écran recommandés
→ Ton et énergie à maintenir

3. CONCLUSION + CTA (dernières secondes) :
→ Résumé percutant en 1 phrase
→ Call-to-action clair (follow/like/comment/share)
→ Hook pour la prochaine vidéo (boucle de rétention)

4. ÉLÉMENTS TECHNIQUES :
→ Musique/son tendance suggéré
→ Hashtags recommandés (5-10)
→ Meilleur moment pour poster
→ Description/caption optimisée

Fournis 2 versions du script :
Version A : Style éducatif/informatif
Version B : Style storytelling/divertissant`,
  variables: [
    { key: "sujet", label: "Sujet de la vidéo", placeholder: "Ex: 5 habitudes matinales des personnes à succès" },
    { key: "plateforme", label: "Plateforme", placeholder: "Ex: TikTok" },
    { key: "duree", label: "Durée cible", placeholder: "Ex: 60s" },
    { key: "audience", label: "Audience", placeholder: "Ex: Jeunes entrepreneurs 18-30 ans" },
    { key: "objectif", label: "Objectif", placeholder: "Ex: viralité + éducation" }
  ]
};
