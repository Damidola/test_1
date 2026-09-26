/* Мої партії й аналіз.
   games/                 — список збережених партій з роботом (shared/game.js зберігає 30 останніх)
   games/?g=<час>         — партія: гортати хід за ходом, 🔍 аналіз Stockfish для кожної позиції
   games/?fen=<позиція>   — аналіз однієї позиції (з «Своєї позиції») */
import { Chessground } from 'https://cdn.jsdelivr.net/npm/@lichess-org/chessground@10.2.0/dist/chessground.min.js';
import { Chess, parseUci, parseSquare, compat, fen as FEN, san as SAN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { applyBoardLook } from '../shared/board.js?v=1790415711';
import { OPPONENTS, LEVEL_NAMES } from '../shared/opponent.js?v=1790415711';
import { analyse } from '../shared/engine.js?v=1790415711';

const LG = window.LG, app = document.getElementById('app');
const q = new URLSearchParams(location.search);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// українська нотація: Кр — король, Ф — ферзь, Т — тура, С — слон, К — кінь
const UA = { K: 'Кр', Q: 'Ф', R: 'Т', B: 'С', N: 'К' }, ua = t => String(t).replace(/[KQRBN]/g, c => UA[c]);
const RES = { w: ['Перемога', 'w'], d: ['Нічия', 'd'], l: ['Поразка', 'l'] };
const back = href => `<a class="gm-back" href="${href}" aria-label="Назад">‹</a>`;
const games = LG.store.get('games', []);
const thumb = name => (OPPONENTS.find(o => o.name === name) || {}).thumb || '';
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
const when = t => { const d = new Date(t); return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }) + ', ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }); };

if (q.get('g')) {
  const g = games.find(x => String(x.t) === q.get('g'));
  if (!g) { location.replace('./'); } else viewer(g.fens, { game: g });
} else if (q.get('fen')) viewer([q.get('fen')], {});
else list();

// ---------- список ----------
function list() {
  document.body.dataset.back = '../index.html#profile';
  app.innerHTML = `<div class="gm-top">${back('../index.html#profile')}<b>Мої партії</b></div>` + (games.length
    ? `<div class="gm-list">${games.map(g => {
      const moves = Math.ceil((g.fens.length - 1) / 2), [rt, rc] = RES[g.res] || RES.d;
      return `<a class="gm-row" href="?g=${g.t}"><img src="${thumb(g.opp)}" alt=""><span><b>${esc(g.opp || 'Робот')} · рівень ${g.lvl}</b>
        <small>${when(g.t)} · ${moves} ${plural(moves, 'хід', 'ходи', 'ходів')} · ${g.side === 'b' ? 'чорними' : 'білими'}</small></span><em class="gm-res ${rc}">${rt}</em></a>`;
    }).join('')}</div>`
    : `<div class="gm-empty">Тут з’являться партії з роботом.<br>Зіграй партію у вкладці «Гра» — і її можна буде переглянути хід за ходом та проаналізувати 🔍</div>`);
}

