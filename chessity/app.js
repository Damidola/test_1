import { createBoard } from '../shared/board.js?v=1792245651';
import { openGuide, closeGuide } from '../shared/guide.js?v=1792245651';
import { compileExercise, questionExercise, mainline, destinations, coinDestinations, movePosition, positionFen, progressSummary } from './model.js?v=1792245651';

const ROOT=document.getElementById('view-chessity'), LG=window.LG;
const URL_ROOT=new URL('./',import.meta.url), VERSION=new URL(import.meta.url).search;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS=['#f4bc57','#8f9feb','#f083b4','#64c8bf','#b18bea','#ef8b73'];
const piece=(role,color='w')=>`<img src="shared/pieces/${LG.pieceSet()}/${color}${role}.svg" alt="">`;
const star=(n,max=3)=>`<span class="ct-stars" aria-label="Зірки: ${n} із ${max}">${Array.from({length:max},(_,i)=>`<span class="${i<n?'earned':''}">★</span>`).join('')}</span>`;
const store=()=>LG.store.get('chessity:v1',{})||{};
const save=p=>LG.store.set('chessity:v1',p);
let catalog, board, session, generation=0, activeLevel=+LG.store.get('chessity:level',40), loadPromise;
const lessonCache=new Map();
async function json(file) { const response=await fetch(new URL('data/'+file+VERSION,URL_ROOT));if(!response.ok)throw new Error('Не вдалося завантажити урок. Спробуй ще раз.');return response.json(); }
const load=()=>loadPromise||(loadPromise=json('catalog.json').then(x=>catalog=x).catch(e=>{loadPromise=null;throw e;}));
async function lesson(id) { if(!lessonCache.has(id))lessonCache.set(id,json(id+'.json').catch(e=>{lessonCache.delete(id);throw e;}));return lessonCache.get(id); }
const levelOf=id=>catalog.levels.find(l=>l.id===id)||catalog.levels[0];
const back=id=>`<a class="ct-back" href="#chessity/level/${id}" aria-label="Назад до уроків">‹</a>`;
function dispose() { generation++;closeGuide();board?.destroy();board=null;session=null;ROOT.querySelector('dialog')?.close(); }
export function deactivate() { dispose(); }
function art(group) {
  const name=/мат/i.test(group)?'mate':/взят|пішак/i.test(group)?'capture':/захист/i.test(group)?'defend':/почат|позиці/i.test(group)?'position':/перетвор/i.test(group)?'promotion':/напад/i.test(group)?'attack':/фігур/i.test(group)?'piece':'tactics';
  return `<img src="chessity/assets/${name}.png" alt="" loading="lazy">`;
}
function renderLevel(id) {
  const level=levelOf(id), progress=store(), list=level.lessons.map(id=>catalog.lessons.find(l=>l.id===id)), stat=progressSummary(progress,list), i=catalog.levels.indexOf(level);
  activeLevel=level.id;LG.store.set('chessity:level',level.id);ROOT.style.setProperty('--ct-accent',COLORS[i%6]);
  const groups=[];for(const item of list) {let g=groups.find(g=>g.name===item.group);if(!g){g={name:item.group,items:[]};groups.push(g);}g.items.push(item);}
  ROOT.innerHTML=`<header class="ct-head"><div><span class="ct-eyebrow">CHESSITY · LEARN</span><h1>Навчайся грати</h1></div><div class="ct-total" title="Здобуті зірки">★ ${progressSummary(progress,catalog.lessons).stars}</div></header>
    <div class="ct-levelbar"><button type="button" data-level="${catalog.levels[Math.max(0,i-1)].id}" aria-label="Попередній рівень" ${i===0?'disabled':''}>‹</button>
    <button class="ct-levelpick" type="button" data-levels><span class="ct-levelpiece">${piece(level.piece)}</span><span><small>РІВЕНЬ ${i+1} ІЗ ${catalog.levels.length}</small><b>${esc(level.name)} <span>⌄</span></b></span></button>
    <button type="button" data-level="${catalog.levels[Math.min(catalog.levels.length-1,i+1)].id}" aria-label="Наступний рівень" ${i===catalog.levels.length-1?'disabled':''}>›</button></div>
    <p class="ct-leveldesc">${esc(level.description)}</p>
    <div class="ct-progress"><span><b>${stat.done}</b> / ${stat.total} уроків</span><span>★ ${stat.stars} / ${stat.total*3}</span><div role="progressbar" aria-label="Пройдені уроки" aria-valuenow="${stat.done}" aria-valuemin="0" aria-valuemax="${stat.total}"><i style="width:${stat.total?stat.done/stat.total*100:0}%"></i></div></div>
    <div class="ct-groups">${groups.map(g=>`<section class="ct-group"><h2><span>${art(g.name)}</span>${esc(g.name)}</h2><div class="ct-grid">${g.items.map(l=>`<a class="ct-card ${progress[l.id]?.stars?'complete':''}" href="#chessity/lesson/${l.id}"><span class="ct-card-art">${art(l.group)}</span><b>${esc(l.name)}</b>${star(progress[l.id]?.stars||0)}</a>`).join('')}</div></section>`).join('')}</div>`;
}
function picker() {
  const dialog=document.createElement('dialog');dialog.className='ct-picker';dialog.innerHTML=`<header><h2>Обери рівень</h2><button type="button" data-close aria-label="Закрити">✕</button></header><div>${catalog.levels.map((l,i)=>`<button type="button" data-level="${l.id}" class="${l.id===activeLevel?'selected':''}" style="--ct-accent:${COLORS[i%6]}">${piece(l.piece)}<b>${esc(l.name)}</b><small>${l.lessons.length} уроків</small></button>`).join('')}</div>`;ROOT.append(dialog);dialog.showModal();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-close]'))dialog.close();});
}
function sanitize(html) {
  const doc=new DOMParser().parseFromString(html||'','text/html'), allowed=new Set(['P','BR','STRONG','EM','B','I','H2','H3','H4','UL','OL','LI','SPAN','IMG','TABLE','TBODY','TR','TD','BLOCKQUOTE','A']);
  for(const el of [...doc.body.querySelectorAll('*')]) {
    if(['SCRIPT','STYLE','IFRAME','OBJECT','FORM','INPUT'].includes(el.tagName)){el.remove();continue;}
    if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);continue;}
    const src=el.getAttribute('src'),href=el.getAttribute('href');for(const a of [...el.attributes])el.removeAttribute(a.name);
    if(el.tagName==='IMG'&&src) {const url=src.startsWith('chessity/assets/')?new URL(src,location.href):new URL(src,'https://www.chessity.com/');if(url.protocol!=='https:'&&url.origin!==location.origin){el.remove();continue;}el.src=url.href;el.alt='Ілюстрація до уроку';el.loading='lazy';}
    if(el.tagName==='A'&&href) {try{const url=new URL(href,'https://www.chessity.com/');if(url.protocol==='https:'){el.href=url.href;el.target='_blank';el.rel='noopener noreferrer';}}catch{}}
  }
  return doc.body.innerHTML;
}
function exerciseList(l) {
  const result=[];const seen=new Set();
  for(const raw of [...l.puzzles,...l.examples]) {
    if(seen.has(raw.fen+'|'+raw.pgn))continue;seen.add(raw.fen+'|'+raw.pgn);
    try { const compiled=raw.format===30?questionExercise(raw.fen,raw.pgn):compileExercise(raw.fen,raw.pgn,{opening:raw.format===40});result.push({...raw,compiled}); } catch { /* Source annotations that do not describe a playable exercise stay in the explanation. */ }
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
function fitSession() {
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
  board.setMovable(s.done||s.busy||s.current.compiled.question||s.current.compiled.placement?null:s.position.turn,(s.current.compiled.coinGoal?coinDestinations:destinations)(s.position));
  ROOT.querySelector('#ct-status').textContent=s.current.compiled.question?'Чи дозволений показаний стрілкою хід?':s.current.compiled.placement?'Постав показану фігуру на її початкове поле.':s.current.compiled.coinGoal?'Збери всі монети, а потім дістанься прапорця.':s.current.texts?.[0]||'Знайди найкращий хід.';
  ROOT.querySelector('#ct-round').textContent=`${s.index+1} / ${s.exercises.length}`;
  ROOT.querySelector('.ct-session-progress i').style.width=(s.index/s.exercises.length*100)+'%';
  const answer=ROOT.querySelector('#ct-answers');answer.innerHTML=s.current.compiled.question?'<button type="button" data-answer="yes">Так</button><button type="button" data-answer="no">Ні</button>':s.current.compiled.placement?`<div class="ct-place-piece">${piece({pawn:'P',rook:'R',knight:'N',bishop:'B',queen:'Q',king:'K'}[s.current.compiled.placement.piece.role],s.current.compiled.placement.piece.color==='white'?'w':'b')}<span>Торкнися потрібного поля на дошці</span></div>`:'';
  if(s.current.compiled.question)board.hint(s.current.compiled.question.from,s.current.compiled.question.to);
}
function feedback(text,kind='') {const node=ROOT.querySelector('#ct-feedback');if(node){node.textContent=text;node.className='ct-feedback '+kind;}}
async function autoReply() {
  const s=session;if(!s)return;const generationAtStart=generation,round=s.round;
  while(s.nodes.length && (s.nodes[0].move===null || s.position.turn!==s.current.compiled.player)) {
    const edge=s.nodes[0];s.busy=true;board?.setMovable(null);await delay(edge.move?650:40);if(generationAtStart!==generation||session!==s||round!==s.round)return;
    s.position=structuredClone(edge.next);s.lastMove=edge.move?[edge.move.from,edge.move.to]:s.lastMove;s.nodes=edge.children;board?.setPosition(movablePosition(s.position),{lastMove:s.lastMove});if(edge.move)LG.play('move');
  }
  s.busy=false;if(!s.nodes.length)finishExercise();else drawSession();
}
function finishExercise() {
  const s=session;if(!s||s.done)return;s.done=true;s.busy=false;board?.setMovable(null);LG.play('success');
  const stars=s.revealed?0:s.errors?2:s.hints?2:3;s.roundStars[s.index]=Math.max(s.roundStars[s.index]||0,stars);
  feedback(stars?'Правильно! Чудова робота!':'Розв’язання переглянуто. Спробуй самостійно, щоб отримати зірки.',stars?'success':'');
  const b=ROOT.querySelector('#ct-next');b.disabled=false;b.textContent=s.index===s.exercises.length-1?'Завершити урок':'Наступна вправа';
}
function wrong(text='Цей хід не розв’язує завдання. Спробуй ще!') {const s=session;if(!s)return;s.errors++;LG.play('error');feedback(text,'error');board?.setPosition(movablePosition(s.position));drawSession();}
async function promotion(from,to) {
  return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='ct-promotion';dialog.innerHTML='<h2>Обери фігуру</h2><div>'+[['queen','Q'],['rook','R'],['bishop','B'],['knight','N']].map(([role,c])=>`<button type="button" data-promotion="${role}" aria-label="${{queen:'Ферзь',rook:'Тура',bishop:'Слон',knight:'Кінь'}[role]}">${piece(c,session.position.turn==='white'?'w':'b')}</button>`).join('')+'</div>';ROOT.append(dialog);dialog.showModal();dialog.addEventListener('click',e=>{const b=e.target.closest('[data-promotion]');if(b){resolve(b.dataset.promotion);dialog.close();}});dialog.addEventListener('cancel',()=>resolve(null));dialog.addEventListener('close',()=>{resolve(null);dialog.remove();},{once:true});});
}
async function onMove(from,to) {
  const s=session;if(!s||s.done||s.busy)return;
  let promoted;if(s.position.pieces[from]?.role==='pawn'&&/[18]$/.test(to)){s.busy=true;promoted=await promotion(from,to);if(session!==s)return;s.busy=false;if(!promoted){drawSession();return;}}
  if(s.current.compiled.coinGoal) {
    if(!coinDestinations(s.position).get(from)?.includes(to))return wrong('Обери дозволений хід на безпечне поле.');
    const flag=Object.keys(s.current.compiled.start.marks).find(k=>s.current.compiled.start.marks[k]==='flag');
    const next=movePosition(s.position,{from,to,promotion:promoted});next.turn=s.current.compiled.player;
    if(to===flag&&Object.values(next.marks).includes('coin'))return wrong('Спершу збери всі монети!');
    s.position=next;s.lastMove=[from,to];LG.play('move');board.setPosition(movablePosition(next),{lastMove:s.lastMove});
    if(to===flag&&!Object.values(next.marks).includes('coin'))finishExercise();else drawSession();return;
  }
  const edge=s.nodes.find(e=>e.move?.from===from&&e.move.to===to&&(!e.move.promotion||e.move.promotion===promoted));
  if(!edge)return wrong();
  s.position=structuredClone(edge.next);s.lastMove=[from,to];s.nodes=edge.children;board.setPosition(movablePosition(s.position),{lastMove:s.lastMove});LG.play('move');board.clearHint();feedback('Правильно!');
  if(!s.nodes.length)finishExercise();else await autoReply();
}
function loadRound() {
  const s=session;s.round=(s.round||0)+1;s.current=s.exercises[s.index];s.position=structuredClone(s.current.compiled.question?.position||s.current.compiled.start);s.nodes=s.current.compiled.tree;s.errors=0;s.hints=0;s.done=false;s.busy=false;s.revealed=false;s.lastMove=null;board.clearHint();
  ROOT.querySelector('#ct-next').disabled=true;ROOT.querySelector('#ct-next').textContent='Наступна вправа';feedback('');drawSession();requestAnimationFrame(fitSession);
}
function summary() {
  const s=session,stars=s.roundStars.length===s.exercises.length&&s.roundStars.every(x=>x>0)?Math.min(...s.roundStars):0,progress=store();
  if(stars) {const old=progress[s.lesson.id]||{};progress[s.lesson.id]={stars:Math.max(old.stars||0,stars),completedAt:new Date().toISOString()};save(progress);}
  const level=levelOf(s.lesson.level),next=level.lessons[level.lessons.indexOf(s.lesson.id)+1];board?.destroy();board=null;
  ROOT.innerHTML=`<div class="ct-result"><span class="ct-result-icon">${stars?'🏆':'📖'}</span><h1>${stars?'Урок пройдено!':'Практику завершено'}</h1><p>${esc(s.lesson.name)}</p>${star(stars)}<p>${stars?'Твій результат збережено на цьому пристрої.':'Спробуй ще раз без перегляду розв’язання — тоді отримаєш зірки.'}</p>${next?`<a class="ct-primary" href="#chessity/lesson/${next}">Наступний урок →</a>`:''}<a class="ct-secondary" href="#chessity/play/${s.lesson.id}">Пройти ще раз</a><a class="ct-secondary" href="#chessity/level/${level.id}">До всіх уроків</a></div>`;
}
function startLesson(l) {
  const exercises=exerciseList(l);if(!exercises.length)throw new Error('Урок не містить доступних вправ.');
  ROOT.innerHTML=`<header class="ct-subhead"><a class="ct-back" href="#chessity/lesson/${l.id}" aria-label="Назад до пояснення">‹</a><h1>${esc(l.name)}</h1><span id="ct-round"></span></header><div class="ct-session-progress"><i></i></div>
    <div class="ct-session"><p class="ct-goal" id="ct-status" aria-live="polite"></p><div class="ct-board-wrap"><div id="ct-board"></div></div><div id="ct-answers"></div><p id="ct-feedback" class="ct-feedback" aria-live="polite"></p>
    <div class="ct-tools"><button type="button" data-hint>💡 Підказка</button><button type="button" data-explain="${l.id}">📖 Пояснення</button><button type="button" data-retry>↺ Ще раз</button></div><button type="button" class="ct-primary" id="ct-next" disabled>Наступна вправа</button><button type="button" class="ct-solution" data-solution>Показати розв’язання</button></div>`;
  session={lesson:l,exercises,index:0,roundStars:[]};board=createBoard(ROOT.querySelector('#ct-board'),{onMove,onSelect:key=>{const s=session;if(!s||s.done||!s.current.compiled.placement)return;if(key!==s.current.compiled.placement.to)return wrong('Пошукай початкове поле цієї фігури.');s.position.pieces[key]=s.current.compiled.placement.piece;board.setPosition(movablePosition(s.position));finishExercise();}});loadRound();
  openGuide({...guideConfig(l,exercises),button:'Почати ▶',onClose:()=>requestAnimationFrame(fitSession)});
}
ROOT.addEventListener('click',async event=> {
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-levels'))return picker();
  if(b.dataset.level){ROOT.querySelector('dialog')?.close();location.hash='chessity/level/'+b.dataset.level;return;}
  if(b.dataset.explain){const l=await lesson(+b.dataset.explain);openGuide(guideConfig(l,exerciseList(l)));return;}
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
  dispose();const g=generation;ROOT.innerHTML='<div class="ct-loading" role="status">Завантажуємо уроки…</div>';
  try {await load();if(g!==generation)return;const [page,id]=route.split('/');
    if((page==='lesson'||page==='play')&&/^\d+$/.test(id)){const l=await lesson(+id);if(g!==generation)return;activeLevel=l.level;ROOT.style.setProperty('--ct-accent',COLORS[catalog.levels.findIndex(x=>x.id===l.level)%6]);page==='play'?startLesson(l):showLesson(l);}
    else renderLevel(page==='level'?+id:activeLevel);
  }catch(e){if(g===generation)ROOT.innerHTML=`<div class="ct-loading"><h2>Не вдалося відкрити урок</h2><p>${esc(e.message)}</p><a href="#chessity">До уроків</a></div>`;}
}
