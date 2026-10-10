import { PUZZLE_SECTIONS } from '../shared/puzzle-catalog.js?v=1791626399';
import { judgePuzzleMove, puzzleMoves, escapeKind } from '../shared/puzzle-rules.js?v=1791626399';
import { syncPuzzleProgress } from '../shared/puzzle-progress.js?v=1791626399';
/* Урок «Шах»: що таке шах, три способи врятуватися (утекти, побити, закритися) — приклад зі стрілками,
   потім прості завдання: 5 — «постав шах», по одному — на кожен спосіб. Задачі — перші (найпростіші)
   з «Шахових задач» (chess-puzzles/puzzles.json, розділи chk_* та esc_*). Ходи перевіряються правилами chessops. */
import { Chess, parseSquare, makeSquare, compat, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard } from '../shared/board.js?v=1791626399';
import { createLevels, lessonDone } from '../shared/levels.js?v=1791626399';
import { toggleGuide } from '../shared/guide.js?v=1791626399';

const LG = window.LG, $ = id => document.getElementById(id), main = document.querySelector('main.vl');
const DATA = await (await fetch(new URL('../chess-puzzles/puzzles.json' + new URL(import.meta.url).search, import.meta.url))).json();

syncPuzzleProgress(LG.store, DATA);
const TASKS = [
  ...['rook', 'bishop', 'queen', 'knight', 'pawn'].map(role => {
    const row = DATA['chk_' + role][0], goal = PUZZLE_SECTIONS['chk_' + role];
    return { id: row[0], fen: row[1], kind: 'give', role, title: 'Постав шах', text: goal.task, meta: row[5] };
  }),
  ...DATA.esc_run.slice(0, 1).map(z => ({ id: z[0], fen: z[1], kind: 'run', title: 'Утечи 🏃', text: 'Твоєму королю шах! Відведи короля туди, де його не б’ють.' })),
  ...DATA.esc_capture.slice(0, 1).map(z => ({ id: z[0], fen: z[1], kind: 'capture', title: 'Побий ⚔️', text: 'Шах! Побий фігуру, що шахує.' })),
  ...DATA.esc_block.slice(0, 1).map(z => ({ id: z[0], fen: z[1], kind: 'block', title: 'Закрийся 🛡️', text: 'Шах! Закрийся: постав свою фігуру між королем і нападником.' }))
];
const goalOf = t => ({ objective: t.kind === 'give' ? 'safe-check' : 'escape:' + t.kind, role: t.role });
let idx = 0, pos, done = false, lock = false, token = 0, hintStage = 0;

const board = createBoard($('board'), { onMove: (o, d) => onMove(o, d) });
board.cg.set({ movable: { showDests: false } }); // крапки не підказують, куди тікати
const pieces = p => { const m = new Map(); for (const [sq, pc] of p.board) m.set(makeSquare(sq), { role: pc.role, color: pc.color }); return m; };
const show = (p, lm) => board.setPosition(pieces(p), { lastMove: lm, check: p.isCheck() ? p.turn : false, animate: !!lm });
const kindOf = escapeKind;
function task(text, cls = '') { $('task').textContent = text; $('task').className = 'vl-task ' + cls; }

// кружечки рівнів угорі: по черзі, зелений/жовтий ✓
let errs = 0;
const lv = createLevels($('levels'), 'check', TASKS.length, i => { idx = i; load(); }, TASKS.map(t => t.id));
function load() {
  token++; hintStage = 0; errs = 0; lv.set(idx);
  const t = TASKS[idx];
  pos = Chess.fromSetup(FEN.parseFen(t.fen).unwrap()).unwrap();
  done = false; lock = false;
  $('wrap').classList.remove('solved');
  show(pos); board.setMovable('white', compat.chessgroundDests(pos));
  $('goal').textContent = t.title;
  task(t.text);
  board.clearHint();
}
function onMove(from, to) {
  if (done || lock) return;
  const active = token, t = TASKS[idx], m = { from: parseSquare(from), to: parseSquare(to) };
  const pc = pos.board.get(m.from);
  if (pc.role === 'pawn' && (to[1] === '8' || to[1] === '1')) m.promotion = 'queen';
  const q = pos.clone(); q.play(m);
  const { ok, message: why } = judgePuzzleMove(pos, m, goalOf(t));
  LG.play(pos.board.get(m.to) ? 'capture' : 'move');
  if (ok) {
    done = true; pos = q; show(pos, [from, to]); board.setMovable(null); board.clearHint(); $('wrap').classList.add('solved');
    if (t.kind === 'give') { const king = makeSquare(pos.board.kingOf(pos.turn)); board.shapes([{ orig: to, dest: king, brush: 'red' }]); }
    task(t.kind === 'give' ? t.meta.explanation : t.kind === 'capture' ? 'Побив — і ще й виграв фігуру! 🎉' : 'Король урятований! 🎉', 'ok');
    lv.done(idx, !errs);
    setTimeout(() => {
      if (active !== token) return;
      if (idx < TASKS.length - 1) { idx++; load(); }
      else lessonDone({ title: 'Шах', text: 'Ти знаєш, що таке шах і як від нього врятуватися!', key: 'check', n: TASKS.length, here: 'lessons/check.html' });
    }, t.kind === 'give' ? 3200 : 1800);
    return;
  }
  lock = true; errs++; LG.play('error'); task(why, 'bad');
  setTimeout(() => { if (active !== token) return; show(pos); board.setMovable('white', compat.chessgroundDests(pos)); lock = false; }, 1100);
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
  { fen: DATA.chk_rook[0][1], title: '⚠️ Шах', steps: [
    { say: 'Вертикаль a відкрита. Тура виходить на останній ряд…', arrows: 'a1a8', wait: 1800 }, { move: 'a1a8' },
    { say: 'Шах! Тура нападає на короля — він мусить рятуватися.', arrows: 'a8g8:red', wait: 3000 }] },
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
  if (done || lock) return;
  const t = TASKS[idx];
  if (hintStage === 0 && t.meta?.hint) { task(t.meta.hint); hintStage++; return; }
  const move = puzzleMoves(pos, goalOf(t))[0];
  if (!move) return;
  const from = makeSquare(move.from), to = makeSquare(move.to);
  board.shapes(hintStage++ < (t.meta ? 2 : 1) ? [{ orig: from, brush: 'hint' }] : [{ orig: from, dest: to, brush: 'hint' }]);
});
