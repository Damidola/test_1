import {readFile,mkdir} from 'node:fs/promises';
import {extname,join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {compileExercise,coinDestinations,movePosition,readPosition} from '../chessity/model.js';
const ROOT=new URL('..',import.meta.url).pathname,SHOTS=process.argv[2]||process.env.CHECK_SCREENSHOTS||'/tmp/chessity-check';await mkdir(SHOTS,{recursive:true});
const base='http://chess.local/',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.otf':'font/otf','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const browser=await chromium.launch({headless:true});
try{for(const[width,height]of [[390,866],[450,855],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:width<960,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(base+'**',async r=>{const path=decodeURIComponent(new URL(r.request().url()).pathname);try{await r.fulfill({body:await readFile(join(ROOT,path==='/'?'index.html':path)),contentType:types[extname(path)]||'application/octet-stream'});}catch{await r.fulfill({status:404,body:''});}});
 await page.route(/fonts\.g|youtube|telegram\.org/,r=>r.abort());
 await page.goto(base+'index.html#chessity');await page.locator('.ct-journey-lesson').first().waitFor();
 assert.equal(await page.locator('.ct-journey-lesson').count(),29);assert.equal(await page.locator('[aria-current=step]').getAttribute('data-lesson-id'),'1110');assert.ok(await page.locator('[data-lesson-id="1110"]').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
 assert.equal(await page.locator('.ap-tabs a').count(),5);await page.locator('[data-levels]').click();assert.equal(await page.locator('.ct-picker [data-level]').count(),18);await page.locator('[data-close]').click();
 await page.goto(base+'index.html#chessity/level/64');await page.locator('.ct-category').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);await page.screenshot({path:join(SHOTS,`${width}-levels.png`),fullPage:false});
 await page.locator('.ct-category').first().click();await page.locator('.ct-card').first().waitFor();assert.ok(await page.locator('.ct-card img').first().evaluate(x=>x.complete&&x.naturalWidth>0));
 await page.goto(base+'index.html#chessity/play/1099');await page.locator('#ct-board piece').first().waitFor();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:session')));assert.equal(saved.ids.length,5);assert.equal(new Set(saved.ids).size,5);
 const dataset=JSON.parse(await readFile(join(ROOT,'chessity/data/1099.json'))),positions=saved.ids.map(id=>dataset.puzzles.find(x=>x.id===id).fen.split(/\s+/).slice(0,4).join(' '));assert.equal(new Set(positions).size,5);
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);await page.screenshot({path:join(SHOTS,`${width}-exercise.png`)});
 await page.goto(base+'index.html#chessity/profile');await page.locator('.ct-profile').waitFor();await page.goto(base+'index.html#chessity/play/1099');await page.locator('#ct-board piece').first().waitFor();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:session')).ids),saved.ids);
 if(width===390){
  const tap=async square=>{const b=await page.locator('#ct-board cg-board').boundingBox();await page.touchscreen.tap(b.x+(square.charCodeAt(0)-97+.5)*b.width/8,b.y+(8-Number(square[1])+.5)*b.height/8);};
  function pathTo(start,target){const queue=[{p:start,path:[]}],seen=new Set();for(let i=0;i<queue.length&&i<5000;i++){const{p,path}=queue[i],from=Object.keys(p.pieces).find(k=>p.pieces[k].color==='white');if(from===target)return path;const key=from+Object.keys(p.marks).sort().join();if(seen.has(key))continue;seen.add(key);for(const to of coinDestinations(p).get(from)||[]){if(p.marks[to]==='flag'&&Object.values(p.marks).includes('coin'))continue;const q=movePosition(p,{from,to});q.turn='white';queue.push({p:q,path:[...path,{from,to}]});}}throw Error('No safe route');}
  for(let i=0;i<5;i++){
   const raw=dataset.puzzles.find(x=>x.id===saved.ids[i]);let p=readPosition(raw.fen);
   if(i===4){await page.locator('.ct-game-footer [data-explain]').click();await page.locator('.ct-guide-hint').click();await page.locator('.gd').waitFor({state:'detached'});}
   const coins=Object.keys(p.marks).filter(k=>p.marks[k]==='coin'),flag=Object.keys(p.marks).find(k=>p.marks[k]==='flag');
   for(const target of [...coins,flag]){if(target!==flag&&!p.marks[target])continue;for(const m of pathTo(p,target)){await tap(m.from);await tap(m.to);p=movePosition(p,m);p.turn='white';await page.waitForTimeout(70);}}
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('chk:chessity:session'))?.snapshot.done||document.querySelector('.ct-result'));
   assert.equal(await page.locator('square.ct-flag:visible').count(),0,'Captured flag disappears');
   if(i<4)await page.waitForFunction(expected=>JSON.parse(localStorage.getItem('chk:chessity:session'))?.index===expected,i+1);
   else await page.locator('.ct-result').waitFor();
  }
  await page.locator('.ct-result').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:v1'))[1099].stars),3,'Four green answers award three stars');await page.screenshot({path:join(SHOTS,'390-result.png')});
  await page.goto(base+'index.html#profile');await page.locator('.mg-link[href="#chessity/profile"]').waitFor();assert.match(await page.locator('.mg-link[href="#chessity/profile"]').textContent(),/3/);
  await page.goto(base+'index.html#chessity/profile');await page.reload();await page.locator('.ct-profile').waitFor();assert.match(await page.locator('.ct-profile-stats').textContent(),/3/);
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert.deepEqual(errors,[]);console.log(`✓ Chessity ${width}×${height}: original graphics, eighteen levels, five distinct tasks, stable resume, saved stars/profile`);await page.close();
}}finally{await browser.close();}
