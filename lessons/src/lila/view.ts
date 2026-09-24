import { h, type VNode } from 'snabbdom';

import type { LearnCtrl } from './ctrl';
import { runView } from './run/runView';

// logic-games-kids: лише екран уроку (мапи уроків Lichess немає — її замінює застосунок)
export const view = (ctrl: LearnCtrl): VNode => (ctrl.inStage() ? runView(ctrl) : h('div.learn'));
