/* Шахи для дітей: застосунок із трьома вкладками.
   🎓 Уроки — змійка кроків знизу вгору (урок · задачі · гра); 🎯 Практика — усе для тренування; 👤 Профіль — прогрес і налаштування.
   Ігри й уроки відкриваються окремими сторінками; 🏠 у них повертає сюди, на ту саму вкладку. */
(function () {
  const $ = id => document.getElementById(id);
  const set = () => LG.pieceSet();
  const piece = (c, color = 'w') => `<img src="shared/pieces/${set()}/${color}${c}.svg" alt="">`;
  const icon = ic => /^[PRBQNK]$/.test(ic) ? piece(ic) : ic;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- кроки уроків ----------
  const L = n => 'learn-chess/index.html#/' + n;      // етап уроків Lichess
  const LS = k => 'chess-path/lesson.html#' + k;      // наш міні-урок
  const P = k => 'chess-puzzles/index.html#' + k;     // розділ задач
  const W = k => 'pieces-vs-pawns/index.html#' + k;   // фігури проти пішаків
  const SECTIONS = [[0, '♟️ Фігури', '#6C5CE7'], [6, '⚔️ Напад і захист', '#FF9F1C'], [10, '👑 Шах і мат', '#E74C3C'], [15, '✨ Особливі ходи й дебют', '#2ECC9A'], [18, '🏆 Майстер', '#3498DB']];
  const STEPS = [
    ['P', 'Пішак', 'Ходить уперед, б’є навскоси. І одразу — перша перемога!', [['📖', 'Урок', L(6)], ['🎮', 'Пішакова битва', 'pawns/index.html', 'play']]],
    ['R', 'Тура', 'Ходить прямо на скільки завгодно клітинок.', [['📖', 'Урок', L(1)], ['🎮', 'Тура проти 5 пішаків', W('r_p5'), 'play']]],
    ['B', 'Слон', 'Ходить навскоси і не міняє колір клітинок.', [['📖', 'Урок', L(2)], ['🎮', 'Слон проти 3 пішаків', W('b_p3'), 'play']]],
    ['Q', 'Ферзь', 'Тура + слон разом — найсильніша фігура.', [['📖', 'Урок', L(3)], ['🎮', 'Ферзь проти 8 пішаків', W('q_p8'), 'play']]],
    ['N', 'Кінь', 'Стрибає літерою «Г»: два прямо, один убік.', [['📖', 'Урок', L(5)], ['🎮', 'Кінь проти 3 пішаків', W('n_p3'), 'play']]],
    ['K', 'Король', 'Найважливіша фігура: ходить на одну клітинку.', [['📖', 'Урок', L(4)]]],
    ['⚔️', 'Напад', 'Постав фігуру так, щоб наступним ходом побити.', [['📖', 'Урок', LS('attack')]]],
    ['🍽️', 'Бий беззахисні', 'Забирай фігури, які ніхто не захищає.', [['📖', 'Урок', L(7)], ['🧩', 'Задачі', P('hanging'), 'task']]],
    ['🛡️', 'Захист', 'Напали на твою фігуру? Захисти її!', [['📖', 'Урок', LS('protect')], ['📖', 'Захист', L(8)], ['🎮', 'Битва', L(9), 'play']]],
    ['💰', 'Цінність фігур', 'Пішак 1, кінь і слон 3, тура 5, ферзь 9.', [['📖', 'Урок', 'learn-chess/value.html']]],
    ['⚠️', 'Шах', 'Напад на короля і три способи врятуватися.', [['📖', 'Урок', 'learn-chess/check.html'], ['🧩', 'Постав шах', P('chk_rook'), 'task'], ['🧩', 'Урятуйся', P('esc_mixed'), 'task']]],
    ['🏁', 'Мат', 'Шах, від якого нікуди подітися. Відомі мати.', [['📖', 'Урок', L(12)], ['📖', 'Відомі мати', LS('mates')], ['🧩', 'Мат в 1 хід', P('m1rook'), 'task'], ['🧩', 'Різні', P('m1mix'), 'task']]],
    ['♜', 'Мат двома турами', 'Тури по черзі заганяють короля до краю — «драбинка».', [['📖', 'Урок', LS('rooks')]]],
    ['♛', 'Мат ферзем', 'Ферзь заганяє, король допомагає.', [['📖', 'Урок', LS('queen')], ['🎮', 'Практика', P('kqk'), 'play']]],
    ['🤝', 'Пат і нічия', 'Коли ніхто не виграв — і як не зробити пат.', [['📖', 'Урок', LS('draw')], ['📖', 'Пат', L(16)]]],
    ['👑', 'Перетворення', 'Пішак стає ферзем. І взяття на проході.', [['📖', 'Урок', LS('promo')], ['📖', 'На проході', L(15)], ['🎮', 'Король і пішак', P('kpk'), 'play']]],
    ['🏰', 'Рокіровка', 'Сховай короля й виведи туру.', [['📖', 'Урок', L(14)]]],
    ['🚀', 'Дебют', 'Як починати гру: центр, фігури, рокіровка.', [['📖', 'Розстановка', L(13)], ['📖', 'Правила дебюту', LS('opening')]]],
    ['🍴', 'Тактика', 'Вилка, зв’язка, прострел та інші прийоми.', [['🧩', 'Вилка', P('fork'), 'task'], ['🧩', 'Зв’язка', P('pin'), 'task'], ['🧩', 'Прострел', P('skewer'), 'task'], ['🧩', 'Відкритий напад', P('discovered'), 'task']]],
    ['🏆', 'Мат у 2 ходи', 'Хід, відповідь суперника — і мат.', [['🧩', 'Задачі', P('mate2'), 'task']]],
    ['⭐', 'Бонус', 'Головоломки з фігурами.', [['🎮', 'Хід конем', 'knights-tour/index.html', 'play'], ['🎮', '8 ферзів', 'eight-queens/index.html', 'play']]],
    ['K', 'Шахи з роботом', 'Справжня партія! Обери рівень і колір.', [['🎮', 'Грати', 'chess/index.html', 'play']]]
  ];
  const seen = new Set(LG.store.get('path:seen', []));
  const stepDone = i => STEPS[i][3].every(l => seen.has(l[2]));
  const doneCount = () => STEPS.filter((_, i) => stepDone(i)).length;

  function renderLearn() {
    const X = [0, 55, 85, 55, 0, -55, -85, -55];
    let cur = STEPS.findIndex((_, i) => !stepDone(i)); if (cur < 0) cur = STEPS.length - 1;
    const secOf = i => SECTIONS.filter(x => x[0] <= i).pop();
    $('path').innerHTML = STEPS.map(([ic, title], i) => {
      const sec = secOf(i);
      return (sec[0] === i ? `<div class="ap-sec" style="--sec:${sec[2]}">${sec[1]}</div>` : '') +
        `<button type="button" class="ap-node${stepDone(i) ? ' done' : ''}${i === cur ? ' cur' : ''}" id="s${i}" data-i="${i}" style="--x:${X[i % X.length]}px;--sec:${sec[2]}">
          <span class="ap-dot">${icon(ic)}</span><b>${esc(title)}</b></button>`;
    }).join('');
    return cur;
  }
  const row = ([e, t, href, kind], sub) => `<a class="ap-row t-${kind || 'learn'}${seen.has(href) ? ' seen' : ''}" href="${href}"><span class="ic" style="--c:${kind === 'play' ? '#2ECC9A' : kind === 'task' ? '#FF9F1C' : '#6C5CE7'}">${e}</span><span>${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></a>`;
  function openStep(i) {
    const [, title, sub, links] = STEPS[i];
    $('card').innerHTML = `<h2>${i + 1}. ${esc(title)}</h2><p>${esc(sub)}</p>` + links.map(l => row(l)).join('');
    $('sheet').hidden = false;
  }
  $('path').addEventListener('click', e => { const n = e.target.closest('.ap-node'); if (n) openStep(+n.dataset.i); });
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').hidden = true; });

  // ---------- практика ----------
  const PRACTICE = [
    ['🧩 Задачі', [
      ['♖', 'Постав шах', P('chk_rook'), 'task', 'турою, слоном, конем…'], ['🛡️', 'Урятуйся від шаху', P('esc_mixed'), 'task', 'утечи, побий, закрийся'],
      ['🏁', 'Мат в 1 хід', P('m1mix'), 'task', 'різними фігурами'], ['🏆', 'Мат у 2 ходи', P('mate2'), 'task', 'хід, відповідь — мат'],
      ['🍴', 'Тактика', P('fork'), 'task', 'вилка, зв’язка, прострел'], ['📋', 'Усі розділи', 'chess-puzzles/index.html', 'task', 'повний список задач']]],
    ['🤖 Гра з роботом', [
      ['♚', 'Шахи', 'chess/index.html', 'play', 'обери рівень і колір'], ['♟️', 'Пішакова битва', 'pawns/index.html', 'play', 'хто перший дійде до краю']]],
    ['♜ Фігури проти пішаків', [
      ['♛', 'Ферзь проти 8', W('q_p8'), 'play'], ['♜', 'Тура проти 5', W('r_p5'), 'play'], ['♝', 'Слон проти 3', W('b_p3'), 'play'],
      ['♞', 'Кінь проти 3', W('n_p3'), 'play'], ['♝♝', '2 слони проти 8', W('bb_p8'), 'play'], ['♞♞', '2 коні проти 6', W('nn_p6'), 'play']]],
    ['🏁 Постав мат роботу', [
      ['♛', 'Ферзь і король', P('kqk'), 'play'], ['♜', 'Тура і король', P('krk'), 'play'], ['♝♝', 'Два слони', P('kbbk'), 'play'], ['♙', 'Король і пішак', P('kpk'), 'play']]],
    ['⭐ Головоломки', [['♘', 'Хід конем', 'knights-tour/index.html', 'play'], ['♕', '8 ферзів', 'eight-queens/index.html', 'play']]]
  ];
  function renderPractice() {
    $('view-practice').innerHTML = PRACTICE.map(([h, items], gi) => `<h2 class="ap-h">${h}</h2>` + (gi === 0 || gi === 1
      ? items.map(([e, t, href, kind, sub]) => row([e, t, href, kind], sub)).join('')
      : `<div class="ap-grid">${items.map(([e, t, href, kind]) => row([e, t, href, kind])).join('')}</div>`)).join('');
  }

  // ---------- профіль ----------
  function solvedPuzzles() {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('lg:puz:')) try { n += JSON.parse(localStorage.getItem(k)).length; } catch (e) { /* */ } }
    return n;
  }
  function renderProfile() {
    const st = LG.stats(), games = Object.values(st).reduce((a, s) => a + (s.wins || 0), 0);
    const v = $('view-profile');
    v.innerHTML = `<div class="ap-me"><span class="av">${piece('K')}</span><div><b>Юний шахіст</b><small>Крок ${Math.min(doneCount() + 1, STEPS.length)} з ${STEPS.length}</small></div></div>
      <div class="ap-stats"><div><b>${doneCount()}</b><span>кроків пройдено</span></div><div><b>${solvedPuzzles()}</b><span>задач розв’язано</span></div><div><b>${games}</b><span>перемог</span></div></div>
      <h2 class="ap-h">Налаштування</h2>
      <div class="ap-set"><label>🔊 Звук <input type="checkbox" class="ap-switch" id="p-sound"></label></div>
      <div class="ap-set"><label>Гучність <input type="range" min="0" max="100" step="5" class="lg-range" id="p-vol"></label></div>
      <div class="ap-set" id="p-pieces"></div>
      <button type="button" class="ap-danger" id="p-reset">Скинути прогрес</button>`;
    $('p-sound').checked = !LG.muted;
    $('p-sound').addEventListener('change', e => { LG.muted = !e.target.checked; LG.store.set('muted', LG.muted); if (!LG.muted) LG.play('tap'); });
    $('p-vol').value = Math.round(LG.volume * 100);
    $('p-vol').addEventListener('input', e => { LG.volume = +e.target.value / 100; LG.store.set('volume', LG.volume); });
    $('p-vol').addEventListener('change', () => LG.play('tap'));
    $('p-pieces').appendChild(LG.pieceSetPicker(() => { $('logo').innerHTML = piece('N'); renderLearn(); }));
    $('p-reset').addEventListener('click', () => {
      if (!confirm('Скинути весь прогрес уроків і задач?')) return;
      for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && (k.startsWith('lg:path') || k.startsWith('lg:puz:') || k.startsWith('lg:prac:') || k.startsWith('lg:lesson:') || k === 'learn.progress')) localStorage.removeItem(k); }
      seen.clear(); renderAll();
    });
  }

  // ---------- вкладки ----------
  const TITLES = { learn: 'Уроки', practice: 'Практика', profile: 'Профіль' };
  function show(tab) {
    if (!TITLES[tab]) tab = 'learn';
    document.querySelectorAll('.ap-view').forEach(v => { v.hidden = v.dataset.tab !== tab; });
    document.querySelectorAll('.ap-tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
    $('tab-title').textContent = TITLES[tab];
    try { sessionStorage.setItem('lg:back', location.href.split('#')[0] + '#' + tab); } catch (e) { /* */ }
    if (tab === 'profile') renderProfile();
    if (tab === 'learn') { const cur = renderLearn(); requestAnimationFrame(() => $('s' + cur)?.scrollIntoView({ block: 'center' })); }
    else window.scrollTo(0, 0);
  }
  function renderAll() { renderLearn(); renderPractice(); $('stat').textContent = `✅ ${doneCount()}/${STEPS.length}`; }
  // будь-яке посилання на урок/гру зараховується як «відкрито»
  document.addEventListener('click', e => {
    const a = e.target.closest('a.ap-row'); if (!a) return;
    seen.add(a.getAttribute('href')); LG.store.set('path:seen', [...seen]);
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  $('logo').innerHTML = piece('N');
  renderAll();
  show(location.hash.slice(1) || 'learn');
  window.addEventListener('pageshow', () => { renderAll(); show(location.hash.slice(1) || 'learn'); });
})();
