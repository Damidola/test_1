import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Chess, fen as FEN, parseUci } from 'chessops';
const data = JSON.parse(readFileSync(new URL('../../chess-puzzles/puzzles.json', import.meta.url), 'utf8'));
test('«Постав шах»: розв’язок — безпечний шах потрібною фігурою, король біля кута', () => {
  for (const role of ['rook', 'bishop', 'queen', 'knight', 'pawn']) {
    const list = data['chk_' + role];
    assert.equal(list.length, 30, role);
    for (const [id, fen, uci] of list) {
      const pos = Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap(), m = parseUci(uci);
      assert.equal(pos.board.get(m.from).role, role, id);
      const q = pos.clone(); q.play(m);
      assert.ok(q.isCheck(), id + ': шах');
      for (const [, ds] of q.allDests()) assert.ok(!ds.has(m.to), id + ': фігуру не можна побити');
      const k = [...pos.board.pieces('black', 'king')][0];
      assert.ok((k >> 3) === 7 && [0, 1, 6, 7].includes(k & 7), id + ': король біля кута');
    }
  }
});
