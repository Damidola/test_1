import { h } from 'snabbdom';

import { numberSpread } from 'lib/i18n';
import { licon } from 'lib/licon';
import { bind, icon, onInsert } from 'lib/view';

import { hashNavigate } from '../hashRouting';
import { getStageRank } from '../score';
import { withLinebreaks } from '../util';
import type { RunCtrl } from './runCtrl';
// logic-games-kids: «Далі» — наступний пункт шляху застосунку (урок, гра чи задачі), а не наступний етап Lichess
import { goNext, nextAfter } from '../../../../shared/path.js';

function makeStars(rank: number) {
  const stars = [];
  for (let i = 3; i > 0; i--) stars.push(h('div.star-wrap', rank <= i ? h('icon.star') : null));
  return stars;
}

export default function (ctrl: RunCtrl) {
  const stage = ctrl.stage;
  const here = 'lessons/index.html#/' + stage.id;
  const next = nextAfter(here);
  const score = ctrl.stageScore();
  return h(
    'div.learn__screen-overlay',
    {
      hook: bind(
        'click',
        e => (e.target as HTMLElement).classList?.contains('learn__screen-overlay') && hashNavigate(),
      ),
    },
    h('div.learn__screen', [
      h('div.stars', makeStars(getStageRank(stage, score))),
      h('h1', `Урок «${stage.title}» пройдено!`),
      h(
        'span.score',
        i18n.site.yourScore.asArray(
          h(
            'span',
            {
              hook: onInsert(el => {
                setTimeout(() => numberSpread(el, 50, 3000, 0)(score), 300);
              }),
            },
            '0',
          ),
        ),
      ),
      h('p', withLinebreaks(stage.complete)),
      h('div.buttons', [
        next
          ? h('button.button', { hook: bind('click', () => goNext(here)) }, [
              'Далі: ' + next.title,
              icon(licon.GreaterThan)(),
            ])
          : null,
        h(`button.button.button-empty`, { hook: bind('click', () => hashNavigate()) }, [
          icon(licon.LessThan)(),
          'До уроків',
        ]),
      ]),
    ]),
  );
}
