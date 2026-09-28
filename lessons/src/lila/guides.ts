/* logic-games-kids: «Гайд» етапу на весь екран (shared/guide.js → window.LGGuide): 2–3 анімації, кожна — одна думка.
   Етапи з прикладом (demo.ts) показують і його. Формат кроків — як у demo.ts, плюс dots (куди можна піти) і cross (куди не можна). */
import { DEMOS, type Demo } from './demo';

const D = (k: string, title: string): Demo & { title: string } => ({ ...DEMOS[k], title });

export const GUIDES: Record<string, (Demo & { title?: string })[]> = {
  rook: [
    { title: '♜ Як ходить тура', fen: '8/8/8/8/3R4/8/8/8', steps: [
      { say: 'Тура ходить прямо: вперед, назад, ліворуч і праворуч — на скільки завгодно клітинок.', dots: 'd5 d6 d7 d8 d3 d2 d1 a4 b4 c4 e4 f4 g4 h4', wait: 3800 },
      { say: 'Наприклад, одразу до краю дошки…', arrows: 'd4d8', wait: 1400 }, { move: 'd4d8' },
      { say: '…а тепер убік.', arrows: 'd8h8', wait: 1200 }, { move: 'd8h8', wait: 1800 }] },
    { title: '🚧 Через фігури — не можна', fen: '8/8/8/3p4/3R4/8/8/8', steps: [
      { say: 'Через інші фігури тура не перестрибує: угору дорогу закрив пішак.', dots: 'a4 b4 c4 e4 f4 g4 h4 d3 d2 d1', wait: 3200 },
      { say: 'Але фігуру суперника можна побити — стати на її клітинку!', arrows: 'd4d5:red', wait: 2000 }, { move: 'd4d5', say: 'Побила!', wait: 1800 }] },
    { title: '⭐ Збери зірочки', fen: '8/8/8/8/8/8/8/R7', apples: 'a6 f6 f2', steps: [
      { say: 'Завдання: зібрати всі зірочки. Шукай шлях від однієї до іншої.', wait: 2600 },
      { move: 'a1a6' }, { move: 'a6f6' }, { move: 'f6f2', say: 'Усі зібрані! 🎉', wait: 2000 }] },
  ],
  bishop: [
    { title: '♝ Як ходить слон', fen: '8/8/8/8/3B4/8/8/8', steps: [
      { say: 'Слон ходить навскоси — по діагоналі, на скільки завгодно клітинок.', dots: 'c5 b6 a7 e5 f6 g7 h8 c3 b2 a1 e3 f2 g1', wait: 3600 },
      { say: 'Ось так…', arrows: 'd4g7', wait: 1200 }, { move: 'd4g7' }, { move: 'g7h6', say: '…і ось так.', wait: 1800 }] },
    { title: '⚪⚫ Два слони', fen: '8/8/8/8/8/8/8/2B2B2', steps: [
      { say: 'Слон ніколи не змінює колір клітинок: один слон — на темних, другий — на світлих.', arrows: 'c1h6 f1a6:blue', wait: 4200 }] },
    { title: '⭐ Збери зірочки', fen: '8/8/8/8/8/8/8/2B5', apples: 'e3 g5 d8', steps: [
      { say: 'Слон збирає зірочки — лише навскоси!', wait: 2200 },
      { move: 'c1e3' }, { move: 'e3g5' }, { move: 'g5d8', say: 'Готово! 🎉', wait: 2000 }] },
  ],
  queen: [
    { title: '♛ Як ходить ферзь', fen: '8/8/8/8/3Q4/8/8/8', steps: [
      { say: 'Ферзь ходить і як тура, і як слон — прямо й навскоси. Найсильніша фігура!', dots: 'd5 d6 d7 d8 d3 d2 d1 a4 b4 c4 e4 f4 g4 h4 c5 b6 a7 e5 f6 g7 h8 c3 b2 a1 e3 f2 g1', wait: 3800 },
      { say: 'Прямо…', arrows: 'd4d8', wait: 1000 }, { move: 'd4d8' }, { say: '…і навскоси.', arrows: 'd8h4', wait: 1000 }, { move: 'd8h4', wait: 1800 }] },
    { title: '⭐ Збери зірочки', fen: '8/8/8/8/8/8/8/3Q4', apples: 'd6 h2 b8', steps: [
      { say: 'Ферзь збирає зірочки будь-якими шляхами.', wait: 2200 },
      { move: 'd1d6' }, { move: 'd6h2' }, { move: 'h2b8', say: 'Готово! 🎉', wait: 2000 }] },
  ],
  king: [
    { title: '♚ Як ходить король', fen: '8/8/8/8/3K4/8/8/8', steps: [
      { say: 'Король ходить лише на одну клітинку — у будь-який бік.', dots: 'c3 c4 c5 d3 d5 e3 e4 e5', wait: 3400 },
      { move: 'd4e5' }, { move: 'e5e6', say: 'Крок за кроком.', wait: 1800 }] },
    { title: '🚫 Під удар — не можна', fen: '8/8/8/r7/3K4/8/8/8', steps: [
      { say: 'Чорна тура б’є весь 5-й ряд.', arrows: 'a5h5:red', wait: 2400 },
      { say: 'Туди король ступити не може — його одразу поб’ють.', cross: 'c5 d5 e5', wait: 3000 },
      { say: 'А сюди — можна.', arrows: 'd4d3', wait: 1200 }, { move: 'd4d3', wait: 1600 }] },
  ],
  knight: [
    { title: '♞ Як ходить кінь', fen: '8/8/8/8/3N4/8/8/8', steps: [
      { say: 'Кінь стрибає літерою «Г»: дві клітинки прямо й одна вбік.', dots: 'b3 b5 c2 c6 e2 e6 f3 f5', wait: 3600 },
      { move: 'd4e6' }, { move: 'e6g5', say: 'Стриб — і ще стриб!', wait: 1800 }] },
    { title: '🦘 Перестрибує через фігури', fen: '8/8/8/2PPP3/2PNP3/2PPP3/8/8', steps: [
      { say: 'Кінь — єдина фігура, що перестрибує через інші.', wait: 2600 },
      { arrows: 'd4f5', wait: 1000 }, { move: 'd4f5', say: 'Вистрибнув! 🎉', wait: 2000 }] },
  ],
  pawn: [
    { title: '♟ Як ходить пішак', fen: '8/8/8/8/8/8/4P3/8', steps: [
      { say: 'Пішак ходить лише вперед. З початкової клітинки — на 1 або на 2 клітинки.', dots: 'e3 e4', wait: 3200 },
      { move: 'e2e4' }, { say: 'Далі — по одній.', dots: 'e5', wait: 1800 }, { move: 'e4e5', wait: 1600 }] },
    { title: '⚔️ Б’є навскоси', fen: '8/8/3p1n2/4P3/8/8/8/8', steps: [
      { say: 'А б’є пішак навскоси вперед — на одну клітинку.', arrows: 'e5d6:red e5f6:red', wait: 3000 },
      { move: 'e5f6', say: 'Побив коня!', wait: 1800 }] },
    { title: '👑 Стає ферзем', fen: '8/3P4/8/8/8/8/8/8', steps: [
      { say: 'Дійшов до останнього ряду — стає ферзем (або іншою фігурою)!', arrows: 'd7d8', wait: 2000 },
      { move: 'd7d8', promo: 'queen', wait: 2200 }] },
  ],
  capture: [
    D('capture', '🍽️ Бити — стати на клітинку'),
    { title: '♝ Кожна фігура б’є, як ходить', fen: '8/8/2r5/8/4B3/8/8/8', steps: [
      { say: 'Слон б’є навскоси…', arrows: 'e4c6:red', wait: 1800 }, { move: 'e4c6', wait: 1600 }] },
    { title: '♟ Пішак б’є навскоси', fen: '8/8/8/3n4/4P3/8/8/8', steps: [
      { say: 'Пішак ходить прямо, а б’є навскоси вперед!', arrows: 'e4d5:red', wait: 2200 }, { move: 'e4d5', wait: 1800 }] },
  ],
  protection: [
    D('protection', '🏃 Відведи фігуру'),
    { title: '🛡️ Або захисти', fen: '4r3/8/8/8/4B3/3P4/8/8', steps: [
      { say: 'Слона охороняє пішак d3.', arrows: 'd3e4:blue', wait: 2400 },
      { say: 'Якщо тура поб’є слона…', arrows: 'e8e4:red', wait: 1400 }, { move: 'e8e4' },
      { say: '…пішак поб’є туру! Тура дорожча — суперник програв обмін.', move: 'd3e4', wait: 2800 }] },
  ],
  combat: [D('combat', '⚔️ Бий, але не підставляйся')],
  check1: [
    D('check1', '⚠️ Шах турою'),
    { title: '♝ Шах слоном', fen: '4k3/8/8/8/8/8/8/5B2', steps: [
      { say: 'Слон шахує навскоси.', arrows: 'f1b5', wait: 1600 }, { move: 'f1b5', check: 'black' },
      { say: 'Шах!', arrows: 'b5e8:yellow', wait: 2000 }] },
  ],
  outOfCheck: [D('outOfCheck', '🆘 Три способи врятуватися')],
  checkmate1: [
    D('checkmate1', '🏁 Мат на останньому ряду'),
    { title: '♛ Мат ферзем з королем', fen: '6k1/8/6K1/8/8/8/8/3Q4', steps: [
      { say: 'Наш король стереже 7-й ряд.', arrows: 'g6f7:blue g6g7:blue g6h7:blue', wait: 2600 },
      { say: 'Ферзь — на останній ряд…', arrows: 'd1d8', wait: 1400 }, { move: 'd1d8', check: 'black' },
      { say: 'Мат! Червоні хрестики — туди королю не можна.', cross: 'f8 h8 f7 g7 h7', wait: 3200 }] },
  ],
  setup: [D('setup', '♟ Розстановка')],
  castling: [
    D('castling', '🏰 Коротка рокіровка'),
    { title: '🏰 Довга рокіровка', fen: '8/8/8/8/8/8/PPPPPPPP/R3K2R', steps: [
      { say: 'Рокіровка буває і в бік ферзя: король — на c1, тура — на d1.', arrows: 'e1c1 a1d1:blue', wait: 3200 },
      { move: 'e1c1 a1d1', wait: 2200 }] },
  ],
  enpassant: [D('enpassant', '🦶 Взяття на проході')],
  stalemate: [D('stalemate', '🤝 Пат')],
  value: [D('value', '💰 Бий найдорожчу')],
  check2: [D('check2', '🧭 Шах за два ходи')],
};

// кроки для shared/guide.js: перетворення — 5-ю літерою ходу
const LETTER: Record<string, string> = { queen: 'q', rook: 'r', bishop: 'b', knight: 'n' };
export const guideSlides = (key: string) =>
  (GUIDES[key] || (DEMOS[key] ? [DEMOS[key]] : [])).map(d => ({
    ...d,
    steps: d.steps.map(s => (s.move && s.promo ? { ...s, move: s.move + LETTER[s.promo] } : s)),
  }));
export const GUIDE_ICON: Record<string, string> = { rook: '♜', bishop: '♝', queen: '♛', king: '♚', knight: '♞', pawn: '♟' };
