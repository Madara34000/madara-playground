export default {
  name: "Créateur de Posts qui Arrêtent le Scroll",
  description: "Crée des posts social media ultra-engageants avec hook, corps et call-to-action optimisés.",
  prompt: `Crée un post social media ultra-engageant sur ce sujet : [TON SUJET]
Contexte :
→ Plateforme : [Instagram/LinkedIn/Twitter/etc.]
→ Audience : [qui]
→ Objectif : [engagement/partages/commentaires/clics]

Structure le post selon cette formule :

1. HOOK (arrête le scroll) :
→ Première ligne choc/curiosité/contrarian
→ Utilise pattern interrupt
→ Max 10-15 mots
Exemples de hooks :
•Statistique choquante
•Question provocante
•Affirmation contre-intuitive
•Confession personnelle

2. CORPS (délivre valeur claire) :
→ Langage simple et accessible
→ 3-5 points clairs
→ Exemples concrets ou storytelling
→ Rythme varié (phrases courtes + moyennes)

3. CALL-TO-ACTION (encourage interaction) :
→ Question qui génère commentaires
→ Invitation au partage
→ Demande d'avis/expérience

Fournis 3 variations du post avec hooks différents.
Classe-les par potentiel d'engagement (/10).`,
  variables: [
    { key: "sujet", label: "Sujet du post", placeholder: "Ex: Les erreurs qui tuent ta productivité" },
    { key: "plateforme", label: "Plateforme", placeholder: "Ex: Instagram" },
    { key: "audience", label: "Audience", placeholder: "Ex: Entrepreneurs et freelances 25-35 ans" },
    { key: "objectif", label: "Objectif", placeholder: "Ex: engagement + commentaires" }
  ]
};
