/* Шахи для дітей: застосунок із чотирма вкладками.
   🎓 Уроки — дорога з 22 кроків (3 у ряд, змійкою знизу вгору), тап — аркуш «урок · задачі · гра»;
   🤖 Гра — вибір суперника, кольору, сили й режиму → партія з роботом;
   🎯 Практика — задачі, фігури проти пішаків, мат роботу, головоломки;
   👤 Профіль — прогрес, звук (значок — вимкнути, повзунок — гучність), набір фігур.
   Сторінки ігор і уроків відкриваються окремо; 🏠 у них повертає на ту саму вкладку. */
import { OPPONENTS, LEVEL_NAMES } from './shared/opponent.js?v=1790346264';
import { BOARD_THEMES, boardUrl } from './shared/board.js?v=1790346264';
import { SECTIONS, STEPS, P, W } from './shared/path.js?v=1790346264';

const LG = window.LG, $ = id => document.getElementById(id);
const piece = (c, color = 'w') => `<img src="shared/pieces/${LG.pieceSet()}/${color}${c}.svg" alt="">`;
const icon = ic => /^[PRBQNK]$/.test(ic) ? piece(ic) : ic;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- кроки уроків (shared/path.js) ----------
const seen = new Set(LG.store.get('path:seen', []));
const stepDone = i => STEPS[i][3].every(l => l[2].startsWith('#') ? LG.stats().chess?.played > 0 : seen.has(l[2]));
const doneCount = () => STEPS.filter((_, i) => stepDone(i)).length;
const secOf = i => SECTIONS.filter(x => x[0] <= i).pop();
const KIND = { play: ['#2ECC9A', 'Гра'], task: ['#FF9F1C', 'Задачі'], learn: ['#7C6CF0', 'Урок'] };

