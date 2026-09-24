/* Перекладач сторінки (коли обрано English): замінює українські тексти за словником window.LG_EN.
   Спершу шукає всю фразу, потім — відомі шматки фрази (довші — першими, лише цілими словами).
   Стежить за змінами сторінки (MutationObserver), тож перекладає й те, що ігри малюють пізніше. */
(function () {
  'use strict';
  const D = window.LG_EN || {};
  const CY = /[А-Яа-яІіЇїЄєҐґ]/;
  const L = 'А-Яа-яІіЇїЄєҐґ’\'';
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keys = Object.keys(D).filter(k => CY.test(k)).sort((a, b) => b.length - a.length);
  const parts = keys.map(k => [new RegExp('(^|[^' + L + '])' + esc(k) + '(?![' + L + '])', 'g'), D[k]]);
  const cache = new Map();
  function tr(s) {
    if (!s || !CY.test(s)) return s;
    if (cache.has(s)) return cache.get(s);
    const t = s.trim();
    let r;
    if (D[t] !== undefined) r = s.replace(t, D[t]);
    else {
      r = s;
      for (const [re, v] of parts) { if (!CY.test(r)) break; re.lastIndex = 0; if (re.test(r)) { re.lastIndex = 0; r = r.replace(re, (m, pre) => pre + v); } }
    }
    if (cache.size > 5000) cache.clear();
    cache.set(s, r);
    return r;
  }
  const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  // пишемо лише те, що справді змінилось, — інакше спостерігач ганятиме сам себе
  function attr(el, a) { const v = el.getAttribute(a); if (!v || !CY.test(v)) return; const t = tr(v); if (t !== v) el.setAttribute(a, t); }
  function node(n) {
    if (n.nodeType === 3) { const v = tr(n.data); if (v !== n.data) n.data = v; return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
    for (const a of ATTRS) attr(n, a);
    if (tag === 'META' && n.name === 'description' && tr(n.content) !== n.content) n.content = tr(n.content);
    for (let c = n.firstChild; c; c = c.nextSibling) node(c);
  }
  window.LG_T = tr; // для текстів поза сторінкою (confirm, alert, полотно)
  document.documentElement.lang = 'en';
  node(document.documentElement);
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') node(m.target);
      else if (m.type === 'attributes') attr(m.target, m.attributeName);
      else m.addedNodes.forEach(node);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  for (const f of ['alert', 'confirm', 'prompt']) { const o = window[f]; window[f] = (msg, ...a) => o.call(window, tr(String(msg ?? '')), ...a); }
})();
