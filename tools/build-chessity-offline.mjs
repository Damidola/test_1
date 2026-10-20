import {readdir,writeFile,stat} from 'node:fs/promises';
async function walk(path){const result=[];for(const item of await readdir(path,{withFileTypes:true})){const name=path+'/'+item.name;if(item.isDirectory())result.push(...await walk(name));else result.push(name);}return result;}
const shared=(await walk('shared')).filter(p=>/\.(js|css)$/.test(p)&&!p.includes('/videos/'));
const core=['index.html','app.js','app.css','manifest.webmanifest','chessity/app.js','chessity/model.js','chessity/engine.js','chessity/style.css','chessity/chessground.base.css','chessity/data/catalog.json','chessity/data/journey-images.json',...shared];
const files=[...new Set([...core,...(await walk('chessity')).filter(p=>/\.(json|png|jpg|svg|webp|mp3|wav|otf|ttf)$/.test(p))])].filter(p=>p!=='chessity/offline-manifest.json');
const bytes=(await Promise.all(files.map(p=>stat(p)))).reduce((n,s)=>n+s.size,0);await writeFile('chessity/offline-manifest.json',JSON.stringify({version:231,bytes,core,files}));console.log('Chessity offline',files.length,'files',Math.ceil(bytes/1024/1024),'MiB');