// ---------- 🎓 уроки ----------
// Новий вигляд (як Magnus) у кольорах і з фігурами старого: вгорі вкладки розділів, під ними — лише кроки
// вибраного розділу зигзагом (центр → ліворуч → праворуч → центр…), тонкі лінії, білі галочки. Усе на одному екрані.
let curStep = 0, curSec = -1;
// розділ, який відкривали востаннє: з уроку повертаємось саме туди, а не до першого незавершеного
{ const s = +LG.store.get('learn:sec', -1); if (s >= 0 && s < SECTIONS.length) curSec = s; }
const SEC_SHORT = ['ФІГУРИ', 'ОСОБЛИВІ', 'ШАХ', 'МАТ', 'МАЙСТЕР'];
const secRange = si => [SECTIONS[si][0], (SECTIONS[si + 1] || [STEPS.length])[0]];
const secIndexOf = i => SECTIONS.reduce((k, x, j) => (x[0] <= i ? j : k), 0);
function renderLearn() {
  curStep = STEPS.findIndex((_, i) => !stepDone(i)); if (curStep < 0) curStep = STEPS.length - 1;
  if (curSec < 0) curSec = secIndexOf(curStep);
  $('secbar').innerHTML = SECTIONS.map(([from, name, c], si) => {
    const [f, t] = secRange(si), n = STEPS.slice(f, t).filter((_, j) => stepDone(f + j)).length;
    return `<button type="button" data-s="${si}" class="${si === curSec ? 'on' : ''}" style="--c:${c}" aria-label="${esc(name)}: ${n} з ${t - f}">${SEC_SHORT[si] || esc(name)}</button>`;
  }).join('');
  const [f, t] = secRange(curSec), c = SECTIONS[curSec][2];
  const cells = STEPS.slice(f, t).map(([ic, title], j) => {
    const i = f + j;
    return `<button type="button" class="ap-node${stepDone(i) ? ' done' : ''}${i === curStep ? ' cur' : ''}" id="s${i}" data-i="${i}" style="--c:${c}">
      <span class="ap-dot">${icon(ic)}</span><b>${esc(title)}</b></button>`;
  }).join('');
  const next = SECTIONS[curSec + 1];
  $('road').innerHTML = '<svg class="ap-road-svg" id="road-svg" aria-hidden="true"></svg>' + cells +
    (next ? `<button type="button" class="ap-nextsec" data-s="${curSec + 1}" style="--c:${next[2]}"><i></i><span>${esc(next[1])}</span> ›</button>` : '');
  requestAnimationFrame(drawRoad);
}
// Розставляємо кружечки: знизу вгору центр, ліворуч, праворуч, центр… і малюємо лінії між ними
function drawRoad() {
  const road = $('road'), svg = $('road-svg'); if (!road || road.offsetParent === null) return;
  const [f, t] = secRange(curSec), n = t - f, W = road.clientWidth, H = road.clientHeight;
  const slot = k => ['C', 'L', 'R'][k % 3];
  // ряди: C — свій ряд, пара L/R — спільний ряд
  const rows = []; for (let k = 0; k < n; k++) { const sl = slot(k); if (sl === 'R') rows[rows.length - 1].push(k); else rows.push([k]); }
  const top = road.querySelector('.ap-nextsec') ? 56 : 12, bottom = 8;
  const gap = (H - top - bottom) / rows.length, size = Math.max(44, Math.min(78, gap * 0.52, W * 0.2));
  const X = { C: W / 2, L: W * 0.24, R: W * 0.76 }, pts = [];
  rows.forEach((row, r) => row.forEach(k => {
    const x = X[slot(k)], y = H - bottom - gap * (r + 0.5) - 10;
    pts[k] = [x, y];
    const el = $('s' + (f + k));
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.setProperty('--sz', size + 'px');
  }));
  const path = list => list.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  const doneUpTo = Math.min(n - 1, curStep - f);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `<path class="bed" d="${path(pts)}"/>` + (doneUpTo > 0 ? `<path class="done" d="${path(pts.slice(0, doneUpTo + 1))}" style="stroke:${SECTIONS[curSec][2]}"/>` : '') +
    (road.querySelector('.ap-nextsec') && pts.length ? `<path class="bed" d="M${pts[n - 1][0]} ${pts[n - 1][1]} L${W / 2} 40"/>` : '');
}
window.addEventListener('resize', () => requestAnimationFrame(drawRoad));
const row = ([e, t, href, kind], sub) => `<a class="ap-row${seen.has(href) ? ' seen' : ''}" href="${href}"><span class="ic" style="--c:${KIND[kind || 'learn'][0]}">${e}</span><span>${esc(t)}<small>${esc(sub || KIND[kind || 'learn'][1])}</small></span><span class="go">${seen.has(href) ? '✓' : '›'}</span></a>`;
function openStep(i) {
  $('card').onclick = null;
  const [ic, title, sub, links] = STEPS[i], sec = secOf(i);
  $('card').innerHTML = `<div class="ap-card-head"><span class="ap-dot" style="--c:${sec[2]}">${icon(ic)}</span><div><h2>${i + 1}. ${esc(title)}</h2><p>${esc(sub)}</p></div></div>` + links.map(l => row(l)).join('');
  $('sheet').hidden = false;
}
$('road').addEventListener('click', e => {
  const n = e.target.closest('.ap-node'); if (!n) return;
  LG.store.set('learn:sec', curSec); // повернутись із уроку саме в цей розділ
  const links = STEPS[+n.dataset.i][3];
  if (links.length === 1) { // один пункт — одразу його, без аркуша
    const href = links[0][2]; seen.add(href); LG.store.set('path:seen', [...seen]);
    if (href.startsWith("#")) location.hash = href; else LG.go(href);
    return;
  }
  openStep(+n.dataset.i);
});
const goSec = si => { if (si < 0 || si >= SECTIONS.length || si === curSec) return; curSec = si; LG.store.set('learn:sec', si); LG.play('tap'); renderLearn(); gate($('view-learn')); };
$('secbar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) goSec(+b.dataset.s); });
$('road').addEventListener('click', e => { const b = e.target.closest('.ap-nextsec'); if (b) goSec(+b.dataset.s); });
// свайп ліворуч / праворуч — сусідній розділ
let sw0 = null;
$('view-learn').addEventListener('touchstart', e => { const t = e.touches[0]; sw0 = [t.clientX, t.clientY]; }, { passive: true });
$('view-learn').addEventListener('touchend', e => {
  if (!sw0) return; const t = e.changedTouches[0], dx = t.clientX - sw0[0], dy = t.clientY - sw0[1]; sw0 = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goSec(curSec + (dx < 0 ? 1 : -1));
}, { passive: true });
$('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').hidden = true; if (e.target.closest('a[href^="#"]')) $('sheet').hidden = true; });

