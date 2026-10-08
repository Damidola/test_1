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
const checkBank = JSON.parse(await readFile(join(ROOT, 'chess-puzzles/puzzles.json'), 'utf8'));
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
  const guideBtn = await page.$('.gd-go'); if (guideBtn) { await guideBtn.click(); await page.waitForTimeout(250); }
  const lessonBtn = await page.$('main[data-step="intro"] #go'); if (lessonBtn) { await lessonBtn.click(); await page.waitForTimeout(250); }
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
  if (/^chess-puzzles\/index.html#chk_/.test(url)) {
    const section = url.split('#')[1], rows = checkBank[section];
    for (const [i, row] of rows.entries()) {
      try {
        if (i) { await page.locator('#nx').click(); await page.waitForTimeout(100); }
        const before = await page.locator('cg-board').boundingBox();
        await page.evaluate(() => {
          const board = document.querySelector('cg-board');
          window.boardFrames = []; window.recordBoard = true;
          const frame = () => {
            const current = document.querySelector('cg-board'), r = current.getBoundingClientRect();
            window.boardFrames.push({ x: r.x, y: r.y, width: r.width, height: r.height, sameNode: current === board, shadow: getComputedStyle(current).boxShadow });
            if (window.recordBoard) requestAnimationFrame(frame);
          }; frame();
        });
        await page.locator('.lg-nav .lg-hintbtn:visible').click();
        if ((await page.locator('#task').textContent()) !== row[5].hint) throw Error('Немає підказки цієї позиції');
        const tap = async square => page.touchscreen.tap(before.x + (square.charCodeAt(0) - 97 + .5) * before.width / 8, before.y + (8 - Number(square[1]) + .5) * before.height / 8);
        await tap(row[2].slice(0, 2)); await tap(row[2].slice(2, 4));
        await page.waitForFunction(() => document.getElementById('wrap').classList.contains('solved'), undefined, { timeout: 1500 });
        await page.waitForTimeout(350); // дочекайся руху фігури, а не лише зміни моделі
        if ((await page.locator('#task').textContent()) !== row[5].explanation) throw Error('Немає пояснення після ходу');
        const frames = await page.evaluate(() => { window.recordBoard = false; return window.boardFrames; });
        for (const r of frames) {
          if (['x', 'y', 'width', 'height'].some(k => Math.abs(r[k] - before[k]) > 1)) throw Error('Дошка змістилася або змінила розмір після підказки/ходу');
          if (!r.sameNode) throw Error('Дошка створюється заново під час ходу');
          if (r.shadow !== 'none') throw Error('Рамка дошки спалахує після ходу');
        }
        const to = row[2].slice(2, 4), target = { x: before.x + (to.charCodeAt(0) - 97 + .5) * before.width / 8, y: before.y + (8 - Number(to[1]) + .5) * before.height / 8 };
        const visiblePiece = await page.locator('cg-board piece.white.' + row[5].role).evaluateAll((pieces, target) => pieces.some(p => { const r = p.getBoundingClientRect(); return Math.abs(r.x + r.width / 2 - target.x) < 2 && Math.abs(r.y + r.height / 2 - target.y) < 2; }), target);
        if (!visiblePiece) throw Error('Фігура не відображається на клітинці зробленого ходу');
        console.log(`✓ ${W} ${section} ${i + 1}: хід, підказка, пояснення, нерухома дошка`);
        if (SHOTS && [0, 6, 10].includes(i)) await page.screenshot({ path: join(SHOTS, `${W}_${section}_${i + 1}_solved.png`) });
      } catch (error) { problems++; console.log(`✗ ${W} ${section} ${i + 1}: ${error.message}`); await page.evaluate(() => { window.recordBoard = false; }); break; }
    }
  }
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${W}_${url.replace(/[^a-z0-9]+/gi, '_')}.png`) });
  await page.close();
}
await browser.close();
console.log(problems ? `\n${problems} проблем` : '\nУсе гаразд');
process.exit(problems ? 1 : 0);
