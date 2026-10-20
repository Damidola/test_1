import{createServer}from'node:http';import{readFile}from'node:fs/promises';import{resolve,extname,sep}from'node:path';
const root=resolve(new URL('..',import.meta.url).pathname),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.otf':'font/otf','.ttf':'font/ttf','.mp3':'audio/mpeg'};
export async function serveChessity(override){
 const server=createServer(async(req,res)=>{try{
  if(override&&await override(req,res))return;
  const path=decodeURIComponent(new URL(req.url,'http://test.local').pathname),file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
 }catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return{url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>{server.close(r);server.closeAllConnections();})};
}
