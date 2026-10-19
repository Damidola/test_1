import { Chess, parseFen, makeFen, parseSan, parsePgn, parseSquare, makeSquare } from './engine.js?v=1792399935';

const ROLES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const LETTERS = Object.fromEntries(Object.entries(ROLES).map(([k,v]) => [v,k]));
export const opposite = c => c === 'white' ? 'black' : 'white';
export function readPosition(fen) {
  const fields = fen.trim().split(/\s+/), pieces = {}, marks = {};
  if (/^\d+$/.test(fields[3] || '')) fields.splice(3,0,'-');
  fields[0].split('/').forEach((row,r) => { let f=0; for (const ch of row) {
    if (/\d/.test(ch)) { f+=+ch; continue; }
    const key='abcdefgh'[f++]+(8-r), role=ROLES[ch.toLowerCase()];
    if (role) pieces[key]={ role, color: ch===ch.toUpperCase() ? 'white' : 'black' };
    else if (ch==='F') marks[key]='flag'; else if (ch==='c') marks[key]='coin';
  }});
  return { pieces, marks, turn: fields[1]==='b' ? 'black' : 'white', castles: fields[2] || '-', ep: fields[3] || '-', half: +fields[4] || 0, full: +fields[5] || 1 };
}
export function positionFen(p) {
  const rows=[];
  for(let r=8;r>0;r--) { let text='',empty=0; for(const f of 'abcdefgh') {
    const pc=p.pieces[f+r]; if(!pc) { empty++; continue; }
    if(empty) { text+=empty; empty=0; }
    const ch=LETTERS[pc.role]; text+=pc.color==='white' ? ch.toUpperCase() : ch;
  } rows.push(text+(empty||'')); }
  return `${rows.join('/')} ${p.turn==='white'?'w':'b'} ${p.castles} ${p.ep} ${p.half} ${p.full}`;
}
function legalPosition(p) {
  if (!Object.values(p.pieces).some(x=>x.role==='king'&&x.color==='white') || !Object.values(p.pieces).some(x=>x.role==='king'&&x.color==='black')) return null;
  try { const x=Chess.fromSetup(parseFen(positionFen(p)).unwrap()); return x.isOk ? x.unwrap() : null; } catch { return null; }
}
export function movePosition(position, move) {
  const p=structuredClone(position);
  if(!move) { p.turn=opposite(p.turn); p.ep='-'; return p; }
  const chess=legalPosition(p), pc=p.pieces[move.from];
  if(!pc) throw new Error('Missing piece: '+move.from);
  const promotion=move.promotion || (pc.role==='pawn' && /[18]$/.test(move.to) ? 'queen' : undefined);
  if(chess) {
    let m={from:parseSquare(move.from),to:parseSquare(move.to),...(promotion ? {promotion}: {})};
    if(pc.role==='king' && Math.abs(m.to%8-m.from%8)===2) m.to=(m.to>m.from?7:0)+8*Math.floor(m.from/8);
    if(chess.isLegal(m)) {
      chess.play(m); const q=readPosition(makeFen(chess.toSetup()));q.marks=p.marks;delete q.marks[move.to];return q;
    }
  }
  if(pc.role==='pawn' && move.from[0]!==move.to[0] && !p.pieces[move.to] && p.ep===move.to) delete p.pieces[move.to[0]+move.from[1]];
  delete p.pieces[move.from];p.pieces[move.to]={...pc,...(promotion?{role:promotion}:{})};
  if(p.marks[move.to]==='coin') delete p.marks[move.to];
  p.ep=pc.role==='pawn'&&Math.abs(+move.to[1]- +move.from[1])===2 ? move.from[0]+((+move.from[1]+ +move.to[1])/2) : '-';
  p.turn=opposite(p.turn);return p;
}
function pseudoDests(p,from,pc) {
  const [f,r]=[from.charCodeAt(0)-97,+from[1]-1], out=[],add=(x,y)=> {
    if(x<0||x>7||y<0||y>7)return false;
    const k='abcdefgh'[x]+(y+1), other=p.pieces[k];
    if(other?.color!==pc.color) out.push(k);
    return !other;
  };
  if(pc.role==='knight') { for(const [x,y] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]) add(f+x,r+y); }
  else if(pc.role==='king') { for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)if(x||y)add(f+x,r+y); }
  else if(pc.role==='pawn') {
    const dir=pc.color==='white'?1:-1,k='abcdefgh'[f]+(r+dir+1);
    if(r+dir>=0&&r+dir<=7&&!p.pieces[k]) { add(f,r+dir); if(r===(pc.color==='white'?1:6)&&!p.pieces['abcdefgh'[f]+(r+dir*2+1)])add(f,r+dir*2); }
    for(const x of [f-1,f+1]) {const key='abcdefgh'[x]+(r+dir+1);if(p.pieces[key]?.color===opposite(pc.color)||p.ep===key)add(x,r+dir);}
  } else {
    const dirs=[...(pc.role!=='bishop'?[[1,0],[-1,0],[0,1],[0,-1]]:[]),...(pc.role!=='rook'?[[1,1],[-1,1],[1,-1],[-1,-1]]:[])];
    for(const [x,y] of dirs)for(let n=1;n<8;n++)if(!add(f+x*n,r+y*n))break;
  }
  return out;
}
export function destinations(p) {
  const chess=legalPosition(p), result=new Map();
  if(chess) { for(const [s,ds] of chess.allDests()) {
    const from=makeSquare(s),tos=[...ds].map(makeSquare);
    if(p.pieces[from]?.role==='king') for(const to of [...tos])if(p.pieces[to]?.color===p.turn&&p.pieces[to]?.role==='rook')tos.push((to[0]>from[0]?'g':'c')+from[1]);
    result.set(from,tos);
  } return result; }
  for(const [s,pc] of Object.entries(p.pieces))if(pc.color===p.turn)result.set(s,pseudoDests(p,s,pc));
  return result;
}
export function isAttacked(p,square,by) {
  return Object.entries(p.pieces).some(([from,pc])=>{
    if(pc.color!==by)return false;
    if(pc.role==='pawn')return Math.abs(from.charCodeAt(0)-square.charCodeAt(0))===1 && +square[1]- +from[1]===(by==='white'?1:-1);
    return pseudoDests({...p,pieces:{...p.pieces,[square]:{role:'king',color:opposite(by)}}},from,pc).includes(square);
  });
}
export function coinDestinations(p) {
  return new Map([...destinations(p)].map(([from,tos])=>[from,tos.filter(to=>!isAttacked(movePosition(p,{from,to}),to,opposite(p.turn)))]));
}
function sanMove(p,san) {
  if(['--','Z0','0000'].includes(san))return null;
  const chess=legalPosition(p);
  if(chess) {const m=parseSan(chess,san);if(m&&'from'in m) {
    let to=makeSquare(m.to),from=makeSquare(m.from);
    if(p.pieces[from]?.role==='king'&&p.pieces[to]?.color===p.turn&&p.pieces[to]?.role==='rook')to=(to[0]>from[0]?'g':'c')+from[1];
    return {from,to,...(m.promotion?{promotion:m.promotion}:{})};
  }}
  const m=/^([KQRBN])?([a-h])?([1-8])?x?([a-h][1-8])(?:=?([QRBN]))?[+#?!]*$/.exec(san);
  if(!m)throw new Error('Unsupported move: '+san);
  const role=ROLES[(m[1]||'P').toLowerCase()], ds=destinations(p);
  const from=Object.keys(p.pieces).find(s=>p.pieces[s].color===p.turn&&p.pieces[s].role===role&&(!m[2]||s[0]===m[2])&&(!m[3]||s[1]===m[3])&&ds.get(s)?.includes(m[4]));
  if(!from)throw new Error('Unplayable move: '+san);
  return {from,to:m[4],...(m[5]?{promotion:ROLES[m[5].toLowerCase()]}:{})};
}
export function compileExercise(fen,pgn,{opening=false,starting=false,minigame=false,notation=false}={}) {
  if(minigame||notation){const start=readPosition(fen);return {start,tree:[],player:start.turn,minigame,notation};}
  if(starting){const all=['pawn','knight','bishop','rook','queen'];const original=readPosition(fen),missing=all.filter(role=>!Object.values(original.pieces).some(p=>p.color==='white'&&p.role===role));const role=missing[0]||'pawn';return startingPositionExercise(role);}
  const start=readPosition(fen), game=parsePgn(pgn)[0];
  if (Object.values(start.marks).includes('flag') && !game?.moves.children.length) return {start,tree:[],player:start.turn,coinGoal:true};
  if (!game?.moves.children.length) {
    const initial=readPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const missing=Object.keys(initial.pieces).filter(s=>!start.pieces[s]);
    if(missing.length===1 && Object.entries(start.pieces).every(([s,p])=>initial.pieces[s]?.role===p.role&&initial.pieces[s]?.color===p.color)) {
      const to=missing[0];return {start,tree:[],player:initial.pieces[to].color,placement:{to,piece:initial.pieces[to]}};
    }
    throw new Error('No moves');
  }
  function compile(children,p,depth=0) {
    if(depth>80)return [];
    return children.filter(n=>!n.data.nags?.some(x=>[2,4,6].includes(x))&&(!opening||!(n.data.comments||[]).some(x=>/\bp=1\d\d\b/.test(x)))).flatMap(n=> {
      try { const move=sanMove(p,n.data.san),next=movePosition(p,move);
        return [{move,san:n.data.san,next,children:compile(n.children,next,depth+1)}];
      } catch { return []; }
    });
  }
  const tree=compile(game.moves.children,start);
  if(!tree.length){if(Object.values(start.marks).includes('flag'))return {start,tree:[],player:start.turn,coinGoal:true};throw new Error('No playable solution');}
  return { start, tree, player:start.turn, coinGoal:Object.values(start.marks).includes('flag') };
}
export function questionExercise(fen,pgn) {
  const exercise=compileExercise(fen,pgn),edges=mainline(exercise);
  const uci=pgn.match(/\{\s*([a-h][1-8][a-h][1-8][qrbn]?)[?!]*\s*\}/)?.[1];
  if(!uci)throw new Error('Missing question move');
  const from=uci.slice(0,2),to=uci.slice(2,4),position=edges.at(-1).next;
  return {...exercise,player:position.turn,question:{position,from,to,legal:!!destinations(position).get(from)?.includes(to)}};
}
export function mainline(exercise) {
  const edges=[];let list=exercise.tree;
  for(let n=0;n<80&&list.length;n++) {const e=list[0];edges.push(e);list=e.children;}
  return edges;
}
export function progressSummary(progress,lessons) {
  const stars=lessons.reduce((n,l)=>n+Math.min(3,Math.max(0,+progress[l.id]?.stars||0)),0);
  return {stars,done:lessons.filter(l=>progress[l.id]?.stars>0).length,total:lessons.length};
}

export function startingPositionExercise(role,previous=[]){
 const initial=readPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),start=readPosition('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
 for(const [square,piece]of Object.entries(initial.pieces))if(piece.color==='white'&&previous.includes(piece.role))start.pieces[square]=piece;
 const targets=Object.keys(initial.pieces).filter(k=>initial.pieces[k].color==='white'&&initial.pieces[k].role===role);
 return {start,tree:[],player:'white',placement:{to:targets[0],targets,piece:{color:'white',role}}};
}

// The native MiniChess lessons use positions without kings. Their finish line
// belongs to the knight/pawns; the queen/bishop wins by capturing them.
export function miniWinner(p,start){
 const goal=Object.values(start.pieces).find(x=>x.role==='knight'||x.role==='pawn')?.color;
 const count=color=>Object.values(p.pieces).filter(x=>x.color===color).length;
 if(!count('white'))return 'black';if(!count('black'))return 'white';
 if(goal&&Object.keys(start.marks).some(k=>start.marks[k]==='flag'&&p.pieces[k]?.color===goal))return goal;
 return null;
}
export function miniBestMove(position,start,depth=3){
 const root=position.turn,value={pawn:100,knight:320,bishop:330,rook:500,queen:900,king:10000};
 const choices=p=>[...destinations(p)].flatMap(([from,tos])=>tos.map(to=>({from,to})));
 function evaluate(p,d){const winner=miniWinner(p,start);if(winner)return winner===root?100000+d:-100000-d;let score=0;for(const[square,pc]of Object.entries(p.pieces)){let v=value[pc.role];if(pc.role==='pawn')v+=(pc.color==='white'?+square[1]-2:7-+square[1])*25;const flags=Object.keys(start.marks);if(pc.role==='knight'&&flags.length)v+=(8-Math.min(...flags.map(f=>Math.max(Math.abs(f.charCodeAt(0)-square.charCodeAt(0)),Math.abs(+f[1]-+square[1])))))*15;score+=(pc.color===root?1:-1)*v;}return score;}
 function search(p,d,alpha,beta){if(!d||miniWinner(p,start))return evaluate(p,d);const list=choices(p);if(!list.length)return evaluate(p,d);const maximizing=p.turn===root;let best=maximizing?-Infinity:Infinity;for(const m of list){const n=search(movePosition(p,m),d-1,alpha,beta);best=maximizing?Math.max(best,n):Math.min(best,n);if(maximizing)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);if(beta<=alpha)break;}return best;}
 let chosen=null,best=-Infinity;for(const m of choices(position)){const score=search(movePosition(position,m),depth-1,-Infinity,Infinity);if(score>best){best=score;chosen=m;}}return chosen;
}
