import { judgeLessonMove } from '../shared/puzzle-rules.js?v=1791624117';
/* Міні-урок «Шляху новачка» (lessons/lesson.html#ключ): вступ → приклади (програються самі) і завдання по черзі.
   Уроки — у lessons.js; ходи перевіряє chessops. */
import { Chess, makeSquare, parseSquare, compat, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard } from '../shared/board.js?v=1791624117';
import { LESSONS } from './lessons.js?v=1791624117';
import { markSeen } from '../shared/path.js?v=1791624117';
import { createLevels, lessonDone } from '../shared/levels.js?v=1791624117';
import { toggleGuide, introGuide } from '../shared/guide.js?v=1791624117';

const LG = window.LG, $ = id => document.getElementById(id), main = document.querySelector('main.cl');
const lesson = LESSONS[location.hash.slice(1)] || LESSONS.attack;
const items = lesson.items.filter(it => !it.demo); // одразу завдання — без анімацій-прикладів на початку (приклад — у «Гайд»)
// «Гайд» на весь екран: приклади уроку програються самі (приклад за прикладом), під дошкою — правило уроку
const GUIDE = { icon: lesson.icon || '📖', title: lesson.title, intro: lesson.intro,
  slides: lesson.items.filter(it => it.demo).map(it => ({ fen: it.demo, title: it.title, steps: it.steps })) };
let idx = 0, pos, token = 0, done = false, lock = false, errs = 0;
// кружечки рівнів угорі (приклади й завдання по черзі); після прикладу — одразу далі, без кнопки
const lv = createLevels($('levels'), 'mini:' + location.hash.slice(1), items.length, i => { idx = i; load(); });

const board = createBoard($('board'), { onMove: (o, d) => onMove(o, d) });
board.cg.set({ movable: { showDests: true } });
const pieces = p => { const m = new Map(); for (const [sq, pc] of p.board) m.set(makeSquare(sq), { role: pc.role, color: pc.color }); return m; };
const show = (p, lm) => board.setPosition(pieces(p), { lastMove: lm, check: p.isCheck() ? p.turn : false });
const parse = fen => Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
const say = (t, cls = '') => { $('task').innerHTML = t; $('task').className = 'cl-task ' + cls; };
const wait = (ms, t) => new Promise((ok, stop) => setTimeout(() => (t === token ? ok() : stop('stop')), ms));
// Рокіровка: у chessops король «іде на туру» (e1h1), на дошці — на g1
function toMove(p, from, to) {
  const m = { from: parseSquare(from), to: parseSquare(to) }, pc = p.board.get(m.from);
  if (pc.role === 'king' && Math.abs((m.from & 7) - (m.to & 7)) === 2) m.to = (m.to & 7) > (m.from & 7) ? (m.from | 7) : (m.from & ~7);
  return m;
}
const isPromo = (p, m) => p.board.get(m.from)?.role === 'pawn' && (m.to >> 3 === 7 || m.to >> 3 === 0);
// Вибір фігури при перетворенні пішака, як на Lichess
function askPromotion(to) {
  return new Promise(done => {
    const f = 'abcdefgh'.indexOf(to[0]), el = document.createElement('div');
    el.className = 'cl-promo';
    el.innerHTML = ['queen', 'knight', 'rook', 'bishop'].map((r, i) =>
      `<button type="button" data-r="${r}" style="left:${f * 12.5}%;top:${i * 12.5}%"><mpiece class="${r} white"></mpiece></button>`).join('');
    el.addEventListener('click', e => { const b = e.target.closest('button'); el.remove(); done(b ? b.dataset.r : null); });
    $('wrap').appendChild(el);
  });
}
// Хід зі звуком; кінь — буквою «Г»: спершу дві клітинки прямо, потім одна вбік
async function play(p, m, t) {
  const pc = p.board.get(m.from), cap = !!p.board.get(m.to);
  const df = (m.to & 7) - (m.from & 7), dr = (m.to >> 3) - (m.from >> 3);
  if (pc.role === 'knight' && t !== undefined) {
    const mid = Math.abs(dr) === 2 ? m.from + 8 * dr : m.from + df; // довга частина «Г»
    const tmp = pieces(p); tmp.delete(makeSquare(m.from)); if (!p.board.has(mid)) tmp.set(makeSquare(mid), { role: 'knight', color: pc.color });
    if (!p.board.has(mid)) { board.setPosition(tmp, {}); await wait(260, t); }
  }
  const q = p.clone(); q.play(m); LG.play(cap ? 'capture' : 'move');
  show(q, [makeSquare(m.from), makeSquare(m.to)]);
  return q;
}

