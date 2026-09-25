/* Кружечки рівнів угорі уроку (як в уроках фігур): зелений ✓ — без помилок, жовтий ✓ — з помилками,
   поточний — з обводкою, далі — закриті, доки не пройдено попередній. Результати — LG.store 'lvl:<ключ>'. */
export function createLevels(el, key, n, onPick) {
  const LG = window.LG, get = () => LG.store.get('lvl:' + key, []);
  let cur = 0;
  const open = () => { const r = get(); let i = 0; while (i < n - 1 && r[i]) i++; return i; };
  function render() {
    const r = get(), o = open();
    el.innerHTML = Array.from({ length: n }, (_, i) => {
      const st = r[i] === 'perfect' ? 'done perfect' : r[i] ? 'done passed' : i <= o ? 'open' : 'locked';
      return `<button type="button" class="lv ${st}${i === cur ? ' cur' : ''}" data-i="${i}" ${i > o && !r[i] ? 'disabled' : ''}>${r[i] ? '✓' : i + 1}</button>`;
    }).join('');
  }
  el.addEventListener('click', e => { const b = e.target.closest('.lv'); if (!b || b.disabled) return; onPick(+b.dataset.i); });
  return {
    open,
    set(i) { cur = i; render(); },
    // рівень пройдено: perfect — без помилок (жовтий не «перефарбовує» зелений)
    done(i, perfect) { const r = get(); if (r[i] !== 'perfect') r[i] = perfect ? 'perfect' : 'passed'; LG.store.set('lvl:' + key, r); render(); },
    render
  };
}

/* Кінець уроку — так само, як в уроках Lichess: три зірочки, «Урок «…» пройдено!», рахунок,
   «Далі: наступний урок ›» і «‹ До уроків». Без відео-нагороди.
   Зірочки й рахунок — з кружечків рівнів (зелений — 500, жовтий — 300 очок). */
export function lessonDone({ title, text, key, n, here, onAgain }) {
  const LG = window.LG, ROOT = new URL('..', import.meta.url).href;
  const r = LG.store.get('lvl:' + key, []);
  let score = 0; for (let i = 0; i < n; i++) score += r[i] === 'perfect' ? 500 : r[i] ? 300 : 0;
  const max = n * 500, rank = score >= max ? 3 : score >= max - Math.max(200, n * 150) ? 2 : 1;
  if (!document.getElementById('lg-done-css')) {
    const st = document.createElement('style'); st.id = 'lg-done-css';
    st.textContent = `
.lg-done { position: fixed; inset: 0; z-index: 2000; display: grid; background: rgba(0,0,0,.6); cursor: pointer; }
.lg-done-box { margin: auto; box-sizing: border-box; width: min(340px, calc(100vw - 32px)); max-height: 100%; overflow: auto; padding: 20px 14px 14px; border-radius: 16px; text-align: center; cursor: default;
  background: rgb(35,34,80); color: rgb(186,186,186); font-family: 'Noto Sans', var(--lg-font), sans-serif; box-shadow: 0 14px 28px rgba(0,0,0,.15), 0 10px 10px rgba(0,0,0,.12); }
.lg-done-box > * { animation: lgDoneIn 1s cubic-bezier(.37,.82,.2,1) both; }
.lg-done-box > :nth-child(2) { animation-duration: 1.5s; } .lg-done-box > :nth-child(3) { animation-duration: 2s; } .lg-done-box > :nth-child(4) { animation-duration: 2.5s; } .lg-done-box > :nth-child(5) { animation-duration: 3s; }
@keyframes lgDoneIn { from { opacity: 0; filter: blur(15px); } }
.lg-done .stars { margin-bottom: 8px; }
.lg-done .star-wrap { display: inline-block; width: 55px; height: 55px; margin: 0 5px; position: relative; }
.lg-done .star-wrap::before { content: ''; position: absolute; top: 5px; left: 5px; width: 45px; height: 45px; background: url("${ROOT}lessons/assets/images/learn/star.png") center / cover; filter: saturate(0); opacity: .2; }
.lg-done .star { display: inline-block; width: 55px; height: 55px; background: url("${ROOT}lessons/assets/images/learn/star.png") center / cover; opacity: 0; animation: lgStar 2.5s ease-in-out .1s forwards; }
.lg-done .star-wrap:nth-child(2) .star { animation-delay: .8s; } .lg-done .star-wrap:nth-child(3) .star { animation-delay: 1.6s; }
@keyframes lgStar { 0% { opacity: .5; transform: scale(0) rotate(-360deg); } 85% { opacity: 1; transform: scale(1.3) rotate(10deg); } 100% { opacity: 1; transform: none; } }
.lg-done h1 { margin: 6px 0; font-size: 22px; font-weight: 700; color: #ccc; }
.lg-done .score { display: block; margin-bottom: 10px; color: rgb(191,129,29); font-size: 10.4px; text-transform: uppercase; letter-spacing: 1px; }
.lg-done .score b { font-family: monospace; font-size: 1rem; }
.lg-done p { margin: 6px 0; font-size: 14px; line-height: 22px; }
.lg-done .buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.lg-done button { display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 48px; padding: 12px 10px; border: 0; border-radius: 7px; font: 500 15px 'Noto Sans', var(--lg-font), sans-serif; text-transform: uppercase; cursor: pointer;
  background: rgb(54,146,231); color: #fff; box-shadow: inset 0 1px 3px -2px #c8e1f9, inset 0 -4px 8px -4px #1464ad, 0 1px 3px rgba(0,0,0,.2); }
.lg-done button.empty { background: transparent; color: rgb(54,146,231); box-shadow: none; }`;
    document.head.appendChild(st);
  }
  import('./path.js?v=1790325000').then(({ nextAfter, goNext, markSeen }) => {
    markSeen(here);
    const next = nextAfter(here);
    const o = document.createElement('div'); o.className = 'lg-done';
    o.innerHTML = `<div class="lg-done-box">
      <div class="stars">${[1, 2, 3].map(i => `<div class="star-wrap">${rank >= i ? '<i class="star"></i>' : ''}</div>`).join('')}</div>
      <h1></h1><span class="score">Ваш рахунок: <b>0</b></span><p></p>
      <div class="buttons">${next ? '<button type="button" class="next"></button>' : ''}<button type="button" class="empty home">‹ До уроків</button></div></div>`;
    o.querySelector('h1').textContent = `Урок «${title}» пройдено!`;
    o.querySelector('p').textContent = text || '';
    if (next) o.querySelector('.next').textContent = 'Далі: ' + next.title + ' ›';
    document.body.appendChild(o);
    LG.playFile(ROOT + 'lessons/assets/sound/other/gewonnen.mp3', 0.5);
    // рахунок «набігає», як на Lichess
    const b = o.querySelector('.score b'), t0 = performance.now() + 300;
    const tick = t => { const k = Math.min(1, Math.max(0, (t - t0) / 3000)); b.textContent = Math.round(score * k); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    o.querySelector('.next')?.addEventListener('click', () => goNext(here));
    o.querySelector('.home').addEventListener('click', () => { (window.LG && LG.go ? LG.go : h => { location.href = h; })(ROOT + 'index.html#learn'); });
    o.addEventListener('click', e => { if (e.target === o) { o.remove(); onAgain && onAgain(); } });
  });
}
