import chess,json,random,collections
from pathlib import Path
rng=random.Random(202610101)
ROLES={chess.ROOK:('Тура',5),chess.QUEEN:('Ферзь',5),chess.BISHOP:('Слон',3),chess.KNIGHT:('Кінь',3),chess.PAWN:('Пішак',2),'promotion':('Перетворення',2)}
selected=[];seen=set()
def signature(b,m):
 # Exclude copies under board symmetries, colour reversal and translation.
 variants=[]
 for swap in [False,True]:
  for a in range(8):
   def t(sq):
    x,y=chess.square_file(sq),chess.square_rank(sq)
    if a>=4:x=7-x
    for _ in range(a%4):x,y=7-y,x
    return x,y
   pcs=[(*t(sq),p.piece_type,p.color^swap) for sq,p in b.piece_map().items()]
   mnx=min(v[0] for v in pcs);mny=min(v[1] for v in pcs)
   variants.append(tuple(sorted((x-mnx,y-mny,r,c) for x,y,r,c in pcs)))
 return min(variants)
for role,(name,total) in ROLES.items():
 found=0;attempts=0;patterns=collections.Counter()
 while found<total and attempts<250000:
  attempts+=1;b=chess.Board(None);b.turn=chess.WHITE
  bk=rng.choice([chess.square(x,y) for x in range(8) for y in range(8) if x in [0,7] or y in [0,7]])
  b.set_piece_at(bk,chess.Piece(chess.KING,chess.BLACK))
  near=[s for s in chess.SQUARES if chess.square_distance(s,bk) in [2,3]]
  wk=rng.choice(near);b.set_piece_at(wk,chess.Piece(chess.KING,chess.WHITE))
  attacker=chess.PAWN if role=='promotion' else role
  pawn_rank=6 if role=='promotion' else rng.choice([3,4,5])
  sq=rng.choice([s for s in chess.SQUARES if s not in b.piece_map() and (attacker!=chess.PAWN or chess.square_rank(s)==pawn_rank)])
  b.set_piece_at(sq,chess.Piece(attacker,chess.WHITE))
  extras=[]
  if role in [chess.ROOK,chess.QUEEN]:
   if found>=2:extras=[(rng.choice([chess.PAWN,chess.BISHOP,chess.KNIGHT]),rng.choice([chess.WHITE,chess.BLACK]))]
   if found>=4:extras.append((chess.PAWN,chess.BLACK))
  elif role==chess.BISHOP:extras=[(rng.choice([chess.ROOK,chess.QUEEN,chess.KNIGHT]),chess.WHITE),(chess.PAWN,chess.BLACK)]
  elif role==chess.KNIGHT:
   extras=[(chess.ROOK,chess.WHITE)]
   if found>=2:extras.append((rng.choice([chess.PAWN,chess.ROOK]),chess.BLACK))
  else:extras=[(rng.choice([chess.ROOK,chess.BISHOP,chess.QUEEN]),chess.WHITE)]
  for r,c in extras:
   opts=[s for s in chess.SQUARES if s not in b.piece_map() and (r!=chess.PAWN or 0<chess.square_rank(s)<7)]
   if role==chess.KNIGHT and c==chess.BLACK and rng.random()<.5:
    targets=[s for s in opts if s in b.attacks(sq)]
    if targets:opts=targets
   b.set_piece_at(rng.choice(opts),chess.Piece(r,c))
  if not b.is_valid() or b.is_check():continue
  mates=[]
  for m in list(b.legal_moves):
   b.push(m)
   if b.is_checkmate():mates.append(m)
   b.pop()
  if len(mates)!=1:continue
  m=mates[0]
  if b.piece_at(m.from_square).piece_type!=attacker or bool(m.promotion)!=(role=='promotion'):continue
  b.push(m);direct=b.king(chess.BLACK) in b.attacks(m.to_square);b.pop()
  if not direct and (role!=chess.KNIGHT or found<2):continue
  # Distinct move shapes, avoid repeating the same mating move geometry.
  dx=abs(chess.square_file(m.to_square)-chess.square_file(m.from_square));dy=abs(chess.square_rank(m.to_square)-chess.square_rank(m.from_square))
  pattern=(min(dx,dy),max(dx,dy),b.is_capture(m))
  if patterns[pattern]>=2:continue
  # Extra pieces must affect the mating net or the uniqueness of the answer.
  relevant=True
  for extra,pc in list(b.piece_map().items()):
   if pc.piece_type==chess.KING or extra==m.from_square:continue
   smaller=b.copy();smaller.remove_piece_at(extra)
   if not smaller.is_valid() or smaller.is_check() or m not in smaller.legal_moves:continue
   smaller.push(m);still_mate=smaller.is_checkmate();smaller.pop()
   if not still_mate:continue
   alternatives=0
   for alternative in list(smaller.legal_moves):
    smaller.push(alternative)
    if smaller.is_checkmate():alternatives+=1
    smaller.pop()
   if alternatives==1:relevant=False;break
  if not relevant:continue
  sig=signature(b,m)
  if sig in seen:continue
  seen.add(sig);patterns[pattern]+=1
  # Half of the examples use black; this is a real side-to-move change, not an extra duplicate.
  if (len(selected)%3)==2:
   old=m;b=b.mirror();m=chess.Move(chess.square_mirror(old.from_square),chess.square_mirror(old.to_square),promotion=old.promotion)
  san=b.san(m);position=b.fen();count=len(b.piece_map())
  selected.append({'id':f'mate1-generated-{len(selected)+1:02}', 'source':'generator','fen':position,'moves':[m.uci()],'san':[san],'pieces':count,'category':'mateIn1','title':'Мат в 1 хід','matingRole':name})
  found+=1;print(name,found,'attempt',attempts,count,position,san,flush=True)
 if found<total:raise RuntimeError((role,found,attempts))
json.dump({'version':2,'sources':{'generator':{'name':'Генератор матів у 1 хід','description':'Легальні компактні позиції. Перебрано всі легальні ходи: рівно один ставить мат. Відкинуто дзеркальні та зсунуті копії.'}},'puzzles':selected},open(Path(__file__).resolve().parents[1] / 'puzzle-lab/puzzles.json','w'),ensure_ascii=False,indent=2)
