import { type Classes, type VNode } from 'snabbdom';

import { a, bind, button, div, h2, img, p } from 'lib/view';

import chessground from '../chessground';
import { hashHref } from '../hashRouting';
import type { LearnCtrl } from '../ctrl';
import type { LevelCtrl } from '../levelCtrl';
import { makeStars, progressView } from '../progressView';
import { getLevelRank } from '../score';
import { promotionView } from '../promotionView';
import { withLinebreaks } from '../util';
import congrats from './congrats';
import type { RunCtrl } from './runCtrl';
import stageComplete from './stageComplete';
import stageStarting from './stageStarting';

const renderFailed = (ctrl: RunCtrl): VNode =>
  div('.result.failed', { hook: bind('click', ctrl.restart) }, [
    h2('Ой, не так 🙂'),
    p('.lg-say-sub', 'Нічого страшного — спробуй ще раз!'),
    button(i18n.learn.retry),
  ]);

// Вчитель хвалить: ідеально (3 зірки) — окремо, просто пройдено — «молодець», і обіцяє продовжити
const PRAISE: Record<number, string[]> = {
  1: ['Ідеально! Жодного зайвого ходу 🌟', 'Бездоганно! Ти справжній шахіст 🏆', 'Ідеально! Так тримати ⭐'],
  2: ['Молодець! Вийшло 👍 Можна ще трішки швидше', 'Добра робота! Продовжуємо 🙂'],
  3: ['Готово! Молодець 🙂 Наступного разу — меншою кількістю ходів', 'Вийшло! Ідемо далі 👍'],
};
const renderCompleted = (level: LevelCtrl): VNode => {
  const rank = getLevelRank(level.blueprint, level.vm.score), list = PRAISE[rank];
  return div(
    '.result.completed',
    {
      class: { next: !!level.blueprint.nextButton },
      hook: bind('click', level.onComplete),
    },
    [
      h2(list[level.blueprint.id % list.length] || congrats()),
      level.blueprint.nextButton ? button(i18n.learn.next) : makeStars(level.blueprint, level.vm.score),
    ],
  );
};

// Слова вчителя завжди вміщаються в бульбашку: якщо текст довгий — шрифт трохи менший
const fitSay = (v: VNode) => {
  fitNow(v);
  setTimeout(() => fitNow(v), 400); // ще раз, коли анімація появи бульбашки закінчиться
};
const fitNow = (v: VNode) =>
  requestAnimationFrame(() => {
    const el = (v.elm as HTMLElement)?.querySelector<HTMLElement>('.goal, .result, .lg-demo-say');
    if (!el) return;
    // межа — висота блоку вчителя (бульбашка росте вниз до неї, далі — менший шрифт)
    const max = (v.elm as HTMLElement).clientHeight - 6;
    if (max < 40) return;
    let fs = 16;
    el.style.fontSize = fs + 'px';
    while (el.scrollHeight > max && fs > 11) el.style.fontSize = --fs + 'px';
  });

// ---------- logic-games-kids: вчитель (Пан Сова) — угорі ліворуч, праворуч його слова ----------
let teacherSvg: Promise<string> | undefined;
const loadTeacher = () =>
  (teacherSvg ||= fetch(new URL('../shared/opponents/toon-teacher.svg', location.href).href + (document.querySelector('script[src*="app.js"]')?.getAttribute('src')?.match(/\?v=\d+/)?.[0] || ''))
    .then(r => r.text())
    .catch(() => ''));
// коли слова міняються — вчитель трохи «говорить» (рот рухається)
let sayKey = '', talkUntil = 0;
const teacherView = (ctrl: RunCtrl, key: string, mood: string): VNode => {
  const now = Date.now();
  if (key !== sayKey) {
    sayKey = key;
    talkUntil = now + 1600;
    setTimeout(ctrl.redraw, 1650);
  }
  return div('.lg-teacher', {
    class: { talking: now < talkUntil && !mood, 'mood-happy': mood === 'happy', thinking: mood === 'thinking' },
    attrs: { 'aria-label': 'Пан Сова' },
    hook: { insert: (v: VNode) => void loadTeacher().then(t => ((v.elm as HTMLElement).innerHTML = t)) },
  });
};

