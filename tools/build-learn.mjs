// Збирає «Як ходять фігури» (Lichess Learn + під'єднання до сайту) в один файл lessons/app.js.
// Запуск: npm install && npm run build   (готовий lessons/app.js лежить у репозиторії)
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const CHESSGROUND = 'https://cdn.jsdelivr.net/npm/@lichess-org/chessground@10.2.0/dist/chessground.min.js';
// службові модулі lila → наші замінники в lessons/src/shims
const shim = {
  lib: 'lib.ts', 'lib/game': 'lib-game.ts', 'lib/game/ground': 'lib.ts', 'lib/view': 'lib-view.ts',
  'lib/licon': 'lib-misc.ts', 'lib/i18n': 'lib-misc.ts', 'lib/algo': 'lib-misc.ts', 'lib/storage': 'lib-misc.ts',
  'lib/xhr': 'lib-misc.ts', 'lib/pubsub': 'lib-misc.ts', 'lib/prefs': 'lib-misc.ts', 'lib/device': 'lib-misc.ts',
  'lib/view/userLink': 'lib-misc.ts'
};

await build({
  entryPoints: [here('../lessons/src/app.ts')],
  outfile: here('../lessons/app.js'),
  bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'none',
  plugins: [{
    name: 'site-paths',
    setup(b) {
      b.onResolve({ filter: /^lib(\/.*)?$/ }, a => ({ path: here('../lessons/src/shims/' + shim[a.path]) }));
      // дошка — та сама, що в іграх, з CDN; chessops, snabbdom і chessground/util вбудовуються з npm
      b.onResolve({ filter: /^@lichess-org\/chessground$/ }, () => ({ path: CHESSGROUND, external: true }));
      b.onResolve({ filter: /shared\/board\.js$/ }, () => ({ path: '../shared/board.js?v=1790407704', external: true }));
    }
  }]
});
console.log('lessons/app.js зібрано');
