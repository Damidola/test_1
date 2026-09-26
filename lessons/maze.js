/* Урок-лабіринт (lessons/maze.html#rook): маленька дошка 5×5…8×8, фігура має з’їсти полуничку, обходячи стіни.
   Рівні — lessons/mazes.js. Ідеально — найкоротшим шляхом. */
import { MAZES, movesFrom, solve, startState, attacked, solved } from './mazes.js?v=1790422147';
import { applyBoardLook, fitBoard } from '../shared/board.js?v=1790422147';
import { createLevels, lessonDone } from '../shared/levels.js?v=1790422147';

const LG = window.LG, $ = id => document.getElementById(id), main = document.querySelector('main.mz');
const K = location.hash.slice(1), M = MAZES[K] || MAZES.rook, here = 'lessons/maze.html#' + (MAZES[K] ? K : 'rook');
applyBoardLook();
$('title').textContent = M.title; document.title = M.title;
$('intro-text').textContent = M.text;
const lv = createLevels($('levels'), 'maze:' + K, M.levels.length, i => { idx = i; load(); });
const grid = $('grid'), wrap = $('wrap');
let idx = lv.open(), L, at, st, moves = 0, sel = false, done = false, hintStep = 0, pieceEl;
// картинка фігури — з набору, вибраного в Профілі
const pieceImg = (role, c = 'w') => new URL('../shared/pieces/' + (LG.store.get('pieceSet', 'cburnett') || 'cburnett') + '/' + c + { rook: 'R', bishop: 'B', queen: 'Q', knight: 'N', king: 'K', pawn: 'P' }[role] + '.svg', import.meta.url).href;
document.querySelector('.mz-arrows mpiece')?.replaceWith(Object.assign(document.createElement('img'), { className: 'mz-arrows-pc', src: pieceImg(M.piece), alt: '' }));
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const cell = ([c, r]) => grid.children[r * L.w + c];

