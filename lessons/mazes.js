/* Уроки-лабіринти на маленьких дошках (lessons/maze.html#ключ): фігура має дійти до кружечка, обходячи стіни.
   Клітинки — [стовпчик, рядок], рядок 0 — угорі. w×h — розмір дошки. Перевірка: npm test (усі рівні проходимі). */
export const MAZES = {
  rook: {
    title: 'Тура: лабіринт', piece: 'rook', video: 'D0eQPdJxtcs', videoTitle: 'Знайомся з турою!',
    text: 'Тура ходить по прямій — вгору, вниз, ліворуч, праворуч — скільки завгодно клітинок, але крізь стіни не проходить.',
    levels: [
      { w: 5, h: 5, from: [0, 2], to: [4, 2], walls: [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[0,3],[1,3],[2,3],[3,3],[4,3],[0,4],[1,4],[2,4],[3,4],[4,4]] },
      { w: 5, h: 5, from: [0, 2], to: [4, 2], walls: [[1,1],[2,1],[3,1],[1,2],[2,2],[3,2],[1,3],[2,3],[3,3]] },
      { w: 5, h: 5, from: [3, 0], to: [3, 4], walls: [[2,1],[2,2],[2,3],[1,4]] },
      { w: 5, h: 5, from: [4, 3], to: [3, 0], walls: [[1,1],[4,1],[1,2],[2,2],[3,2],[4,2],[1,3],[4,4]] },
      { w: 5, h: 5, from: [3, 4], to: [3, 2], walls: [[2,1],[3,1],[2,2],[1,3],[2,3],[3,3],[4,3],[4,4]] },
      { w: 6, h: 6, from: [2, 2], to: [0, 1], walls: [[1,1]] },
      { w: 7, h: 6, from: [0, 5], to: [6, 0], walls: [[3,0],[3,1],[1,2],[5,2],[6,2],[1,3],[2,3],[1,4],[2,4],[3,4],[4,4],[5,4]] },
      { w: 7, h: 7, from: [2, 4], to: [5, 3], walls: [[2,2],[4,3],[5,4]] },
      { w: 8, h: 8, from: [5, 5], to: [3, 7], walls: [[2,4],[3,5],[4,6],[1,7],[5,7]] }
    ]
  }
};
const STEPS = { rook: [[1,0],[-1,0],[0,1],[0,-1]], bishop: [[1,1],[1,-1],[-1,1],[-1,-1]], queen: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] };
const JUMPS = { knight: [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]], king: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] };
const key = ([c, r]) => c + ',' + r;
// куди фігура може піти з клітинки (стіни й край дошки зупиняють)
export function dests(piece, lv, at) {
  const wall = new Set(lv.walls.map(key)), out = [], inside = (c, r) => c >= 0 && r >= 0 && c < lv.w && r < lv.h;
  for (const [dc, dr] of STEPS[piece] || []) for (let c = at[0] + dc, r = at[1] + dr; inside(c, r) && !wall.has(c + ',' + r); c += dc, r += dr) out.push([c, r]);
  for (const [dc, dr] of JUMPS[piece] || []) { const c = at[0] + dc, r = at[1] + dr; if (inside(c, r) && !wall.has(c + ',' + r)) out.push([c, r]); }
  return out;
}
// найкоротший шлях (кількість ходів) — для «ідеально» й підказки
export function shortest(piece, lv, from = lv.from) {
  const goal = key(lv.to), prev = new Map([[key(from), null]]); let layer = [from];
  while (layer.length) {
    const next = [];
    for (const at of layer) for (const d of dests(piece, lv, at)) {
      const k = key(d); if (prev.has(k)) continue; prev.set(k, at);
      if (k === goal) { const path = [d]; let p = at; while (p) { path.unshift(p); p = prev.get(key(p)); } return path; }
      next.push(d);
    }
    layer = next;
  }
  return null;
}
