// Show a real, solvable maze using the same rules as its exercises.
import { movesFrom, solve, startState, solved } from '../lessons/mazes.js?v=1791642982';
import { GUIDE_CONTENT } from './guide-content.js?v=1791642982';
const letter = { rook: 'R', bishop: 'B', queen: 'Q', king: 'K', knight: 'N', pawn: 'P' };
const square = ([c, r]) => 'abcdefgh'[c] + (8 - r);
function placement(st) {
  const pieces = new Map(st.left.map(([c, r, role]) => [square([c, r]), letter[role].toLowerCase()]));
  pieces.set(square(st.at), letter[st.piece]);
  return Array.from({ length: 8 }, (_, r) => {
    let row = '', empty = 0;
    for (let c = 0; c < 8; c++) {
      const pc = pieces.get(square([c, r]));
      if (!pc) empty++;
      else { if (empty) row += empty; empty = 0; row += pc; }
    }
    return row + (empty || '');
  }).join('/');
}
export function mazeGuide(M, key) {
  const candidates = M.levels.filter(L => !L.video).slice(0, 3);
  const slides = candidates.map((L, i) => {
    const initial = startState(M, L), path = solve(L, initial);
    if (!path) throw Error('Maze guide needs a solvable example');
    const walls = [...L.walls];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (r >= L.h || c >= L.w) walls.push([c, r]);
    const steps = [{ say: 'Це справжній лабіринт із цього уроку. Темні блоки — стіни; полуничка — мета. На схемі показана доступна частина дошки.', wait: 3200 }];
    for (let j = 1; j < path.length; j++) {
      const before = path[j - 1], after = path[j], captured = after.left.length < before.left.length;
      if (!movesFrom(L, before).some(m => square(m.to) === square(after.at))) throw Error('Invalid maze example');
      const uci = square(before.at) + square(after.at) + (after.piece !== before.piece ? 'q' : '');
      const text = after.piece !== before.piece ? 'Пішак дійшов до краю лабіринту й став ферзем.' : captured ? 'Беремо чорну фігуру на ' + square(after.at) + '. Поле після взяття безпечне.' : 'Переходимо з ' + square(before.at) + ' на ' + square(after.at) + (L.safe ? ': тут нас не можуть побити.' : ', не проходячи крізь стіни.');
      steps.push({ say: text, arrows: uci.slice(0, 4), wait: 2800 }, { move: uci, say: j === path.length - 1 ? 'Дісталися полунички — рівень пройдено. Не обов’язково бити всіх чужих фігур: важливо безпечно дістатися мети.' : text, wait: 2400 });
    }
    if (!solved(L, path[path.length - 1])) throw Error('Maze example must reach its goal');
    return { title: 'Шлях до полунички · ' + (i + 1), fen: placement(initial), walls: walls.map(square).join(' '), apples: square(L.to), strawberry: true, steps, explanation: steps.filter(s => !s.move).map(s => s.say) };
  });
  const basic = GUIDE_CONTENT.stage[key === 'capture' ? 'combat' : M.piece];
  return { icon: key === 'capture' ? '⚔️' : '🍓', title: M.title, intro: basic.intro + '<p><b>У лабіринті:</b> дійди до полунички, обійшовши стіни. Якщо є чорні фігури, перевір їхні удари самостійно: небезпечні поля наперед не підсвічуються. Невдала спроба повертає фігуру назад; можна спробувати інший хід. Полуничку можна забрати, навіть коли інші чужі фігури лишилися, якщо її поле безпечне.</p>', slides };
}
