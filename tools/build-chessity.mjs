import { build } from 'esbuild';
await build({ entryPoints: ['chessity/engine-src.js'], outfile: 'chessity/engine.js', bundle: true, format: 'esm', minify: true, legalComments: 'eof' });
await build({stdin:{contents:"export { Chessground } from '@lichess-org/chessground';",resolveDir:process.cwd()},outfile:'shared/vendor/chessground.js',bundle:true,format:'esm',minify:true,legalComments:'eof'});
await build({stdin:{contents:"export * from 'chessops';",resolveDir:process.cwd()},outfile:'shared/vendor/chessops.js',bundle:true,format:'esm',minify:true,legalComments:'eof'});
