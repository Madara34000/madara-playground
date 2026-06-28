// =================================================================
// /api/discord — Vercel serverless function
// Intégration Discord via WEBHOOK (aucun bot à héberger).
// L'app envoie ici { webhook, type, payload } -> on poste un embed riche.
//
// types: "announce" (annonce de live) · "golive" · "conductor" · "planning"
//        · "invite" · "test"
// Le webhook peut venir de l'env DISCORD_WEBHOOK_URL ou du body (configuré in-app).
// =================================================================

const PURPLE = 0x9146ff;
const MAGENTA = 0xff3b7b;
const GREEN = 0x1fe086;
const GOLD = 0xffc93c;

function clamp(s, n) { return String(s == null ? '' : s).slice(0, n); }

function buildEmbeds(type, p = {}) {
  switch (type) {
    case 'test':
      return [{
        title: '✅ SHERKO LIVE × Discord connecté',
        description: 'Le studio est bien rattaché à ce salon. Tu recevras ici les annonces de lives, le conducteur et les alertes go-live.',
        color: GREEN,
        footer: { text: 'SHERKO LIVE · Studio de production' },
      }];

    case 'golive':
      return [{
        title: `🔴 ON EST EN LIVE — ${clamp(p.title, 240)}`,
        url: p.channelUrl || undefined,
        description: clamp(p.subtitle || `Rejoins le live maintenant ${p.channelUrl || ''}`, 1000),
        color: MAGENTA,
        fields: [
          p.guest ? { name: '🎙️ Invité', value: clamp(p.guest, 200), inline: true } : null,
          p.viewers != null ? { name: '👁️ Viewers', value: String(p.viewers), inline: true } : null,
        ].filter(Boolean),
        footer: { text: 'SHERKO LIVE — en direct sur Twitch' },
      }];

    case 'announce':
      return [{
        title: `🎬 ${clamp(p.title, 240)}`,
        description: clamp(p.subtitle || `Nouveau live SHERKO LIVE avec ${p.guest || 'un invité'} !`, 1200),
        color: PURPLE,
        fields: [
          p.dateText ? { name: '📅 Date', value: clamp(p.dateText, 200), inline: true } : null,
          p.liveTime ? { name: '🕐 Live', value: clamp(p.liveTime, 60), inline: true } : null,
          p.location ? { name: '📍 Lieu', value: clamp(p.location, 200), inline: false } : null,
          p.cast ? { name: '🎭 Casting', value: clamp(p.cast, 800), inline: false } : null,
          p.channelUrl ? { name: '📺 Chaîne', value: clamp(p.channelUrl, 200), inline: false } : null,
        ].filter(Boolean),
        footer: { text: 'SHERKO LIVE · Studio' },
      }];

    case 'conductor': {
      const segs = Array.isArray(p.segments) ? p.segments.slice(0, 12) : [];
      return [{
        title: `📋 Conducteur — ${clamp(p.title, 220)}`,
        description: clamp(`${p.dateText || ''}${p.location ? ' · ' + p.location : ''}`, 500),
        color: GOLD,
        fields: segs.map(s => ({
          name: clamp(`${s.num}. ${s.label} ${s.time ? '(' + s.time + ')' : ''}`, 250),
          value: clamp((s.lines || []).map(x => '• ' + x).join('\n') || '—', 1020),
          inline: false,
        })),
        footer: { text: 'SHERKO LIVE · Conducteur officiel' },
      }];
    }

    case 'planning': {
      const items = Array.isArray(p.items) ? p.items.slice(0, 20) : [];
      return [{
        title: `🗓️ Planning — ${clamp(p.title, 220)}`,
        color: PURPLE,
        description: clamp(items.map(i => `\`${i.time}\` **${i.title}**${i.desc ? ' — ' + i.desc : ''}`).join('\n') || '—', 3500),
        footer: { text: 'SHERKO LIVE · Roulement' },
      }];
    }

    case 'invite':
      return [{
        title: `✉️ Invitation — ${clamp(p.liveTitle || 'SHERKO LIVE', 220)}`,
        description: clamp(p.message, 1500),
        color: GREEN,
        fields: [
          p.dateText ? { name: '📅', value: clamp(p.dateText, 120), inline: true } : null,
          p.role ? { name: '🎙️ Rôle', value: clamp(p.role, 120), inline: true } : null,
        ].filter(Boolean),
        footer: { text: 'Réagis ✅ pour confirmer ta présence' },
      }];

    default:
      return [{ title: 'SHERKO LIVE', description: clamp(p.text || '', 1500), color: PURPLE }];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const webhook = String(body?.webhook || process.env.DISCORD_WEBHOOK_URL || '').trim();
  if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(webhook)) {
    return res.status(400).json({ error: 'INVALID_WEBHOOK', message: 'URL de webhook Discord invalide.' });
  }
  const type = String(body?.type || 'test');
  const p = body?.payload || {};

  const content = body?.content ? clamp(body.content, 1800) : undefined; // for @mentions
  const message = {
    username: 'SHERKO LIVE',
    content,
    embeds: buildEmbeds(type, p),
    allowed_mentions: { parse: ['users', 'roles', 'everyone'] },
  };

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!r.ok && r.status !== 204) {
      const t = await r.text();
      return res.status(502).json({ error: 'DISCORD_UPSTREAM', status: r.status, detail: clamp(t, 400) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'SERVER', detail: String(e && e.message || e) });
  }
}