function load() {
  L = M.levels[idx]; st = startState(M, L); at = st.at; moves = 0; sel = false; done = false; hintStep = 0; lv.set(idx);
  wrap.classList.remove('solved');
  wrap.style.setProperty('--w', L.w); wrap.style.setProperty('--h', L.h);
  const wall = new Set(L.walls.map(String));
  grid.innerHTML = '';
  for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) {
    const d = document.createElement('div');
    if ((r + c) % 2) d.classList.add('dk');
    if (wall.has(c + ',' + r)) d.classList.add('wall');
    if (same([c, r], L.to)) d.classList.add('goal');
    d.dataset.c = c; d.dataset.r = r; grid.appendChild(d);
  }
  // фігури суперника, які треба зʼїсти
  for (const [c, r, role] of st.left) cell([c, r]).innerHTML = '<img class="mz-en" alt="" src="' + pieceImg(role, 'b') + '">';
  pieceEl = document.createElement('div'); pieceEl.className = 'mz-piece'; pieceEl.innerHTML = '<img alt="" src="' + pieceImg(st.piece) + '">';
  grid.appendChild(pieceEl); place(false);
  say(M.task || (idx === 0 ? 'З’їж полуничку 🍓! Перетягни фігуру або натисни на неї — крапки покажуть, куди можна піти.' : 'З’їж полуничку 🍓 якнайменшою кількістю ходів.'));
  danger(); select(true);
}
// ходи йдуть по черзі: наступний починається, коли попередній доїхав (інакше швидкі тапи зрізають по діагоналі)
let queue = [], qT = 0, moving = false;
function place(anim) {
  const t = 'translate(' + at[0] * 100 + '%,' + at[1] * 100 + '%)';
  if (!anim) { stopQueue(); pieceEl.style.transition = 'none'; pieceEl.style.transform = t; return; }
  queue.push(t); if (!moving) step();
}
function step() {
  const t = queue.shift(); moving = !!t; if (!t) return;
  pieceEl.style.transition = ''; pieceEl.style.transform = t;
  qT = setTimeout(step, 280);
}
function stopQueue() { queue = []; clearTimeout(qT); moving = false; }
// клітинки під боєм фігур суперника (лише в рівнях, де вони б’ють)
function danger() {
  grid.querySelectorAll('.danger').forEach(d => d.classList.remove('danger'));
  if (L.safe) for (const k of attacked(L, st)) { const [c, r] = k.split(',').map(Number); const d = cell([c, r]); if (d && !d.querySelector('.mz-en')) d.classList.add('danger'); }
}
function say(t, cls) { const el = $('task'); el.textContent = t; el.classList.remove('ok', 'bad'); if (cls) el.classList.add(cls); }
function select(on) {
  sel = on && !done; pieceEl.classList.toggle('sel', sel);
  grid.querySelectorAll('.dest').forEach(d => d.classList.remove('dest'));
  if (sel) for (const m of movesFrom(L, st)) cell(m.to).classList.add('dest');
}
function go(to) {
  // тап або перетягування на клітинку, куди можна піти, — хід (фігура одна); інакше фігура повертається
  const m = movesFrom(L, st).find(x => same(x.to, to));
  if (!m) {
    place(true);
    if (!cell(to).classList.contains('wall') && !same(to, at)) { LG.play('illegal'); if (cell(to).classList.contains('danger')) say('Туди не можна — там тебе з’їдять! 🙈', 'bad'); }
    return;
  }
  grid.querySelectorAll('.hint').forEach(x => x.classList.remove('hint'));
  const ate = m.st.left.length < st.left.length, promo = m.st.piece !== st.piece;
  st = m.st; at = st.at; moves++; hintStep = 0; LG.play(ate ? 'capture' : 'move'); place(true); select(false);
  if (ate) { const en = cell(at).querySelector('.mz-en'); if (en) setTimeout(() => en.remove(), 200); }
  if (promo) { setTimeout(() => { pieceEl.querySelector('img').src = pieceImg(st.piece); }, 280); say('Пішак дійшов до краю — тепер він ферзь! 👑', 'ok'); }
  danger();
  if (solved(L, st)) return win();
  if (same(at, L.to) && st.left.length) say('Спершу зʼїж усі фігури суперника!', 'bad');
  setTimeout(() => select(true), 280);
}
const cellAt = (x, y) => { const d = document.elementFromPoint(x, y); const c = d && d.closest('.mz-grid > div:not(.mz-piece)'); return c ? [+c.dataset.c, +c.dataset.r] : null; };
// перетягування фігури пальцем (як на звичайній дошці); короткий дотик — вибір / хід тапом
let drag = null;
grid.addEventListener('pointerdown', e => {
  const to = cellAt(e.clientX, e.clientY); if (!to || done) return;
  if (!same(to, at)) return go(to);
  drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  grid.setPointerCapture(e.pointerId);
});
grid.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  if (!drag.moved) { drag.moved = true; stopQueue(); select(true); pieceEl.classList.add('drag'); }
  pieceEl.style.transition = 'none';
  const w = pieceEl.offsetWidth, h = pieceEl.offsetHeight;
  pieceEl.style.transform = 'translate(' + (at[0] * w + dx) + 'px,' + (at[1] * h + dy) + 'px) scale(1.15)';
});
const up = e => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null; pieceEl.classList.remove('drag');
  if (!d.moved) return select(!sel);
  const to = cellAt(e.clientX, e.clientY);
  if (to) go(to); else place(true);
};
grid.addEventListener('pointerup', up);
grid.addEventListener('pointercancel', e => { if (drag) { drag = null; pieceEl.classList.remove('drag'); place(true); } });
function win() {
  done = true; wrap.classList.add('solved');
  const best = solve(L, startState(M, L)).length - 1, perfect = moves <= best;
  lv.done(idx, perfect);
  say(perfect ? 'Ням! Ідеально! 🌟' : 'Ням! Можна й швидше — за ' + best + ' ' + (best === 1 ? 'хід' : 'ходи') + ' 👍', 'ok');
  LG.play('win');
  setTimeout(() => {
    // вікно «Урок пройдено» — лише після останнього рівня; до того — просто наступний рівень
    const r = LG.store.get('lvl:maze:' + K, []), open = M.levels.findIndex((_, i) => !r[i]);
    if (idx + 1 < M.levels.length) { idx++; return load(); }
    if (open < 0) return lessonDone({ title: M.title, text: 'Молодець! Усі лабіринти пройдено.', key: 'maze:' + K, n: M.levels.length, here, onAgain: () => { idx = 0; load(); } });
    idx = open; load();
  }, 1400);
}
// 💡 1-й раз — куди йти першим ходом, 2-й — увесь шлях
LG.onHint(() => {
  if (done) return;
  const sol = solve(L, st); if (!sol) return; const path = sol.map(x => x.at);
  grid.querySelectorAll('.hint').forEach(x => x.classList.remove('hint'));
  (hintStep ? path.slice(1) : [path[1]]).forEach(p => cell(p).classList.add('hint'));
  hintStep = 1;
});
// знайомство: відео (якщо є) + пояснення; уперше — перед вправами, потім — кнопкою «Гайд»
const video = $('video'); let vp = null, ytA = document.createElement('a');
function intro(on) {
  main.dataset.step = on ? 'intro' : 'items';
  if (!M.video) return;
  if (vp) { vp.destroy(); vp = null; video.innerHTML = ''; ytA.remove(); }
  if (on) { $('title').textContent = M.videoTitle || M.title; video.hidden = false; vp = LGVideo.player(M.video); video.append(vp.el); ytA = LGVideo.ytLink(M.video); $('go').after(ytA); }
  else $('title').textContent = M.title;
}
LG.onExplain(() => intro(main.dataset.step !== 'intro'));
$('go').addEventListener('click', () => intro(false));
if (M.video) intro(true);
$('again').addEventListener('click', () => load());
fitBoard(wrap);
load();
