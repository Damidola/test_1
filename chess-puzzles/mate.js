import { GUIDE_CONTENT } from '../shared/guide-content.js?v=1791646040';
import { PUZZLE_SECTIONS, PUZZLE_GROUPS } from '../shared/puzzle-catalog.js?v=1791646040';
import { judgePuzzleMove, puzzleMoves } from '../shared/puzzle-rules.js?v=1791646040';
import { syncPuzzleProgress } from '../shared/puzzle-progress.js?v=1791646040';
import { bestUci, warmUp } from '../shared/engine.js?v=1791646040';
/* Шахові задачі: список розділів → задача або практика.
   Мат і тактика — навчальні позиції та відредаговані задачі Lichess; шах — авторські позиції (chess-puzzles/puzzles.json). Спершу сам робиться хід
   суперника, далі дитина знаходить хід (або кілька ходів), суперник відповідає за рішенням Lichess.
   Неправильний хід повертається назад; після 3 помилок гра показує розв'язок. Мат будь-яким ходом — теж правильно.
   Практика — закінчення проти робота без обмеження ходів: поставити мат (або провести пішака й поставити мат). */
import { Chess, makeSquare, parseSquare, parseUci, compat, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard, applyBoardLook } from '../shared/board.js?v=1791646040';
import { createRules } from '../chess/rules.js?v=1791646040';
import { createLevels, lessonDone } from '../shared/levels.js?v=1791646040';
import { hintMove } from '../shared/ai.js?v=1791646040';
import { toggleGuide, introGuide } from '../shared/guide.js?v=1791646040';

const LG = window.LG, $ = id => document.getElementById(id);
// кнопка повного екрана — у правому верхньому куті (як у грі з роботом)
{ const fsb = LG.fsButton && LG.fsButton(); if (fsb) document.querySelector('.mt-fsslot').appendChild(fsb); }
const main = document.querySelector('main.mt'), wrap = $('wrap');
const DATA = await (await fetch(new URL('puzzles.json' + new URL(import.meta.url).search, import.meta.url))).json();
// Відкрито з уроків (?lesson): звичайний урок — не більше 8 задач, угорі кружечки рівнів і Пан Сова (shared/levels.js)
const LESSON = new URLSearchParams(location.search).has('lesson'), LESSON_N = 8;
syncPuzzleProgress(LG.store, DATA);
if (LESSON) for (const k in DATA) DATA[k] = DATA[k].slice(0, LESSON_N);
let levels = null;

const GROUPS = PUZZLE_GROUPS.map(({ title, ids }) => [title, ids.map(id => { const s = PUZZLE_SECTIONS[id]; return [id, s.icon, s.title, s.description]; })]);
const TASK = Object.fromEntries(Object.entries(PUZZLE_SECTIONS).map(([id, s]) => [id, s.task]));
Object.assign(TASK, { kqk: 'Постав мат ферзем і королем.', krk: 'Постав мат турою й королем.', kbbk: 'Постав мат двома слонами.', kpk: 'Проведи пішака в ферзі й постав мат.' });
const MATE_SEC = k => k.startsWith('m1') || k === 'mate2';
// Задачі на шах: правильний будь-який хід потрібного виду (не лише записаний)
const CHK_ROLE = Object.fromEntries(Object.entries(PUZZLE_SECTIONS).filter(([, s]) => s.role).map(([id, s]) => [id, s.role]));
const RU = { rook: 'турою', bishop: 'слоном', queen: 'ферзем', knight: 'конем', pawn: 'пішаком' };
function ruleCheck(p, m) {
  const goal = { ...PUZZLE_SECTIONS[sec], ...DATA[sec]?.[idx]?.[5] };
  if (!goal?.objective) return null;
  const result = judgePuzzleMove(p, m, goal);
  return [result.ok, result.message];
}
// Практика закінчень відкривається з уроків («Як ходять фігури»), у меню задач її немає
const PRACTICE_ITEMS = [
  ['kqk', 'queen', 'Ферзь і король проти короля', 'Постав мат — ходів скільки завгодно'],
  ['krk', 'rook', 'Тура і король проти короля', 'Заганяй короля до краю дошки'],
  ['kbbk', 'bishop', 'Два слони і король проти короля', 'Слони разом — і король у куті'],
  ['kpk', 'pawn', 'Король і пішак проти короля', 'Проведи пішака у ферзі й постав мат']
];
const INFO = Object.fromEntries([...GROUPS.flatMap(([, list]) => list), ...PRACTICE_ITEMS].map(([k, ic, title, sub]) => [k, { ic, title, sub }]));
const PRACTICE = ['kqk', 'krk', 'kbbk', 'kpk'];
const icon = ic => /^[a-z]+$/.test(ic) ? `<mpiece class="${ic} white"></mpiece>` : ic;

