/* «Гайд» — пояснення на весь екран (як у ChessKid): угорі значок і назва, дошка з анімацією, під нею ‹ ❚❚ › і кружечки
   прикладів, текст, що змінюється разом з анімацією, унизу — «Зрозуміло». Тією ж кнопкою «Гайд» (або ✕, «Назад») закривається.
   toggleGuide({ icon, title, intro, slides, button, onClose })
     slides: [{ fen, title, orientation, steps: [{ say, arrows: 'e2e4 d4:red', move: 'e2e4 h1f1', dots: 'a1 a2', cross: 'g8 h7', check, wait }] }]
   Фігури переставляються без перевірки правил — на дошці можуть бути лише потрібні фігури, без королів.
   move: кілька переміщень через пробіл; 5-та літера — перетворення (d7d8q); рокіровка — король на 2 клітинки або на свою туру;
   пішак навскоси на порожню клітинку — взяття на проході. */
import { Chess, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard } from './board.js?v=1791627703';

const ROLE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const LETTER = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k' };
const shape = s => { const [u, brush = 'green'] = s.split(':'); return u.length === 2 ? { orig: u, brush } : { orig: u.slice(0, 2), dest: u.slice(2, 4), brush }; };

export function parsePlacement(fen) {
  const m = new Map();
  fen.split(' ')[0].split('/').forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += +ch; continue; }
      m.set('abcdefgh'[f] + (8 - r), { role: ROLE[ch.toLowerCase()], color: ch === ch.toLowerCase() ? 'black' : 'white' });
      f++;
    }
  });
  return m;
}
function placement(m) {
  const rows = [];
  for (let r = 8; r >= 1; r--) {
    let s = '', n = 0;
    for (const f of 'abcdefgh') { const p = m.get(f + r); if (!p) { n++; continue; } if (n) s += n; n = 0; s += p.color === 'white' ? LETTER[p.role].toUpperCase() : LETTER[p.role]; }
    rows.push(s + (n || ''));
  }
  return rows.join('/');
}
// шах — лише коли на дошці обидва королі й позиція можлива
function checkOf(m, mover) {
  const side = mover === 'white' ? 'b' : 'w';
  try { const p = Chess.fromSetup(FEN.parseFen(placement(m) + ' ' + side + ' - - 0 1').unwrap()); return p.isOk && p.unwrap().isCheck() ? (side === 'w' ? 'white' : 'black') : false; } catch (e) { return false; }
}
// один крок «move»: переставити фігури; повертає [from, to] першого переміщення
export function applyMove(m, uci) {
  let lm = null, mover = null;
  for (const u of uci.split(' ').filter(Boolean)) {
    const from = u.slice(0, 2), to = u.slice(2, 4), pc = m.get(from); if (!pc) continue;
    mover = mover || pc.color; lm = lm || [from, to];
    const df = to.charCodeAt(0) - from.charCodeAt(0), tgt = m.get(to);
    if (pc.role === 'king' && tgt && tgt.color === pc.color && tgt.role === 'rook') {
      // рокіровка «король на туру» (як у chessops)
      const r = from[1], kTo = (df > 0 ? 'g' : 'c') + r, rTo = (df > 0 ? 'f' : 'd') + r;
      m.delete(from); m.delete(to); m.set(kTo, pc); m.set(rTo, tgt); lm = [from, kTo]; continue;
    }
    if (pc.role === 'king' && Math.abs(df) === 2 && !uci.includes(' ')) {
      const r = from[1], rFrom = (df > 0 ? 'h' : 'a') + r, rook = m.get(rFrom);
      if (rook) { m.delete(rFrom); m.set((df > 0 ? 'f' : 'd') + r, rook); }
    }
    if (pc.role === 'pawn' && df !== 0 && !tgt) m.delete(to[0] + from[1]); // на проході
    m.delete(from);
    m.set(to, u[4] ? { role: ROLE[u[4]], color: pc.color } : (pc.role === 'pawn' && (to[1] === '8' || to[1] === '1') ? { role: 'queen', color: pc.color } : pc));
  }
  return { lm, check: mover ? checkOf(m, mover) : false };
}

let current = null;
export const guideOpen = () => !!current;
export function closeGuide() { if (current) current(); }
export function toggleGuide(cfg) { if (current) { closeGuide(); return false; } openGuide(cfg); return true; }

