/* Авторські схеми, а не випадкова розстановка. Кожен запис має назву, позицію і задум.
   w() додає біле укриття короля; інші пішаки вказані явно. Дзеркало тренує ту саму ідею на іншому фланзі. */
export const CHECK_BANK_VERSION = 2;
const w = (pieces, pawns = 'f2 g2 h2', king = 'g1') => `K${king} ${pawns.split(' ').filter(Boolean).map(s => 'P' + s).join(' ')} ${pieces}`;
const lesson = (id, motif, white, black, solution) => ({ id, motif, white, black, solution });
export const CHECK_SCHEMES = {
  rook: [
    lesson('open-a', 'Відкрита вертикаль', w('Ra1'), 'Kg8 Pg7 Ph7', 'a1a8'),
    lesson('open-b', 'Відкрита вертикаль', w('Rb1'), 'Kg8 Pg7 Ph7', 'b1b8'),
    lesson('open-c', 'Відкрита вертикаль', w('Rc1'), 'Kg8 Pg7 Ph7', 'c1c8'),
    lesson('open-d', 'Відкрита вертикаль', w('Rd1'), 'Kg8 Pg7 Ph7', 'd1d8'),
    lesson('open-e', 'Відкрита вертикаль', w('Re1'), 'Kg8 Pg7 Ph7', 'e1e8'),
    lesson('king-h', 'Шах по останній горизонталі', w('Ra1'), 'Kh8 Pg7 Ph6', 'a1a8'),
    lesson('rook-f', 'Шах по останній горизонталі', w('Rf1', 'e2 g2 h2'), 'Kh8 Pg7 Ph6', 'f1f8'),
    lesson('rook-d2', 'Тура на відкритій лінії', w('Rd2', 'f2 g2 h2'), 'Kg8 Pg7 Ph7 Pb6', 'd2d8'),
    lesson('rook-c3', 'Тура на відкритій лінії', w('Rc3'), 'Kg8 Pg7 Ph7 Pa6', 'c3c8'),
    lesson('clear-e', 'Пішак закриває один шлях', w('Re1', 'f2 h2', 'h1'), 'Kg8 Pf7 Ph7 Pe6', 'e1g1'),
    lesson('seventh', 'Захищений шах на сьомій', w('Ra7 Be5'), 'Kg8 Pg7 Ph7', 'a7g7'),
    lesson('capture-back', 'Візьми захисника з шахом', w('Ra1'), 'Kg8 Pg7 Ph7 Ra8', 'a1a8'),
    lesson('blocker', 'Обійди закриту вертикаль', w('Ra1', 'f2 h2', 'h1'), 'Kg8 Pf7 Ph7 Pa5', 'a1g1'),
    lesson('support', 'Фігури працюють разом', w('Re7 Be5'), 'Kg8 Pg7 Ph7 Nb6', 'e7g7'),
    lesson('side', 'Шах збоку', w('Ra5', 'f2 g2 h2'), 'Kg8 Pf7 Ph7', 'a5g5')
  ],
  bishop: [
    lesson('develop-f', 'Діагональ до короля', w('Bf1'), 'Kg8 Pg7 Ph7', 'f1c4'),
    lesson('long-a', 'Діагональ до короля', w('Ba6'), 'Kg8 Pg7 Ph7', 'a6c4'),
    lesson('long-e', 'Діагональ до короля', w('Be2'), 'Kg8 Pg7 Ph7', 'e2c4'),
    lesson('fianchetto', 'Діагональ слона', w('Bg2', 'f2 g3 h2'), 'Kg8 Pg7 Ph7', 'g2d5'),
    lesson('bishop-h', 'Довга діагональ', w('Bh1', 'f2 g3 h2', 'f1'), 'Kg8 Pg7 Ph7', 'h1d5'),
    lesson('bishop-f3', 'Діагональ до короля', w('Bf3', 'f2 g2 h2'), 'Kg8 Pg7 Ph7', 'f3d5'),
    lesson('bishop-h3', 'Знайди діагональ', w('Bh3', 'f2 g2 h2'), 'Kg8 Pg7 Ph7', 'h3e6'),
    lesson('bishop-g4', 'Знайди діагональ', w('Bg4'), 'Kg8 Pg7 Ph7', 'g4e6'),
    lesson('bishop-d1', 'Шах здалеку', w('Bd1'), 'Kg8 Pg7 Ph7', 'd1b3'),
    lesson('corner', 'Ослаблене укриття', w('Bh4'), 'Kh8 Pg6 Ph7', 'h4f6'),
    lesson('corner-h2', 'Ослаблене укриття', w('Bh2', 'f2 g2 h3'), 'Kh8 Pg6 Ph7', 'h2e5'),
    lesson('corner-g3', 'Ослаблене укриття', w('Bg3'), 'Kh8 Pg6 Ph7', 'g3e5'),
    lesson('supported-capture', 'Слон бере захисника', w('Bb2 Rg1', 'f2 h2', 'f1'), 'Kh8 Pg7 Ph6', 'b2g7'),
    lesson('supported-f7', 'Захищений слон біля короля', w('Bh5 Rf1', 'g2 h2'), 'Kg8 Pg7 Ph7', 'h5f7'),
    lesson('bishop-trap', 'Діагональ між пішаками', w('Bg4'), 'Kg8 Pg7 Ph7 Pe7', 'g4e6')
  ],
  queen: [
    lesson('back-rank', 'Відкрита вертикаль', w('Qd1'), 'Kg8 Pg7 Ph7', 'd1d8'),
    lesson('queen-c1', 'Шах здалеку', w('Qc1'), 'Kg8 Pg7 Ph7', 'c1c8'),
    lesson('queen-e1', 'Шах здалеку', w('Qe1'), 'Kg8 Pg7 Ph7', 'e1e8'),
    lesson('queen-d2', 'Відкрита лінія', w('Qd2'), 'Kg8 Pg7 Ph7', 'd2d8'),
    lesson('queen-b1', 'Відкрита лінія', w('Qb1'), 'Kg8 Pg7 Ph7', 'b1b8'),
    lesson('diagonal', 'Шах по діагоналі', w('Qd1'), 'Kg8 Pg7 Ph7 Pd6', 'd1b3'),
    lesson('corner', 'Король у кутку', w('Qd1'), 'Kh8 Pg7 Ph6', 'd1d8'),
    lesson('queen-c2', 'Король за пішаками', w('Qc2'), 'Kg8 Pg7 Ph7 Pb6', 'c2c8'),
    lesson('queen-e2', 'Король за пішаками', w('Qe2'), 'Kg8 Pg7 Ph7 Pd6', 'e2e8'),
    lesson('capture-rook', 'Взяття з шахом', w('Qd1'), 'Kg8 Pg7 Ph7 Rd8', 'd1d8'),
    lesson('protected-f7', 'Шах захищеним ферзем', w('Qd3 Rh1', 'f2 g2', 'f1'), 'Kg8 Pg7 Ph7', 'd3h7'),
    lesson('queen-side', 'Шах збоку', w('Qa4'), 'Kg8 Pf7 Ph7', 'a4g4'),
    lesson('queen-open', 'Вибери відкриту лінію', w('Qb3'), 'Kh8 Pg6 Ph7', 'b3b8'),
    lesson('capture-knight', 'Взяття з шахом', w('Qc1'), 'Kg8 Pg7 Ph7 Nc8', 'c1c8'),
    lesson('queen-shield', 'Візьми перешкоду з шахом', w('Qe3'), 'Kg8 Pg7 Ph7 Pe6', 'e3e6')
  ],
  knight: [
    lesson('jump-e5', 'Стрибок до короля', w('Ne5'), 'Kh8 Pg7 Ph6', 'e5f7'),
    lesson('jump-d5', 'Стрибок до короля', w('Nd5'), 'Kg8 Pf7 Ph7', 'd5f6'),
    lesson('jump-g4', 'Стрибок до короля', w('Ng4'), 'Kg8 Pf7 Ph7', 'g4f6'),
    lesson('jump-h5', 'Стрибок до короля', w('Nh5'), 'Kg8 Pf7 Ph7', 'h5f6'),
    lesson('jump-c6', 'Стрибок до короля', w('Nc6'), 'Kg8 Pg7 Ph7', 'c6e7'),
    lesson('jump-e4', 'Перестрибни укриття', w('Ne4'), 'Kg8 Pf7 Ph7', 'e4f6'),
    lesson('jump-h4', 'Перестрибни укриття', w('Nh4'), 'Kg7 Pf7 Ph7', 'h4f5'),
    lesson('corner-e5', 'Король у кутку', w('Nd6'), 'Kh8 Pg7 Ph6', 'd6f7'),
    lesson('corner-f4', 'Король у кутку', w('Nf4'), 'Kh8 Pg7 Ph6', 'f4g6'),
    lesson('corner-h5', 'Король у кутку', w('Nh4'), 'Kh8 Pg7 Ph6', 'h4g6'),
    lesson('capture-f6', 'Взяття зі стрибком', w('Nd5'), 'Kg8 Pf7 Ph7 Bf6', 'd5f6'),
    lesson('fork-rook', 'Шах і напад на туру', w('Nd5'), 'Kg8 Pf7 Ph7 Re8', 'd5f6'),
    lesson('fork-queen', 'Шах і напад на ферзя', w('Nc6'), 'Kg8 Pg7 Ph7 Qc8', 'c6e7'),
    lesson('blocked-file', 'Кінь перестрибує фігури', w('Ne4 Pd5'), 'Kg8 Pf7 Ph7 Pe6', 'e4f6'),
    lesson('corner-capture', 'Візьми фігуру з шахом', w('Ne5'), 'Kh8 Pg7 Ph6 Rf7', 'e5f7')
  ],
  pawn: [
    lesson('push-f', 'Пішак нападає навскоси', w('Pf6 Pe6', 'g2 h2'), 'Kg8 Pg7 Ph7', 'f6f7'),
    lesson('push-h', 'Пішак нападає навскоси', w('Ph6 Pg6', 'f2 g2'), 'Kg8 Pf7 Pg7', 'h6h7'),
    lesson('push-g', 'Пішаки захищають один одного', w('Pg6 Ph6', 'f2 h2'), 'Kh8 Pf7 Ph7', 'g6g7'),
    lesson('rook-f', 'Тура підтримує пішака', w('Pf6 Rf1', 'g2 h2'), 'Kg8 Pg7 Ph7', 'f6f7'),
    lesson('rook-g', 'Тура підтримує пішака', w('Pg6 Rg1', 'f2 h2', 'f1'), 'Kh8 Pf7 Ph7', 'g6g7'),
    lesson('bishop-f', 'Слон підтримує пішака', w('Pf6 Bg6', 'g2 h2'), 'Kg8 Pg7 Ph7', 'f6f7'),
    lesson('bishop-g', 'Слон підтримує пішака', w('Pg6 Bf8', 'f2 h2'), 'Kh8 Pf7 Ph7', 'g6g7'),
    lesson('capture-f', 'Пішак бере з шахом', w('Pg6 Pe6', 'f2 h2'), 'Kg8 Pf7 Pg7 Ph7', 'g6f7'),
    lesson('capture-h', 'Пішак бере з шахом', w('Pg6 Rh1', 'f2 g2', 'f1'), 'Kg8 Pf7 Pg7 Ph7', 'g6h7'),
    lesson('capture-g', 'Пішак бере з шахом', w('Pf6 Ph6', 'g2 h2'), 'Kh8 Pg7 Ph7', 'f6g7'),
    lesson('capture-rook', 'Пішак забирає туру', w('Pg6 Pe6', 'f2 h2'), 'Kg8 Rf7 Pg7 Ph7', 'g6f7'),
    lesson('capture-knight', 'Пішак забирає коня', w('Pf6 Ph6', 'g2 h2'), 'Kh8 Ng7 Pf7 Ph7', 'f6g7'),
    lesson('capture-bishop', 'Пішак забирає слона', w('Pg6 Rh1', 'f2 g2', 'f1'), 'Kg8 Bh7 Pf7 Pg7', 'g6h7'),
    lesson('king-support', 'Король допомагає пішаку', w('Pf6', 'a2 b2', 'e6'), 'Kg8 Pg7 Ph7', 'f6f7'),
    lesson('king-g', 'Король допомагає пішаку', w('Pg6', 'a2 b2', 'f6'), 'Kh8 Pf7 Ph7', 'g6g7')
  ]
};
export const CHECK_TEXT = {
  rook: { hint: 'Шукай відкриту вертикаль або горизонталь до короля. Пішаки перекривають деякі лінії.', explanation: 'Тура атакує короля по прямій. Між нею і королем немає фігур.' },
  bishop: { hint: 'Знайди діагональ до короля. Слон залишається на клітинках свого кольору.', explanation: 'Слон атакує короля по вільній діагоналі.' },
  queen: { hint: 'Ферзь ходить і прямо, і навскоси. Знайди відкриту лінію до короля.', explanation: 'Ферзь вийшов на відкриту лінію і атакує короля.' },
  knight: { hint: 'Знайди клітинку, з якої кінь дістане короля стрибком «Г». Він перестрибує фігури.', explanation: 'Кінь атакує короля стрибком «Г». Закрити цей шах іншою фігурою не можна.' },
  pawn: { hint: 'Пішак іде вперед, а б’є навскоси. Його нову клітинку має захищати інша фігура.', explanation: 'Пішак атакує клітинку короля навскоси, а сам залишається під захистом.' }
};
