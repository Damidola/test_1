/* Спільний набір для всіх ігор: верхня панель, правила, звуки, конфеті,
   зірочки та лічильник часу гри для батьків.
   Підключення в грі:
     <link rel="stylesheet" href="../shared/kit.css">
     <script src="../shared/games.js"></script>
     <script src="../shared/kit.js" data-game="checkers"></script>
   Ігри повідомляють результат так: LG.win(), LG.lose(), LG.draw(). */
(function () {
  'use strict';

  const script = document.currentScript;
  const gameId = script && script.dataset.game;
  const root = (script && script.getAttribute('src') || '').replace(/shared\/kit\.js.*$/, '');
  const game = (window.LG_GAMES || []).find(g => g.id === gameId) || null;
  // Гра може підтримувати нічну тему: <script ... data-night="on">
  const nightSupported = !!(script && script.dataset.night);

  // ---------- сховище (може бути недоступне в приватному режимі) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('chk:' + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('chk:' + key, JSON.stringify(value)); } catch (e) { /* ігноруємо */ }
    }
  };

  // ---------- повний екран (без адресного рядка браузера) ----------
  // За замовчуванням вимкнено. Переходи між сторінками в повному екрані йдуть через рамку (див. нижче), тож він не злітає.
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const fsOk = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  function fsEnter() {
    const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen;
    if (!f || fsEl()) return Promise.resolve();
    try { const r = f.call(d, { navigationUI: 'hide' }); return r && r.catch ? r.catch(() => {}) : Promise.resolve(); } catch (e) { return Promise.resolve(); }
  }
  function fsExit() {
    const f = document.exitFullscreen || document.webkitExitFullscreen;
    if (f && fsEl()) try { f.call(document); } catch (e) { /* */ }
  }
  // Вийшли з повного екрана самі (жест «назад», кнопка) — налаштування вимикається, щоб Профіль і кнопка показували правду.
  // Вихід через перезавантаження чи закриття сторінки не рахується.
  let fsLeaving = false;
  addEventListener('beforeunload', () => { fsLeaving = true; });
  addEventListener('pagehide', () => { fsLeaving = true; });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => {
    if (!fsEl() && !fsToggling && !fsLeaving && window.top === window) store.set('fullscreen', false);
    document.documentElement.classList.toggle('lg-fs', !!fsEl());
    dispatchEvent(new Event('resize'));
  }));
  let fsToggling = false;
  // Повний екран вмикається лише кнопкою (у Профілі чи в грі), ніколи сам. Після перезавантаження сторінки браузер
  // уже не в повному екрані — тож і налаштування вимикаємо, щоб перемикач показував правду.
  const inFrame = window.top !== window;
  if (!inFrame && !fsEl() && store.get('fullscreen', false)) store.set('fullscreen', false);
  // Щоб повний екран не злітав при переході на іншу сторінку (браузер його при переході завжди вимикає),
  // у повному екрані сторінки відкриваються поверх поточної у рамці на весь екран — без справжнього переходу.
  // Коли в рамці відкривається ця ж сторінка (кнопка «додому»), рамка закривається. «Назад» працює як звичайно.
  let fsFrame = null;
  const samePage = u => u.origin === location.origin && u.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
  function fsClose(hash) {
    if (!fsFrame) return;
    fsFrame.remove(); fsFrame = null; document.documentElement.classList.remove('lg-framed');
    if (history.state && history.state.lgFrame) history.replaceState(null, '');
    if (hash !== undefined && hash !== location.hash) location.hash = hash;
    else dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  }
  function go(href) {
    const u = new URL(href, location.href);
    if (inFrame) { const t = topPage(u); if (t) t.LG._fsClose(u.hash); else location.href = u.href; return; }
    if (!fsEl() || u.origin !== location.origin || samePage(u)) { location.href = u.href; return; }
    if (fsFrame) { fsFrame.src = u.href; return; }
    fsFrame = document.createElement('iframe');
    fsFrame.className = 'lg-fsframe'; fsFrame.allow = 'fullscreen; autoplay';
    fsFrame.style.cssText = 'position:fixed;left:0;right:0;bottom:0;top:var(--fs-top,0px);width:100%;height:calc(100% - var(--fs-top,0px));border:0;z-index:2147483000;background:#000';
    fsFrame.addEventListener('load', () => {
      let w; try { w = fsFrame.contentWindow.location; } catch (e) { return; }
      if (w.href !== 'about:blank' && samePage(w)) fsClose(w.hash);
      else try { document.title = fsFrame.contentDocument.title; } catch (e) { /* */ }
    });
    fsFrame.src = u.href;
    history.pushState({ lgFrame: 1 }, '');
    document.documentElement.classList.add('lg-framed');
    document.body.appendChild(fsFrame);
  }
  addEventListener('popstate', () => { if (fsFrame && !(history.state && history.state.lgFrame)) { fsFrame.remove(); fsFrame = null; document.documentElement.classList.remove('lg-framed'); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); } });
  // у рамці: посилання на головну сторінку одразу закриває рамку, без завантаження головної ще раз
  const topPage = u => { try { const t = window.top; return t.LG && t.LG._fsClose && u.origin === t.location.origin && u.pathname.replace(/index\.html$/, '') === t.location.pathname.replace(/index\.html$/, '') ? t : null; } catch (e) { return null; } };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || a.target || a.hasAttribute('download') || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const href = a.getAttribute('href'); if (!href || href.startsWith('#')) return;
    const u = new URL(a.href);
    if (inFrame) { const t = topPage(u); if (t) { e.preventDefault(); t.LG._fsClose(u.hash); } return; }
    if (!fsEl() || u.origin !== location.origin || samePage(u)) return;
    e.preventDefault(); go(a.href);
  });


  // новий дизайн ігрових екранів (чорне тло, Manrope): шрифт підвантажуємо на кожній сторінці
  if (!document.querySelector('link[href*="family=Manrope"]')) {
    const f = document.createElement('link'); f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap';
    document.head.appendChild(f);
  }
  // координати біля дошки (цифри й літери) — можна вимкнути в Профілі
  if (store.get('coords', true) === false) document.documentElement.classList.add('lg-nocoords');

  const lang = store.get('lang', 'uk') === 'en' ? 'en' : 'uk';
  if (lang === 'en' && document.readyState === 'loading') {
    const q = ((script && script.getAttribute('src') || '').match(/\?v=\d+/) || [''])[0];
    document.write(`<script src="${root}i18n/en.js${q}"><\/script><script src="${root}i18n/translate.js${q}"><\/script>`);
  }

  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- звуки (синтезовані, без файлів) ----------
  let audioCtx = null;
  function tone(freq, start, dur, type, vol) {
    const t = audioCtx.currentTime + start;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, (vol || 0.18) * LG.volume), t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
  const SOUNDS = {
    tap: () => tone(660, 0, 0.08, 'triangle', 0.12),
    place: () => { tone(520, 0, 0.09, 'triangle', 0.14); tone(780, 0.05, 0.1, 'triangle', 0.1); },
    error: () => { tone(220, 0, 0.14, 'sawtooth', 0.06); tone(180, 0.1, 0.18, 'sawtooth', 0.05); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.16)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, 'sine', 0.12)),
    draw: () => [440, 440].forEach((f, i) => tone(f, i * 0.18, 0.2, 'sine', 0.12))
  };
  // Звук перемоги: довгий (зі старої версії гри) — лише в довгих іграх (шахи, шашки, пішаки…),
  // у швидких (хрестики-нулики, сірники, задачки) — короткий звук перемоги Lichess
  const FILES = { win: game && game.long ? 'shared/sounds/win.mp3' : 'shared/sounds/victory.mp3' };
  FILES.move = 'shared/sounds/move.mp3'; FILES.capture = 'shared/sounds/capture.mp3'; FILES.error = 'shared/sounds/error.mp3';
  FILES.illegal = 'shared/sounds/illegal.wav'; // тихе «тук-тук»: фігуру поклали туди, куди ходити не можна
  // Файли граємо через Web Audio: на iPhone new Audio() поза самим тапом (після перетягування,
  // хід робота) браузер мовчки блокує, а розблокований AudioContext грає будь-коли.
  const ctx = () => {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  };
  // iPhone: Web Audio вимикається перемикачем «беззвучно», навіть коли звук сайту увімкнено.
  // Просимо режим «відтворення» (Safari 16.4+), а для старших — один раз граємо тиху <audio> по першому дотику.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* немає */ }
  let silentDone = false;
  const SILENT = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  const unlock = () => {
    if (!silentDone) { silentDone = true; try { const a = new Audio(SILENT); a.play().catch(() => {}); } catch (e) { /* немає */ } }
    if (audioCtx && audioCtx.state === 'running') return;
    try { const c = ctx(), b = c.createBufferSource(); b.buffer = c.createBuffer(1, 1, 22050); b.connect(c.destination); b.start(0); } catch (e) { /* без звуку */ }
  };
  ['pointerdown', 'touchend', 'keydown'].forEach(t => window.addEventListener(t, unlock, { capture: true, passive: true }));
  // Розкодовані звуки: буфер + скільки тиші на початку (MP3 додає ~50 мс тиші — її пропускаємо, щоб звук був одразу)
  const buffers = {}, ready = {};
  const load = u => {
    const url = new URL(u, location.href).href;
    return buffers[url] || (buffers[url] = fetch(url).then(r => r.arrayBuffer())
      .then(d => new Promise((ok, no) => ctx().decodeAudioData(d, ok, no)))
      .then(buf => {
        const ch = buf.getChannelData(0); let i = 0;
        while (i < ch.length && Math.abs(ch[i]) < 0.01) i++;
        return (ready[url] = { buf, lead: Math.max(0, i / buf.sampleRate - 0.003) });
      })
      .catch(() => { delete buffers[url]; return null; }));
  };
  function start({ buf, lead }, k = 1) {
    const c = ctx(), src = c.createBufferSource(), gain = c.createGain();
    gain.gain.value = LG.volume * k; src.buffer = buf; src.connect(gain).connect(c.destination); src.start(0, lead);
  }
  function playFile(u, k = 1) {
    if (LG.muted || LG.volume <= 0) return;
    try {
      const url = new URL(u, location.href).href;
      if (ready[url]) return start(ready[url], k); // уже розкодовано — граємо одразу, без очікування
      load(url).then(x => {
        if (x) return start(x, k);
        const a = new Audio(url); a.volume = Math.min(1, LG.volume * k); a.play().catch(() => {});
      });
    } catch (e) { /* без звуку */ }
  }
  setTimeout(() => ['move', 'capture', 'error', 'illegal', 'win'].forEach(n => load(root + FILES[n])), 0); // щоб перший хід не чекав завантаження
  function play(name) {
    if (FILES[name]) return playFile(root + FILES[name], name === 'win' ? 0.5 : 1); // звук перемоги — удвічі тихіше
    if (LG.muted || !SOUNDS[name]) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      SOUNDS[name]();
    } catch (e) { /* без звуку */ }
  }

  // ---------- статистика ----------
  function stats() { return store.get('stats', {}); }
  function record(result) {
    if (!gameId) return;
    const all = stats();
    const s = all[gameId] || { played: 0, wins: 0, draws: 0 };
    s.played += 1;
    if (result === 'win') s.wins += 1;
    if (result === 'draw') s.draws += 1;
    s.last = today();
    all[gameId] = s;
    store.set('stats', all);
    const log = store.get('log', {});
    const d = log[today()] || { wins: 0, games: 0, seconds: 0 };
    d.games += 1;
    if (result === 'win') d.wins += 1;
    log[today()] = d;
    store.set('log', log);
  }

  // Час гри: рахуємо лише коли вкладка видима
  let tickStart = null;
  function flushTime() {
    if (tickStart === null) return;
    const secs = Math.round((Date.now() - tickStart) / 1000);
    tickStart = document.hidden ? null : Date.now();
    if (secs <= 0 || secs > 3600) return;
    const log = store.get('log', {});
    const d = log[today()] || { wins: 0, games: 0, seconds: 0 };
    d.seconds += secs;
    log[today()] = d;
    store.set('log', log);
    checkBreak(d.seconds);
  }
  function checkBreak(seconds) {
    const limit = store.get('breakMinutes', 0);
    if (!limit) return;
    const shownFor = store.get('breakShown', '');
    const mark = today() + ':' + Math.floor(seconds / 60 / limit);
    if (seconds >= limit * 60 && shownFor !== mark) {
      store.set('breakShown', mark);
      showBreak(limit);
    }
  }

  // ---------- DOM helpers ----------
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(c => c && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  }

  // ---------- модальне вікно ----------
  let modal = null;
  function openModal(content, opts) {
    closeModal();
    const card = el('div', { class: 'lg-modal-card' + (opts && opts.cls ? ' ' + opts.cls : ''), role: 'dialog', 'aria-modal': 'true' });
    const close = el('button', { class: 'lg-modal-x', 'aria-label': 'Закрити', text: '✕', onclick: closeModal });
    card.appendChild(close);
    card.appendChild(content);
    modal = el('div', { class: 'lg-modal', onclick: e => { if (e.target === modal) closeModal(); } }, [card]);
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal && modal.classList.add('lg-open'));
    const focusable = card.querySelector('.lg-btn') || close;
    focusable.focus({ preventScroll: true });
  }
  function closeModal() {
    if (!modal) return;
    const m = modal;
    modal = null;
    m.classList.remove('lg-open');
    setTimeout(() => m.remove(), 200);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function showRules() {
    if (!game) return;
    const r = game.rules;
    const body = el('div', { class: 'lg-rules' }, [
      el('div', { class: 'lg-rules-head' }, [
        el('span', { class: 'lg-rules-emoji', text: game.emoji }),
        el('h2', { text: game.title })
      ]),
      el('div', { class: 'lg-rules-goal' }, [el('b', { text: '🎯 Мета: ' }), r.goal]),
      el('h3', { text: '🕹️ Як грати' }),
      el('ul', {}, r.how.map(t => el('li', { text: t }))),
      el('h3', { text: '💡 Порада' }),
      el('ul', { class: 'lg-tips' }, r.tips.map(t => el('li', { text: t }))),
      el('details', { class: 'lg-parents' }, [
        el('summary', { text: '👨‍👩‍👧 Для батьків' }),
        el('p', { text: game.parents }),
        el('p', { class: 'lg-skill-row' }, [
          el('span', { text: 'Вік: ' + game.age + '+' }),
          ...game.skills.map(s => el('span', { class: 'lg-chip', text: s }))
        ])
      ]),
      el('button', { class: 'lg-btn lg-btn-primary lg-btn-wide', text: 'Зрозуміло, граємо! 🚀', onclick: closeModal })
    ]);
    openModal(body, { cls: 'lg-modal-rules' });
  }

  function showBreak(limit) {
    openModal(el('div', { class: 'lg-result' }, [
      el('div', { class: 'lg-result-emoji', text: '🧘' }),
      el('h2', { text: 'Час на перерву!' }),
      el('p', { text: 'Ти граєш уже ' + limit + ' хв. Потягнись, подивись у вікно і попий водички 💧' }),
      el('button', { class: 'lg-btn lg-btn-primary', text: 'Добре!', onclick: closeModal })
    ]));
  }

  // ---------- тости ----------
  let toastBox = null;
  function toast(msg, kind) {
    if (!toastBox) { toastBox = el('div', { class: 'lg-toasts', 'aria-live': 'polite' }); document.body.appendChild(toastBox); }
    const t = el('div', { class: 'lg-toast' + (kind ? ' lg-toast-' + kind : ''), text: String(msg) });
    toastBox.appendChild(t);
    requestAnimationFrame(() => t.classList.add('lg-show'));
    setTimeout(() => { t.classList.remove('lg-show'); setTimeout(() => t.remove(), 300); }, 3200);
  }

  // ---------- конфеті ----------
  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = el('canvas', { class: 'lg-confetti' });
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ['#FF6B6B', '#FFB300', '#2ECC9A', '#4DA3FF', '#A66CFF', '#FF9F43'];
    const parts = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 4,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: colors[(Math.random() * colors.length) | 0]
    }));
    const start = performance.now();
    (function frame(now) {
      const t = now - start;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(p => {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - t / 3000);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (t < 3000) requestAnimationFrame(frame); else c.remove();
    })(start);
  }

  // ---------- результати ----------
  const pick = a => a[(Math.random() * a.length) | 0];
  let lastResultAt = 0;

  // ---------- нагорода: смішні відео з тваринками (наступне вантажимо заздалегідь) ----------
  const REWARD_EXT = document.createElement('video').canPlayType('video/mp4; codecs="avc1.4D401E"') ? '.mp4' : '.webm';
  let rewardBag = [], nextReward = null;
  function prepReward() {
    if (!rewardBag.length) rewardBag = Array.from({ length: 90 }, (_, i) => i + 1).sort(() => Math.random() - .5);
    const url = root + 'shared/rewards/fun-' + String(rewardBag.pop()).padStart(2, '0') + REWARD_EXT;
    const ready = fetch(url).then(r => r.ok ? r.blob() : Promise.reject()).then(b => URL.createObjectURL(b)).catch(() => url);
    nextReward = { ready, done: null };
    ready.then(u => { if (nextReward && nextReward.ready === ready) nextReward.done = u; });
  }
  function takeReward() { if (!nextReward) prepReward(); const r = nextReward; prepReward(); return r.done || r.ready; }

  function result(kind, message, opts) {
    // деякі ігри викликають перевірку кінця гри кілька разів поспіль за одну подію —
    // відсікаємо лише миттєві дублікати, а не наступну реальну партію (може початись
    // і закінчитись швидко, якщо гравець одразу тисне «Заново»)
    if (Date.now() - lastResultAt < 250) return;
    lastResultAt = Date.now();
    record(kind);
    play(kind);
    if (kind === 'win') confetti();
    if (opts && opts.silent) return;
    // Малюк ще не читає: велика картинка, одне слово і дві кнопки-іконки
    const cfg = {
      win: { emoji: '', title: 'Перемога!' },
      lose: { emoji: pick(['🙈', '🐢', '💪']), title: 'Ой!' },
      draw: { emoji: '🤝', title: 'Нічия!' }
    }[kind];
    // Після перемоги — без емодзі: лише слово й котик
    const children = [el('h2', { text: cfg.title, title: message || '' })];
    if (cfg.emoji && !(opts && opts.hero)) children.unshift(el('div', { class: 'lg-result-emoji', text: cfg.emoji }));
    const imgSlot = el('div', { class: 'lg-result-img' });
    // суперник у вікні (гра з роботом) — замість картинки-нагороди
    if (opts && opts.hero) {
      const h = el('div', { class: 'lg-result-hero ' + (opts.hero.mood || '') });
      if (opts.hero.scene) h.style.setProperty('--scene', opts.hero.scene);
      h.innerHTML = opts.hero.html; children.unshift(h);
    }
    if (opts && opts.reward && !opts.image && !opts.hero) { opts = { ...opts, image: takeReward(), video: true }; }
    if (opts && opts.image) children.push(imgSlot);
    const buttons = el('div', { class: 'lg-result-btns' });
    const again = opts && opts.onAgain;
    // Домик зліва, «ще раз» справа від нього
    buttons.appendChild(el('a', { class: 'lg-btn lg-btn-big', href: homeHref(), 'aria-label': 'Назад', title: 'Назад', text: '🏠' }));
    buttons.appendChild(el('button', {
      class: 'lg-btn lg-btn-primary lg-btn-big', 'aria-label': 'Ще раз', title: 'Ще раз', text: '🔄',
      onclick: () => { closeModal(); if (again) again(); }
    }));
    if (opts && opts.onNext) buttons.appendChild(el('button', { class: 'lg-btn lg-btn-primary lg-btn-big lg-btn-next', 'aria-label': 'Далі', title: 'Далі', text: 'Далі ▶', onclick: () => { closeModal(); opts.onNext(); } }));
    children.push(buttons);
    setTimeout(() => {
      openModal(el('div', { class: 'lg-result lg-result-' + kind }, children));
      // Швидкі ігри: вікно саме зникає і починається нова партія
      if (opts && opts.autoClose) setTimeout(() => { closeModal(); if (again) again(); }, opts.autoClose);
    }, Math.max((opts && opts.delay) || 0, (opts && opts.autoClose) ? 300 : 700));
    // Картинка-нагорода (наприклад, котик) з'являється, коли завантажиться
    if (opts && opts.image) {
      Promise.resolve(opts.image).then(url => {
        if (!url) return imgSlot.remove();
        // Відео (як гіфка): без звуку, по колу, одразу грає
        const img = opts.video
          ? el('video', { src: url, autoplay: '', muted: '', loop: '', playsinline: '', 'aria-label': 'Нагорода за перемогу' })
          : el('img', { alt: 'Нагорода за перемогу', src: url });
        if (opts.video) { img.muted = true; img.play && img.play().catch(() => {}); }
        img.onerror = () => imgSlot.remove();
        imgSlot.appendChild(img);
      }).catch(() => imgSlot.remove());
    }
  }

  // ---------- верхня панель ----------
  // ---------- налаштування (шестерня у верхній панелі) ----------
  const settingsBuilders = [];
  function switchRow(label, checked, onChange) {
    const input = el('input', { type: 'checkbox' });
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    return el('label', { class: 'lg-set-row' }, [el('span', { text: label }), input]);
  }
  function showSettings() {
    // Спершу — налаштування гри (сила робота, режими), унизу — тема і звук
    const body = el('div', { class: 'lg-settings' }, [el('h2', { text: 'Налаштування' })]);
    settingsBuilders.forEach(fn => { const part = fn(); if (part) body.appendChild(el('div', { class: 'lg-set-group' }, [part])); });
    body.appendChild(el('button', { class: 'lg-btn lg-btn-primary lg-btn-wide', text: 'Готово', onclick: closeModal }));
    openModal(body, { cls: 'lg-modal-settings' });
  }

  // Нижня панель (як у застосунку): ⬅ Назад · 💡 Підказка · 📖 Пояснення · ⚙️ (якщо в гри є свої налаштування).
  // Звук, фігури й дошка — у Профілі застосунку.
  let hintFn = null, explainFn = null, gearBtn = null, hintBtn = null;
  function homeHref() {
    let back = null;
    try { back = sessionStorage.getItem('chk:back'); } catch (e) { /* без сховища */ }
    return back && location.href.split('#')[0] !== back.split('#')[0] ? back : root + 'index.html';
  }
  // Іконки нижніх кнопок — малюнки (SVG), як на chess.com, а не емодзі
  const svg = (d, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONS = {
    '⬅️': svg('<path d="M20 12H5"/><path d="M11 5l-7 7 7 7"/>'),
    '🔊': svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/>'),
    '🔇': svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    '☰': svg('<path d="M4 6.5h16M4 12h16M4 17.5h16"/>'),
    '💡': svg('<path d="M9 18h6"/><path d="M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5.8 1.1.8 1.7h6c0-.6.3-1.2.8-1.7A6.5 6.5 0 0 0 12 2.5z" fill="currentColor" stroke-width="1.6"/>'),
    '📖': svg('<path d="M3 5.5c3-1.5 6-1.5 9 .5v14c-3-2-6-2-9-.5z"/><path d="M21 5.5c-3-1.5-6-1.5-9 .5v14c3-2 6-2 9-.5z"/>'),
    '⚙️': svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
    '↩️': svg('<path d="M15 4.5L7.5 12l7.5 7.5"/>'),
    '↪️': svg('<path d="M9 4.5l7.5 7.5L9 19.5"/>'),
    '⚪': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="#fff" stroke="#9c9ad0" stroke-width="2"/></svg>',
    '⚫': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="#1d1b30" stroke="#fff" stroke-width="2"/></svg>'
  };
  function navBtn(ico, label, attrs) {
    const a = { class: 'lg-nav-btn', ...attrs };
    if (ico === '💡') a.class += ' lg-hintbtn'; // підказка — з бірюзовою лампочкою (новий дизайн)
    if (!a.href) a.type = 'button';
    const i = el('span', { class: 'ico', text: ICONS[ico] ? '' : ico });
    if (ICONS[ico]) i.innerHTML = ICONS[ico];
    return el(a.href ? 'a' : 'button', a, [i, el('span', { class: 'lbl', text: label })]);
  }
  function buildBar() {
    if (document.querySelector('.lg-nav')) return; // уже зібрана (гра попросила раніше)
    hintBtn = navBtn('💡', 'Підказка', { onclick: () => hintFn && hintFn() });
    hintBtn.hidden = !hintFn;
    gearBtn = navBtn('⚙️', 'Налаштування', { onclick: showSettings });
    gearBtn.hidden = !settingsBuilders.length;
    const bar = el('nav', { class: 'lg-bar lg-nav' }, [
      navBtn('☰', 'Меню', { href: homeHref(), class: 'lg-nav-btn lg-home' }),
      hintBtn,
      navBtn('📖', 'Пояснення', { onclick: () => (explainFn ? explainFn() : showRules()) }),
      gearBtn
    ]);
    document.body.appendChild(bar);
  }
  // Лише «Меню · Підказка · …свої кнопки» (гра з роботом: Назад, Вперед)
  function navOnly(extra) {
    const bar = document.querySelector('.lg-nav'); if (!bar) return [];
    bar.querySelectorAll('.lg-nav-btn:not(.lg-home)').forEach(b => { if (b !== hintBtn) b.remove(); });
    const made = extra.map(([ico, label, fn, attrs]) => { const b = navBtn(ico, label, { onclick: fn, ...(attrs || {}) }); bar.appendChild(b); return b; });
    // порядок: Назад · Колір · Рівень · Підказка · … (підказка — після «Рівня», якщо він є)
    const lv = made.find(b => b.dataset.act === 'level');
    if (lv && hintBtn) lv.after(hintBtn);
    return made;
  }

  // ---------- публічне API ----------
  // ---------- набори фігур (з Lichess): спільні для шахових ігор ----------
  const PIECE_SETS = ['cburnett', 'merida', 'alpha', 'california', 'cardinal', 'anarcandy', 'fantasy', 'horsey', 'pixel', 'xkcd'];
  function pieceSetPicker(onChange) {
    const cur = store.get('pieceSet', 'cburnett');
    const grid = el('div', { class: 'lg-piece-sets' });
    PIECE_SETS.forEach(name => {
      const b = el('button', { type: 'button', class: 'lg-piece-set' + (name === cur ? ' active' : ''), title: name, 'aria-label': name }, [
        el('img', { src: root + 'shared/pieces/' + name + '/wN.svg', alt: '' })
      ]);
      b.addEventListener('click', () => {
        store.set('pieceSet', name);
        grid.querySelectorAll('.lg-piece-set').forEach(x => x.classList.toggle('active', x === b));
        onChange(name);
      });
      grid.appendChild(b);
    });
    return el('div', {}, [el('div', { class: 'lg-set-title', text: 'Фігури' }), grid]);
  }

  const LG = window.LG = {
    lang: () => lang,
    go, _fsClose: fsClose,
    // У рамці (гра поверх головної) повним екраном керує головне вікно
    fullscreen: (() => {
      const own = {
        supported: fsOk,
        on: () => !!fsEl(),
        set(on) { store.set('fullscreen', !!on); fsToggling = true; (on ? fsEnter() : Promise.resolve(fsExit())).then(() => setTimeout(() => { fsToggling = false; }, 300)); },
        onChange(cb) { ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, cb)); }
      };
      let t = null; try { t = inFrame && window.top.LG && window.top.LG.fullscreen; } catch (e) { /* */ }
      return t || own;
    })(),
    // Кругла кнопка повного екрана (гра з роботом, уроки, задачі): сама малює свій стан; без підтримки браузера — null
    fsButton(extra) {
      const fs = LG.fullscreen; if (!fs.supported) return null;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lg-top-btn lg-top-fs' + (extra ? ' ' + extra : '');
      const ic = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
      const paint = () => { const on = fs.on(); b.innerHTML = ic(on ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'); b.setAttribute('aria-label', on ? 'Вийти з повного екрана' : 'Повний екран'); };
      paint(); fs.onChange(() => setTimeout(paint, 50));
      b.addEventListener('click', () => { fs.set(!fs.on()); LG.play('tap'); setTimeout(paint, 400); });
      return b;
    },
    setLang: l => { store.set('lang', l === 'en' ? 'en' : 'uk'); location.reload(); },
    t: s => (window.LG_T ? window.LG_T(s) : s),
    boardTheme: () => store.get('boardTheme', 'brown'),
    setBoardTheme: id => store.set('boardTheme', id),
    prepReward,
    pieceSet: () => store.get('pieceSet', 'cburnett'),
    pieceSetPicker,
    game,
    muted: store.get('muted', false),
    volume: store.get('volume', 0.8),
    playFile,
    showSettings,
    addSettings: fn => { settingsBuilders.push(fn); if (gearBtn) gearBtn.hidden = false; },
    onHint: fn => { hintFn = fn; if (hintBtn) hintBtn.hidden = !fn; },
    hint: () => hintFn && hintFn(), // підказка «як кнопкою 💡» (вчитель в уроках підказує сам, якщо дитина довго не ходить)
    onExplain: fn => { explainFn = fn; },
    navOnly: extra => { buildBar(); return navOnly(extra); },
    navIcon: ico => ICONS[ico] || ico,
    store,
    play,
    toast,
    confetti,
    showRules,
    openModal,
    closeModal,
    stats,
    win: (msg, opts) => result('win', msg, opts),
    lose: (msg, opts) => result('lose', msg, opts),
    draw: (msg, opts) => result('draw', msg, opts)
  };

  if (!game) return; // головна сторінка використовує лише API

  // Дитячі ігри не повинні показувати системні alert-вікна
  window.alert = msg => { toast(msg, 'warn'); play('error'); };

  function init() {
    document.documentElement.classList.add('lg');
    if (nightSupported) document.documentElement.classList.toggle('lg-night', store.get('night:' + gameId, script.dataset.night === 'on'));
    document.body.classList.add('lg-game', 'lg-game-' + gameId);
    document.title = game.title + ' · Шахи';
    buildBar();
    tickStart = Date.now();
    setInterval(flushTime, 15000);
    document.addEventListener('visibilitychange', () => { flushTime(); if (!document.hidden) tickStart = Date.now(); });
    window.addEventListener('pagehide', flushTime);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