const board = createBoard($('board'), { onMove: (o, d) => userMove(o, d) });
const solvedOf = k => new Set(LG.store.get('puz:' + k, []));

let mode = 'menu', sec = null, idx = 0, pos = null, line = [], step = 0, userColor = 'white';
let mistakes = 0, done = false, hintStage = 0, lastMove, token = 0, history = [];

// ---------- дрібниці ----------
const pieces = p => { const m = new Map(); for (const [sq, pc] of p.board) m.set(makeSquare(sq), { role: pc.role, color: pc.color }); return m; };
const show = (p, lm, animate) => { lastMove = lm; board.setPosition(pieces(p), { lastMove: lm, check: p.isCheck() ? p.turn : false, animate }); };
const same = (a, b) => FEN.makeBoardFen(a.board) === FEN.makeBoardFen(b.board) && a.turn === b.turn;
const sound = (p, m) => LG.play(p.board.get(m.to) ? 'capture' : 'move');
function playUci(p, uci) { const m = parseUci(uci), q = p.clone(); sound(p, m); q.play(m); return { q, lm: [makeSquare(m.from), makeSquare(m.to)] }; }
const promoFor = (p, from, to) => p.board.get(parseSquare(from))?.role === 'pawn' && (to[1] === '8' || to[1] === '1');
const allowMoves = () => board.setMovable(userColor, compat.chessgroundDests(pos));

// Тимчасовий напис під дошкою
let flash = 0;
function say(text, ms = 1900) {
  $('task').textContent = text; $('task').classList.add('say');
  clearTimeout(flash); flash = setTimeout(() => { flash = 0; $('task').classList.remove('say'); paint(); }, ms);
}
// Як суперник рятується від шаху: король тікає, фігуру, що шахує, б'ють або закриваються
function escape(p) { return escapes(p)[0]; }
function escapes(p) {
  const list = [];
  for (const [from, dests] of p.allDests()) for (const to of dests) {
    const pc = p.board.get(from), victim = p.board.get(to);
    const m = { from, to, promotion: pc.role === 'pawn' && (to >> 3 === 0 || to >> 3 === 7) ? 'queen' : undefined };
    const uci = makeSquare(from) + makeSquare(to) + (m.promotion ? 'q' : '');
    if (pc.role === 'king' && victim && victim.color === pc.color) continue; // рокіровка
    list.push({ uci, rank: pc.role === 'king' ? (victim ? 1 : 0) : victim ? 2 : 3,
      text: pc.role === 'king' ? (victim ? 'Король збив фігуру — це не мат' : 'Король утік — туди ніхто не б’є') : victim ? 'Фігуру, що шахує, просто збили' : 'Від шаху закрилися іншою фігурою' });
  }
  list.sort((a, b) => a.rank - b.rank);
  return list;
}
// Вибір фігури для перетворення пішака, як на Lichess
function askPromotion(to, color) {
  return new Promise(done => {
    const white = board.cg.state.orientation === 'white', f = 'abcdefgh'.indexOf(to[0]);
    const col = white ? f : 7 - f, top = (to[1] === '8') === white;
    const el = document.createElement('div');
    el.className = 'mt-promo';
    el.innerHTML = ['queen', 'knight', 'rook', 'bishop'].map((r, i) =>
      `<button type="button" data-r="${r}" style="left:${col * 12.5}%;${top ? 'top' : 'bottom'}:${i * 12.5}%"><mpiece class="${r} ${color}"></mpiece></button>`).join('');
    const finish = r => { el.remove(); done(r ? { queen: 'q', knight: 'n', rook: 'r', bishop: 'b' }[r] : ''); };
    el.addEventListener('click', e => { const b = e.target.closest('button'); finish(b && b.dataset.r); });
    wrap.appendChild(el);
  });
}

function setButtons(list) {
  document.querySelectorAll('.lg-controls button:not(#prev)').forEach((b, i) => {
    const [ico, lbl] = list[i]; b.querySelector('.ico').textContent = ico; b.querySelector('.lbl').textContent = lbl;
  });
}

