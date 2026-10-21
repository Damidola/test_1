// Browser regression for the shared lesson layout, with real lesson engines.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
import {readFile,mkdir} from 'node:fs/promises';
import {extname,join} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url)), phase='desktop', out=process.env.CHECK_SCREENSHOTS||'/tmp/lesson-layout-review';await mkdir(out,{recursive:true});
const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const cases=phase==='before'?[[1844,809,'lessons/maze.html#rook']]:[[1844,809,'lessons/maze.html#rook'],[1366,768,'lessons/maze.html#bishop'],[1024,768,'lessons/check.html'],[1440,900,'lessons/lesson.html#attack'],[1440,900,'lessons/index.html#/1'],[1920,1080,'lessons/index.html#/1'],[1920,1080,'lessons/maze.html#rook'],[1440,900,'chess-puzzles/index.html#chk_rook'],[1440,900,'chess-puzzles/index.html?lesson=1#esc_run'],[343,651,'lessons/maze.html#rook']];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
for(const[w,h,url]of cases){
 const page=await browser.newPage({viewport:{width:w,height:h}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());let path;
 if(u.hostname==='chess.local')path=join(root,decodeURIComponent(u.pathname));
 else if(u.href.includes('chessops'))path=join(root,'shared/vendor/chessops.js');
 else if(u.href.includes('chessground'))path=u.pathname.endsWith('.css')?(process.env.CHESSGROUND_BASE_CSS||join(root,'node_modules/@lichess-org/chessground/assets/chessground.base.css')):join(root,'shared/vendor/chessground.js');
 else return route.abort();
 try{await route.fulfill({body:await readFile(path),contentType:mime[extname(path)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:''});}});
 await page.addInitScript(()=>{localStorage.setItem('chk:maze:current:rook','3');localStorage.setItem('chk:lvl:maze:rook','["perfect","passed","perfect"]');localStorage.setItem('chk:maze:intro:rook','true');});
 await page.goto('http://chess.local/'+url);await page.waitForTimeout(600);
 for(const selector of ['.lv-vid-go','.gd-go','main[data-step="intro"] #go']){const b=page.locator(selector);if(await b.count()&&await b.first().isVisible())await b.first().click();}
 await page.waitForTimeout(400);
 const geometry=await page.evaluate(()=>{const rect=s=>{const e=[...document.querySelectorAll(s)].find(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;});if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};return{board:rect('.lg-board-wrap, .learn__main.main-board'),header:rect('.lv-row, .lg-run-top, .mt-top'),teacher:rect('.lv-teach'),nav:rect('.lg-nav')};});
 assert.deepEqual(errors,[],url);
 const {board,header,nav}=geometry;assert.ok(board&&header&&nav,url+': missing board/header/navigation');
 assert.ok(board.x>=0&&board.right<=w&&board.y>=0&&board.bottom<=nav.y,url+': board outside viewport');
 if(w>=900){assert.ok(board.width>=Math.min(w-420,h-96)-1,url+': board too small');assert.ok(Math.abs(header.y-board.y)<=1,url+': header detached from board');assert.ok(header.x>=board.right+16,url+': sidebar overlaps board');assert.ok(Math.abs(nav.x-board.x)<=1&&Math.abs(nav.right-board.right)<=1,url+': compact navigation should align with the board');}
 else assert.equal(Math.round(board.width),w,url+': mobile board should fill screen');
 if(w>=900){assert.ok(nav.height<=50,url+': desktop toolbar too tall');assert.ok(await page.locator('.lg-nav-btn:visible').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width<=117&&r.height<=38;})),url+': desktop buttons too large');}
 const file=`${phase}-${w}-${url.replace(/[^a-z0-9]+/gi,'-')}.png`;await page.screenshot({path:join(out,file)});console.log(JSON.stringify({url,w,h,file,geometry,errors}));await page.close();
}
await browser.close();