// logic-games-kids: приклад на початку етапу — підпис до кроку й кнопки «Ще раз» / «Почати»
const renderDemo = (ctrl: RunCtrl): VNode =>
  div('.lg-demo', [
    div('.goal.lg-demo-say', [
      p('.lg-demo-title', '📖 Приклад · ' + ctrl.stage.title),
      p(withLinebreaks(ctrl.demoText() || ctrl.stage.intro)),
      ctrl.demoDone() ? p('.lg-demo-you', 'Тепер ти! Натисни «Почати» 👇') : null,
    ]),
    div('.lg-demo-btns', [
      button('.lg-demo-again', { hook: bind('click', ctrl.replayDemo) }, '🔁 Ще раз'),
      button('.lg-demo-go', { class: { ready: ctrl.demoDone() }, hook: bind('click', ctrl.endDemo) }, '▶️ Почати'),
    ]),
  ]);

export const runView = (ctrl: LearnCtrl) => {
  const runCtrl = ctrl.runCtrl;
  const { stage, levelCtrl } = runCtrl;
  const rootClass: Classes = {
    starting: !!levelCtrl.vm.starting,
    completed: levelCtrl.vm.completed && !levelCtrl.blueprint.nextButton,
    'last-step': levelCtrl.vm.lastStep,
    'piece-values': !!levelCtrl.blueprint.showPieceValues,
  };
  if (stage.cssClass) rootClass[stage.cssClass] = true;
  if (levelCtrl.blueprint.cssClass) rootClass[levelCtrl.blueprint.cssClass] = true;
  rootClass['lg-demo-on'] = runCtrl.demo();
  return div('.learn.learn--run', { class: rootClass }, [
    // logic-games-kids (телефон): угорі — меню, рівні з зірочками й «Приклад», щоб усе було на одному екрані
    div('.lg-run-top', [
      a('../index.html#learn')('.lg-run-menu', { attrs: { title: 'Меню уроків' } }, '☰'),
      progressView(runCtrl),
      // кнопка повного екрана (як у грі з роботом) — її малює й веде shared/kit.js
      div('.lg-run-fs', {
        hook: { insert: (v: VNode) => { const b = (window as any).LG?.fsButton?.(); if (b) (v.elm as HTMLElement).appendChild(b); } },
      }),
    ]),
    div('.learn__main.main-board', { class: { apples: levelCtrl.isAppleLevel() } }, [
      runCtrl.stageStarting() ? stageStarting(runCtrl) : null,
      runCtrl.stageCompleted() ? stageComplete(runCtrl) : null,
      chessground(ctrl.runCtrl),
      promotionView(ctrl.runCtrl),
    ]),
    div('.learn__table', { hook: { insert: fitSay, postpatch: (_o: VNode, v: VNode) => fitSay(v) } }, [
      div('.wrap', [
        teacherView(
          runCtrl,
          runCtrl.demo() ? 'demo' + runCtrl.demoText() : levelCtrl.vm.failed ? 'fail' : levelCtrl.vm.completed ? 'done' : (levelCtrl.vm.hint || '') + levelCtrl.blueprint.id + stage.key,
          levelCtrl.vm.completed ? 'happy' : !runCtrl.demo() && (levelCtrl.vm.hint || levelCtrl.vm.failed) ? 'thinking' : '',
        ),
        div('.title', [
          img(stage.image, '')(),
          div('.text', [h2(stage.title), p('.subtitle', stage.subtitle)]),
        ]),
        runCtrl.demo()
          ? renderDemo(runCtrl)
          : levelCtrl.vm.failed
          ? renderFailed(runCtrl)
          : levelCtrl.vm.completed
            ? renderCompleted(levelCtrl)
            : levelCtrl.vm.hint
              ? div('.goal.lg-hint', levelCtrl.vm.hint)
              : div('.goal', withLinebreaks(levelCtrl.blueprint.goal)),
        progressView(runCtrl),
        !runCtrl.demo() && runCtrl.hasDemo()
          ? button('.lg-demo-open', { hook: bind('click', runCtrl.replayDemo) }, '📖 Приклад')
          : null,
      ]),
    ]),
  ]);
};
