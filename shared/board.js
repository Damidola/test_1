/* Спільна дошка 8×8 для всіх ігор — дошка Lichess (chessground).
   Гра дає позицію (Map клітинка → {role, color}) і можливі ходи; дошка сама
   малює, анімує, перетягує, показує крапки ходів, останній хід і стрілку підказки. */
import { Chessground } from 'https://cdn.jsdelivr.net/npm/@lichess-org/chessground@10.2.0/dist/chessground.min.js';

const ROOT = new URL('..', import.meta.url).href; // корінь сайту
const CHESS_ROLES = { pawn: 'P', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q', king: 'K' };

// Дошки Lichess (lila/public/images/board, AGPLv3+) і кольори координат до них (lila _boards.scss)
export const BOARD_THEMES = [
  ['brown', 'png', '#f0d9b5', '#946f51'], ['wood', 'jpg', '#d8a45b', '#9b4d0f'], ['maple', 'jpg', '#e8ceab', '#bc7944'],
  ['blue', 'png', '#dee3e6', '#788a94'], ['blue2', 'jpg', '#97b2c7', '#546f82'], ['green', 'png', '#ffd', '#6d8753'],
  ['green-plastic', 'png', '#f2f9bb', '#59935d'], ['purple', 'png', '#9f90b0', '#7d4a8d'], ['pink-pyramid', 'png', '#e8e9b7', '#ed7272'],
  ['ic', 'png', '#ececec', '#c1c18e'], ['marble', 'jpg', '#93ab91', '#4f644e'], ['grey', 'jpg', '#b8b8b8', '#7d7d7d']
].map(([id, ext, white, black]) => ({ id, file: `${id}.${ext}`, white, black }));
export const boardUrl = f => ROOT + 'shared/boards/' + f;

// Дошка й набір фігур застосовуються до всієї сторінки через CSS-змінні
let styleEl = null;
export function applyBoardLook() {
  const LG = window.LG;
  const theme = BOARD_THEMES.find(t => t.id === (LG && LG.boardTheme && LG.boardTheme())) || BOARD_THEMES[0];
  const set = (LG && LG.pieceSet && LG.pieceSet()) || 'cburnett';
  const root = document.documentElement.style;
  root.setProperty('--cg-board', `url("${boardUrl(theme.file)}")`);
  root.setProperty('--cg-coord-white', theme.white);
  root.setProperty('--cg-coord-black', theme.black);
  let css = '';
  for (const [role, letter] of Object.entries(CHESS_ROLES)) for (const [color, c] of [['white', 'w'], ['black', 'b']])
    css += `piece.${role}.${color},mpiece.${role}.${color}{background-image:url("${ROOT}shared/pieces/${set}/${c}${letter}.svg")}\n`;
  if (!styleEl) { styleEl = document.createElement('style'); document.head.appendChild(styleEl); }
  styleEl.textContent = css;
}

/* Дотики як у застосунку Lichess (для будь-якої дошки chessground):
   — фігура збільшується лише тоді, коли її справді тягнуть, а не від дотику;
   — легкий тап із ковзанням пальця не перетягує фігуру на сусідню клітинку;
   — тап по клітинці, куди може піти лише одна фігура (напр. ворожа фігура під боєм), одразу робить цей хід;
   — коли наша фігура на дошці одна, тап по будь-якій клітинці, куди вона може піти, одразу робить хід. */
export function lichessTouch(cg) {
  const wrap = cg.state.dom.elements.wrap;
  fitBoard(wrap.closest('.lg-board-wrap, .learn__main'));
  // Зелені крапки ходів можна повністю вимкнути в Профілі — тоді жодна гра чи урок їх не вмикає
  const dotsOff = () => { try { return localStorage.getItem('chk:showDests') === 'false'; } catch (e) { return false; } };
  const set = cg.set;
  cg.set = c => set(c && c.movable && 'showDests' in c.movable && dotsOff() ? { ...c, movable: { ...c.movable, showDests: false } } : c);
  if (dotsOff()) set({ movable: { showDests: false } });
  // Тягнути фігуру — лише коли палець справді пройшов ~0,4 клітинки: легкий тап із ковзанням пальця
  // не перетягує пішака на сусідню клітинку
  const dragDist = () => { const w = wrap.getBoundingClientRect().width; if (w) cg.set({ draggable: { distance: Math.max(10, Math.round(w / 8 * 0.4)) } }); };
  dragDist(); requestAnimationFrame(dragDist);
  window.addEventListener('resize', dragDist);
  let start = null, wasSelected, dragOrig = null;
  // Дошка могла зсунутися (змінилась розкладка сторінки) — перед кожним дотиком chessground заново міряє її положення,
  // інакше тап потрапляє не в ту клітинку
  const remeasure = () => { cg.state.dom.bounds.clear(); };
  for (const ev of ['pointerdown', 'touchstart', 'mousedown']) wrap.addEventListener(ev, remeasure, { capture: true, passive: true });
  // змінився розмір дошки (сторінка перебудувалась) — перемальовуємо: інакше крапки ходів малюються не там
  let lastW = 0;
  if (window.ResizeObserver) new ResizeObserver(() => {
    const w = Math.round(wrap.getBoundingClientRect().width);
    if (w && w !== lastW) { lastW = w; remeasure(); dragDist(); cg.redrawAll(); }
  }).observe(wrap);
  window.addEventListener('scroll', remeasure, { passive: true });
  wrap.addEventListener('pointerdown', e => { start = [e.clientX, e.clientY]; wasSelected = cg.state.selected; dragOrig = null; }, { capture: true, passive: true });
  wrap.addEventListener('pointermove', e => {
    if (start && !wrap.classList.contains('lg-lifted') && cg.state.draggable.current && Math.hypot(e.clientX - start[0], e.clientY - start[1]) >= 5)
      wrap.classList.add('lg-lifted');
    if (wrap.classList.contains('lg-lifted') && cg.state.draggable.current) dragOrig = cg.state.draggable.current.orig;
  }, { passive: true });
  const up = e => {
    const tap = start && e.type === 'pointerup' && Math.hypot(e.clientX - start[0], e.clientY - start[1]) < 5;
    const pos = start && [e.clientX, e.clientY];
    start = null;
    // Перетягнув фігуру туди, куди вона ходити не може, — тихий звук «не можна» (як на chess.com)
    const orig = dragOrig; dragOrig = null;
    if (orig && e.type === 'pointerup') {
      const key = cg.getKeyAtDomPos([e.clientX, e.clientY]), color = cg.state.movable.color, ds = cg.state.movable.dests && cg.state.movable.dests.get(orig);
      if (key && key !== orig && color && cg.state.turnColor === color && cg.state.pieces.get(orig)?.color === color && !(ds && ds.includes(key)) && window.LG) window.LG.play('illegal'); // хід наперед (не наш хід) — не «помилка»
    }
    wrap.classList.remove('lg-lifted');
    if (!tap || wasSelected) return;
    setTimeout(() => { // після того, як chessground обробив тап
      if (cg.state.selected) return; // тапнули свою фігуру — звичайний вибір
      const key = cg.getKeyAtDomPos(pos), color = cg.state.movable.color, dests = cg.state.movable.dests;
      if (!key || !color || !dests) return;
      // взяття: тап по ворожій фігурі, яку може побити тільки одна наша фігура;
      // якщо наша фігура на дошці лише одна — тап по будь-якій клітинці, куди вона може піти, одразу робить хід
      const target = cg.state.pieces.get(key);
      if (target && target.color === color) return;
      if (!target && [...cg.state.pieces.values()].filter(p => p.color === color).length !== 1) return;
      const from = [...dests].filter(([o, ds]) => ds.includes(key) && cg.state.pieces.get(o)?.color === color).map(([o]) => o);
      if (from.length !== 1) return;
      cg.selectSquare(from[0]);
      cg.selectSquare(key);
    });
  };
  window.addEventListener('pointerup', up, true);
  window.addEventListener('pointercancel', up, true);
}

/* Один розмір дошки для всіх сторінок: на всю ширину екрана (до 560px), але так, щоб усе під дошкою
   (текст завдання, кнопки гри) вміщалося над нижньою панеллю. Меряє реальну сторінку — без формул під кожну сторінку. */
export function fitBoard(box) {
  if (!box || box.closest('.kt-crop') || box.dataset.fit) return;
  box.dataset.fit = '1';
  const host = box.closest('main, .learn--run') || box.parentElement;
  const limit = () => { const nav = document.querySelector('.lg-nav'); return (nav && nav.offsetParent !== null ? nav.getBoundingClientRect().top : innerHeight) - 4; };
  const contentBottom = () => {
    let b = 0;
    for (const c of host.querySelectorAll(':scope > *, :scope > * > .lg-controls')) {
      const cs = getComputedStyle(c);
      if (cs.position === 'fixed' || cs.position === 'absolute' || cs.display === 'none' || !c.offsetHeight) continue;
      b = Math.max(b, c.getBoundingClientRect().bottom);
    }
    return b;
  };
  let busy = false;
  const fit = () => {
    if (busy || !box.isConnected) return;
    // лише телефон вертикально; на планшеті/комп'ютері — розкладка сторінки як є
    if (innerWidth > 799 || innerWidth > innerHeight) { box.style.width = ''; return; }
    busy = true;
    const vw = document.documentElement.clientWidth, full = Math.min(vw, 560);
    let s = full;
    for (let i = 0; i < 5; i++) {
      box.style.width = s + 'px';
      const over = contentBottom() - limit();
      if (over <= 0.5) break;
      s = Math.max(200, Math.floor(s - over));
    }
    busy = false;
  };
  const again = () => requestAnimationFrame(fit);
  addEventListener('resize', again);
  if (window.ResizeObserver) { const ro = new ResizeObserver(again); for (const c of host.children) if (c !== box) ro.observe(c); ro.observe(host); }
  if (document.fonts) document.fonts.ready.then(again);
  again(); setTimeout(fit, 300);
}

/* createBoard(el, { orientation, onMove(orig, dest) })
   → { setPosition(pieces, {lastMove, animate}), setMovable(color, dests), setOrientation,
       hint(orig, dest), clearHint(), cg } */
export function createBoard(el, opts = {}) {
  applyBoardLook();
  el.classList.add('lg-board');
  const cg = Chessground(el, {
    orientation: opts.orientation || 'white',
    coordinates: true,
    coordinatesOnSquares: false,
    blockTouchScroll: true, // як в уроках (lila): палець на дошці не прокручує сторінку — тап не «з'їжджає»
    animation: { enabled: true, duration: 200 },
    highlight: { lastMove: true, check: true },
    movable: { free: false, color: undefined, showDests: true, events: { after: (o, d) => opts.onMove && opts.onMove(o, d) } },
    premovable: { enabled: !!opts.premove, showDests: true }, // хід наперед (як на Lichess) — лише в грі з роботом
    // Тап лише вибирає фігуру (вона не зрушує); тягнути — після руху пальця на 5 px
    draggable: { enabled: true, showGhost: true, distance: 5, autoDistance: false },
    selectable: { enabled: true },
    drawable: { enabled: false, visible: true, brushes: { hint: { key: 'h', color: '#FF9F1C', opacity: 0.95, lineWidth: 13 } } },
    events: { select: key => opts.onSelect && opts.onSelect(key) }
  });
  lichessTouch(cg);

  function setPosition(pieces, o = {}) {
    // pieces: Map(key → {role, color}); chessground сам анімує різницю
    const diff = new Map();
    for (const k of cg.state.pieces.keys()) if (!pieces.has(k)) diff.set(k, undefined);
    for (const [k, p] of pieces) {
      const cur = cg.state.pieces.get(k);
      if (!cur || cur.role !== p.role || cur.color !== p.color) diff.set(k, { ...p });
    }
    if (o.animate === false) cg.set({ animation: { enabled: false } });
    if (diff.size) cg.setPieces(diff);
    if (o.animate === false) cg.set({ animation: { enabled: true } });
    cg.set({ lastMove: o.lastMove || undefined, check: o.check || false });
  }
  // turn — чий зараз хід (для ходу наперед: фігури свої, а ходить суперник)
  function setMovable(color, dests, turn) {
    cg.set({ turnColor: turn || color || cg.state.turnColor, movable: { color: color || undefined, dests: dests || new Map() } });
  }
  return {
    cg,
    setPosition,
    setMovable,
    setOrientation: o => cg.set({ orientation: o }),
    hint: (orig, dest) => cg.setAutoShapes([{ orig, dest, brush: 'hint' }]),
    shapes: s => cg.setAutoShapes(s),
    clearHint: () => cg.setAutoShapes([]),
    // Підсвітити клітинки: Map(клітинка → css-клас), напр. «будиночок» у «Кутах»
    marks: m => cg.set({ highlight: { custom: m || new Map() } }),
    redraw: () => cg.redrawAll(),
    destroy: () => cg.destroy()
  };
}

export const squareName = i => 'abcdefgh'[i % 8] + (8 - Math.floor(i / 8)); // 0 = a8
export const squareIndex = k => (8 - Number(k[1])) * 8 + 'abcdefgh'.indexOf(k[0]);
