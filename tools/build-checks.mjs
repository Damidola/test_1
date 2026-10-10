// Перевіряє авторські схеми і записує лише розділи chk_*; інші задачі не змінює.
import { readFileSync, writeFileSync } from 'node:fs';
import { Chess, fen as FEN, parseUci, makeUci, makeSquare } from 'chessops';
import { CHECK_SCHEMES, CHECK_TEXT, CHECK_BANK_VERSION } from '../content/check-puzzles.js';
import { judgePuzzleMove, puzzleMoves } from '../shared/puzzle-rules.js';
const FILE = new URL('../chess-puzzles/puzzles.json', import.meta.url);
const roles = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
function makeFen(white, black) {
  const cells = new Map();
  for (const [color, pieces] of [['white', white], ['black', black]]) for (const token of pieces.split(/\s+/).filter(Boolean)) {
    const sq = token.slice(1);
    if (!roles[token[0]] || !/^[a-h][1-8]$/.test(sq) || cells.has(sq)) throw Error('Неправильна або дубльована фігура: ' + token);
    cells.set(sq, color === 'white' ? token[0] : token[0].toLowerCase());
  }
  return Array.from({ length: 8 }, (_, i) => {
    let row = '', empty = 0;
    for (const f of 'abcdefgh') { const p = cells.get(f + (8 - i)); if (!p) empty++; else { if (empty) row += empty; empty = 0; row += p; } }
    return row + (empty || '');
  }).join('/') + ' w - - 0 1';
}
const data = JSON.parse(readFileSync(FILE, 'utf8')); let failures = 0;
for (const [role, schemes] of Object.entries(CHECK_SCHEMES)) {
  const rows = [], seen = new Set();
  for (const [i, scheme] of schemes.entries()) {
    const id = `check-v${CHECK_BANK_VERSION}-${role}-${scheme.id}`;
    try {
      const fen = makeFen(scheme.white, scheme.black), pos = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
      if (pos.isCheck() || pos.isEnd()) throw Error('Початкова позиція вже закінчена або під шахом');
      if (seen.has(fen)) throw Error('Дубльована позиція'); seen.add(fen);
      const solution = scheme.solution, goal = { objective: 'safe-check', role, capture: scheme.capture };
      const result = judgePuzzleMove(pos, parseUci(solution), goal);
      if (!result.ok) throw Error(solution + ': ' + result.message);
      const answers = puzzleMoves(pos, goal).map(makeUci);
      const meta = { version: CHECK_BANK_VERSION, ...goal, motif: scheme.motif, ...CHECK_TEXT[role], ...(scheme.explanation ? { explanation: scheme.explanation } : {}), hint: scheme.hint, answers, source: 'author', difficulty: i < 8 ? 'easy' : i < 20 ? 'medium' : 'challenge' };
      rows.push([id, fen, solution, 400 + i * 50, pos.board.occupied.size(), meta]);
    } catch (error) { failures++; console.error(id, error.message); }
  }
  data['chk_' + role] = rows; console.log(role, rows.length);
}
if (failures) throw Error(`${failures} схем потребують виправлення; файл не змінено`);
writeFileSync(FILE, JSON.stringify(data) + '\n');