// ---------- партія / позиція ----------
// Як на Lichess: на дошці можна ходити за обидві сторони. Хід як у партії — просто йдемо партією далі;
// інший хід — свій варіант (аналіз рахує кожну позицію), «↩ До партії» повертає туди, звідки відійшли.
function viewer(main, { game }) {
  const title = game ? `${esc(game.opp || 'Робот')} · ${(RES[game.res] || RES.d)[0]}` : 'Аналіз позиції';
  const backHref = game ? './' : '../editor/index.html';
  document.body.dataset.back = backHref;
  app.innerHTML = `<div class="gm-top">${back(backHref)}<b>${title}</b></div>
    <div class="gm-board-row"><div class="gm-eval" id="bar" hidden><i></i></div><div class="gm-board"><div class="lg-board-el" id="board"></div></div></div>
    <div class="gm-nav"><button type="button" id="first" aria-label="На початок">⏮</button><button type="button" id="prev" aria-label="Назад">‹</button>
      <span class="gm-n" id="n"></span><button type="button" id="next" aria-label="Вперед">›</button><button type="button" id="last" aria-label="В кінець">⏭</button></div>
    <input type="range" class="gm-slider" id="slider" min="0" max="0" value="0" aria-label="Хід">
    <button type="button" class="gm-ret" id="ret" hidden></button>
    <button type="button" class="gm-an" id="an">🔍 Аналіз</button>
    <div class="gm-info" id="info" hidden></div>
    ${game ? '' : `<a class="gm-play" id="play" href="#">Грати з цієї позиції ▶</a>`}`;
  applyBoardLook();
  const orient = game && game.side === 'b' ? 'black' : 'white';
  const $ = id => document.getElementById(id);
  const cg = Chessground($('board'), {
    fen: main[0], orientation: orient, coordinates: true, animation: { enabled: true, duration: 180 },
    movable: { free: false, showDests: true, events: { after: (o, d) => userMove(o, d) } },
    premovable: { enabled: false },
    draggable: { enabled: true, showGhost: true, distance: 5 },
    drawable: { enabled: false, visible: true, brushes: { best: { key: 'b', color: '#15781B', opacity: 0.85, lineWidth: 11 }, alt: { key: 'a', color: '#003088', opacity: 0.45, lineWidth: 8 } } }
  });
  if (orient === 'black') $('bar').classList.add('flip');
  const mainLm = game ? game.lm : main.map(() => null);
  let line = main.slice(), lm = mainLm.slice(), branch = -1; // branch ≥ 0 — свій варіант, відійшли з позиції branch
  let i = game ? main.length - 1 : 0, on = LG.store.get('an:on', false), token = 0, wait = 0;
  const posAt = k => { try { return Chess.fromSetup(FEN.parseFen(line[k]).unwrap()).unwrap(); } catch (e) { return null; } };
  const same = (a, b) => a.split(' ').slice(0, 2).join(' ') === b.split(' ').slice(0, 2).join(' ');

  function userMove(o, d) {
    const pos = posAt(i); if (!pos) return show();
    const from = parseSquare(o), to = parseSquare(d), piece = pos.board.get(from);
    const mv = { from, to, promotion: piece && piece.role === 'pawn' && (to >> 3 === 7 || to >> 3 === 0) ? 'queen' : undefined };
    // у chessground рокіровка — король на туру або на 2 клітинки; chessops розуміє обидва
    if (!pos.isLegal(mv)) return show();
    const next = pos.clone(); next.play(mv);
    const f = FEN.makeFen(next.toSetup());
    LG.play('tap');
    if (branch < 0 && i + 1 < main.length && same(main[i + 1], f)) { i++; return show(); }
    if (branch < 0) branch = i;
    line = line.slice(0, i + 1).concat(f); lm = lm.slice(0, i + 1).concat([[o, d]]); i++;
    show();
  }
  // дошка — такого розміру, щоб під нею вмістились усі кнопки (без прокрутки)
  function fit() {
    const row = document.querySelector('.gm-board-row'), max = Math.min(520, app.clientWidth - 24);
    row.style.width = max + 'px';
    const kids = [...app.children].filter(c => c.offsetParent), gap = parseFloat(getComputedStyle(app).rowGap) || 0;
    const pad = parseFloat(getComputedStyle(app).paddingTop) + parseFloat(getComputedStyle(app).paddingBottom);
    const over = kids.reduce((h, c) => h + c.offsetHeight, 0) + gap * (kids.length - 1) + pad + 4 - app.clientHeight;
    if (over > 0) row.style.width = Math.max(200, max - over) + 'px';
    cg.redrawAll();
  }
  addEventListener('resize', () => fit());
  function show() {
    const pos = posAt(i);
    const dests = pos && !pos.isEnd() ? compat.chessgroundDests(pos) : new Map();
    cg.set({ fen: line[i], lastMove: lm[i] || undefined, check: pos && pos.isCheck() ? pos.turn : false, turnColor: pos ? pos.turn : 'white',
      movable: { color: pos && !pos.isEnd() ? pos.turn : undefined, dests } });
    cg.setAutoShapes([]);
    const n = line.length - 1;
    $('n').textContent = (branch >= 0 && i > branch ? '🔀 ' : '') + (i ? `Хід ${Math.ceil(i / 2)}${i % 2 ? '' : '…'} · ${i}/${n}` : 'Початок');
    $('slider').max = n; $('slider').value = i; $('slider').hidden = n === 0;
    $('first').disabled = $('prev').disabled = i === 0; $('next').disabled = $('last').disabled = i === n;
    $('ret').hidden = branch < 0; $('ret').textContent = game ? '↩ Повернутися до партії' : '↩ До початкової позиції';
    $('an').classList.toggle('on', on); $('an').textContent = on ? '🔍 Аналіз увімкнено' : '🔍 Аналіз';
    $('bar').hidden = $('info').hidden = !on;
    if ($('play')) $('play').href = `../chess/index.html?level=2&side=${line[i].split(' ')[1] === 'b' ? 'b' : 'w'}&fen=${encodeURIComponent(line[i])}`;
    fit();
    if (on) { $('info').innerHTML = 'Робот думає… 🤔'; token++; clearTimeout(wait); wait = setTimeout(() => think(pos), 250); }
  }
  const played = () => {
    // хід, який зробили в партії з цієї позиції (лише на лінії партії)
    if (!game || branch >= 0 || i >= main.length - 1 || !mainLm[i + 1]) return '';
    const pos = posAt(i), [f, t] = mainLm[i + 1];
    try { return SAN.makeSan(pos, parseUci(f + t)); } catch (e) { return ''; }
  };
  async function think(pos) {
    const my = ++token, info = $('info'), bar = $('bar').firstElementChild;
    if (!pos) { info.textContent = 'Цю позицію не вийде проаналізувати.'; return; }
    if (pos.isCheckmate()) { info.innerHTML = `<b>Мат!</b> ${pos.turn === 'white' ? 'Чорні' : 'Білі'} перемогли.`; bar.style.height = pos.turn === 'white' ? '0%' : '100%'; return; }
    if (pos.isEnd()) { info.innerHTML = '<b>Нічия.</b> Ходів немає або фігур замало для мату.'; bar.style.height = '50%'; return; }
    info.innerHTML = 'Робот думає… 🤔';
    const r = await analyse(FEN.makeFen(pos.toSetup()), 900);
    if (my !== token) return;
    if (!r || !r.best) { info.textContent = 'Аналіз зараз недоступний — спробуй ще раз.'; return; }
    const sign = pos.turn === 'white' ? 1 : -1; // оцінка рушія — з боку того, хто ходить; переводимо на «білі»
    let text, white;
    if (r.mate !== null && r.mate !== undefined) {
      const mateWhite = r.mate * sign > 0, n = Math.abs(r.mate);
      white = mateWhite ? 100 : 0;
      text = n === 0 ? 'Мат!' : `${mateWhite ? 'Білі' : 'Чорні'} ставлять мат за ${n} ${plural(n, 'хід', 'ходи', 'ходів')}`;
    } else {
      const cp = (r.cp || 0) * sign, abs = Math.abs(cp) / 100;
      white = Math.round(100 / (1 + Math.exp(-cp / 250)));
      text = abs < 0.3 ? `Рівно (${cp >= 0 ? '+' : '−'}${abs.toFixed(1)})` : `${cp > 0 ? 'Краще білим' : 'Краще чорним'}: ${cp > 0 ? '+' : '−'}${abs.toFixed(1)}`;
    }
    bar.style.height = white + '%';
    const mv = parseUci(r.best);
    let best = r.best, line = '';
    try { best = SAN.makeSan(pos, mv); } catch (e) { /* */ }
    try { line = SAN.makeSanVariation(pos, r.pv.slice(0, 6).map(u => parseUci(u)).filter(Boolean)); } catch (e) { /* */ }
    cg.setAutoShapes([{ orig: r.best.slice(0, 2), dest: r.best.slice(2, 4), brush: 'best' }]);
    let alt = '';
    const l2 = r.lines && r.lines[1];
    if (l2 && l2.pv[0]) {
      try {
        const m2 = SAN.makeSan(pos, parseUci(l2.pv[0]));
        const sc2 = l2.mate != null ? `мат за ${Math.abs(l2.mate)}` : ((l2.cp || 0) * sign >= 0 ? '+' : '−') + (Math.abs(l2.cp || 0) / 100).toFixed(1);
        alt = `<br>Ще добрий хід: <b>${esc(ua(m2))}</b> <small style="display:inline">(${sc2})</small>`;
        cg.setAutoShapes([{ orig: r.best.slice(0, 2), dest: r.best.slice(2, 4), brush: 'best' }, { orig: l2.pv[0].slice(0, 2), dest: l2.pv[0].slice(2, 4), brush: 'alt' }]);
      } catch (e) { /* */ }
    }
    const p = played();
    requestAnimationFrame(fit);
    info.innerHTML = `<b>${text}</b><br>Найкращий хід: <b>${esc(ua(best))}</b>${p ? (p === best ? ' ✅ так і зіграли' : ` · у партії: ${esc(ua(p))}`) : ''}${alt}${line ? `<small>Далі: ${esc(ua(line))}</small>` : ''}`;
  }
  const go = k => { i = Math.max(0, Math.min(line.length - 1, k)); LG.play('tap'); show(); };
  $('first').onclick = () => go(0); $('prev').onclick = () => go(i - 1); $('next').onclick = () => go(i + 1); $('last').onclick = () => go(line.length - 1);
  $('slider').oninput = e => { i = +e.target.value; show(); };
  addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
  $('ret').onclick = () => { i = branch; line = main.slice(); lm = mainLm.slice(); branch = -1; LG.play('tap'); show(); };
  // «Назад» Telegram спершу повертає з варіанта до партії
  LG.onBack && LG.onBack(() => { if (branch < 0) return false; $('ret').click(); return true; });
  $('an').onclick = () => { on = !on; LG.store.set('an:on', on); LG.play('tap'); show(); };
  if (!game) on = true;
  show();
}
