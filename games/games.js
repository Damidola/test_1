/* Мої партії й аналіз.
   games/                 — список збережених партій з роботом (shared/game.js зберігає 30 останніх)
   games/?g=<час>         — партія: гортати хід за ходом, 🔍 аналіз Stockfish для кожної позиції
   games/?fen=<позиція>   — аналіз однієї позиції (з «Своєї позиції») */
import { Chessground } from 'https://cdn.jsdelivr.net/npm/@lichess-org/chessground@10.2.0/dist/chessground.min.js';
import { Chess, parseUci, fen as FEN, san as SAN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { applyBoardLook } from '../shared/board.js?v=1790412596';
import { OPPONENTS, LEVEL_NAMES } from '../shared/opponent.js?v=1790412596';
import { analyse } from '../shared/engine.js?v=1790412596';

const LG = window.LG, app = document.getElementById('app');
const q = new URLSearchParams(location.search);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
function viewer(fens, { game }) {
  const title = game ? `${esc(game.opp || 'Робот')} · ${(RES[game.res] || RES.d)[0]}` : 'Аналіз позиції';
  const backHref = game ? './' : '../editor/index.html';
  document.body.dataset.back = backHref;
  app.innerHTML = `<div class="gm-top">${back(backHref)}<b>${title}</b></div>
    <div class="gm-board-row"><div class="gm-eval" id="bar" hidden><i></i></div><div class="gm-board"><div class="lg-board-el" id="board"></div></div></div>
    ${fens.length > 1 ? `<div class="gm-nav"><button type="button" id="first" aria-label="На початок">⏮</button><button type="button" id="prev" aria-label="Назад">‹</button>
      <span class="gm-n" id="n"></span><button type="button" id="next" aria-label="Вперед">›</button><button type="button" id="last" aria-label="В кінець">⏭</button></div>
      <input type="range" class="gm-slider" id="slider" min="0" max="${fens.length - 1}" value="0" aria-label="Хід">` : ''}
    <button type="button" class="gm-an" id="an">🔍 Аналіз</button>
    <div class="gm-info" id="info" hidden></div>
    ${game ? '' : `<a class="gm-play" href="../chess/index.html?level=2&side=${fens[0].split(' ')[1] === 'b' ? 'b' : 'w'}&fen=${encodeURIComponent(fens[0])}">Грати з цієї позиції ▶</a>`}`;
  applyBoardLook();
  const orient = game && game.side === 'b' ? 'black' : 'white';
  const cg = Chessground(document.getElementById('board'), {
    fen: fens[0], orientation: orient, viewOnly: true, coordinates: true, animation: { enabled: true, duration: 180 },
    drawable: { enabled: false, visible: true, brushes: { best: { key: 'b', color: '#15781B', opacity: 0.85, lineWidth: 11 } } }
  });
  const $ = id => document.getElementById(id);
  if (orient === 'black') $('bar').classList.add('flip');
  let i = game ? fens.length - 1 : 0, on = LG.store.get('an:on', false), token = 0, wait = 0;
  const posAt = k => { try { return Chess.fromSetup(FEN.parseFen(fens[k]).unwrap()).unwrap(); } catch (e) { return null; } };

  function show() {
    const pos = posAt(i), lm = game && game.lm[i];
    cg.set({ fen: fens[i], lastMove: lm || undefined, check: pos && pos.isCheck() ? pos.turn : false, turnColor: pos ? pos.turn : 'white' });
    cg.setAutoShapes([]);
    if (fens.length > 1) {
      $('n').textContent = i ? `Хід ${Math.ceil(i / 2)}${i % 2 ? '' : '…'} · ${i} / ${fens.length - 1}` : 'Початок';
      $('slider').value = i; $('first').disabled = $('prev').disabled = i === 0; $('next').disabled = $('last').disabled = i === fens.length - 1;
    }
    $('an').classList.toggle('on', on); $('an').textContent = on ? '🔍 Аналіз увімкнено' : '🔍 Аналіз';
    $('bar').hidden = $('info').hidden = !on;
    if (on) { $('info').innerHTML = 'Робот думає… 🤔'; token++; clearTimeout(wait); wait = setTimeout(() => think(pos), 250); }
  }
  const played = () => {
    // хід, який зробили в партії з цієї позиції
    if (!game || i >= fens.length - 1 || !game.lm[i + 1]) return '';
    const pos = posAt(i), [f, t] = game.lm[i + 1];
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
    const p = played();
    info.innerHTML = `<b>${text}</b><br>Найкращий хід: <b>${esc(best)}</b>${p ? (p === best ? ' ✅ так і зіграли' : ` · у партії: ${esc(p)}`) : ''}${line ? `<small>Далі: ${esc(line)}</small>` : ''}`;
  }
  const go = k => { i = Math.max(0, Math.min(fens.length - 1, k)); LG.play('tap'); show(); };
  if (fens.length > 1) {
    $('first').onclick = () => go(0); $('prev').onclick = () => go(i - 1); $('next').onclick = () => go(i + 1); $('last').onclick = () => go(fens.length - 1);
    $('slider').oninput = e => { i = +e.target.value; show(); };
    addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
  }
  $('an').onclick = () => { on = !on; LG.store.set('an:on', on); LG.play('tap'); show(); };
  if (!game) on = true;
  show();
}
