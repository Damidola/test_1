import { createBoard } from '../shared/board.js?v=1792358668';
import { openGuide, closeGuide } from '../shared/guide.js?v=1792358668';
import { compileExercise, questionExercise, mainline, destinations, coinDestinations, movePosition, positionFen, progressSummary, startingPositionExercise, miniWinner, miniBestMove } from './model.js?v=1792358668';

const ROOT=document.getElementById('view-chessity'), LG=window.LG;
const URL_ROOT=new URL('./',import.meta.url), VERSION=new URL(import.meta.url).search;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS=['#f4bc57','#8f9feb','#f083b4','#64c8bf','#b18bea','#ef8b73'];
const roles={P:'pawn',N:'knight',B:'bishop',R:'rook',Q:'queen',K:'king'};
const piece=(role,color='w')=>`<img src="chessity/assets/original/images/pieces/${color==='w'?'white':'black'}_${roles[role]}.png" alt="">`;
const icon=(name)=>`<span class="ct-icon" aria-hidden="true">${({back:'&#xf71e;',close:'&#xe16a;',left:'&#xe15e;',right:'&#xe15f;',profile:'&#xe491;',book:'&#xe377;',star:'&#xe5f9;'})[name]}</span>`;

const star=(n,max=3)=>`<span class="ct-stars" aria-label="Зірки: ${n} із ${max}">${Array.from({length:max},(_,i)=>`<span class="ct-icon ${i<n?'earned':''}">&#xe5f9;</span>`).join('')}</span>`;
const store=()=>LG.store.get('chessity:v1',{})||{};
const save=p=>LG.store.set('chessity:v1',p);
let catalog, board, session, generation=0, activeLevel=+LG.store.get('chessity:level',40), loadPromise;
const lessonCache=new Map();
async function json(file) { const response=await fetch(new URL('data/'+file+VERSION,URL_ROOT));if(!response.ok)throw new Error('Не вдалося завантажити урок. Спробуй ще раз.');return response.json(); }
const load=()=>loadPromise||(loadPromise=json('catalog.json').then(x=>catalog=x).catch(e=>{loadPromise=null;throw e;}));
async function lesson(id) { if(!lessonCache.has(id))lessonCache.set(id,json(id+'.json').catch(e=>{lessonCache.delete(id);throw e;}));return lessonCache.get(id); }
const levelOf=id=>catalog.levels.find(l=>l.id===id)||catalog.levels[0];
const back=id=>`<a class="ct-back" href="#chessity/level/${id}" aria-label="Назад до уроків">‹</a>`;
function dispose() { rememberSession();generation++;closeGuide();board?.destroy();board=null;session=null;ROOT.querySelector('dialog')?.close(); }
export function deactivate() { dispose(); }
function art(group) {
  const item=catalog?.lessons.find(x=>x.group===group&&x.stickerID),sticker=catalog?.levels.flatMap(x=>x.stickers||[]).find(x=>x.id===item?.stickerID);
  return `<img src="chessity/assets/original/${sticker?'web/'+sticker.img+'.png':'images/default_lesson.png'}" alt="" loading="lazy">`;
}
const levelPiece=l=>`<img src="chessity/assets/original/images/journey/pieces/${roles[l.piece]}.png" alt="">`;
const header=(title,backTo='#learn')=>`<header class="ct-head"><h1>${esc(title)}</h1><a href="${backTo}" aria-label="Закрити">${icon('close')}</a></header>`;
function groupsFor(level){const result=(level.stickers||[]).map(x=>({...x,lessons:x.lessons.filter(id=>catalog.lessons.some(l=>l.id===id))}));const known=new Set(result.flatMap(x=>x.lessons)),extra=level.lessons.filter(id=>!known.has(id));if(extra.length)result.push({id:'extra',name:'Додаткова практика',lessons:extra,img:null});return result;}

