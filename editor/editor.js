/* Своя позиція: дитина розставляє будь-які фігури (королі — за бажанням) і грає проти робота.
   Є обидва королі → звичайні шахи з цієї позиції (chess/, мета — мат).
   Королів немає (або лише один) → «Побий усіх» (pieces-vs-pawns/free.html, мета — збити всі фігури суперника).
   Тап по фігурі в палітрі, потім по клітинках — ставить її; 🧽 — прибирає; фігури на дошці можна перетягувати,
   а перетягнута за дошку — зникає. */
import { Chessground } from 'https://cdn.jsdelivr.net/npm/@lichess-org/chessground@10.2.0/dist/chessground.min.js';
import { Chess, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { applyBoardLook } from '../shared/board.js?v=1790410199';

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
  el.innerHTML = 'KQRBNP'.split('').map(r => `<button type="button" data-c="${c}" data-r="${r}" aria-label="${ROLE[r]}"><img src="${pieceImg(c, r)}" alt=""></button>`).join('') +
    (c === 'w' ? '<button type="button" class="ed-er" data-er="1" aria-label="Гумка">🧽</button>' : '');
}
palette($('pal-b'), 'b'); palette($('pal-w'), 'w');
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

$('go').addEventListener('click', () => {
  const board = cg.getFen(), n = count(), full = board + ' w - - 0 1';
  const bad = msg => { LG.play('error'); LG.toast(msg); };
  if (!n.white.all || !n.black.all) return bad('Постав фігури і білим, і чорним.');
  if (/^[^/]*[pP]|[pP][^/]*$/.test(board)) return bad('Пішак не може стояти на першому чи останньому ряду.');
  if (mateMode(n)) {
    const pos = Chess.fromSetup(FEN.parseFen(full).unwrap());
    if (pos.isErr) {
      const e = String(pos.error && pos.error.message || '');
      return bad(e.includes('OPPOSITE_CHECK') ? 'Чорному королю вже шах, а ходять білі — так не можна.'
        : e.includes('IMPOSSIBLE_CHECK') ? 'Такого шаху не буває — переставте фігури.'
        : 'Така позиція неможлива — переставте фігури.');
    }
    const p = pos.unwrap();
    if (p.isEnd()) return bad('У цій позиції гра вже закінчена — переставте фігури.');
    return LG.go('../chess/index.html?level=2&side=' + side + '&fen=' + encodeURIComponent(full));
  }
  LG.go('../pieces-vs-pawns/free.html?side=' + side + '&fen=' + encodeURIComponent(full));
});
