/* =================================================================
   SHERKO LIVE · Studio de production
   SPA — génère les conducteurs, le planning et gère le casting.
   Vanilla JS · pas de build · données persistées en localStorage.
   ================================================================= */
(() => {
  'use strict';

  // ============ DOM helpers ============
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
  const pad = n => String(n).padStart(2, '0');

  // ============ Role registry ============
  const ROLES = {
    SHERKO: { color: 'var(--c-sherko)', emoji: 'S' },
    BENJAY: { color: 'var(--c-benjay)', emoji: 'B' },
    JDOS:   { color: 'var(--c-jdos)',   emoji: 'J' },
    DiWiiD: { color: 'var(--c-diwiid)', emoji: 'D' },
    MADARA: { color: 'var(--c-madara)', emoji: 'M' },
    GUEST:  { color: 'var(--c-guest)',  emoji: '★' },
  };
  const roleColor = name => (ROLES[name] && ROLES[name].color) || 'var(--c-guest)';

  // Avatar: photo (uploaded > Twitch) if available, else colored initial.
  function avatarHtml(m, cls = 'avatar', styleExtra = '') {
    const ring = (cls.indexOf('avatar') !== -1 && memberLive(m)) ? ' live-ring' : '';
    const photo = memberPhoto(m);
    if (photo) {
      return `<span class="${cls} has-photo${ring}" style="${styleExtra}" title="${esc(m && m.name || '')}"><img src="${esc(photo)}" alt="${esc(m && m.name || '')}" loading="lazy" onerror="this.parentNode.classList.remove('has-photo');this.parentNode.style.background='${(m&&m.color)||'var(--c-guest)'}';this.replaceWith(document.createTextNode('${esc(m&&m.av||'?')}'))"></span>`;
    }
    const color = (m && m.color) || 'var(--c-guest)';
    return `<span class="${cls}${ring}" style="background:${color};${styleExtra}" title="${esc(m && m.name || '')}">${esc(m && m.av || '?')}</span>`;
  }

  // ============ Seed: team roster ============
  // permanent: présent par défaut sur chaque live. active: proposé par défaut au casting.
  // Seul SHERKO est permanent (100%). Les autres sont occasionnels → on les active / invite par live.
  const SEED_TEAM = [
    { id: 'm_sherko', name: 'SHERKO', role: 'Host', tag: 'Host, relances, questions et interaction chat. Présence 100%.',
      color: 'var(--c-sherko)', av: 'S', photo: null, twitch: 'sherko27', discord: '', contact: { handle: '@sherko', phone: '', email: '' }, permanent: true, active: true },
    { id: 'm_madara', name: 'MADARA', role: 'Régie générale', tag: 'Transitions, OBS, audio, zéro bug — présent tout le live.',
      color: 'var(--c-madara)', av: 'M', photo: null, twitch: '', discord: '', contact: { handle: '@madara', phone: '', email: 'madara@madara-community.com' }, permanent: false, active: true },
    { id: 'm_jdos', name: 'JDOS', role: 'Chronique art', tag: 'JDOSCOPE + débat meilleure œuvre. Invité occasionnel.',
      color: 'var(--c-jdos)', av: 'J', photo: null, twitch: '', discord: '', contact: { handle: '@jdos', phone: '', email: '' }, permanent: false, active: false },
    { id: 'm_diwiid', name: 'DiWiiD', role: 'Cuisine', tag: 'Passage cuisine + retour dessert : La Cuisine du Di. Occasionnel.',
      color: 'var(--c-diwiid)', av: 'D', photo: null, twitch: '', discord: '', contact: { handle: '@diwiid', phone: '', email: '' }, permanent: false, active: false },
    { id: 'm_dope', name: 'DOPE', role: 'Chroniqueur', tag: 'Twitcheur invité, chroniques et réactions chat. Occasionnel.',
      color: '#FF6B9D', av: 'Do', photo: null, twitch: '', discord: '', contact: { handle: '@dope', phone: '', email: '' }, permanent: false, active: false },
    { id: 'm_olb', name: 'OLB', role: 'Chroniqueur', tag: 'Twitcheur invité, ambiance et débats. Occasionnel.',
      color: '#5BC8FF', av: 'O', photo: null, twitch: '', discord: '', contact: { handle: '@olb', phone: '', email: '' }, permanent: false, active: false },
    { id: 'm_benjay', name: 'BENJAY', role: 'Invité', tag: 'Invité du live BENJAY : playlist, BOTA, parcours, Brésil.',
      color: 'var(--c-benjay)', av: 'B', photo: null, twitch: '', discord: '', contact: { handle: '@benjay', phone: '', email: '' }, permanent: false, active: false },
  ];

  // ============ Seed: BENJAY live (from the official PDF) ============
  function seedBenjayLive() {
    return {
      id: 'live_benjay',
      title: 'SHERKO LIVE × BENJAY',
      subtitle: 'Talk show avec BENJAY',
      guest: 'BENJAY',
      status: 'planifie',
      date: '2026-06-28',
      location: '5 bis rue Théodore Hamont — 75012 Paris',
      times: { crew: '15:30', guest: '17:30', live: '18:00' },
      castIds: ['m_sherko', 'm_benjay', 'm_jdos', 'm_diwiid', 'm_madara'],
      music: ['Tota Lopi (entrée SHERKO)', 'BOTA (entrée BENJAY)', 'Track favori JDOS', 'Track favori DiWiiD'],
      segments: [
        {
          id: uid('seg'), num: 1, label: 'Introduction + arrivée de BENJAY', dur: 20,
          blocks: [
            { role: 'SHERKO', title: 'Introduction', items: [
              "SHERKO arrive dans le studio sous une ambiance do Brasil (Tota Lopi).",
              "Il fait découvrir le lieu pour les nouveaux.",
              "Review sur la PLAYLIST de BENJAY avec le chat. DiWiiD fait un léger passage, puis repart avant l'arrivée de BENJAY en prétextant avoir du travail en cuisine.",
              "SHERKO explique au chat que de nombreuses fois il devait bosser avec BENJAY mais que ça n'a pas pu se faire : c'est leur 1re rencontre.",
            ]},
            { role: 'BENJAY', title: '1ère partie — Arrivée / Studio talk', items: [
              "BENJAY arrive sur son dernier track 'BOTA'. Délirer un moment avant les salutations en bonnes et dues formes.",
              "SHERKO et BENJAY reviennent sur les fois où ils se sont loupés.",
              "SHERKO : 'Faut vraiment qu'on bosse ensemble, que je capte ta science. Niveau VST, c'est quoi tes Go To ?'",
              "SHERKO : 'Et niveau plugin ton Top 3 ?'",
              "SHERKO : 'T'es plugin ou analogique du coup ?'",
              "EXTRA — rebonds spontanés, anecdotes studio, réactions du chat.",
            ]},
            { role: 'DiWiiD', title: 'Passage avant BENJAY', items: [
              "Passe pendant la review playlist.",
              "Rôle : installer sa présence sans prendre la lumière.",
              "Sortie : prétexte cuisine, il reviendra avec le dessert.",
            ]},
            { role: 'MADARA', title: 'Cues régie', items: [
              "Lancer Tota Lopi pour l'entrée SHERKO.",
              "Préparer BOTA pour l'entrée BENJAY.",
              "Surveiller le départ DiWiiD avant BENJAY.",
              "Garder playlist + chat visibles.",
            ]},
          ],
        },
        {
          id: uid('seg'), num: 2, label: 'Partie 2 — Interview BENJAY', dur: 30,
          blocks: [
            { role: 'BENJAY', title: 'A. Histoire / Nom / Musique', items: [
              "Avant qu'on entre dans ton actualité, où est-ce que ton histoire a commencé ?",
              "BENJAY, ça vient de toi ou ta famille t'appelait déjà comme ça ?",
              "T'as toujours été attiré par la musique ?",
              "L'art s'exprime sous un tas de formes, pourquoi celle-ci plus qu'une autre ?",
            ]},
            { role: 'BENJAY', title: 'B. Art / Sport / Mental', items: [
              "T'aurais penché vers quoi si la musique n'avait pas pris ?",
              "Il y a des similitudes entre la vie d'athlète et celle d'artiste : est-ce qu'il y a des sportifs qui t'ont inspiré ? Ne serait-ce que par le mental.",
              "C'est quoi la pratique que t'affectionnes le plus ?",
              "En parlant de sport : t'es archi clean. No drink, no smoke. Tu fais littéralement du son sans te doper. C'est rare de nos jours...",
            ]},
            { role: 'BENJAY', title: 'C. Process / Futur', items: [
              "T'as nourri la culture avec DAMSO : TieksVie, 60 Années, BXLZOO, Festival de Rêves... C'est quoi le process pour faire autant de hits sans être redondant ?",
              "Avec 'Finis-Les', 'TieksVie' ou la vague bouyon, t'as été plus ou moins en avance sur certaines tendances. Instinctif ou prémédité ?",
              "T'as l'air d'avoir le souci du détail : tu t'impliques à quel niveau sur les sons ?",
              "Aujourd'hui t'es producer multi-diamants, demain tu te vois où ?",
            ]},
            { role: 'SHERKO', title: 'Angle de relance', items: [
              "Ne pas enchaîner mécaniquement les questions : rebondir sur les anecdotes de BENJAY.",
              "Faire respirer après les gros noms : DAMSO, TieksVie, 60 Années, BXLZOO, Festival de Rêves.",
              "Objectif : capter sa science de producteur sans perdre le chat.",
            ]},
            { role: 'MADARA', title: 'Surveillance technique', items: [
              "Caméra SHERKO / caméra BENJAY propres pendant les questions.",
              "Niveaux voix stables, éviter saturation quand ça rigole.",
              "Préparer transition vers entrée JDOS + track favori.",
            ]},
          ],
        },
        {
          id: uid('seg'), num: 3, label: 'Partie 3 — JDOSCOPE / ITW II / La Cuisine du Di', dur: 30,
          blocks: [
            { role: 'JDOS', title: 'JDOSCOPE', items: [
              "JDOS arrive sur son track favori de BENJAY. Après les salutations, il explique à SHERKO pourquoi c'est la meilleure œuvre de BENJAY à son goût pour ouvrir un débat avant sa chronique.",
              "JDOS : 'Dans tous les cas on est ensemble les gars ! D'ailleurs en parlant d'ensemble, j'suis venu pour vous présenter un crack aujourd'hui...'",
              "JDOS lance sa chronique : LE JDOSCOPE.",
              "PAUSE FRAÎCHEUR 🥤",
            ]},
            { role: 'BENJAY', title: 'ITW II — BOTA / Brésil', items: [
              "C'est quoi la genèse de 'BOTA', ton 1er single en tant qu'artiste ?",
              "Chacun écrit son histoire. Est-ce qu'il y a des artistes qui ont un parcours où tu te retrouves ? Ou bien où tu te verrais à l'avenir ?",
              "T'as de grosses inspirations brésiliennes, t'es un gars do Brasil en vrai ?",
              "JDOS : 'Comment ça t'as été dans les favelas ?! Tu vas au Brésil depuis quand ?'",
              "JDOS : 'Ok, du coup tu fais même du son là-bas ?'",
              "Être un artiste reconnu au Brésil, c'est le plan j'imagine vu la langue choisie ?",
              "JDOS : 'C'est quoi qui te parle le plus au Brésil ? Ta ville favorite ? Ton plat préféré ? Où est-ce qu'il faut sortir ?'",
            ]},
            { role: 'DiWiiD', title: 'La Cuisine du Di', items: [
              "DiWiiD vient avec le dessert du jour. Il entre sur son track favori de BENJAY pour relancer le débat sur sa meilleure œuvre.",
              "DiWiiD présente son plat du jour : moment 'La Cuisine du Di'.",
            ]},
            { role: 'SHERKO', title: 'Transitions', items: [
              "Après JDOSCOPE : pause fraîcheur puis retour ITW PT II.",
              "Quand DiWiiD entre : laisser son track favori lancer le débat avant le dessert.",
              "Ne pas oublier de relancer sur ville / plat / sorties au Brésil.",
            ]},
          ],
        },
        {
          id: uid('seg'), num: 4, label: 'Partie 4 — React sons chat + clap de fin', dur: 20,
          blocks: [
            { role: 'GUEST', title: 'Toute l\'équipe — React sons chat', items: [
              "Réact à une dizaine de tracks avec toute l'équipe.",
              "Mot de la fin pour BENJAY : c'est quoi la suite niveau musique ?",
              "Salutations et clap de FIN.",
            ]},
            { role: 'BENJAY', title: 'Mot de fin', items: [
              "Question centrale : 'C'est quoi la suite niveau musique ?'",
              "Laisser BENJAY annoncer ses projets / prochaines sorties.",
              "Faire un dernier tour d'équipe rapide.",
            ]},
            { role: 'SHERKO', title: 'Clap de fin', items: [
              "Remercier BENJAY, JDOS, DiWiiD, MADARA et le chat.",
              "Rappeler Twitch / prochains lives / réseaux.",
              "Sortie propre, pas de fin coupée brutalement.",
            ]},
            { role: 'MADARA', title: 'Checklist régie finale', items: [
              "Musiques prêtes : Tota Lopi / BOTA / track favori JDOS / track favori DiWiiD.",
              "Scènes OBS : intro, face cam, invité, chronique, react chat, fin.",
              "Audio : micros, musique pas trop forte, pas de saturation pendant les rires.",
              "Médias : playlist BENJAY, sons du chat, visuels JDOSCOPE, dessert DiWiiD.",
              "Sécurité live : surveiller bugs, latence, niveaux, caméra, chat, transitions.",
            ]},
          ],
        },
      ],
    };
  }

  // ============ Store ============
  const KEY = 'sherkolive.v3';
  let state = load();

  function defaultSettings() {
    return {
      discordWebhook: '', channel: 'sherko27', twitchAuto: true,
      profile: {
        name: 'SHERKO',
        tagline: 'Réalisateur Artistique · Producteur multi-disques · Host de SHERKO LIVE',
        bio: "Réalisateur artistique et producteur. Je reçois des artistes en live sur Twitch (SHERKO LIVE), je fais du son, et je co-fonde la BSB League. Studio do Brasil 🇧🇷.",
        city: 'Paris',
        accent: '#9146FF',
        avatar: '',
        socials: {
          twitch:    { handle: 'sherko27',       url: 'https://twitch.tv/sherko27',        followers: null },
          instagram: { handle: 'sherkovie',      url: 'https://instagram.com/sherkovie',   followers: 32000 },
          tiktok:    { handle: 'sherkovie',      url: 'https://tiktok.com/@sherkovie',     followers: null },
          x:         { handle: 'sherkoberwary',  url: 'https://x.com/sherkoberwary',       followers: null },
          youtube:   { handle: '',               url: '',                                   followers: null },
          discord:   { handle: '',               url: '',                                   followers: null },
        },
      },
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); if (d && d.team && d.lives) { d.settings = { ...defaultSettings(), ...(d.settings || {}) }; return d; } }
    } catch (_) {}
    return { team: SEED_TEAM.map(m => ({ ...m, contact: { ...m.contact } })), lives: [seedBenjayLive()], settings: defaultSettings() };
  }

  // ---- Runtime Twitch cache (login -> {avatar, live, viewers, game, followers, ...}) ----
  const twitchCache = {};
  function twData(login) { return login ? twitchCache[String(login).toLowerCase().replace(/^@/, '')] : null; }
  function memberPhoto(m) {
    if (m && m.photo) return m.photo;
    const tw = m && m.twitch ? twData(m.twitch) : null;
    if (tw && tw.avatar) return tw.avatar;
    if (m && m.twitch) return `https://decapi.me/twitch/avatar/${encodeURIComponent(String(m.twitch).replace(/^@/, ''))}`;
    return null;
  }
  function memberLive(m) { const tw = m && m.twitch ? twData(m.twitch) : null; return tw && tw.live; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
  function memberById(id) { return state.team.find(m => m.id === id); }
  function liveById(id) { return state.lives.find(l => l.id === id); }

  // ============ Router ============
  const view = { name: 'home', liveId: null, tab: 'conducteur' };

  function navigate(name, opts = {}) {
    view.name = name;
    if (opts.liveId !== undefined) view.liveId = opts.liveId;
    if (opts.tab) view.tab = opts.tab;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    render();
    syncNav();
  }

  function syncNav() {
    const active = view.name === 'live' ? 'lives' : view.name;
    $$('.topnav-btn, .botnav-btn').forEach(b => b.classList.toggle('is-active', b.dataset.nav === active));
  }

  // ============ Status helpers ============
  const STATUS = {
    brouillon: { label: 'Brouillon', cls: 'is-brouillon' },
    planifie:  { label: 'Planifié',  cls: 'is-planifie' },
    live:      { label: 'EN LIVE',   cls: 'is-live' },
    termine:   { label: 'Terminé',   cls: 'is-termine' },
  };
  function statusBadge(s) { const m = STATUS[s] || STATUS.brouillon; return `<span class="badge ${m.cls}"><span class="dot"></span>${m.label}</span>`; }

  function liveDate(l) {
    if (!l.date) return null;
    const t = (l.times && l.times.live) || '18:00';
    return new Date(`${l.date}T${t}:00`);
  }
  function fmtDate(l) {
    const d = liveDate(l); if (!d) return '—';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function countdownText(l) {
    const d = liveDate(l); if (!d) return '';
    const diff = d.getTime() - Date.now();
    if (l.status === 'termine') return 'Terminé';
    if (diff < -3 * 3600e3) return 'Passé';
    if (diff < 0) return 'En cours';
    const days = Math.floor(diff / 86400e3);
    const hrs = Math.floor((diff % 86400e3) / 3600e3);
    const mins = Math.floor((diff % 3600e3) / 60e3);
    if (days > 0) return `J-${days} · ${hrs}h`;
    if (hrs > 0) return `Dans ${hrs}h${pad(mins)}`;
    return `Dans ${mins} min`;
  }

  // ============ Time math (planning) ============
  function addMinutes(hhmm, mins) {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.floor((total % 1440 + 1440) % 1440 / 60);
    const nm = ((total % 60) + 60) % 60;
    return `${pad(nh)}:${pad(nm)}`;
  }

  // =================================================================
  //  RENDER
  // =================================================================
  const app = $('#app');

  function render() {
    let html = '';
    switch (view.name) {
      case 'home':       html = renderHome(); break;
      case 'lives':      html = renderLives(); break;
      case 'live':       html = renderLive(); break;
      case 'equipe':     html = renderEquipe(); break;
      case 'generateur': html = renderGenerator(); break;
      default:           html = renderHome();
    }
    app.innerHTML = `<div class="view">${html}</div>`;
    if (view.name === 'generateur') wireGenerator();
  }

  // ---------- View: Home (HUB SHERKO) ----------
  const SOCIALS = [
    { k: 'twitch',    label: 'Twitch',    ico: '🟣', brand: '#9146FF', pre: '' },
    { k: 'instagram', label: 'Instagram', ico: '📸', brand: '#E1306C', pre: '@' },
    { k: 'tiktok',    label: 'TikTok',    ico: '🎵', brand: '#25F4EE', pre: '@' },
    { k: 'x',         label: 'X',         ico: '𝕏',  brand: '#1d9bf0', pre: '@' },
    { k: 'youtube',   label: 'YouTube',   ico: '▶️', brand: '#FF0000', pre: '' },
    { k: 'discord',   label: 'Discord',   ico: '💬', brand: '#5865F2', pre: '' },
  ];
  function fmtCount(n) {
    if (n == null) return '';
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace('.0', '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n % 1e3 >= 100 ? 1 : 0).replace('.0', '') + 'K';
    return String(n);
  }
  function profileAvatar() {
    const p = state.settings.profile;
    if (p.avatar) return p.avatar;
    const tw = p.socials?.twitch?.handle;
    if (tw) { const d = twData(tw); if (d && d.avatar) return d.avatar; return `https://decapi.me/twitch/avatar/${encodeURIComponent(tw)}`; }
    return '';
  }
  function renderHome() {
    const p = state.settings.profile;
    const tw = p.socials?.twitch?.handle ? twData(p.socials.twitch.handle) : null;
    const isLive = tw && tw.live;
    const av = profileAvatar();
    const accent = p.accent || '#9146FF';

    // total community
    let total = 0; let known = false;
    SOCIALS.forEach(s => { const f = (p.socials[s.k]||{}).followers; if (f) { total += f; known = true; } });
    if (tw && tw.followers) { total += tw.followers; known = true; }

    const socialCards = SOCIALS.map(s => {
      const data = p.socials[s.k] || {};
      if (!data.handle && !data.url) return '';
      const url = data.url || '#';
      let count = data.followers;
      if (s.k === 'twitch' && tw && tw.followers != null) count = tw.followers;
      const sub = (s.k === 'twitch' && isLive) ? `<span style="color:var(--magenta);font-weight:700">🔴 EN LIVE${tw.viewers?` · ${tw.viewers}`:''}</span>` : (count != null ? `${fmtCount(count)} abonnés` : 'Voir le profil');
      return `
        <a class="social-card" href="${esc(url)}" target="_blank" rel="noopener" style="--brand:${s.brand}">
          <span class="sc-ico">${s.ico}</span>
          <div class="sc-body">
            <div class="sc-name">${s.label}</div>
            <div class="sc-sub">${sub}</div>
          </div>
          <span class="sc-handle">${data.handle ? esc(s.pre + data.handle) : '↗'}</span>
        </a>`;
    }).join('');

    const next = [...state.lives].filter(l => l.status !== 'termine').sort((a, b) => (liveDate(a)||0) - (liveDate(b)||0))[0];

    return `
      <section class="hub-hero" style="--accent:${accent}">
        <div class="hub-glow"></div>
        <div class="hub-avatar ${isLive?'is-live':''}">
          ${av ? `<img src="${esc(av)}" alt="${esc(p.name)}" onerror="this.style.display='none';this.parentNode.classList.add('noimg')">` : ''}
          <span class="hub-initial">${esc((p.name||'S')[0])}</span>
          ${isLive ? '<span class="hub-livebadge">🔴 LIVE</span>' : ''}
        </div>
        <h1 class="hub-name">${esc(p.name)}</h1>
        <p class="hub-tagline">${esc(p.tagline)}</p>
        ${p.city ? `<div class="hub-city">📍 ${esc(p.city)}</div>` : ''}
        <p class="hub-bio">${esc(p.bio)}</p>
        <div class="hub-stats">
          ${known ? `<div class="hub-stat"><b>${fmtCount(total)}</b><span>communauté</span></div>` : ''}
          ${tw && tw.followers!=null ? `<div class="hub-stat"><b>${fmtCount(tw.followers)}</b><span>Twitch</span></div>` : ''}
          <div class="hub-stat"><b>${state.lives.length}</b><span>lives</span></div>
        </div>
        <div class="hub-cta">
          ${p.socials?.twitch?.handle ? `<a class="btn btn-twitch btn-lg" href="https://twitch.tv/${esc(p.socials.twitch.handle)}" target="_blank" rel="noopener">${isLive?'🔴 Rejoindre le live':'🟣 Voir la chaîne'}</a>` : ''}
          <button class="btn btn-lg" data-nav="lives" type="button">🎬 Le Studio</button>
          <button class="btn btn-ghost btn-lg" data-action="edit-profile" type="button">✎ Éditer le profil</button>
        </div>
      </section>

      <div class="hub-section-title">Mes réseaux</div>
      <div class="social-grid">${socialCards || '<p class="muted">Ajoute tes réseaux via « Éditer le profil ».</p>'}</div>

      ${next ? `<div class="hub-section-title">Prochain live</div>${nextLiveStrip(next)}` : ''}

      <div class="hub-section-title">Le Studio</div>
      <div class="grid grid-lives">
        ${state.lives.slice(0, 3).map(l => liveCard(l)).join('')}
        <button class="add-card" data-action="new-live" type="button"><span class="plus">＋</span><span>Créer un live</span></button>
      </div>`;
  }

  // ---------- View: Lives ----------
  function renderLives() {
    const next = [...state.lives].filter(l => l.status !== 'termine').sort((a, b) => (liveDate(a)||0) - (liveDate(b)||0))[0];
    const cards = state.lives.map(l => liveCard(l)).join('');
    return `
      <div class="page-head">
        <div>
          <span class="eyebrow">Studio de production</span>
          <h1>Tes lives</h1>
          <p>Génère le conducteur officiel, le planning chronométré et le casting de chaque live SHERKO LIVE — puis active et invite l'équipe en un clic.</p>
        </div>
        <div class="page-head-actions">
          <button class="btn btn-ghost" data-nav="generateur" type="button">✦ Générateur IA</button>
          <button class="btn btn-primary" data-action="new-live" type="button">＋ Nouveau live</button>
        </div>
      </div>
      ${next ? nextLiveStrip(next) : ''}
      <div class="grid grid-lives">
        ${cards}
        <button class="add-card" data-action="new-live" type="button">
          <span class="plus">＋</span>
          <span>Créer un live</span>
        </button>
      </div>`;
  }

  function nextLiveStrip(l) {
    const cd = countdownText(l);
    return `
      <button class="panel" style="display:flex;align-items:center;gap:16px;width:100%;text-align:left;margin-bottom:22px;cursor:pointer" data-open-live="${l.id}" type="button">
        <div style="flex:none;width:52px;height:52px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:linear-gradient(135deg,var(--purple),var(--magenta))">⏱️</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--ink-3);font-weight:700;letter-spacing:.1em;text-transform:uppercase">Prochain live</div>
          <div style="font-size:18px;font-weight:800;margin-top:2px">${esc(l.title)}</div>
          <div style="font-size:13px;color:var(--ink-2);margin-top:2px">${esc(fmtDate(l))} · ${esc(l.times?.live || '')} · ${esc(l.location || '')}</div>
        </div>
        <div class="countdown" style="font-size:18px">${esc(cd)}</div>
      </button>`;
  }

  function liveCard(l) {
    const cast = (l.castIds || []).map(memberById).filter(Boolean);
    const av = cast.slice(0, 5).map(m => avatarHtml(m, 'av')).join('');
    const cd = countdownText(l);
    const past = /Passé|Terminé/.test(cd);
    return `
      <button class="live-card" data-open-live="${l.id}" type="button">
        <div class="lc-top">
          <div>
            <div class="lc-guest">Invité · ${esc(l.guest || '—')}</div>
            <h3>${esc(l.title)}</h3>
          </div>
          ${statusBadge(l.status)}
        </div>
        <div class="lc-meta">
          <span>📅 <b>${esc(fmtDate(l))}</b></span>
          <span>🕐 <b>${esc(l.times?.live || '—')}</b></span>
        </div>
        <div class="lc-meta"><span>📍 ${esc(l.location || 'Lieu à définir')}</span></div>
        <div class="lc-cast">${av || '<span class="muted" style="font-size:13px">Aucun agent</span>'}</div>
        <div class="lc-foot">
          <span class="chip">${(l.segments||[]).length} segment${(l.segments||[]).length>1?'s':''}</span>
          <span class="countdown ${past?'is-past':''}">${esc(cd)}</span>
        </div>
      </button>`;
  }

  // ---------- View: Live detail ----------
  function renderLive() {
    const l = liveById(view.liveId);
    if (!l) { navigate('lives'); return ''; }
    const cast = (l.castIds || []).map(memberById).filter(Boolean);
    const tabs = ['conducteur', 'planning', 'casting', 'tools'];
    const tabLabels = { conducteur: '📋 Conducteur', planning: '🗓️ Planning', casting: '🎭 Casting', tools: '🎚️ Outils live' };
    const tabsHtml = tabs.map(t => `<button class="tab ${view.tab===t?'is-active':''}" data-tab="${t}" type="button">${tabLabels[t]}</button>`).join('');

    let body = '';
    if (view.tab === 'conducteur') body = renderConductor(l);
    else if (view.tab === 'planning') body = renderPlanning(l);
    else if (view.tab === 'tools') body = renderTools(l);
    else body = renderCasting(l);

    return `
      <div class="live-hero">
        <button class="back" data-nav="lives" type="button">← Tous les lives</button>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">
          <div>
            <div class="lh-guest">Invité · ${esc(l.guest || '—')}</div>
            <h1>${esc(l.title)}</h1>
          </div>
          ${statusBadge(l.status)}
        </div>
        <div class="lh-meta">
          <span><span class="k">Date</span>${esc(fmtDate(l))}</span>
          <span><span class="k">Lieu</span>${esc(l.location || '—')}</span>
          <span><span class="k">Crew</span>${esc(l.times?.crew || '—')}</span>
          <span><span class="k">Invité</span>${esc(l.times?.guest || '—')}</span>
          <span><span class="k">Live</span>${esc(l.times?.live || '—')}</span>
          <span><span class="k">Équipe</span>${cast.length} agent${cast.length>1?'s':''}</span>
        </div>
        <div class="lh-actions">
          <button class="btn btn-sm btn-primary" data-action="open-regie" data-id="${l.id}" type="button">▶ Mode régie</button>
          <button class="btn btn-sm btn-twitch" data-action="open-prompter" data-id="${l.id}" type="button">📜 Téléprompteur</button>
          <button class="btn btn-sm btn-discord" data-action="discord-menu" data-id="${l.id}" type="button">💬 Discord</button>
          <button class="btn btn-sm btn-ghost" data-action="edit-live" data-id="${l.id}" type="button">✎ Modifier</button>
          <button class="btn btn-sm btn-ghost" data-action="status-cycle" data-id="${l.id}" type="button">⟳ Statut</button>
          <button class="btn btn-sm btn-ghost" data-action="duplicate-live" data-id="${l.id}" type="button">⧉ Dupliquer</button>
          <button class="btn btn-sm btn-ghost" data-action="invite-all" data-id="${l.id}" type="button">✉ Inviter</button>
        </div>
      </div>
      <div class="tabs">${tabsHtml}</div>
      ${body}`;
  }

  // ---------- Conductor (run of show) ----------
  function renderConductor(l) {
    const segs = (l.segments || []).map(seg => segmentHtml(l, seg)).join('');
    return `
      <div class="conductor-toolbar">
        <span class="chip">📋 ${(l.segments||[]).length} segments · ${totalDuration(l)} min</span>
        <span class="chip" title="Clique sur une ligne pour l'éditer">✎ Édition inline activée</span>
        <span class="spacer"></span>
        <button class="btn btn-sm" data-action="add-segment" data-id="${l.id}" type="button">＋ Segment</button>
        <button class="btn btn-sm btn-ghost" data-action="copy-conductor" data-id="${l.id}" type="button">⧉ Copier</button>
        <button class="btn btn-sm btn-primary" data-action="print" type="button">⤓ Exporter PDF</button>
      </div>
      ${segs || '<div class="empty-state"><div class="big">📋</div><h2>Pas encore de segment</h2><p>Ajoute le premier segment du conducteur.</p></div>'}`;
  }

  function segmentHtml(l, seg) {
    let clock = l.times?.live || '18:00';
    // compute start time of this segment
    for (const s of l.segments) { if (s.id === seg.id) break; clock = addMinutes(clock, s.dur || 0); }
    const end = addMinutes(clock, seg.dur || 0);
    const blocks = (seg.blocks || []).map(b => blockHtml(l, seg, b)).join('');
    return `
      <section class="segment" data-seg="${seg.id}">
        <div class="segment-head">
          <div class="segment-num">${seg.num}</div>
          <h3 contenteditable="true" data-edit="seg-label" data-seg="${seg.id}">${esc(seg.label)}</h3>
          <span class="seg-time">${clock}–${end} · ${seg.dur||0}′</span>
          <button class="icon-btn" data-action="del-segment" data-id="${l.id}" data-seg="${seg.id}" title="Supprimer le segment" type="button">✕</button>
        </div>
        <div class="segment-body">${blocks}</div>
      </section>`;
  }

  function blockHtml(l, seg, b) {
    const color = roleColor(b.role);
    const span = (b.items || []).length > 4 ? ' span2' : '';
    const items = (b.items || []).map((it, i) => {
      const quote = /^['"«]|VST|plugin|Go To|favelas|ensemble les gars/i.test(it) && /['"]/.test(it);
      return `<li class="${quote?'is-quote':''}" contenteditable="true" data-edit="item" data-seg="${seg.id}" data-block="${b.id || seg.blocks.indexOf(b)}" data-i="${i}">${esc(it)}</li>`;
    }).join('');
    return `
      <div class="block${span}" style="--role:${color}">
        <div class="block-head">
          <span class="block-role">${esc(b.role)}</span>
          <span class="block-title">${esc(b.title || '')}</span>
        </div>
        <ul>${items}</ul>
      </div>`;
  }

  function totalDuration(l) { return (l.segments || []).reduce((s, x) => s + (x.dur || 0), 0); }

  // ---------- Planning timeline ----------
  function renderPlanning(l) {
    const items = [];
    if (l.times?.crew)  items.push({ time: l.times.crew, title: 'Arrivée TEAM CREW', desc: 'Installation studio, OBS, scènes, audio, caméras.', dot: 'var(--c-madara)', key: true });
    if (l.times?.guest) items.push({ time: l.times.guest, title: `Arrivée ${esc(l.guest || 'invité')}`, desc: 'Accueil invité, balance micro, derniers réglages.', dot: 'var(--c-benjay)', key: true });
    if (l.times?.live)  items.push({ time: l.times.live, title: '🔴 DÉBUT DU LIVE', desc: 'On lance le stream.', dot: 'var(--green)', key: true });

    let clock = l.times?.live || '18:00';
    (l.segments || []).forEach(seg => {
      const start = clock; const end = addMinutes(clock, seg.dur || 0); clock = end;
      const roles = [...new Set((seg.blocks || []).map(b => b.role))].join(' · ');
      items.push({ time: `${start}`, title: `${seg.num}. ${seg.label}`, desc: roles, dur: `${seg.dur||0} min · fin ${end}`, dot: 'var(--purple)' });
    });
    items.push({ time: clock, title: 'Clap de fin', desc: 'Sortie propre, remerciements, rappel réseaux.', dot: 'var(--c-sherko)', key: true });

    const tl = items.map(it => `
      <div class="tl-item">
        <span class="tl-dot" style="--dot:${it.dot}"></span>
        <div class="tl-card ${it.key?'is-key':''}">
          <span class="tl-time">${esc(it.time)}</span>
          <h4>${it.title}</h4>
          ${it.desc ? `<p>${esc(it.desc)}</p>` : ''}
          ${it.dur ? `<div class="tl-dur">${esc(it.dur)}</div>` : ''}
        </div>
      </div>`).join('');

    return `
      <div class="conductor-toolbar">
        <span class="chip">🗓️ Roulement complet</span>
        <span class="chip">⏱️ Live ${totalDuration(l)} min</span>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-action="edit-live" data-id="${l.id}" type="button">✎ Modifier les horaires</button>
      </div>
      <div class="panel"><div class="timeline">${tl}</div></div>`;
  }

  // ---------- Casting ----------
  function renderCasting(l) {
    const inCast = id => (l.castIds || []).includes(id);
    const cards = state.team.map(m => personCard(m, { live: l, active: inCast(m.id) })).join('');
    return `
      <div class="conductor-toolbar">
        <span class="chip">🎭 ${(l.castIds||[]).length}/${state.team.length} agents sur ce live</span>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-action="invite-all" data-id="${l.id}" type="button">✉ Inviter tout le casting</button>
        <button class="btn btn-sm" data-nav="equipe" type="button">＋ Gérer l'équipe</button>
      </div>
      <div class="cast-grid">${cards}</div>`;
  }

  // ---------- Person card (used in casting + equipe) ----------
  function personCard(m, ctx = {}) {
    const onLive = !!ctx.live;
    const active = onLive ? ctx.active : m.active;
    const contactChips = [];
    if (m.contact?.handle) contactChips.push(`<span class="chip">${esc(m.contact.handle)}</span>`);
    if (m.contact?.phone)  contactChips.push(`<span class="chip">📞 ${esc(m.contact.phone)}</span>`);
    if (m.contact?.email)  contactChips.push(`<span class="chip">✉ ${esc(m.contact.email)}</span>`);

    const toggle = onLive
      ? `<label class="switch" title="Activer sur ce live">
           <input type="checkbox" data-action="toggle-cast" data-live="${ctx.live.id}" data-id="${m.id}" ${active?'checked':''}>
           <span class="track"></span>${active?'Sur le live':'Au repos'}
         </label>`
      : `<label class="switch" title="Agent actif">
           <input type="checkbox" data-action="toggle-active" data-id="${m.id}" ${active?'checked':''}>
           <span class="track"></span>${active?'Actif':'Inactif'}
         </label>`;

    // Twitch live status + stats
    const tw = m.twitch ? twData(m.twitch) : null;
    const liveTag = tw && tw.live ? '<span class="live-tag"><span class="dot"></span>LIVE</span>' : '';
    const stats = [];
    if (tw && tw.live && tw.viewers != null) stats.push(`<span class="s">👁️ ${tw.viewers}</span>`);
    if (tw && tw.game) stats.push(`<span class="s">🎮 ${esc(tw.game)}</span>`);
    if (tw && tw.followers != null) stats.push(`<span class="s">❤️ ${tw.followers}</span>`);
    if (m.twitch) stats.push(`<span class="s">🟣 ${esc(m.twitch)}</span>`);

    // RSVP (only on a live)
    let rsvpRow = '';
    if (onLive && active) {
      const cur = (ctx.live.rsvp || {})[m.id];
      rsvpRow = `<div class="rsvp-row">
        <button class="rsvp-btn ${cur==='yes'?'on-yes':''}" data-action="rsvp" data-live="${ctx.live.id}" data-id="${m.id}" data-v="yes" type="button">✅ Présent</button>
        <button class="rsvp-btn ${cur==='maybe'?'on-maybe':''}" data-action="rsvp" data-live="${ctx.live.id}" data-id="${m.id}" data-v="maybe" type="button">🤔 Peut-être</button>
        <button class="rsvp-btn ${cur==='no'?'on-no':''}" data-action="rsvp" data-live="${ctx.live.id}" data-id="${m.id}" data-v="no" type="button">❌ Absent</button>
      </div>`;
    }

    return `
      <div class="person ${active?'':'is-inactive'}" style="--role:${m.color}">
        <div class="person-top">
          ${avatarHtml(m, 'avatar')}
          <div class="person-id">
            <h3>${esc(m.name)}${m.permanent ? ' <span class="perm-tag">★ Permanent</span>' : ''}${liveTag}</h3>
            <div class="role">${esc(m.role)}</div>
          </div>
          ${toggle}
        </div>
        <p class="tagline">${esc(m.tag || '')}</p>
        ${stats.length ? `<div class="tw-stats">${stats.join('')}</div>` : ''}
        ${contactChips.length ? `<div class="contact">${contactChips.join('')}</div>` : ''}
        ${rsvpRow}
        <div class="person-actions">
          <button class="btn btn-sm btn-green" data-action="invite" data-id="${m.id}" ${onLive?`data-live="${ctx.live.id}"`:''} type="button">✉ Inviter</button>
          ${m.twitch ? `<a class="btn btn-sm btn-twitch" href="https://twitch.tv/${esc(m.twitch)}" target="_blank" rel="noopener">🟣</a>` : ''}
          <button class="btn btn-sm btn-ghost" data-action="edit-member" data-id="${m.id}" type="button">✎</button>
        </div>
      </div>`;
  }

  // ---------- View: Équipe ----------
  function renderEquipe() {
    const cards = state.team.map(m => personCard(m, {})).join('');
    return `
      <div class="page-head">
        <div>
          <span class="eyebrow">Casting permanent</span>
          <h1>L'équipe</h1>
          <p>Active ou mets au repos chaque agent, gère leurs contacts et envoie les invitations. Les agents actifs sont proposés par défaut sur chaque nouveau live.</p>
        </div>
        <div class="page-head-actions">
          <button class="btn btn-twitch" data-action="sync-twitch" type="button">⟳ Sync Twitch</button>
          <button class="btn btn-discord" data-action="discord-setup" type="button">💬 Discord</button>
          <button class="btn btn-primary" data-action="new-member" type="button">＋ Agent</button>
        </div>
      </div>
      <div class="cast-grid">${cards}</div>`;
  }

  // ---------- View: Générateur ----------
  function renderGenerator() {
    const memberPicks = state.team.map(m => `
      <button class="pick ${m.active?'is-on':''}" data-pick="${m.id}" style="--role:${m.color}" type="button">
        ${avatarHtml(m, 'av')}${esc(m.name)}
      </button>`).join('');
    return `
      <div class="page-head">
        <div>
          <span class="eyebrow">Générateur IA</span>
          <h1>Générer un conducteur</h1>
          <p>Décris le live et l'invité : l'IA (Claude) propose des questions d'interview et la trame des segments. Sans clé API, un modèle de conducteur est généré à partir du gabarit SHERKO LIVE.</p>
        </div>
      </div>
      <div class="gen-layout">
        <form class="panel" id="genForm">
          <div class="field">
            <label>Titre du live</label>
            <input class="input" name="title" placeholder="SHERKO LIVE × …" required>
          </div>
          <div class="field-row cols-2">
            <div class="field">
              <label>Invité principal</label>
              <input class="input" name="guest" placeholder="Nom de l'invité" required>
            </div>
            <div class="field">
              <label>Date</label>
              <input class="input" name="date" type="date">
            </div>
          </div>
          <div class="field">
            <label>Lieu</label>
            <input class="input" name="location" placeholder="Adresse du studio">
          </div>
          <div class="field-row cols-3">
            <div class="field"><label>Crew</label><input class="input" name="crew" type="time" value="15:30"></div>
            <div class="field"><label>Invité</label><input class="input" name="guest_time" type="time" value="17:30"></div>
            <div class="field"><label>Live</label><input class="input" name="live_time" type="time" value="18:00"></div>
          </div>
          <div class="field">
            <label>Angle / sujets à creuser</label>
            <textarea class="textarea" name="angle" placeholder="Ex : parcours, dernier projet, inspirations, anecdotes studio, process de création…"></textarea>
          </div>
          <div class="field">
            <label>Agents sur ce live</label>
            <div class="member-pick" id="memberPick">${memberPicks}</div>
          </div>
          <button class="btn btn-primary btn-block btn-lg" type="submit" id="genBtn">✦ Générer le conducteur</button>
          <p class="help">L'IA génère les questions d'interview ; tu pourras tout éditer ensuite.</p>
        </form>
        <div class="gen-preview" id="genPreview">
          <div class="empty">⟵ Remplis le brief puis lance la génération.<br>L'aperçu du conducteur s'affichera ici.</div>
        </div>
      </div>`;
  }

  // =================================================================
  //  GENERATOR LOGIC
  // =================================================================
  let genPicks = new Set(state.team.filter(m => m.active).map(m => m.id));

  function wireGenerator() {
    genPicks = new Set(state.team.filter(m => m.active).map(m => m.id));
    const form = $('#genForm');
    if (!form) return;
    $$('#memberPick .pick').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pick;
        if (genPicks.has(id)) genPicks.delete(id); else genPicks.add(id);
        btn.classList.toggle('is-on');
      });
    });
    form.addEventListener('submit', e => { e.preventDefault(); runGeneration(form); });
  }

  async function runGeneration(form) {
    const fd = new FormData(form);
    const brief = {
      title: (fd.get('title') || '').trim() || `SHERKO LIVE × ${(fd.get('guest')||'invité').toString().trim()}`,
      guest: (fd.get('guest') || '').trim(),
      date: fd.get('date') || '',
      location: (fd.get('location') || '').trim(),
      crew: fd.get('crew') || '15:30',
      guest_time: fd.get('guest_time') || '17:30',
      live_time: fd.get('live_time') || '18:00',
      angle: (fd.get('angle') || '').trim(),
      castIds: [...genPicks],
    };
    if (!brief.guest) { toast('Renseigne l\'invité', 'info'); return; }

    const preview = $('#genPreview');
    const btn = $('#genBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Génération…';
    preview.innerHTML = `<div class="gen-loading"><div class="orb"></div><div>L'IA construit le conducteur de <b>${esc(brief.guest)}</b>…</div></div>`;

    let result, viaAI = false;
    try {
      result = await aiGenerate(brief);
      viaAI = !!result;
    } catch (_) { result = null; }
    if (!result) result = templateGenerate(brief);

    renderGenPreview(brief, result, viaAI);
    btn.disabled = false; btn.innerHTML = '✦ Générer le conducteur';
  }

  // Call serverless Claude endpoint; returns {segments:[...]} or null
  async function aiGenerate(brief) {
    try {
      const res = await fetch('api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && Array.isArray(data.segments) && data.segments.length) return data;
      return null;
    } catch (_) { return null; }
  }

  // Local fallback: builds a SHERKO-LIVE-shaped conductor from the brief
  function templateGenerate(brief) {
    const g = brief.guest || 'l\'invité';
    const angle = brief.angle ? brief.angle.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean) : [];
    const q = (angle.length ? angle : ['parcours', 'inspirations', 'process de création', 'projets à venir'])
      .map(a => `Parle-nous de ${a} — comment ça a façonné ${g} ?`);
    return {
      segments: [
        { num: 1, label: `Introduction + arrivée de ${g}`, dur: 20, blocks: [
          { role: 'SHERKO', title: 'Introduction', items: [
            'SHERKO arrive et lance l\'ambiance du studio.',
            'Découverte du lieu pour les nouveaux du chat.',
            `Teasing de l'arrivée de ${g} et de l'enjeu du live.`,
          ]},
          { role: 'GUEST', title: `Arrivée de ${g}`, items: [
            `${g} arrive sur son track signature. Délire d'accueil puis salutations.`,
            'Premier échange détendu pour casser la glace.',
          ]},
          { role: 'MADARA', title: 'Cues régie', items: [
            'Lancer le jingle d\'intro.', 'Préparer le track d\'entrée invité.', 'Garder le chat visible.',
          ]},
        ]},
        { num: 2, label: `Interview ${g}`, dur: 30, blocks: [
          { role: 'GUEST', title: 'Questions principales', items: q },
          { role: 'SHERKO', title: 'Angle de relance', items: [
            'Rebondir sur les anecdotes, ne pas enchaîner mécaniquement.',
            'Faire respirer après les gros sujets.',
          ]},
          { role: 'MADARA', title: 'Surveillance technique', items: [
            'Caméras propres, niveaux voix stables.', 'Préparer la transition vers la suite.',
          ]},
        ]},
        { num: 3, label: 'React sons chat + clap de fin', dur: 20, blocks: [
          { role: 'GUEST', title: 'Toute l\'équipe', items: [
            'React à une dizaine de tracks avec l\'équipe.',
            `Mot de la fin pour ${g} : c'est quoi la suite ?`,
            'Salutations et clap de FIN.',
          ]},
          { role: 'SHERKO', title: 'Clap de fin', items: [
            'Remercier l\'invité, l\'équipe et le chat.',
            'Rappeler Twitch / prochains lives / réseaux.',
          ]},
          { role: 'MADARA', title: 'Checklist finale', items: [
            'Musiques prêtes, scènes OBS, audio clean, médias en place, sécurité live.',
          ]},
        ]},
      ],
    };
  }

  function renderGenPreview(brief, result, viaAI) {
    const segs = result.segments.map(s => {
      const blocks = s.blocks.map(b => `
        <div class="block" style="--role:${roleColor(b.role)}">
          <div class="block-head"><span class="block-role">${esc(b.role)}</span><span class="block-title">${esc(b.title||'')}</span></div>
          <ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        </div>`).join('');
      return `<section class="segment"><div class="segment-head"><div class="segment-num">${s.num}</div><h3>${esc(s.label)}</h3><span class="seg-time">${s.dur||0}′</span></div><div class="segment-body">${blocks}</div></section>`;
    }).join('');

    const preview = $('#genPreview');
    preview.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        ${viaAI ? '<span class="ai-badge">✦ Généré par Claude</span>' : '<span class="ai-badge" style="color:var(--gold);background:rgba(255,201,60,.12);border-color:rgba(255,201,60,.3)">⚙ Gabarit local</span>'}
        <span class="chip">${result.segments.length} segments</span>
        <span class="spacer" style="flex:1"></span>
        <button class="btn btn-sm btn-primary" id="genSave" type="button">✓ Créer ce live</button>
      </div>
      ${segs}`;
    $('#genSave').addEventListener('click', () => saveGenerated(brief, result));
  }

  function saveGenerated(brief, result) {
    const live = {
      id: uid('live'),
      title: brief.title,
      subtitle: `Talk show avec ${brief.guest}`,
      guest: brief.guest,
      status: 'planifie',
      date: brief.date || '',
      location: brief.location,
      times: { crew: brief.crew, guest: brief.guest_time, live: brief.live_time },
      castIds: brief.castIds.length ? brief.castIds : state.team.filter(m => m.active).map(m => m.id),
      music: [],
      segments: result.segments.map(s => ({
        id: uid('seg'), num: s.num, label: s.label, dur: s.dur || 20,
        blocks: s.blocks.map(b => ({ id: uid('blk'), role: b.role, title: b.title, items: b.items.slice() })),
      })),
    };
    state.lives.unshift(live);
    save();
    toast('Live créé ✓', 'ok');
    navigate('live', { liveId: live.id, tab: 'conducteur' });
  }

  // =================================================================
  //  ACTIONS (event delegation)
  // =================================================================
  document.addEventListener('click', e => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) { navigate(navBtn.dataset.nav); return; }

    const openLive = e.target.closest('[data-open-live]');
    if (openLive) { navigate('live', { liveId: openLive.dataset.openLive, tab: 'conducteur' }); return; }

    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) { view.tab = tabBtn.dataset.tab; render(); return; }

    const actEl = e.target.closest('[data-action]');
    if (actEl) { handleAction(actEl.dataset.action, actEl, e); }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-action="toggle-cast"]')) {
      const live = liveById(t.dataset.live); if (!live) return;
      const id = t.dataset.id;
      live.castIds = live.castIds || [];
      if (t.checked) { if (!live.castIds.includes(id)) live.castIds.push(id); }
      else { live.castIds = live.castIds.filter(x => x !== id); }
      save(); render();
      toast(`${memberById(id).name} ${t.checked ? 'activé sur le live' : 'retiré du live'}`, t.checked ? 'ok' : 'info');
    }
    if (t.matches('[data-action="toggle-active"]')) {
      const m = memberById(t.dataset.id); if (!m) return;
      m.active = t.checked; save(); render();
      toast(`${m.name} ${m.active ? 'activé' : 'mis au repos'}`, m.active ? 'ok' : 'info');
    }
  });

  // Inline editing (conductor)
  document.addEventListener('blur', e => {
    const node = e.target;
    if (!node.dataset || !node.dataset.edit) return;
    const live = liveById(view.liveId); if (!live) return;
    const val = node.textContent.trim();
    if (node.dataset.edit === 'seg-label') {
      const seg = live.segments.find(s => s.id === node.dataset.seg);
      if (seg) { seg.label = val; save(); }
    } else if (node.dataset.edit === 'item') {
      const seg = live.segments.find(s => s.id === node.dataset.seg);
      if (seg) {
        const bi = Number(node.dataset.block);
        const block = seg.blocks[bi] || seg.blocks.find((b,i)=>String(b.id)===node.dataset.block);
        if (block) { block.items[Number(node.dataset.i)] = val; save(); }
      }
    }
  }, true);

  function handleAction(action, node, e) {
    const id = node.dataset.id;
    switch (action) {
      case 'new-live': openLiveModal(); break;
      case 'edit-live': openLiveModal(liveById(id)); break;
      case 'duplicate-live': duplicateLive(id); break;
      case 'status-cycle': cycleStatus(id); break;
      case 'add-segment': addSegment(id); break;
      case 'del-segment': delSegment(id, node.dataset.seg); break;
      case 'copy-conductor': copyConductor(id); break;
      case 'print': window.print(); break;
      case 'new-member': openMemberModal(); break;
      case 'edit-member': openMemberModal(memberById(id)); break;
      case 'edit-profile': openProfileModal(); break;
      case 'invite': openInvite(memberById(id), node.dataset.live); break;
      case 'invite-all': openInviteAll(id); break;
      // Twitch
      case 'open-channel': openChannelModal(); break;
      case 'sync-twitch': syncTwitch({ toast: true }); break;
      // Discord
      case 'discord-setup': openDiscordSetup(); break;
      case 'discord-menu': openDiscordMenu(id); break;
      // Régie / prompteur
      case 'open-regie': openRegie(id); break;
      case 'open-prompter': openPrompter(id); break;
      case 'close-overlay': closeOverlay(); break;
      case 'regie-next': regieGo(regieState.cur + 1); break;
      case 'regie-prev': regieGo(regieState.cur - 1); break;
      case 'regie-set': regieGo(Number(node.dataset.i)); break;
      // Outils live
      case 'check-toggle': toggleCheck(id, node.dataset.key, !!node.dataset.regie); break;
      case 'tool-add': toolAddItem(id, node.dataset.kind); break;
      case 'tool-toggle': toolToggle(id, node.dataset.kind, Number(node.dataset.i)); break;
      case 'tool-del': toolDel(id, node.dataset.kind, Number(node.dataset.i)); break;
      // RSVP
      case 'rsvp': setRsvp(node.dataset.live, node.dataset.id, node.dataset.v); break;
    }
  }

  // ---------- Outils / checklist / rsvp logic ----------
  function toggleCheck(liveId, key, inRegie) {
    const l = liveById(liveId); if (!l) return; ensureExtras(l);
    l.checked[key] = !l.checked[key]; save();
    if (inRegie && regieState) renderRegie(); else render();
  }
  function toolAddItem(liveId, kind) {
    const l = liveById(liveId); if (!l) return; ensureExtras(l);
    const inp = document.querySelector(`[data-tooladd="${kind}"][data-id="${liveId}"]`);
    const v = inp && inp.value.trim(); if (!v) return;
    l.tools[kind].push({ txt: v, done: false }); save(); render();
  }
  function toolToggle(liveId, kind, i) { const l = liveById(liveId); if (!l) return; ensureExtras(l); const it = l.tools[kind][i]; if (it) { it.done = !it.done; save(); render(); } }
  function toolDel(liveId, kind, i) { const l = liveById(liveId); if (!l) return; ensureExtras(l); l.tools[kind].splice(i, 1); save(); render(); }
  function setRsvp(liveId, memberId, v) {
    const l = liveById(liveId); if (!l) return; ensureExtras(l);
    l.rsvp[memberId] = l.rsvp[memberId] === v ? null : v; save(); render();
    toast(`RSVP : ${v === 'yes' ? '✅ confirmé' : v === 'maybe' ? '🤔 peut-être' : '❌ absent'}`, 'info');
  }

  // ---------- Live CRUD ----------
  function duplicateLive(id) {
    const src = liveById(id); if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid('live');
    copy.title = src.title + ' (copie)';
    copy.status = 'brouillon';
    copy.segments.forEach(s => { s.id = uid('seg'); (s.blocks||[]).forEach(b => b.id = uid('blk')); });
    state.lives.unshift(copy);
    save();
    toast('Live dupliqué ✓', 'ok');
    navigate('live', { liveId: copy.id, tab: 'conducteur' });
  }

  function cycleStatus(id) {
    const l = liveById(id); if (!l) return;
    const order = ['brouillon', 'planifie', 'live', 'termine'];
    l.status = order[(order.indexOf(l.status) + 1) % order.length];
    save(); render();
    toast(`Statut : ${STATUS[l.status].label}`, 'info');
  }

  function addSegment(id) {
    const l = liveById(id); if (!l) return;
    const num = (l.segments?.length || 0) + 1;
    l.segments.push({ id: uid('seg'), num, label: `Nouveau segment ${num}`, dur: 15,
      blocks: [{ id: uid('blk'), role: 'SHERKO', title: 'À compléter', items: ['Point à définir…'] }] });
    save(); render();
    toast('Segment ajouté', 'ok');
  }

  function delSegment(id, segId) {
    const l = liveById(id); if (!l) return;
    l.segments = l.segments.filter(s => s.id !== segId);
    l.segments.forEach((s, i) => s.num = i + 1);
    save(); render();
    toast('Segment supprimé', 'info');
  }

  function copyConductor(id) {
    const l = liveById(id); if (!l) return;
    let txt = `${l.title}\n${fmtDate(l)} · ${l.location}\nCrew ${l.times?.crew} · Invité ${l.times?.guest} · Live ${l.times?.live}\n\n`;
    let clock = l.times?.live || '18:00';
    l.segments.forEach(seg => {
      const start = clock; const end = addMinutes(clock, seg.dur || 0); clock = end;
      txt += `\n■ ${seg.num}. ${seg.label.toUpperCase()}  (${start}–${end})\n`;
      (seg.blocks || []).forEach(b => {
        txt += `\n  ${b.role} — ${b.title}\n`;
        (b.items || []).forEach(it => { txt += `   • ${it}\n`; });
      });
    });
    copyText(txt, 'Conducteur copié ✓');
  }

  // =================================================================
  //  MODALS
  // =================================================================
  const modalHost = $('#modalHost');

  function openModal(html) {
    modalHost.innerHTML = `<div class="modal">${html}</div>`;
    modalHost.hidden = false;
  }
  function closeModal() { modalHost.hidden = true; modalHost.innerHTML = ''; }
  modalHost.addEventListener('click', e => { if (e.target === modalHost) closeModal(); });
  modalHost.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });

  // ---------- Live modal (create / edit) ----------
  function openLiveModal(live) {
    const isEdit = !!live;
    const l = live || { title: '', guest: '', date: '', location: '', times: { crew: '15:30', guest: '17:30', live: '18:00' }, status: 'brouillon', castIds: state.team.filter(m=>m.active).map(m=>m.id) };
    const picks = state.team.map(m => `
      <button class="pick ${(l.castIds||[]).includes(m.id)?'is-on':''}" data-mpick="${m.id}" style="--role:${m.color}" type="button">
        ${avatarHtml(m, 'av')}${esc(m.name)}
      </button>`).join('');
    openModal(`
      <div class="modal-head"><h2>${isEdit?'Modifier le live':'Nouveau live'}</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body">
        <form id="liveForm">
          <div class="field"><label>Titre</label><input class="input" name="title" value="${esc(l.title)}" placeholder="SHERKO LIVE × …" required></div>
          <div class="field-row cols-2">
            <div class="field"><label>Invité</label><input class="input" name="guest" value="${esc(l.guest)}" placeholder="Nom" required></div>
            <div class="field"><label>Date</label><input class="input" name="date" type="date" value="${esc(l.date)}"></div>
          </div>
          <div class="field"><label>Lieu</label><input class="input" name="location" value="${esc(l.location)}" placeholder="Adresse du studio"></div>
          <div class="field-row cols-3">
            <div class="field"><label>Crew</label><input class="input" name="crew" type="time" value="${esc(l.times?.crew||'15:30')}"></div>
            <div class="field"><label>Invité</label><input class="input" name="guest_time" type="time" value="${esc(l.times?.guest||'17:30')}"></div>
            <div class="field"><label>Live</label><input class="input" name="live_time" type="time" value="${esc(l.times?.live||'18:00')}"></div>
          </div>
          <div class="field"><label>Casting</label><div class="member-pick" id="liveModalPick">${picks}</div></div>
        </form>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-close type="button">Annuler</button>
        <button class="btn btn-primary" id="liveSave" type="button">${isEdit?'Enregistrer':'Créer le live'}</button>
      </div>`);

    const sel = new Set(l.castIds || []);
    $$('#liveModalPick .pick').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.mpick;
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      b.classList.toggle('is-on');
    }));
    $('#liveSave').addEventListener('click', () => {
      const f = $('#liveForm');
      const fd = new FormData(f);
      const title = (fd.get('title')||'').toString().trim();
      const guest = (fd.get('guest')||'').toString().trim();
      if (!title || !guest) { toast('Titre et invité requis', 'info'); return; }
      const data = {
        title, guest,
        date: fd.get('date') || '',
        location: (fd.get('location')||'').toString().trim(),
        times: { crew: fd.get('crew'), guest: fd.get('guest_time'), live: fd.get('live_time') },
        castIds: [...sel],
      };
      if (isEdit) {
        Object.assign(live, data);
        toast('Live mis à jour ✓', 'ok');
      } else {
        const nl = { id: uid('live'), subtitle: `Talk show avec ${guest}`, status: 'planifie', music: [],
          segments: templateGenerate({ guest, angle: '' }).segments.map(s => ({
            id: uid('seg'), num: s.num, label: s.label, dur: s.dur,
            blocks: s.blocks.map(b => ({ id: uid('blk'), role: b.role, title: b.title, items: b.items.slice() })) })),
          ...data };
        state.lives.unshift(nl);
        closeModal(); save(); toast('Live créé ✓', 'ok');
        navigate('live', { liveId: nl.id, tab: 'conducteur' }); return;
      }
      closeModal(); save(); render();
    });
  }

  // ---------- Profile modal (HUB SHERKO) ----------
  function openProfileModal() {
    const p = state.settings.profile;
    const socialFields = SOCIALS.map(s => {
      const d = p.socials[s.k] || {};
      return `<div class="field-row cols-2" style="margin-bottom:10px">
        <div class="field" style="margin:0"><label>${s.label} — pseudo</label><input class="input" data-soc="${s.k}" data-f="handle" value="${esc(d.handle||'')}" placeholder="${s.pre}pseudo"></div>
        <div class="field" style="margin:0"><label>${s.label} — abonnés</label><input class="input" data-soc="${s.k}" data-f="followers" value="${d.followers!=null?esc(d.followers):''}" placeholder="ex : 32000" inputmode="numeric"></div>
      </div>`;
    }).join('');
    openModal(`
      <div class="modal-head"><h2>Profil de ${esc(p.name)}</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body">
        <div class="field"><label>Photo (sinon photo Twitch auto)</label>
          <div class="photo-edit">
            <span class="photo-preview" id="pfPrev">${profileAvatar()?`<img src="${esc(profileAvatar())}" alt="">`:`<span class="avatar" style="background:${esc(p.accent)};border-radius:14px">${esc((p.name||'S')[0])}</span>`}</span>
            <div class="photo-edit-actions">
              <label class="btn btn-sm" style="cursor:pointer">📷 Importer<input type="file" id="pfFile" accept="image/*" hidden></label>
              <input class="input" id="pfUrl" placeholder="…ou URL d'image" value="${p.avatar&&/^https?:/.test(p.avatar)?esc(p.avatar):''}">
            </div>
          </div>
        </div>
        <div class="field-row cols-2">
          <div class="field"><label>Nom</label><input class="input" id="pfName" value="${esc(p.name)}"></div>
          <div class="field"><label>Ville</label><input class="input" id="pfCity" value="${esc(p.city||'')}"></div>
        </div>
        <div class="field"><label>Accroche</label><input class="input" id="pfTag" value="${esc(p.tagline||'')}"></div>
        <div class="field"><label>Bio</label><textarea class="textarea" id="pfBio">${esc(p.bio||'')}</textarea></div>
        <div class="field"><label>Couleur d'accent</label><input class="input" id="pfAccent" type="text" value="${esc(p.accent||'#9146FF')}" placeholder="#9146FF"></div>
        <div class="panel-title" style="margin-top:8px">Réseaux</div>
        ${socialFields}
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-close type="button">Annuler</button>
        <button class="btn btn-primary" id="pfSave" type="button">Enregistrer</button>
      </div>`);

    let pfPhoto = p.avatar || null;
    const prev = $('#pfPrev');
    const refresh = () => { prev.innerHTML = pfPhoto ? `<img src="${pfPhoto}" alt="">` : `<span class="avatar" style="background:${$('#pfAccent').value||p.accent};border-radius:14px">${esc(($('#pfName').value||'S')[0])}</span>`; };
    $('#pfFile').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      if (f.size > 3.5*1024*1024) { toast('Image trop lourde (max 3,5 Mo)', 'info'); return; }
      const r = new FileReader(); r.onload = () => { pfPhoto = r.result; refresh(); }; r.readAsDataURL(f);
    });
    $('#pfUrl').addEventListener('change', () => { const v = $('#pfUrl').value.trim(); if (v && /^https?:\/\//.test(v)) { pfPhoto = v; refresh(); } });
    $('#pfSave').addEventListener('click', () => {
      p.name = $('#pfName').value.trim() || p.name;
      p.city = $('#pfCity').value.trim();
      p.tagline = $('#pfTag').value.trim();
      p.bio = $('#pfBio').value.trim();
      p.accent = $('#pfAccent').value.trim() || '#9146FF';
      p.avatar = pfPhoto || null;
      modalHost.querySelectorAll('[data-soc]').forEach(inp => {
        const k = inp.dataset.soc, f = inp.dataset.f;
        p.socials[k] = p.socials[k] || { handle: '', url: '', followers: null };
        if (f === 'handle') {
          const h = inp.value.trim().replace(/^@/, '');
          p.socials[k].handle = h;
          if (h) {
            const base = { twitch: 'https://twitch.tv/', instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@', x: 'https://x.com/', youtube: 'https://youtube.com/@', discord: '' }[k];
            if (base) p.socials[k].url = base + h;
          } else if (k !== 'discord') p.socials[k].url = '';
        } else if (f === 'followers') {
          const n = parseInt(inp.value.replace(/[^0-9]/g, ''), 10);
          p.socials[k].followers = isNaN(n) ? null : n;
        }
      });
      // keep twitch channel in sync for live status
      if (p.socials.twitch?.handle) state.settings.channel = p.socials.twitch.handle;
      save(); closeModal(); render(); syncTwitch({ rerender: true });
      toast('Profil mis à jour ✓', 'ok');
    });
  }

  // ---------- Member modal (create / edit) ----------
  function openMemberModal(member) {
    const isEdit = !!member;
    const m = member || { name: '', role: '', tag: '', av: '', color: 'var(--c-guest)', contact: { handle: '', phone: '', email: '' }, active: true };
    const colorOpts = [
      ['var(--c-sherko)','Violet'], ['var(--c-benjay)','Or'], ['var(--c-jdos)','Cyan'],
      ['var(--c-diwiid)','Vert'], ['var(--c-madara)','Magenta'], ['var(--c-guest)','Orange'],
    ].map(([c,n]) => `<option value="${c}" ${m.color===c?'selected':''}>${n}</option>`).join('');
    openModal(`
      <div class="modal-head"><h2>${isEdit?'Modifier l\'agent':'Nouvel agent'}</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body">
        <form id="memberForm">
          <div class="field">
            <label>Photo</label>
            <div class="photo-edit">
              <span class="photo-preview" id="photoPreview">${m.photo ? `<img src="${esc(m.photo)}" alt="">` : `<span class="avatar" style="background:${m.color};border-radius:14px">${esc(m.av||'?')}</span>`}</span>
              <div class="photo-edit-actions">
                <label class="btn btn-sm" style="cursor:pointer">📷 Importer<input type="file" id="photoFile" accept="image/*" hidden></label>
                <input class="input" id="photoUrl" placeholder="…ou coller une URL d'image" value="${m.photo && /^https?:/.test(m.photo) ? esc(m.photo) : ''}">
                ${m.photo ? '<button class="btn btn-sm btn-ghost" id="photoClear" type="button">Retirer</button>' : ''}
              </div>
            </div>
            <p class="help">L'image est stockée localement sur cet appareil (aperçu rond). Sans photo, l'initiale colorée est utilisée.</p>
          </div>
          <div class="field-row cols-2">
            <div class="field"><label>Nom</label><input class="input" name="name" value="${esc(m.name)}" placeholder="SHERKO" required></div>
            <div class="field"><label>Initiale / emoji</label><input class="input" name="av" value="${esc(m.av)}" maxlength="2" placeholder="S"></div>
          </div>
          <div class="field-row cols-2">
            <div class="field"><label>Rôle</label><input class="input" name="role" value="${esc(m.role)}" placeholder="Host"></div>
            <div class="field"><label>Couleur</label><select class="select" name="color">${colorOpts}</select></div>
          </div>
          <div class="field"><label>Mission</label><textarea class="textarea" name="tag" placeholder="Ce que fait l'agent…">${esc(m.tag)}</textarea></div>
          <div class="field-row cols-2">
            <div class="field"><label>Pseudo Twitch</label><input class="input" name="twitch" value="${esc(m.twitch||'')}" placeholder="sherko27"></div>
            <div class="field"><label>Discord (mention/ID)</label><input class="input" name="discord" value="${esc(m.discord||'')}" placeholder="123456789012345678"></div>
          </div>
          <p class="help" style="margin-top:-6px;margin-bottom:14px">Le pseudo Twitch récupère automatiquement la photo de profil et le statut live. L'ID Discord permet de mentionner l'agent dans les annonces.</p>
          <div class="field-row cols-3">
            <div class="field"><label>Pseudo</label><input class="input" name="handle" value="${esc(m.contact?.handle||'')}" placeholder="@…"></div>
            <div class="field"><label>Téléphone</label><input class="input" name="phone" value="${esc(m.contact?.phone||'')}" placeholder="06…"></div>
            <div class="field"><label>Email</label><input class="input" name="email" value="${esc(m.contact?.email||'')}" placeholder="@"></div>
          </div>
        </form>
      </div>
      <div class="modal-foot">
        ${isEdit?'<button class="btn btn-danger" id="memberDel" type="button">Supprimer</button>':''}
        <button class="btn btn-primary" id="memberSave" type="button">${isEdit?'Enregistrer':'Ajouter'}</button>
      </div>`);

    // ---- Photo handling ----
    let photoData = m.photo || null;
    const preview = $('#photoPreview');
    const setPreview = () => {
      const col = ($('select[name=color]') || {}).value || m.color || 'var(--c-guest)';
      const initial = (($('input[name=av]') || {}).value) || m.av || '?';
      preview.innerHTML = photoData ? `<img src="${photoData}" alt="">` : `<span class="avatar" style="background:${col};border-radius:14px">${esc(initial)}</span>`;
    };
    const fileInput = $('#photoFile');
    if (fileInput) fileInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 3.5 * 1024 * 1024) { toast('Image trop lourde (max 3,5 Mo)', 'info'); return; }
      const reader = new FileReader();
      reader.onload = () => { photoData = reader.result; setPreview(); };
      reader.readAsDataURL(file);
    });
    const urlInput = $('#photoUrl');
    if (urlInput) urlInput.addEventListener('change', () => {
      const v = urlInput.value.trim();
      if (v && /^https?:\/\//.test(v)) { photoData = v; setPreview(); }
      else if (!v && photoData && /^https?:/.test(photoData)) { photoData = null; setPreview(); }
    });
    const clearBtn = $('#photoClear');
    if (clearBtn) clearBtn.addEventListener('click', () => { photoData = null; if (urlInput) urlInput.value=''; setPreview(); });

    $('#memberSave').addEventListener('click', () => {
      const fd = new FormData($('#memberForm'));
      const name = (fd.get('name')||'').toString().trim();
      if (!name) { toast('Nom requis', 'info'); return; }
      const data = {
        name, role: (fd.get('role')||'').toString().trim(),
        av: (fd.get('av')||name[0]||'?').toString().trim(),
        color: fd.get('color'), tag: (fd.get('tag')||'').toString().trim(),
        photo: photoData || null,
        twitch: (fd.get('twitch')||'').toString().trim().replace(/^@/, ''),
        discord: (fd.get('discord')||'').toString().trim(),
        contact: { handle: (fd.get('handle')||'').toString().trim(), phone: (fd.get('phone')||'').toString().trim(), email: (fd.get('email')||'').toString().trim() },
      };
      if (isEdit) { Object.assign(member, data); toast('Agent mis à jour ✓', 'ok'); }
      else { state.team.push({ id: uid('m'), active: true, ...data }); toast('Agent ajouté ✓', 'ok'); }
      closeModal(); save(); render();
    });
    const del = $('#memberDel');
    if (del) del.addEventListener('click', () => {
      state.team = state.team.filter(x => x.id !== member.id);
      state.lives.forEach(l => { l.castIds = (l.castIds||[]).filter(x => x !== member.id); });
      closeModal(); save(); render();
      toast('Agent supprimé', 'info');
    });
  }

  // =================================================================
  //  INVITES
  // =================================================================
  function inviteText(m, live) {
    const l = live ? liveById(live) : null;
    if (l) {
      return `Salut ${m.name} 👋\n\nTu es casté·e sur le live "${l.title}" 🎬\n📅 ${fmtDate(l)}\n📍 ${l.location || 'lieu à confirmer'}\n🕐 Crew ${l.times?.crew} · ${m.name==='MADARA'?'régie':'arrivée'} ${l.times?.guest} · LIVE ${l.times?.live}\n🎙️ Ton rôle : ${m.role} — ${m.tag}\n\nTu confirmes ta présence ? 🔥`;
    }
    return `Salut ${m.name} 👋\n\nOn te veut sur le prochain SHERKO LIVE 🎬\nTon rôle : ${m.role} — ${m.tag}\n\nDispo ? 🔥`;
  }

  function openInvite(m, liveId) {
    if (!m) return;
    const txt = inviteText(m, liveId);
    const phone = (m.contact?.phone || '').replace(/[^0-9+]/g, '');
    const wa = phone ? `https://wa.me/${phone.replace(/^\+/,'').replace(/^0/,'33')}?text=${encodeURIComponent(txt)}` : `https://wa.me/?text=${encodeURIComponent(txt)}`;
    const mail = m.contact?.email ? `mailto:${m.contact.email}?subject=${encodeURIComponent('Invitation SHERKO LIVE')}&body=${encodeURIComponent(txt)}` : '';
    openModal(`
      <div class="modal-head"><h2>Inviter ${esc(m.name)}</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body">
        <div class="field"><label>Message d'invitation</label><textarea class="textarea" id="inviteTxt" style="min-height:170px">${esc(txt)}</textarea></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn btn-green" href="${wa}" target="_blank" rel="noopener" style="flex:1">📲 WhatsApp</a>
          ${mail?`<a class="btn" href="${mail}" style="flex:1">✉ Email</a>`:''}
          <button class="btn btn-ghost" id="inviteCopy" type="button" style="flex:1">⧉ Copier</button>
        </div>
        <p class="help">${phone?'WhatsApp pré-rempli avec le numéro de l\'agent.':'Aucun numéro enregistré — WhatsApp s\'ouvrira pour choisir le contact.'} Renseigne les coordonnées dans la fiche agent pour automatiser.</p>
      </div>`);
    $('#inviteCopy').addEventListener('click', () => copyText($('#inviteTxt').value, 'Invitation copiée ✓'));
  }

  function openInviteAll(liveId) {
    const l = liveById(liveId); if (!l) return;
    const cast = (l.castIds || []).map(memberById).filter(Boolean);
    if (!cast.length) { toast('Aucun agent sur ce live', 'info'); return; }
    const rows = cast.map(m => {
      const phone = (m.contact?.phone || '').replace(/[^0-9+]/g, '');
      const wa = phone ? `https://wa.me/${phone.replace(/^\+/,'').replace(/^0/,'33')}?text=${encodeURIComponent(inviteText(m, liveId))}` : `https://wa.me/?text=${encodeURIComponent(inviteText(m, liveId))}`;
      return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)">
        ${avatarHtml(m, 'avatar', 'width:38px;height:38px;font-size:15px')}
        <div style="flex:1"><div style="font-weight:700">${esc(m.name)}</div><div class="muted" style="font-size:12px">${esc(m.role)}</div></div>
        <a class="btn btn-sm btn-green" href="${wa}" target="_blank" rel="noopener">📲 Inviter</a>
      </div>`;
    }).join('');
    openModal(`
      <div class="modal-head"><h2>Inviter le casting</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body">
        <p class="muted" style="font-size:13px;margin-bottom:8px">${cast.length} agents sur « ${esc(l.title)} ». Envoie l'invitation à chacun :</p>
        ${rows}
        <button class="btn btn-ghost btn-block" id="copyAll" type="button" style="margin-top:16px">⧉ Copier tous les messages</button>
      </div>`);
    $('#copyAll').addEventListener('click', () => {
      const all = cast.map(m => `— ${m.name} —\n${inviteText(m, liveId)}`).join('\n\n');
      copyText(all, 'Tous les messages copiés ✓');
    });
  }

  // =================================================================
  //  UTILITIES
  // =================================================================
  function copyText(txt, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => toast(msg || 'Copié ✓', 'ok')).catch(() => fallbackCopy(txt, msg));
    } else fallbackCopy(txt, msg);
  }
  function fallbackCopy(txt, msg) {
    const ta = el('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(msg || 'Copié ✓', 'ok'); } catch (_) { toast('Copie impossible', 'info'); }
    document.body.removeChild(ta);
  }

  const toastHost = $('#toastHost');
  function toast(msg, type = 'ok') {
    const ico = type === 'ok' ? '✓' : type === 'err' ? '✕' : 'ℹ';
    const t = el('div', `toast ${type}`, `<span class="ico">${ico}</span><span>${esc(msg)}</span>`);
    toastHost.appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 320); }, 2600);
  }

  // ---------- Live clock ----------
  function tickClock() {
    const now = new Date();
    const c = $('#liveClock');
    if (c) c.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  tickClock(); setInterval(tickClock, 30000);

  // =================================================================
  //  TWITCH — sync photos + statut live (vraie API)
  // =================================================================
  function twitchLogins() {
    const set = new Set();
    state.team.forEach(m => { if (m.twitch) set.add(String(m.twitch).toLowerCase().replace(/^@/, '')); });
    if (state.settings.channel) set.add(String(state.settings.channel).toLowerCase().replace(/^@/, ''));
    return [...set];
  }
  let twitchSyncing = false;
  async function syncTwitch(opts = {}) {
    const logins = twitchLogins();
    if (!logins.length) { if (opts.toast) toast('Aucun pseudo Twitch renseigné', 'info'); return; }
    twitchSyncing = true; updateChanStatus();
    try {
      const res = await fetch('api/twitch', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logins, want: ['status', 'schedule', 'clips'], channel: state.settings.channel }) });
      if (res.ok) {
        const data = await res.json();
        Object.entries(data.users || {}).forEach(([k, v]) => { twitchCache[k.toLowerCase()] = v; });
        twitchCache.__extra = { schedule: data.schedule, clips: data.clips, source: data.source };
        if (opts.toast) toast(`Twitch synchronisé (${data.source})`, 'ok');
      } else if (opts.toast) toast('Sync Twitch indisponible', 'info');
    } catch (_) { if (opts.toast) toast('Twitch injoignable', 'info'); }
    twitchSyncing = false; updateChanStatus();
    if (opts.rerender !== false) render();
  }
  function channelData() { return twData(state.settings.channel); }
  function updateChanStatus() {
    const node = $('#chanStatus'); if (!node) return;
    const c = channelData(); const txt = node.querySelector('.cs-txt');
    if (twitchSyncing) { node.classList.remove('is-live'); if (txt) txt.textContent = 'Sync…'; return; }
    if (c && c.live) { node.classList.add('is-live'); if (txt) txt.textContent = `LIVE · ${c.viewers || 0}`; }
    else { node.classList.remove('is-live'); if (txt) txt.textContent = state.settings.channel || 'Twitch'; }
  }

  // ---------- Channel modal (Twitch live, schedule, clips, réglages) ----------
  function openChannelModal() {
    const c = channelData();
    const extra = twitchCache.__extra || {};
    const ch = state.settings.channel || '';
    const liveBanner = ch ? (c && c.live
      ? `<div class="tw-live-banner"><span class="av">${c.avatar ? `<img src="${esc(c.avatar)}">` : ''}</span>
           <div style="flex:1"><div style="font-weight:800;color:var(--magenta)">🔴 EN LIVE — ${esc(c.viewers||0)} viewers</div>
           <div style="font-size:13px;color:var(--ink-2)">${esc(c.title||'')}${c.game?' · '+esc(c.game):''}</div></div>
           <a class="btn btn-sm btn-twitch" href="https://twitch.tv/${esc(ch)}" target="_blank" rel="noopener">Ouvrir</a></div>`
      : `<div class="tw-live-banner off"><span class="av">${c && c.avatar ? `<img src="${esc(c.avatar)}">` : ''}</span>
           <div style="flex:1"><div style="font-weight:700">${esc(c && c.display_name || ch)} · hors ligne</div>
           <div style="font-size:13px;color:var(--ink-3)">${c && c.followers != null ? esc(c.followers)+' followers' : 'Lance une sync pour les infos'}</div></div>
           <a class="btn btn-sm btn-ghost" href="https://twitch.tv/${esc(ch)}" target="_blank" rel="noopener">Ouvrir</a></div>`)
      : '<p class="muted" style="font-size:13px">Renseigne le nom de la chaîne pour activer le suivi live.</p>';
    const clips = (extra.clips || []).slice(0, 6).map(cl => `
      <a class="clip" href="${esc(cl.url)}" target="_blank" rel="noopener">
        <img src="${esc((cl.thumb||'').replace('%{width}','320').replace('%{height}','180'))}" alt="" loading="lazy">
        <div class="meta"><h5>${esc(cl.title)}</h5><div class="v">▶ ${esc(cl.views||0)} vues</div></div>
      </a>`).join('');
    openModal(`
      <div class="modal-head"><h2>Chaîne Twitch</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body">
        <div class="tw-channel">
          ${liveBanner}
          <div class="field" style="margin-top:6px"><label>Nom de la chaîne</label>
            <input class="input" id="chanInput" value="${esc(ch)}" placeholder="sherko27"></div>
          ${clips ? `<div><div class="panel-title">Derniers clips</div><div class="clip-grid">${clips}</div></div>` : ''}
          ${extra.source === 'decapi' ? '<p class="help">Mode zéro-config (decapi.me). Pour viewers exacts, schedule et clips : ajoute <b>TWITCH_CLIENT_ID</b> + <b>TWITCH_CLIENT_SECRET</b> sur Vercel.</p>' : ''}
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-twitch" id="chanSync" type="button">⟳ Synchroniser</button>
        <button class="btn btn-primary" id="chanSave" type="button">Enregistrer</button>
      </div>`);
    $('#chanSave').addEventListener('click', () => {
      state.settings.channel = ($('#chanInput').value || '').trim().replace(/^@/, '');
      save(); closeModal(); syncTwitch({ toast: true });
    });
    $('#chanSync').addEventListener('click', () => { state.settings.channel = ($('#chanInput').value || '').trim().replace(/^@/, ''); save(); closeModal(); syncTwitch({ toast: true }); });
  }

  // =================================================================
  //  DISCORD — intégration webhook
  // =================================================================
  async function discordPost(type, payload, content) {
    const webhook = state.settings.discordWebhook;
    if (!webhook) { openDiscordSetup(); return false; }
    try {
      const res = await fetch('api/discord', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook, type, payload, content }) });
      if (res.ok) { toast('Envoyé sur Discord ✓', 'ok'); return true; }
      const e = await res.json().catch(() => ({}));
      toast('Discord : ' + (e.message || e.error || 'échec'), 'err'); return false;
    } catch (_) { toast('Discord injoignable (déploie sur Vercel)', 'err'); return false; }
  }
  function discordMentions(l) {
    return (l.castIds || []).map(memberById).filter(Boolean)
      .map(m => m.discord ? `<@${String(m.discord).replace(/[<@>!]/g, '')}>` : '').filter(Boolean).join(' ');
  }
  function liveAnnouncePayload(l) {
    const cast = (l.castIds || []).map(memberById).filter(Boolean);
    return { title: l.title, subtitle: l.subtitle, guest: l.guest, dateText: fmtDate(l),
      liveTime: l.times?.live, location: l.location, cast: cast.map(m => m.name).join(' · '),
      channelUrl: state.settings.channel ? `https://twitch.tv/${state.settings.channel}` : '' };
  }
  function conductorPayload(l) {
    let clock = l.times?.live || '18:00';
    const segments = (l.segments || []).map(seg => {
      const start = clock; const end = addMinutes(clock, seg.dur || 0); clock = end;
      const lines = [];
      (seg.blocks || []).forEach(b => (b.items || []).slice(0, 3).forEach(it => lines.push(`${b.role}: ${it}`)));
      return { num: seg.num, label: seg.label, time: `${start}–${end}`, lines: lines.slice(0, 6) };
    });
    return { title: l.title, dateText: fmtDate(l), location: l.location, segments };
  }
  function openDiscordSetup() {
    const w = state.settings.discordWebhook || '';
    openModal(`
      <div class="modal-head"><h2>Connexion Discord</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body">
        <div class="field"><label>URL du webhook Discord</label>
          <input class="input" id="dwHook" value="${esc(w)}" placeholder="https://discord.com/api/webhooks/…"></div>
        <p class="help">Dans Discord : <b>Paramètres du salon → Intégrations → Webhooks → Nouveau webhook → Copier l'URL</b>. Tout reste local à cet appareil.</p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" id="dwTest" type="button">Tester</button>
        <button class="btn btn-discord" id="dwSave" type="button">Enregistrer</button>
      </div>`);
    const read = () => ($('#dwHook').value || '').trim();
    $('#dwSave').addEventListener('click', () => {
      state.settings.discordWebhook = read(); save(); closeModal();
      toast(state.settings.discordWebhook ? 'Discord connecté ✓' : 'Webhook retiré', 'ok');
    });
    $('#dwTest').addEventListener('click', async () => {
      state.settings.discordWebhook = read(); save();
      await discordPost('test', {});
    });
  }
  // Choix de l'action Discord pour un live
  function openDiscordMenu(liveId) {
    const l = liveById(liveId); if (!l) return;
    if (!state.settings.discordWebhook) { openDiscordSetup(); return; }
    openModal(`
      <div class="modal-head"><h2>Discord — ${esc(l.title)}</h2><button class="icon-btn" data-close type="button">✕</button></div>
      <div class="modal-body" style="display:grid;gap:10px">
        <button class="btn btn-discord btn-block" data-dc="announce" type="button">📣 Annoncer le live</button>
        <button class="btn btn-discord btn-block" data-dc="golive" type="button">🔴 Notifier « ON EST EN LIVE »</button>
        <button class="btn btn-block" data-dc="conductor" type="button">📋 Envoyer le conducteur</button>
        <button class="btn btn-block" data-dc="planning" type="button">🗓️ Envoyer le planning</button>
        <button class="btn btn-block" data-dc="invite" type="button">✉️ Inviter le casting (avec mentions)</button>
        <button class="btn btn-ghost btn-block" data-dc="setup" type="button">⚙️ Réglages webhook</button>
      </div>`);
    modalHost.querySelectorAll('[data-dc]').forEach(b => b.addEventListener('click', async () => {
      const k = b.dataset.dc;
      if (k === 'setup') { openDiscordSetup(); return; }
      b.disabled = true; b.innerHTML = '<span class="spinner"></span>';
      if (k === 'announce') await discordPost('announce', liveAnnouncePayload(l), discordMentions(l) || undefined);
      else if (k === 'golive') await discordPost('golive', { ...liveAnnouncePayload(l), viewers: (channelData()||{}).viewers }, `@everyone ${discordMentions(l)}`.trim());
      else if (k === 'conductor') await discordPost('conductor', conductorPayload(l));
      else if (k === 'planning') await discordPost('planning', planningPayload(l));
      else if (k === 'invite') await discordPost('invite', { liveTitle: l.title, dateText: fmtDate(l), message: `Casting du live ${l.title} — confirmez votre présence !` }, discordMentions(l) || undefined);
      closeModal();
    }));
  }
  function planningPayload(l) {
    const items = [];
    if (l.times?.crew) items.push({ time: l.times.crew, title: 'Arrivée crew' });
    if (l.times?.guest) items.push({ time: l.times.guest, title: `Arrivée ${l.guest||'invité'}` });
    if (l.times?.live) items.push({ time: l.times.live, title: 'DÉBUT DU LIVE' });
    let clock = l.times?.live || '18:00';
    (l.segments || []).forEach(s => { const st = clock; clock = addMinutes(clock, s.dur || 0); items.push({ time: st, title: `${s.num}. ${s.label}`, desc: `${s.dur||0} min` }); });
    items.push({ time: clock, title: 'Clap de fin' });
    return { title: l.title, items };
  }

  // =================================================================
  //  OUTILS LIVE — checklist cochable · sons à react · questions chat
  // =================================================================
  function ensureExtras(l) { l.tools = l.tools || { sounds: [], questions: [] }; l.checked = l.checked || {}; l.rsvp = l.rsvp || {}; }
  function checklistItems(l) {
    const out = [];
    (l.segments || []).forEach(seg => (seg.blocks || []).forEach((b, bi) => {
      if (b.role === 'MADARA') (b.items || []).forEach((it, ii) => out.push({ key: `${seg.id}::${bi}::${ii}`, text: it, seg: seg.num }));
    }));
    return out;
  }
  function renderTools(l) {
    ensureExtras(l);
    const checks = checklistItems(l);
    const done = checks.filter(c => l.checked[c.key]).length;
    const pct = checks.length ? Math.round(done / checks.length * 100) : 0;
    const checkRows = checks.map(c => `
      <div class="tool-item ${l.checked[c.key]?'done':''}">
        <button class="check ${l.checked[c.key]?'on':''}" data-action="check-toggle" data-id="${l.id}" data-key="${esc(c.key)}" type="button">✓</button>
        <span class="t">${esc(c.text)}</span>
      </div>`).join('') || '<p class="muted" style="font-size:13px">Aucune ligne MADARA dans le conducteur.</p>';
    const soundRows = (l.tools.sounds||[]).map((s, i) => toolRow(l, 'sounds', i, s)).join('') || '<p class="muted" style="font-size:13px">Ajoute les sons à react avec le chat.</p>';
    const qRows = (l.tools.questions||[]).map((s, i) => toolRow(l, 'questions', i, s)).join('') || '<p class="muted" style="font-size:13px">Collecte ici les questions du chat.</p>';
    return `
      <div class="panel">
        <div class="panel-title">✅ Checklist régie · ${done}/${checks.length}</div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="tool-list" style="margin-top:12px">${checkRows}</div>
      </div>
      <div class="panel">
        <div class="panel-title">🔊 Sons à react</div>
        <div class="tool-list" id="soundsList">${soundRows}</div>
        ${toolAdd(l,'sounds','Titre du son / artiste…')}
      </div>
      <div class="panel">
        <div class="panel-title">💬 Questions du chat</div>
        <div class="tool-list" id="qList">${qRows}</div>
        ${toolAdd(l,'questions','Question remontée par le chat…')}
      </div>`;
  }
  function toolRow(l, kind, i, item) {
    return `<div class="tool-item ${item.done?'done':''}">
      <button class="check ${item.done?'on':''}" data-action="tool-toggle" data-id="${l.id}" data-kind="${kind}" data-i="${i}" type="button">✓</button>
      <span class="t">${esc(item.txt)}</span>
      <button class="icon-btn" style="width:30px;height:30px" data-action="tool-del" data-id="${l.id}" data-kind="${kind}" data-i="${i}" type="button">✕</button>
    </div>`;
  }
  function toolAdd(l, kind, ph) {
    return `<div style="display:flex;gap:8px;margin-top:10px">
      <input class="input" id="ta_${kind}" placeholder="${ph}" data-tooladd="${kind}" data-id="${l.id}">
      <button class="btn btn-sm" data-action="tool-add" data-id="${l.id}" data-kind="${kind}" type="button">＋</button>
    </div>`;
  }

  // =================================================================
  //  RÉGIE LIVE (overlay plein écran)
  // =================================================================
  const overlayHost = $('#overlayHost');
  let regieTimer = null, regieState = null;
  function openRegie(liveId) {
    const l = liveById(liveId); if (!l) return;
    ensureExtras(l);
    regieState = { liveId, cur: 0, segStart: Date.now(), globalStart: Date.now() };
    renderRegie();
    overlayHost.hidden = false;
    if (regieTimer) clearInterval(regieTimer);
    regieTimer = setInterval(updateRegieTimers, 1000);
  }
  function closeOverlay() {
    overlayHost.hidden = true; overlayHost.innerHTML = '';
    if (regieTimer) { clearInterval(regieTimer); regieTimer = null; }
    if (prompterRaf) { cancelAnimationFrame(prompterRaf); prompterRaf = null; }
    regieState = null; render();
  }
  function renderRegie() {
    const l = liveById(regieState.liveId); if (!l) { closeOverlay(); return; }
    const segs = l.segments || [];
    const cur = segs[regieState.cur];
    const items = cur ? (cur.blocks || []).flatMap((b, bi) => (b.items || []).map((it, ii) => ({ role: b.role, txt: it, key: `${cur.id}::${bi}::${ii}` }))) : [];
    const list = segs.map((s, i) => `
      <div class="rl ${i===regieState.cur?'is-current':''} ${i<regieState.cur?'is-done':''}" data-action="regie-set" data-i="${i}">
        <span class="n">${s.num}</span><span class="lbl">${esc(s.label)}</span><span class="tm">${s.dur||0}′</span>
      </div>`).join('');
    const checks = items.map(it => `
      <div class="tool-item ${l.checked[it.key]?'done':''}">
        <button class="check ${l.checked[it.key]?'on':''}" data-action="check-toggle" data-id="${l.id}" data-key="${esc(it.key)}" data-regie="1" type="button">✓</button>
        <span class="t"><b style="color:${roleColor(it.role)}">${esc(it.role)}</b> — ${esc(it.txt)}</span>
      </div>`).join('');
    overlayHost.innerHTML = `
      <div class="regie-top">
        <div><div class="clock" id="regieClock">00:00</div><div class="elapsed">total · <span id="regieTotal">00:00</span></div></div>
        <div class="spacer"></div>
        <span class="chip ${channelData()&&channelData().live?'live':''}">${channelData()&&channelData().live?`<span class="dot"></span>LIVE · ${channelData().viewers||0}`:'OFFLINE'}</span>
        <button class="btn btn-sm btn-discord" data-action="discord-menu" data-id="${l.id}" type="button">Discord</button>
        <button class="btn btn-sm btn-ghost" data-action="close-overlay" type="button">✕ Quitter</button>
      </div>
      <div class="regie-main">
        <div class="regie-now">
          <div class="nlabel">Segment en cours · ${regieState.cur+1}/${segs.length}</div>
          <h2>${cur ? esc(cur.label) : 'Fin'}</h2>
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <div class="regie-seg-timer" id="regieSeg">00:00</div>
            <div class="muted">prévu ${cur?cur.dur:0}′</div>
            <div class="spacer" style="flex:1"></div>
            <button class="btn btn-sm" data-action="regie-prev" type="button">◀ Préc.</button>
            <button class="btn btn-sm btn-primary" data-action="regie-next" type="button">Suivant ▶</button>
          </div>
          <div class="tool-list" style="margin-top:16px">${checks || '<p class="muted">—</p>'}</div>
        </div>
        <div class="panel-title">Déroulé</div>
        <div class="regie-list">${list}</div>
      </div>`;
    updateRegieTimers();
  }
  function updateRegieTimers() {
    if (!regieState) return;
    const fmt = ms => { const s = Math.max(0, Math.floor(ms/1000)); return `${pad(Math.floor(s/60))}:${pad(s%60)}`; };
    const now = new Date();
    const ck = $('#regieClock'); if (ck) ck.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const tot = $('#regieTotal'); if (tot) tot.textContent = fmt(Date.now() - regieState.globalStart);
    const seg = $('#regieSeg');
    if (seg) {
      const l = liveById(regieState.liveId); const cur = l && l.segments[regieState.cur];
      const elapsed = Date.now() - regieState.segStart;
      seg.textContent = fmt(elapsed);
      seg.classList.toggle('over', cur && elapsed > (cur.dur || 0) * 60000);
    }
  }
  function regieGo(idx) {
    const l = liveById(regieState.liveId);
    regieState.cur = Math.max(0, Math.min((l.segments||[]).length - 1, idx));
    regieState.segStart = Date.now();
    renderRegie();
  }

  // =================================================================
  //  TÉLÉPROMPTEUR (overlay)
  // =================================================================
  let prompterRaf = null, prompterState = null;
  function openPrompter(liveId) {
    const l = liveById(liveId); if (!l) return;
    const lines = [];
    (l.segments || []).forEach(seg => {
      lines.push({ role: true, txt: `${seg.num}. ${seg.label}` });
      (seg.blocks || []).forEach(b => {
        if (b.role === 'MADARA') return; // skip régie cues on host prompter
        (b.items || []).forEach(it => lines.push({ role: false, txt: it }));
      });
    });
    prompterState = { playing: true, speed: 36, y: 0 };
    overlayHost.innerHTML = `
      <div class="regie-top">
        <div class="clock" style="font-size:22px">Téléprompteur</div>
        <div class="spacer"></div>
        <button class="btn btn-sm btn-ghost" data-action="close-overlay" type="button">✕ Quitter</button>
      </div>
      <div class="prompter"><div class="prompter-track" id="ptrack">
        ${lines.map(l2 => `<p class="${l2.role?'role':''}">${esc(l2.txt)}</p>`).join('')}
      </div></div>
      <div class="prompter-controls">
        <button class="btn btn-sm" id="ppPlay" type="button">⏸ Pause</button>
        <button class="btn btn-sm btn-ghost" id="ppSlow" type="button">– vitesse</button>
        <button class="btn btn-sm btn-ghost" id="ppFast" type="button">+ vitesse</button>
        <button class="btn btn-sm btn-ghost" id="ppTop" type="button">⤒ Début</button>
      </div>`;
    overlayHost.hidden = false;
    const track = $('#ptrack');
    let last = null;
    const step = (ts) => {
      if (!prompterState) return;
      if (last == null) last = ts;
      const dt = (ts - last) / 1000; last = ts;
      if (prompterState.playing) {
        prompterState.y += prompterState.speed * dt;
        const max = track.scrollHeight;
        if (prompterState.y > max) prompterState.y = 0;
        track.style.transform = `translateY(${-prompterState.y}px)`;
      }
      prompterRaf = requestAnimationFrame(step);
    };
    prompterRaf = requestAnimationFrame(step);
    $('#ppPlay').addEventListener('click', e => { prompterState.playing = !prompterState.playing; e.target.textContent = prompterState.playing ? '⏸ Pause' : '▶ Lecture'; });
    $('#ppSlow').addEventListener('click', () => { prompterState.speed = Math.max(10, prompterState.speed - 12); });
    $('#ppFast').addEventListener('click', () => { prompterState.speed += 12; });
    $('#ppTop').addEventListener('click', () => { prompterState.y = 0; });
  }

  // ============ Boot ============
  render();
  syncNav();
  updateChanStatus();
  // Sync Twitch (photos + live) au démarrage, sans bloquer le rendu
  if (state.settings.twitchAuto !== false) setTimeout(() => syncTwitch({ rerender: true }), 400);
  // Rafraîchir le statut live toutes les 90 s
  setInterval(() => { if (document.visibilityState === 'visible') syncTwitch({ rerender: true }); }, 90000);
})();
