import { PUZZLE_SECTIONS, PUZZLE_GROUPS } from '../shared/puzzle-catalog.js?v=1791621585';
import { judgePuzzleMove, puzzleMoves } from '../shared/puzzle-rules.js?v=1791621585';
import { syncPuzzleProgress } from '../shared/puzzle-progress.js?v=1791621585';
import { bestUci, warmUp } from '../shared/engine.js?v=1791621585';
/* Шахові задачі: список розділів → задача або практика.
   Мат і тактика — задачі Lichess; шах — авторські навчальні позиції (chess-puzzles/puzzles.json). Спершу сам робиться хід
   суперника, далі дитина знаходить хід (або кілька ходів), суперник відповідає за рішенням Lichess.
   Неправильний хід повертається назад; після 3 помилок гра показує розв'язок. Мат будь-яким ходом — теж правильно.
   Практика — закінчення проти робота без обмеження ходів: поставити мат (або провести пішака й поставити мат). */
import { Chess, makeSquare, parseSquare, parseUci, compat, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard, applyBoardLook } from '../shared/board.js?v=1791621585';
import { createRules } from '../chess/rules.js?v=1791621585';
import { createLevels, lessonDone } from '../shared/levels.js?v=1791621585';
import { hintMove } from '../shared/ai.js?v=1791621585';
import { toggleGuide, introGuide } from '../shared/guide.js?v=1791621585';

