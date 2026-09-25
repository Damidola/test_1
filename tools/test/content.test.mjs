// Зміст: кожне посилання шляху уроків веде на існуючу сторінку й розділ; задачі — коректні позиції з ходами за правилами
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { Chess, parseUci } from 'chessops';
import { parseFen } from 'chessops/fen';
import { STEPS } from '../../shared/path.js';

const ROOT = new URL('../../', import.meta.url);
const PUZ = JSON.parse(readFileSync(new URL('chess-puzzles/puzzles.json', ROOT)));

test('шлях уроків: сторінки існують', () => {
  for (const [, title, , links] of STEPS) for (const [, , href] of links) {
    if (href.startsWith('#')) continue;
    const file = href.split(/[?#]/)[0];
    assert.ok(existsSync(new URL(file, ROOT)), `${title}: ${file}`);
    if (file === 'chess-puzzles/index.html') {
      const k = href.split('#')[1];
      const practice = /^(kqk|krk|kbbk|kpk)$/.test(k);
      assert.ok(practice || PUZ[k], `${title}: розділ задач ${k}`);
    }
  }
});

test('задачі: FEN коректні, ходи розв’язку за правилами', () => {
  let n = 0;
  for (const [k, list] of Object.entries(PUZ)) for (const [id, fen, moves] of list) {
    const pos = Chess.fromSetup(parseFen(fen).unwrap());
    assert.ok(pos.isOk, `${k}/${id}: позиція`);
    const p = pos.unwrap();
    for (const u of moves.split(' ')) {
      const m = parseUci(u);
      assert.ok(m && p.isLegal(m), `${k}/${id}: хід ${u}`);
      p.play(m);
    }
    n++;
  }
  assert.ok(n > 100);
});