function renderLevel(id) {
 const level=levelOf(id),progress=store(),i=catalog.levels.indexOf(level);activeLevel=level.id;LG.store.set('chessity:level',level.id);ROOT.classList.remove('ct-game');
 ROOT.innerHTML=header('Рівні')+`<div class="ct-banner"><button data-level="${catalog.levels[Math.max(0,i-1)].id}" aria-label="Попередній рівень" ${i===0?'disabled':''}>${icon('left')}</button>${levelPiece(level)}<button data-level="${catalog.levels[Math.min(catalog.levels.length-1,i+1)].id}" aria-label="Наступний рівень" ${i===catalog.levels.length-1?'disabled':''}>${icon('right')}</button></div><section class="ct-level-panel"><h2>${esc(level.name)}</h2><b class="ct-level-number">Level ${i+1}</b><p class="ct-leveldesc">${esc(level.description)}</p><div class="ct-categories">${groupsFor(level).map(g=>{const done=g.lessons.filter(id=>progress[id]?.stars>0).length;return `<a class="ct-category" href="#chessity/group/${level.id}-${g.id}"><span class="ct-category-art"><img src="chessity/assets/original/${g.img?'web/'+g.img+'.png':'images/formatImages/mix.png'}" alt=""></span><span class="ct-category-info"><b>${esc(g.name)}</b><span class="ct-category-count"><span><i style="width:${g.lessons.length?done/g.lessons.length*100:0}%"></i></span>${done} / ${g.lessons.length}</span></span></a>`;}).join('')}</div></section><footer class="ct-level-footer"><a href="#learn">Назад</a><button data-levels>Змінити рівень</button></footer>`;
}
function renderGroup(token){
 const [levelID,groupID]=token.split('-'),level=levelOf(+levelID),group=groupsFor(level).find(x=>String(x.id)===groupID);if(!group)return renderLevel(level.id);ROOT.classList.remove('ct-game');
 const progress=store();ROOT.innerHTML=header(group.name,'#chessity/level/'+level.id)+`<div class="ct-group-hero"><img src="chessity/assets/original/${group.img?'web/'+group.img+'.png':'images/formatImages/mix.png'}" alt=""></div><div class="ct-grid">${group.lessons.map(id=>{const l=catalog.lessons.find(x=>x.id===id);return `<a class="ct-card ${progress[id]?.stars?'complete':''}" href="#chessity/lesson/${id}"><span class="ct-card-art">${art(l.group)}</span><b>${esc(l.name)}</b>${star(progress[id]?.stars||0)}</a>`;}).join('')}</div><a class="ct-secondary" href="#chessity/level/${level.id}">Назад</a>`;
}
function renderProfile(){const progress=store(),stats=progressSummary(progress,catalog.lessons),history=LG.store.get('chessity:history',{}),today=history[new Date().toLocaleDateString('en-CA')]||{solved:0,stars:0};ROOT.classList.remove('ct-game');ROOT.innerHTML=header('Профіль','#chessity')+`<div class="ct-profile"><img class="ct-avatar" src="chessity/assets/original/coach.svg" alt=""><h2>Юний шахіст</h2><div class="ct-profile-stats"><div><b>${stats.stars}</b>Зірки</div><div><b>${stats.done}</b>Уроки</div><div><b>${today.solved}</b>Задачі сьогодні</div></div><button class="ct-secondary" data-offline>Зберегти всі уроки для офлайн</button><p id="ct-offline-status" aria-live="polite">Близько 65 МБ: уроки, графіка й звуки.</p><h3>Мої досягнення</h3><div class="ct-badges">${catalog.levels.flatMap(l=>l.stickers||[]).map(g=>`<img class="${g.lessons.every(id=>progress[id]?.stars>0)?'earned':''}" src="chessity/assets/original/web/${g.img}.png" alt="${esc(g.name)}" title="${esc(g.name)}">`).join('')}</div><a class="ct-primary" href="#chessity">До уроків</a></div>`;}

