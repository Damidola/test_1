/* Урок «Шах»: що таке шах, три способи врятуватися (утекти, побити, закритися) — приклад зі стрілками,
   потім прості завдання: 2 — «постав шах», по 3 — на кожен спосіб. Задачі — перші (найпростіші)
   з «Шахових задач» (chess-puzzles/puzzles.json, розділи chk_* та esc_*). Ходи перевіряються правилами chessops. */
import { Chess, parseUci, parseSquare, makeSquare, compat, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard } from '../shared/board.js?v=1790605844';
import { goNext, markSeen } from '../shared/path.js?v=1790605844';
import { createLevels, lessonDone } from '../shared/levels.js?v=1791468545';
import { toggleGuide } from '../shared/guide.js?v=1790605844';

const LG = window.LG, $ = id => document.getElementById(id), main = document.querySelector('main.vl');
const DATA = await (await fetch(new URL('../chess-puzzles/puzzles.json', import.meta.url))).json();

const TASKS = [
  ...DATA.chk_rook.slice(0, 1).map(z => ({ fen: z[1], kind: 'give', role: 'rook', title: 'Постав шах', text: 'Тепер ти: постав шах турою чорному королю.' })),
  ...DATA.chk_bishop.slice(0, 1).map(z => ({ fen: z[1], kind: 'give', role: 'bishop', title: 'Постав шах', text: 'Постав шах слоном — навскоси.' })),
  ...DATA.esc_run.slice(0, 3).map(z => ({ fen: z[1], kind: 'run', title: 'Утечи 🏃', text: 'Твоєму королю шах! Відведи короля туди, де його не б’ють.' })),
  ...DATA.esc_capture.slice(0, 3).map(z => ({ fen: z[1], kind: 'capture', title: 'Побий ⚔️', text: 'Шах! Побий фігуру, що шахує.' })),
  ...DATA.esc_block.slice(0, 3).map(z => ({ fen: z[1], kind: 'block', title: 'Закрийся 🛡️', text: 'Шах! Закрийся: постав свою фігуру між королем і нападником.' }))
];
// безпечний шах: після ходу жодна чорна фігура не може побити ту, що шахує
const safe = (q, to) => { for (const [, ds] of q.allDests()) if (ds.has(to)) return false; return true; };
const WAY = { run: 'утекти королем', capture: 'побити фігуру, що шахує', block: 'закритися' };
const RU = { rook: 'турою', bishop: 'слоном', queen: 'ферзем', knight: 'конем', pawn: 'пішаком' };
let idx = 0, pos, done = false, lock = false;

const board = createBoard($('board'), { onMove: (o, d) => onMove(o, d) });
board.cg.set({ movable: { showDests: false } }); // крапки не підказують, куди тікати
const pieces = p => { const m = new Map(); for (const [sq, pc] of p.board) m.set(makeSquare(sq), { role: pc.role, color: pc.color }); return m; };
const show = (p, lm) => board.setPosition(pieces(p), { lastMove: lm, check: p.isCheck() ? p.turn : false, animate: !!lm });
const kindOf = (p, m) => { const king = p.board.get(m.from).role === 'king', cap = p.ctx().checkers.has(m.to); return king && !cap ? 'run' : cap ? 'capture' : 'block'; };
function task(text, cls = '') { $('task').textContent = text; $('task').className = 'vl-task ' + cls; }

// кружечки рівнів угорі: по черзі, зелений/жовтий ✓
let errs = 0;
const lv = createLevels($('levels'), 'check', TASKS.length, i => { idx = i; load(); });
function load() {
  errs = 0; lv.set(idx);
  const t = TASKS[idx];
  pos = Chess.fromSetup(FEN.parseFen(t.fen).unwrap()).unwrap();
  done = false; lock = false;
  $('wrap').classList.remove('solved');
  show(pos); board.setMovable('white', compat.chessgroundDests(pos));
  $('goal').textContent = t.title;
  task(t.text);
  if (idx === 0) arrows(); else board.clearHint();
}
// Стрілки всіх способів порятунку (для прикладу)
function arrows() {
  const shapes = [], k = [...pos.board.pieces('white', 'king')][0];
  for (const c of pos.ctx().checkers) shapes.push({ orig: makeSquare(c), dest: makeSquare(k), brush: 'yellow' });
  for (const [from, ds] of compat.chessgroundDests(pos)) for (const to of ds) {
    const kind = kindOf(pos, { from: parseSquare(from), to: parseSquare(to) });
    shapes.push({ orig: from, dest: to, brush: kind === 'run' ? 'green' : kind === 'capture' ? 'red' : 'blue' });
  }
  board.shapes(shapes);
}
function onMove(from, to) {
  if (done || lock) return;
  const t = TASKS[idx], m = { from: parseSquare(from), to: parseSquare(to) };
  const pc = pos.board.get(m.from);
  if (pc.role === 'pawn' && (to[1] === '8' || to[1] === '1')) m.promotion = 'queen';
  const q = pos.clone(); q.play(m);
  let ok, why;
  if (t.kind === 'give') { ok = q.isCheck() && pc.role === t.role && safe(q, m.to); why = !q.isCheck() ? 'Це ще не шах — король не під ударом.' : pc.role !== t.role ? `Шах є, але треба ${RU[t.role]}!` : 'Шах є, але твою фігуру одразу поб’ють! Знайди безпечний шах 🛡️'; }
  else { const k = kindOf(pos, m); ok = k === t.kind; why = `Так теж можна врятуватися, але тут треба ${WAY[t.kind]}.`; }
  LG.play(pos.board.get(m.to) ? 'capture' : 'move');
  if (ok) {
    done = true; pos = q; show(pos, [from, to]); board.setMovable(null); board.clearHint(); $('wrap').classList.add('solved');
    task(t.kind === 'give' ? 'Шах! Король під ударом 🎉' : t.kind === 'capture' ? 'Побив — і ще й виграв фігуру! 🎉' : 'Король урятований! 🎉', 'ok');
    lv.done(idx, !errs);
    setTimeout(() => {
      if (idx < TASKS.length - 1) { idx++; load(); }
      else lessonDone({ title: 'Шах', text: 'Ти знаєш, що таке шах і як від нього врятуватися!', key: 'check', n: TASKS.length, here: 'lessons/check.html' });
    }, 1500);
    return;
  }
  lock = true; errs++; LG.play('error'); task(why, 'bad');
  setTimeout(() => { show(pos); board.setMovable('white', compat.chessgroundDests(pos)); if (idx === 0) arrows(); lock = false; }, 1100);
}

