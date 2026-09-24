/* Кружечки рівнів угорі уроку (як в уроках фігур): зелений ✓ — без помилок, жовтий ✓ — з помилками,
   поточний — з обводкою, далі — закриті, доки не пройдено попередній. Результати — LG.store 'lvl:<ключ>'. */
export function createLevels(el, key, n, onPick) {
  const LG = window.LG, get = () => LG.store.get('lvl:' + key, []);
  let cur = 0;
  const open = () => { const r = get(); let i = 0; while (i < n - 1 && r[i]) i++; return i; };
  function render() {
    const r = get(), o = open();
    el.innerHTML = Array.from({ length: n }, (_, i) => {
      const st = r[i] === 'perfect' ? 'done perfect' : r[i] ? 'done passed' : i <= o ? 'open' : 'locked';
      return `<button type="button" class="lv ${st}${i === cur ? ' cur' : ''}" data-i="${i}" ${i > o && !r[i] ? 'disabled' : ''}>${r[i] ? '✓' : i + 1}</button>`;
    }).join('');
  }
  el.addEventListener('click', e => { const b = e.target.closest('.lv'); if (!b || b.disabled) return; onPick(+b.dataset.i); });
  return {
    open,
    set(i) { cur = i; render(); },
    // рівень пройдено: perfect — без помилок (жовтий не «перефарбовує» зелений)
    done(i, perfect) { const r = get(); if (r[i] !== 'perfect') r[i] = perfect ? 'perfect' : 'passed'; LG.store.set('lvl:' + key, r); render(); },
    render
  };
}
