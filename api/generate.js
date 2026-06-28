// =================================================================
// /api/generate — Vercel serverless function
// Génère un conducteur SHERKO LIVE à partir d'un brief via Claude API.
// Renvoie { segments: [...] } strictement formaté. Fallback côté client.
// =================================================================

const SYSTEM_PROMPT = `Tu es le directeur d'écriture de "SHERKO LIVE", un talk show Twitch musical animé par SHERKO.

Format d'un live (gabarit officiel) :
- Ambiance studio, interaction permanente avec le chat Twitch.
- Rôles récurrents : SHERKO (host, relances, questions), MADARA (régie générale : OBS, scènes, jingles, audio, transitions, zéro bug). Invité principal = la star du live. Parfois des chroniqueurs.
- Structure type : 1) Introduction + arrivée de l'invité  2) Interview approfondie  3) Chronique / second sujet  4) React sons du chat + clap de fin.

Ta mission : à partir du brief, produire un conducteur complet et tournable.

RÈGLES :
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans markdown.
- Schéma EXACT :
  { "segments": [ { "num": 1, "label": "…", "dur": 20,
      "blocks": [ { "role": "SHERKO"|"MADARA"|"GUEST"|<NOM_ROLE>, "title": "…", "items": ["…","…"] } ] } ] }
- 3 à 4 segments. "dur" = durée en minutes (nombre).
- Les questions d'interview vont dans un block role "GUEST" (titre "Interview …"), formulées en français parlé, tutoiement, comme SHERKO parlerait.
- Toujours inclure au moins un block "MADARA" (cues régie) et un block "SHERKO" (relances/transitions).
- Questions précises et incarnées à partir de l'angle fourni. Pas de questions génériques creuses.
- 4 à 8 items par block.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'API_KEY_MISSING' });

  let brief;
  try { brief = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const guest = String(brief?.guest || '').slice(0, 120);
  if (!guest) return res.status(400).json({ error: 'guest required' });
  const angle = String(brief?.angle || '').slice(0, 1200);
  const title = String(brief?.title || '').slice(0, 160);

  const userMsg = `Brief du live :
- Titre : ${title || 'SHERKO LIVE × ' + guest}
- Invité principal : ${guest}
- Angle et sujets à creuser : ${angle || '(libre — parcours, inspirations, process, actualité, projets)'}

Génère le conducteur JSON complet.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!r.ok) {
      console.error('Claude API error', r.status, await r.text());
      return res.status(502).json({ error: 'AI_UPSTREAM' });
    }

    const data = await r.json();
    let text = data?.content?.[0]?.text || '';
    // Extract JSON object even if wrapped
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) text = text.slice(start, end + 1);

    let parsed;
    try { parsed = JSON.parse(text); } catch { return res.status(502).json({ error: 'AI_PARSE' }); }

    if (!parsed || !Array.isArray(parsed.segments)) return res.status(502).json({ error: 'AI_SHAPE' });

    // sanitize
    const segments = parsed.segments.slice(0, 6).map((s, i) => ({
      num: Number(s.num) || i + 1,
      label: String(s.label || `Segment ${i + 1}`).slice(0, 160),
      dur: Math.min(120, Math.max(2, Number(s.dur) || 20)),
      blocks: (Array.isArray(s.blocks) ? s.blocks : []).slice(0, 8).map(b => ({
        role: String(b.role || 'SHERKO').slice(0, 24),
        title: String(b.title || '').slice(0, 120),
        items: (Array.isArray(b.items) ? b.items : []).slice(0, 12).map(x => String(x).slice(0, 400)),
      })),
    }));

    return res.status(200).json({ segments, usage: data?.usage });
  } catch (e) {
    console.error('Server error', e);
    return res.status(500).json({ error: 'SERVER' });
  }
}