function picker() {
  const dialog=document.createElement('dialog');dialog.className='ct-picker';dialog.innerHTML=`<header><h2>Обери рівень</h2><button type="button" data-close aria-label="Закрити">✕</button></header><div>${catalog.levels.map((l,i)=>`<button type="button" data-level="${l.id}" class="${l.id===activeLevel?'selected':''}" style="--ct-accent:${COLORS[i%6]}">${piece(l.piece)}<b>${esc(l.name)}</b><small>${l.lessons.length} уроків</small></button>`).join('')}</div>`;ROOT.append(dialog);dialog.showModal();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-close]'))dialog.close();});
}
function sanitize(html) {
  const doc=new DOMParser().parseFromString(html||'','text/html'), allowed=new Set(['P','BR','STRONG','EM','B','I','H2','H3','H4','UL','OL','LI','SPAN','IMG','TABLE','TBODY','TR','TD','BLOCKQUOTE','A']);
  for(const el of [...doc.body.querySelectorAll('*')]) {
    if(['SCRIPT','STYLE','IFRAME','OBJECT','FORM','INPUT'].includes(el.tagName)){el.remove();continue;}
    if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);continue;}
    const src=el.getAttribute('src'),href=el.getAttribute('href');for(const a of [...el.attributes])el.removeAttribute(a.name);
    if(el.tagName==='IMG'&&src) {const url=src.startsWith('chessity/assets/')?new URL(src,location.href):new URL('chessity/assets/original/web/'+src.replace(/^\//,''),location.href);if(url.protocol!=='https:'&&url.origin!==location.origin){el.remove();continue;}el.src=url.href;el.alt='Ілюстрація до уроку';el.loading='lazy';}
    if(el.tagName==='A'&&href) {try{const url=new URL(href,'https://www.chessity.com/');if(url.protocol==='https:'){el.href=url.href;el.target='_blank';el.rel='noopener noreferrer';}}catch{}}
  }
  return doc.body.innerHTML;
}
function exerciseList(l) {
  const result=[];const seen=new Set();
  for(const raw of l.puzzles) {
    const key=raw.fen.split(/\s+/).slice(0,4).join(' ');if(seen.has(key))continue;seen.add(key);
    try { const compiled=raw.format===30?questionExercise(raw.fen,raw.pgn):compileExercise(raw.fen,raw.pgn,{opening:raw.format===40,starting:l.id===1231,minigame:raw.format===31,notation:raw.format===33});result.push({...raw,compiled}); } catch { /* Source annotations that do not describe a playable exercise stay in the explanation. */ }
  }
  return result;
}
function guideConfig(l,exercises) {
  const slides=[];
  const placement=exercises.find(x=>x.compiled.placement)?.compiled;
  if(placement){
    const first=structuredClone(placement.start);first.pieces.c3={role:'knight',color:'white'};
    const second=structuredClone(placement.start);second.pieces.b1={role:'knight',color:'white'};delete second.pieces.g1;second.pieces.f3={role:'knight',color:'white'};
    slides.push({fen:positionFen(first),title:'Початкове поле коня — b1',steps:[{move:'c3b1',say:'На початку партії білий кінь стоїть на b1, між турою та слоном.',wait:1500}]},
      {fen:positionFen(second),title:'Другий кінь стоїть на g1',steps:[{move:'f3g1',say:'Обидва білі коні починають партію на першій горизонталі: b1 і g1.',wait:1500}]});
  }
  for(const raw of l.examples) {try {
    const compiled=compileExercise(raw.fen,raw.pgn),edges=mainline(compiled),steps=edges.filter(e=>e.move).map(e=>({move:e.move.from+e.move.to+(e.move.promotion?{queen:'q',rook:'r',bishop:'b',knight:'n'}[e.move.promotion]:''),wait:900}));
    const explanation=new DOMParser().parseFromString(sanitize(raw.text),'text/html').body.textContent.trim();
    if(steps.length)slides.push({fen:positionFen(compiled.start),title:l.name,orientation:compiled.player,steps,explanation:explanation?[explanation]:[]});
  }catch{}if(slides.length===3)break;}
  for(const raw of exercises) {
    if(slides.length>=2)break;
    const edges=mainline(raw.compiled).filter(e=>e.move);
    if(edges.length)slides.push({fen:positionFen(raw.compiled.start),title:slides.length?'Зверни увагу на наступний хід':'Розглянь позицію',orientation:raw.compiled.player,steps:edges.slice(0,slides.length?2:1).map(e=>({move:e.move.from+e.move.to,say:slides.length?'Стеж за взаємодією фігур.':'Порівняй позицію до ходу та після нього.',wait:1100}))});
  }
  if(slides.length===1)slides.push({...slides[0],title:'Переглянь приклад ще раз'});
  return {icon:'♟',title:l.name,intro:sanitize(l.description),slides};
}
function showLesson(l) {
  const progress=store()[l.id],exercises=exerciseList(l),level=levelOf(l.level);
  ROOT.innerHTML=`<header class="ct-subhead">${back(l.level)}<span>УРОК · ${esc(level.name)}</span>${star(progress?.stars||0)}</header>
    <div class="ct-lesson-intro"><span class="ct-lesson-art">${art(l.group)}</span><small>${esc(l.group)}</small><h1>${esc(l.name)}</h1>
    <p>${exercises.length} ${exercises.length===1?'вправа':'вправ'} · пояснення та приклади</p>
    <a class="ct-primary" href="#chessity/play/${l.id}">${progress?.stars?'Пройти ще раз':'Почати урок'} <span>▶</span></a>
    <button type="button" class="ct-secondary" data-explain="${l.id}">Пояснення з анімацією</button></div>
    <article class="ct-reading"><h2>Про цей урок</h2>${sanitize(l.description)||'<p>Переглянь анімований приклад, а потім знайди правильні ходи самостійно.</p>'}${l.examples.filter(x=>x.text).map((x,i)=>`<section><h3>Приклад ${i+1}</h3>${sanitize(x.text)}</section>`).join('')}</article>`;
}
const movablePosition=p=>new Map(Object.entries(p.pieces));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function fitSession() { return; /* Native app keeps the board full-width. */
  if(!session||innerWidth>=960)return;
  const wrap=ROOT.querySelector('.ct-board-wrap'),last=ROOT.querySelector('[data-solution]'),nav=document.querySelector('.ap-tabs');
  if(!wrap||!last||!nav)return;
  const full=wrap.parentElement.clientWidth;
  wrap.style.width=full+'px';
  const nonBoard=last.getBoundingClientRect().bottom+scrollY-full;
  wrap.style.width=Math.min(full,Math.max(200,nav.getBoundingClientRect().top-nonBoard-10))+'px';
}
addEventListener('resize',()=>requestAnimationFrame(fitSession));
function drawSession() {
  const s=session;if(!s||!board)return;
  board.setPosition(movablePosition(s.position),{lastMove:s.lastMove});
  board.marks(new Map(Object.entries(s.position.marks).map(([k,v])=>[k,'ct-'+v])));
  board.setOrientation(s.current.compiled.player);
  board.setMovable(s.done||s.busy||s.current.compiled.question||s.current.compiled.placement||s.current.compiled.notation?null:s.position.turn,(s.current.compiled.coinGoal?coinDestinations:destinations)(s.position));
  ROOT.querySelector('#ct-status').textContent=s.done?'Чудово! Завдання виконано.':s.current.compiled.question?'Чи дозволений показаний стрілкою хід?':s.current.compiled.placement?'Постав показану фігуру на її початкове поле.':s.current.compiled.coinGoal?(Object.values(s.position.marks).includes('coin')?'Збери всі монети, а потім дістанься прапорця.':'Чудово! Тепер дістанься прапорця.'):s.current.compiled.notation?'Натисни на поле '+s.current.compiled.targetSquare.toUpperCase()+'.':s.current.compiled.minigame?'Переграй суперника: виграй фігуру або дістанься прапорця.':s.current.texts?.[0]||'Знайди найкращий хід.';
  ROOT.querySelector('#ct-round').innerHTML=s.lesson.format===29?`<b>${s.index+1} / ${s.exercises.length}</b>`:s.exercises.map((_,i)=>`<span class="${i===s.index?'active':''} ${s.roundStars[i]===3?'green':s.roundStars[i]>0?'yellow':s.roundStars[i]===0?'red':''}">${i+1}</span>`).join('');
  ROOT.querySelector('.ct-session-progress i').style.width=(s.index/s.exercises.length*100)+'%';
  const answer=ROOT.querySelector('#ct-answers');answer.innerHTML=s.current.compiled.question?'<button type="button" data-answer="yes">Так</button><button type="button" data-answer="no">Ні</button>':s.current.compiled.placement?`<div class="ct-place-piece">${piece({pawn:'P',rook:'R',knight:'N',bishop:'B',queen:'Q',king:'K'}[s.current.compiled.placement.piece.role],s.current.compiled.placement.piece.color==='white'?'w':'b')}<span>Торкнися потрібного поля на дошці</span></div>`:'';
  rememberSession();if(s.current.compiled.question)board.hint(s.current.compiled.question.from,s.current.compiled.question.to);
}
function feedback(text,kind='') {if(text&&ROOT.querySelector('#ct-status'))ROOT.querySelector('#ct-status').textContent=text;const node=ROOT.querySelector('#ct-feedback');if(node){node.textContent=text;node.className='ct-feedback '+kind;}}
async function autoReply() {
  const s=session;if(!s)return;const generationAtStart=generation,round=s.round;
  while(s.nodes.length && (s.nodes[0].move===null || s.position.turn!==s.current.compiled.player)) {
    const edge=s.nodes[0];s.busy=true;board?.setMovable(null);await delay(edge.move?650:40);if(generationAtStart!==generation||session!==s||round!==s.round)return;
    s.position=structuredClone(edge.next);s.lastMove=edge.move?[edge.move.from,edge.move.to]:s.lastMove;s.nodes=edge.children;board?.setPosition(movablePosition(s.position),{lastMove:s.lastMove});if(edge.move)playSound('move');
  }
  s.busy=false;if(!s.nodes.length)finishExercise();else drawSession();
}
function finishExercise() {
  const s=session;if(!s||s.done)return;s.done=true;s.busy=false;board?.setMovable(null);playSound('success');
  const stars=s.revealed?0:s.errors||s.hints?2:3;s.counted ||= [];if(stars>0&&!s.counted.includes(s.current.id)){s.counted.push(s.current.id);const history=LG.store.get('chessity:history',{}),day=new Date().toLocaleDateString('en-CA'),h=history[day]||{solved:0,stars:0};h.solved++;history[day]=h;LG.store.set('chessity:history',history);}s.roundStars[s.index]=Math.max(s.roundStars[s.index]||0,stars);
  feedback(stars?'Правильно! Чудова робота!':'Розв’язання переглянуто. Спробуй самостійно, щоб отримати зірки.',stars?'success':'');
  rememberSession();drawSession();const b=ROOT.querySelector('#ct-next');b.hidden=false;b.disabled=false;b.textContent=s.index===s.exercises.length-1?'Завершити урок':'Наступна вправа';
}
function wrong(text='Цей хід не розв’язує завдання. Спробуй ще!') {const s=session;if(!s)return;s.errors++;playSound('error');feedback(text,'error');board?.setPosition(movablePosition(s.position));drawSession();}
async function promotion(from,to) {
  return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='ct-promotion';dialog.innerHTML='<h2>Обери фігуру</h2><div>'+[['queen','Q'],['rook','R'],['bishop','B'],['knight','N']].map(([role,c])=>`<button type="button" data-promotion="${role}" aria-label="${{queen:'Ферзь',rook:'Тура',bishop:'Слон',knight:'Кінь'}[role]}">${piece(c,session.position.turn==='white'?'w':'b')}</button>`).join('')+'</div>';ROOT.append(dialog);dialog.showModal();dialog.addEventListener('click',e=>{const b=e.target.closest('[data-promotion]');if(b){resolve(b.dataset.promotion);dialog.close();}});dialog.addEventListener('cancel',()=>resolve(null));dialog.addEventListener('close',()=>{resolve(null);dialog.remove();},{once:true});});
}
async function onMove(from,to) {
  const s=session;if(!s||s.done||s.busy)return;
  let promoted;if(s.position.pieces[from]?.role==='pawn'&&/[18]$/.test(to)){s.busy=true;promoted=await promotion(from,to);if(session!==s)return;s.busy=false;if(!promoted){drawSession();return;}}
  if(s.current.compiled.minigame){const original=s.current.compiled.start;if(!destinations(s.position).get(from)?.includes(to))return wrong();s.position=movePosition(s.position,{from,to,promotion:promoted});s.lastMove=[from,to];playSound('move');drawSession();let winner=miniWinner(s.position,original);if(!winner){s.busy=true;board.setMovable(null);const g=generation;await delay(350);if(g!==generation||session!==s)return;const reply=miniBestMove(s.position,original);if(reply){s.position=movePosition(s.position,reply);s.lastMove=[reply.from,reply.to];}s.busy=false;winner=miniWinner(s.position,original);drawSession();}if(winner===s.current.compiled.player)return finishExercise();if(winner){const errors=s.errors+1;loadRound();s.errors=errors;feedback('Спробуй ще раз. Стеж за безпекою своїх фігур.','error');rememberSession();}return;}
  if(s.current.compiled.coinGoal) {
    if(!coinDestinations(s.position).get(from)?.includes(to))return wrong('Обери дозволений хід на безпечне поле.');
    const flag=Object.keys(s.current.compiled.start.marks).find(k=>s.current.compiled.start.marks[k]==='flag');
    const next=movePosition(s.position,{from,to,promotion:promoted});next.turn=s.current.compiled.player;
    if(to===flag&&Object.values(next.marks).includes('coin'))return wrong('Спершу збери всі монети!');
    s.position=next;s.lastMove=[from,to];playSound('move');board.setPosition(movablePosition(next),{lastMove:s.lastMove});
    if(to===flag&&!Object.values(next.marks).includes('coin'))finishExercise();else drawSession();return;
  }
  const edge=s.nodes.find(e=>e.move?.from===from&&e.move.to===to&&(!e.move.promotion||e.move.promotion===promoted));
  if(!edge)return wrong();
  s.position=structuredClone(edge.next);s.lastMove=[from,to];s.nodes=edge.children;board.setPosition(movablePosition(s.position),{lastMove:s.lastMove});playSound('move');board.clearHint();feedback('Правильно!');
  if(!s.nodes.length)finishExercise();else await autoReply();
}
function loadRound() {
  const s=session;ROOT.querySelector('#ct-next').hidden=true;s.round=(s.round||0)+1;s.current=s.exercises[s.index];s.position=structuredClone(s.current.compiled.question?.position||s.current.compiled.start);s.nodes=s.current.compiled.tree;s.errors=0;s.hints=0;s.done=false;s.busy=false;s.revealed=false;s.lastMove=null;board.clearHint();
  ROOT.querySelector('#ct-next').disabled=true;ROOT.querySelector('#ct-next').textContent='Наступна вправа';feedback('');drawSession();requestAnimationFrame(fitSession);
}
export function scoreStars(green,total){return !green?0:green>=Math.ceil(total*.8)?3:green>=Math.ceil(total*.4)?2:1;}
function rememberSession(){const s=session;if(!s||s.finished)return;LG.store.set('chessity:session',{lesson:s.lesson.id,ids:s.exercises.map(x=>x.id),index:s.index,roundStars:s.roundStars,counted:s.counted||[],snapshot:{position:s.position,nodes:s.nodes,errors:s.errors,hints:s.hints,done:s.done,revealed:s.revealed,lastMove:s.lastMove}});}
addEventListener('pagehide',rememberSession);
function summary(){
 const s=session,green=s.roundStars.filter(x=>x===3).length,stars=s.lesson.format===29?Math.min(3,Math.floor(green/(s.lesson.record?.puzperstar||3))):scoreStars(green,s.exercises.length),progress=store(),old=progress[s.lesson.id]||{},best=Math.max(old.stars||0,stars);
 progress[s.lesson.id]={stars:best,completedAt:new Date().toISOString()};save(progress);s.finished=true;LG.store.set('chessity:session',null);
 const history=LG.store.get('chessity:history',{}),day=new Date().toLocaleDateString('en-CA'),h=history[day]||{solved:0,stars:0};h.stars+=best-(old.stars||0);history[day]=h;LG.store.set('chessity:history',history);
 const level=levelOf(s.lesson.level),next=level.lessons[level.lessons.indexOf(s.lesson.id)+1];board?.destroy();board=null;ROOT.classList.remove('ct-game');
 ROOT.innerHTML=header('Урок завершено','#chessity/level/'+level.id)+`<div class="ct-result"><h1>Урок пройдено!</h1><p>${esc(s.lesson.name)}</p>${star(stars)}<p>${green} / ${s.exercises.length} зелених відповідей</p>${next?`<a class="ct-primary" href="#chessity/lesson/${next}">Наступний урок</a>`:''}<a class="ct-secondary" href="#chessity/play/${s.lesson.id}">Пройти ще раз</a><a class="ct-secondary" href="#chessity/level/${level.id}">До всіх уроків</a><a class="ct-secondary" href="#chessity/profile">Мій прогрес</a></div>`;
}
function selectedExercises(l){const pool=exerciseList(l),saved=LG.store.get('chessity:session',null);if(saved?.lesson===l.id&&saved.ids.every(id=>pool.some(x=>x.id===id)))return saved.ids.map(id=>pool.find(x=>x.id===id));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,l.format===29?Math.min(l.record?.maxpuz||pool.length,pool.length):Math.min(5,pool.length));}

