import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileExercise, questionExercise, mainline, readPosition, positionFen, movePosition, destinations, coinDestinations, progressSummary } from '../../chessity/model.js';

const data = name => JSON.parse(readFileSync(new URL('../../chessity/data/'+name+'.json',import.meta.url)));
const catalog=data('catalog');
test('Chessity: усі 18 рівнів і 690 уроки мають доступні вправи',()=>{
  assert.equal(catalog.levels.length,18);assert.equal(catalog.lessons.length,690);
  assert.equal(new Set(catalog.levels.flatMap(l=>l.lessons)).size,690);
  for(const summary of catalog.lessons){
    const lesson=data(summary.id);assert.equal(lesson.id,summary.id);
    assert.ok(catalog.levels.find(l=>l.id===lesson.level)?.lessons.includes(lesson.id));
    assert.ok(lesson.puzzles.length,summary.name);
    for(const puzzle of lesson.puzzles){
      const compiled=puzzle.format===30?questionExercise(puzzle.fen,puzzle.pgn):compileExercise(puzzle.fen,puzzle.pgn,{opening:puzzle.format===40,starting:lesson.id===1231,minigame:puzzle.format===31,notation:puzzle.format===33});
      assert.ok(compiled.question||compiled.placement||compiled.coinGoal||compiled.minigame||compiled.notation||compiled.tree.length,`${lesson.id}/${puzzle.id}`);
    }
    const serialized=JSON.stringify(lesson);
    assert.doesNotMatch(serialized,/sessionID|access_token|password|userID|setID/);
  }
});
test('Chessity: помилкові варіанти не зараховуються як розв’язання',()=>{
  const fen='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const ex=compileExercise(fen,'1. e4 (1. d4? d5) (1. c4 {p=102}) e5',{opening:true});
  assert.deepEqual(ex.tree.map(e=>e.move),[{from:'e2',to:'e4'}]);
});
test('Chessity: монети не стають фігурами; шлях проходить безпечними полями',()=>{
  const p=readPosition('8/8/8/8/5R2/2r5/8/1c1F4 w - 0 1 $YY');
  assert.deepEqual(p.marks,{b1:'coin',d1:'flag'});
  assert.ok(destinations(p).get('f4').includes('f3'));
  assert.ok(!coinDestinations(p).get('f4').includes('f3'));
  assert.ok(coinDestinations(p).get('f4').includes('b4'));
  let q=movePosition(p,{from:'f4',to:'b4'});q.turn='white';q=movePosition(q,{from:'b4',to:'b1'});
  assert.equal(q.marks.b1,undefined);assert.equal(q.marks.d1,'flag');
  q.turn='white';q=movePosition(q,{from:'b1',to:'d1'});assert.equal(q.marks.d1,undefined,'Captured flag is removed like a captured coin');
  assert.doesNotMatch(positionFen(q),/[Fc]/);
});
test('Chessity: рокіровка, взяття на проході, перетворення та початкове поле',()=>{
  let e=compileExercise('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1','1. O-O');
  assert.equal(mainline(e)[0].next.pieces.f1.role,'rook');
  e=compileExercise('7k/8/8/3pP3/8/8/8/7K w - d6 0 1','1. exd6');
  assert.equal(mainline(e)[0].next.pieces.d5,undefined);
  e=compileExercise('7k/P7/8/8/8/8/8/7K w - - 0 1','1. a8=N');
  assert.equal(mainline(e)[0].next.pieces.a8.role,'knight');
  e=compileExercise('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1','*');
  assert.equal(e.placement.to,'b1');
});
test('Chessity: підсумки рахують лише місцеві завершені уроки та обмежують зірки',()=>{
  assert.deepEqual(progressSummary({1:{stars:3},2:{stars:0},3:{stars:99}},[{id:1},{id:2},{id:3}]),{stars:6,done:2,total:3});
});

test('Chessity MiniChess: фініш і виграш фігур визначають переможця',async()=>{
 const{miniWinner,miniBestMove,startingPositionExercise}=await import('../../chessity/model.js');
 const start=readPosition('FFFFFFFF/3q4/8/8/8/8/8/4N3 w - 0 1 $NY');
 assert.equal(miniWinner(start,start),null);const finish=structuredClone(start);delete finish.pieces.e1;finish.pieces.f8={role:'knight',color:'white'};assert.equal(miniWinner(finish,start),'white');
 const capture=readPosition('8/8/8/8/8/8/3n4/3Q4 w - - 0 1');assert.deepEqual(miniBestMove(capture,capture),{from:'d1',to:'d2'});
 const placement=startingPositionExercise('knight',['pawn']);assert.deepEqual(placement.placement.targets,['b1','g1']);assert.equal(Object.values(placement.start.pieces).filter(x=>x.role==='pawn').length,8);
});

test('Chessity: native journey images reference existing original APK artwork',()=>{
 const images=data('journey-images');assert.equal(Object.keys(images).length,129);
 assert.equal(images[1099],'images/lessonImages/rookMovement.png');
 for(const image of Object.values(images))assert.ok(readFileSync(new URL('../../chessity/assets/original/'+image,import.meta.url)).length);
});