// ---------- список розділів ----------
function renderMenu() {
  $('menu').innerHTML = GROUPS.map(([title, list]) => `<h2>${title}</h2><div class="mt-list">${list.map(([k, ic, name, sub]) => {
    let pr = '';
    if (DATA[k]) { const n = solvedOf(k).size, t = DATA[k].length; pr = `<span class="pr${n >= t ? ' all' : ''}">✅ ${n}/${t}</span>`; }
    else { const w = LG.store.get('prac:' + k, 0); pr = w ? `<span class="pr all">🏆 ${w}</span>` : ''; }
    return `<button type="button" class="mt-card" data-k="${k}"><span class="ic">${icon(ic)}</span><b>${name}</b><small>${sub}</small>${pr}</button>`;
  }).join('')}</div>`).join('');
}
$('menu').addEventListener('click', e => { const b = e.target.closest('.mt-card'); if (b) { history.length = 0; location.hash = b.dataset.k; } });
function route() {
  const k = decodeURIComponent(location.hash.slice(1));
  token++;
  document.querySelector('.pk')?.remove();
  // свого меню розділів тут немає — розділи вибирають у вкладці «Практика» застосунку
  if (!INFO[k] && !LESSON) { location.replace('../index.html#practice'); return; }
  if (!INFO[k]) { mode = 'menu'; main.dataset.mode = 'menu'; board.setMovable(null); renderMenu(); return; }
  sec = k;
  $('list').hidden = $('show').hidden = $('next').hidden = false;
  if (PRACTICE.includes(k)) { mode = 'practice'; main.dataset.mode = 'practice'; setButtons([['🎓', 'Уроки'], ['💡', 'Підказка'], ['↩️', 'Назад'], ['🔄', 'Заново']]); startPractice(); }
  else { startPuzzles(); if (LESSON) introGuide(guideCfg()); } // урок без відео — спершу «Гайд» з прикладами
}
function startPuzzles() {
  // задачі гортають стрілки вгорі, вихід — стрілка ‹
  mode = 'puzzle'; main.dataset.mode = 'puzzle'; setButtons([['📋', 'Розділи'], ['💡', 'Підказка'], ['↩️', 'Назад'], ['🔄', 'Заново']]); $('list').hidden = true; $('show').hidden = $('next').hidden = true; // у задачах унизу лише Підказка й Гайд
  if (LESSON) {
    if (!levels) {
      main.dataset.lesson = '1';
      const t = document.createElement('span'); t.id = 'title'; t.hidden = true; t.textContent = INFO[sec].title; main.prepend(t);
      const el = document.createElement('div'); el.className = 'lv-bar'; el.id = 'levels'; wrap.before(el);
      levels = createLevels(el, 'puz-' + sec, DATA[sec].length, i => { token++; idx = i; loadPuzzle(); }, DATA[sec].map(row => row[0]));
    }
    idx = levels.open();
    return loadPuzzle();
  }
  idx = openIdx();
  loadPuzzle();
}
// урок: наступний рівень, а після останнього — вікно «Урок пройдено!»
function lessonNext() {
  const n = DATA[sec].length, r = LG.store.get('lvl:puz-' + sec, []);
  const open = [...Array(n).keys()].find(i => !r[i]);
  // вікно «Урок пройдено» — лише після останньої задачі; до того — просто наступна
  if (idx + 1 < n) { idx++; return loadPuzzle(); }
  if (open === undefined) return lessonDone({ title: INFO[sec].title, text: 'Молодець! Усі задачі розв’язано.', key: 'puz-' + sec, n,
    here: 'chess-puzzles/index.html?lesson=1#' + sec, onAgain: () => { idx = 0; loadPuzzle(); } });
  idx = open; loadPuzzle();
}
// Задачі по черзі: відкрита лише наступна після розв'язаної (або тієї, де вже показали розв'язок)
function openIdx() {
  const list = DATA[sec], s = solvedOf(sec);
  let first = list.findIndex(([id]) => !s.has(id)); if (first < 0) first = list.length - 1;
  return Math.min(list.length - 1, Math.max(first, LG.store.get('puzopen:' + sec, 0)));
}
window.addEventListener('hashchange', route);
$('list').addEventListener('click', () => { if (mode === 'practice') location.href = '../lessons/index.html'; else location.href = '../index.html#practice'; });

