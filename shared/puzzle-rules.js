/* Єдині правила задач: гра, підказки, генератор і тести викликають ці функції. */
import { makeUci, parseSquare } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';

const INSTRUMENT = { rook: 'турою', bishop: 'слоном', queen: 'ферзем', knight: 'конем', pawn: 'пішаком' };
export function legalMoves(pos) {
  const moves = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const promotion = pos.board.get(from).role === 'pawn' && [0, 7].includes(to >> 3);
    for (const role of promotion ? ['queen', 'rook', 'bishop', 'knight'] : [undefined]) moves.push({ from, to, ...(role ? { promotion: role } : {}) });
  }
  return moves;
}
export function escapeKind(pos, move) {
  const after = pos.clone(); after.play(move);
  if ([...pos.ctx().checkers].some(square => after.board.get(square)?.color !== pos.board.get(square).color)) return 'capture';
  return pos.board.get(move.from)?.role === 'king' ? 'run' : 'block';
}
export function canCapture(pos, square) {
  const target = pos.board.get(square);
  if (!target) return false;
  return legalMoves(pos).some(move => {
    const after = pos.clone(); after.play(move);
    return after.board.get(square)?.color !== target.color;
  });
}
export function judgePuzzleMove(pos, move, { objective = 'check', role } = {}) {
  if (!move || !pos.isLegal(move)) return { ok: false, message: 'Цей хід не дозволений правилами.' };
  const piece = pos.board.get(move.from), after = pos.clone(); after.play(move);
  const fail = message => ({ ok: false, message });
  if (objective === 'mate') return after.isCheckmate() ? { ok: true } : fail(after.isStalemate() ? 'Пат: шаху немає, а ходів немає — нічия.' : 'Шах і мат — різні речі: знайди хід без порятунку.');
  if (objective.startsWith('escape')) {
    if (!pos.isCheck()) return fail('У цій позиції королю не оголошено шах.');
    const want = objective.split(':')[1], kind = escapeKind(pos, move);
    const ways = { run: 'утекти королем', capture: 'побити фігуру, що шахує', block: 'закрити лінію іншою фігурою' };
    return !want || want === kind ? { ok: true, kind } : fail(`Король урятований, але тут треба ${ways[want]}.`);
  }
  if (!after.isCheck()) return fail('Це ще не шах: король не під ударом.');
  if (role && (piece.role !== role || !after.ctx().checkers.has(move.to) || after.board.get(move.to)?.role !== role)) return fail(`Постав шах саме ${INSTRUMENT[role]}.`);
  if (objective === 'safe-check' && canCapture(after, move.to)) return fail('Шах є, але цю фігуру можна побити. Знайди шах без втрати фігури.');
  return { ok: true };
}
export function puzzleMoves(pos, goal) { return legalMoves(pos).filter(move => judgePuzzleMove(pos, move, goal).ok); }

export function judgeLessonMove(pos, move, item) {
  if (!move || !pos.isLegal(move)) return [false, 'Цей хід не дозволений правилами.'];
  const after = pos.clone(); after.play(move); const uci = makeUci(move);
  if (item.bad?.[uci]) return [false, item.bad[uci]];
  if (item.role && pos.board.get(move.from).role !== item.role) return [false, 'Спробуй виконати завдання вказаною фігурою.'];
  const objective = item.ok;
  if (Array.isArray(objective)) {
    // chessops записує рокіровку як «король на туру»; навчальний контент може містити e1g1/e1c1.
    const pc = pos.board.get(move.from), victim = pos.board.get(move.to);
    const shown = pc.role === 'king' && victim?.color === pc.color && victim.role === 'rook'
      ? uci.slice(0, 2) + (move.to > move.from ? 'g' : 'c') + uci[1] : uci;
    return [objective.includes(uci) || objective.includes(shown), 'Не той хід — спробуй ще 🙂'];
  }
  if (objective === 'mate') return [after.isCheckmate(), after.isStalemate() ? 'Пат! Шаху немає, а ходів немає — нічия.' : after.isCheck() ? 'Шах є, але король може врятуватися.' : 'Це не мат — спробуй ще 🙂'];
  if (objective === 'attack' || objective === 'safe-attack') {
    const attacker = after.board.get(move.to);
    const attacks = [...after.board[after.turn]].some(sq => after.board.get(sq).role !== 'king' && after.kingAttackers(sq, attacker.color, after.board.occupied).has(move.to));
    if (!attacks) return [false, 'Звідси фігура ні на кого не нападає.'];
    return [objective === 'attack' || after.kingAttackers(move.to, after.turn, after.board.occupied).isEmpty(), 'Напад є, але твою фігуру тут поб’ють!'];
  }
  if (objective.startsWith('escape:')) {
    const sq = parseSquare(objective.slice(7));
    return [move.from === sq && after.kingAttackers(move.to, after.turn, after.board.occupied).isEmpty(), move.from !== sq ? 'Треба рятувати ферзя.' : 'Тут ферзя теж поб’ють!'];
  }
  if (objective.startsWith('defend:')) {
    const sq = parseSquare(objective.slice(7));
    return [!!after.board.get(sq) && after.kingAttackers(sq, pos.turn, after.board.occupied).nonEmpty(), 'Фігура досі без захисту.'];
  }
  return [false, 'Спробуй інший хід.'];
}