export function openGuide({ icon = '📖', title = '', intro = '', slides = [], button = 'Зрозуміло 👍', onClose } = {}) {
  closeGuide();
  slides = slides.filter(s => s && s.fen);
  const LG = window.LG;
  const o = document.createElement('div'); o.className = 'gd'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', title);
  const many = slides.length > 1;
  o.innerHTML = `<div class="gd-top"><span class="gd-ic">${icon}</span><b class="gd-title"></b><button type="button" class="gd-x" aria-label="Закрити">✕</button></div>
    <div class="gd-scroll">${slides.length ? `<div class="gd-stage"><div class="gd-board"><div class="lg-board-el"></div></div>
      ${many ? '<button type="button" class="gd-side gd-prev" aria-label="Попередній приклад">‹</button><button type="button" class="gd-side gd-next" aria-label="Наступний приклад">›</button>' : ''}</div>
    <div class="gd-ctl"><button type="button" class="gd-prev" aria-label="Попередній приклад"${many ? '' : ' hidden'}>‹</button>
      <button type="button" class="gd-pause" aria-label="Пауза">❚❚</button><button type="button" class="gd-next" aria-label="Наступний приклад"${many ? '' : ' hidden'}>›</button></div>
    ${many ? `<div class="gd-dots">${slides.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>` : ''}` : ''}
    <div class="gd-text"><h3 class="gd-st"></h3><p class="gd-say"></p><div class="gd-intro">${intro}</div></div></div>
    <button type="button" class="gd-go">${button}</button>`;
  o.querySelector('.gd-title').textContent = title;
  // над сторінкою, але під нижньою панеллю: «Гайд» у панелі лишається видимим і закриває пояснення
  document.body.appendChild(o);
  document.documentElement.classList.add('gd-on');
  const $ = s => o.querySelector(s), say = $('.gd-say'), st = $('.gd-st');
  let board = null, idx = 0, token = 0, paused = false;
  const wait = (ms, t) => new Promise((ok, stop) => setTimeout(() => (t === token ? ok() : stop('stop')), ms));

  function fit() {
    const nav = document.querySelector('html.lg .lg-nav');
    o.style.bottom = nav && nav.getClientRects().length && getComputedStyle(nav).display !== 'none' ? nav.offsetHeight + 'px' : '0px';
    if (!board) return;
    // Дошка і весь текст — один прокручуваний блок. Висота тексту не звужує дошку.
    $('.gd-board').style.width = $('.gd-scroll').clientWidth + 'px';
    board.redraw();
  }
  async function run(t) {
    try {
      for (;;) {
        const s = slides[idx], m = parsePlacement(s.fen);
        let apples = (s.apples || '').split(' ').filter(Boolean); // зірочки, які фігура збирає
        o.querySelectorAll('.gd-dots i').forEach((d, i) => d.classList.toggle('on', i === idx));
        st.textContent = s.title || ''; st.hidden = !s.title; say.textContent = '';
        const marks = extra => { const mk = new Map(apples.map(k => [k, 'gd-apple'])); for (const [k, v] of extra || []) mk.set(k, v); board.marks(mk); };
        board.clearHint(); marks(); board.setOrientation(s.orientation || 'white'); board.setPosition(m, { animate: false });
        await wait(600, t);
        for (const step of s.steps || []) {
          if (step.say) say.textContent = step.say;
          if (step.move) board.clearHint();
          else if (step.arrows) board.shapes(step.arrows.split(' ').filter(Boolean).map(shape));
          const mk = new Map();
          (step.dots || '').split(' ').filter(Boolean).forEach(k => mk.set(k, 'gd-dot'));
          (step.cross || '').split(' ').filter(Boolean).forEach(k => mk.set(k, 'gd-cross'));
          if (step.move) {
            const r = applyMove(m, step.move);
            apples = apples.filter(k => !m.has(k));
            board.setPosition(m, { lastMove: r.lm, check: step.check !== undefined ? step.check : r.check });
            if (step.arrows) board.afterAnimation(() => { if (t === token) board.shapes(step.arrows.split(' ').filter(Boolean).map(shape)); });
            LG && LG.play && LG.play('move');
          }
          if (step.dots || step.cross || step.move) marks(mk);
          await wait(step.wait ?? (step.move ? 1200 : 2400), t);
        }
        await wait(1600, t);
        if (many) idx = (idx + 1) % slides.length; // по колу: приклад за прикладом
      }
    } catch (e) { if (e !== 'stop') throw e; }
  }
  const play = () => { paused = false; $('.gd-pause').textContent = '❚❚'; $('.gd-pause').setAttribute('aria-label', 'Пауза'); run(++token); };
  const pause = () => { paused = true; token++; $('.gd-pause').textContent = '▶'; $('.gd-pause').setAttribute('aria-label', 'Грати'); };
  const goTo = i => { idx = (i + slides.length) % slides.length; LG && LG.play && LG.play('tap'); play(); };

  let offBack = null;
  const close = () => {
    token++; current = null; offBack && offBack();
    removeEventListener('resize', fit); removeEventListener('DOMContentLoaded', fit); removeEventListener('keydown', key);
    document.documentElement.classList.remove('gd-on');
    o.classList.add('out'); setTimeout(() => { if (board) board.destroy(); o.remove(); }, 180);
    onClose && onClose();
  };
  const key = e => { if (e.key === 'Escape') close(); if (!slides.length) return; if (e.key === 'ArrowLeft') goTo(idx - 1); if (e.key === 'ArrowRight') goTo(idx + 1); };
  current = close;
  offBack = LG && LG.onBack ? LG.onBack(() => { if (current !== close) return false; close(); return true; }) : null;
  o.addEventListener('click', e => {
    if (e.target.closest('.gd-x, .gd-go')) { LG && LG.play && LG.play('tap'); close(); }
    else if (e.target.closest('.gd-prev')) goTo(idx - 1);
    else if (e.target.closest('.gd-next')) goTo(idx + 1);
    else if (e.target.closest('.gd-pause')) { LG && LG.play && LG.play('tap'); paused ? play() : pause(); }
    else if (e.target.closest('.gd-dots i')) goTo(+e.target.closest('.gd-dots i').dataset.i);
  });
  addEventListener('keydown', key);
  addEventListener('DOMContentLoaded', fit, { once: true });
  if (slides.length) {
    board = createBoard($('.lg-board-el'));
    board.setMovable(null);
    addEventListener('resize', fit); fit(); setTimeout(fit, 60);
    play();
  }
  if (!slides.length) fit();
  return close;
}

// Перед вправами: якщо в уроку немає відео — одразу «Гайд» з кнопкою «Почати» (вимога: пояснення є в кожному уроці)
export function introGuide(cfg) {
  if (document.documentElement.dataset.video || (window.LGVideo && window.LGVideo.hasVideo && window.LGVideo.hasVideo())) return;
  openGuide({ ...cfg, button: 'Почати ▶️' });
}

// для уроків Lichess (зібрані в lessons/app.js — без імпорту модулів)
window.LGGuide = { open: openGuide, toggle: toggleGuide, intro: introGuide, close: closeGuide };
