// Відео-знайомство перед уроком: екран із відео, коротким поясненням і кнопкою «До вправ».
// Ключ — кінець адреси сторінки (як у shared/path.js). Після оновлення сторінки не показується.
(function () {
  const V = {
    'lessons/check.html': ['iPBN2X9sYRE', 'Що таке шах?', 'Шах — це напад на короля. Королю треба одразу рятуватися: утекти, закритися або побити фігуру, що шахує.'],
    'lessons/lesson.html#promo': ['xwNtd8XqLME', 'Особливі пішаки', 'Пішак, що дійшов до останнього ряду, стає будь-якою фігурою — найчастіше ферзем. А ще пішак уміє бити «на проході».'],
    'lessons/lesson.html#draw': ['y6TpamnFLoc', 'Що таке пат?', 'Пат — коли королю не шах, але ходити нікуди. Це нічия! Коли виграєш, стеж, щоб у суперника лишився хід.'],
    'lessons/lesson.html#mates': ['OrkJYbWSL_U', 'Мат на останній горизонталі', 'Король сховався за своїми пішаками — і тура чи ферзь ставить мат на останньому ряду.'],
    'lessons/lesson.html#opening': ['ANKqfTYV9Tk', 'Початок гри', 'Займи центр пішаками, виведи коней і слонів, зроби рокіровку — і лише тоді в атаку.'],
    'lessons/value.html': ['ngqhzEKTF_Q', 'Вчимося рахувати', 'Пішак — 1, кінь і слон — 3, тура — 5, ферзь — 9. Міняйся лише тоді, коли отримуєш більше, ніж віддаєш.'],
    'chess-puzzles/index.html?lesson=1#hanging': ['71051OelIo4', 'Незахищені фігури', 'Фігура, яку ніхто не захищає, — легка здобич. Шукай такі фігури в суперника й бий їх!'],
    'chess-puzzles/index.html?lesson=1#skewer': ['4Fw6-5z2HF4', 'Лінійний удар (простріл)', 'Нападаєш на цінну фігуру, вона тікає — і ти б’єш ту, що стояла за нею на тій самій лінії.'],
    'chess-puzzles/index.html?lesson=1#fork': ['jNRNkxtbitM', 'Вилка', 'Одна фігура нападає одразу на дві. Суперник урятує лише одну — другу ти заберешь!'],
    'chess-puzzles/index.html?lesson=1#pin': ['yjhOs-pZrn0', 'Зв’язка', 'Фігура не може піти, бо за нею стоїть король або цінніша фігура. Нападай на зв’язану фігуру!'],
    'chess-puzzles/index.html?lesson=1#discovered': ['0jRcaB4wykA', 'Відкритий напад і подвійний шах', 'Одна фігура відходить — і відкриває напад іншої, що стояла позаду. Якщо обидві дають шах — це подвійний шах!'],
  };
  const here = () => { const u = location.pathname + location.search + location.hash; return Object.keys(V).find(k => u.endsWith(k)); };
  const css = `.lv-vid { position: fixed; left: 0; right: 0; bottom: 0; top: var(--fs-top, 0px); z-index: 3000; display: flex; flex-direction: column; padding: calc(16px + var(--tg-top, 0px) + env(safe-area-inset-top)) 0 calc(16px + env(safe-area-inset-bottom)); background: #1B2133; color: #fff; overflow: auto; box-sizing: border-box; }
.lv-vid-in { margin: auto 0; display: flex; flex-direction: column; align-items: center; width: 100%; }
.lv-vid h2 { color: #fff; margin: 6px 16px 12px; font: 800 24px Manrope, var(--lg-font), sans-serif; text-align: center; }
.lv-vid-box { position: relative; width: 100vw; max-width: 560px; aspect-ratio: 1; overflow: hidden; background: #000; flex: none; }
.lv-vid-box iframe { position: absolute; top: 0; left: 50%; height: 100%; aspect-ratio: 16 / 9; transform: translateX(-50%); border: 0; }
.lv-vid p { margin: 12px 18px 0; max-width: 420px; font: 700 16px/1.4 Manrope, var(--lg-font), sans-serif; text-align: center; }
.lv-vid button { margin-top: 14px; min-height: 48px; padding: 0 28px; border: 0; border-radius: 16px; background: #2ee6b8; color: #04241d; font: 800 17px Manrope, var(--lg-font), sans-serif; box-shadow: 0 4px 0 #1a9c7c; cursor: pointer; }
body:has(.lv-vid) .lg-nav { display: none !important; }`;
  function show(k) {
    const v = V[k]; if (!v || document.querySelector('.lv-vid')) return;
    if (!document.getElementById('lv-vid-css')) { const s = document.createElement('style'); s.id = 'lv-vid-css'; s.textContent = css; document.head.appendChild(s); }
    const o = document.createElement('div'); o.className = 'lv-vid';
    o.innerHTML = '<div class="lv-vid-in"><h2></h2><div class="lv-vid-box"><iframe src="https://www.youtube-nocookie.com/embed/' + v[0] + '?playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Відео"></iframe></div><p></p><button type="button">До вправ ▶️</button></div>';
    o.querySelector('h2').textContent = v[1]; o.querySelector('p').textContent = v[2];
    o.querySelector('button').onclick = () => o.remove();
    try { sessionStorage.setItem('vid:last', k); } catch (e) { /* */ }
    document.body.appendChild(o);
  }
  // оновлення сторінки не показує відео вдруге (але сторінки, що перезавантажуються при зміні #, — показують нове)
  let last = null; try { last = sessionStorage.getItem('vid:last'); } catch (e) { /* */ }
  const reload = (performance.getEntriesByType('navigation')[0] || {}).type === 'reload';
  let cur = here();
  if (!(reload && last === cur)) (document.body ? show(cur) : document.addEventListener('DOMContentLoaded', () => show(cur)));
  addEventListener('hashchange', () => { const k = here(); if (k !== cur) { cur = k; show(k); } });
})();