// ---------- задачі Lichess ----------
function loadPuzzle() {
  clearTimeout(flash); flash = 0; $('task').classList.remove('say');
  const [, fen, moves] = DATA[sec][idx];
  pos = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
  line = moves.split(' '); step = 0; mistakes = 0; done = false; hintStage = 0;
  // у спрощених задачах першим ходить гравець; у задачах Lichess — спершу суперник
  const userFirst = line.length % 2 === 1;
  userColor = userFirst ? pos.turn : pos.turn === 'white' ? 'black' : 'white';
  wrap.classList.remove('solved');
  if (levels) { levels.set(idx); $('task').classList.remove('ok', 'passed', 'bad'); }
  // у задачах на шах не підказуємо крапками, куди можна піти
  board.cg.set({ movable: { showDests: !/^(chk|esc)_/.test(sec) } });
  board.setOrientation(userColor); board.clearHint(); board.setMovable(null);
  show(pos, undefined, false); paint();
  const t = ++token;
  if (userFirst) allowMoves();
  else setTimeout(() => { if (t === token) opponent(); }, 700);
}
function opponent() { // хід суперника з рішення Lichess
  const { q, lm } = playUci(pos, line[step]);
  pos = q; step++;
  show(pos, lm); allowMoves(); paint();
}
function paint() {
  const info = INFO[sec];
  const meta = DATA[sec]?.[idx]?.[5];
  if (!flash && !(levels && done)) $('task').textContent = done && meta?.explanation ? meta.explanation : meta?.task || (meta?.capture ? `Побий чорну фігуру ${RU[meta.role]} з шахом. Збережи свою фігуру.` : TASK[sec] || '');
  if (mode === 'practice') {
    $('goal').innerHTML = `${icon(info.ic)} ${info.title}`;
    $('lives').textContent = ''; $('count').textContent = '🏆 ' + LG.store.get('prac:' + sec, 0);
    return;
  }
  const side = userColor === 'white' ? '<span class="mt-side"></span> ходять білі' : '<span class="mt-side b"></span> ходять чорні';
  $('goal').innerHTML = done ? (mistakes >= 3 ? 'Ось як треба 👆' : 'Правильно! 🎉') : `<span class="mt-sec">${info.title}</span><span class="mt-who">${side}</span>`;
  $('goal').classList.toggle('ok', done && mistakes < 3); $('goal').classList.toggle('bad', done && mistakes >= 3);
  $('lives').textContent = '❤️'.repeat(Math.max(0, 3 - mistakes)) + '🤍'.repeat(Math.min(3, mistakes));
  $('count').textContent = `${idx + 1} / ${DATA[sec].length}`;
}
async function puzzleMove(from, to) {
  if (done || pos.turn !== userColor) return;
  const exp = line[step];
  let promo = '';
  if (promoFor(pos, from, to)) {
    const t0 = token;
    promo = await askPromotion(to, userColor);
    if (t0 !== token) return;
    if (!promo) { show(pos, lastMove); return allowMoves(); }
  }
  const test = pos.clone(); test.play(parseUci(from + to + promo));
  const want = pos.clone(); want.play(parseUci(exp));
  const rule = ruleCheck(pos, parseUci(from + to + promo), test);
  if (rule ? !rule[0] : !same(test, want) && !test.isCheckmate()) {
    if (rule) say(rule[1], 2200);
    mistakes++; LG.play('error'); paint();
    const t = token;
    const lm0 = lastMove; // хід до помилки — щоб підсвітка не лишилась від показаної відповіді
    let backed = false;
    const back = () => {
      if (t !== token || backed) return;
      backed = true; wrap.removeEventListener('pointerdown', skip, true);
      board.clearHint(); show(pos, lm0); allowMoves();
      if (mistakes >= 3) showSolution(); else paint();
    };
    // дотик до дошки під час показу — одразу повертаємо позицію, щоб можна було ходити
    const skip = () => back();
    wrap.addEventListener('pointerdown', skip, true);
    board.setMovable(null);
    // Шах, але не мат: показуємо, як суперник рятується, — і повертаємо назад
    if (MATE_SEC(sec) && test.isCheck()) {
      show(test, [from, to]);
      const outs = escapes(test), r = outs[0];
      say('Шах, але не мат: ' + (outs.length > 1 ? 'ось як можна врятуватися 👇' : 'ось як урятуватися 👇'), 3600);
      // стрілки: усі способи врятуватися (куди тікає король, хто б'є, хто закриває)
      setTimeout(() => { if (t === token && !backed) board.shapes(outs.slice(0, 8).map(o => ({ orig: o.uci.slice(0, 2), dest: o.uci.slice(2, 4), brush: o.rank === 0 ? 'green' : o.rank === 3 ? 'blue' : 'red' }))); }, 350);
      setTimeout(() => {
        if (t !== token || !r || backed) return;
        board.clearHint();
        const { q, lm } = playUci(test, r.uci); show(q, lm);
        say(r.text, 2200);
        setTimeout(back, 1300);
      }, 1500);
      return;
    }
    if (!rule) say(MATE_SEC(sec) ? 'Це не мат — спробуй ще 🙂' : 'Не той хід — спробуй ще 🙂');
    setTimeout(back, 450);
    return;
  }
  const { q, lm } = playUci(pos, from + to + promo);
  pos = q; step++; hintStage = 0; board.clearHint();
  show(pos, lm);
  if (step >= line.length || pos.isCheckmate()) return solved();
  board.setMovable(null);
  const t = token;
  setTimeout(() => { if (t === token) opponent(); }, 500);
}
function solved() {
  clearTimeout(flash); flash = 0; $('task').classList.remove('say');
  const meta = DATA[sec][idx][5];
  if (meta) {
    const t = token, king = makeSquare(pos.board.kingOf(pos.turn));
    const arrows = [...pos.ctx().checkers].map(sq => ({ orig: makeSquare(sq), dest: king, brush: 'red' }));
    board.afterAnimation(() => { if (t === token && done) board.shapes(arrows); });
  }
  done = true; board.setMovable(null); wrap.classList.add('solved');
  const s = solvedOf(sec), first = !s.has(DATA[sec][idx][0]);
  if (mistakes < 3) { s.add(DATA[sec][idx][0]); LG.store.set('puz:' + sec, [...s]); }
  if (!levels) setRes(DATA[sec][idx][0], mistakes >= 3 ? 'r' : mistakes ? 'y' : 'g');
  paint();
  if (levels) {
    levels.done(idx, mistakes === 0);
    $('task').classList.add('ok'); if (mistakes) $('task').classList.add('passed');
    $('task').textContent = meta?.explanation || (mistakes ? 'Вийшло! Молодець 👍' : 'Ідеально! 🌟');
    LG.play('win');
    const t = token;
    return setTimeout(() => { if (t === token && done) lessonNext(); }, meta ? 900 : 750);
  }
  if (mistakes < 3 && first && s.size === DATA[sec].length) {
    return LG.win(`Усі задачі «${INFO[sec].title}» розв’язано!`, { reward: true, onAgain: () => nextPuzzle() });
  }
  LG.play('win'); // без конфеті на кожну задачу — конфеті лише за справжню перемогу
  const t = token;
  setTimeout(() => { if (t === token && done) nextPuzzle(); }, meta ? 900 : 750);
}
function showSolution() {
  if (done || mode !== 'puzzle') return;
  done = true; mistakes = Math.max(mistakes, 3); board.setMovable(null); paint();
  const t = token;
  if (levels) { levels.done(idx, false); $('task').classList.add('bad'); } else setRes(DATA[sec][idx][0], 'r');
  const stepOne = () => {
    if (t !== token) return;
    if (step >= line.length) { if (levels) setTimeout(() => { if (t === token) lessonNext(); }, 500); return; }
    const m = parseUci(line[step]);
    if (pos.turn === userColor) board.hint(makeSquare(m.from), makeSquare(m.to));
    setTimeout(() => {
      if (t !== token) return;
      board.clearHint();
      const { q, lm } = playUci(pos, line[step]); pos = q; step++; show(pos, lm);
      setTimeout(stepOne, 700);
    }, pos.turn === userColor ? 900 : 300);
  };
  stepOne();
}
function prevPuzzle() {
  if (idx === 0) return LG.play('error');
  idx--;
  loadPuzzle();
}
function nextPuzzle() {
  const list = DATA[sec];
  // задачі можна гортати вільно (стрілками біля номера)
  if (idx >= list.length - 1) { idx = 0; return loadPuzzle(); }
  idx++;
  if (idx > LG.store.get('puzopen:' + sec, 0)) LG.store.set('puzopen:' + sec, idx);
  loadPuzzle();
}

