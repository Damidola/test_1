import { createBoard } from '../shared/board.js?v=1791642982';
import { Chess, fen, parseSquare, makeSquare, parseUci, compat } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';

const $ = id => document.getElementById(id);
const storageKey = 'chk:puzzle-lab:v1';
const read = () => { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } };
const saved = read();
// Use the same board and piece preferences as the rest of the site, without its progress namespace.
const preference = (key, fallback) => { try { return JSON.parse(localStorage.getItem('chk:' + key)) || fallback; } catch { return fallback; } };
window.LG = { boardTheme: () => preference('boardTheme', 'brown'), pieceSet: () => preference('pieceSet', 'cburnett'), play: kind => sound(kind === 'illegal' ? 'error' : kind) };
let data, list = [], current, pos, turn, ply = 0, generation = 0, busy = false, assisted = false, finished = false;
let results = saved.results || {};
const save = () => { try { localStorage.setItem(storageKey, JSON.stringify({ source: $('source').value, amount: $('amount').value, current: current?.id, results })); } catch {} };
const sound = kind => { const a = new Audio(new URL(`../shared/${kind}.mp3`, import.meta.url)); a.volume = .35; a.play().catch(() => {}); };
const say = (text, kind = '') => { $('status').textContent = text; $('status').className = kind; };
const pieces = () => new Map([...pos.board].map(([sq, pc]) => [makeSquare(sq), { role: pc.role, color: pc.color }]));
const board = createBoard($('board'), { onMove: onMove });
const show = (move, animate = true) => {
  board.setPosition(pieces(), { animate, lastMove: move ? [makeSquare(move.from), makeSquare(move.to)] : undefined });
  board.afterAnimation(() => board.cg.set({ check: pos.isCheck() ? pos.turn : false }));
};
const enable = () => board.setMovable(!busy && !finished ? turn : undefined, !busy && !finished ? compat.chessgroundDests(pos) : new Map(), pos.turn);
const defaultGoal = p => {
  const side = p.fen.split(' ')[1] === 'w' ? 'Ходять білі.' : 'Ходять чорні.';
  return side + ' ' + ({ mateIn1: 'Постав мат одним ходом.', mateIn2: 'Постав мат за два свої ходи.', fork: 'Зроби вилку й виграй фігуру.', skewer: 'Віджени передню фігуру шахом і забери фігуру за нею.', pin: 'Використай зв’язку, щоб виграти матеріал.', promotion: 'Знайди шлях до перетворення пішака.', hangingPiece: 'Виграй матеріал і закріпи перевагу.' }[p.category] || 'Знайди найкраще продовження.');
};
function picker() {
  $('picker').replaceChildren(...list.map((p, i) => {
    const b = document.createElement('button'); b.textContent = i + 1;
    b.className = [p.id === current?.id ? 'current' : '', results[p.id] ? 'solved' : ''].join(' ');
    b.setAttribute('aria-label', `Задача ${i + 1}: ${p.title}, ${p.pieces} ${p.pieces <= 4 ? 'фігури' : 'фігур'}${results[p.id] ? ', розв’язана' : ''}`);
    b.onclick = () => load(p); return b;
  }));
}
function load(p) {
  generation++; current = p; ply = 0; busy = false; assisted = false; finished = false;
  $('promotion').hidden = true; $('line').hidden = true; $('explanation').open = false;
  $('board-wrap').classList.remove('solved'); board.clearHint();
  pos = Chess.fromSetup(fen.parseFen(p.fen).unwrap()).unwrap(); turn = pos.turn;
  board.setOrientation(turn); show(null, false); enable();
  $('title').textContent = p.title;
  $('meta').textContent = `${p.source === 'lichess' ? 'Lichess' : 'Генератор'} · ${p.pieces} ${p.pieces <= 4 ? 'фігури' : 'фігур'}${p.rating ? ' · рейтинг ' + p.rating : ''} · ${list.indexOf(p) + 1}/${list.length}`;
  $('goal').textContent = defaultGoal(p); $('reason').textContent = p.explanation;
  $('origin').href = p.origin; $('line').textContent = 'Рішення: ' + p.san.join(' → ');
  $('prev').disabled = list.indexOf(p) === 0; $('next').disabled = list.indexOf(p) === list.length - 1;
  say('Знайди хід. Помилка не скидає задачу.'); picker(); save();
}
function filter() {
  const source = $('source').value, amount = $('amount').value;
  list = data.puzzles.filter(p => (source === 'all' || p.source === source) && p.pieces >= 3 && p.pieces <= 10 && (amount === 'all' || (amount === 'small' ? p.pieces <= 5 : p.pieces >= 6)));
  if (!list.length) { generation++; current = undefined; board.setMovable(undefined); $('board-wrap').hidden = true; $('title').textContent = 'У цій пробі немає таких задач'; $('meta').textContent = ''; $('goal').textContent = 'Вибери інше джерело або кількість фігур.'; $('reason').textContent = ''; $('origin').removeAttribute('href'); $('picker').replaceChildren(); $('prev').disabled = $('next').disabled = true; say(''); save(); return; }
  $('board-wrap').hidden = false; load(list.find(p => p.id === saved.current) || list[0]);
}
function onMove(from, to) {
  if (busy || finished || !current) { if (pos) show(null, false); return; }
  const fromSq = parseSquare(from), toSq = parseSquare(to);
  if (pos.board.get(fromSq)?.role === 'pawn' && (to[1] === '1' || to[1] === '8')) {
    busy = true; show(null, false); enable(); $('promotion').hidden = false;
    const token = generation;
    $('promotion').querySelectorAll('button').forEach(b => b.onclick = () => {
      if (token !== generation) return;
      $('promotion').hidden = true; busy = false; attempt({ from: fromSq, to: toSq, promotion: b.dataset.role });
    });
  } else attempt({ from: fromSq, to: toSq });
}
function attempt(move) {
  board.clearHint();
  if (!pos.isLegal(move)) { show(null, false); enable(); say('Цей хід не дозволений правилами.', 'bad'); sound('error'); return; }
  const next = pos.clone(); next.play(move);
  const expected = parseUci(current.moves[ply]);
  const correct = (move.from === expected.from && move.to === expected.to && move.promotion === expected.promotion) || (current.category.startsWith('mate') && next.isCheckmate());
  if (!correct) { assisted = true; show(null, false); enable(); say('Спробуй інший хід. ' + defaultGoal(current), 'bad'); sound('error'); return; }
  const capture = !!pos.board.get(move.to); pos = next; ply++; busy = true; enable(); show(move); sound(capture ? 'capture' : 'move');
  const token = generation;
  board.afterAnimation(() => {
    if (token !== generation) return;
    if (ply >= current.moves.length || pos.isCheckmate()) { solve(); return; }
    say('Добре. Хід суперника…');
    setTimeout(() => {
      if (token !== generation) return;
      const reply = parseUci(current.moves[ply]);
      if (!pos.isLegal(reply)) { $('error').hidden = false; $('error').textContent = 'Помилка рішення. Обери іншу задачу.'; return; }
      const capture = !!pos.board.get(reply.to); pos.play(reply); ply++; show(reply); sound(capture ? 'capture' : 'move');
      board.afterAnimation(() => {
        if (token !== generation) return;
        busy = false; enable();
        if (ply >= current.moves.length) solve(); else say('Твій хід. Продовжуй задум.');
      });
    }, 180);
  });
}
function solve() {
  finished = true; busy = false; enable(); $('board-wrap').classList.add('solved');
  results[current.id] = assisted ? 'assisted' : 'clean'; save(); picker(); sound('win');
  say('Розв’язано! Наступна задача — кнопкою ›.', 'good'); $('explanation').open = true; $('line').hidden = false;
}
$('source').onchange = filter; $('amount').onchange = filter;
$('prev').onclick = () => { const i = list.indexOf(current); if (i > 0) load(list[i - 1]); };
$('next').onclick = () => { const i = list.indexOf(current); if (i + 1 < list.length) load(list[i + 1]); };
$('restart').onclick = () => { if (current) load(current); };
$('hint').onclick = () => {
  if (!current || busy || finished) return; assisted = true;
  const m = parseUci(current.moves[ply]); board.hint(makeSquare(m.from), makeSquare(m.to)); say('Стрілка показує наступний хід.');
};
$('answer').onclick = () => {
  if (!current) return; assisted = true; $('explanation').open = true; $('line').hidden = false;
  if (!busy && !finished) { const m = parseUci(current.moves[ply]); board.hint(makeSquare(m.from), makeSquare(m.to)); }
};
try {
  const response = await fetch(new URL('puzzles.json' + new URL(import.meta.url).search, import.meta.url));
  if (!response.ok) throw new Error('Не вдалося завантажити задачі.');
  data = await response.json();
  if (!data.puzzles.every(p => p.pieces >= 3 && p.pieces <= 10 && [...p.fen.split(' ')[0]].filter(c => /[a-z]/i.test(c)).length === p.pieces)) throw new Error('У добірці порушено обмеження кількості фігур.');
  if (['lichess', 'generator', 'all'].includes(saved.source)) $('source').value = saved.source;
  if (['small', 'large', 'all'].includes(saved.amount)) $('amount').value = saved.amount;
  filter();
} catch (e) { $('title').textContent = 'Не вдалося відкрити добірку'; $('error').hidden = false; $('error').textContent = e.message; }
