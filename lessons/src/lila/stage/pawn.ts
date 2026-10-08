import { arrow, assetUrl, pieceImg, toLevel } from '../util';
import type { StageNoID } from './list';

const stage: StageNoID = {
  key: 'pawn',
  title: i18n.learn.thePawn,
  subtitle: i18n.learn.itMovesForwardOnly,
  image: assetUrl + 'images/learn/pieces/P.svg',
  intro: i18n.learn.pawnIntro,
  illustration: pieceImg('pawn'),
  levels: [
    { goal: 'Пішак іде вперед. Збери полуницю!', fen: '8/8/8/8/8/4P3/8/8 w - -', apples: 'e4', nbMoves: 1, emptyApples: true },
    { goal: 'З другого ряду можна піти на дві клітинки.', fen: '8/8/8/8/8/8/4P3/8 w - -', apples: 'e4', nbMoves: 1, emptyApples: true },
    { goal: 'Пішак б’є навскіс. Побий обох пішаків!', fen: '8/8/8/8/8/4P3/8/8 w - -', apples: 'd4 c5', nbMoves: 2 },
    { goal: 'Іди вперед, а потім бий навскіс.', fen: '8/8/8/8/8/4P3/8/8 w - -', apples: 'd5 c6', nbMoves: 3 },
    { goal: 'Побий пішаків і перетворися на ферзя!', fen: '8/8/3P4/8/8/8/8/8 w - -', apples: 'e7 f8', nbMoves: 2, explainPromotion: true },
    { goal: 'Перетвори пішака на ферзя та збери полуницю.', fen: '8/4P3/8/8/8/8/8/8 w - -', apples: 'b8 b4', nbMoves: 3, explainPromotion: true },
    { goal: 'Використай обох пішаків — кожен б’є навскіс.', fen: '8/8/8/8/8/2P2P2/8/8 w - -', apples: 'b4 g4', nbMoves: 2 },
    { goal: 'Збери всі ягоди обома пішаками.', fen: '8/8/8/8/8/2P2P2/8/8 w - -', apples: 'c4 f4', nbMoves: 2, emptyApples: true },
    // logic-games-kids: останній рівень — гра (пішаки піддаються); програш теж зараховується жовтим
    { goal: 'Пішакова битва! Доведи свого пішака до фінішу 🏁 (верхній ряд) — або побий усіх чорних.', fen: '8/pppppppp/8/8/8/8/PPPPPPPP/8 w - -', nbMoves: 30, game: 'race', cssClass: 'lg-finish-top' },
  ].map(toLevel),
  complete: i18n.learn.pawnComplete,
};
export default stage;