// Урок одразу починається із завдання; пояснення (📖 внизу) відкривається поверх і закривається тією ж кнопкою
let started = false;
const startTasks = () => { main.dataset.step = 'tasks'; board.redraw(); if (started) return; started = true; idx = lv.open(); load(); };
$('go').addEventListener('click', startTasks);
$('go').textContent = 'Зрозуміло 👍';
setTimeout(startTasks, 0);
// «Гайд» на весь екран: що таке шах і три способи врятуватися — кожен окремою анімацією
const introBox = document.querySelector('.vl-intro').cloneNode(true);
introBox.querySelectorAll('h2, button').forEach(e => e.remove());
const GUIDE = { icon: '⚠️', title: 'Що таке шах?', intro: introBox.innerHTML, slides: [
  { fen: '4k3/8/8/8/8/8/8/R5K1 w - - 0 1', title: '⚠️ Шах', steps: [
    { say: 'Тура стає на одну лінію з королем…', arrows: 'a1e1', wait: 1800 }, { move: 'a1e1' },
    { say: 'Шах! Тура нападає на короля — він мусить рятуватися.', arrows: 'e1e8:red', wait: 3000 }] },
  { fen: '4r2k/8/8/8/8/8/8/4K3 w - - 0 1', title: '🏃 Утекти', steps: [
    { say: 'Чорна тура шахує білого короля!', arrows: 'e8e1:red', wait: 2400 },
    { say: 'Утікаємо: король відходить з лінії тури.', arrows: 'e1d2', wait: 1800 }, { move: 'e1d2' },
    { say: 'Урятувався! Тура його більше не б’є.', wait: 2400 }] },
  { fen: '4r2k/8/8/8/R7/8/8/4K3 w - - 0 1', title: '🛡️ Закритися', steps: [
    { say: 'Знову шах турою по лінії e.', arrows: 'e8e1:red', wait: 2200 },
    { say: 'Закриваємося: наша тура стає між королем і нападником.', arrows: 'a4e4:blue', wait: 1800 }, { move: 'a4e4' },
    { say: 'Лінію закрито — шаху немає.', wait: 2400 }] },
  { fen: '4r2k/8/8/1B6/8/8/8/4K3 w - - 0 1', title: '⚔️ Побити', steps: [
    { say: 'Шах! Але туру можна побити слоном.', arrows: 'e8e1:red b5e8', wait: 2400 }, { move: 'b5e8' },
    { say: 'Побили — і ще й виграли туру. Це часто найкращий спосіб!', wait: 2800 }] }] };
$('intro').addEventListener('click', () => toggleGuide(GUIDE));
$('skip').addEventListener('click', () => { if (idx < TASKS.length - 1) { idx++; load(); } });
$('back').addEventListener('click', () => { location.href = 'index.html'; });
// Нижня панель: 💡 — хід-підказка, 📖 — що таке шах
LG.onExplain(() => toggleGuide(GUIDE));
LG.onHint(() => {
  if (main.dataset.step === 'intro' || done) return;
  const t = TASKS[idx];
  for (const [from, ds] of pos.allDests()) for (const to of ds) {
    const m = { from, to }, pc = pos.board.get(from);
    if (pc.role === 'king' && pos.board.get(to)?.color === pc.color) continue;
    const q = pos.clone(); q.play(m);
    const ok = t.kind === 'give' ? q.isCheck() && pc.role === t.role && safe(q, m.to) : kindOf(pos, m) === t.kind;
    if (ok) return board.hint(makeSquare(from), makeSquare(to));
  }
});
