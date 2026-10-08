import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Chess, fen as FEN, parseUci, makeUci, makeSquare } from 'chessops';
import { judgePuzzleMove, puzzleMoves, judgeLessonMove } from '../../shared/puzzle-rules.js';
import { syncPuzzleProgress, puzzleStats } from '../../shared/puzzle-progress.js';
import { PUZZLE_SECTIONS, PUZZLE_GROUPS } from '../../shared/puzzle-catalog.js';
const data = JSON.parse(readFileSync(new URL('../../chess-puzzles/puzzles.json', import.meta.url), 'utf8'));
const position = fen => Chess.fromSetup(FEN.parseFen(fen).unwrap()).unwrap();
test('авторські шахи: різні королі, поступове ускладнення й обов’язкові взяття', () => {
  const ids = new Set(), positions = new Set();
  for (const role of ['rook', 'bishop', 'queen', 'knight', 'pawn']) {
    const list = data['chk_' + role]; assert.equal(list.length, 12, role);
    const kings = new Set(), origins = new Set(); let priorCount = 0, captures = 0;
    for (const [id, fen, uci, , , meta] of list) {
      assert.ok(!ids.has(id) && !positions.has(fen), id + ': дубль'); ids.add(id); positions.add(fen);
      const pos = position(fen), move = parseUci(uci);
      assert.ok(!pos.isCheck() && !pos.isEnd(), id);
      const count = pos.board.occupied.size();
      kings.add(makeSquare(pos.board.kingOf('black'))); origins.add(uci.slice(0, 2));
      assert.ok(count >= priorCount, id + ': поступове ускладнення'); priorCount = count;
      if (meta.capture) { captures++; assert.equal(pos.board.get(move.to)?.color, 'black', id + ': взяття'); }
      assert.ok(judgePuzzleMove(pos, move, meta).ok, id + ': розв’язок');
      assert.equal(meta.role, role); assert.equal(meta.objective, 'safe-check');
      assert.ok(meta.motif && meta.hint && meta.explanation && meta.version === 3, id + ': пояснення');
      assert.deepEqual(meta.answers, puzzleMoves(pos, meta).map(makeUci), id + ': усі відповіді');
      if (['rook', 'bishop', 'queen'].includes(role)) assert.ok(Math.max(Math.abs(uci.charCodeAt(0) - uci.charCodeAt(2)), Math.abs(+uci[1] - +uci[3])) >= 2, id + ': навчальна лінія');
    }
    assert.ok(kings.size >= 8, role + ': король у різних місцях');
    assert.ok(origins.size >= 9, role + ': різні початкові клітинки');
    assert.ok(captures >= 3, role + ': різні взяття');
    assert.ok(list.slice(0, 3).every(r => r[4] <= 4), role + ': простий початок');
    assert.ok(list.slice(-3).every(r => r[4] >= 10), role + ': складніші фінальні задачі');
  }
});
test('шах і безпечний шах — різні цілі; нелегальний хід не зараховується', () => {
  const pos = position('6k1/5p2/8/8/8/8/8/6KR w - - 0 1');
  assert.ok(judgePuzzleMove(pos, parseUci('h1h8'), { objective: 'check', role: 'rook' }).ok);
  assert.ok(!judgePuzzleMove(pos, parseUci('h1h8'), { objective: 'safe-check', role: 'rook' }).ok);
  assert.ok(!judgePuzzleMove(pos, parseUci('h1f2'), { objective: 'check' }).ok);
});
test('шах новою фігурою після перетворення не видається за шах пішаком', () => {
  const pos = position('6k1/4P1pp/8/8/8/8/8/K7 w - - 0 1');
  assert.ok(!judgePuzzleMove(pos, parseUci('e7e8q'), { objective: 'safe-check', role: 'pawn' }).ok);
});
test('взяття на проході може зняти шах і забрати пішака, що шахує', () => {
  const pos = position('8/8/8/3k4/3p4/8/4P3/4R1K1 w - - 0 1');
  const move = parseUci('e2e4');
  assert.ok(judgePuzzleMove(pos, move, { objective: 'check', role: 'pawn' }).ok);
  assert.ok(!judgePuzzleMove(pos, move, { objective: 'safe-check', role: 'pawn' }).ok);
  pos.play(move);
  assert.ok(judgePuzzleMove(pos, parseUci('d4e3'), { objective: 'escape:capture' }).ok);
});
test('рокіровка в міні-уроці приймає навчальний запис короля на g1', () => {
  const pos = position('4k3/8/8/8/8/8/8/4K2R w K - 0 1');
  assert.ok(judgeLessonMove(pos, parseUci('e1h1'), { ok: ['e1g1'] })[0]);
});
test('заміна банку очищає лише застарілий прогрес, зберігаючи інші розділи', () => {
  const values = { 'puz:chk_rook': ['old'], 'puzres:chk_rook': { old: 'g' }, 'lvl:puz-chk_rook': ['perfect'], 'puz:m1rook': ['mate'], 'puzres:m1rook': { mate: 'y' } };
  const store = { get: (k, fallback) => values[k] ?? fallback, set: (k, value) => { values[k] = value; } };
  const bank = { chk_rook: data.chk_rook, m1rook: [['mate', '', '']] }; syncPuzzleProgress(store, bank);
  assert.deepEqual(values['puz:chk_rook'], []); assert.deepEqual(values['puzres:chk_rook'], {}); assert.deepEqual(values['lvl:puz-chk_rook'], []);
  assert.deepEqual(values['puz:m1rook'], ['mate']); assert.deepEqual(values['puzres:m1rook'], { mate: 'y' });
  values['puz:chk_rook'] = [data.chk_rook[0][0]]; values['lvl:puz-chk_rook'] = ['perfect']; syncPuzzleProgress(store, bank);
  assert.deepEqual(values['lvl:puz-chk_rook'], ['perfect']); assert.equal(puzzleStats(store, 'chk_rook', data.chk_rook).done, 1);
});
test('каталог містить кожен розділ банку один раз', () => {
  const ids = PUZZLE_GROUPS.flatMap(g => g.ids);
  assert.equal(new Set(ids).size, ids.length); assert.deepEqual([...ids].sort(), Object.keys(data).sort());
  for (const id of ids) assert.ok(PUZZLE_SECTIONS[id].task && PUZZLE_SECTIONS[id].title);
});

test('коли завдання вимагає взяття, звичайний шах не зараховується', () => {
  const row = data.chk_rook[0], pos = position(row[1]);
  const quiet = puzzleMoves(pos, { objective: 'safe-check', role: 'rook' }).find(m => !pos.board.get(m.to));
  assert.ok(quiet);
  assert.ok(!judgePuzzleMove(pos, quiet, { ...row[5], capture: true }).ok);
});
