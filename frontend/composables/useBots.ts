export interface BotVariable {
  key: string;
  label: string;
  labelEn: string;
  placeholder: string;
  placeholderEn: string;
}

export interface Bot {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: "text" | "creative";
  type: "social-media" | "video" | "image" | "design";
  icon: string;
  color: string;
  badgeClass: string;
  prompt: string;
  variables: BotVariable[];
  apiProvider?: "anthropic" | "higgsfield" | "banana" | "google";
}

const bots: Bot[] = [
  {
    id: "strategie-social-media",
    name: "Architecte de Stratégie Social Media",
    nameEn: "Social Media Strategy Architect",
    description: "Analyse ton business et construit une stratégie social media complète et actionnable.",
    descriptionEn: "Analyze your business and build a complete, actionable social media strategy.",
    category: "text",
    type: "social-media",
    icon: "📊",
    color: "blue",
    badgeClass: "badge-blue",
    apiProvider: "anthropic",
    prompt: `Agis comme social media manager expert gérant des comptes de marques majeures et créateurs influents.

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
    variables: [
      { key: "business", label: "Business/Offre", labelEn: "Business/Offer", placeholder: "Ex: Agence de marketing digital spécialisée en e-commerce", placeholderEn: "E.g.: Digital marketing agency specialized in e-commerce" },
      { key: "niche", label: "Niche", labelEn: "Niche", placeholder: "Ex: E-commerce mode féminine", placeholderEn: "E.g.: Women's fashion e-commerce" },
      { key: "audience", label: "Audience cible", labelEn: "Target audience", placeholder: "Ex: Femmes 25-40 ans, urbaines, CSP+", placeholderEn: "E.g.: Women 25-40, urban, high income" },
      { key: "concurrents", label: "Concurrents (3-5)", labelEn: "Competitors (3-5)", placeholder: "Ex: Sézane, Rouje, Balzac Paris", placeholderEn: "E.g.: Sézane, Rouje, Balzac Paris" },
      { key: "objectifs", label: "Objectifs", labelEn: "Goals", placeholder: "Ex: notoriété + engagement + ventes", placeholderEn: "E.g.: awareness + engagement + sales" },
    ],
  },
  {
    id: "piliers-contenu",
    name: "Constructeur de Piliers de Contenu",
    nameEn: "Content Pillars Builder",
    description: "Crée 5 piliers de contenu solides avec 10 idées par pilier.",
    descriptionEn: "Create 5 solid content pillars with 10 ideas per pillar.",
    category: "text",
    type: "social-media",
    icon: "🏛️",
    color: "green",
    badgeClass: "badge-green",
    apiProvider: "anthropic",
    prompt: `Crée 5 piliers de contenu solides pour ma marque social media.
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
    variables: [
      { key: "niche", label: "Niche", labelEn: "Niche", placeholder: "Ex: Développement personnel pour entrepreneurs", placeholderEn: "E.g.: Personal development for entrepreneurs" },
      { key: "expertise", label: "Expertise", labelEn: "Expertise", placeholder: "Ex: Coaching mindset, productivité, leadership", placeholderEn: "E.g.: Mindset coaching, productivity, leadership" },
      { key: "audience", label: "Audience", labelEn: "Audience", placeholder: "Ex: Entrepreneurs 25-45 ans", placeholderEn: "E.g.: Entrepreneurs aged 25-45" },
    ],
  },
  {
    id: "calendrier-30-jours",
    name: "Calendrier de Contenu 30 Jours",
    nameEn: "30-Day Content Calendar",
    description: "Génère un calendrier de contenu sur 30 jours, prêt à exécuter.",
    descriptionEn: "Generate a 30-day content calendar, ready to execute.",
    category: "text",
    type: "social-media",
    icon: "📅",
    color: "purple",
    badgeClass: "badge-purple",
    apiProvider: "anthropic",
    prompt: `Crée un calendrier de contenu social media 30 jours pour ma niche.
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
    variables: [
      { key: "niche", label: "Niche", labelEn: "Niche", placeholder: "Ex: Fitness et nutrition", placeholderEn: "E.g.: Fitness and nutrition" },
      { key: "plateformes", label: "Plateformes", labelEn: "Platforms", placeholder: "Ex: Instagram, TikTok", placeholderEn: "E.g.: Instagram, TikTok" },
      { key: "frequence", label: "Fréquence cible", labelEn: "Target frequency", placeholder: "Ex: 5 posts/semaine", placeholderEn: "E.g.: 5 posts/week" },
    ],
  },
  {
    id: "createur-posts",
    name: "Créateur de Posts qui Arrêtent le Scroll",
    nameEn: "Scroll-Stopping Post Creator",
    description: "Crée des posts ultra-engageants avec hook, corps et CTA optimisés.",
    descriptionEn: "Create ultra-engaging posts with optimized hook, body and CTA.",
    category: "text",
    type: "social-media",
    icon: "🛑",
    color: "orange",
    badgeClass: "badge-orange",
    apiProvider: "anthropic",
    prompt: `Crée un post social media ultra-engageant sur ce sujet : {sujet}
Contexte :
→ Plateforme : {plateforme}
→ Audience : {audience}
→ Objectif : {objectif}

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
      { key: "sujet", label: "Sujet du post", labelEn: "Post topic", placeholder: "Ex: Les erreurs qui tuent ta productivité", placeholderEn: "E.g.: Mistakes that kill your productivity" },
      { key: "plateforme", label: "Plateforme", labelEn: "Platform", placeholder: "Ex: Instagram", placeholderEn: "E.g.: Instagram" },
      { key: "audience", label: "Audience", labelEn: "Audience", placeholder: "Ex: Entrepreneurs et freelances 25-35 ans", placeholderEn: "E.g.: Entrepreneurs and freelancers aged 25-35" },
      { key: "objectif", label: "Objectif", labelEn: "Goal", placeholder: "Ex: engagement + commentaires", placeholderEn: "E.g.: engagement + comments" },
    ],
  },
  {
    id: "script-video",
    name: "Script Vidéo Courte Virale",
    nameEn: "Viral Short Video Script",
    description: "Rédige des scripts optimisés pour Reels, TikTok et YouTube Shorts.",
    descriptionEn: "Write optimized scripts for Reels, TikTok and YouTube Shorts.",
    category: "text",
    type: "video",
    icon: "🎬",
    color: "pink",
    badgeClass: "badge-pink",
    apiProvider: "anthropic",
    prompt: `Rédige un script de vidéo courte pour Instagram Reels/TikTok/YouTube Shorts.
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
      { key: "sujet", label: "Sujet", labelEn: "Topic", placeholder: "Ex: 5 habitudes matinales des personnes à succès", placeholderEn: "E.g.: 5 morning habits of successful people" },
      { key: "plateforme", label: "Plateforme", labelEn: "Platform", placeholder: "Ex: TikTok", placeholderEn: "E.g.: TikTok" },
      { key: "duree", label: "Durée cible", labelEn: "Target duration", placeholder: "Ex: 60s", placeholderEn: "E.g.: 60s" },
      { key: "audience", label: "Audience", labelEn: "Audience", placeholder: "Ex: Jeunes entrepreneurs 18-30 ans", placeholderEn: "E.g.: Young entrepreneurs aged 18-30" },
      { key: "objectif", label: "Objectif", labelEn: "Goal", placeholder: "Ex: viralité + éducation", placeholderEn: "E.g.: virality + education" },
    ],
  },
  {
    id: "generateur-video",
    name: "Générateur de Vidéo IA",
    nameEn: "AI Video Generator",
    description: "Génère des vidéos courtes via Higgsfield AI à partir d'un prompt.",
    descriptionEn: "Generate short videos via Higgsfield AI from a prompt.",
    category: "creative",
    type: "video",
    icon: "🎥",
    color: "purple",
    badgeClass: "badge-purple",
    apiProvider: "higgsfield",
    prompt: "",
    variables: [
      { key: "prompt", label: "Description de la vidéo", labelEn: "Video description", placeholder: "Ex: Un entrepreneur qui travaille dans un café moderne, cinématique", placeholderEn: "E.g.: An entrepreneur working in a modern café, cinematic" },
      { key: "style", label: "Style", labelEn: "Style", placeholder: "Ex: cinématique, professionnel, dynamique", placeholderEn: "E.g.: cinematic, professional, dynamic" },
      { key: "duree", label: "Durée", labelEn: "Duration", placeholder: "Ex: 5s", placeholderEn: "E.g.: 5s" },
    ],
  },
  {
    id: "generateur-image",
    name: "Générateur d'Image IA",
    nameEn: "AI Image Generator",
    description: "Crée des visuels et photos via Google Gemini pour tes posts et stories.",
    descriptionEn: "Create visuals and photos via Google Gemini for your posts and stories.",
    category: "creative",
    type: "image",
    icon: "🖼️",
    color: "green",
    badgeClass: "badge-green",
    apiProvider: "google",
    prompt: "",
    variables: [
      { key: "prompt", label: "Description de l'image", labelEn: "Image description", placeholder: "Ex: Flat lay minimaliste d'un bureau avec laptop et café", placeholderEn: "E.g.: Minimalist flat lay of a desk with laptop and coffee" },
      { key: "style", label: "Style visuel", labelEn: "Visual style", placeholder: "Ex: minimaliste, coloré, photographique", placeholderEn: "E.g.: minimalist, colorful, photographic" },
      { key: "format", label: "Format", labelEn: "Format", placeholder: "Ex: 1080x1080 (post), 1080x1920 (story)", placeholderEn: "E.g.: 1080x1080 (post), 1080x1920 (story)" },
    ],
  },
  {
    id: "graphiste-ia",
    name: "Graphiste IA",
    nameEn: "AI Graphic Designer",
    description: "Crée des designs (carrousels, covers, bannières) via Google Gemini.",
    descriptionEn: "Create designs (carousels, covers, banners) via Google Gemini.",
    category: "creative",
    type: "design",
    icon: "🎨",
    color: "orange",
    badgeClass: "badge-orange",
    apiProvider: "google",
    prompt: "",
    variables: [
      { key: "prompt", label: "Description du design", labelEn: "Design description", placeholder: "Ex: Couverture de carrousel sur les 5 erreurs marketing", placeholderEn: "E.g.: Carousel cover about 5 marketing mistakes" },
      { key: "type", label: "Type de design", labelEn: "Design type", placeholder: "Ex: carrousel, bannière, story, couverture", placeholderEn: "E.g.: carousel, banner, story, cover" },
      { key: "couleurs", label: "Couleurs", labelEn: "Colors", placeholder: "Ex: noir, blanc, touches dorées", placeholderEn: "E.g.: black, white, gold accents" },
    ],
  },
];

export function useBots() {
  const textBots = computed(() => bots.filter((b) => b.category === "text"));
  const creativeBots = computed(() => bots.filter((b) => b.category === "creative"));

  function getBotById(id: string): Bot | undefined {
    return bots.find((b) => b.id === id);
  }

  return {
    bots,
    textBots,
    creativeBots,
    getBotById,
  };
}