function startLesson(l){
 const exercises=selectedExercises(l);if(l.format===33){const seed=exercises.reduce((a,x)=>a+x.id,0);exercises.forEach((x,i)=>x.compiled.targetSquare='abcdefgh'[(seed+i*13)%8]+(Math.floor(((seed+i*13)%64)/8)+1));}if(l.id===1231){const types=['pawn','knight','bishop','rook','queen'];let seed=exercises.reduce((n,x)=>n+x.id,0);for(let i=types.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[types[i],types[j]]=[types[j],types[i]];}exercises.forEach((x,i)=>{x.compiled=startingPositionExercise(types[i],types.slice(0,i));});}if(!exercises.length)throw new Error('Урок не містить доступних вправ.');ROOT.classList.add('ct-game');
 ROOT.innerHTML=`<div class="ct-coach-zone"><div class="ct-rounds" id="ct-round"></div><div class="ct-coach"><img src="chessity/assets/original/coach.svg" alt="Тренер"><p class="ct-goal" id="ct-status" aria-live="polite"></p></div></div><div class="ct-session-progress" hidden><i></i></div><div class="ct-session"><div class="ct-board-wrap"><div id="ct-board"></div></div><div id="ct-answers"></div><p id="ct-feedback" class="ct-feedback" aria-live="polite"></p><button class="ct-primary" id="ct-next" hidden disabled>Наступна вправа</button><details class="ct-more"><summary>Допомога</summary><div class="ct-tools"><button data-hint>Підказка</button><button data-retry>Ще раз</button><button data-solution>Показати розв’язання</button></div></details></div><footer class="ct-game-footer"><a href="#chessity/lesson/${l.id}">${icon('back')}Назад</a><button data-explain="${l.id}">${icon('book')}Пояснення</button></footer>`;
 const saved=LG.store.get('chessity:session',null);session={lesson:l,exercises,index:saved?.lesson===l.id?saved.index:0,roundStars:saved?.lesson===l.id?saved.roundStars:[],counted:saved?.lesson===l.id?saved.counted||[]:[]};board=createBoard(ROOT.querySelector('#ct-board'),{onMove,onSelect:key=>{const s=session;if(!s||s.done)return;if(s.current.compiled.notation){if(key===s.current.compiled.targetSquare)finishExercise();else wrong('Перевір літеру вертикалі та номер горизонталі.');return;}if(!s.current.compiled.placement)return;const pl=s.current.compiled.placement,targets=pl.targets||[pl.to];if(!targets.includes(key)||s.position.pieces[key]?.role===pl.piece.role)return wrong('Пошукай початкове поле цієї фігури.');s.position.pieces[key]=pl.piece;board.setPosition(movablePosition(s.position));if(targets.every(k=>s.position.pieces[k]?.role===pl.piece.role))finishExercise();else{rememberSession();feedback('Правильно! Постав решту таких фігур.');}}});board.cg.set({coordinates:false});loadRound();
 if(saved?.lesson===l.id&&saved.snapshot){Object.assign(session,saved.snapshot);drawSession();if(session.done){ROOT.querySelector('#ct-next').hidden=false;ROOT.querySelector('#ct-next').disabled=false;}}
}

