/* Stockfish 10 (shared/vendor/stockfish, GPL) у фоновому потоці — для сильного рівня гри з роботом.
   bestUci(fen, { skill, ms }) → Promise<'e2e4' | ''>. Якщо рушій не запустився — ''. */
let sf = null, queue = Promise.resolve();
function engine() {
  if (sf !== null) return sf;
  try {
    const w = new Worker(new URL('./vendor/stockfish/stockfish.js', import.meta.url));
    let wait = null;
    w.onmessage = e => { const t = String(e.data); if (wait && t.startsWith(wait.prefix)) { const f = wait.done; wait = null; f(t); } };
    w.onerror = () => { sf = false; if (wait) { const f = wait.done; wait = null; f(''); } };
    const ask = (cmds, prefix, ms) => new Promise(done => {
      wait = { prefix, done };
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
