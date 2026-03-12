export default {
  name: "Constructeur de Piliers de Contenu",
  description: "Crée 5 piliers de contenu solides pour ta marque social media avec des idées de posts concrètes.",
  prompt: `Crée 5 piliers de contenu solides pour ma marque social media.
Ma niche : [précise]
Mon expertise : [ce que je maîtrise]
Mon audience : [qui je cible]

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
    { key: "niche", label: "Niche", placeholder: "Ex: Développement personnel pour entrepreneurs" },
    { key: "expertise", label: "Expertise", placeholder: "Ex: Coaching mindset, productivité, leadership" },
    { key: "audience", label: "Audience", placeholder: "Ex: Entrepreneurs 25-45 ans cherchant à scaler leur business" }
  ]
};
