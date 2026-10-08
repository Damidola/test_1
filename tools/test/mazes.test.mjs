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

test('полуничка доступна лише після взяття всіх фігур', async () => {
  const { startState, movesFrom, solve, solved } = await import('../../lessons/mazes.js');
  for (const [key, maze] of Object.entries(MAZES)) for (const [i, lv] of maze.levels.entries()) {
    const path = solve(lv, startState(maze, lv));
    assert.ok(path && solved(lv, path.at(-1)), `${key}#${i + 1}`);
    for (const st of path) for (const m of movesFrom(lv, st))
      if (String(m.to) === String(lv.to)) assert.equal(m.st.left.length, 0);
  }
});
