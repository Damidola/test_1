/* Своя позиція: дитина розставляє будь-які фігури (королі — за бажанням) і грає проти робота.
   Є обидва королі → звичайні шахи з цієї позиції (chess/, мета — мат).
   Королів немає (або лише один) → «Побий усіх» (pieces-vs-pawns/free.html, мета — збити всі фігури суперника).
   Тап по фігурі в палітрі, потім по клітинках — ставить її; 🧽 — прибирає; фігури на дошці можна перетягувати,
   а перетягнута за дошку — зникає. */
import { Chessground } from 'https://cdn.jsdelivr.net/npm/@lichess-org/chessground@10.2.0/dist/chessground.min.js';
import { Chess, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { applyBoardLook } from '../shared/board.js?v=1790430973';

const LG = window.LG, $ = id => document.getElementById(id);
const PRESETS = {
  clear: '8/8/8/8/8/8/8/8',
  start: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
  kp: '4k3/pppppppp/8/8/8/8/PPPPPPPP/4K3',
  nok: 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR'
};
const ROLE = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
const pieceImg = (c, r) => `../shared/pieces/${LG.store.get('pieceSet', 'cburnett') || 'cburnett'}/${c}${r}.svg`;

applyBoardLook();
let brush = null; // { color, role } або 'erase'
const cg = Chessground($('board'), {
  fen: LG.store.get('editor:fen', PRESETS.kp),
  coordinates: true,
  animation: { enabled: true, duration: 120 },
  movable: { free: true, color: 'both', showDests: false },
  premovable: { enabled: false },
  draggable: { enabled: true, showGhost: true, distance: 5, deleteOnDropOff: true },
  highlight: { lastMove: false, check: false },
  drawable: { enabled: false },
  events: {
    select: key => {
      if (!brush) return;
      const cur = cg.state.pieces.get(key), put = brush === 'erase' ? undefined : { ...brush };
      // та сама фігура вдруге — прибрати
      const same = cur && put && cur.role === put.role && cur.color === put.color;
      cg.setPieces(new Map([[key, same ? undefined : put]]));
      cg.selectSquare(null);
      LG.play(put && !same ? 'move' : 'tap');
      changed();
    },
    change: () => changed()
  }
});

// палітра: чорні над дошкою, білі під нею; 🧽 — гумка
function palette(el, c) {
  el.innerHTML = 'KQRBNP'.split('').map(r => `<button type="button" data-c="${c}" data-r="${r}" aria-label="${ROLE[r]}"><img src="${pieceImg(c, r)}" alt="" draggable="false"></button>`).join('') +
    (c === 'w' ? '<button type="button" class="ed-er" data-er="1" aria-label="Гумка">🧽</button>' : '');
}
palette($('pal-b'), 'b'); palette($('pal-w'), 'w');
// браузер не має тягнути саму картинку (інакше він «забирає» дотик і фігура не перетягується)
document.querySelectorAll('.ed-pal').forEach(p => p.addEventListener('dragstart', e => e.preventDefault()));
// як на Lichess: фігуру з палітри можна одразу перетягнути на дошку
// (тягнути — лише коли палець зрушив, щоб простий тап і далі вибирав фігуру-«пензлик»)
let press = null, ghost = null;
const endDrag = () => { if (ghost) { ghost.el.remove(); ghost = null; } press = null; };
document.querySelectorAll('.ed-pal').forEach(p => p.addEventListener('pointerdown', e => {
  const b = e.target.closest('button[data-r]'); if (!b || e.button > 0) return;
  press = { b, x: e.clientX, y: e.clientY };
}));
addEventListener('pointermove', e => {
  if (ghost) { ghost.el.style.transform = `translate(${e.clientX - ghost.s / 2}px, ${e.clientY - ghost.s / 2}px)`; return; }
  if (!press || Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8) return;
  const s = document.querySelector('cg-board').getBoundingClientRect().width / 8, el = document.createElement('img');
  el.src = press.b.querySelector('img').src; el.alt = '';
  el.style.cssText = `position:fixed;left:0;top:0;width:${s}px;height:${s}px;pointer-events:none;z-index:50;transform:translate(${e.clientX - s / 2}px,${e.clientY - s / 2}px) scale(1.15)`;
  document.body.appendChild(el);
  ghost = { el, s, piece: { color: press.b.dataset.c === 'w' ? 'white' : 'black', role: ROLE[press.b.dataset.r] } };
});
addEventListener('pointerup', e => {
  if (ghost) {
    const key = cg.getKeyAtDomPos([e.clientX, e.clientY]);
    if (key) { cg.setPieces(new Map([[key, ghost.piece]])); LG.play('move'); changed(); }
    ghost.el.remove(); ghost = null; press = null;
    // тап після перетягування не має вмикати «пензлик»
    const eat = ev => { ev.stopPropagation(); ev.preventDefault(); };
    addEventListener('click', eat, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', eat, { capture: true }), 300);
    return;
  }
  press = null;
});
addEventListener('pointercancel', endDrag);
document.querySelectorAll('.ed-pal').forEach(p => p.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const next = b.dataset.er ? 'erase' : { color: b.dataset.c === 'w' ? 'white' : 'black', role: ROLE[b.dataset.r] };
  const was = document.querySelector('.ed-pal button.on');
  document.querySelectorAll('.ed-pal button').forEach(x => x.classList.remove('on'));
  brush = was === b ? null : next;
  if (brush) b.classList.add('on');
  LG.play('tap');
}));

