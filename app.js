/* Шахи для дітей: застосунок із чотирма вкладками.
   🎓 Уроки — дорога з 22 кроків (3 у ряд, змійкою знизу вгору), тап — аркуш «урок · задачі · гра»;
   🤖 Гра — вибір суперника, кольору, сили й режиму → партія з роботом;
   🎯 Практика — задачі, фігури проти пішаків, мат роботу, головоломки;
   👤 Профіль — прогрес, звук (значок — вимкнути, повзунок — гучність), набір фігур.
   Сторінки ігор і уроків відкриваються окремо; 🏠 у них повертає на ту саму вкладку. */
import { OPPONENTS, LEVEL_NAMES } from './shared/opponent.js?v=1790316395';
import { BOARD_THEMES, boardUrl } from './shared/board.js?v=1790316395';
import { SECTIONS, STEPS, P, W } from './shared/path.js?v=1790316395';

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
let curStep = 0;
function renderLearn() {
  curStep = STEPS.findIndex((_, i) => !stepDone(i)); if (curStep < 0) curStep = STEPS.length - 1;
  const rows = Math.ceil(STEPS.length / 3);
  // рядок r знизу: парні — зліва направо, непарні — справа наліво
  const cells = STEPS.map(([ic, title], i) => {
    const r = Math.floor(i / 3), k = i % 3, col = r % 2 ? 3 - k : k + 1, sec = secOf(i);
    return `<button type="button" class="ap-node${stepDone(i) ? ' done' : ''}${i === curStep ? ' cur' : ''}" id="s${i}" data-i="${i}" style="grid-row:${rows - r};grid-column:${col};--c:${sec[2]}">
      <span class="ap-dot">${icon(ic)}<span class="n">${i + 1}</span></span><b>${esc(title)}</b></button>`;
  }).join('');
  $('road').innerHTML = '<svg class="ap-road-svg" id="road-svg" aria-hidden="true"></svg>' + cells;
  $('secbar').innerHTML = SECTIONS.map(([from, name, c], si) => {
    const to = (SECTIONS[si + 1] || [STEPS.length])[0], n = STEPS.slice(from, to).filter((_, j) => stepDone(from + j)).length;
    return `<button type="button" data-s="${from}" style="--c:${c}"><i></i>${name} <small>${n}/${to - from}</small></button>`;
  }).join('');
  requestAnimationFrame(drawRoad);
}
// Дорога між кружечками: широка «смуга», пунктир посередині й зелений пройдений шлях
function drawRoad() {
  const road = $('road'), svg = $('road-svg'); if (!road || road.offsetParent === null) return;
  const base = road.getBoundingClientRect();
  const pts = STEPS.map((_, i) => { const d = $('s' + i).querySelector('.ap-dot').getBoundingClientRect(); return [d.left + d.width / 2 - base.left, d.top + d.height / 2 - base.top]; });
  const path = list => list.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
  svg.innerHTML = `<path class="bed" d="${path(pts)}"/><path class="dash" d="${path(pts)}"/>` + (curStep > 0 ? `<path class="done" d="${path(pts.slice(0, curStep + 1))}"/>` : '');
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
  const links = STEPS[+n.dataset.i][3];
  if (links.length === 1) { // один пункт — одразу його, без аркуша
    const href = links[0][2]; seen.add(href); LG.store.set('path:seen', [...seen]);
    if (href.startsWith('#')) location.hash = href; else location.href = href;
    return;
  }
  openStep(+n.dataset.i);
});
$('secbar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) $('s' + b.dataset.s).scrollIntoView({ block: 'center', behavior: 'smooth' }); });
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
function renderPlay() {
  const dots = n => `<span class="ap-lv">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'f' : ''}"></i>`).join('')}</span>`;
  const sides = [['w', piece('K', 'w') + 'Білі'], ['b', piece('K', 'b') + 'Чорні'], ['r', '<span class="big">🎲</span>']];
  $('view-play').innerHTML = `<h2 class="ap-h">З ким граємо?</h2><div class="ap-opprows">${ROWS.map((row, r) => `
    <div class="ap-opprow"><span class="ap-rowlv">${dots(r + 1)}</span>${row.map(i => `<a class="ap-opp" href="chess/index.html?opp=${i}&side=${side}&level=${r + 1}" aria-label="${esc(OPPONENTS[i].name)}"><img src="${OPPONENTS[i].avatar}" alt="" style="object-position:${OPPONENTS[i].pos}${OPPONENTS[i].toon ? `;background:url('${OPPONENTS[i].sceneUrl}') center/cover` : ''}"></a>`).join('')}</div>`).join('')}
    </div><p class="ap-sub ap-hint">Угорі — найлегші, унизу — найсильніші</p>
    <h2 class="ap-h">Я граю</h2><div class="ap-seg ap-sideseg" id="side-seg">${sides.map(([v, inner]) => `<button type="button" data-v="${v}" class="${side === v ? 'on' : ''}" aria-label="${{ w: 'Білими', b: 'Чорними', r: 'Будь-якими' }[v]}">${inner}</button>`).join('')}</div>`;
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
  { id: 'tactics', ic: '🍴', t: 'Тактика', s: 'вилка, зв’язка, прострел…', c: '#FF9F1C', groups: [
    [null, [['🍴', 'Вилка', '', P('fork')], ['📌', 'Зв’язка', '', P('pin')], ['🏹', 'Прострел', '', P('skewer')], ['💥', 'Відкритий напад', '', P('discovered')],
      ['🎣', 'Відволікання', '', P('deflection')], ['🧲', 'Заманювання', '', P('attraction')], ['🎁', 'Незахищена фігура', '', P('hanging')], ['👑', 'Пішак у ферзі', '', P('promotion')]]]] },
  { id: 'endgame', ic: ['K', 'Q'], t: 'Постав мат роботу', s: 'скільки завгодно ходів — головне мат', c: '#2ECC9A', groups: [
    [null, [[['K', 'Q'], 'Ферзь і король', '', P('kqk')], [['K', 'R'], 'Тура і король', '', P('krk')], [['K', 'B', 'B'], 'Два слони', '', P('kbbk')], [['K', 'P'], 'Король і пішак', '', P('kpk')]]]] },
  { id: 'pvp', ic: ['Q', 'vs', 'P'], t: 'Фігури проти пішаків', s: 'не пропусти жодного пішака до краю', c: '#7C6CF0', groups: [
    [null, [[['Q', 'vs', 'P'], 'Ферзь проти 8', '', W('q_p8')], [['R', 'vs', 'P'], 'Тура проти 5', '', W('r_p5')], [['B', 'vs', 'P'], 'Слон проти 3', '', W('b_p3')],
      [['N', 'vs', 'P'], 'Кінь проти 3', '', W('n_p3')], [['B', 'B', 'vs', 'P'], '2 слони проти 8', '', W('bb_p8')], [['N', 'N', 'vs', 'P'], '2 коні проти 6', '', W('nn_p6')]]]] },
  { id: 'games', ic: '⭐', t: 'Ігри й головоломки', s: 'пішакова битва, хід конем, 8 ферзів', c: '#8C6CF0', groups: [
    [null, [[['P', 'vs', 'P'], 'Пішакова битва', 'хто перший до краю', 'pawns/index.html'], [['N'], 'Хід конем', 'обійди всю дошку', 'knights-tour/index.html'], [['Q'], '8 ферзів', 'щоб ніхто нікого не бив', 'eight-queens/index.html']]]] }
];
const art = ic => {
  const vs = Array.isArray(ic) ? ic.indexOf('vs') : -1; // до «vs» — білі фігури, після — чорні
  return Array.isArray(ic) ? ic.map((x, j) => x === 'vs' ? '<span>vs</span>' : piece(x, vs >= 0 && j > vs ? 'b' : 'w')).join('') : /^[PRBQNK]$/.test(ic) ? piece(ic) : `<span class="emo">${ic}</span>`;
};
// скільки задач розділу вже розв'язано (chess-puzzles зберігає chk:puz:<розділ>)
const solvedOf = hrefs => hrefs.reduce((n, h) => { const k = h.startsWith('chess-puzzles/') && h.split('#')[1]; return n + (k ? (LG.store.get('puz:' + k, []) || []).length : 0); }, 0);
const catLinks = c => c.href ? [c.href] : c.groups.flatMap(([, items]) => items.map(x => x[3]));
function renderPractice(open) {
  const cat = PRACTICE.find(c => c.id === open && c.groups);
  if (!cat) {
    $('view-practice').innerHTML = `<h2 class="ap-h">Практика</h2><div class="ap-cats">${PRACTICE.map(c => {
      const n = solvedOf(catLinks(c));
      return `<a class="ap-cat" href="${c.href || '#practice/' + c.id}" style="--c:${c.c}"><span class="pcs">${art(c.ic)}</span>
        <span class="tx"><b>${esc(c.t)}</b><small>${esc(c.s)}</small></span>${n ? `<span class="ap-cnt">✓ ${n}</span>` : ''}<span class="chev">›</span></a>`;
    }).join('')}</div>`;
    return;
  }
  $('view-practice').innerHTML = `<div class="ap-subhead"><a class="ap-backbtn" href="#practice" aria-label="Назад">‹</a><span class="pcs" style="--c:${cat.c}">${art(cat.ic)}</span><h2>${esc(cat.t)}</h2></div>` +
    cat.groups.map(([h, items]) => `${h ? `<h3 class="ap-h3">${esc(h)}</h3>` : ''}<div class="ap-tiles ap-subtiles">${items.map(([ic, t, sub, href]) => {
      const n = solvedOf([href]);
      return `<a class="ap-tile" href="${href}" style="--c:${cat.c}"><span class="pcs">${art(ic)}</span><b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${n ? `<span class="ap-cnt">✓ ${n}</span>` : ''}</a>`;
    }).join('')}</div>`).join('');
}

// ---------- 👤 профіль ----------
function solvedPuzzles() {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('chk:puz:')) try { n += JSON.parse(localStorage.getItem(k)).length; } catch (e) { /* */ } }
  return n;
}
function renderProfile() {
  const st = LG.stats(), wins = Object.values(st).reduce((a, s) => a + (s.wins || 0), 0), d = doneCount();
  // Компактно: шапка з прогресом і цифрами, далі — рядки «назва ліворуч, керування праворуч»
  $('view-profile').innerHTML = `
    <div class="pf-head"><span class="av">${piece('K')}</span><div class="pf-me"><b>Юний шахіст</b><small>Крок ${Math.min(d + 1, STEPS.length)} з ${STEPS.length}</small><div class="bar"><i style="width:${Math.round(100 * d / STEPS.length)}%"></i></div>
      <div class="pf-stats"><span><b>${d}</b> кроків</span><span><b>${solvedPuzzles()}</b> задач</span><span><b>${wins}</b> перемог</span></div></div></div>
    <div class="pf-list">
      <div class="pf-row"><span class="pf-l">🌐 Мова</span><div class="ap-seg pf-seg" id="p-lang">${[['uk', '🇺🇦 UA'], ['en', '🇬🇧 EN']].map(([v, t]) => `<button type="button" data-v="${v}" class="${LG.lang() === v ? 'on' : ''}">${t}</button>`).join('')}</div></div>
      <div class="pf-row"><span class="pf-l">Звук</span><div class="ap-vol" id="p-vol"><button type="button" id="p-mute" aria-label="Звук"></button><input type="range" min="0" max="100" step="5" id="p-range" aria-label="Гучність"></div></div>
      <div class="pf-row pf-col"><span class="pf-l">Дошка</span><div class="ap-boards" id="p-boards"></div></div>
      <div class="pf-row pf-col" id="p-pieces"><span class="pf-l">Фігури</span></div>
      <div class="pf-row"><span class="pf-l">🟢 Крапки ходів</span><button type="button" class="pf-sw" id="p-dots" aria-label="Крапки ходів"></button></div>
    </div>
    <h3 class="pf-h">Гра з роботом</h3>
    <div class="pf-list">
      <div class="pf-row"><span class="pf-l">💡 Підказки</span><div class="ap-seg pf-lim" data-lim="hints">${['1', '3', '5', 'inf'].map(v => `<button type="button" data-v="${v}">${v === 'inf' ? '<span class="inf">∞</span>' : v}</button>`).join('')}</div></div>
      <div class="pf-row"><span class="pf-l">↩️ Ходи назад</span><div class="ap-seg pf-lim" data-lim="undos">${['1', '3', '5', 'inf'].map(v => `<button type="button" data-v="${v}">${v === 'inf' ? '<span class="inf">∞</span>' : v}</button>`).join('')}</div></div>
      <div class="pf-row"><span class="pf-l">💬 Репліки суперника</span><button type="button" class="pf-sw" id="p-say" aria-label="Репліки суперника"></button></div>
    </div>
    <button type="button" class="pf-reset" id="p-reset">Скинути прогрес</button>`;
  const paint = () => {
    const v = Math.round(LG.volume * 100);
    $('p-mute').textContent = LG.muted || v === 0 ? '🔇' : v < 40 ? '🔈' : v < 75 ? '🔉' : '🔊';
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
  const boardVar = () => { const t = BOARD_THEMES.find(x => x.id === LG.boardTheme()) || BOARD_THEMES[0]; $('view-profile').style.setProperty('--board-img', `url('${boardUrl(t.file)}')`); };
  boardVar();
  const paintBoards = () => { boardVar(); $('p-boards').innerHTML = BOARD_THEMES.map(t => `<button type="button" data-t="${t.id}" class="${LG.boardTheme() === t.id ? 'on' : ''}" style="background-image:url('${boardUrl(t.file)}')" aria-label="${t.id}"></button>`).join(''); };
  paintBoards();
  $('p-boards').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LG.setBoardTheme(b.dataset.t); LG.play('tap'); paintBoards(); });
  // перемикачі: крапки ходів і репліки суперника
  const sw = (id, key) => {
    const paint = () => $(id).classList.toggle('on', !!LG.store.get(key, true));
    paint();
    $(id).addEventListener('click', () => { LG.store.set(key, !LG.store.get(key, true)); LG.play('tap'); paint(); });
  };
  sw('p-dots', 'showDests'); sw('p-say', 'oppSay');
  const paintLim = () => document.querySelectorAll('[data-lim]').forEach(g => g.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(LG.store.get(g.dataset.lim, '3')) === b.dataset.v)));
  paintLim();
  $('view-profile').querySelectorAll('[data-lim]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LG.store.set(g.dataset.lim, b.dataset.v); LG.play('tap'); paintLim(); }));
  $('p-reset').addEventListener('click', () => {
    if (!confirm('Скинути весь прогрес уроків, задач і ігор?')) return;
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && (k.startsWith('chk:') && !/^chk:(muted|volume|pieceSet|boardTheme|hints|undos|play:side|showDests|lang|oppSay)$/.test(k) || k === 'chk.learn.progress')) localStorage.removeItem(k); }
    seen.clear(); renderAll(); renderProfile();
  });
}

// ---------- вкладки ----------
const TITLES = { learn: 'Уроки', play: 'Гра з роботом', practice: 'Практика', profile: 'Профіль' };
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
  if (tab === 'learn') requestAnimationFrame(() => { drawRoad(); $('s' + curStep)?.scrollIntoView({ block: 'center' }); });
  else window.scrollTo(0, 0);
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
window.addEventListener('pageshow', e => { if (e.persisted) { renderAll(); show(location.hash.slice(1) || 'learn'); } });