// ---------- зміст розділу: превʼю задачі «продовжити», успіх і всі задачі кольоровими квадратиками ----------
// результат задачі: g — без помилок, y — з помилками, r — показали розвʼязок
const resOf = k => LG.store.get('puzres:' + k, {});
function setRes(id, r) { const m = resOf(sec); m[id] = r; LG.store.set('puzres:' + sec, m); }
const resFor = (k, id, m = resOf(k), s = solvedOf(k)) => m[id] || (s.has(id) ? 'g' : '');
function miniBoard(fen, moves) {
  const [placement, turn] = fen.split(' '), set = LG.store.get('pieceSet', 'cburnett') || 'cburnett';
  const flip = (moves.split(' ').length % 2 === 1) === (turn === 'b');
  const cells = [];
  placement.split('/').forEach((row, r) => { let c = 0; for (const ch of row) { if (/\d/.test(ch)) { for (let i = 0; i < +ch; i++) cells.push([r, c++, '']); } else cells.push([r, c++, ch]); } });
  if (flip) cells.reverse();
  return '<div class="pk-mini">' + cells.map(([r, c, ch], i) => {
    const dark = (r + c) % 2 === 1;
    const img = ch ? `<img alt="" src="../shared/pieces/${set}/${ch === ch.toUpperCase() ? 'w' : 'b'}${ch.toUpperCase()}.svg">` : '';
    return `<i class="${dark ? 'd' : ''}">${img}</i>`;
  }).join('') + '</div>';
}
// «Назад» Telegram спершу закриває сітку задач
LG.onBack && LG.onBack(() => { const pk = document.querySelector('.pk'); if (pk) { pk.remove(); return true; } return false; });
function showPicker(fromMenu) {
  document.querySelector('.pk')?.remove();
  const list = DATA[sec], m = resOf(sec), s = solvedOf(sec), info = INFO[sec];
  const res = list.map(([id]) => resFor(sec, id, m, s)), tried = res.filter(Boolean);
  const pct = Math.round(tried.reduce((a, r) => a + (r === 'g' ? 100 : r === 'y' ? 50 : 0), 0) / list.length);
  const cont = fromMenu ? openIdx() : idx, [, fen, moves] = list[cont];
  const o = document.createElement('div'); o.className = 'pk';
  o.innerHTML = `<div class="pk-top"><button type="button" class="pk-back" aria-label="Назад">‹</button><b>${info.title}</b></div>
    <div class="pk-head">${miniBoard(fen, moves)}<div class="pk-info">
      <div class="pk-solved">Розвʼязано: <b>${tried.filter(r => r !== 'r').length}</b> з ${list.length}</div>
      <div class="pk-rate">Успіх: <span class="pk-bar"><span style="width:${pct}%"></span></span> ${pct}%</div><div class="pk-note">${tried.length ? `🟩 ${res.filter(r => r === 'g').length} · 🟧 ${res.filter(r => r === 'y').length} · 🟥 ${res.filter(r => r === 'r').length}` : 'ще не пробував'}</div>
      <button type="button" class="pk-go">${fromMenu ? (tried.length ? 'Продовжити' : 'Почати') : 'Повернутися'} · №${cont + 1}</button></div></div>
    <div class="pk-legend"><span><i class="g"></i>без помилок</span><span><i class="y"></i>з помилками</span><span><i class="r"></i>не вийшло</span></div>
    <div class="pk-grid">${res.map((r, i) => `<button type="button" class="${r}${i === cont ? ' cur' : ''}" data-i="${i}">${i + 1}</button>`).join('')}</div>`;
  const close = () => o.remove();
  const open = i => { close(); if (i === idx && !fromMenu) return; token++; idx = i; if (idx > LG.store.get('puzopen:' + sec, 0)) LG.store.set('puzopen:' + sec, idx); loadPuzzle(); };
  o.querySelector('.pk-back').onclick = () => { LG.play('tap'); if (fromMenu) { close(); location.hash = ''; } else close(); };
  o.querySelector('.pk-go').onclick = () => { LG.play('tap'); open(cont); };
  o.querySelector('.pk-grid').onclick = e => { const b = e.target.closest('button'); if (b) { LG.play('tap'); open(+b.dataset.i); } };
  main.appendChild(o);
  o.querySelector('.cur')?.scrollIntoView({ block: 'nearest' });
}

