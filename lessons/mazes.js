/* Уроки-лабіринти на маленьких дошках (lessons/maze.html#ключ): фігура має з’їсти полуничку, обходячи стіни.
   Клітинки — [стовпчик, рядок], рядок 0 — угорі. w×h — розмір дошки. Перевірка: npm test (усі рівні проходимі). */
export const MAZES = {
  rook: {
    title: 'Тура 1: лабіринт', piece: 'rook', video: 'D0eQPdJxtcs', videoTitle: 'Знайомся з турою!',
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
  },
  bishop: {
    title: 'Слон 1: лабіринт', piece: 'bishop', video: 'MKLW3oh7_wE', videoTitle: 'Знайомся зі слоном!',
    text: 'Слон ходить навскоси — скільки завгодно клітинок, але крізь стіни не проходить.',
    levels: [
      { w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [] },
      { w: 5, h: 5, from: [0, 4], to: [4, 4], walls: [[1,4],[2,4],[3,4]] },
      { w: 5, h: 5, from: [0, 0], to: [4, 4], walls: [[2,2]] },
      { w: 6, h: 6, from: [0, 5], to: [5, 0], walls: [[2,3],[3,4],[0,1]] },
      { w: 6, h: 6, from: [1, 5], to: [4, 0], walls: [[2,4],[0,3],[3,2],[4,3],[2,1]] },
      { w: 6, h: 6, from: [4, 5], to: [1, 0], walls: [[3,1],[1,4],[5,4],[0,2],[4,2],[1,2]] },
      { w: 7, h: 7, from: [4, 6], to: [0, 0], walls: [[2,2],[0,1],[2,5],[4,5],[0,4],[3,3],[2,4],[6,2]] },
      { w: 7, h: 7, from: [6, 6], to: [0, 0], walls: [[3,4],[4,2],[3,3],[0,1],[1,5],[1,4],[4,3],[5,4],[0,4],[2,5]] }
    ]
  },
  queen: {
    title: 'Ферзь 1: лабіринт', piece: 'queen', video: '4wnfdWWiv3w', videoTitle: 'Знайомся з ферзем!',
    text: 'Ферзь ходить і прямо, і навскоси — скільки завгодно клітинок, але крізь стіни не проходить.',
    levels: [
      { w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [] },
      { w: 5, h: 5, from: [0, 4], to: [4, 2], walls: [[1,3],[1,4],[2,2]] },
      { w: 6, h: 6, from: [0, 5], to: [5, 0], walls: [[1,4],[2,3],[3,2],[4,1],[0,2],[3,5],[5,3]] },
      { w: 7, h: 7, from: [3, 6], to: [3, 0], walls: [[3,3],[2,3],[4,3],[1,5],[5,5],[1,1],[5,1],[3,5],[3,1]] },
      { w: 6, h: 6, from: [3, 5], to: [2, 0], walls: [[3,4],[3,3],[2,1],[5,2],[1,4],[3,1],[2,4],[1,3]] },
      { w: 6, h: 6, from: [4, 5], to: [3, 0], walls: [[4,2],[3,4],[1,2],[0,2],[5,3],[1,1],[5,2],[0,4],[0,3],[1,4]] },
      { w: 7, h: 7, from: [0, 6], to: [0, 0], walls: [[2,4],[0,4],[6,5],[4,1],[1,3],[6,4],[5,2],[2,1],[3,3],[2,5],[1,2],[3,4]] },
      { w: 7, h: 7, from: [0, 6], to: [4, 0], walls: [[1,3],[1,5],[3,3],[3,4],[5,2],[4,5],[2,3],[6,2],[2,1],[6,1],[3,5],[0,3],[4,2],[5,4]] }
    ]
  },
  king: {
    title: 'Король 1: лабіринт', piece: 'king', video: 'KVeMgVMslNM', videoTitle: 'Знайомся з королем!',
    text: 'Король ходить у будь-який бік, але лише на одну клітинку.',
    levels: [
      { w: 5, h: 5, from: [2, 4], to: [2, 2], walls: [] },
      { w: 5, h: 5, from: [0, 2], to: [4, 2], walls: [[2,1],[2,2],[2,3]] },
      { w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [[1,1],[2,2],[3,3],[1,3]] },
      { w: 6, h: 6, from: [0, 5], to: [5, 0], walls: [[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[2,2],[1,1],[2,1]] },
      { w: 6, h: 6, from: [4, 5], to: [4, 0], walls: [[4,1],[5,1],[0,4],[0,1],[1,1],[1,3],[3,1],[5,2]] },
      { w: 6, h: 6, from: [3, 5], to: [0, 0], walls: [[0,3],[2,1],[4,4],[4,2],[3,4],[1,3],[2,4],[1,4],[2,2],[0,4]] },
      { w: 7, h: 7, from: [6, 6], to: [0, 0], walls: [[3,3],[5,2],[4,4],[4,2],[6,1],[5,4],[2,5],[5,1],[4,1],[2,4],[2,2],[2,3]] },
      { w: 7, h: 7, from: [1, 6], to: [6, 0], walls: [[6,1],[6,5],[2,2],[5,4],[5,3],[4,1],[5,1],[3,1],[4,5],[3,4],[1,4],[4,4],[4,3],[3,2]] }
    ]
  },
  pawn: {
    title: 'Пішак 1: лабіринт', piece: 'pawn', video: 'e015cjCtkl8', videoTitle: 'Знайомся з пішаком!',
    text: 'Пішак ходить лише вперед (з першого ряду — можна на дві клітинки), а б’є навскоси вперед. Дійшов до краю — стає ферзем!',
    task: 'З’їж усі фігури й полуничку 🍓. Пішак б’є навскоси, а на краю дошки стає ферзем!',
    levels: [
      { w: 5, h: 5, from: [2, 4], to: [2, 0], walls: [] },
      { w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [], enemies: [[1, 3, 'pawn'], [2, 2, 'pawn'], [3, 1, 'pawn']] },
      { w: 5, h: 5, from: [2, 4], to: [2, 0], walls: [[2, 3]], enemies: [[1, 3, 'knight'], [2, 2, 'knight']] },
      { w: 5, h: 5, from: [1, 4], to: [4, 4], walls: [[1, 2]], enemies: [[2, 3, 'rook']] },
      { w: 5, h: 5, from: [0, 4], to: [0, 4], walls: [[1, 1]], enemies: [[1, 3, 'pawn'], [0, 2, 'pawn'], [4, 0, 'rook']] },
      { w: 6, h: 6, from: [0, 5], to: [5, 5], walls: [[1, 2], [3, 2]], enemies: [[1, 4, 'pawn'], [2, 3, 'pawn'], [5, 0, 'knight'], [0, 0, 'bishop']] },
      { w: 6, h: 6, from: [5, 5], to: [0, 5], walls: [[4, 2], [2, 3]], enemies: [[4, 4, 'bishop'], [3, 3, 'pawn'], [4, 3, 'pawn'], [1, 1, 'rook'], [5, 0, 'knight']] },
      { w: 6, h: 6, from: [2, 5], to: [2, 5], walls: [[4, 1], [2, 3]], enemies: [[1, 4, 'pawn'], [0, 3, 'pawn'], [1, 2, 'knight'], [0, 0, 'rook'], [5, 0, 'bishop']] }
    ]
  },
  capture: {
    title: 'Взяття 1: лабіринт', piece: 'rook', video: '71051OelIo4', videoTitle: 'Незахищені фігури',
    text: 'З’їж усі фігури суперника, а потім — полуничку. Обережно: вони теж б’ють! Ставати туди, де тебе з’їдять, не можна.',
    task: 'З’їж усі фігури й полуничку 🍓. Червоні клітинки під боєм — туди не можна!',
    levels: [
      { piece: 'rook', w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [], enemies: [[0, 1, 'pawn'], [4, 1, 'pawn']], safe: true },
      { piece: 'bishop', w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [[2, 2]], enemies: [[1, 3, 'knight'], [3, 1, 'pawn']], safe: true },
      { piece: 'queen', w: 5, h: 5, from: [2, 4], to: [2, 0], walls: [], enemies: [[0, 2, 'rook'], [4, 2, 'bishop'], [2, 1, 'pawn']], safe: true },
      { piece: 'knight', w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [[2, 2]], enemies: [[1, 2, 'pawn'], [3, 2, 'rook']], safe: true },
      { piece: 'king', w: 5, h: 5, from: [2, 4], to: [2, 0], walls: [[1, 2], [3, 2]], enemies: [[2, 3, 'knight'], [0, 0, 'rook']], safe: true },
      { piece: 'rook', w: 6, h: 6, from: [0, 5], to: [5, 0], walls: [[2, 2], [3, 3]], enemies: [[0, 2, 'bishop'], [4, 5, 'knight'], [5, 3, 'pawn']], safe: true },
      { piece: 'queen', w: 6, h: 6, from: [0, 5], to: [5, 0], walls: [[2, 3], [3, 2]], enemies: [[2, 5, 'rook'], [5, 5, 'knight'], [0, 0, 'bishop'], [4, 1, 'pawn']], safe: true },
      { piece: 'bishop', w: 6, h: 6, from: [1, 5], to: [4, 0], walls: [[3, 3]], enemies: [[2, 4, 'pawn'], [0, 2, 'knight'], [4, 2, 'rook']], safe: true }
    ]
  },
  knight: {
    title: 'Кінь 1: лабіринт', piece: 'knight', video: 'pbMAQk-5bHU', videoTitle: 'Знайомся з конем!',
    text: 'Кінь стрибає літерою «Г»: дві клітинки прямо й одна вбік. Через стіни він перестрибує!',
    levels: [
      { w: 5, h: 5, from: [0, 4], to: [1, 2], walls: [] },
      { w: 5, h: 5, from: [0, 4], to: [4, 4], walls: [] },
      { w: 5, h: 5, from: [0, 4], to: [4, 0], walls: [[1,2],[2,1],[2,2]] },
      { w: 5, h: 5, from: [0, 0], to: [4, 4], walls: [[1,1],[2,2],[3,3]] },
      { w: 5, h: 5, from: [4, 4], to: [0, 0], walls: [[2,2],[1,1],[0,2],[1,2]] },
      { w: 6, h: 6, from: [5, 5], to: [0, 0], walls: [[3,2],[5,2],[5,1],[2,2],[2,3],[0,1]] },
      { w: 6, h: 6, from: [5, 5], to: [4, 0], walls: [[3,1],[1,2],[5,2],[4,2],[3,4],[3,2],[2,4],[5,3]] },
      { w: 7, h: 7, from: [6, 6], to: [2, 0], walls: [[0,4],[1,3],[2,5],[1,2],[2,4],[0,5],[5,3],[4,1],[5,4],[0,3]] }
    ]
  }
};
const STEPS = { rook: [[1,0],[-1,0],[0,1],[0,-1]], bishop: [[1,1],[1,-1],[-1,1],[-1,-1]], queen: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] };
const JUMPS = { knight: [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]], king: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] };
const key = ([c, r]) => c + ',' + r;
// ---------- рушій ----------
// Стан: { at: [c, r], piece, left: [[c, r, роль], …] } — де фігура, яка вона зараз (пішак стає ферзем), які фігури суперника ще стоять.
// Рівень може мати enemies (їх треба з’їсти до полунички), piece (своя фігура рівня) і safe: true — фігури суперника б’ють,
// ставати на клітинку під боєм не можна.
const inside = (lv, c, r) => c >= 0 && r >= 0 && c < lv.w && r < lv.h;
export const startState = (M, lv) => ({ at: lv.from.slice(), piece: lv.piece || M.piece, left: (lv.enemies || []).map(e => e.slice()) });
// клітинки, які б’ють фігури суперника (їхні промені зупиняють стіни, інші фігури й моя фігура)
export function attacked(lv, st) {
  const wall = new Set(lv.walls.map(key)), occ = new Set(st.left.map(e => e[0] + ',' + e[1]).concat(key(st.at))), out = new Set();
  for (const [ec, er, role] of st.left) {
    if (role === 'pawn') { for (const dc of [-1, 1]) if (inside(lv, ec + dc, er + 1)) out.add((ec + dc) + ',' + (er + 1)); continue; }
    for (const [dc, dr] of STEPS[role] || []) for (let c = ec + dc, r = er + dr; inside(lv, c, r) && !wall.has(c + ',' + r); c += dc, r += dr) { out.add(c + ',' + r); if (occ.has(c + ',' + r)) break; }
    for (const [dc, dr] of JUMPS[role] || []) if (inside(lv, ec + dc, er + dr)) out.add((ec + dc) + ',' + (er + dr));
  }
  return out;
}
// усі ходи зі стану: [{ to, st }]
export function movesFrom(lv, st) {
  const wall = new Set(lv.walls.map(key)), en = new Map(st.left.map((e, i) => [e[0] + ',' + e[1], i])), raw = [];
  const free = (c, r) => inside(lv, c, r) && !wall.has(c + ',' + r);
  const [c0, r0] = st.at;
  if (st.piece === 'pawn') {
    if (free(c0, r0 - 1) && !en.has(c0 + ',' + (r0 - 1))) {
      raw.push([c0, r0 - 1]);
      if (r0 === lv.h - 1 && free(c0, r0 - 2) && !en.has(c0 + ',' + (r0 - 2))) raw.push([c0, r0 - 2]);
    }
    for (const dc of [-1, 1]) if (en.has((c0 + dc) + ',' + (r0 - 1))) raw.push([c0 + dc, r0 - 1]);
  } else {
    for (const [dc, dr] of STEPS[st.piece] || []) for (let c = c0 + dc, r = r0 + dr; free(c, r); c += dc, r += dr) { raw.push([c, r]); if (en.has(c + ',' + r)) break; }
    for (const [dc, dr] of JUMPS[st.piece] || []) if (free(c0 + dc, r0 + dr)) raw.push([c0 + dc, r0 + dr]);
  }
  const out = [];
  for (const to of raw) {
    const hit = en.get(key(to));
    const next = { at: to, piece: st.piece === 'pawn' && to[1] === 0 ? 'queen' : st.piece, left: hit === undefined ? st.left : st.left.filter((_, i) => i !== hit) };
    if (lv.safe && attacked(lv, next).has(key(to))) continue; // під бій ставати не можна
    out.push({ to, st: next });
  }
  return out;
}
export const solved = (lv, st) => !st.left.length && st.at[0] === lv.to[0] && st.at[1] === lv.to[1];
// найкоротший шлях до перемоги (усі фігури з’їдено й полуничка) → масив станів або null
export function solve(lv, st0) {
  const sk = st => key(st.at) + st.piece + '|' + st.left.map(key).join(';');
  const prev = new Map([[sk(st0), null]]); let layer = [st0];
  if (solved(lv, st0)) return [st0];
  while (layer.length) {
    const next = [];
    for (const st of layer) for (const m of movesFrom(lv, st)) {
      const k = sk(m.st); if (prev.has(k)) continue; prev.set(k, st);
      if (solved(lv, m.st)) { const path = [m.st]; let p = st; while (p) { path.unshift(p); p = prev.get(sk(p)); } return path; }
      next.push(m.st);
    }
    layer = next;
  }
  return null;
}
// сумісність: старі виклики (фігура без суперників)
export const dests = (piece, lv, at) => movesFrom(lv, { at, piece, left: (lv.enemies || []).map(e => e.slice()) }).map(m => m.to);
export function shortest(piece, lv, from = lv.from) {
  const p = solve(lv, { at: from.slice(), piece: lv.piece || piece, left: (lv.enemies || []).map(e => e.slice()) });
  return p && p.map(x => x.at);
}
