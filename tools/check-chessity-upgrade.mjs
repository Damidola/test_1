import{chromium}from'playwright';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{serveChessity}from'./chessity-test-server.mjs';
let legacy=true;
const oldWorker=`const NAME='chessity-offline-1792358668';self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith((async()=>await(await caches.open(NAME)).match(e.request,{ignoreSearch:true})||fetch(e.request))());});`;
const server=await serveChessity(async(req,res)=>{
 if(req.url.split('?')[0]==='/chessity-sw.js'&&legacy){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(oldWorker);return true;}
 if(req.url==='/upgrade-bootstrap'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Upgrade regression</title>');return true;}
 return false;
}),browser=await chromium.launch();
try{
 const context=await browser.newContext({viewport:{width:390,height:700},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/fonts\.g|telegram\.org/,r=>r.abort());await page.goto(server.url+'/upgrade-bootstrap');
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/chessity-sw.js');await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const puzzle=await readFile('chessity/data/1110.json','utf8'),coach=await readFile('chessity/assets/original/coach.svg','utf8');
 await page.evaluate(async({puzzle,coach})=>{
  const cache=await caches.open('chessity-offline-1792358668');
  await cache.put('/index.html',new Response('<!doctype html><h1 id="legacy">Old cached client</h1><script src="/app.js?v=old"></script>',{headers:{'Content-Type':'text/html'}}));
  await cache.put('/app.js',new Response('window.STALE_CHESSITY=true',{headers:{'Content-Type':'text/javascript'}}));
  await cache.put('/chessity/data/1110.json',new Response(puzzle,{headers:{'Content-Type':'application/json'}}));
  await cache.put('/chessity/assets/original/coach.svg',new Response(coach,{headers:{'Content-Type':'image/svg+xml'}}));
  localStorage.setItem('chk:chessity:v1',JSON.stringify({1110:{stars:3}}));localStorage.setItem('chk:chessity:session',JSON.stringify({lesson:1110,ids:[36012,36013,36014,36015,36016],index:1,roundStars:[3],counted:[36012]}));
 },{puzzle,coach});
 await page.goto(server.url+'/index.html?v=new#chessity/play/1110');await page.locator('#legacy').waitFor();assert.equal(await page.evaluate(()=>window.STALE_CHESSITY),true,'Old worker ignores the version query');
 legacy=false;
 await page.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update())).catch(e=>{if(!/context was destroyed|navigation/i.test(e.message))throw e;});
 await page.locator('#ct-board piece').first().waitFor({timeout:30000});await page.evaluate(()=>document.fonts.ready);await page.locator('.ct-coach>img').evaluate(x=>x.decode());
 assert.equal(await page.evaluate(()=>window.STALE_CHESSITY),undefined);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:session')).index),1);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:v1'))[1110].stars),3);
 const cachesState=await page.evaluate(async()=>{const names=await caches.keys(),cache=await caches.open(names.find(n=>n.startsWith('chessity-offline-journey-')));return{names,code:await(await cache.match('/app.js?v=stale',{ignoreSearch:true})).text(),puzzle:!!await cache.match('/chessity/data/1110.json',{ignoreSearch:true}),coach:!!await cache.match('/chessity/assets/original/coach.svg',{ignoreSearch:true})};});
 assert.ok(!cachesState.names.includes('chessity-offline-1792358668'));assert.notEqual(cachesState.code,'window.STALE_CHESSITY=true');assert.ok(cachesState.puzzle&&cachesState.coach,'Offline lesson and graphics survive migration');
 await page.waitForTimeout(250);await context.setOffline(true);await page.reload();await page.locator('#ct-board piece').first().waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('chk:chessity:session')).index),1);assert.deepEqual(errors,[]);
 console.log('PASS: a real old worker serves stale code despite a new query; update replaces code, reloads the old client once, retains stars/session/offline assets, and cold-reloads the exercise without network');
}finally{await browser.close();await server.close();}