$('presets').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  cg.set({ fen: PRESETS[b.dataset.p] }); LG.play('tap'); changed();
});
let turn = LG.store.get('editor:turn', 'w');
const paintTurn = () => { $('turn').textContent = turn === 'w' ? 'Першими ходять білі ⇄' : 'Першими ходять чорні ⇄'; };
$('turn').addEventListener('click', () => { turn = turn === 'w' ? 'b' : 'w'; LG.store.set('editor:turn', turn); LG.play('tap'); paintTurn(); });
paintTurn();
$('flip').addEventListener('click', () => { cg.toggleOrientation(); LG.play('tap'); });
let side = LG.store.get('editor:side', 'w');
const paintSide = () => document.querySelectorAll('#side button').forEach(b => b.classList.toggle('on', b.dataset.s === side));
$('side').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; side = b.dataset.s; LG.store.set('editor:side', side); LG.play('tap'); paintSide(); });
paintSide();

const count = () => {
  const n = { white: { all: 0, king: 0 }, black: { all: 0, king: 0 } };
  for (const [, p] of cg.state.pieces) { n[p.color].all++; if (p.role === 'king') n[p.color].king++; }
  return n;
};
const mateMode = n => n.white.king === 1 && n.black.king === 1;
function changed() {
  const board = cg.getFen();
  LG.store.set('editor:fen', board);
  const n = count();
  $('goal').textContent = !n.white.all || !n.black.all ? 'Постав фігури і білим, і чорним.'
    : mateMode(n) ? '👑 Є обидва королі — мета: поставити мат.'
    : '⚔️ Без пари королів — мета: побити всі фігури суперника.';
}
changed();

// перевірка позиції; повертає { full, mate } або null (і показує, що не так)
function check() {
  const board = cg.getFen(), n = count(), full = board + ' ' + turn + ' - - 0 1';
  const bad = msg => { LG.play('error'); LG.toast(msg); return null; };
  if (!n.white.all || !n.black.all) return bad('Постав фігури і білим, і чорним.');
  if (/^[^/]*[pP]|[pP][^/]*$/.test(board)) return bad('Пішак не може стояти на першому чи останньому ряду.');
  if (!mateMode(n)) return { full, mate: false };
  const pos = Chess.fromSetup(FEN.parseFen(full).unwrap());
  if (pos.isErr) {
    const e = String(pos.error && pos.error.message || '');
    const other = turn === 'w' ? 'Чорному' : 'Білому', mover = turn === 'w' ? 'білі' : 'чорні';
    return bad(e.includes('OPPOSITE_CHECK') ? `${other} королю вже шах, а ходять ${mover} — так не можна.`
      : e.includes('IMPOSSIBLE_CHECK') ? 'Такого шаху не буває — переставте фігури.'
      : 'Така позиція неможлива — переставте фігури.');
  }
  if (pos.unwrap().isEnd()) return bad('У цій позиції гра вже закінчена — переставте фігури.');
  return { full, mate: true };
}
$('go').addEventListener('click', () => {
  const c = check(); if (!c) return;
  LG.go((c.mate ? '../chess/index.html?level=2&side=' : '../pieces-vs-pawns/free.html?side=') + side + '&fen=' + encodeURIComponent(c.full));
});
$('an').addEventListener('click', () => {
  const c = check(); if (!c) return;
  if (!c.mate) { LG.play('error'); return LG.toast('Аналіз робота — лише для позицій з обома королями.'); }
  LG.go('../games/index.html?fen=' + encodeURIComponent(c.full));
});

// дошка — такого розміру, щоб усі кнопки вмістились на екрані без прокрутки
function fit() {
  const wrap = document.querySelector('.ed .lg-board-wrap'), main = document.querySelector('main.ed');
  const max = Math.min(520, innerWidth - 16);
  wrap.style.width = max + 'px';
  const kids = [...main.children].filter(c => c.offsetParent), gap = parseFloat(getComputedStyle(main).rowGap) || 0;
  // скільки місця справді видно: від верху сторінки (під шапкою Telegram) до низу екрана
  const room = innerHeight - (parseFloat(getComputedStyle(document.body).borderTopWidth) || 0) - 26;
  const over = kids.reduce((h, c) => h + c.offsetHeight, 0) + gap * (kids.length - 1) - room;
  if (over > 0) wrap.style.width = Math.max(200, max - over - 4) + 'px';
  cg.redrawAll();
}
addEventListener('resize', fit); fit(); setTimeout(fit, 300);
