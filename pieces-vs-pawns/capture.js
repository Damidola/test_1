/* «Побий усіх»: гра з будь-якої позиції без пари королів (конструктор позиції).
   Фігури ходять за шаховими правилами, але без шаху (король — звичайна фігура, ходить на 1 клітинку).
   Пішак на останньому ряду стає ферзем. Виграє той, хто зіб'є всі фігури суперника.
   Нічия: 30 ходів (60 півходів) ніхто нікого не бив, або тому, чия черга, нема куди ходити. */
import { squareName as N } from '../shared/board.js?v=1790430973';

const ROLE = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' };
const VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 250 };
const DRAW_PLIES = 60;
const other = s => (s === 'w' ? 'b' : 'w');
const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const STEPS = {
  N: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
  B: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  R: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  Q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
  K: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
};
const ONE = { N: true, K: true };

// FEN (лише розстановка й черга ходу) → масив 64 клітинок, a8 = 0
export function parseBoard(fen) {
  const [place, turn] = fen.split(' '), b = Array(64).fill(null);
  place.split('/').forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) c += +ch;
      else { b[r * 8 + c] = { c: ch === ch.toUpperCase() ? 'w' : 'b', t: ch.toUpperCase() }; c++; }
    }
  });
  return { b, t: turn === 'b' ? 'b' : 'w' };
}

export function createCaptureRules(fen, opts = {}) {
  const give = !!opts.giveaway; // піддавки: бити обовʼязково, виграє той, хто позбувся всіх своїх фігур
  function pieceMoves(b, i) {
    const p = b[i], out = [], r0 = i >> 3, c0 = i & 7;
    if (p.t === 'P') {
      const d = p.c === 'w' ? -1 : 1, start = p.c === 'w' ? 6 : 1;
      if (inside(r0 + d, c0) && !b[(r0 + d) * 8 + c0]) {
        out.push((r0 + d) * 8 + c0);
        if (r0 === start && !b[(r0 + 2 * d) * 8 + c0]) out.push((r0 + 2 * d) * 8 + c0);
      }
      for (const dc of [-1, 1]) {
        const r = r0 + d, c = c0 + dc;
        if (inside(r, c) && b[r * 8 + c] && b[r * 8 + c].c !== p.c) out.push(r * 8 + c);
      }
      return out;
    }
    for (const [dr, dc] of STEPS[p.t]) {
      let r = r0 + dr, c = c0 + dc;
      while (inside(r, c)) {
        const q = b[r * 8 + c];
        if (q && q.c === p.c) break;
        out.push(r * 8 + c);
        if (q || ONE[p.t]) break;
        r += dr; c += dc;
      }
    }
    return out;
  }
  function moves(s) {
    const all = rawMoves(s);
    if (!give) return all;
    const caps = all.filter(m => m.capture);
    return caps.length ? caps : all;
  }
  function rawMoves(s) {
    const out = [];
    for (let i = 0; i < 64; i++) if (s.b[i] && s.b[i].c === s.t)
      for (const j of pieceMoves(s.b, i)) out.push({ i, j, from: N(i), to: N(j), capture: !!s.b[j], gain: s.b[j] ? VALUE[s.b[j].t] : 0 });
    return out;
  }
  function play(s, m) {
    const b = s.b.slice(), cap = { w: s.cap.w.slice(), b: s.cap.b.slice() };
    const hit = b[m.j];
    if (hit) cap[s.t].push(hit.t);
    b[m.j] = b[m.i]; b[m.i] = null;
    const p = b[m.j];
    if (p.t === 'P' && (m.j >> 3) === (p.c === 'w' ? 0 : 7)) b[m.j] = { c: p.c, t: 'Q' };
    return { b, t: other(s.t), cap, quiet: hit ? 0 : s.quiet + 1 };
  }
  function result(s) {
    let w = 0, bl = 0;
    for (const p of s.b) if (p) { if (p.c === 'w') w++; else bl++; }
    if (give) {
      if (!w) return { winner: 'w', text: 'Білі віддали всі фігури — перемога в піддавки!' };
      if (!bl) return { winner: 'b', text: 'Чорні віддали всі фігури — перемога в піддавки!' };
      if (!moves(s).length) return { winner: s.t, text: 'Ходів немає — у піддавки це перемога!' };
    }
    if (!w) return { winner: 'b', text: 'Усі білі фігури збиті!' };
    if (!bl) return { winner: 'w', text: 'Усі чорні фігури збиті!' };
    if (s.quiet >= DRAW_PLIES) return { winner: 'draw', text: '30 ходів ніхто нікого не збив — нічия.' };
    if (!moves(s).length) return { winner: 'draw', text: 'Ходів більше немає — нічия.' };
    return null;
  }
  function evaluate(s, side) {
    let v = 0;
    for (let i = 0; i < 64; i++) {
      const p = s.b[i]; if (!p) continue;
      let x = VALUE[p.t];
      if (p.t === 'P') { const adv = p.c === 'w' ? 6 - (i >> 3) : (i >> 3) - 1; x += adv * adv * 6; }
      v += p.c === side ? x : -x;
    }
    return give ? -v : v;
  }
  const start = parseBoard(fen);
  return {
    initial: () => ({ b: start.b.slice(), t: start.t, cap: { w: [], b: [] }, quiet: 0 }),
    moves, play, result, evaluate,
    turn: s => s.t,
    key: s => s.b.map(p => (p ? p.c + p.t : '..')).join('') + s.t,
    pieces: s => { const m = new Map(); s.b.forEach((p, i) => p && m.set(N(i), { role: ROLE[p.t], color: p.c === 'w' ? 'white' : 'black' })); return m; },
    captured: s => s.cap,
    moveOrder: (s, m) => m.gain,
    aiDepth: [2, 3, 4]
  };
}