// ---------- 🤖 гра з роботом ----------
// Усі суперники на одному екрані, по рядках: 1-й рядок — рівень 1 … 5-й — рівень 5.
// Тап по звіряткові → знизу вибір кольору (і режиму) → партія.
const ROWS = (() => {
  const order = OPPONENTS.map((o, i) => [o.level, i]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[1]);
  const rows = []; for (let r = 0; r * 4 < order.length; r++) rows.push(order.slice(r * 4, r * 4 + 4));
  return rows;
})();
let side = LG.store.get('play:side', 'w');
// Вкладка «Гра» у новому дизайні (чорне тло, Manrope), але з кольорами й мультяшними суперниками старого:
// угорі — яким кольором граєш, далі 5 рядків-рівнів: номер і назва рівня кольором, праворуч — 4 суперники в кружечках
const LV_COLORS = ['#2ECC9A', '#3FA7F5', '#7C6CF0', '#FF9F1C', '#FF5C6C'];
function renderPlay() {
  const sides = [['w', piece('K', 'w') + '<span>Білі</span>'], ['b', piece('K', 'b') + '<span>Чорні</span>'], ['r', '<span class="big">🎲</span>']];
  $('view-play').classList.add('mg2');
  $('view-play').innerHTML = `<div class="g2-head">ГРА З РОБОТОМ</div>
    <div class="g2-side" id="side-seg">${sides.map(([v, inner]) => `<button type="button" data-v="${v}" class="${side === v ? 'on' : ''}" aria-label="${{ w: 'Білими', b: 'Чорними', r: 'Будь-якими' }[v]}">${inner}</button>`).join('')}</div>
    <div class="g2-rows">${ROWS.map((row, r) => `
      <div class="g2-row" style="--lc:${LV_COLORS[r]}"><div class="g2-lvl"><b>${r + 1}</b></div>
        <div class="g2-opps">${row.map(i => `<a class="ap-opp" href="chess/index.html?opp=${i}&side=${side}&level=${r + 1}" aria-label="${esc(OPPONENTS[i].name)}"><img src="${OPPONENTS[i].thumb}" alt="" decoding="sync"></a>`).join('')}</div></div>`).join('')}
    </div>`;
}
$('view-play').addEventListener('click', e => {
  const b = e.target.closest('#side-seg button'); if (!b) return;
  side = b.dataset.v; LG.store.set('play:side', side); LG.play('tap'); renderPlay();
});

