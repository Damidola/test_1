/* Шахи за правилами Lichess (chessops): шах, мат, пат, рокіровка, взяття на проході.
   Пішак, що дійшов до кінця, одразу стає ферзем. */
import { Chess, makeSquare, fen, attacks } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { bestUci } from '../shared/engine.js?v=1790334895';
const { makeFen } = fen;

const VALUE = { pawn: 100, knight: 300, bishop: 320, rook: 500, queen: 900, king: 0 };
const LETTER = { pawn: 'P', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q', king: 'K' };
const START = { pawn: 8, knight: 2, bishop: 2, rook: 2, queen: 1 };
const side = c => (c === 'white' ? 'w' : 'b');
// Бонус за клітинку: у центрі фігури сильніші, пішаки — чим далі, тим краще
const center = sq => { const f = sq & 7, r = sq >> 3; return 3.5 - Math.max(Math.abs(f - 3.5), Math.abs(r - 3.5)); };

/* Робот-«людина» для рівнів 1–4: грає як дитина, що вчиться, а не як «найгірший хід».
   Розвиває фігури (пішак у центр, коні, слони, рокіровка), інколи нападає й б'є.
   Що вищий рівень — то частіше помічає взяття, загрози своїм фігурам і мат в один хід.
   Рівень 1: майже не бачить загроз — йому можна поставити дитячий мат і забрати фігури. */
const PV = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
const LV = {
  1: { cap: 0.2, threat: 0.35, mate: 0.2, safe: 0, hang: 0, defMate: 0, noise: 30, look: 0 },
  2: { cap: 0.5, threat: 0.5, mate: 0.5, safe: 0.4, hang: 0.3, defMate: 0.2, noise: 22, look: 0 },
  3: { cap: 0.85, threat: 0.6, mate: 0.9, safe: 0.8, hang: 0.65, defMate: 0.65, noise: 14, look: 0 },
  4: { cap: 1, threat: 0.7, mate: 1, safe: 0.95, hang: 0.9, defMate: 0.95, noise: 8, look: 1 }
};
const minVal = (pos, set) => { let m = Infinity; for (const s of set) m = Math.min(m, PV[pos.board.get(s).role]); return m; };
const attackedBy = (pos, sq, color) => pos.kingAttackers(sq, color, pos.board.occupied);
function matesInOne(pos) {
  for (const [from, ds] of pos.allDests()) for (const to of ds) { const p = pos.clone(); p.play({ from, to }); if (p.isCheckmate()) return true; }
  return false;
}
// Найбільше, що суперник може виграти одним взяттям (у пішаках)
function bestGrab(pos) {
  let best = 0;
  for (const [from, ds] of pos.allDests()) for (const to of ds) {
    const v = pos.board.get(to); if (!v || v.color === pos.turn) continue;
    const a = PV[pos.board.get(from).role];
    const p = pos.clone(); p.play({ from, to });
    const g = PV[v.role] - (attackedBy(p, to, p.turn).nonEmpty() ? a : 0);
    best = Math.max(best, g);
  }
  return best;
}
function humanMove(pos, list, level) {
  const P = LV[level], me = pos.turn, opp = me === 'white' ? 'black' : 'white';
  const rel = sq => (me === 'white' ? sq >> 3 : 7 - (sq >> 3));
  const opening = pos.fullmoves <= 10;
  const see = {}; for (const k of ['cap', 'threat', 'mate', 'safe', 'hang', 'defMate']) see[k] = Math.random() < P[k];
  // свої фігури, які зараз можна безкарно забрати
  const hanging = new Set();
  if (see.hang) for (const [sq, p] of pos.board) if (p.color === me && p.role !== 'king') {
    const a = attackedBy(pos, sq, opp);
    if (a.nonEmpty() && (attackedBy(pos, sq, me).isEmpty() || minVal(pos, a) < PV[p.role])) hanging.add(sq);
  }
  const scored = list.map(mv => {
    const { from, to } = mv.m, pc = pos.board.get(from), victim = pos.board.get(to);
    const after = pos.clone(); after.play(mv.m);
    if (after.isCheckmate()) return { mv, after, v: see.mate ? 1e5 : 0 };
    let v = Math.random() * P.noise;
    const f = to & 7, castle = pc.role === 'king' && victim && victim.color === me;
    if (castle) v += opening ? 45 : 25;
    else if (pc.role === 'king' && pos.fullmoves < 30) v -= 40;
    if (opening) {
      if (pc.role === 'pawn') {
        if (f === 3 || f === 4) v += rel(from) === 1 ? 38 + (Math.abs(to - from) === 16 ? 6 : 0) : 6;
        if (f === 4 && rel(from) === 1 && level <= 2) v += 12; // слабкий робот любить «класику» 1…e5
        else if (f === 2 || f === 5) v += rel(from) === 1 ? 12 : 0;
        else v -= 14;
      }
      if ((pc.role === 'knight' || pc.role === 'bishop') && rel(from) === 0) v += 32;
      if (pc.role === 'knight' && (f === 0 || f === 7)) v -= 22;
      if (pc.role === 'queen' && pos.fullmoves < 6) v -= 12;
      if (pc.role === 'rook' && !castle) v -= 18;
      if (pc.role !== 'pawn' && !castle && rel(from) > 0) v -= rel(to) < rel(from) ? 30 : 10; // та сама фігура вдруге / назад
    } else {
      if (pc.role !== 'king' && pc.role !== 'pawn') v += 4 * (center(to) - center(from));
      if (pc.role === 'pawn') v += 2 + rel(to);
    }
    if (victim && victim.color !== me) {
      if (see.cap) v += 10 * PV[victim.role] - (see.safe && attackedBy(after, to, opp).nonEmpty() ? 9 * PV[pc.role] : 0);
      else v -= 12; // взяття не помітив
    }
    if (mv.m.promotion) v += 60;
    if (see.safe && !castle && pc.role !== 'king') {
      const a = attackedBy(after, to, opp);
      if (a.nonEmpty() && (attackedBy(after, to, me).isEmpty() || minVal(after, a) < PV[pc.role])) v -= 10 * PV[pc.role];
    }
    if (hanging.has(from)) v += 9 * PV[pc.role];
    if (see.threat && pc.role !== 'king' && !castle) {
      for (const t of attacks(after.board.get(to), to, after.board.occupied)) {
        const q = after.board.get(t);
        if (q && q.color === opp && q.role !== 'king' && PV[q.role] >= PV[pc.role]) { v += 8; break; }
      }
    }
    if (after.isCheck()) v += 5;
    return { mv, after, v };
  }).sort((a, b) => b.v - a.v);
  // найкращі кандидати перевіряємо глибше: чи не дає хід мат в один (дитячий мат!) і чи не віддає фігуру
  const top = scored.slice(0, 6);
  for (const x of top) {
    if (x.v >= 1e5) continue;
    if (see.defMate && matesInOne(x.after)) x.v -= 5e4;
    if (P.look) x.v -= 10 * bestGrab(x.after);
  }
  top.sort((a, b) => b.v - a.v);
  return top[0].mv;
}

export function createRules() {
  function moves(pos) {
    const out = [];
    for (const [from, dests] of pos.allDests()) {
      const piece = pos.board.get(from);
      for (const to of dests) {
        const promo = piece.role === 'pawn' && (to >> 3 === 7 || to >> 3 === 0) ? 'queen' : undefined;
        const victim = pos.board.get(to);
        // Рокіровка: chessops ходить «король на туру», а дитина тягне короля на g1/c1
        const castle = piece.role === 'king' && victim && victim.color === piece.color;
        out.push({
          from: makeSquare(from), to: makeSquare(castle ? (to > from ? from + 2 : from - 2) : to), m: { from, to, promotion: promo },
          capture: (!!victim && victim.color !== piece.color) || (piece.role === 'pawn' && (from & 7) !== (to & 7)),
          gain: (victim && victim.color !== piece.color ? VALUE[victim.role] : 0) - VALUE[piece.role] / 100 + (promo ? 800 : 0)
        });
      }
    }
    return out;
  }
  function play(pos, mv) { const p = pos.clone(); p.play(mv.m); return p; }
  function result(pos) {
    const o = pos.outcome();
    if (!o) return null;
    if (!o.winner) return { winner: 'draw', text: pos.isStalemate() ? 'Пат: ходів немає, але й шаху немає.' : 'Нічия!' };
    return { winner: side(o.winner), text: 'Мат!' };
  }
  function evaluate(pos, s) {
    let v = 0;
    for (const [sq, p] of pos.board) {
      let x = VALUE[p.role];
      if (p.role === 'pawn') x += 6 * (p.color === 'white' ? (sq >> 3) - 1 : 6 - (sq >> 3));
      else if (p.role !== 'king') x += 8 * center(sq);
      v += side(p.color) === s ? x : -x;
    }
    if (pos.isCheck()) v += side(pos.turn) === s ? -15 : 15;
    return v;
  }
  function captured(pos) {
    const left = { white: {}, black: {} };
    for (const [, p] of pos.board) left[p.color][p.role] = (left[p.color][p.role] || 0) + 1;
    const lost = c => Object.entries(START).flatMap(([r, n]) => Array(Math.max(0, n - (left[c][r] || 0))).fill(LETTER[r]));
    return { w: lost('black'), b: lost('white') }; // що збили білі — це втрати чорних
  }
  return {
    initial: () => Chess.default(),
    moves, play, result, evaluate, captured,
    turn: pos => side(pos.turn),
    key: pos => makeFen(pos.toSetup()),
    check: pos => (pos.isCheck() ? pos.turn : false),
    pieces: pos => { const m = new Map(); for (const [sq, p] of pos.board) m.set(makeSquare(sq), { role: p.role, color: p.color }); return m; },
    moveOrder: (pos, mv) => mv.gain,
    // Рівні 1–4 — робот-«людина»; 5 — Stockfish зі зниженою силою (якщо не запустився — звичайний пошук)
    aiMove: (pos, level) => (level <= 4 ? humanMove(pos, moves(pos), level) : null),
    aiMoveAsync: async (pos, level) => {
      if (level < 5) return null;
      const list = moves(pos);
      const u = await bestUci(makeFen(pos.toSetup()), { skill: 2, ms: 500 });
      return (u && list.find(m => m.from === u.slice(0, 2) && m.to === u.slice(2, 4))) || null;
    },
    aiDepth: [2, 3, 3]
  };
}