const LG = window.LG, $ = id => document.getElementById(id);
// кнопка повного екрана — у правому верхньому куті (як у грі з роботом)
{ const fsb = LG.fsButton && LG.fsButton(); if (fsb) document.querySelector('.mt-fsslot').appendChild(fsb); }
const main = document.querySelector('main.mt'), wrap = $('wrap');
const DATA = await (await fetch(new URL('puzzles.json' + new URL(import.meta.url).search, import.meta.url))).json();
// Відкрито з уроків (?lesson): звичайний урок — не більше 8 задач, угорі кружечки рівнів і Пан Сова (shared/levels.js)
const LESSON = new URLSearchParams(location.search).has('lesson'), LESSON_N = 8;
syncPuzzleProgress(LG.store, DATA);
const ALL = { ...DATA }; // «Гайд» бере приклади з усього розділу — не з тих 8 задач, що в уроці
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
  if (!flash && !(levels && done)) $('task').textContent = done && meta?.explanation ? meta.explanation : meta?.capture ? `Побий чорну фігуру ${RU[meta.role]} з шахом. Збережи свою фігуру.` : TASK[sec] || '';
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
  if (meta) { const king = makeSquare(pos.board.kingOf(pos.turn)); board.shapes([...pos.ctx().checkers].map(sq => ({ orig: makeSquare(sq), dest: king, brush: 'red' }))); }
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
    return setTimeout(() => { if (t === token && done) lessonNext(); }, meta ? 3200 : 1700);
  }
  if (mistakes < 3 && first && s.size === DATA[sec].length) {
    return LG.win(`Усі задачі «${INFO[sec].title}» розв’язано!`, { reward: true, onAgain: () => nextPuzzle() });
  }
  LG.play('win'); // без конфеті на кожну задачу — конфеті лише за справжню перемогу
  const t = token;
  setTimeout(() => { if (t === token && done) nextPuzzle(); }, meta ? 3200 : 1700);
}
function showSolution() {
  if (done || mode !== 'puzzle') return;
  done = true; mistakes = Math.max(mistakes, 3); board.setMovable(null); paint();
  const t = token;
  if (levels) { levels.done(idx, false); $('task').classList.add('bad'); } else setRes(DATA[sec][idx][0], 'r');
  const stepOne = () => {
    if (t !== token) return;
    if (step >= line.length) { if (levels) setTimeout(() => { if (t === token) lessonNext(); }, 1500); return; }
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

// ---------- приклад на початку розділу: пояснення й розв'язок, що програється сам ----------
// Беремо задачу з глибини розділу (перші, найпростіші, не підказуємо) — з найкоротшим розв'язком
const EXPLAIN = {
  chk: r => `Шах — це напад на короля. Поставити шах ${r} часто можна по-різному.`,
  esc_run: 'Королю шах! Утекти можна лише туди, де короля ніхто не б’є.',
  esc_capture: 'Королю шах! Найкраще — побити фігуру, що шахує: і врятувався, і виграв фігуру.',
  esc_block: 'Королю шах! Можна закритися: поставити свою фігуру між королем і нападником.',
  esc_mixed: 'Від шаху рятують три способи: утекти, побити або закритися. Тут підходить лише один.',
  mate: 'Мат — це шах, від якого нікуди подітися: ні втекти, ні побити, ні закритися.',
  mate2: 'Мат за 2 ходи: спершу хід, після якого суперник не врятується, а потім — мат.',
  fork: 'Вилка — одна фігура нападає одразу на дві. Обидві не врятувати!',
  pin: 'Зв’язка — фігура суперника не може відійти: за нею стоїть цінніша.',
  skewer: 'Простріл — нападаємо на цінну фігуру; вона тікає, а ми беремо ту, що за нею.',
  discovered: 'Відкритий напад — одна фігура відходить і відкриває удар іншої.',
  deflection: 'Відволікання — відтягуємо захисника, і те, що він захищав, лишається без охорони.',
  attraction: 'Заманювання — змушуємо фігуру суперника стати на погану клітинку.',
  hanging: 'Незахищена фігура — її ніхто не охороняє. Забирай безкоштовно!',
  promotion: 'Пішак, що дійшов до останнього ряду, стає ферзем (або іншою фігурою).'
};
// Підписи до ходів прикладу: [перед першим ходом, після нього, відповідь суперника, фінал]
const CAP = {
  fork: ['Дивись: ця фігура нападе одразу на дві 👇', 'Вилка! Під ударом одразу дві фігури.', 'Суперник рятує одну…', 'Виграли фігуру! 🎉'],
  pin: ['Нападаємо на фігуру, за якою стоїть цінніша 👇', 'Зв’язка! Відійти не можна — пропаде та, що позаду.', 'Суперник відповідає…', 'Виграли матеріал! 🎉'],
  skewer: ['Нападаємо на цінну фігуру 👇', 'Простріл! Цінна фігура мусить тікати…', 'Вона відходить…', '…і ми беремо ту, що стояла за нею! 🎉'],
  discovered: ['Ця фігура відійде — і відкриє удар іншої 👇', 'Відкритий напад! Нападають одразу дві наші фігури.', 'Суперник рятує одне…', '…а інше забираємо! 🎉'],
  deflection: ['Відтягуємо захисника з важливої клітинки 👇', 'Захиснику доведеться відволіктися…', 'Суперник відповідає…', 'Захисника немає — забираємо! 🎉'],
  attraction: ['Заманюємо фігуру суперника 👇', 'Приманка! Суперник мусить піти сюди…', 'Суперник пішов на погану клітинку…', 'А тепер — удар! 🎉'],
  hanging: ['Шукаємо фігуру, яку ніхто не захищає 👇', 'Забрали! 🎉', 'Суперник відповідає…', 'Виграли фігуру! 🎉'],
  promotion: ['Ведемо пішака вперед 👇', 'Пішак іде до останнього ряду!', 'Суперник відповідає…', 'Пішак став ферзем! 👑'],
  mate: ['Шукаємо хід, після якого королю нікуди подітися 👇', 'Мат! Королю нікуди подітися 🎉'],
  mate2: ['Спершу — хід, після якого суперник не врятується 👇', 'Сильний хід!', 'Суперник відповідає…', 'І мат! 🎉']
};
// «Гайд» розділу на весь екран: 3 справжні задачі з розділу програються самі — хід за ходом, зі стрілками й підписами.
// Мат — у кінці червоні хрестики на клітинках довкола короля: туди йому не можна.
const PIECE_IC = { rook: '♜', bishop: '♝', queen: '♛', knight: '♞', pawn: '♟' };
const NAME = { rook: 'Тура', bishop: 'Слон', queen: 'Ферзь', knight: 'Кінь', pawn: 'Пішак' };
function puzzleSlide(k, [, fen, moves, , , meta]) {
  const ln = moves.split(' '), key = exKey(k), c = CAP[key] || [], role = CHK_ROLE[k], steps = [];
  const p = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
  const user = ln.length % 2 === 1 ? p.turn : p.turn === 'white' ? 'black' : 'white';
  let n = 0;
  for (let i = 0; i < ln.length; i++) {
    const m = parseUci(ln[i]), ft = makeSquare(m.from) + makeSquare(m.to), last = i === ln.length - 1;
    if (p.turn !== user) {
      steps.push({ say: !n ? 'Суперник походив…' : p.isCheck() ? 'Король мусить тікати від шаху…' : c[2] || 'Суперник відповідає…', move: ln[i], wait: 1700 });
      p.play(m); continue;
    }
    if (role) {
      const all = checksBy(p, role, meta);
      steps.push({ say: all.length > 1 ? `Шах ${RU[role]} можна поставити ${all.length === 2 ? 'двома' : all.length === 3 ? 'трьома' : all.length} способами 👇` : `Ось хід ${RU[role]}, що нападає на короля 👇`, arrows: all.map(([a, b]) => a + b).join(' '), wait: 3000 });
      p.play(m);
      steps.push({ move: ln[i], say: meta?.explanation || 'Шах! Король під ударом — і нашу фігуру ніхто не може побити.', wait: 2800 });
    } else if (k.startsWith('esc_')) {
      const kg = makeSquare([...p.board.pieces(user, 'king')][0]), chk = [...p.ctx().checkers];
      const ya = chk.map(x => makeSquare(x) + kg + ':yellow').join(' ');
      steps.push({ say: `Шах! ${NAME[p.board.get(chk[0]).role] || 'Фігура'} нападає на короля (жовта стрілка).`, arrows: ya, wait: 2600 });
      const pc = p.board.get(m.from), kind = pc.role === 'king' && !chk.includes(m.to) ? 'run' : chk.includes(m.to) ? 'capture' : 'block';
      steps.push({ say: { run: 'Утікаємо: лише тут короля ніхто не б’є 👇', capture: 'Б’ємо фігуру, що шахує 👇', block: 'Закриваємося: ставимо фігуру на лінію удару 👇' }[kind], arrows: ya + ' ' + ft + ':' + (kind === 'run' ? 'green' : kind === 'capture' ? 'red' : 'blue'), wait: 2800 });
      p.play(m);
      steps.push({ move: ln[i], say: kind === 'capture' ? 'Король урятований — і ще виграли фігуру! 🎉' : 'Король урятований! 🎉', wait: 2400 });
    } else {
      steps.push({ say: n === 0 ? c[0] || 'Ось хід 👇' : last ? (key === 'mate2' ? 'А тепер — мат 👇' : key === 'promotion' ? 'Пішак — у ферзі 👇' : key === 'fork' ? 'А другу фігуру — забираємо 👇' : 'Забираємо 👇') : 'Далі — ось так 👇', arrows: ft, wait: 2600 });
      p.play(m);
      if (last && p.isCheckmate()) {
        const kq = [...p.board.pieces(p.turn, 'king')][0], around = [];
        let own = false;
        for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) {
          const f = (kq & 7) + df, r = (kq >> 3) + dr;
          if ((df || dr) && f >= 0 && f < 8 && r >= 0 && r < 8) { const pc = p.board.get(r * 8 + f); if (!pc || pc.color !== p.turn) around.push(makeSquare(r * 8 + f)); else own = true; }
        }
        steps.push({ move: ln[i], say: 'Мат! 🎉', wait: 1400 });
        steps.push({ say: 'Червоні хрестики — туди королю не можна: ці клітинки б’ють наші фігури.' + (own ? ' А решту клітинок займають його ж фігури.' : ' Втекти нікуди!'), cross: around.join(' '), wait: 4200 });
      } else {
        const after = last ? c[3] || c[1] || 'Готово! 🎉' : n === 0 ? (key === 'fork' && p.isCheck() ? 'Вилка з шахом! Під ударом король і ще одна фігура.' : c[1] || '') : '';
        steps.push({ move: ln[i], say: after || undefined, wait: last ? 2600 : 2000 });
      }
    }
    n++;
  }
  return { fen, steps, orientation: user };
}
function guideCfg() {
  const key = exKey(sec), text = key === 'chk' ? EXPLAIN.chk(RU[CHK_ROLE[sec]]) : EXPLAIN[key];
  const grp = GROUPS.find(([, l]) => l.some(x => x[0] === sec)), ic = INFO[sec].ic;
  const list = ALL[sec] || DATA[sec];
  return { icon: PIECE_IC[ic] || ic, title: (grp && grp[1].length > 1 ? grp[0] + ' · ' : '') + INFO[sec].title,
    intro: `<p>${text || ''}</p><p>🎯 ${TASK[sec] || ''}</p>`,
    slides: exampleIndices(sec, 3, list).map((i, j) => ({ ...puzzleSlide(sec, list[i]), title: `Приклад ${j + 1}` })) };
}
function showExplain() { toggleGuide(guideCfg()); }
const exKey = k => k.startsWith('chk_') ? 'chk' : k.startsWith('m1') ? 'mate' : k;
// n найзрозуміліших прикладів розділу (за зростанням складності)
function exampleIndices(k, n = 1, list = DATA[k]) {
  const from = Math.min(k.startsWith('chk_') ? 15 : k.startsWith('esc_') ? 10 : 8, list.length - 1);
  const scored = [];
  for (let i = from; i < Math.min(list.length, from + 15); i++) {
    const [, fen, moves] = list[i], ln = moves.split(' ');
    let s = ln.length;
    if (k === 'fork') { // вилка конем із шахом — найзрозуміліша
      const p = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap(), m = parseUci(ln[0]), q = p.clone(); q.play(m);
      if (p.board.get(m.from).role !== 'knight') s += 4;
      if (!q.isCheck()) s += 2;
    }
    if (k === 'promotion' && !ln.some(u => u.length === 5)) s += 10;
    if (k.startsWith('chk_')) { // більше різних шахів — цікавіше показати
      const p = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
      s -= checksBy(p, CHK_ROLE[k]).length;
    }
    scored.push([s, i]);
  }
  scored.sort((a, b) => a[0] - b[0]);
  return scored.length ? scored.slice(0, n).map(x => x[1]) : [from];
}
function exampleIndex(k) { return exampleIndices(k)[0]; }
// Усі ходи фігурою role, що дають шах
function checksBy(p, role, meta = {}) { return puzzleMoves(p, { objective: 'safe-check', role, ...meta }).map(m => [makeSquare(m.from), makeSquare(m.to)]); }
function cap(text) { clearTimeout(flash); flash = 0; $('task').classList.remove('say'); $('task').textContent = text; }
const wait = (ms, t) => new Promise((ok, stop) => setTimeout(() => (t === token ? ok() : stop('stop')), ms));
function startExample() {
  mode = 'example'; main.dataset.mode = 'example';
  setButtons([['📋', 'Розділи'], ['🔁', 'Ще раз'], ['👀', ''], ['▶️', 'Почати']]);
  runExample();
}
async function runExample() {
  const t = ++token;
  try { await exampleSteps(t); } catch (e) { if (e !== 'stop') throw e; }
}
async function exampleSteps(t) {
  const [, fen, moves] = DATA[sec][exampleIndex(sec)], ln = moves.split(' ');
  let p = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
  userColor = ln.length % 2 === 1 ? p.turn : p.turn === 'white' ? 'black' : 'white';
  const key = exKey(sec), c = CAP[key] || [], role = CHK_ROLE[sec];
  const goal = txt => { $('goal').innerHTML = `📖 ${txt}`; $('lives').textContent = ''; $('count').textContent = ''; };
  wrap.classList.remove('solved'); board.setMovable(null); board.clearHint();
  board.setOrientation(userColor); show(p, undefined, false);
  goal(`Приклад · ${INFO[sec].title}`);
  cap(key === 'chk' ? EXPLAIN.chk(RU[role]) : EXPLAIN[key]);
  await wait(3200, t);
  const play = uci => { const { q, lm } = playUci(p, uci); p = q; show(p, lm); };
  let n = 0; // скільки ходів уже зробили ми
  for (let i = 0; i < ln.length; i++) {
    const m = parseUci(ln[i]), from = makeSquare(m.from), to = makeSquare(m.to), last = i === ln.length - 1;
    if (p.turn !== userColor) { cap(!n ? 'Суперник походив…' : p.isCheck() ? 'Король мусить тікати від шаху…' : c[2] || 'Суперник відповідає…'); play(ln[i]); await wait(1700, t); continue; }
    if (role) { // «Постав шах»: показуємо всі шахи цією фігурою, потім робимо один
      const all = checksBy(p, role);
      board.shapes(all.map(([a, b]) => ({ orig: a, dest: b, brush: 'green' })));
      cap(all.length > 1 ? `Шах ${RU[role]} можна поставити ${all.length === 2 ? 'двома' : all.length === 3 ? 'трьома' : all.length} способами — ось вони 👇` : `Ось хід ${RU[role]}, що нападає на короля 👇`);
      await wait(3000, t);
      board.clearHint(); play(ln[i]);
      cap(all.length > 1 ? 'Обираємо будь-який — і шах! Король під ударом 🎉' : 'Шах! Король під ударом 🎉');
    } else if (sec.startsWith('esc_')) { // «Урятуйся»: хто шахує → як урятуватися
      const k = [...p.board.pieces(userColor, 'king')][0], chk = [...p.ctx().checkers];
      board.shapes(chk.map(s => ({ orig: makeSquare(s), dest: makeSquare(k), brush: 'yellow' })));
      cap(`Шах! ${({ rook: 'Тура', bishop: 'Слон', queen: 'Ферзь', knight: 'Кінь', pawn: 'Пішак' })[p.board.get(chk[0]).role]} нападає на короля (жовта стрілка).`);
      await wait(2600, t);
      const pc = p.board.get(m.from), kind = pc.role === 'king' && !chk.includes(m.to) ? 'run' : chk.includes(m.to) ? 'capture' : 'block';
      board.shapes([...chk.map(s => ({ orig: makeSquare(s), dest: makeSquare(k), brush: 'yellow' })), { orig: from, dest: to, brush: kind === 'run' ? 'green' : kind === 'capture' ? 'red' : 'blue' }]);
      cap({ run: 'Утікаємо: лише тут короля ніхто не б’є 👇', capture: 'Б’ємо фігуру, що шахує 👇', block: 'Закриваємося: ставимо фігуру на лінію удару — її захищають 👇' }[kind]);
      await wait(2800, t);
      board.clearHint(); play(ln[i]);
      cap(kind === 'capture' ? 'Король урятований — і ще виграли фігуру! 🎉' : 'Король урятований! 🎉');
    } else {
      board.shapes([{ orig: from, dest: to, brush: 'green' }]);
      cap(n === 0 ? c[0] || 'Ось хід 👇' : last ? (key === 'mate2' ? 'А тепер — мат 👇' : key === 'promotion' ? 'Пішак — у ферзі 👇' : key === 'fork' ? 'А другу фігуру — забираємо 👇' : 'Забираємо 👇') : 'Далі — ось так 👇');
      await wait(2600, t);
      board.clearHint(); play(ln[i]);
      const after = last ? (p.isCheckmate() ? 'Мат! Королю нікуди подітися 🎉' : c[3] || c[1] || 'Готово! 🎉')
        : n === 0 ? (key === 'fork' && p.isCheck() ? 'Вилка з шахом! Під ударом король і ще одна фігура.' : c[1] || '') : '';
      if (after) cap(after);
    }
    n++;
    await wait(last ? 600 : 2000, t);
  }
  wrap.classList.add('solved'); LG.play('win');
  goal('Тепер ти! Натисни «Почати ▶️»');
}

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
LG.onExplain(() => { if (mode === 'puzzle' || mode === 'example') showExplain(); else LG.showRules(); });
function userMove(from, to) { if (mode === 'puzzle') puzzleMove(from, to); else if (mode === 'practice') practiceMove(from, to); }
$('hint').addEventListener('click', async () => {
  if (mode === 'example') return runExample();
  if (done) return;
  const meta = mode === 'puzzle' && DATA[sec][idx][5];
  if (meta?.hint && hintStage === 0) { hintStage = 1; say(meta.hint, 4500); return; }
  let from, to;
  if (mode === 'puzzle') { if (pos.turn !== userColor) return; const m = parseUci(line[step]); from = makeSquare(m.from); to = makeSquare(m.to); }
  else if (mode === 'practice') {
    if (pos.turn !== 'white') return;
    const at = pos, t = token, m = await bestMove(pos, 700);
    if (!m || at !== pos || t !== token) return;
    from = m.from; to = m.to;
  } else return;
  // перший раз — яка фігура ходить, другий — куди
  if (hintStage < (meta ? 2 : 1)) { board.shapes([{ orig: from, brush: 'hint' }]); hintStage++; }
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

document.addEventListener('touchmove', e => { if (!e.target.closest('.lg-modal, .mt-menu')) e.preventDefault(); }, { passive: false });
route();

