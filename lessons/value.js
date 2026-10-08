/* Урок «Цінність фігур»: ціни фігур, приклад зі стрілками й 10 коротких завдань «побий найдорожчу».
   Ходити можна лише білими й лише взяттям; правильне взяття — фігура з найбільшою ціною. */
import { attacks, parseSquare, makeSquare, SquareSet } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard } from '../shared/board.js?v=1791477454';
import { goNext, markSeen } from '../shared/path.js?v=1791477454';
import { createLevels, lessonDone } from '../shared/levels.js?v=1791477454';
import { toggleGuide } from '../shared/guide.js?v=1791477454';

const LG = window.LG, $ = id => document.getElementById(id), main = document.querySelector('main.vl');
const ROLE = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' };
const VALUE = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
const NAME = { pawn: 'пішак', knight: 'кінь', bishop: 'слон', rook: 'тура', queen: 'ферзь' };
// [білі, чорні, пояснення]; перше — приклад зі стрілками
const TASKS = [
  ['Bd4', 'Pb6 Nb2 Rg7', 'Слон може побити пішака (1), коня (3) або туру (5). Найдорожча — тура. Бий її!'],
  ['Ra1', 'Pa6 Nf1', 'Тура б’є по прямій. Кого краще забрати?'],
  ['Bc1', 'Pa3 Rg5', 'Слон б’є навскоси.'],
  ['Nd4', 'Pe6 Bc6', 'Кінь стрибає літерою «Г».'],
  ['Pe4', 'Nd5 Qf5', 'Пішак б’є навскоси вперед.'],
  ['Qd1', 'Nd7 Rh5 Pa4', 'Ферзь може побити аж трьох. Кого?'],
  ['Re1', 'Be6 Qa1', 'Подивись уздовж ряду й уздовж лінії.'],
  ['Bb2', 'Rh8 Na3', 'Далеко — не значить погано!'],
  ['Nc3', 'Rb5 Qe4 Pa2', 'Кінь бачить три фігури.'],
  ['Nf3 Bc4', 'Pe5 Qd4 Rf7', 'Тут у тебе дві фігури. Знайди найдорожчу здобич!']
];
const parse = str => new Map(str.split(' ').map(t => [t.slice(1), ROLE[t[0]]]));
let idx = 0, done = false, lock = false;

const board = createBoard($('board'), { onMove: (o, d) => onMove(o, d) });
$('legend').innerHTML = Object.entries(VALUE).map(([r, v]) => `<span><mpiece class="${r} white"></mpiece>${v}</span>`).join('');

function position(t) {
  const m = new Map();
  for (const [sq, role] of parse(t[0])) m.set(sq, { role, color: 'white' });
  for (const [sq, role] of parse(t[1])) m.set(sq, { role, color: 'black' });
  return m;
}
// Куди може бити кожна біла фігура (лише взяття чорних)
function captures(pieces) {
  let o = SquareSet.empty();
  for (const k of pieces.keys()) o = o.with(parseSquare(k));
  const out = new Map();
  for (const [k, p] of pieces) {
    if (p.color !== 'white') continue;
    const list = [];
    for (const sq of attacks({ role: p.role, color: 'white' }, parseSquare(k), o)) {
      const t = pieces.get(makeSquare(sq));
      if (t && t.color === 'black') list.push(makeSquare(sq));
    }
    if (list.length) out.set(k, list);
  }
  return out;
}
// кружечки рівнів угорі: по черзі, зелений/жовтий ✓
let errs = 0;
const lv = createLevels($('levels'), 'value', TASKS.length, i => { idx = i; load(); });
function load() {
  errs = 0; lv.set(idx);
  const t = TASKS[idx], pcs = position(t), caps = captures(pcs);
  done = false; lock = false;
  $('wrap').classList.remove('solved');
  board.setPosition(pcs, { animate: false });
  board.setMovable('white', caps);
  $('goal').textContent = 'Побий найдорожчу фігуру';
  task(t[2]);
  board.clearHint();
}
const best = (pcs, caps) => Math.max(...[...caps.values()].flat().map(k => VALUE[pcs.get(k).role]));
function task(text, cls = '') { $('task').textContent = text; $('task').className = 'vl-task ' + cls; }

