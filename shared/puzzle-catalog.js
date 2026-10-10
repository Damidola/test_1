/* Єдиний каталог задач для меню, практики й уроків. */
export const PUZZLE_SECTIONS = {
  "chk_rook": {
    "id": "chk_rook",
    "group": "Постав шах",
    "icon": "rook",
    "art": "R",
    "title": "Турою",
    "description": "Шах — це напад на короля",
    "task": "Постав шах турою: напади на чорного короля — так, щоб цю фігуру не могли одразу побити.",
    "role": "rook",
    "objective": "safe-check"
  },
  "chk_bishop": {
    "id": "chk_bishop",
    "group": "Постав шах",
    "icon": "bishop",
    "art": "B",
    "title": "Слоном",
    "description": "Слон шахує навскоси",
    "task": "Постав шах слоном: напади на короля навскоси — так, щоб цю фігуру не могли одразу побити.",
    "role": "bishop",
    "objective": "safe-check"
  },
  "chk_queen": {
    "id": "chk_queen",
    "group": "Постав шах",
    "icon": "queen",
    "art": "Q",
    "title": "Ферзем",
    "description": "Ферзь шахує звідусіль",
    "task": "Постав шах ферзем — так, щоб цю фігуру не могли одразу побити.",
    "role": "queen",
    "objective": "safe-check"
  },
  "chk_knight": {
    "id": "chk_knight",
    "group": "Постав шах",
    "icon": "knight",
    "art": "N",
    "title": "Конем",
    "description": "Кінь шахує стрибком",
    "task": "Постав шах конем — стрибком літерою «Г» — так, щоб цю фігуру не могли одразу побити.",
    "role": "knight",
    "objective": "safe-check"
  },
  "chk_pawn": {
    "id": "chk_pawn",
    "group": "Постав шах",
    "icon": "pawn",
    "art": "P",
    "title": "Пішаком",
    "description": "Пішак шахує навскоси вперед",
    "task": "Постав шах пішаком: пішак б’є навскоси вперед — так, щоб цю фігуру не могли одразу побити.",
    "role": "pawn",
    "objective": "safe-check"
  },
  "esc_run": {
    "id": "esc_run",
    "group": "Урятуйся від шаху",
    "icon": "🏃",
    "art": "🏃",
    "title": "Утечи королем",
    "description": "Відведи короля туди, де його не б’ють",
    "task": "Твоєму королю шах! Відведи короля на єдину клітинку, яку ніхто не б’є.",
    "objective": "escape:run"
  },
  "esc_capture": {
    "id": "esc_capture",
    "group": "Урятуйся від шаху",
    "icon": "⚔️",
    "art": "⚔️",
    "title": "Побий того, хто шахує",
    "description": "Часто найкращий спосіб!",
    "task": "Твоєму королю шах! Побий фігуру, що шахує.",
    "objective": "escape:capture"
  },
  "esc_block": {
    "id": "esc_block",
    "group": "Урятуйся від шаху",
    "icon": "🛡️",
    "art": "🛡️",
    "title": "Закрийся",
    "description": "Постав фігуру між королем і нападником",
    "task": "Твоєму королю шах! Закрийся: постав свою фігуру між королем і нападником.",
    "objective": "escape:block"
  },
  "esc_mixed": {
    "id": "esc_mixed",
    "group": "Урятуйся від шаху",
    "icon": "🎲",
    "art": "🎲",
    "title": "Різні",
    "description": "Утекти, побити чи закритися — здогадайся сам",
    "task": "Твоєму королю шах! Урятуйся: утечи, побий або закрийся — один хід рятує.",
    "objective": "escape"
  },
  "m1rook": {
    "id": "m1rook",
    "group": "Мат в 1 хід",
    "icon": "rook",
    "art": "R",
    "title": "Турою",
    "description": "Найпростіші — тура й король",
    "task": "Постав мат турою одним ходом."
  },
  "m1bishop": {
    "id": "m1bishop",
    "group": "Мат в 1 хід",
    "icon": "bishop",
    "art": "B",
    "title": "Слоном",
    "description": "Слон ходить навскоси",
    "task": "Постав мат слоном одним ходом."
  },
  "m1pawn": {
    "id": "m1pawn",
    "group": "Мат в 1 хід",
    "icon": "pawn",
    "art": "P",
    "title": "Пішаком",
    "description": "Пішаки й король разом",
    "task": "Постав мат пішаком: пішаки й король працюють разом. Дійшов до кінця — обери, ким він стане!"
  },
  "m1queen": {
    "id": "m1queen",
    "group": "Мат в 1 хід",
    "icon": "queen",
    "art": "Q",
    "title": "Ферзем",
    "description": "Ферзь — найсильніша фігура",
    "task": "Постав мат ферзем одним ходом."
  },
  "m1knight": {
    "id": "m1knight",
    "group": "Мат в 1 хід",
    "icon": "knight",
    "art": "N",
    "title": "Конем",
    "description": "Кінь стрибає літерою «Г»",
    "task": "Постав мат конем одним ходом."
  },
  "m1mix": {
    "id": "m1mix",
    "group": "Мат в 1 хід",
    "icon": "🎲",
    "art": "🎲",
    "title": "Різні",
    "description": "Будь-якою фігурою",
    "task": "Постав мат одним ходом."
  },
  "mate2": {
    "id": "mate2",
    "group": "Мат в 2 ходи",
    "icon": "🏆",
    "art": "🏆",
    "title": "Мат в 2 ходи",
    "description": "Хід, відповідь суперника — і мат",
    "task": "Постав мат за 2 ходи: твій хід, відповідь суперника — і мат."
  },
  "fork": {
    "id": "fork",
    "group": "Тактичні прийоми",
    "icon": "🍴",
    "art": "🍴",
    "title": "Вилка",
    "description": "Спочатку турою, потім слоном, ферзем і конем",
    "task": "Зроби вилку: напади однією фігурою на дві — і забери одну."
  },
  "pin": {
    "id": "pin",
    "group": "Тактичні прийоми",
    "icon": "📌",
    "art": "📌",
    "title": "Зв’язка",
    "description": "Фігура не може піти: за нею стоїть цінніша",
    "task": "Зв’яжи фігуру суперника — і виграй матеріал."
  },
  "skewer": {
    "id": "skewer",
    "group": "Тактичні прийоми",
    "icon": "🏹",
    "art": "🏹",
    "title": "Простріл",
    "description": "Напад на цінну фігуру — вона тікає, і ти береш ту, що за нею",
    "task": "Напади на цінну фігуру: вона відійде — і ти забереш ту, що за нею."
  },
  "discovered": {
    "id": "discovered",
    "group": "Тактичні прийоми",
    "icon": "💥",
    "art": "💥",
    "title": "Відкритий напад",
    "description": "Відійди фігурою — і відкрий удар іншої",
    "task": "Відійди фігурою так, щоб відкрився удар іншої, — і виграй матеріал."
  },
  "deflection": {
    "id": "deflection",
    "group": "Тактичні прийоми",
    "icon": "🎣",
    "art": "🎣",
    "title": "Відволікання",
    "description": "Відтягни захисника з важливої клітинки",
    "task": "Відтягни захисника — і виграй фігуру."
  },
  "attraction": {
    "id": "attraction",
    "group": "Тактичні прийоми",
    "icon": "🧲",
    "art": "🧲",
    "title": "Заманювання",
    "description": "Заманюй фігуру суперника на погану клітинку",
    "task": "Заманюй фігуру суперника на погану клітинку — і виграй."
  },
  "hanging": {
    "id": "hanging",
    "group": "Тактичні прийоми",
    "icon": "🎁",
    "art": "🎁",
    "title": "Незахищена фігура",
    "description": "Забери фігуру, яку ніхто не захищає",
    "task": "Знайди фігуру, яку ніхто не захищає, — і забери її."
  },
  "promotion": {
    "id": "promotion",
    "group": "Тактичні прийоми",
    "icon": "👑",
    "art": "👑",
    "title": "Пішак у ферзі",
    "description": "Проведи пішака до останнього ряду",
    "task": "Проведи пішака в ферзі так, щоб його не з’їли."
  }
};

