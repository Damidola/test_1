/* Урок-лабіринт (lessons/maze.html#rook): маленька дошка 5×5…8×8, фігура доходить до кружечка, обходячи стіни.
   Рівні — lessons/mazes.js. Ідеально — найкоротшим шляхом. */
import { MAZES, dests, shortest } from './mazes.js?v=1790369995';
import { applyBoardLook, fitBoard } from '../shared/board.js?v=1790369995';
import { createLevels, lessonDone } from '../shared/levels.js?v=1790369995';

const LG = window.LG, $ = id => document.getElementById(id), main = document.querySelector('main.mz');
const K = location.hash.slice(1), M = MAZES[K] || MAZES.rook, here = 'lessons/maze.html#' + (MAZES[K] ? K : 'rook');
applyBoardLook();
$('title').textContent = M.title; document.title = M.title;
$('intro-text').textContent = M.text;
const lv = createLevels($('levels'), 'maze:' + K, M.levels.length, i => { idx = i; load(); });
const grid = $('grid'), wrap = $('wrap');
let idx = lv.open(), L, at, moves = 0, sel = false, done = false, hintStep = 0, pieceEl;
// картинка фігури — з набору, вибраного в Профілі
const pieceImg = role => new URL('../shared/pieces/' + (LG.store.get('pieceSet', 'cburnett') || 'cburnett') + '/w' + { rook: 'R', bishop: 'B', queen: 'Q', knight: 'N', king: 'K', pawn: 'P' }[role] + '.svg', import.meta.url).href;
document.querySelector('.mz-arrows mpiece')?.replaceWith(Object.assign(document.createElement('img'), { className: 'mz-arrows-pc', src: pieceImg(M.piece), alt: '' }));
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const cell = ([c, r]) => grid.children[r * L.w + c];

function load() {
  L = M.levels[idx]; at = L.from.slice(); moves = 0; sel = false; done = false; hintStep = 0; lv.set(idx);
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
  pieceEl = document.createElement('div'); pieceEl.className = 'mz-piece'; pieceEl.innerHTML = '<img alt="" src="' + pieceImg(M.piece) + '">';
  grid.appendChild(pieceEl); place(false);
  say(idx === 0 ? 'Доведи туру до білого кружечка! Натисни на туру — крапки покажуть, куди можна піти.' : 'Дійди до кружечка якнайменшою кількістю ходів.');
  select(true);
}
function place(anim) {
  pieceEl.style.transition = anim ? '' : 'none';
  pieceEl.style.transform = 'translate(' + at[0] * 100 + '%,' + at[1] * 100 + '%)';
}
function say(t, cls) { const el = $('task'); el.textContent = t; el.classList.remove('ok', 'bad'); if (cls) el.classList.add(cls); }
function select(on) {
  sel = on && !done; pieceEl.classList.toggle('sel', sel);
  grid.querySelectorAll('.dest').forEach(d => d.classList.remove('dest'));
  if (sel) for (const d of dests(M.piece, L, at)) cell(d).classList.add('dest');
}
grid.addEventListener('pointerdown', e => {
  const d = e.target.closest('.mz-grid > div'); if (!d || done) return;
  const to = [+d.dataset.c, +d.dataset.r];
  if (same(to, at)) return select(!sel);
  // тап по клітинці, куди можна піти, — одразу хід (фігура одна)
  if (!dests(M.piece, L, at).some(x => same(x, to))) { if (!d.classList.contains('wall')) LG.play('illegal'); return; }
  grid.querySelectorAll('.hint').forEach(x => x.classList.remove('hint'));
  at = to; moves++; hintStep = 0; LG.play('move'); place(true); select(false);
  if (same(at, L.to)) return win();
  setTimeout(() => select(true), 280);
});
function win() {
  done = true; wrap.classList.add('solved');
  const best = shortest(M.piece, L).length - 1, perfect = moves <= best;
  lv.done(idx, perfect);
  say(perfect ? 'Ідеально! 🌟' : 'Вийшло! Можна й швидше — за ' + best + ' ' + (best === 1 ? 'хід' : 'ходи') + ' 👍', 'ok');
  LG.play('win');
  setTimeout(() => {
    const r = LG.store.get('lvl:maze:' + K, []), open = M.levels.findIndex((_, i) => !r[i]);
    if (open < 0) return lessonDone({ title: M.title, text: 'Молодець! Тура пройшла всі лабіринти.', key: 'maze:' + K, n: M.levels.length, here, onAgain: () => { idx = 0; load(); } });
    idx = idx + 1 < M.levels.length && !r[idx + 1] ? idx + 1 : open; load();
  }, 1400);
}
// 💡 1-й раз — куди йти першим ходом, 2-й — увесь шлях
LG.onHint(() => {
  if (done) return;
  const path = shortest(M.piece, L, at); if (!path) return;
  grid.querySelectorAll('.hint').forEach(x => x.classList.remove('hint'));
  (hintStep ? path.slice(1) : [path[1]]).forEach(p => cell(p).classList.add('hint'));
  hintStep = 1;
});
// знайомство: відео (якщо є) + пояснення; уперше — перед вправами, потім — кнопкою «Гайд»
const video = $('video');
function intro(on) {
  main.dataset.step = on ? 'intro' : 'items';
  if (!M.video) return;
  if (on) { $('title').textContent = M.videoTitle || M.title; video.hidden = false; video.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + M.video + '?playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Відео"></iframe>'; }
  else { video.innerHTML = ''; $('title').textContent = M.title; }
}
LG.onExplain(() => intro(main.dataset.step !== 'intro'));
$('go').addEventListener('click', () => intro(false));
if (M.video && !LG.store.get('lvl:maze:' + K, []).length) intro(true);
$('again').addEventListener('click', () => load());
fitBoard(wrap);
load();
