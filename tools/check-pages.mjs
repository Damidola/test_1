// Перевірка всіх сторінок у браузері (Playwright, як на телефоні): дошка на всю ширину й не під нижніми кнопками,
// кружечки й Сова не обрізані, без JS-помилок. Запуск: npm run check:pages [-- папка-для-скриншотів]
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STEPS } from '../shared/path.js';

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const ROOT = new URL('..', import.meta.url).pathname, SHOTS = process.argv[2] || process.env.CHECK_SCREENSHOTS;
if (SHOTS) (await import('node:fs')).mkdirSync(SHOTS, { recursive: true });
const base = 'http://chess.local/';
const resultRoot = join(ROOT, 'node_modules/@badrap/result');
const resultPackage = JSON.parse(await readFile(join(resultRoot, 'package.json'), 'utf8'));
const resultEntry = resultPackage.module ? join(resultRoot, resultPackage.module) : fileURLToPath(import.meta.resolve('@badrap/result'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/json' };
// CDN-модулі читаються з установлених npm-пакетів; перевірка не потребує мережі або збірки.
const chessops = join(ROOT, 'node_modules/chessops/dist/esm/index.js');
const cg = join(ROOT, 'node_modules/@lichess-org/chessground');
async function moduleBody(file) {
  const text = await readFile(file, 'utf8');
  return text.replace(/(from\s*|import\s*)(['"])([^'"]+)\2/g, (whole, prefix, quote, spec) => {
    const target = spec === '@badrap/result' ? resultEntry : spec.startsWith('.') ? join(file, '..', spec) : null;
    return target ? prefix + quote + base + target.slice(ROOT.length) + quote : whole;
  });
}

const pages = new Set(['index.html#learn', 'index.html#practice', 'chess/index.html', 'pawns/index.html', 'pieces-vs-pawns/index.html#q_p8', 'chess-puzzles/index.html#m1rook', 'chess-puzzles/index.html#kqk', 'chess-puzzles/index.html#krk', ...['rook', 'bishop', 'queen', 'knight', 'pawn'].map(r => 'chess-puzzles/index.html#chk_' + r)]);
for (const [, , , links] of STEPS) for (const [, , href] of links) if (!href.startsWith('#')) pages.add(href);

const browser = await pw.chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {});
let problems = 0;
for (const [W, H] of [[343, 651], [450, 855]]) for (const url of pages) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true });
  await page.route(base + '**', async r => {
    const pathname = decodeURIComponent(new URL(r.request().url()).pathname), file = join(ROOT, pathname.endsWith('/') ? pathname + 'index.html' : pathname);
    try {
      const body = file.includes('/node_modules/') && file.endsWith('.js') ? await moduleBody(file) : await readFile(file);
      await r.fulfill({ status: 200, body, contentType: TYPES[extname(file)] || 'application/octet-stream' });
    } catch { await r.fulfill({ status: 404, body: '' }); }
  });
  await page.route(/cdn\.jsdelivr\.net|telegram\.org|fonts\.g|youtube-nocookie\.com|youtube\.com|ytimg\.com/, async r => {
    const u = r.request().url();
    if (u.includes('chessops')) return r.fulfill({ body: await moduleBody(chessops), contentType: 'text/javascript' });
    if (u.includes('chessground') && u.endsWith('.css')) return r.fulfill({ path: join(cg, 'assets/chessground.base.css'), contentType: 'text/css' });
    if (u.includes('chessground')) return r.fulfill({ body: await moduleBody(join(cg, 'dist/chessground.js')), contentType: 'text/javascript' });
    return r.abort();
  });
  page.setDefaultTimeout(7000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + url); await page.waitForTimeout(900);
  const vidBtn = await page.$('.lv-vid-go'); if (vidBtn) { await vidBtn.click(); await page.waitForTimeout(300); }
  const guideBtn = await page.$('.gd-go'); if (guideBtn) { await guideBtn.click(); await page.waitForTimeout(100); }
  const lessonBtn = await page.$('main[data-step="intro"] #go'); if (lessonBtn) { await lessonBtn.click(); await page.waitForTimeout(100); }
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
  if (errors.length) { await browser.close(); throw Error(`${url}: ${errors.join('; ')}`); }
  if (bad.length) { problems += bad.length; console.log(`✗ ${W}x${H} ${url}\n   ` + bad.join('\n   ')); } else console.log(`✓ ${W}x${H} ${url}`);
  if (url === 'chess-puzzles/index.html#chk_rook') {
    try {
      await page.locator('.lg-nav .lg-hintbtn:visible').click();
      if (!(await page.locator('#task').textContent()).includes('Шукай')) throw Error('Немає змістовної першої підказки');
      const box = await page.locator('cg-board').boundingBox();
      await page.touchscreen.tap(box.x + box.width / 16, box.y + box.height * 15 / 16);
      await page.touchscreen.tap(box.x + box.width / 16, box.y + box.height / 16);
      await page.waitForFunction(() => document.getElementById('wrap').classList.contains('solved'), undefined, { timeout: 2500 });
      if (!(await page.locator('#task').textContent()).includes('Тура атакує')) throw Error('Немає пояснення після розв’язання');
      console.log('✓ мобільний хід a1–a8, підказка і пояснення');
    } catch (error) { problems++; console.log('✗ взаємодія з шахом: ' + error.message); }
  }
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${W}_${url.replace(/[^a-z0-9]+/gi, '_')}.png`) });
  await page.close();
}
await browser.close();
console.log(problems ? `\n${problems} проблем` : '\nУсе гаразд');
process.exit(problems ? 1 : 0);