// ---------- 🎯 практика ----------
// Практика: спершу короткий список розділів (без прокрутки), тап — розділ відкривається з вибором усередині
const PRACTICE = [
  { id: 'check', ic: 'K', t: 'Шах', s: 'постав шах і врятуйся від шаху', c: '#3FA7F5', groups: [
    ['Постав шах', [['R', 'Турою', '', P('chk_rook')], ['B', 'Слоном', '', P('chk_bishop')], ['Q', 'Ферзем', '', P('chk_queen')], ['N', 'Конем', '', P('chk_knight')], ['P', 'Пішаком', '', P('chk_pawn')]]],
    ['Урятуйся від шаху', [['🏃', 'Утечи королем', '', P('esc_run')], ['⚔️', 'Побий', 'того, хто шахує', P('esc_capture')], ['🛡️', 'Закрийся', 'іншою фігурою', P('esc_block')], ['🎲', 'Різні', 'здогадайся сам', P('esc_mixed')]]]] },
  { id: 'mate1', ic: 'Q', t: 'Мат в 1 хід', s: 'обери фігуру, якою ставиш мат', c: '#FF5C6C', groups: [
    [null, [['R', 'Турою', '', P('m1rook')], ['B', 'Слоном', '', P('m1bishop')], ['P', 'Пішаком', '', P('m1pawn')], ['Q', 'Ферзем', '', P('m1queen')], ['N', 'Конем', '', P('m1knight')], ['🎲', 'Різні', 'будь-якою фігурою', P('m1mix')]]]] },
  { id: 'mate2', ic: '🏆', t: 'Мат у 2 ходи', s: 'хід, відповідь — мат', c: '#E0567A', href: P('mate2') },
  { id: 'tactics', ic: '🍴', t: 'Тактика', s: 'вилка, зв’язка, простріл та інші', c: '#FF9F1C', groups: [
    [null, [['🍴', 'Вилка', '', P('fork')], ['📌', 'Зв’язка', '', P('pin')], ['🏹', 'Простріл', '', P('skewer')], ['💥', 'Відкритий напад', '', P('discovered')],
      ['🎣', 'Відволікання', '', P('deflection')], ['🧲', 'Заманювання', '', P('attraction')], ['🎁', 'Незахищена фігура', '', P('hanging')], ['👑', 'Пішак у ферзі', '', P('promotion')]]]] },
  { id: 'endgame', ic: ['K', 'Q'], t: 'Постав мат роботу', s: 'скільки завгодно ходів — головне мат', c: '#2ECC9A', groups: [
    [null, [[['K', 'Q'], 'Ферзь і король', '', P('kqk')], [['K', 'R'], 'Тура і король', '', P('krk')], [['K', 'B', 'B'], 'Два слони', '', P('kbbk')], [['K', 'P'], 'Король і пішак', '', P('kpk')]]]] },
  { id: 'pvp', ic: ['Q', 'vs', 'P'], t: 'Фігури проти пішаків', s: 'не пропусти жодного пішака до краю', c: '#7C6CF0', groups: [
    [null, [[['Q', 'vs', 'P'], 'Ферзь проти 8', '', W('q_p8')], [['R', 'vs', 'P'], 'Тура проти 5', '', W('r_p5')], [['B', 'vs', 'P'], 'Слон проти 3', '', W('b_p3')],
      [['N', 'vs', 'P'], 'Кінь проти 3', '', W('n_p3')], [['B', 'B', 'vs', 'P'], '2 слони проти 8', '', W('bb_p8')], [['N', 'N', 'vs', 'P'], '2 коні проти 6', '', W('nn_p6')]]]] },
  { id: 'games', ic: '⭐', t: 'Головоломки', s: 'хід конем, 8 ферзів', c: '#8C6CF0', groups: [
    [null, [[['N'], 'Хід конем', 'обійди всю дошку', 'knights-tour/index.html'], [['Q'], '8 ферзів', 'щоб ніхто нікого не бив', 'eight-queens/index.html']]]] },
  { id: 'pawns', ic: ['P', 'vs', 'P'], t: 'Пішакова битва', s: 'хто перший до краю', c: '#4DB6AC', href: 'pawns/index.html' }
];
const art = ic => {
  const vs = Array.isArray(ic) ? ic.indexOf('vs') : -1; // до «vs» — білі фігури, після — чорні
  return Array.isArray(ic) ? ic.map((x, j) => x === 'vs' ? '<span>vs</span>' : piece(x, vs >= 0 && j > vs ? 'b' : 'w')).join('') : /^[PRBQNK]$/.test(ic) ? piece(ic) : `<span class="emo">${ic}</span>`;
};
// скільки задач розділу вже розв'язано (chess-puzzles зберігає chk:puz:<розділ>)
const solvedOf = hrefs => hrefs.reduce((n, h) => { const k = h.startsWith('chess-puzzles/') && h.split('#')[1]; return n + (k ? (LG.store.get('puz:' + k, []) || []).length : 0); }, 0);
const catLinks = c => c.href ? [c.href] : c.groups.flatMap(([, items]) => items.map(x => x[3]));
// скільки всього задач у кожному розділі — з chess-puzzles/puzzles.json (вантажиться раз, коли відкрили розділ)
let puzTotal = null, puzLoading = false;
function loadPuzTotals(open) {
  if (puzTotal || puzLoading) return;
  puzLoading = true;
  fetch('chess-puzzles/puzzles.json').then(r => r.json()).then(d => {
    puzTotal = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.length]));
    if (location.hash === '#practice/' + open) renderPractice(open);
  }).catch(() => { puzLoading = false; });
}
// Вкладка «Практика» у новому дизайні: список рядків (кружечок кольору розділу з фігурами, назва, опис, лічильник, ›);
// у розділі — картки задач із тонкою смужкою прогресу кольору розділу
const CHEV = '<svg class="g2-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
function renderPractice(open) {
  const cat = PRACTICE.find(c => c.id === open && c.groups);
  $('view-practice').classList.add('mg2');
  if (cat) loadPuzTotals(open);
  if (!cat) {
    $('view-practice').innerHTML = `<div class="g2-head">ПРАКТИКА</div><div class="g2-list">${PRACTICE.map(c => {
      const n = solvedOf(catLinks(c));
      return `<a class="g2-item" href="${c.href || '#practice/' + c.id}" style="--c:${c.c}"><span class="g2-ic pcs">${art(c.ic)}</span>
        <span class="g2-tx"><span class="g2-t"><b>${esc(c.t)}</b>${n ? `<em>✓ ${n}</em>` : ''}</span><small>${esc(c.s)}</small></span>${CHEV}</a>`;
    }).join('')}</div>`;
    return;
  }
  $('view-practice').innerHTML = `<div class="g2-sub"><a class="g2-back" href="#practice" aria-label="Назад"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><span class="g2-ic pcs" style="--c:${cat.c}">${art(cat.ic)}</span><h2>${esc(cat.t)}</h2></div>` +
    cat.groups.map(([h, items]) => `${h ? `<h3 class="g2-h3">${esc(h)}</h3>` : ''}<div class="g2-tiles">${items.map(([ic, t, sub, href]) => {
      const n = solvedOf([href]), k = href.startsWith('chess-puzzles/') && href.split('#')[1], tot = k && puzTotal && puzTotal[k];
      // задачі: «2 / 35» і смужка — скільки розв'язано з усіх
      const prog = tot ? `<span class="g2-prog${n >= tot ? ' all' : ''}"><span>${n} / ${tot}</span><i><i style="width:${Math.max(2, Math.round(100 * n / tot))}%"></i></i></span>` : n ? `<span class="g2-cnt">✓ ${n}</span>` : '';
      return `<a class="g2-tile" href="${href}" style="--c:${cat.c}"><span class="g2-ic pcs">${art(ic)}</span><span class="g2-tx"><b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${prog}</a>`;
    }).join('')}</div>`).join('');
}

