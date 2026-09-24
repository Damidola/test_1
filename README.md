# Шахи для дітей

Застосунок для навчання шахам з нуля, українською. Відкривається в браузері на телефоні, його можна додати на головний екран.

## Вкладки

- 🎓 **Уроки**. Змійка з 22 кроків знизу вгору: фігури, напад і захист, шах і мат, особливі ходи й дебют, тактика. У кожному кроці є урок, задачі й гра з роботом.
- 🎯 **Практика**. Задачі (шах, мат в 1 і 2 ходи, тактика), шахи з роботом, фігури проти пішаків, мат роботу, головоломки (хід конем, 8 ферзів).
- 👤 **Профіль**. Прогрес, звук, гучність, набір фігур, скидання прогресу.

## Структура

| Папка | Що там |
|---|---|
| `index.html`, `app.js`, `app.css` | застосунок із вкладками |
| `learn-chess/` | уроки Lichess Learn (збірка: `npm install && npm run build`) і уроки «Шах» та «Цінність фігур» |
| `chess-path/` | міні-уроки (`lessons.js`); перевірка: `node tools/check-lessons.mjs` |
| `chess-puzzles/` | задачі й практика мату проти робота (`puzzles.json`) |
| `chess/` | шахи з роботом |
| `pawns/`, `pieces-vs-pawns/`, `knights-tour/`, `eight-queens/` | ігри й головоломки |
| `shared/` | дошка (chessground), звуки, фігури, суперники, спільні стилі |

Запуск локально: `python3 -m http.server`, потім відкрий http://localhost:8000.

Публікація: Settings → Pages → Deploy from branch → `master` / root.

## Ліцензії

- [chessground](https://github.com/lichess-org/chessground) і [chessops](https://github.com/niklasf/chessops) — GPL-3.0, з CDN jsDelivr; chessops і [snabbdom](https://github.com/snabbdom/snabbdom) (MIT) вбудовані в `learn-chess/app.js`.
- Уроки «Як ходять фігури» — код, рівні, екрани й стилі (`learn-chess/lila-learn.css`) з Lichess Learn ([lichess-org/lila](https://github.com/lichess-org/lila), `ui/learn`) з українським перекладом Lichess, ліцензія AGPLv3+ (див. `learn-chess/src/lila/README.md`).
- У «Як ходять фігури» з lila також шрифти (`learn-chess/assets/font`: Noto Sans і Roboto — SIL OFL / Apache 2.0, шрифт іконок lichess — AGPLv3+) і звуки уроків (`learn-chess/assets/sound`, lila `public/sound`).
- Дошки в `shared/boards/` і стилі дошки `shared/vendor/lichess-board.css` — з Lichess (lila authors, pirouetti), AGPLv3+.
- Набори фігур у `shared/pieces/*` — з Lichess; ліцензії кожного набору перелічені в [COPYING.md](https://github.com/lichess-org/lila/blob/master/COPYING.md) (cburnett, merida — GPLv2+; fantasy — MIT; california, cardinal, anarcandy, horsey — CC BY-NC-SA 4.0; pixel — AGPLv3+; xkcd — CC BY-NC 2.5; alpha — лише некомерційне використання).
- Шахові задачі (`chess-puzzles/puzzles.json`) — з [відкритої бази задач Lichess](https://database.lichess.org/#puzzles), CC0; вибірку взято з [mcognetta/lichess-combined-puzzle-game-db](https://github.com/mcognetta/lichess-combined-puzzle-game-db) (CC0), спрощення й відбір — `tools/build-mates.mjs` (мати) і `tools/build-tactics.mjs` (тактика, перевірка Stockfish), збирання — `tools/merge-puzzles.py`.
- Рушій для практики закінчень — [Stockfish.js 10](https://github.com/nmrugg/stockfish.js) (`shared/vendor/stockfish/`), GPL-3.0.
- Персонажі-роботи — RoboHash ([e1ven/Robohash](https://github.com/e1ven/Robohash)); 90 роликів-нагород — з публічних колекцій гіфок на GitHub (public/moarcats, tlberglund/animated-gifs, Carol42/random-cat-gifs, onprema/catgifs), перекодовані в короткі MP4/WebM без звуку.

Оскільки сюди входить код під GPL-3.0 і AGPLv3+, увесь проєкт поширюється на умовах AGPLv3+.