export const PUZZLE_GROUPS = [
  {
    "title": "Постав шах",
    "ids": [
      "chk_rook",
      "chk_bishop",
      "chk_queen",
      "chk_knight",
      "chk_pawn"
    ]
  },
  {
    "title": "Урятуйся від шаху",
    "ids": [
      "esc_run",
      "esc_capture",
      "esc_block",
      "esc_mixed"
    ]
  },
  {
    "title": "Мат в 1 хід",
    "ids": [
      "m1rook",
      "m1bishop",
      "m1pawn",
      "m1queen",
      "m1knight",
      "m1mix"
    ]
  },
  {
    "title": "Мат в 2 ходи",
    "ids": [
      "mate2"
    ]
  },
  {
    "title": "Тактичні прийоми",
    "ids": [
      "fork",
      "pin",
      "skewer",
      "discovered",
      "deflection",
      "attraction",
      "hanging",
      "promotion"
    ]
  }
];

export const puzzleLink = (id, lesson = false) => `chess-puzzles/index.html${lesson ? "?lesson=1" : ""}#${id}`;
export const menuGroups = groups => groups.map(title => [title, PUZZLE_GROUPS.find(group => group.title === title).ids.map(id => { const s = PUZZLE_SECTIONS[id]; return [s.art, s.title, s.description, puzzleLink(id)]; })]);