function onMove(from, to) {
  if (done || lock) return;
  const t = TASKS[idx], pcs = position(t), caps = captures(pcs), got = pcs.get(to), v = VALUE[got.role], top = best(pcs, caps);
  if (v === top) {
    done = true; LG.play('capture'); $('wrap').classList.add('solved'); board.clearHint();
    task(`Так! ${NAME[got.role]} коштує ${v} — це найдорожча здобич 🎉`, 'ok');
    lv.done(idx, !errs);
    setTimeout(() => {
      if (idx < TASKS.length - 1) { idx++; load(); }
      else lessonDone({ title: 'Цінність фігур', text: 'Тепер ти знаєш, скільки коштують фігури!', key: 'value', n: TASKS.length, here: 'lessons/value.html' });
    }, 1500);
    return;
  }
  lock = true; errs++; LG.play('error');
  const better = [...caps.values()].flat().map(k => pcs.get(k)).find(p => VALUE[p.role] === top);
  task(`Можна краще: ${NAME[got.role]} коштує ${v}, а ${NAME[better.role]} — ${top}!`, 'bad');
  setTimeout(() => { board.setPosition(pcs, {}); board.setMovable('white', caps); lock = false; }, 900);
}

// Урок одразу починається із завдання; пояснення (📖 внизу) відкривається поверх і закривається тією ж кнопкою
let started = false;
const startTasks = () => { main.dataset.step = 'tasks'; board.redraw(); if (started) return; started = true; idx = lv.open(); load(); };
$('go').addEventListener('click', startTasks);
$('go').textContent = 'Зрозуміло 👍';
setTimeout(startTasks, 0);
// «Гайд» на весь екран: ціни фігур, «бий найдорожчу», вигідний обмін
const introBox = document.querySelector('.vl-intro').cloneNode(true);
introBox.querySelectorAll('h2, button').forEach(e => e.remove());
const GUIDE = { icon: '💰', title: 'Скільки коштують фігури?', intro: introBox.innerHTML, slides: [
  { fen: '8/8/8/8/8/8/PNBRQK2/8 w - - 0 1', title: '💰 Ціни фігур', steps: [
    { say: 'Пішак — 1 очко', arrows: 'a2', wait: 1500 }, { say: 'Кінь — 3', arrows: 'b2', wait: 1500 }, { say: 'Слон — 3', arrows: 'c2', wait: 1500 },
    { say: 'Тура — 5', arrows: 'd2', wait: 1500 }, { say: 'Ферзь — 9, найдорожчий!', arrows: 'e2', wait: 1800 },
    { say: 'Король — безцінний: без нього гра закінчується.', arrows: 'f2:red', wait: 2400 }] },
  { fen: '8/8/2b5/1p3r2/3N4/8/8/8 w - - 0 1', title: '🎯 Бий найдорожчу', steps: [
    { say: 'Кінь може побити пішака (1), слона (3) або туру (5).', arrows: 'd4b5:yellow d4c6:yellow d4f5:yellow', wait: 3000 },
    { say: 'Тура коштує найбільше — беремо її!', arrows: 'd4f5', wait: 1600 }, { move: 'd4f5' },
    { say: '+5 очок!', wait: 2200 }] },
  { fen: '8/8/2p5/3n4/4P3/8/8/3R4 w - - 0 1', title: '⚖️ Вигідний обмін', steps: [
    { say: 'Коня d5 захищає пішак c6.', arrows: 'c6d5:blue', wait: 2400 },
    { say: 'Поб’є тура — пішак поб’є туру: віддамо 5 за 3. Невигідно!', arrows: 'd1d5:red', wait: 3000 },
    { say: 'А поб’є пішак — віддамо лише 1 за 3.', arrows: 'e4d5', wait: 1800 }, { move: 'e4d5' },
    { say: 'Чорні відбирають пішака…', move: 'c6d5' },
    { say: 'Віддали 1, забрали 3 — виграли 2 очки!', wait: 2800 }] }] };
$('intro').addEventListener('click', () => toggleGuide(GUIDE));
$('skip').addEventListener('click', () => { if (idx < TASKS.length - 1) { idx++; load(); } });
$('back').addEventListener('click', () => { location.href = 'index.html'; });
// Нижня панель: 💡 — яку фігуру бити, 📖 — правило
LG.onExplain(() => toggleGuide(GUIDE));
LG.onHint(() => {
  if (main.dataset.step === 'intro' || done) return;
  const pcs = position(TASKS[idx]), caps = captures(pcs), top = best(pcs, caps);
  for (const [from, list] of caps) for (const to of list) if (VALUE[pcs.get(to).role] === top) return board.shapes([{ orig: from, dest: to, brush: 'hint' }]);
});
