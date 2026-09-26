// Відео-знайомство перед уроком: екран із відео, коротким поясненням і кнопкою «До вправ».
// Ключ — кінець адреси сторінки (як у shared/path.js). Після оновлення сторінки не показується.
(function () {
  const ROOT = new URL('..', document.currentScript ? document.currentScript.src : location.href).href;
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
.lv-vid-box iframe { position: absolute; top: 50%; left: 50%; height: 100%; aspect-ratio: 16 / 9; transform: translate(-50%, -50%) scale(1.12); border: 0; pointer-events: none; }
.lv-vid-poster { position: absolute; inset: 0; background: #000 center / auto 150% no-repeat; transition: opacity .3s; }
.lv-vid-ui { position: absolute; inset: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.lv-vid-pp { position: absolute; left: 50%; top: 50%; width: 76px; height: 76px; margin: -38px 0 0 -38px; border-radius: 50%; background: rgba(0,0,0,.45); display: grid; place-items: center; transition: opacity .25s; }
.lv-vid-pp svg { width: 38px; height: 38px; fill: #fff; }
.lv-vid-bar { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 16px 10px; background: linear-gradient(transparent, rgba(0,0,0,.6)); transition: opacity .25s; cursor: default; }
.lv-vid-t { font: 800 20px Manrope, var(--lg-font), sans-serif; font-variant-numeric: tabular-nums; text-shadow: 0 1px 3px #000; }
.lv-vid-bar input { display: block; width: 100%; margin: 8px 0 0; accent-color: #fff; height: 28px; cursor: pointer; }
.lv-vid-box.playing.idle .lv-vid-pp, .lv-vid-box.playing.idle .lv-vid-bar { opacity: 0; }
.lv-vid-box.started .lv-vid-poster { opacity: 0; pointer-events: none; }
.lv-vid p, .lv-vid-box + p { margin: 12px 18px 0; max-width: 420px; font: 700 16px/1.4 Manrope, var(--lg-font), sans-serif; text-align: center; }
.lv-vid-go { margin-top: 14px; min-height: 48px; padding: 0 28px; border: 0; border-radius: 16px; background: #2ee6b8; color: #04241d; font: 800 17px Manrope, var(--lg-font), sans-serif; box-shadow: 0 4px 0 #1a9c7c; cursor: pointer; }
.lv-vid-yt { display: inline-block;  margin-top: 14px; color: #9fb0d8; font: 700 14px Manrope, var(--lg-font), sans-serif; }
body:has(.lv-vid) .lg-nav { display: none !important; }
.lv-vid-back { position: absolute; left: 12px; top: calc(10px + var(--tg-top, 0px) + env(safe-area-inset-top)); width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.08); color: #fff; display: grid; place-items: center; font: 700 30px/1 sans-serif; text-decoration: none; z-index: 1; }
html.lg-tg .lv-vid-back { display: none; }
.lv-vid { padding-top: calc(60px + var(--tg-top, 0px) + env(safe-area-inset-top)); }
html.lg-tg .lv-vid { padding-top: calc(16px + var(--tg-top, 0px) + env(safe-area-inset-top)); }`;
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>', PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  const mmss = t => { t = Math.max(0, Math.floor(t || 0)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  let api = null;
  const loadApi = () => api || (api = new Promise(res => {
    if (window.YT && YT.Player) return res(YT);
    const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { prev && prev(); res(YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  }));
  const addCss = () => { if (!document.getElementById('lv-vid-css')) { const s = document.createElement('style'); s.id = 'lv-vid-css'; s.textContent = css; document.head.appendChild(s); } };
  // квадратне відео з нашим керуванням: ▶/❚❚, «хв:сек / хв:сек», перемотка. Повертає { el, destroy }
  function player(id) {
    addCss();
    const el = document.createElement('div'); el.className = 'lv-vid-box';
    el.innerHTML = '<div class="lv-vid-yt-frame"></div><div class="lv-vid-poster"></div><div class="lv-vid-ui"><div class="lv-vid-pp">' + PLAY + '</div><div class="lv-vid-bar"><div class="lv-vid-t">00:00 / 00:00</div><input type="range" min="0" max="0" step="0.1" value="0" aria-label="Перемотка"></div></div>';
    el.querySelector('.lv-vid-poster').style.backgroundImage = 'url(https://i.ytimg.com/vi/' + id + '/hqdefault.jpg)';
    const ui = el.querySelector('.lv-vid-ui'), pp = el.querySelector('.lv-vid-pp'), tEl = el.querySelector('.lv-vid-t'), seek = el.querySelector('input');
    let p = null, dur = 0, dragging = false, tick = 0, idle = 0, dead = false;
    const draw = t => { if (!dragging) seek.value = t; tEl.textContent = mmss(t) + ' / ' + mmss(dur); };
    const wake = () => { el.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => el.classList.add('idle'), 2500); };
    ui.onclick = e => { if (e.target.closest('.lv-vid-bar') || !p || !p.getPlayerState) return; wake(); p.getPlayerState() === 1 ? p.pauseVideo() : p.playVideo(); };
    seek.oninput = () => { dragging = true; draw(+seek.value); wake(); };
    seek.onchange = () => { dragging = false; if (p) p.seekTo(+seek.value, true); wake(); };
    loadApi().then(Y => {
      if (dead) return;
      p = new Y.Player(el.querySelector('.lv-vid-yt-frame'), {
        videoId: id, host: 'https://www.youtube-nocookie.com',
        playerVars: { controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady: () => { dur = p.getDuration() || 0; seek.max = dur; draw(0); },
          onStateChange: e => {
            const on = e.data === 1;
            if (on) el.classList.add('started');
            el.classList.toggle('playing', on); pp.innerHTML = on ? PAUSE : PLAY;
            if (!dur) { dur = p.getDuration() || 0; seek.max = dur; }
            if (on) wake();
            if (e.data === 0) draw(dur);
          }
        }
      });
      tick = setInterval(() => { if (p && p.getCurrentTime && el.classList.contains('playing')) draw(p.getCurrentTime()); }, 250);
    });
    return { el, destroy() { dead = true; clearInterval(tick); clearTimeout(idle); try { p && p.destroy(); } catch (e) { /* */ } el.remove(); } };
  }
  const ytLink = id => { const a = document.createElement('a'); a.className = 'lv-vid-yt'; a.target = '_blank'; a.rel = 'noopener'; a.href = 'https://youtu.be/' + id; a.textContent = 'Дивитися на YouTube ↗'; return a; };
  // екран на весь застосунок: заголовок, відео, пояснення, «До вправ», посилання на YouTube
  function overlay([id, title, text], onClose) {
    if (document.querySelector('.lv-vid')) return;
    addCss();
    const o = document.createElement('div'); o.className = 'lv-vid';
    o.innerHTML = '<div class="lv-vid-in"><h2></h2><p></p><button type="button" class="lv-vid-go">До вправ ▶️</button></div>';
    o.querySelector('h2').textContent = title; o.querySelector('p').textContent = text;
    const pl = player(id); o.querySelector('h2').after(pl.el); o.querySelector('.lv-vid-in').appendChild(ytLink(id));
    o.querySelector('.lv-vid-go').onclick = () => { pl.destroy(); o.remove(); onClose && onClose(); };
    const back = document.createElement('a'); back.className = 'lv-vid-back'; back.href = ROOT + 'index.html#learn'; back.setAttribute('aria-label', 'До уроків'); back.textContent = '‹';
    back.onclick = e => { e.preventDefault(); pl.destroy(); (window.LG && LG.go ? LG.go : h => { location.href = h; })(back.href); };
    o.prepend(back);
    document.body.appendChild(o);
  }
  window.LGVideo = { player, overlay, ytLink };
  function show(k) {
    const v = V[k]; if (!v) return;
    overlay(v);
  }
  // відео показується щоразу, коли відкрили урок (і після оновлення сторінки теж)
  let cur = here();
  document.body ? show(cur) : document.addEventListener('DOMContentLoaded', () => show(cur));
  addEventListener('hashchange', () => { const k = here(); if (k !== cur) { cur = k; show(k); } });
})();
