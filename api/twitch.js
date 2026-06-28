// =================================================================
// /api/twitch — Vercel serverless function
// "Vraie utilisation" de l'API Twitch.
//   • Avec TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET  -> API Helix officielle
//     (users, streams live + viewers, followers, channel schedule, clips)
//   • Sans clés -> fallback ZÉRO CONFIG via decapi.me (avatar, live, game, followers)
//
// POST { logins: ["sherko27", ...], want?: ["status"|"schedule"|"clips"], channel?: "sherko27" }
// -> { source, users: { login: {display_name, avatar, live, viewers, title, game, followers} },
//      schedule?: [...], clips?: [...] }
// =================================================================

const HELIX = 'https://api.twitch.tv/helix';

let _token = null;
let _tokenExp = 0;

async function getAppToken(id, secret) {
  if (_token && Date.now() < _tokenExp - 60000) return _token;
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
  });
  if (!res.ok) throw new Error('token');
  const data = await res.json();
  _token = data.access_token;
  _tokenExp = Date.now() + (data.expires_in || 3600) * 1000;
  return _token;
}

function helixHeaders(id, token) {
  return { 'Client-Id': id, 'Authorization': `Bearer ${token}` };
}

async function viaHelix(logins, want, channel, id, secret) {
  const token = await getAppToken(id, secret);
  const h = helixHeaders(id, token);
  const qs = logins.map(l => `login=${encodeURIComponent(l)}`).join('&');

  const [usersRes, streamsRes] = await Promise.all([
    fetch(`${HELIX}/users?${qs}`, { headers: h }),
    fetch(`${HELIX}/streams?${logins.map(l => `user_login=${encodeURIComponent(l)}`).join('&')}`, { headers: h }),
  ]);
  const usersData = usersRes.ok ? await usersRes.json() : { data: [] };
  const streamsData = streamsRes.ok ? await streamsRes.json() : { data: [] };

  const byId = {};
  const users = {};
  for (const u of usersData.data || []) {
    byId[u.id] = u.login.toLowerCase();
    users[u.login.toLowerCase()] = {
      id: u.id, display_name: u.display_name, login: u.login.toLowerCase(),
      avatar: u.profile_image_url, description: u.description,
      live: false, viewers: 0, title: '', game: '', followers: null,
    };
  }
  for (const s of streamsData.data || []) {
    const key = (s.user_login || '').toLowerCase();
    if (users[key]) {
      users[key].live = true;
      users[key].viewers = s.viewer_count || 0;
      users[key].title = s.title || '';
      users[key].game = s.game_name || '';
      users[key].started_at = s.started_at;
    }
  }
  // followers (broadcaster scope sometimes needed; best-effort)
  await Promise.all(Object.values(users).map(async u => {
    try {
      const r = await fetch(`${HELIX}/channels/followers?broadcaster_id=${u.id}&first=1`, { headers: h });
      if (r.ok) { const d = await r.json(); u.followers = d.total ?? null; }
    } catch (_) {}
  }));

  const out = { source: 'helix', users };

  if (want.includes('schedule') && channel && users[channel.toLowerCase()]) {
    try {
      const bid = users[channel.toLowerCase()].id;
      const r = await fetch(`${HELIX}/schedule?broadcaster_id=${bid}&first=10`, { headers: h });
      if (r.ok) {
        const d = await r.json();
        out.schedule = (d.data?.segments || []).map(s => ({
          id: s.id, title: s.title, start: s.start_time, end: s.end_time,
          category: s.category?.name || '', canceled: !!s.canceled_until,
        }));
      }
    } catch (_) {}
  }
  if (want.includes('clips') && channel && users[channel.toLowerCase()]) {
    try {
      const bid = users[channel.toLowerCase()].id;
      const r = await fetch(`${HELIX}/clips?broadcaster_id=${bid}&first=6`, { headers: h });
      if (r.ok) {
        const d = await r.json();
        out.clips = (d.data || []).map(c => ({
          id: c.id, title: c.title, url: c.url, thumb: c.thumbnail_url,
          views: c.view_count, creator: c.creator_name, duration: c.duration,
        }));
      }
    } catch (_) {}
  }
  return out;
}

// ---- Zero-config fallback via decapi.me (no auth) ----
async function decapiText(path) {
  try {
    const r = await fetch(`https://decapi.me/twitch/${path}`, { headers: { 'User-Agent': 'sherko-live-studio' } });
    if (!r.ok) return '';
    return (await r.text()).trim();
  } catch (_) { return ''; }
}

async function viaDecapi(logins) {
  const users = {};
  await Promise.all(logins.map(async login => {
    const l = login.toLowerCase();
    const [uptime, game, followers, title] = await Promise.all([
      decapiText(`uptime/${l}`),
      decapiText(`game/${l}`),
      decapiText(`followcount/${l}`),
      decapiText(`title/${l}`),
    ]);
    const offline = /is offline|unable to|error|not found|no user/i.test(uptime) || !uptime;
    const followersNum = /^\d+$/.test(followers) ? Number(followers) : null;
    users[l] = {
      login: l, display_name: login,
      avatar: `https://decapi.me/twitch/avatar/${encodeURIComponent(l)}`,
      live: !offline,
      uptime: offline ? '' : uptime,
      viewers: 0,
      title: /error|not found|unable/i.test(title) ? '' : title,
      game: /error|not found|unable|offline/i.test(game) ? '' : game,
      followers: followersNum,
    };
  }));
  return { source: 'decapi', users };
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

  let logins = Array.isArray(body?.logins) ? body.logins : [];
  logins = logins.map(s => String(s || '').trim().replace(/^@/, '').toLowerCase()).filter(Boolean).slice(0, 25);
  if (!logins.length) return res.status(400).json({ error: 'logins required' });
  const want = Array.isArray(body?.want) ? body.want : [];
  const channel = body?.channel ? String(body.channel).replace(/^@/, '') : '';

  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;

  try {
    if (id && secret) {
      const out = await viaHelix(logins, want, channel, id, secret);
      // backfill any missing user with decapi avatar so photos still show
      for (const l of logins) if (!out.users[l]) out.users[l] = { login: l, display_name: l, avatar: `https://decapi.me/twitch/avatar/${l}`, live: false, viewers: 0, title: '', game: '', followers: null };
      return res.status(200).json(out);
    }
    const out = await viaDecapi(logins);
    return res.status(200).json(out);
  } catch (e) {
    // last resort: at least serve avatars
    const users = {};
    for (const l of logins) users[l] = { login: l, display_name: l, avatar: `https://decapi.me/twitch/avatar/${l}`, live: false, viewers: 0, title: '', game: '', followers: null };
    return res.status(200).json({ source: 'fallback', users, error: String(e && e.message || e) });
  }
}
