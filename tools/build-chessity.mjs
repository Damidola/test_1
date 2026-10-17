import { build } from 'esbuild';
await build({ entryPoints: ['chessity/engine-src.js'], outfile: 'chessity/engine.js', bundle: true, format: 'esm', minify: true, legalComments: 'eof' });
