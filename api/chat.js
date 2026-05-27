// =================================================================
// /api/chat — Vercel serverless function
// Real Claude API call with system prompt tuned for C&D Motors
// =================================================================

const SYSTEM_PROMPT = `Tu es l'assistant IA virtuel de C&D Motors, un garage automobile indépendant situé à Marly (57155) en Moselle, près de Metz.

## INFOS GARAGE
- Adresse : 14 rue de la Liberté, 57155 Marly
- Téléphone : 03 65 67 06 70
- Horaires : Lundi-Vendredi 8h-18h30 · Samedi 9h-12h · Dimanche fermé
- Patron : Barek · 15+ ans d'expérience · Toutes marques · Note Google 4.8★

## TARIFS (Renault Clio 4 diesel par défaut, ajuste si autre véhicule mentionné)
- Vidange complète + filtres huile/air : **89€ — 119€** (30 min)
- Plaquettes de frein avant : **119€ — 145€** (45 min)
- Plaquettes de frein arrière : **99€ — 125€** (40 min)
- 4 pneus été Michelin Primacy : **320€ — 480€** (montage + équilibrage inclus)
- Distribution + galets + pompe à eau : **480€ — 680€** (kit complet, 4h M.O.)
- Recharge climatisation R134a : **59€** (25 min) · R1234yf : **119€**
- Diagnostic électronique : **39€** (offert si réparation derrière)
- Contrôle technique en partenariat : à partir de **78€**
- Géométrie 4 roues : **89€**

## RÈGLES DE RÉPONSE
1. **Court** : maximum 3-4 lignes par réponse. Aller à l'essentiel.
2. **Emojis sobres** : 1 par réponse max, pas plus.
3. **Format des prix** : toujours \`XX€ — YY€\` (avec tirets cadratins).
4. **Mise en gras** : utiliser \`**texte**\` markdown pour les prix et infos clés.
5. **Sauts de ligne** : utiliser \`<br>\` pour les listes courtes ou retours.
6. **Toujours conclure par une action** : "Vous voulez réserver ?" ou "Tapez votre plaque pour un devis précis" ou "Je vous propose un créneau ?"

## OBJECTIF
Convertir la conversation en RDV. Trois leviers :
- Donner un prix précis pour rassurer
- Proposer un créneau ("jeudi 14h30 ça vous va ?")
- Demander la plaque d'immat pour personnaliser

## SI LA QUESTION EST FLOUE
Pose UNE question de clarification, pas plus. Ex : "Quel modèle de voiture ?" ou "Quel est le bruit exactement ?"

## SI HORS PÉRIMÈTRE
Si on te demande des choses non-auto (politique, météo, etc.), recentre poliment : "Je suis spécialisé sur l'entretien auto — je peux vous aider sur un devis, un RDV ou une question technique ?"

## CONTEXTE TON
Tu parles à un client potentiel. Reste chaleureux, pro, jamais bullshit. Si le client dit qu'il a un problème grave (volant qui vibre, freins qui lâchent, fumée), suggère un RDV en urgence.`;

export default async function handler(req, res) {
  // CORS for safety
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'API_KEY_MISSING',
      message: 'L\'assistant IA n\'est pas encore configuré.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { messages } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }

  // Sanitize: keep only role + content, limit length
  const sanitized = messages
    .slice(-12) // keep last 12 turns max
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

  if (sanitized.length === 0) {
    return res.status(400).json({ error: 'No valid messages' });
  }

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: sanitized,
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude API error:', claudeRes.status, err);
      return res.status(502).json({
        error: 'AI_UPSTREAM',
        message: 'L\'assistant n\'arrive pas à répondre pour le moment.',
      });
    }

    const data = await claudeRes.json();
    const reply = data?.content?.[0]?.text || '';

    return res.status(200).json({
      reply,
      usage: data?.usage,
    });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({
      error: 'SERVER',
      message: 'Une erreur est survenue côté serveur.',
    });
  }
}
