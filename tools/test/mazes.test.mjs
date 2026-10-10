import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAZES, shortest } from '../../lessons/mazes.js';
test('лабіринти: кожен рівень проходимий, старт і фініш не в стіні', () => {
  for (const [k, m] of Object.entries(MAZES)) m.levels.forEach((lv, i) => {
    const w = new Set(lv.walls.map(String));
    assert.ok(!w.has(String(lv.from)) && !w.has(String(lv.to)), `${k}#${i}`);
    assert.ok(shortest(m.piece, lv), `${k}#${i}: шлях є`);
  });
});

test('пішаки: жоден дозволений хід не заводить у тупик', async () => {
  const { startState, movesFrom, solve, solved } = await import('../../lessons/mazes.js');
  for (const [i, lv] of MAZES.pawn.levels.entries()) {
    const todo = [startState(MAZES.pawn, lv)], seen = new Set();
    while (todo.length) {
      const st = todo.pop(), key = JSON.stringify(st);
      if (seen.has(key)) continue;
      seen.add(key);
      assert.ok(solve(lv, st), `pawn#${i + 1}: тупик ${key}`);
      if (!solved(lv, st)) for (const move of movesFrom(lv, st)) todo.push(move.st);
    }
  }
});

test('безпечну полуничку можна з’їсти, поки ще залишилися суперники', async () => {
  const { startState, movesFrom, solved } = await import('../../lessons/mazes.js');
  const lv = MAZES.capture.levels[0], st = startState(MAZES.capture, lv);
  const capture = movesFrom(lv, st).find(m => String(m.to) === '0,1');
  const along = movesFrom(lv, capture.st).find(m => String(m.to) === '0,0');
  const berry = movesFrom(lv, along.st).find(m => String(m.to) === String(lv.to));
  assert.ok(berry && solved(lv, berry.st));
  assert.equal(berry.st.left.length, 1);
});

test('небезпечну спробу можна зробити, але вона не завершує рівень чи змінює вихідний стан', async () => {
  const { startState, movesFrom, attackingEnemies, solved } = await import('../../lessons/mazes.js');
  const lv = { piece: 'rook', w: 5, h: 5, from: [0, 4], to: [1, 4], walls: [], enemies: [[1, 0, 'rook'], [1, 4, 'pawn']], safe: true };
  const st = startState(MAZES.capture, lv), before = JSON.stringify(st);
  assert.ok(!movesFrom(lv, st).some(m => String(m.to) === String(lv.to)));
  const attempt = movesFrom(lv, st, { allowUnsafe: true }).find(m => String(m.to) === String(lv.to));
  assert.deepEqual(attackingEnemies(lv, attempt.st), [[1, 0, 'rook']]);
  assert.equal(solved(lv, attempt.st), false);
  assert.equal(JSON.stringify(st), before);
});
