// Curated positions are the content source. Validate their teaching goal before publishing the bank.
import { readFileSync, writeFileSync } from 'node:fs';
import { Chess, fen as FEN, parseUci, makeUci } from 'chessops';
import { legalMoves, escapeKind, puzzleMoves } from '../shared/puzzle-rules.js';

const file = new URL('../chess-puzzles/puzzles.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const content = JSON.parse(readFileSync(new URL('../content/educational-puzzles.json', import.meta.url), 'utf8'));
const value = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
// Best legal exchange on one square, including recaptures and pinned defenders.
function captureGain(pos, square) {
  const victim = pos.board.get(square);
  if (!victim || victim.color === pos.turn) return 0;
  let gain = 0;
  for (const move of legalMoves(pos)) {
    if (move.to !== square) continue;
    const next = pos.clone(); next.play(move);
    gain = Math.max(gain, value[victim.role] - captureGain(next, square));
  }
  return gain;
}
for (const [section, rows] of Object.entries(content)) {
  const ids = new Set(), positions = new Set();
  for (const [id, fen, line, , count, meta] of rows) {
    const check = (ok, reason) => { if (!ok) throw Error(`${section}/${id}: ${reason}`); };
    check(!ids.has(id) && !positions.has(fen), 'duplicate'); ids.add(id); positions.add(fen);
    const p = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
    check(p.board.occupied.size() === count, 'piece count');
    check(meta.motif && meta.hint && meta.explanation && meta.version >= 4, 'teaching notes');
    const moves = line.split(' ').map(parseUci);
    if (section.startsWith('esc_')) {
      const answers = legalMoves(p);
      check(p.isCheck() && answers.length === 1, 'escape must have exactly one legal move');
      check(makeUci(answers[0]) === line, 'wrong escape solution');
      check(section === 'esc_mixed' || escapeKind(p, answers[0]) === section.slice(4), 'wrong escape method');
      const move = answers[0], kind = escapeKind(p, move), after = p.clone(); after.play(move);
      if (kind === 'block') {
        check(after.kingAttackers(move.to, p.turn, after.board.occupied).nonEmpty(), 'interposing piece must be protected');
        check(captureGain(after, move.to) === 0, 'interposition must not lose material');
      }
      if (kind === 'capture') check(captureGain(after, move.to) <= value[p.board.get(move.to).role], 'capturing checker must not lose material');
    }
    if (section.startsWith('m1')) {
      const answers = puzzleMoves(p, { objective: 'mate' });
      check(!p.isCheck() && answers.length === 1 && makeUci(answers[0]) === line, 'mate must have one solution');
    }
    if (section === 'fork') {
      const m = moves[0], pc = p.board.get(m.from), q = p.clone(); q.play(m);
      const targets = [...q.board[q.turn]].filter(sq => q.board.get(sq).role !== 'king' && q.kingAttackers(sq, pc.color, q.board.occupied).has(m.to));
      check(q.isCheck() && q.ctx().checkers.has(m.to) && targets.length > 0, 'fork must attack the king and another piece');
      let guaranteedGain = Infinity;
      for (const reply of legalMoves(q)) {
        const defended = q.clone(); defended.play(reply);
        let bestGain = 0;
        for (const take of legalMoves(defended)) {
          const victim = defended.board.get(take.to);
          if (take.from !== m.to || !targets.includes(take.to) || !victim || victim.color === pc.color) continue;
          const after = defended.clone(); after.play(take);
          bestGain = Math.max(bestGain, value[victim.role] - captureGain(after, take.to));
        }
        guaranteedGain = Math.min(guaranteedGain, bestGain);
      }
      check(Number.isFinite(guaranteedGain) && guaranteedGain > 0, 'fork must win material against every defence');
      for (const take of legalMoves(p)) if (p.board.get(take.to)?.color === q.turn)
        check(captureGain(p, take.to) < guaranteedGain, 'an immediate capture already wins as much as the fork');
      q.play(moves[1]); const victim = q.board.get(moves[2].to); q.play(moves[2]);
      check(moves[2].from === m.to && victim?.color !== pc.color, 'fork must capture its target');
      check(value[victim.role] - captureGain(q, moves[2].to) > 0, 'fork must win material');
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
