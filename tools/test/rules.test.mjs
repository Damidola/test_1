// Правила ігор: старт, ходи, робот завжди ходить за правилами на всіх рівнях
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRules as chess } from '../../chess/rules.js';
import { createRules as pawns } from '../../pawns/rules.js';
import { createRules as pvp, MODES } from '../../pieces-vs-pawns/rules.js';
import { aiMove } from '../../shared/ai.js';

const same = (a, b) => a.from === b.from && a.to === b.to;
function playout(rules, levels = [1, 3, 5], plies = 40) {
  for (const level of levels) {
    let s = rules.initial();
    for (let i = 0; i < plies && !rules.result(s); i++) {
      const legal = rules.moves(s);
      assert.ok(legal.length, 'є ходи');
      const m = aiMove(rules, s, level);
      assert.ok(m && legal.some(x => same(x, m)), `рівень ${level}: хід робота за правилами`);
      s = rules.play(s, m);
    }
  }
}

test('шахи: 20 ходів на старті, рокіровка — королем на g1', () => {
  const r = chess();
  const s = r.initial();
  assert.equal(r.moves(s).length, 20);
  assert.equal(r.result(s), null);
  assert.equal(r.turn(s), 'w');
  const castle = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6'].reduce((p, u) => r.play(p, r.moves(p).find(m => m.from + m.to === u)), s);
  assert.ok(r.moves(castle).some(m => m.from === 'e1' && m.to === 'g1'), 'O-O як e1g1');
});
test('шахи: мат дурня — перемога чорних', () => {
  const r = chess();
  const s = ['f2f3', 'e7e5', 'g2g4', 'd8h4'].reduce((p, u) => r.play(p, r.moves(p).find(m => m.from + m.to === u)), r.initial());
  assert.equal(r.result(s).winner, 'b');
});
test('шахи: робот ходить за правилами (рівні 1–4)', () => playout(chess(), [1, 2, 3, 4], 16));

test('пішаки: 16 ходів на старті, робот за правилами', () => {
  const r = pawns();
  assert.equal(r.moves(r.initial()).length, 16);
  playout(r);
});

for (const [mode] of MODES) test(`фігури проти пішаків: ${mode}`, () => playout(pvp({ mode: () => mode }), [1, 3], 30));
