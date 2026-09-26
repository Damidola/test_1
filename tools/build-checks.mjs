// Задачі «Постав шах» (chess-puzzles/puzzles.json, розділи chk_*): node tools/build-checks.mjs
// Чорний король — біля кута, як після рокіровки (g8/h8, інколи b8/a8), часто за своїми пішаками.
// У кожній задачі є БЕЗПЕЧНИЙ шах потрібною фігурою: після нього жодна чорна фігура (і король) не може побити ту, що шахує.
// Небезпечні шахи (фігуру одразу поб'ють) гра не зараховує — вони бувають «пасткою».
import { readFileSync, writeFileSync } from 'node:fs';
import { Chess, fen as FEN, makeSquare, parseSquare } from 'chessops';

const FILE = new URL('../chess-puzzles/puzzles.json', import.meta.url);
let seed = 20260926;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648, pick = a => a[Math.floor(rnd() * a.length)];
const LETTER = { rook: 'R', bishop: 'B', queen: 'Q', knight: 'N', pawn: 'P', king: 'K' };

// хід, після якого фігуру, що шахує, ніхто не може побити
export function safeCheck(pos, from, to) {
  const q = pos.clone(); q.play({ from, to, promotion: pos.board.get(from).role === 'pawn' && (to >> 3) === 7 ? 'queen' : undefined });
  if (!q.isCheck()) return null;
  for (const [, ds] of q.allDests()) if (ds.has(to)) return false;
  return true;
}
function checksOf(pos, role) {
  const safe = [], unsafe = [];
  for (const [from, ds] of pos.allDests()) {
    if (pos.board.get(from).role !== role) continue;
    for (const to of ds) { const s = safeCheck(pos, from, to); if (s) safe.push([from, to]); else if (s === false) unsafe.push([from, to]); }
  }
  return { safe, unsafe };
}

// укриття короля біля кута: [клітинка короля, пішаки, можливі інші фігури]
const SHELTERS = [
  ['g8', ['f7', 'g7', 'h7'], ['f8', 'e8', 'd8']], ['g8', ['f7', 'g6', 'h7'], ['f8', 'e8']], ['h8', ['g7', 'h7'], ['g8', 'f8']],
  ['g8', ['f7', 'h7'], ['f8', 'd8']], ['h8', ['g7', 'h6'], ['g8', 'f8']], ['g8', ['g7', 'h7'], ['f8', 'e8']],
  ['b8', ['a7', 'b7', 'c7'], ['c8', 'd8']], ['a8', ['a7', 'b7'], ['b8', 'c8']]
];
const EXTRA_BLACK = ['rook', 'knight', 'bishop'];
const EXTRA_WHITE = ['pawn', 'knight', 'bishop', 'rook'];

function tryMake(role, level) {
  const [kSq, pawns, spots] = pick(SHELTERS);
  const b = new Map(); const put = (sq, color, r) => { if (b.has(sq)) return false; b.set(sq, { color, role: r }); return true; };
  put(kSq, 'black', 'king');
  const nPawns = level === 0 ? Math.floor(rnd() * 2) : pawns.length;
  pawns.slice(0, nPawns).forEach(s => put(s, 'black', 'pawn'));
  if (level > 0 && rnd() < 0.7) put(pick(spots), 'black', pick(EXTRA_BLACK));
  put(pick(['g1', 'h1', 'c1', 'b1', 'f2', 'g2']), 'white', 'king');
  const empties = () => { const e = []; for (let i = 16; i < 64; i++) { const s = makeSquare(i); if (!b.has(s)) e.push(s); } return e; };
  // фігура, якою ставимо шах (пішак — ближче до короля: інакше шаху не дістати)
  const home = role === 'pawn' ? empties().filter(s => +s[1] === 6) : empties().filter(s => +s[1] <= 6);
  if (!put(pick(home), 'white', role)) return null;
  for (let i = 0; i < (level === 0 ? (role === 'pawn' ? 1 : 0) : level === 1 ? 1 : 2); i++) put(pick(empties().filter(s => +s[1] <= 6 && +s[1] >= 2)), 'white', pick(EXTRA_WHITE));
  const place = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', n = 0;
    for (let f = 0; f < 8; f++) { const p = b.get('abcdefgh'[f] + (r + 1)); if (!p) { n++; continue; } if (n) row += n; n = 0; row += p.color === 'white' ? LETTER[p.role] : LETTER[p.role].toLowerCase(); }
    if (n) row += n; place.push(row);
  }
  const fen = place.join('/') + ' w - - 0 1';
  const setup = FEN.parseFen(fen); if (setup.isErr) return null;
  const pos = Chess.fromSetup(setup.unwrap()); if (pos.isErr) return null;
  const p = pos.unwrap(); if (p.isCheck() || p.isEnd()) return null;
  const { safe, unsafe } = checksOf(p, role);
  if (!safe.length || safe.length > 3) return null;           // є безпечний шах, але не забагато — щоб було що шукати
  if (level > 0 && !unsafe.length && rnd() < 0.6) return null; // на складніших рівнях часто є й «пастка»
  const [f, t] = pick(safe);
  return [fen, makeSquare(f) + makeSquare(t), b.size];
}

const data = JSON.parse(readFileSync(FILE, 'utf8'));
for (const role of ['rook', 'bishop', 'queen', 'knight', 'pawn']) {
  const out = [], seen = new Set();
  for (const [level, count] of [[0, 8], [1, 11], [2, 11]]) {
    let got = 0;
    for (let t = 0; t < 400000 && got < count; t++) {
      const r = tryMake(role, level); if (!r || seen.has(r[0])) continue;
      seen.add(r[0]); out.push([`ch-${role}-${level}-${got}`, r[0], r[1], 500 + level * 150, r[2]]); got++;
    }
  }
  data['chk_' + role] = out;
  console.log('chk_' + role, out.length);
}
writeFileSync(FILE, JSON.stringify(data));
