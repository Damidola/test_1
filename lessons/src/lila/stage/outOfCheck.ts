import { assetUrl, roundSvg, toLevel } from '../util';
import type { StageNoID } from './list';

const imgUrl = assetUrl + 'images/learn/guards.svg';

const common = {
  detectCapture: false,
  offerIllegalMove: true,
  nbMoves: 1,
};

const stage: StageNoID = {
  key: 'outOfCheck',
  title: i18n.learn.outOfCheck,
  subtitle: i18n.learn.defendYourKing,
  image: imgUrl,
  intro: i18n.learn.outOfCheckIntro,
  illustration: roundSvg(imgUrl),
  levels: [
    {
      goal: i18n.learn.escapeWithTheKing,
      fen: '2k5/8/8/8/8/8/2P5/q1K5 w - - 0 1',
    },
    {
      goal: i18n.learn.escapeWithTheKing,
      fen: '1k6/8/8/8/8/8/3PP3/4K1r1 w - - 0 1',
    },
    {
      goal: i18n.learn.youCanGetOutOfCheckByTaking,
      fen: '8/8/b7/8/8/8/5b2/2k1K3 w - - 0 1',
    },
    {
      goal: i18n.learn.youCanGetOutOfCheckByTaking,
      fen: '8/8/8/8/8/1k6/6NP/4q1K1 w - - 0 1',
    },
    {
      goal: i18n.learn.youCanGetOutOfCheckByTaking,
      fen: '2k5/8/8/8/8/8/1PNP4/r1K5 w - - 0 1',
    },
    {
      goal: i18n.learn.theKingCannotEscapeButBlock,
      fen: '8/8/8/1k6/8/K2r4/PP6/8 w - - 0 1',
    },
    {
      goal: i18n.learn.theKingCannotEscapeButBlock,
      fen: '4k3/8/8/8/8/8/4BP2/1q2Kn2 w - - 0 1',
    },
    {
      goal: i18n.learn.theKingCannotEscapeButBlock,
      fen: '3R4/8/6k1/8/8/8/4P3/2q1K1b1 w - - 0 1',
    },
  ].map((l, i) => toLevel({ ...common, ...l }, i)),
  complete: i18n.learn.outOfCheckComplete,
};
export default stage;