// Reviewed explanations are independent of the currently selected task.
const PIECE_IC = { rook: '♜', bishop: '♝', queen: '♛', knight: '♞', pawn: '♟' };
function guideCfg() {
  const grp = GROUPS.find(([, l]) => l.some(x => x[0] === sec)), ic = INFO[sec].ic;
  return { icon: PIECE_IC[ic] || ic, title: (grp && grp[1].length > 1 ? grp[0] + ' · ' : '') + INFO[sec].title,
    ...(GUIDE_CONTENT.puzzles[sec] || GUIDE_CONTENT.practice[sec]) };
}
function showExplain() { toggleGuide(guideCfg()); }
function startExample() { startPuzzles(); showExplain(); }
function runExample() { startPuzzles(); showExplain(); }

// ---------- практика: закінчення проти робота ----------
const VAL = { pawn: 100, knight: 300, bishop: 320, rook: 500, queen: 900, king: 0 };
const base = createRules();
const dist = (a, b) => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));
const edge = s => Math.max(3 - (s & 7), (s & 7) - 4) + Math.max(3 - (s >> 3), (s >> 3) - 4);
// Оцінка «заганяй короля»: чорний король — ближче до краю, білий король — ближче до нього; пішак — вперед
const rules = {
  ...base,
  evaluate(p, s) {
    let v = 0, wk = -1, bk = -1, pawn = -1;
    for (const [sq, pc] of p.board) {
      if (pc.role === 'king') { if (pc.color === 'white') wk = sq; else bk = sq; continue; }
      v += (pc.color === 'white' ? 1 : -1) * VAL[pc.role];
      if (pc.role === 'pawn' && pc.color === 'white') { pawn = sq; v += 30 * (sq >> 3); }
    }
    if (pawn >= 0) v += 12 * dist(bk, pawn) - 12 * dist(wk, pawn) + 8 * dist(bk, (pawn & 7) + 56);
    else v += 20 * edge(bk) - 6 * dist(wk, bk);
    return s === 'w' ? v : -v;
  },
  aiDepth: [2, 3, 3]
};
const rnd = n => Math.floor(Math.random() * n);
// Stockfish 10 (stockfish.js, GPL) у фоновому потоці: робот захищається й дає підказки, як на Lichess.
// Якщо рушій не запустився — простий власний пошук (shared/ai.js).
async function bestMove(p, ms) {
  const uci = await bestUci(FEN.makeFen(p.toSetup()), { skill: 20, ms });
  if (uci) return { from: uci.slice(0, 2), to: uci.slice(2, 4), promo: uci[4] || '' };
  const move = hintMove(rules, p);
  return move && { from: move.from, to: move.to, promo: move.promo || '' };
}
function makePos(put) {
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) { const c = put[r * 8 + f]; if (c) { if (empty) row += empty; empty = 0; row += c; } else empty++; }
    rows.push(row + (empty || ''));
  }
  const res = Chess.fromSetup(FEN.parseFen(rows.join('/') + ' w - - 0 1').unwrap());
  return res.isOk ? res.unwrap() : null;
}
function genPosition(k) {
  for (let t = 0; t < 20000; t++) {
    const put = {}, free = s => s >= 0 && s < 64 && !put[s];
    const bk = k === 'kpk' ? rnd(64) : (2 + rnd(4)) + 8 * (2 + rnd(4)); // у практиці мату — король у центрі
    put[bk] = 'k';
    let wk, extra = [];
    if (k === 'kpk') {
      const pf = 1 + rnd(6), pr = 1 + rnd(3), ps = pr * 8 + pf; // пішак b–g, 2–4 ряд
      wk = (pr + 2) * 8 + pf - 1 + rnd(3); // король на «ключовому полі» — виграш є завжди
      if (!free(ps) || !free(wk) || dist(bk, ps) < 3) continue;
      put[ps] = 'P'; extra = [ps];
    } else {
      wk = rnd(64); if (!free(wk)) continue;
      put[wk] = 'K';
      const pcs = { kqk: ['Q'], krk: ['R'], kbbk: ['B', 'B'] }[k];
      let ok = true;
      for (const c of pcs) { const s = rnd(64); if (!free(s)) { ok = false; break; } put[s] = c; extra.push(s); }
      if (!ok) continue;
      if (k === 'kbbk' && ((extra[0] & 7) + (extra[0] >> 3)) % 2 === ((extra[1] & 7) + (extra[1] >> 3)) % 2) continue;
    }
    put[wk] = 'K';
    if (dist(wk, bk) < 2 || extra.some(s => dist(s, bk) < 2)) continue;
    const p = makePos(put);
    if (!p || p.isCheck() || p.isEnd()) continue;
    return p;
  }
}
function startPractice() {
  board.cg.set({ movable: { showDests: true } });
  warmUp();
  pos = genPosition(sec); history = [pos]; userColor = 'white'; done = false; hintStage = 0; token++;
  wrap.classList.remove('solved'); board.setOrientation('white'); board.clearHint();
  show(pos, undefined, false); allowMoves(); paint();
}
async function practiceMove(from, to) {
  if (done || pos.turn !== 'white') return;
  let promo = '';
  if (promoFor(pos, from, to)) {
    const t0 = token;
    promo = await askPromotion(to, 'white');
    if (t0 !== token) return;
    if (!promo) { show(pos, lastMove); return allowMoves(); }
  }
  const { q, lm } = playUci(pos, from + to + promo);
  pos = q; history.push(pos); board.clearHint(); show(pos, lm);
  if (practiceEnd()) return;
  board.setMovable(null);
  const t = token, started = Date.now();
  bestMove(pos, 350).then(m => setTimeout(() => {
    if (t !== token || !m) return;
    const { q: r, lm: l } = playUci(pos, m.from + m.to + m.promo);
    pos = r; history.push(pos); show(pos, l);
    if (!practiceEnd()) allowMoves();
  }, Math.max(0, 850 + Math.random() * 400 - (Date.now() - started))));
}
function practiceEnd() {
  const again = () => { location.hash === '#' + sec ? startPractice() : null; };
  if (pos.isCheckmate()) {
    done = true; board.setMovable(null); wrap.classList.add('solved');
    LG.store.set('prac:' + sec, LG.store.get('prac:' + sec, 0) + 1); paint();
    LG.win('Мат! Чудово зіграно!', { reward: true, onAgain: again });
    return true;
  }
  if (pos.isStalemate()) { done = true; board.setMovable(null); LG.draw('Пат: королю нікуди піти, але шаху немає. Лиши йому клітинку!', { onAgain: again }); return true; }
  if (pos.isInsufficientMaterial()) { done = true; board.setMovable(null); LG.draw('Фігуру забрали — мат тепер не поставити. Стеж, щоб її захищав король!', { onAgain: again }); return true; }
  return false;
}

