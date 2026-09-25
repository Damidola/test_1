import { type Prop, prop } from 'lib';
import type { WithGround } from 'lib/game/ground';
import { pubsub } from 'lib/pubsub';

import { hashNavigate } from '../hashRouting';
import type { LearnProgress, LearnOpts } from '../learn';
import { LevelCtrl } from '../levelCtrl';
import { stageStart, stageEnd } from '../sound';
import { type Stage, type Level, byId as stageById } from '../stage/list';
import { clearTimeouts } from '../timeouts';
import { DEMOS, playDemo } from '../demo';
import { markSeen } from '../../../../shared/path.js';

export class RunCtrl {
  data: LearnProgress = this.opts.storage.data;
  chessground?: CgApi;
  levelCtrl: LevelCtrl;

  stageStarting: Prop<boolean> = prop(false);
  stageCompleted: Prop<boolean> = prop(false);
  // logic-games-kids: приклад на початку етапу (demo.ts)
  demo: Prop<boolean> = prop(false);
  demoText: Prop<string> = prop('');
  demoDone: Prop<boolean> = prop(false);
  demoToken = 0;

  get stage(): Stage {
    return stageById[this.opts.stageId ?? 1];
  }

  constructor(
    readonly opts: LearnOpts,
    readonly redraw: () => void,
  ) {
    clearTimeouts();

    this.initializeLevel();
    // Нижня панель сайту: 📖 «Пояснення» — сторінка з поясненням етапу (текст і схема, як ходить фігура).
    // Урок одразу починається із завдання — без обов'язкового прикладу.
    const LG = (window as any).LG;
    LG?.onExplain?.(() => {
      const box = document.createElement('div');
      box.className = 'lg-rules lg-explain';
      box.innerHTML = `<h2>${this.stage.title}</h2>` + explainDiagrams(this.stage.key) +
        `<p style="font-size:17px;line-height:1.45">${this.stage.intro.replace(/\n/g, '<br>')}</p>`;
      const ok = document.createElement('button');
      ok.className = 'lg-btn lg-btn-primary lg-btn-wide'; ok.textContent = 'Зрозуміло!'; ok.onclick = () => LG.closeModal();
      box.appendChild(ok);
      LG.openModal(box, { cls: 'lg-modal-rules' });
    });

    // Helpful for debugging:
    // site.mousetrap.bind(['shift+enter'], this.levelCtrl.complete);
    pubsub.on('board.change', (is3d: boolean) => {
      this.withGround(g => {
        g.state.addPieceZIndex = is3d;
        g.redrawAll();
      });
    });
  }

  initializeLevel = (restarting = false) => {
    this.levelCtrl = new LevelCtrl(
      this.withGround,
      this.stage.levels[Number(this.opts.levelId) - 1],
      {
        onCompleteImmediate: () => {
          this.opts.storage.saveScore(this.stage, this.levelCtrl.blueprint, this.levelCtrl.vm.score);
        },
        onComplete: () => {
          if (this.levelCtrl.blueprint.id < this.stage.levels.length) {
            hashNavigate(this.stage.id, this.levelCtrl.blueprint.id + 1);
          } else if (this.stageCompleted()) return;
          else {
            this.stageCompleted(true);
            markSeen('lessons/index.html#/' + this.stage.id); // крок шляху застосунку пройдено
            stageEnd();
          }
          this.redraw();
        },
      },
      this.redraw,
    );

    // без вікна «Етап N: … Поїхали!» — одразу дошка з першим завданням
    this.stageStarting(false && this.levelCtrl.blueprint.id === 1 && this.stageScore() === 0 && !restarting);
    this.stageCompleted(false);

    if (!this.opts.stageId) return;
    this.demo(false);
    this.demoToken++;
    if (this.stageStarting()) stageStart();
    else this.levelCtrl.start();
  };

  setChessground = (chessground: CgApi) => {
    this.chessground = chessground;
    this.withGround(this.levelCtrl.initializeWithGround);
    if (this.demo()) this.runDemo();
  };

  hasDemo = () => !!DEMOS[this.stage.key];

  // Показати приклад (заново); дошка — лише для перегляду
  startDemo = () => {
    this.demo(true);
    this.demoDone(false);
    this.demoText('');
    this.runDemo();
  };

  runDemo = () => {
    const t = ++this.demoToken;
    this.withGround(g =>
      playDemo(
        g,
        DEMOS[this.stage.key],
        text => {
          this.demoText(text);
          this.redraw();
        },
        () => t === this.demoToken && this.demo(),
        () => {
          this.demoDone(true);
          this.redraw();
        },
      ),
    );
  };

  replayDemo = () => {
    clearTimeouts();
    this.startDemo();
    this.redraw();
  };

  // «Почати»: рівень з початку
  endDemo = () => {
    this.initializeLevel(true);
    this.redraw();
  };

  pref = this.opts.pref;

  withGround: WithGround = f => (this.chessground ? f(this.chessground) : undefined);

  stageScore = () => this.data.stages[this.stage.key]?.scores.reduce((a, b) => a + b) ?? 0;

  score = (level: Level) => this.data.stages[this.stage.key]?.scores[level.id - 1] ?? 0;

  getNext = () => stageById[this.stage.id + 1];

  hideStartingPane = () => {
    if (!this.stageStarting()) return;
    this.stageStarting(false);
    this.levelCtrl.start();
    this.redraw();
  };

  restart = () => {
    this.initializeLevel(true);
    this.redraw();
  };
}

// ---------- схема для «Пояснення»: фігура на порожній дошці й крапки там, куди вона ходить ----------
const MOVES: Record<string, [string, number, number, [number, number][], boolean]> = {
  // ключ етапу: [фігура, стовпчик, рядок (0 — знизу), напрямки, далеко?]
  rook: ['R', 3, 3, [[1, 0], [-1, 0], [0, 1], [0, -1]], true],
  bishop: ['B', 3, 3, [[1, 1], [-1, 1], [1, -1], [-1, -1]], true],
  queen: ['Q', 3, 3, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]], true],
  king: ['K', 3, 3, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]], false],
  knight: ['N', 3, 3, [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]], false],
  pawn: ['P', 3, 1, [[0, 1], [0, 2]], false],
};
function explainDiagrams(key: string): string {
  const m = MOVES[key];
  if (!m) return '';
  const [role, fx, fy, dirs, slide] = m;
  const set = (window as any).LG?.pieceSet?.() || 'cburnett';
  const dots: [number, number][] = [];
  for (const [dx, dy] of dirs) for (let k = 1; k < (slide ? 8 : 2); k++) {
    const x = fx + dx * k, y = fy + dy * k;
    if (x < 0 || x > 7 || y < 0 || y > 7) break;
    dots.push([x, y]);
  }
  let sq = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++)
    sq += `<rect x="${x}" y="${7 - y}" width="1" height="1" fill="${(x + y) % 2 ? '#f0d9b5' : '#b58863'}"/>`;
  const dd = dots.map(([x, y]) => `<circle cx="${x + 0.5}" cy="${7 - y + 0.5}" r=".17" fill="rgba(20,85,30,.6)"/>`).join('');
  const pc = `<image href="../shared/pieces/${set}/w${role}.svg" x="${fx}" y="${7 - fy}" width="1" height="1"/>`;
  return `<svg viewBox="0 0 8 8" style="display:block;width:min(100%,300px);margin:6px auto 10px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.3)">${sq}${dd}${pc}</svg>`;
}
