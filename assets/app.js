/* =================================================================
   C&D Motors V1 · SPA logic + animations
   ================================================================= */

(() => {
  'use strict';

  // ============ DOM helpers ============
  const $  = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ============ State ============
  const state = {
    currentView: 'home',
    plate: 'AB-123-CD',
    selectedPrest: 'freins-av',
    chatBusy: false,
    chatHistory: [], // {role, content} pairs sent to Claude
    aiEnabled: true, // toggled off if API fails
  };

  // ============ Tariff knowledge ============
  const PRESTATIONS = {
    'freins-av': {
      title: "Plaquettes de frein avant",
      from: 119, to: 145,
      brk: "Pièces OE · Main d'œuvre · 45 min",
      details: [
        { name: "Plaquettes Bosch (jeu)", price: "62€ — 78€" },
        { name: "Main d'œuvre · 45 min", price: "45€ — 55€" },
        { name: "Liquide de frein (test)", price: "12€" },
      ]
    },
    'vidange': {
      title: "Vidange complète + filtres",
      from: 89, to: 119,
      brk: "Huile 5W30 · Filtres huile + air · 30 min",
      details: [
        { name: "Huile 5W30 (5L)", price: "42€ — 55€" },
        { name: "Filtre à huile", price: "12€" },
        { name: "Filtre à air", price: "18€" },
        { name: "Main d'œuvre · 30 min", price: "17€ — 34€" },
      ]
    },
    'pneus': {
      title: "4 pneus été (Michelin)",
      from: 320, to: 480,
      brk: "Michelin Primacy · Montage + équilibrage",
      details: [
        { name: "Pneu Michelin 195/65 R15 ×4", price: "260€ — 380€" },
        { name: "Montage + équilibrage ×4", price: "40€" },
        { name: "Valves neuves ×4", price: "20€" },
        { name: "Recyclage pneus usagés", price: "Offert" },
      ]
    },
    'distribution': {
      title: "Distribution + galets + pompe",
      from: 480, to: 680,
      brk: "Kit Gates · Pompe à eau · Main d'œuvre 4h",
      details: [
        { name: "Kit distribution Gates", price: "180€ — 240€" },
        { name: "Pompe à eau", price: "85€ — 120€" },
        { name: "Liquide de refroidissement", price: "25€" },
        { name: "Main d'œuvre · 4h", price: "190€ — 295€" },
      ]
    },
    'clim': {
      title: "Recharge climatisation R134a",
      from: 59, to: 79,
      brk: "Test étanchéité · Recharge · 25 min",
      details: [
        { name: "Test d'étanchéité", price: "Inclus" },
        { name: "Gaz R134a (300g)", price: "35€" },
        { name: "Main d'œuvre · 25 min", price: "24€ — 44€" },
      ]
    },
  };

  // ============ Status bar time ============
  const updateTime = () => {
    const t = $('#status-time');
    if (!t) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    t.textContent = `${hh}:${mm}`;
  };
  updateTime();
  setInterval(updateTime, 30000);

  // ============ SPA Router ============
  const showView = (name) => {
    if (state.currentView === name) return;
    $$('.view').forEach(v => v.classList.add('hidden'));
    const target = $(`[data-view="${name}"]`);
    if (target) {
      target.classList.remove('hidden');
      // Re-trigger reveal animations
      $$('.reveal-anim', target).forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.animation = '';
      });
    }
    state.currentView = name;

    // Tab bar active state
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.nav === name));

    // Scroll to top
    $('.views').scrollTop = 0;

    // Hide chat suggestions if chat opened with prior msgs
    if (name === 'chat') checkChatSuggestions();
  };

  // ============ Plate input formatting ============
  const plateInput = $('#plate-input');
  if (plateInput) {
    plateInput.addEventListener('input', e => {
      let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      // French plate format: AB-123-CD
      if (v.length > 2) v = v.slice(0, 2) + '-' + v.slice(2);
      if (v.length > 6) v = v.slice(0, 6) + '-' + v.slice(6, 8);
      e.target.value = v.slice(0, 9);
      state.plate = e.target.value;
    });
    plateInput.value = state.plate;
  }

  // ============ Devis loading sequence ============
  const startDevisFlow = async () => {
    if (!state.plate || state.plate.length < 8) {
      // Soft warn animation
      plateInput.style.animation = 'shake 0.5s';
      setTimeout(() => plateInput.style.animation = '', 500);
      plateInput.focus();
      return;
    }

    $('#loading-plate').textContent = state.plate;
    $('#vehicle-plate').textContent = state.plate;
    showView('devis-loading');

    // Animate loading steps
    const steps = $$('.lstep');
    const stepDurations = [600, 800, 700, 600];
    for (let i = 0; i < steps.length; i++) {
      steps[i].classList.add('active');
      await sleep(stepDurations[i]);
      steps[i].classList.remove('active');
      steps[i].classList.add('done');
    }
    await sleep(300);

    // Show devis result
    showView('devis');
  };

  $('#get-quote-btn')?.addEventListener('click', startDevisFlow);
  $('#scan-btn')?.addEventListener('click', () => {
    // Fake "scan" detection
    plateInput.value = 'AB-123-CD';
    state.plate = 'AB-123-CD';
    plateInput.style.background = '#fffce0';
    setTimeout(() => plateInput.style.background = '', 800);
    setTimeout(startDevisFlow, 400);
  });

  plateInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startDevisFlow();
    }
  });

  // ============ Service quick-select on home ============
  $$('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      const svc = card.dataset.service;
      const map = {
        'vidange': 'vidange',
        'pneus': 'pneus',
        'freins': 'freins-av',
        'clim': 'clim',
        'distribution': 'distribution',
        'diagnostic': 'freins-av',
      };
      state.selectedPrest = map[svc] || 'freins-av';
      // Auto-select pill in devis view
      updateDevis();
      startDevisFlow();
    });
  });

  // ============ Service pill switching with animation ============
  const updateDevis = () => {
    const p = PRESTATIONS[state.selectedPrest];
    if (!p) return;
    $('#price-title').textContent = p.title;
    // Animate count-up from 0 to value
    animateNumber($('#price-from'), p.from, '€');
    animateNumber($('#price-to'), p.to, '€');
    $('#price-brk').textContent = p.brk;

    const list = $('#detail-list');
    list.innerHTML = '';
    p.details.forEach((d, i) => {
      const row = document.createElement('div');
      row.className = 'detail-row';
      row.style.animation = `revealIn 0.4s var(--ease-spring) ${i * 0.06}s both`;
      row.innerHTML = `<span class="detail-name">${d.name}</span><span class="detail-price">${d.price}</span>`;
      list.appendChild(row);
    });

    // Update pill active
    $$('.pill').forEach(pill => {
      pill.classList.toggle('pill-active', pill.dataset.prest === state.selectedPrest);
    });
  };

  $$('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.selectedPrest = pill.dataset.prest;
      updateDevis();
    });
  });

  // Animated number count-up
  const animateNumber = (el, target, suffix = '') => {
    if (!el) return;
    const duration = 900;
    const start = performance.now();
    const initialText = el.textContent;
    const fromMatch = initialText.match(/\d+/);
    const from = fromMatch ? parseInt(fromMatch[0]) : 0;

    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const val = Math.round(from + (target - from) * easeOut(t));
      el.textContent = val + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ============ Calendar day selection ============
  $$('.cal-day').forEach(d => {
    d.addEventListener('click', () => {
      if (d.classList.contains('cal-day-closed')) return;
      $$('.cal-day').forEach(x => x.classList.remove('cal-day-selected'));
      d.classList.add('cal-day-selected');
    });
  });

  // ============ Slot selection ============
  $$('.slot').forEach(s => {
    s.addEventListener('click', () => {
      if (s.classList.contains('slot-disabled')) return;
      $$('.slot').forEach(x => {
        x.classList.remove('slot-selected');
        x.textContent = x.textContent.replace(/ ✓$/, '');
      });
      s.classList.add('slot-selected');
      if (!s.textContent.includes('✓')) s.textContent = s.textContent + ' ✓';
    });
  });

  // ============ Confirm RDV ============
  $('#confirm-rdv-btn')?.addEventListener('click', () => {
    showToast('RDV confirmé · SMS envoyé');
    setTimeout(() => showView('compte'), 1200);
  });

  // ============ Toast ============
  const showToast = (text) => {
    const toast = $('#toast');
    if (!toast) return;
    $('.toast-text', toast).textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  };

  // ============ Navigation buttons ============
  $$('[data-nav]').forEach(btn => {
    btn.addEventListener('click', e => {
      const target = btn.dataset.nav;
      if (!target) return;
      e.preventDefault();
      showView(target);
    });
  });

  // ============ CHAT logic ============
  const chatMessages = $('#chat-messages');
  const chatField = $('#chat-field');
  const chatForm = $('#chat-form');
  const chatSuggestions = $('#chat-suggestions');

  const checkChatSuggestions = () => {
    const userMsgs = $$('.msg-user').length;
    if (userMsgs > 0) chatSuggestions.style.display = 'none';
    else chatSuggestions.style.display = 'flex';
  };

  const appendMessage = (text, who = 'bot', extraHTML = '') => {
    const msg = document.createElement('div');
    msg.className = `msg msg-${who}`;
    const time = new Date();
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    msg.innerHTML = `<div class="msg-bubble">${text}</div>` +
                    extraHTML +
                    `<span class="msg-time">${hh}:${mm}</span>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const showTyping = () => {
    const t = document.createElement('div');
    t.className = 'typing';
    t.id = 'typing-indicator';
    t.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    chatMessages.appendChild(t);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const hideTyping = () => $('#typing-indicator')?.remove();

  // Simulated AI brain — pattern matching with fallback
  const getAIResponse = (q) => {
    const text = q.toLowerCase();

    // Vidange
    if (/vidange|huile/.test(text)) {
      return {
        msg: "Pour une vidange complète sur Clio 4 diesel :",
        quote: { from: 89, to: 119, brk: "Huile 5W30 + filtres · 30 min" },
      };
    }
    // Freins
    if (/frein|plaquette|grince|grincent/.test(text)) {
      return {
        msg: "Si vos freins grincent, c'est souvent l'usure des plaquettes. Sur Clio 4 :",
        quote: { from: 119, to: 145, brk: "Plaquettes OE + main d'œuvre" },
      };
    }
    // Pneus
    if (/pneu|pneus/.test(text)) {
      return {
        msg: "Pour 4 pneus été Michelin sur votre Clio 4 :",
        quote: { from: 320, to: 480, brk: "Montage + équilibrage inclus" },
      };
    }
    // Distribution
    if (/distribution|courroie/.test(text)) {
      return {
        msg: "La distribution sur Clio 4 dCi se change tous les 160 000 km ou 6 ans.",
        quote: { from: 480, to: 680, brk: "Kit complet + pompe à eau + 4h M.O." },
      };
    }
    // Clim
    if (/clim|climatisation|recharge|froid/.test(text)) {
      return {
        msg: "Recharge climatisation R134a (Clio 4) :",
        quote: { from: 59, to: 79, brk: "Test étanchéité + recharge · 25 min" },
      };
    }
    // Horaires
    if (/horaire|ouvert|samedi|dimanche|heure/.test(text)) {
      return {
        msg: "Nous sommes ouverts :<br>📅 Lundi à vendredi : <strong>8h-18h30</strong><br>📅 Samedi : <strong>9h-12h</strong><br>📅 Dimanche : <strong>fermé</strong>",
      };
    }
    // RDV
    if (/rdv|rendez-vous|réserve|réservation|jeudi|vendredi|lundi/.test(text)) {
      return {
        msg: "Bien sûr 👍 Voici mes créneaux dispo cette semaine :",
        slots: ['Jeudi 10h', 'Jeudi 14h30', 'Vendredi 9h', 'Vendredi 16h'],
      };
    }
    // Prix générique
    if (/prix|coût|combien|tarif|€/.test(text)) {
      return {
        msg: "Pour vous donner un prix précis, j'ai besoin de connaître la prestation. Vous pouvez :<br>→ Taper votre <strong>plaque d'immat</strong> sur la home<br>→ Me dire quelle pièce changer<br>→ Ou décrire le problème",
      };
    }
    // Adresse
    if (/adresse|où|situ|trouve|venir/.test(text)) {
      return {
        msg: "Nous sommes au <strong>14 rue de la Liberté · 57155 Marly</strong> 📍<br>Parking gratuit devant le garage. À 5 min de la sortie A31.",
      };
    }
    // Diagnostic
    if (/diagnostic|panne|voyant|alerte/.test(text)) {
      return {
        msg: "Un diagnostic électronique complet chez nous c'est <strong>39€</strong> — souvent offert si on fait la réparation derrière. On vérifie tous les codes erreur en 15 minutes.",
      };
    }
    // Devis
    if (/devis/.test(text)) {
      return {
        msg: "Vous pouvez avoir un devis détaillé en <strong>30 secondes</strong> :<br>→ Tapez votre plaque sur la home<br>→ Choisissez la prestation<br>→ L'IA vous propose une fourchette précise",
      };
    }
    // Default
    return {
      msg: "Je n'ai pas tout compris 🤔 mais je peux vous aider sur :<br>• les <strong>tarifs</strong> (vidange, pneus, freins, clim, distribution)<br>• la <strong>prise de RDV</strong><br>• nos <strong>horaires</strong> et notre <strong>adresse</strong><br>• un <strong>diagnostic</strong> rapide<br><br>Tapez votre question 👇",
    };
  };

  // Format Claude's markdown-ish reply into HTML
  const formatReply = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;br&gt;/gi, '<br>') // un-escape <br> from Claude
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  };

  // Detect a price range in the assistant's reply to render a CTA card
  const extractQuote = (text) => {
    // Match "119€ — 145€", "119€ - 145€", "119€-145€", etc.
    const m = text.match(/(\d{2,4})\s*€\s*[—\-–]\s*(\d{2,4})\s*€/);
    if (!m) return null;
    return { from: parseInt(m[1]), to: parseInt(m[2]) };
  };

  // Call the real Claude API via Vercel function
  const callClaudeAPI = async (history) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'API_ERROR');
    }
    const data = await res.json();
    return data.reply || '';
  };

  const sendMessage = async (text) => {
    if (!text || state.chatBusy) return;
    state.chatBusy = true;
    appendMessage(text, 'user');
    chatField.value = '';
    checkChatSuggestions();
    state.chatHistory.push({ role: 'user', content: text });

    await sleep(300);
    showTyping();

    let replyText = '';
    try {
      if (state.aiEnabled) {
        replyText = await callClaudeAPI(state.chatHistory);
      } else {
        throw new Error('FALLBACK');
      }
    } catch (err) {
      // Fallback to scripted responses if API key not set or network fails
      if (state.aiEnabled && String(err.message).includes('API_KEY_MISSING')) {
        state.aiEnabled = false;
      }
      await sleep(800);
      const fallback = getAIResponse(text);
      replyText = fallback.msg;
      // Convert old fallback HTML format
      replyText = replyText.replace(/<br>/g, '\n');
    }
    hideTyping();

    // Push to history for context continuity
    state.chatHistory.push({ role: 'assistant', content: replyText });

    // Build extras (quote card if a price was detected in the reply)
    let extraHTML = '';
    const quote = extractQuote(replyText);
    if (quote) {
      extraHTML = `
        <div class="msg-quote">
          <span class="quote-badge">🤖 DEVIS IA</span>
          <div class="quote-price">
            <span class="quote-from">${quote.from}€</span>
            <span class="quote-dash">—</span>
            <span class="quote-to">${quote.to}€</span>
          </div>
          <button class="quote-cta" data-nav="rdv">Réserver un créneau →</button>
        </div>
      `;
    }

    appendMessage(formatReply(replyText), 'bot', extraHTML);

    // Re-bind nav buttons created dynamically
    $$('.msg-quote [data-nav]').forEach(b => {
      b.addEventListener('click', e => {
        e.preventDefault();
        showView(b.dataset.nav);
      });
    });

    state.chatBusy = false;
  };

  chatForm?.addEventListener('submit', e => {
    e.preventDefault();
    const text = chatField.value.trim();
    if (text) sendMessage(text);
  });

  $$('.suggestion').forEach(s => {
    s.addEventListener('click', () => sendMessage(s.dataset.msg));
  });

  // ============ Add shake keyframe ============
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(style);

  // ============ Subtle parallax on hero glow ============
  let mouseX = 0, mouseY = 0;
  const heroGlow = $('.hero-glow');
  if (heroGlow && window.matchMedia('(min-width: 1024px)').matches) {
    document.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
      heroGlow.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });
  }

  // ============ Init on load ============
  document.addEventListener('DOMContentLoaded', () => {
    // Default home view
    showView('home');
  });

  // Listen for back/forward
  window.addEventListener('hashchange', () => {
    const view = location.hash.slice(1) || 'home';
    if (['home', 'devis', 'chat', 'rdv', 'compte'].includes(view)) {
      showView(view);
    }
  });

  // Init hash route
  if (location.hash) {
    const initial = location.hash.slice(1);
    if (['home', 'rdv', 'chat', 'compte'].includes(initial)) {
      showView(initial);
    }
  }

})();
