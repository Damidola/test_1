/* Stockfish 10 (shared/vendor/stockfish, GPL) у фоновому потоці — для сильного рівня гри з роботом.
   bestUci(fen, { skill, ms }) → Promise<'e2e4' | ''>. Якщо рушій не запустився — ''. */
let sf = null, queue = Promise.resolve();
function engine() {
  if (sf !== null) return sf;
  try {
    const w = new Worker(new URL('./vendor/stockfish/stockfish.js', import.meta.url));
    let wait = null;
    w.onmessage = e => { const t = String(e.data); if (wait && wait.info && t.startsWith('info ')) wait.info(t); if (wait && t.startsWith(wait.prefix)) { const f = wait.done; wait = null; f(t); } };
    w.onerror = () => { sf = false; if (wait) { const f = wait.done; wait = null; f(''); } };
    const ask = (cmds, prefix, ms, info) => new Promise(done => {
      wait = { prefix, done, info };
      cmds.forEach(c => w.postMessage(c));
      setTimeout(() => { if (wait && wait.done === done) { wait = null; done(''); } }, ms);
    });
    sf = { ask, ready: ask(['uci', 'isready'], 'readyok', 8000).then(t => { if (!t) sf = false; return !!t; }) };
  } catch (e) { sf = false; }
  return sf;
}
export function warmUp() { engine(); }
export function bestUci(fen, { skill = 3, ms = 500 } = {}) {
  const run = async () => {
    const e = engine();
    if (!e || !(await e.ready) || !sf) return '';
    const t = await sf.ask([`setoption name Skill Level value ${skill}`, `position fen ${fen}`, `go movetime ${ms}`], 'bestmove', ms + 4000);
    const u = t.split(' ')[1];
    return u && u !== '(none)' ? u : '';
  };
  return (queue = queue.then(run, run));
}

/* Аналіз позиції повною силою: analyse(fen, ms) → { best: 'e2e4', cp, mate, pv: ['e2e4', …] } з боку того, хто ходить.
   cp — у сотих пішака; mate — за скільки ходів мат (мінус — мат тобі). Рушій не запустився — null. */
export function analyse(fen, ms = 900) {
  const run = async () => {
    const e = engine();
    if (!e || !(await e.ready) || !sf) return null;
    let last = null; const lines = [];
    const onInfo = t => {
      const sc = t.match(/ score (cp|mate) (-?\d+)/), pv = t.match(/ pv (.+)$/), mp = +((t.match(/ multipv (\d+)/) || [])[1] || 1);
      if (!sc || !pv) return;
      const x = { cp: sc[1] === 'cp' ? +sc[2] : null, mate: sc[1] === 'mate' ? +sc[2] : null, pv: pv[1].trim().split(' ') };
      lines[mp - 1] = x; if (mp === 1) last = x;
    };
    // два варіанти (MultiPV 2): найкращий хід і ще один добрий; для гри з роботом bestUci ставить MultiPV назад 1
    const t = await sf.ask(['setoption name Skill Level value 20', 'setoption name MultiPV value 2', `position fen ${fen}`, `go movetime ${ms}`], 'bestmove', ms + 4000, onInfo);
    await sf.ask(['setoption name MultiPV value 1', 'isready'], 'readyok', 2000);
    const best = t.split(' ')[1];
    if (!best || best === '(none)') return last ? { ...last, best: '' } : { best: '', cp: null, mate: null, pv: [] };
    return { cp: 0, mate: null, pv: [best], ...last, best, lines };
  };
  return (queue = queue.then(run, run));
}
