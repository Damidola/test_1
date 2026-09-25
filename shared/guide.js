/* «Гайд» уроку з картинкою, що рухається: маленька дошка сама програє приклад (стрілки, ходи, підписи) по колу.
   mountGuide(section, demos) → { play(), stop() }; demos: [{ demo: fen, steps: [{ say, arrows: 'e2e4 d5:red', move: 'e2e4', wait }] }] */
import { Chess, parseUci, makeSquare, fen as FEN } from 'https://cdn.jsdelivr.net/npm/chessops@0.15.1/+esm';
import { createBoard } from './board.js?v=1790372904';

const shape = s => { const [u, brush = 'green'] = s.split(':'); return u.length === 2 ? { orig: u, brush } : { orig: u.slice(0, 2), dest: u.slice(2, 4), brush }; };
const pieces = p => { const m = new Map(); for (const [sq, pc] of p.board) m.set(makeSquare(sq), { role: pc.role, color: pc.color }); return m; };

export function mountGuide(section, demos) {
  if (!section || !demos || !demos.length) return { play() {}, stop() {} };
  const box = document.createElement('div'); box.className = 'lg-guide';
  box.innerHTML = '<div class="lg-guide-board"><div class="lg-board-el"></div></div><div class="lg-guide-say"></div>';
  const h = section.querySelector('h2'); (h ? h.after(box) : section.prepend(box));
  const board = createBoard(box.querySelector('.lg-board-el'));
  board.setMovable(null);
  const say = box.querySelector('.lg-guide-say');
  let token = 0;
  const wait = (ms, t) => new Promise((ok, stop) => setTimeout(() => (t === token ? ok() : stop('stop')), ms));
  async function loop(t) {
    try {
      for (;;) for (const d of demos) {
        let p = Chess.fromSetup(FEN.parseFen(d.demo).unwrap()).unwrap();
        board.clearHint(); board.setPosition(pieces(p), { animate: false }); say.textContent = '';
        await wait(700, t);
        for (const s of d.steps) {
          if (s.say) say.textContent = s.say;
          if (s.arrows) board.shapes(s.arrows.split(' ').map(shape)); else if (s.move) board.clearHint();
          if (s.move) {
            const m = parseUci(s.move), pc = p.board.get(m.from), tgt = p.board.get(m.to);
            // рокіровка: у chessops король «іде на туру» — на дошці показуємо як e1g1
            if (pc && pc.role === 'king' && Math.abs((m.to & 7) - (m.from & 7)) === 2 && !tgt) m.to = m.to > m.from ? m.from + 3 : m.from - 4;
            const lm = [makeSquare(m.from), s.move.slice(2, 4)];
            p.play(m); board.setPosition(pieces(p), { lastMove: lm, check: p.isCheck() ? p.turn : false });
          }
          await wait(s.wait ?? (s.move ? 1200 : 2200), t);
        }
        await wait(1500, t);
      }
    } catch (e) { if (e !== 'stop') throw e; }
  }
  return { play() { const t = ++token; loop(t); }, stop() { token++; } };
}