ROOT.addEventListener('click',async event=> {
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-offline')){const status=ROOT.querySelector('#ct-offline-status');try{status.textContent='Зберігаємо уроки…';const registration=await navigator.serviceWorker.ready;registration.active.postMessage({type:'CACHE_CHESSITY'});}catch{status.textContent='Для завантаження відкрий сайт через HTTPS з інтернетом.';}return;}
  if(b.hasAttribute('data-levels'))return picker();
  if(b.dataset.level){ROOT.querySelector('dialog')?.close();location.hash='chessity/level/'+b.dataset.level;return;}
  if(b.dataset.explain){const l=await lesson(+b.dataset.explain);openGuide(guideConfig(l,exerciseList(l)));const guide=document.querySelector('.gd');guide?.classList.add('ct-guide');if(session&&!session.done){const hint=document.createElement('button');hint.type='button';hint.className='ct-guide-hint';hint.textContent='Підказка до завдання';hint.onclick=()=>{closeGuide();ROOT.querySelector('[data-hint]').click();};guide?.querySelector('.gd-go').before(hint);}return;}
  const s=session;if(!s)return;
  if(b.hasAttribute('data-retry'))return loadRound();
  if(b.hasAttribute('data-answer')&&!s.done&&!s.busy)return (b.dataset.answer==='yes')===s.current.compiled.question.legal?finishExercise():wrong('Перевір, чи не залишається король під шахом і чи дотримано умов цього ходу.');
  if(b.id==='ct-next'&&s.done){if(s.index+1===s.exercises.length)return summary();s.index++;return loadRound();}
  if(b.hasAttribute('data-hint')&&!s.done&&!s.busy) {
    s.hints++;const edge=s.nodes.find(e=>e.move),placement=s.current.compiled.placement,q=s.current.compiled.question;
    if(placement){board.shapes([{orig:placement.to,brush:'hint'}]);return;}
    if(q){feedback('Після ходу король має залишатися в безпеці. Перевір також умови рокіровки чи взяття на проході.');return;}
    if(edge){board.shapes([{orig:edge.move.from,...(s.hints>1?{dest:edge.move.to}:{}),brush:'hint'}]);}
    else if(s.current.compiled.coinGoal) {const from=Object.keys(s.position.pieces).find(k=>s.position.pieces[k].color===s.position.turn);board.shapes([{orig:from,brush:'hint'}]);feedback('Спершу забери монети, потім дістанься прапорця.');}
  }
  if(b.hasAttribute('data-solution')&&!s.busy&&!s.done) {
    const edges=mainline(s.current.compiled);if(!edges.length){feedback('Проведи фігуру до всіх монет, потім до прапорця. Можна обрати різні маршрути.');return;}
    s.busy=true;s.revealed=true;board.setMovable(null);const g=generation,round=s.round;
    for(const edge of edges){await delay(650);if(g!==generation||session!==s||round!==s.round)return;s.position=structuredClone(edge.next);board.setPosition(movablePosition(s.position),{lastMove:edge.move?[edge.move.from,edge.move.to]:undefined});}
    finishExercise();
  }
});
export async function render(route='') {
  dispose();ROOT.classList.remove('ct-game');const g=generation;ROOT.innerHTML='<div class="ct-loading" role="status">Завантажуємо уроки…</div>';
  try {await load();if(g!==generation)return;const [page,id]=route.split('/');
    if((page==='lesson'||page==='play')&&/^\d+$/.test(id)){const l=await lesson(+id);if(g!==generation)return;activeLevel=l.level;ROOT.style.setProperty('--ct-accent',COLORS[catalog.levels.findIndex(x=>x.id===l.level)%6]);page==='play'?startLesson(l):showLesson(l);}
    else if(page==='group')renderGroup(id);else if(page==='profile')renderProfile();else renderLevel(page==='level'?+id:activeLevel);
  }catch(e){if(g===generation)ROOT.innerHTML=`<div class="ct-loading"><h2>Не вдалося відкрити урок</h2><p>${esc(e.message)}</p><a href="#chessity">До уроків</a></div>`;}
}

