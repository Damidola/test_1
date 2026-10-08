import { judgeLessonMove, legalMoves } from '../shared/puzzle-rules.js';
// Перевірка міні-уроків «Шляху новачка»: позиції можливі, ходи прикладів legal, у кожного завдання є розв'язок
import { Chess, parseUci, makeUci } from 'chessops';
import { parseFen } from 'chessops/fen';
import { LESSONS } from '../lessons/lessons.js';
const pos = fen => { const r = Chess.fromSetup(parseFen(fen).unwrap()); if (r.isErr) throw new Error('bad fen ' + fen + ' ' + r.error); return r.unwrap(); };
const moves = legalMoves;
export const judge = (p, m, ok) => judgeLessonMove(p, m, { ok })[0];
let bad = 0;
for (const [k, l] of Object.entries(LESSONS)) for (const [i, it] of l.items.entries()) {
  try {
    if (it.demo) { let p = pos(it.demo); for (const s of it.steps) if (s.move) { const m = parseUci(s.move); if (!moves(p).some(x => x.from === m.from && x.to === m.to)) throw new Error('illegal ' + s.move + ' in ' + k + '#' + i); p.play(m); } console.log(k, i, 'demo ok', p.isCheckmate() ? '(mate)' : ''); }
    else { const p = pos(it.task); const sols = moves(p).filter(m => judgeLessonMove(p, m, it)[0]).map(makeUci); const stale = moves(p).filter(m => { const q = p.clone(); q.play(m); return q.isStalemate(); }).map(makeUci); if (!sols.length) throw new Error('no solution ' + k + '#' + i); console.log(k, i, 'task', sols.join(' '), stale.length ? '| пат: ' + stale.join(' ') : ''); }
  } catch (e) { bad++; console.log('ERR', e.message); }
}
process.exit(bad ? 1 : 0);

