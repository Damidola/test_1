import { GUIDE_CONTENT } from '../../../shared/guide-content.js';
/* logic-games-kids: приклад на початку кожного етапу — пояснення й хід за ходом із підписами та стрілками,
   як у «Шахових задачах». Фігури переставляються без перевірки правил (кроки прописані вручну). */
import type { DrawShape } from '@lichess-org/chessground/draw';

import { makeAppleShape } from './apple';
import { move as moveSound, take } from './sound';
import * as timeouts from './timeouts';

export interface DemoStep {
  say?: string;
  arrows?: string; // 'e2e4 d4:red' — стрілки й кружечки (колір після двокрапки)
  move?: string; // 'e1g1 h1f1' — кілька переміщень разом (рокіровка)
  ep?: Key; // взяття на проході: цей пішак зникає
  promo?: Role;
  check?: Color | false;
  wait?: number;
  dots?: string; // «Гайд»: клітинки, куди фігура може піти
  cross?: string; // «Гайд»: клітинки, куди не можна
}
export interface Demo {
  title?: string;
  fen: string;
  apples?: string;
  steps: DemoStep[];
}

// The optional in-board demonstration uses the same examples as the full guide.
export const DEMOS: Record<string, Demo> = Object.fromEntries(
  Object.entries(GUIDE_CONTENT.stage).map(([key, guide]: [string, any]) => [key, guide.slides[0]]),
);

const shape = (s: string): DrawShape => {
  const [u, brush = 'green'] = s.split(':');
  return u.length === 2 ? { orig: u as Key, brush } : { orig: u.slice(0, 2) as Key, dest: u.slice(2, 4) as Key, brush };
};

// Програє приклад на дошці; alive() — чи ще показуємо (інакше тихо зупиняємося)
export function playDemo(g: CgApi, d: Demo, say: (t: string) => void, alive: () => boolean, done: () => void): void {
  let apples = d.apples ? d.apples.split(' ') : [];
  const draw = (arrows?: string) => {
    g.setAutoShapes(apples.map(k => makeAppleShape(k as Key)));
    g.setShapes(arrows ? arrows.split(' ').map(shape) : []);
  };
  g.set({
    fen: d.fen, orientation: 'white', turnColor: 'white', lastMove: undefined, selected: undefined, check: false,
    movable: { color: undefined, dests: new Map() },
  });
  draw();
  let i = 0;
  const next = () => {
    if (!alive()) return;
    const s = d.steps[i++];
    if (!s) return done();
    if (s.say) say(s.say);
    if (s.move) {
      let last: Key[] = [];
      for (const u of s.move.split(' ')) {
        const o = u.slice(0, 2) as Key, t = u.slice(2, 4) as Key, pc = g.state.pieces.get(o);
        if (!pc) continue;
        const promotion = s.promo || ({ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' } as Record<string, Role>)[u[4]];
        const to = promotion ? { role: promotion, color: pc.color, promoted: true } : pc;
        const target = g.state.pieces.get(t);
        if (pc.role === 'king' && target?.role === 'rook' && target.color === pc.color) {
          const right = t[0] > o[0], kingTo = ((right ? 'g' : 'c') + o[1]) as Key, rookTo = ((right ? 'f' : 'd') + o[1]) as Key;
          g.setPieces(new Map([[o, undefined], [t, undefined], [kingTo, pc], [rookTo, target]]));
          last = [o, kingTo];
        } else if (pc.role === 'knight' && !knightMidBusy(g, o, t)) { // кінь — «Г»: спершу дві клітинки прямо, потім одна вбік
          const a = (o.charCodeAt(0) - 97) + 8 * (+o[1] - 1), b = (t.charCodeAt(0) - 97) + 8 * (+t[1] - 1);
          const dr = (b >> 3) - (a >> 3), df = (b & 7) - (a & 7), m = a + (Math.abs(dr) === 2 ? 8 * dr : df);
          const mid = ('abcdefgh'[m & 7] + ((m >> 3) + 1)) as Key, keep = g.state.pieces.get(mid);
          g.setPieces(new Map([[o, undefined], [mid, pc]]));
          timeouts.setTimeout(() => g.setPieces(new Map([[mid, keep], [t, to]])), 260);
        } else {
          if (pc.role === 'pawn' && o[0] !== t[0] && !target) g.setPieces(new Map([[(t[0] + o[1]) as Key, undefined]]));
          g.setPieces(new Map([[o, undefined], [t, to]]));
        }
        if (!last.length) last = [o, t];
        if (apples.includes(t)) { apples = apples.filter(a => a !== t); take(); }
      }
      if (s.ep) g.setPieces(new Map([[s.ep, undefined]]));
      g.set({ lastMove: last });
      moveSound();
    }
    if (s.check !== undefined) g.set({ check: s.check });
    if (s.move && s.arrows) {
      draw();
      const afterAnimation = () => {
        if (!alive()) return;
        if (g.state.animation.current) timeouts.setTimeout(afterAnimation, 30);
        else draw(s.arrows);
      };
      timeouts.setTimeout(afterAnimation, 30);
    } else draw(s.arrows);
    timeouts.setTimeout(next, s.wait ?? (s.move ? 1300 : 2400));
  };
  timeouts.setTimeout(next, 200);
}

// Клітинка на згині «Г» зайнята — тоді кінь просто перестрибує
function knightMidBusy(g: CgApi, o: Key, t: Key): boolean {
  const a = (o.charCodeAt(0) - 97) + 8 * (+o[1] - 1), b = (t.charCodeAt(0) - 97) + 8 * (+t[1] - 1);
  const dr = (b >> 3) - (a >> 3), df = (b & 7) - (a & 7), m = a + (Math.abs(dr) === 2 ? 8 * dr : df);
  return g.state.pieces.has(('abcdefgh'[m & 7] + ((m >> 3) + 1)) as Key);
}