// ---------- кнопки ----------
$('ex').hidden = true; // пояснення — кнопкою внизу
// Нижня панель: 💡 — підказка (спершу фігура, потім хід), 📖 — приклад-пояснення розділу
LG.onHint(() => { if (mode === 'puzzle' || mode === 'practice') $('hint').click(); });
LG.onExplain(() => INFO[sec] ? showExplain() : LG.showRules());
function userMove(from, to) { if (mode === 'puzzle') puzzleMove(from, to); else if (mode === 'practice') practiceMove(from, to); }
$('hint').addEventListener('click', async () => {
  if (mode === 'example') return runExample();
  if (done) return;
  const meta = mode === 'puzzle' && DATA[sec][idx][5];
  if (meta?.hint && step === 0 && hintStage === 0) { hintStage = 1; say(meta.hint, 4500); return; }
  let from, to;
  if (mode === 'puzzle') { if (pos.turn !== userColor) return; const m = parseUci(line[step]); from = makeSquare(m.from); to = makeSquare(m.to); }
  else if (mode === 'practice') {
    if (pos.turn !== 'white') return;
    const at = pos, t = token, m = await bestMove(pos, 700);
    if (!m || at !== pos || t !== token) return;
    from = m.from; to = m.to;
  } else return;
  // перший раз — яка фігура ходить, другий — куди
  if (hintStage < (meta && step === 0 ? 2 : 1)) { board.shapes([{ orig: from, brush: 'hint' }]); hintStage++; }
  else board.hint(from, to);
});
// «Назад» у задачі: відміняємо свій останній хід (і відповідь суперника) — позиція перед ним
function puzzleBack() {
  const first = line.length % 2 === 1 ? 0 : 1;
  if (done || pos.turn !== userColor || step - 2 < first) return LG.play('error');
  token++;
  const n = step - 2, [, fen] = DATA[sec][idx];
  let p = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap(), lm;
  for (let i = 0; i < n; i++) { const m = parseUci(line[i]); p.play(m); lm = [makeSquare(m.from), makeSquare(m.to)]; }
  pos = p; step = n; hintStage = 0; board.clearHint(); show(pos, lm); allowMoves(); paint();
}
$('show').addEventListener('click', () => {
  if (mode === 'puzzle') return puzzleBack();
  if (mode !== 'practice' || done || history.length < 3 || pos.turn !== 'white') return LG.play('error');
  history.splice(-2); pos = history[history.length - 1]; board.clearHint(); show(pos); allowMoves();
});
$('prev').addEventListener('click', () => { if (mode === 'puzzle') prevPuzzle(); });
$('pv').addEventListener('click', () => { if (mode === 'puzzle') { LG.play('tap'); prevPuzzle(); } });
$('count').addEventListener('click', () => { if (mode === 'puzzle' && !levels) { LG.play('tap'); showPicker(false); } });
$('nx').addEventListener('click', () => { if (mode === 'puzzle') { LG.play('tap'); nextPuzzle(); } });
$('prev').hidden = true; // попередня/наступна — стрелками вгорі
$('next').addEventListener('click', () => { if (mode === 'example') startPuzzles(); else if (mode === 'puzzle') { LG.play('tap'); loadPuzzle(); } else if (mode === 'practice') startPractice(); });

document.addEventListener('touchmove', e => { if (!e.target.closest('.lg-modal, .mt-menu, .gd-scroll, .pk')) e.preventDefault(); }, { passive: false });
route();

