import Anthropic from "@anthropic-ai/sdk";

const botsPrompts: Record<string, string> = {
  "strategie-social-media": `Agis comme social media manager expert gérant des comptes de marques majeures et créateurs influents.

Analyse mon business complet :
→ Business/Offre : {business}
→ Niche : {niche}
→ Audience cible : {audience}
→ Concurrents : {concurrents}
→ Objectifs : {objectifs}

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

  "piliers-contenu": `Crée 5 piliers de contenu solides pour ma marque social media.
Ma niche : {niche}
Mon expertise : {expertise}
Mon audience : {audience}

Pour chaque pilier, fournis :

PILIER 1 : [Nom du pilier]
Objectif : [Éduquer/Divertir/Inspirer/Convertir]
10 idées de posts :
→ Idée 1 : [Titre + angle]
→ Idée 2 : [...]
→ [...]
Formats recommandés : [Carrousel/Reel/Thread/Story/etc.]
Fréquence suggérée : [X fois/semaine]

[Répète pour piliers 2-5]

Répartition équilibrée :
→ 40% Éducation (valeur)
→ 30% Inspiration (motivation)
→ 20% Divertissement (connexion)
→ 10% Promotion (offres)

Assure cohérence et variété.`,

  "calendrier-30-jours": `Crée un calendrier de contenu social media 30 jours pour ma niche.
Ma niche : {niche}
Plateformes : {plateformes}
Fréquence cible : {frequence}

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

  "createur-posts": `Crée un post social media ultra-engageant sur ce sujet : {sujet}
Contexte :
→ Plateforme : {plateforme}
→ Audience : {audience}
→ Objectif : {objectif}

Structure le post selon cette formule :

1. HOOK (arrête le scroll) :
→ Première ligne choc/curiosité/contrarian
→ Utilise pattern interrupt
→ Max 10-15 mots

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

  "script-video": `Rédige un script de vidéo courte pour Instagram Reels/TikTok/YouTube Shorts.
Sujet : {sujet}
Contexte :
→ Plateforme : {plateforme}
→ Durée cible : {duree}
→ Audience : {audience}
→ Objectif : {objectif}

Structure du script :

1. ACCROCHE (0-3 secondes) :
→ Phrase choc qui retient immédiatement
→ Pattern interrupt visuel suggéré
→ Mouvement/geste recommandé

2. DÉVELOPPEMENT (corps de la vidéo) :
→ Points clés à aborder (3-5 max)
→ Transitions suggérées
→ Éléments visuels/texte à l'écran
→ Ton et énergie à maintenir

3. CONCLUSION + CTA (dernières secondes) :
→ Résumé percutant en 1 phrase
→ Call-to-action clair
→ Hook pour la prochaine vidéo

4. ÉLÉMENTS TECHNIQUES :
→ Musique/son tendance suggéré
→ Hashtags recommandés (5-10)
→ Meilleur moment pour poster
→ Description/caption optimisée

Fournis 2 versions :
Version A : Style éducatif/informatif
Version B : Style storytelling/divertissant`,
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { botId, inputs } = body;

  if (!botId || !inputs) {
    throw createError({ statusCode: 400, message: "Missing botId or inputs" });
  }

  const promptTemplate = botsPrompts[botId];
  if (!promptTemplate) {
    throw createError({ statusCode: 404, message: "Bot not found" });
  }

  // Fill in the prompt template with user inputs
  let prompt = promptTemplate;
  for (const [key, value] of Object.entries(inputs)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value as string);
  }

  const client = new Anthropic({
    apiKey: config.anthropicApiKey,
  });

  // Set up SSE headers
  setResponseHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const writable = event.node.res;

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      writable.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
    }
  }

  writable.write("data: [DONE]\n\n");
  writable.end();
});
