import { licon } from 'lib/licon';
import { a, div, icon, span } from 'lib/view';

import { hashHref } from './hashRouting';
import type { RunCtrl } from './run/runCtrl';
import { getLevelRank } from './score';
import type { Level } from './stage/list';

export function makeStars(level: Level, score: number) {
  const rank = getLevelRank(level, score);
  const stars = [];
  for (let i = 3; i >= rank; i--) stars.push(icon(licon.Star)());
  return span(`.stars.st${stars.length}`, stars);
}

export function progressView(ctrl: RunCtrl) {
  let prevDone = true; // рівень можна відкрити, лише коли попередній пройдено
  return div(
    '.progress',
    ctrl.stage.levels.map(function (level: Level) {
      const score = ctrl.score(level), open = prevDone;
      prevDone = !!score;
      // logic-games-kids: без зірочок (ламали ширину) — номер рівня; зелений — ідеально (3 зірки), жовтий — пройдено
      const status = level.id === ctrl.levelCtrl.blueprint.id ? 'active' : score ? (getLevelRank(level, score) === 1 ? 'done perfect' : 'done passed') : 'future';
      if (!open && status === 'future') return span('.locked', span('.id', level.id));
      return a(hashHref(ctrl.stage.id, level.id))(`.${status.replace(' ', '.')}`, span('.id', level.id));
    }),
  );
}
