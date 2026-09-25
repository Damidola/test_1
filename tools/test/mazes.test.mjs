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
