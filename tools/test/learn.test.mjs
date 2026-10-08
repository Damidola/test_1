import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { makeSquare } from 'chessops';
import { makeBoardFen } from 'chessops/fen';

const bundle = await build({ stdin: { contents: "export { list } from './lessons/src/lila/stage/list'; export { default as chess } from './lessons/src/lila/chess';", resolveDir: process.cwd() }, bundle: true, format: 'esm', platform: 'node', write: false,
  plugins: [{ name: 'shims', setup(b) { b.onResolve({filter: /^lib\//}, a => ({path: resolve('lessons/src/shims/' + (a.path === 'lib/game' ? 'lib-game.ts' : a.path === 'lib/view' ? 'lib-view.ts' : 'lib-misc.ts'))})); } }] });
globalThis.document = { body: { dataset: { assetUrl: '' } } };
globalThis.i18n = new Proxy({}, { get: () => new Proxy({}, { get: (_, key) => String(key) }) });
const { list, chess } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));

test('усі вправи однією фігурою мають розв’язок у межах цільових ходів', () => {
  let checked = 0;
  for (const stage of list.slice(0, 6)) for (const level of stage.levels) {
    if (level.game || !level.apples.length) continue;
    const apples = typeof level.apples === 'string' ? level.apples.split(' ') : level.apples;
    const initial = chess(level.fen, level.emptyApples ? [] : apples);
    if (initial.instance.board[level.color].size() !== 1) continue;
    const cleanFen = c => { const b = c.instance.board.clone(); for (const sq of b.black) b.take(sq); return makeBoardFen(b); };
    const seen = new Map();
    const solve = (fen, remaining, depth) => {
      if (!remaining.length) return true;
      if (!depth) return false;
      const key = fen + remaining.join(',');
      if ((seen.get(key) ?? -1) >= depth) return false;
      seen.set(key, depth);
      const c = chess(fen + ' w - - 0 1', level.emptyApples ? [] : remaining);
      const moves = c.moves(c.instance).sort((a,b) => Number(remaining.includes(makeSquare(b.to))) - Number(remaining.includes(makeSquare(a.to))));
      for (const m of moves) {
        const next = chess(fen + ' w - - 0 1', level.emptyApples ? [] : remaining);
        const from = makeSquare(m.from), to = makeSquare(m.to);
        const prom = next.get(from).role === 'pawn' && to[1] === '8' ? 'queen' : undefined;
        if (!next.move(from, to, prom)) continue;
        next.setColor(level.color);
        if (level.failure?.({ chess: next, vm: {nbMoves: level.nbMoves-depth+1}, scenario: {} })) continue;
        if (solve(cleanFen(next), remaining.filter(x => x !== to), depth-1)) return true;
      }
      return false;
    };
    assert.ok(solve(cleanFen(initial), apples, level.nbMoves), stage.key + '/' + level.id);
    checked++;
  }
  assert.ok(checked >= 25, String(checked));
});