let audioContext;const audioBuffers=new Map();
async function playSound(name){if(LG.muted||LG.volume<=0)return;try{const files={move:'move',success:'correctNew',error:'bad',tap:'softClick',illegal:'bad'};const file=files[name]||'softClick';audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state!=='running')await audioContext.resume();if(!audioBuffers.has(file))audioBuffers.set(file,fetch(new URL('assets/original/sounds/'+file+'.mp3',URL_ROOT)).then(r=>{if(!r.ok)throw Error('sound');return r.arrayBuffer();}).then(b=>audioContext.decodeAudioData(b)).catch(e=>{audioBuffers.delete(file);throw e;}));const buffer=await audioBuffers.get(file),source=audioContext.createBufferSource(),gain=audioContext.createGain();source.buffer=buffer;gain.gain.value=LG.volume;source.connect(gain);gain.connect(audioContext.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();}catch{LG.play(name);}}
addEventListener('pointerdown',()=>{if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});},{passive:true});
addEventListener('visibilitychange',()=>{if(!document.hidden&&audioContext?.state==='suspended')audioContext.resume().catch(()=>{});});

if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type!=='CHESSITY_CACHE_PROGRESS')return;const{done,total,failed}=e.data,status=ROOT.querySelector('#ct-offline-status');const message=done===total?(failed?'Не всі файли збережено. Натисни ще раз, щоб повторити.':'Усі уроки збережено. Можна вимкнути інтернет.'):`Збережено ${done} / ${total}`;LG.store.set('chessity:offline',done===total&&failed===0);if(status)status.textContent=message;});
