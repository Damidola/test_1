// Інтеграційна перевірка нового Learn без звернень до облікового запису Chessity.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {compileExercise,questionExercise,mainline} from '../chessity/model.js';

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

const browser=await pw.chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
try {
for (const [width,height] of [[343,651],[450,855],[1440,900]]) {
  const page=await browser.newPage({viewport:{width,height},isMobile:width<800,hasTouch:true});
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

  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html#chessity');
  await page.locator('.ct-card').first().waitFor();
  assert.equal(await page.locator('.ap-tabs a').count(),5);
  const nav=await page.locator('.ap-tabs').boundingBox();
  assert.ok(width<960?nav.y>height-100:nav.x===0);
  await page.locator('[data-levels]').click();
  assert.equal(await page.locator('.ct-picker [data-level]').count(),18);
  await page.locator('[data-close]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  if(SHOTS)await page.screenshot({path:join(SHOTS,`chessity-${width}-catalog.png`)});
  const catalog=JSON.parse(await readFile(join(ROOT,'chessity/data/catalog.json')));
  const chosen=catalog.lessons.find(l=>l.id===1099);
  await page.goto(base+'index.html#chessity/lesson/'+chosen.id);
  await page.locator('.ct-lesson-intro .ct-primary').click();
  await page.locator('.gd-go').waitFor();
  assert.ok(await page.locator('.gd-dots i').count()>=2);
  if(SHOTS)await page.screenshot({path:join(SHOTS,`chessity-${width}-guide.png`)});
  await page.locator('.gd-go').click();
  await page.waitForTimeout(250);
  const rect=await page.locator('#ct-board cg-board').boundingBox();
  assert.ok(rect.width>=200);assert.ok(Math.abs(rect.width-rect.height)<2);
  assert.equal(await page.locator('#ct-board piece:not(.ghost)').count(),1);
  if(width<960){const end=await page.locator('[data-solution]').boundingBox();assert.ok(end.y+end.height<nav.y, 'Усі кнопки вправи над навігацією');}
  if(SHOTS)await page.screenshot({path:join(SHOTS,`chessity-${width}-exercise.png`)});
  const tap=async (from,to,orientation='white')=>{
    const b=await page.locator('#ct-board cg-board').boundingBox();
    const point=s=>({x:b.x+((orientation==='white'?s.charCodeAt(0)-97:104-s.charCodeAt(0))+.5)*b.width/8,y:b.y+((orientation==='white'?8-Number(s[1]):Number(s[1])-1)+.5)*b.height/8});
    const p=point(from),q=point(to);await page.touchscreen.tap(p.x,p.y);await page.touchscreen.tap(q.x,q.y);await page.waitForTimeout(200);
  };
  await tap('a5','d5');await tap('d5','d8');
  await page.waitForFunction(()=>!document.querySelector('#ct-next').disabled);
  await page.locator('#ct-next').click();
  // Complete the available original examples through actual board gestures.
  const lesson=JSON.parse(await readFile(join(ROOT,'chessity/data/'+chosen.id+'.json')));
  const seen=new Set(),exercises=[];
  for(const raw of [...lesson.puzzles,...lesson.examples]){const key=raw.fen+'|'+raw.pgn;if(seen.has(key))continue;seen.add(key);try{exercises.push(compileExercise(raw.fen,raw.pgn));}catch{}}
  for(const ex of exercises.slice(1)){
    if(ex.coinGoal){
      const edges=mainline(ex).filter(e=>e.move);for(const e of edges)await tap(e.move.from,e.move.to,ex.player);
    }else{for(const e of mainline(ex)){if(e.move&&e.next.turn!==ex.player)await tap(e.move.from,e.move.to,ex.player);else await page.waitForTimeout(800);}}
    await page.waitForFunction(()=>!document.querySelector('#ct-next').disabled);await page.locator('#ct-next').click();
  }
  await page.locator('.ct-result').waitFor();
  assert.match(await page.locator('.ct-result h1').textContent(),/Урок пройдено/);
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:v1'))[1099].stars>0));
  await page.reload();await page.locator('.gd-go').click();
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:v1'))[1099].stars>0));
  await page.locator('.ap-tabs a[href="#practice"]').click();
  await page.locator('#view-practice:not([hidden])').waitFor();assert.equal(await page.locator('.gd-overlay').count(),0);
  if(width===343){
    const open=async id=>{await page.goto(base+'index.html#chessity/play/'+id);await page.locator('.gd-go').click();await page.waitForTimeout(220);};
    await open(1231);await tap('b1','b1');await page.waitForFunction(()=>!document.querySelector('#ct-next').disabled);
    await open(1375);
    const qLesson=JSON.parse(await readFile(join(ROOT,'chessity/data/1375.json'))),q=qLesson.puzzles[0];
    const question=questionExercise(q.fen,q.pgn).question;
    await page.locator(`[data-answer="${question.legal?'yes':'no'}"]`).click();
    await page.waitForFunction(()=>!document.querySelector('#ct-next').disabled);
    await open(1504);await tap('c7','c8');await page.locator('[data-promotion="queen"]').click();
    await page.waitForTimeout(250);assert.ok(await page.locator('#ct-board piece.queen:not(.ghost)').count()>0);
    await open(1127);
    const bLesson=JSON.parse(await readFile(join(ROOT,'chessity/data/1127.json'))),raw=bLesson.puzzles[0],ex=compileExercise(raw.fen,raw.pgn);
    for(const edge of mainline(ex)){if(edge.move&&edge.next.turn!==ex.player)await tap(edge.move.from,edge.move.to,'black');else await page.waitForTimeout(800);}
    await page.waitForFunction(()=>!document.querySelector('#ct-next').disabled);
    await open(1207);await page.locator('[data-solution]').click();
    await page.waitForFunction(()=>!document.querySelector('#ct-next').disabled);await page.locator('#ct-next').click();
    await page.locator('.ct-result').waitFor();assert.match(await page.locator('.ct-result h1').textContent(),/Практику завершено/);
    assert.ok(await page.evaluate(()=>!JSON.parse(localStorage.getItem('chk:chessity:v1'))[1207]));
    console.log('✓ Chessity: початкове поле, відповідь так/ні, перетворення, гра чорними, без зірок за перегляд');
  }
  assert.deepEqual(errors,[]);console.log(`✓ Chessity ${width}×${height}: рівні, пояснення, дошка, розв’язання, прогрес, перемикання вкладок`);
  await page.close();
}
}finally{await browser.close();}