function load() {
  const it = items[idx]; token++; done = false; lock = false; errs = 0; lv.set(idx);
  $('wrap').classList.remove('solved'); board.clearHint(); board.setMovable(null);
  $('next').querySelector('.lbl').textContent = idx < items.length - 1 ? 'Далі' : 'Готово';
  {
    $('goal').textContent = '🧩 Завдання'; main.dataset.kind = 'task';
    pos = parse(it.task); show(pos); say(it.text);
    board.setMovable('white', compat.chessgroundDests(pos));
  }
}
const judge = judgeLessonMove;
async function onMove(from, to) {
  const it = items[idx]; if (!it.task || done || lock) return;
  const m = toMove(pos, from, to), t = token;
  if (isPromo(pos, m)) {
    lock = true; m.promotion = await askPromotion(to); lock = false;
    if (t !== token) return;
    if (!m.promotion) { show(pos); return board.setMovable('white', compat.chessgroundDests(pos)); }
  }
  const [ok, why] = judge(pos, m, it);
  if (ok) {
    done = true; board.setMovable(null);
    pos = await play(pos, m).catch(() => pos);
    $('wrap').classList.add('solved'); say(pos.isCheckmate() ? 'Мат! 🎉' : 'Правильно! 🎉', 'ok'); lv.done(idx, !errs);
    setTimeout(() => { if (t === token) next(); }, 1500);
    return;
  }
  lock = true; errs++; LG.play('error'); say(why, 'bad');
  setTimeout(() => { if (t !== token) return; show(pos); board.setMovable('white', compat.chessgroundDests(pos)); lock = false; }, 900);
}
function next() {
  // по черзі: далі — лише після виконаного завдання чи переглянутого прикладу
  if (!done) { LG.play('error'); return say(items[idx].demo ? 'Спершу подивись приклад до кінця 🙂' : 'Спершу виконай завдання 🙂 Не виходить — натисни 💡', 'bad'); }
  $('next').classList.remove('ready');
  if (idx < items.length - 1) { idx++; load(); return; }
  LG.store.set('lesson:' + location.hash.slice(1), true);
  const here = 'lessons/lesson.html' + location.hash; markSeen(here);
  lessonDone({ title: lesson.title, key: 'mini:' + location.hash.slice(1), n: items.length, here });
}

$('title').textContent = lesson.title;
$('intro-text').innerHTML = lesson.intro;
document.title = lesson.title;
// Урок одразу починається із завдання; пояснення (📖 внизу) відкривається поверх і закривається тією ж кнопкою
let started = false;
const startTasks = () => { main.dataset.step = 'items'; board.redraw(); if (started) return; started = true; idx = lv.open(); load(); };
$('go').addEventListener('click', startTasks);
$('go').textContent = 'Зрозуміло 👍';
setTimeout(startTasks, 0);
$('again').addEventListener('click', () => load());
$('rules').addEventListener('click', () => toggleGuide(GUIDE));
introGuide(GUIDE);
// Нижня панель: 📖 — правило уроку, 💡 — яка фігура ходить (вдруге — куди)
LG.onExplain(() => toggleGuide(GUIDE));
let hintStage = 0, hintFor = -1;
LG.onHint(() => {
  const it = items[idx]; if (main.dataset.step === 'intro' || !it || !it.task || done) return;
  if (hintFor !== idx) { hintFor = idx; hintStage = 0; }
  for (const [from, ds] of pos.allDests()) for (const to of ds) {
    const m = { from, to }; if (isPromo(pos, m)) m.promotion = 'knight';
    let [ok] = judge(pos, m, it);
    if (!ok && m.promotion) { m.promotion = 'queen'; [ok] = judge(pos, m, it); }
    if (!ok) continue;
    board.shapes(hintStage++ === 0 ? [{ orig: makeSquare(from), brush: 'hint' }] : [{ orig: makeSquare(from), dest: makeSquare(m.to), brush: 'hint' }]);
    return;
  }
});
$('next').addEventListener('click', () => next());
window.addEventListener('hashchange', () => location.reload());

