/* «Як ходять фігури» — Lichess Learn (lila/ui/learn) повністю: і рівні, і екрани.
   Тут лише під'єднання до сайту: дошка й фігури з налаштувань, тема, прогрес, автоповтор. */
import './i18n';
import './site'; // до коду Lichess: його sound.ts одразу звертається до site.sound
import { applyBoardLook } from '../../shared/board.js';
import { initModule } from './lila/learn';
import { Coords } from './shims/lib-misc';

(globalThis as any).$html = (s: TemplateStringsArray, ...v: unknown[]) => s.reduce((a, x, i) => a + x + (i < v.length ? v[i] : ''), '');
const LG = (window as any).LG;




// Світла/нічна тема сайту → класи тем Lichess
const syncTheme = () => document.documentElement.classList.toggle('light', !document.documentElement.classList.contains('lg-night'));
syncTheme();
new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

document.body.classList.add('is2d'); // як у Lichess: 2D-дошка
applyBoardLook();

// Урок відкривається з дошкою вгорі — навіть якщо мапу уроків перед тим прокрутили вниз
const toTop = () => { document.getElementById('main-wrap')!.scrollTop = 0; };
window.addEventListener('hashchange', toTop);

// Мапи уроків Lichess немає: без етапу в адресі — назад до уроків застосунку
if (!/^#\/\d/.test(location.hash)) location.replace('../index.html#learn');

initModule({ pref: { coords: Coords.Inside, destination: true, is3d: false } });
toTop();

// Помилка: після показу, що сталося, рівень починається заново сам (кнопка Lichess «Ще раз» теж працює)
let retryTimer = 0;
new MutationObserver(() => {
  const failed = document.querySelector<HTMLElement>('.learn__table .result.failed');
  if (failed && !retryTimer) retryTimer = window.setTimeout(() => { retryTimer = 0; document.querySelector<HTMLElement>('.learn__table .result.failed')?.click(); }, 1500);
  if (!failed && retryTimer) { clearTimeout(retryTimer); retryTimer = 0; }
}).observe(document.getElementById('learn-app')!, { childList: true, subtree: true });
