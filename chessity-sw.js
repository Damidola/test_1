/* Keep lesson data offline while replacing old application code on upgrades. */
const VERSION='chessity-offline-journey-234',PREFIX='chessity-offline-';
const root=new URL('./',self.location.href),url=p=>new URL(p.split('/').map(encodeURIComponent).join('/'),root).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(VERSION),manifest=await fetch(url('chessity/offline-manifest.json'),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json();});
 await cache.addAll(manifest.core.map(p=>new Request(url(p),{cache:'reload'})));await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const previous=(await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==VERSION),cache=await caches.open(VERSION);
 for(const name of previous){
  const old=await caches.open(name),queue=await old.keys();
  await Promise.all(Array.from({length:4},async()=>{while(queue.length){
   const request=queue.shift(),path=new URL(request.url).pathname;
   // Code/navigation must come from the new core. Retain original images, sounds,
   // fonts and lesson pools, so upgrading does not discard a downloaded course.
   if(/\.(?:js|css|html)$/.test(path)||path.endsWith('/')||/\/(?:catalog|offline-manifest|journey-images)\.json$/.test(path))continue;
   if(!await cache.match(request,{ignoreSearch:true})){const response=await old.match(request);if(response)await cache.put(request,response);}
  }}));await caches.delete(name);
 }
 await self.clients.claim();
 // Old app.js has no controllerchange listener. Reload it once after migration;
 // pagehide saves the active exercise in localStorage before navigation.
 if(previous.length)for(const client of await self.clients.matchAll({type:'window'})){
  // Do not await navigation during activation: its fetch waits for activation.
  client.navigate(client.url).catch(()=>{});
 }
})()));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==root.origin||!u.pathname.startsWith(root.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION),hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;
  try{const response=await fetch(event.request);if(response.ok&&(u.pathname.includes('/chessity/')||u.pathname.includes('/shared/')||event.request.mode==='navigate'))await cache.put(event.request,response.clone());return response;}
  catch(error){if(event.request.mode==='navigate'){const index=await cache.match(url('index.html'),{ignoreSearch:true});if(index)return index;}throw error;}
 })());
});
let downloading;
self.addEventListener('message',event=>{
 if(event.data?.type!=='CACHE_CHESSITY'||downloading)return;
 downloading=(async()=>{
  const manifest=await fetch(url('chessity/offline-manifest.json'),{cache:'no-store'}).then(r=>r.json()),cache=await caches.open(VERSION),queue=[...manifest.files];let done=0,failed=0;
  const send=async()=>{for(const client of await self.clients.matchAll())client.postMessage({type:'CHESSITY_CACHE_PROGRESS',done,total:manifest.files.length,failed});};
  await Promise.all(Array.from({length:6},async()=>{while(queue.length){const path=queue.shift();try{if(!await cache.match(url(path),{ignoreSearch:true})){const response=await fetch(url(path));if(!response.ok)throw Error(response.status);await cache.put(url(path),response);}}catch{failed++;}done++;if(done%20===0||done===manifest.files.length)await send();}}));
 })().finally(()=>{downloading=null;});event.waitUntil(downloading);
});
