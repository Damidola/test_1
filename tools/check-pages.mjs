// Перевірка всіх сторінок у браузері (Playwright, як на телефоні): дошка на всю ширину й не під нижніми кнопками,
// кружечки й Сова не обрізані, без JS-помилок. Запуск: npm run check:pages [-- папка-для-скриншотів]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { build } from 'esbuild';
import { STEPS } from '../shared/path.js';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const ROOT = new URL('..', import.meta.url).pathname, SHOTS = process.argv[2];
if (SHOTS) (await import('node:fs')).mkdirSync(SHOTS, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/json' };
const server = http.createServer(async (req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  try { const b = await readFile(join(ROOT, p.endsWith('/') ? p + 'index.html' : p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}/`;
// бібліотеки з CDN — з node_modules (у пісочниці немає доступу до CDN)
const chessops = (await build({ entryPoints: [join(ROOT, 'node_modules/chessops/dist/esm/index.js')], bundle: true, format: 'esm', write: false })).outputFiles[0].text;
const cg = join(ROOT, 'node_modules/@lichess-org/chessground');

const pages = new Set(['index.html#learn', 'index.html#practice', 'chess/index.html', 'pawns/index.html', 'pieces-vs-pawns/index.html#q_p8', 'chess-puzzles/index.html#m1rook']);
for (const [, , , links] of STEPS) for (const [, , href] of links) if (!href.startsWith('#')) pages.add(href);

const browser = await pw.chromium.launch();
let problems = 0;
for (const [W, H] of [[343, 651], [450, 855]]) for (const url of pages) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true });
  await page.route(/cdn\.jsdelivr\.net|telegram\.org|fonts\.g|youtube-nocookie\.com|youtube\.com|ytimg\.com/, r => {
    const u = r.request().url();
    if (u.includes('chessops')) return r.fulfill({ body: chessops, contentType: 'text/javascript' });
    if (u.includes('chessground') && u.endsWith('.css')) return r.fulfill({ path: join(cg, 'assets/chessground.base.css'), contentType: 'text/css' });
    if (u.includes('chessground')) return r.fulfill({ path: join(cg, 'dist/chessground.min.js'), contentType: 'text/javascript' });
    return r.abort();
  });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + url); await page.waitForTimeout(2000);
  const vidBtn = await page.$('.lv-vid-go'); if (vidBtn) { await vidBtn.click(); await page.waitForTimeout(300); }
  const bad = await page.evaluate(() => {
    const out = [], vw = innerWidth;
    const board = [...document.querySelectorAll('cg-container')].map(e => e.getBoundingClientRect()).find(r => r.width > 50);
    const nav = document.querySelector('.lg-nav, .ap-tabs'), navTop = nav ? nav.getBoundingClientRect().top : innerHeight;
    if (board) {
      if (board.width < vw - 8 && board.bottom < navTop - 8) out.push(`дошка вузька: ${Math.round(board.width)}/${vw}, хоча знизу є місце`);
      if (board.bottom > navTop + 1) out.push(`дошка під кнопками на ${Math.round(board.bottom - navTop)}px`);
      if (board.top < 0 && !document.querySelector('.kt-crop')) out.push('дошка обрізана згори');
    }
    for (const el of document.querySelectorAll('.lg-teacher, .lv-bar .lv, .lg-run-top .progress a')) {
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      if (r.left < 2 || r.right > vw - 2) { out.push(`обрізано по краю: ${el.className}`); break; }
    }
    return out;
  });
  bad.push(...errors.map(e => 'JS: ' + e));
  if (bad.length) { problems += bad.length; console.log(`✗ ${W}x${H} ${url}\n   ` + bad.join('\n   ')); } else console.log(`✓ ${W}x${H} ${url}`);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${W}_${url.replace(/[^a-z0-9]+/gi, '_')}.png`) });
  await page.close();
}
await browser.close(); server.close();
console.log(problems ? `\n${problems} проблем` : '\nУсе гаразд');
process.exit(problems ? 1 : 0);
