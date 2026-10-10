import { createBoard } from '../shared/board.js?v=1791646040';
import { Chess, fen, parseSquare, makeSquare, compat } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';

const $ = id => document.getElementById(id);
const storageKey = 'chk:puzzle-lab:mate1:v1';
const read = () => { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } };
const saved = read(), results = saved.results || {};
const preference = (key, fallback) => { try { return JSON.parse(localStorage.getItem('chk:' + key)) || fallback; } catch { return fallback; } };
const sound = kind => { const a = new Audio(new URL(`../shared/${kind}.mp3`, import.meta.url)); a.volume = .35; a.play().catch(() => {}); };
window.LG = { boardTheme: () => preference('boardTheme', 'brown'), pieceSet: () => preference('pieceSet', 'cburnett'), play: kind => sound(kind === 'illegal' ? 'error' : kind) };
let puzzles = [], current, pos, busy = false, finished = false, assisted = false, generation = 0;
const save = () => { try { localStorage.setItem(storageKey, JSON.stringify({ current: current?.id, results })); } catch {} };
const say = (text, kind = '') => { $('status').textContent = text; $('status').className = kind; };
const pieces = () => new Map([...pos.board].map(([sq, pc]) => [makeSquare(sq), { role: pc.role, color: pc.color }]));
const board = createBoard($('board'), { onMove });
const fit = () => {
  const r = document.querySelector('.board-slot').getBoundingClientRect();
  // Chessground rounds to complete cells. Set both dimensions to the same multiple of eight.
  const size = Math.max(8, Math.floor(Math.min(r.width, r.height - 10, 560) / 8) * 8);
  $('board-wrap').style.width = size + 'px'; board.cg.state.dom.bounds.clear(); board.redraw();
};
new ResizeObserver(fit).observe(document.querySelector('.board-slot'));
window.visualViewport?.addEventListener('resize', fit);
const enable = () => board.setMovable(!busy && !finished ? pos.turn : undefined, !busy && !finished ? compat.chessgroundDests(pos) : new Map(), pos.turn);
const show = (move, animate = true) => {
  board.setPosition(pieces(), { animate, lastMove: move ? [makeSquare(move.from), makeSquare(move.to)] : undefined });
  board.afterAnimation(() => board.cg.set({ check: pos.isCheck() ? pos.turn : false }));
};
function picker() {
  $('picker').replaceChildren(...puzzles.map((p, i) => {
    const b = document.createElement('button'); b.textContent = i + 1;
    b.className = [p.id === current?.id ? 'current' : '', results[p.id] ? 'solved' : ''].join(' ');
    b.setAttribute('aria-label', `Задача ${i + 1}, ${p.source === 'lichess' ? 'Lichess' : 'генератор'}${results[p.id] ? ', розв’язана' : ''}`);
    b.onclick = () => { $('tasks').close(); load(p); }; return b;
  }));
}
function load(p) {
  generation++; current = p; busy = false; finished = false; assisted = false;
  $('promotion').close(); $('board-wrap').classList.remove('solved'); board.clearHint();
  pos = Chess.fromSetup(fen.parseFen(p.fen).unwrap()).unwrap();
  board.setOrientation(pos.turn); show(null, false); enable();
  $('pieces').textContent = `${p.pieces} ${p.pieces <= 4 ? 'фігури' : 'фігур'}`;
  $('count').textContent = `${puzzles.indexOf(p) + 1} / ${puzzles.length}`;
  $('goal').textContent = `${p.source === 'lichess' ? 'Lichess' : 'Генератор'} · ${pos.turn === 'white' ? 'Ходять білі. Постав мат.' : 'Ходять чорні. Постав мат.'}`;
  $('prev').disabled = puzzles.indexOf(p) === 0; $('next').disabled = puzzles.indexOf(p) === puzzles.length - 1;
  say('Знайди мат в один хід.'); picker(); save();
}
function onMove(from, to) {
  if (busy || finished || !current) { if (pos) show(null, false); return; }
  const move = { from: parseSquare(from), to: parseSquare(to) };
  if (pos.board.get(move.from)?.role === 'pawn' && (to[1] === '1' || to[1] === '8')) {
    busy = true; show(null, false); enable(); $('promotion').showModal();
    const token = generation;
    $('promotion').querySelectorAll('button').forEach(b => b.onclick = () => {
      if (token !== generation) return;
      $('promotion').close(); busy = false; attempt({ ...move, promotion: b.dataset.role });
    });
  } else attempt(move);
}
$('promotion').addEventListener('cancel', () => { busy = false; enable(); });
function attempt(move) {
  board.clearHint();
  if (!pos.isLegal(move)) { show(null, false); enable(); say('Цей хід не дозволений.', 'bad'); sound('error'); return; }
  const next = pos.clone(); next.play(move);
  // Verify actual checkmate, rather than accepting a stored move merely because it matches.
  if (!next.isCheckmate()) { assisted = true; show(null, false); enable(); say('Це ще не мат. Спробуй інший хід.', 'bad'); sound('error'); return; }
  pos = next; busy = true; enable(); show(move); sound('move');
  const token = generation;
  board.afterAnimation(() => {
    if (token !== generation) return;
    finished = true; busy = false; enable(); $('board-wrap').classList.add('solved');
    results[current.id] = assisted ? 'assisted' : 'clean'; save(); picker(); sound('win');
    say('Мат! Наступна задача — кнопкою ›.', 'good');
  });
}
$('count').onclick = () => { picker(); $('tasks').showModal(); };
$('close-tasks').onclick = () => $('tasks').close();
$('tasks').onclick = e => { if (e.target === $('tasks')) { const r = $('tasks').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('tasks').close(); } };
$('prev').onclick = () => { const i = puzzles.indexOf(current); if (i > 0) load(puzzles[i - 1]); };
$('next').onclick = () => { const i = puzzles.indexOf(current); if (i + 1 < puzzles.length) load(puzzles[i + 1]); };
$('restart').onclick = () => { if (current) load(current); };
$('hint').onclick = () => {
  if (!current || busy || finished) return; assisted = true;
  const u = current.moves[0]; board.hint(u.slice(0, 2), u.slice(2, 4)); say('Стрілка показує матуючий хід.');
};
$('answer').onclick = () => {
  if (!current || busy) return; assisted = true;
  const u = current.moves[0]; if (!finished) board.hint(u.slice(0, 2), u.slice(2, 4));
  say(`Рішення: ${current.san[0]} — мат.`);
};
try {
  const response = await fetch(new URL('puzzles.json' + new URL(import.meta.url).search, import.meta.url));
  if (!response.ok) throw new Error('Не вдалося завантажити задачі.');
  puzzles = (await response.json()).puzzles;
  if (puzzles.length !== 40 || !puzzles.every(p => p.category === 'mateIn1' && p.moves.length === 1 && p.pieces >= 3 && p.pieces <= 5 && [...p.fen.split(' ')[0]].filter(c => /[a-z]/i.test(c)).length === p.pieces)) throw new Error('Помилка добірки.');
  load(puzzles.find(p => p.id === saved.current) || puzzles[0]); fit();
} catch (e) { say(e.message, 'bad'); }
