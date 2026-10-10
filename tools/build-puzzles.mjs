// Curated positions are the content source. Validate their teaching goal before publishing the bank.
import { readFileSync, writeFileSync } from 'node:fs';
import { Chess, fen as FEN, parseUci, makeUci } from 'chessops';
import { legalMoves, escapeKind, puzzleMoves } from '../shared/puzzle-rules.js';

const file = new URL('../chess-puzzles/puzzles.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const content = JSON.parse(readFileSync(new URL('../content/educational-puzzles.json', import.meta.url), 'utf8'));
const value = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
for (const [section, rows] of Object.entries(content)) {
  const ids = new Set(), positions = new Set();
  for (const [id, fen, line, , count, meta] of rows) {
    const check = (ok, reason) => { if (!ok) throw Error(`${section}/${id}: ${reason}`); };
    check(!ids.has(id) && !positions.has(fen), 'duplicate'); ids.add(id); positions.add(fen);
    const p = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
    check(p.board.occupied.size() === count, 'piece count');
    check(meta.motif && meta.hint && meta.explanation && meta.version === 4, 'teaching notes');
    const moves = line.split(' ').map(parseUci);
    if (section.startsWith('esc_')) {
      const answers = legalMoves(p);
      check(p.isCheck() && answers.length === 1, 'escape must have exactly one legal move');
      check(makeUci(answers[0]) === line, 'wrong escape solution');
      check(section === 'esc_mixed' || escapeKind(p, answers[0]) === section.slice(4), 'wrong escape method');
    }
    if (section.startsWith('m1')) {
      const answers = puzzleMoves(p, { objective: 'mate' });
      check(!p.isCheck() && answers.length === 1 && makeUci(answers[0]) === line, 'mate must have one solution');
    }
    if (section === 'fork') {
      const m = moves[0], pc = p.board.get(m.from), q = p.clone(); q.play(m);
      const targets = [...q.board[q.turn]].filter(sq => q.board.get(sq).role !== 'king' && q.kingAttackers(sq, pc.color, q.board.occupied).has(m.to));
      check(q.isCheck() && q.ctx().checkers.has(m.to) && targets.length > 0, 'fork must attack the king and another piece');
      q.play(moves[1]); const victim = q.board.get(moves[2].to); q.play(moves[2]);
      check(moves[2].from === m.to && victim?.color !== pc.color, 'fork must capture its target');
      const recaptured = legalMoves(q).some(reply => reply.to === moves[2].to);
      check(value[victim.role] - (recaptured ? value[pc.role] : 0) > 0, 'fork must win material');
    }
    for (const m of moves) { check(m && p.isLegal(m), 'illegal solution move'); p.play(m); }
  }
  if (section.startsWith('esc_')) {
    const expected = section === 'esc_mixed' ? 90 : 30;
    if (rows.length !== expected) throw Error(`${section}: expected ${expected} positions`);
  }
  data[section] = rows;
  console.log(section, rows.length);
}
writeFileSync(file, JSON.stringify(data) + '\n');