// ---------- 👤 профіль ----------
function solvedPuzzles() {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('chk:puz:')) try { n += JSON.parse(localStorage.getItem(k)).length; } catch (e) { /* */ } }
  return n;
}
// «Гра з роботом» і «Скинути прогрес» — під спойлером: профіль уміщається на один екран
let pfOpen = false;
function renderProfile() {
  const st = LG.stats(), wins = Object.values(st).reduce((a, s) => a + (s.wins || 0), 0), d = doneCount();
  // Профіль у стилі нового дизайну (Magnus): чорне тло, бірюзові акценти, рядки налаштувань з тонкими лініями
  const cur = Math.min(d, STEPS.length - 1), sec = secOf(cur);
  const kingSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5v4M10 4.5h4M8 20h8l-1-4c2-1 3-3 3-5 0-2.2-2-3.5-6-3.5S6 8.8 6 11c0 2 1 4 3 5z"/></svg>';
  const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const lims = `${LG.store.get('hints', '3') === 'inf' ? '∞' : LG.store.get('hints', '3')} підказки · ${LG.store.get('undos', '3') === 'inf' ? '∞' : LG.store.get('undos', '3')} ходів назад`;
  $('view-profile').classList.add('mg');
  $('view-profile').innerHTML = `
    <div class="mg-me"><span class="mg-av">${kingSvg}</span><div class="mg-who"><b>Юний шахіст</b><small>Крок ${Math.min(d + 1, STEPS.length)} з ${STEPS.length} · ${sec ? sec[1] : ''}</small><div class="mg-bar"><i style="width:${Math.round(100 * d / STEPS.length)}%"></i></div></div></div>
    <div class="mg-stats"><div><b>${d}</b><span>КРОКИ</span></div><div><b>${solvedPuzzles()}</b><span>ЗАДАЧІ</span></div><div><b>${wins}</b><span>ПЕРЕМОГИ</span></div></div>
    <div class="mg-list">
      <div class="mg-row"><span>Мова</span><div class="mg-pill" id="p-lang">${[['uk', 'UA'], ['en', 'EN']].map(([v, t]) => `<button type="button" data-v="${v}" class="${LG.lang() === v ? 'on' : ''}">${t}</button>`).join('')}</div></div>
      <div class="mg-row"><span>Звук</span><div class="mg-vol" id="p-vol"><button type="button" id="p-mute" aria-label="Звук"></button><input type="range" min="0" max="100" step="5" id="p-range" aria-label="Гучність"></div></div>
      <div class="mg-row mg-col"><span>Дошка</span><div class="ap-boards" id="p-boards"></div></div>
      <div class="mg-row mg-col" id="p-pieces"><span>Фігури</span></div>
      <div class="mg-row"><span>Крапки ходів</span><button type="button" class="pf-sw" id="p-dots" aria-label="Крапки ходів"></button></div>
      <div class="mg-row"><span>Цифри й літери біля дошки</span><button type="button" class="pf-sw" id="p-coords" aria-label="Цифри й літери біля дошки"></button></div>
      ${LG.fullscreen.supported ? `<div class="mg-row"><span>Повний екран</span><button type="button" class="pf-sw" id="p-fs" aria-label="Повний екран"></button></div>` : ''}
      <details class="pf-more mg-more"${pfOpen ? ' open' : ''}><summary class="mg-row"><span>Гра з роботом</span><em>${lims}${chev}</em></summary>
        <div class="mg-sub">
          <div class="mg-row"><span>Підказки</span><div class="mg-pill mg-lim" data-lim="hints">${['1', '3', '5', 'inf'].map(v => `<button type="button" data-v="${v}">${v === 'inf' ? '∞' : v}</button>`).join('')}</div></div>
          <div class="mg-row"><span>Ходи назад</span><div class="mg-pill mg-lim" data-lim="undos">${['1', '3', '5', 'inf'].map(v => `<button type="button" data-v="${v}">${v === 'inf' ? '∞' : v}</button>`).join('')}</div></div>
          <div class="mg-row"><span>Робот думає</span><div class="mg-think"><input type="range" min="300" max="4000" step="100" id="p-think" aria-label="Скільки робот думає"><b id="p-think-v"></b></div></div>
          <div class="mg-row"><span>Репліки суперника</span><button type="button" class="pf-sw" id="p-say" aria-label="Репліки суперника"></button></div>
          <button type="button" class="mg-done">Готово</button>
        </div>
      </details>
    </div>
    <button type="button" class="mg-reset" id="p-reset">Скинути прогрес</button>`;
  // розкрите чи ні — пам'ятаємо, поки відкрита сторінка
  $('view-profile').querySelector('.pf-more').addEventListener('toggle', e => { pfOpen = e.target.open; });
  // скільки робот думає перед ходом (мс; типово 1,5 с)
  const paintThink = () => { const v = +LG.store.get('botThink', 1500); $('p-think').value = v; $('p-think-v').textContent = (v / 1000).toFixed(1).replace('.', ',') + ' с'; $('p-think').style.setProperty('--v', ((v - 300) / 37) + '%'); };
  paintThink();
  $('p-think').addEventListener('input', e => { LG.store.set('botThink', +e.target.value); paintThink(); });
  // шторку «Гра з роботом» закриває «Готово» або тап повз неї
  const more = $('view-profile').querySelector('.pf-more');
  more.querySelector('.mg-done').addEventListener('click', () => { more.open = false; });
  $('view-profile').addEventListener('pointerdown', e => { if (more.open && !e.target.closest('.mg-sub') && !e.target.closest('.pf-more > summary')) more.open = false; });
  const paint = () => {
    const v = Math.round(LG.volume * 100);
    const off = LG.muted || v === 0;
    $('p-mute').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${off ? '<path d="M16 9.5l5 5M21 9.5l-5 5"/>' : '<path d="M15.5 9a4.2 4.2 0 0 1 0 6"/>' + (v >= 60 ? '<path d="M18 6.5a7.8 7.8 0 0 1 0 11"/>' : '')}</svg>`;
    $('p-range').value = v; $('p-range').style.setProperty('--v', v + '%');
    $('p-vol').classList.toggle('muted', LG.muted);
  };
  paint();
  $('p-lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.v !== LG.lang()) LG.setLang(b.dataset.v); });
  // значок — вимкнути/увімкнути; повзунок — гучність (і вмикає звук)
  $('p-mute').addEventListener('click', () => { LG.muted = !LG.muted; LG.store.set('muted', LG.muted); if (!LG.muted) LG.play('tap'); paint(); });
  $('p-range').addEventListener('input', e => { LG.volume = +e.target.value / 100; LG.store.set('volume', LG.volume); if (LG.muted && LG.volume > 0) { LG.muted = false; LG.store.set('muted', false); } paint(); });
  $('p-range').addEventListener('change', () => LG.play('tap'));
  $('p-pieces').appendChild(LG.pieceSetPicker(() => { renderLearn(); renderPractice(); }));
  // дошки Lichess: вибір зберігається й діє в усіх уроках та іграх
  const boardVar = () => { const t = BOARD_THEMES.find(x => x.id === LG.boardTheme()) || BOARD_THEMES[0]; $('view-profile').style.setProperty('--board-img', `url('${boardUrl('thumbs/' + t.id + '.webp')}')`); };
  boardVar();
  const paintBoards = () => { boardVar(); $('p-boards').innerHTML = BOARD_THEMES.map(t => `<button type="button" data-t="${t.id}" class="${LG.boardTheme() === t.id ? 'on' : ''}" aria-label="${t.id}"><img src="${boardUrl('thumbs/' + t.id + '.webp')}" alt="" decoding="sync"></button>`).join(''); };
  paintBoards();
  $('p-boards').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LG.setBoardTheme(b.dataset.t); LG.play('tap'); paintBoards(); });
  // перемикачі: крапки ходів і репліки суперника
  const sw = (id, key, def) => {
    const paint = () => $(id).classList.toggle('on', !!LG.store.get(key, def));
    paint();
    $(id).addEventListener('click', () => { LG.store.set(key, !LG.store.get(key, def)); LG.play('tap'); paint(); });
  };
  // повний екран: вмикається одразу (це дотик), і на інших сторінках — з першим дотиком
  if ($('p-fs')) {
    const paintFs = () => $('p-fs').classList.toggle('on', !!LG.store.get('fullscreen', false));
    paintFs();
    $('p-fs').addEventListener('click', () => { LG.fullscreen.set(!LG.store.get('fullscreen', false)); LG.play('tap'); paintFs(); });
    document.addEventListener('fullscreenchange', paintFs);
  }
  sw('p-dots', 'showDests', true); sw('p-coords', 'coords', true);
  $('p-coords').addEventListener('click', () => document.documentElement.classList.toggle('lg-nocoords', !LG.store.get('coords', true))); sw('p-say', 'oppSay', false); // репліки суперника типово вимкнені
  const paintLim = () => document.querySelectorAll('[data-lim]').forEach(g => g.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(LG.store.get(g.dataset.lim, '3')) === b.dataset.v)));
  paintLim();
  $('view-profile').querySelectorAll('[data-lim]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LG.store.set(g.dataset.lim, b.dataset.v); LG.play('tap'); paintLim(); const em = $('view-profile').querySelector('.mg-more em'); if (em) em.firstChild.textContent = `${LG.store.get('hints', '3') === 'inf' ? '∞' : LG.store.get('hints', '3')} підказки · ${LG.store.get('undos', '3') === 'inf' ? '∞' : LG.store.get('undos', '3')} ходів назад`; }));
  $('p-reset').addEventListener('click', () => {
    if (!confirm('Скинути весь прогрес уроків, задач і ігор?')) return;
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && (k.startsWith('chk:') && !/^chk:(muted|volume|pieceSet|boardTheme|hints|undos|play:side|showDests|lang|oppSay|botThink|fullscreen)$/.test(k) || k === 'chk.learn.progress')) localStorage.removeItem(k); }
    seen.clear(); renderAll(); renderProfile();
  });
}

// ---------- вкладки ----------
const TITLES = { learn: 'Уроки', play: 'Гра з роботом', practice: 'Практика', profile: 'Профіль' };
// ---------- без блимання: вкладка з'являється одразу вся, коли її картинки (і фони-сцени) вже завантажені ----------
const imgReady = new Map(); // url → Promise
function loadImg(url) {
  if (!imgReady.has(url)) imgReady.set(url, new Promise(res => { const im = new Image(); im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(res); im.onerror = res; im.src = url; }));
  return imgReady.get(url);
}
const urlsIn = el => [...el.querySelectorAll('img[src]')].map(i => i.src).concat([...(el.innerHTML + (el.getAttribute('style') || '')).matchAll(/url\((?:&quot;|["'])?([^"')&]+)/g)].map(m => new URL(m[1], location.href).href));
const loaded = new Set();
const frames = (n, f) => requestAnimationFrame(() => (n > 1 ? frames(n - 1, f) : f())); // кілька кадрів — щоб браузер устиг намалювати SVG-сцени
function gate(view) {
  const urls = urlsIn(view).filter(u => !loaded.has(u));
  const fonts = document.fonts && document.fonts.status !== 'loaded' ? document.fonts.ready : null;
  if (!urls.length && !fonts) { view.classList.remove('lg-wait'); return; }
  view.classList.add('lg-wait');
  const imgs = [...view.querySelectorAll('img')].filter(i => !i.complete || !loaded.has(i.src));
  imgs.forEach(i => { i.decoding = 'sync'; });
  const all = Promise.all(urls.map(u => loadImg(u).then(() => loaded.add(u))).concat(fonts || [], imgs.map(i => (i.decode ? i.decode() : Promise.resolve()).catch(() => {}))));
  Promise.race([all, new Promise(r => setTimeout(r, 3000))]).then(() => frames(4, () => view.classList.remove('lg-wait')));
}
// поки дитина на першій вкладці — тихо довантажуємо картинки інших (суперники, їхні сцени, дошки, фігури)
function preloadRest() {
  const urls = OPPONENTS.map(o => o.thumb).concat(BOARD_THEMES.map(t => boardUrl('thumbs/' + t.id + '.webp')), [boardUrl((BOARD_THEMES.find(t => t.id === LG.boardTheme()) || BOARD_THEMES[0]).file)], OPPONENTS.flatMap(o => [o.avatar, o.sceneUrl]));
  let k = 0; const next = () => { if (k >= urls.length) return; const u = urls[k++]; loadImg(u).then(() => { loaded.add(u); next(); }); };
  for (let j = 0; j < 4; j++) next();
}
function show(hash) {
  let [tab, sub] = String(hash || '').split('/');
  if (!TITLES[tab]) tab = 'learn';
  document.querySelectorAll('.ap-view').forEach(v => { v.hidden = v.dataset.tab !== tab; });
  document.querySelectorAll('.ap-tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  $('sheet').hidden = true;
  try { sessionStorage.setItem('chk:back', location.href.split('#')[0] + '#' + tab + (tab === 'practice' && sub ? '/' + sub : '')); } catch (e) { /* */ }
  if (tab === 'practice') renderPractice(sub);
  if (tab === 'profile') renderProfile();
  if (tab === 'play') renderPlay();
  if (tab === 'learn') requestAnimationFrame(drawRoad);
  else window.scrollTo(0, 0);
  gate(document.querySelector(`.ap-view[data-tab="${tab}"]`));
}
function renderAll() { renderLearn(); renderPractice(); }
// відкрите посилання уроку зараховується
document.addEventListener('click', e => {
  const a = e.target.closest('a.ap-row, a.ap-tile'); if (!a) return;
  seen.add(a.getAttribute('href')); LG.store.set('path:seen', [...seen]);
});
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
renderAll();
renderProfile();
show(location.hash.slice(1) || 'learn');
addEventListener('load', () => setTimeout(preloadRest, 200));
window.addEventListener('pageshow', e => { if (e.persisted) { renderAll(); show(location.hash.slice(1) || 'learn'); } });
