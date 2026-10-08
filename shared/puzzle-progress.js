/* Прогрес прив'язаний до ID контенту. Нові задачі не успадковують старі позначки. */
export function syncPuzzleProgress(store, data) {
  for (const [section, rows] of Object.entries(data)) {
    const ids = rows.map(row => row[0]), valid = new Set(ids), signature = ids.join('|');
    const prior = store.get('puzbank:' + section, '');
    const old = store.get('puz:' + section, []), solved = old.filter(id => valid.has(id));
    const results = store.get('puzres:' + section, {});
    const kept = Object.fromEntries(Object.entries(results).filter(([id]) => valid.has(id)));
    if (solved.length !== old.length) store.set('puz:' + section, solved);
    if (Object.keys(kept).length !== Object.keys(results).length) store.set('puzres:' + section, kept);
    if ((prior && prior !== signature) || (!prior && rows[0]?.[5]?.version >= 2)) {
      store.set('puzopen:' + section, 0); store.set('lvl:puz-' + section, []);
    }
    if (prior !== signature) store.set('puzbank:' + section, signature);
  }
}
export function puzzleStats(store, section, rows) {
  const solved = new Set(store.get('puz:' + section, [])), results = store.get('puzres:' + section, {});
  let done = 0, tried = 0, sum = 0, next = -1;
  rows.forEach(([id], i) => {
    const result = results[id] || (solved.has(id) ? 'g' : '');
    if (result) { tried++; sum += result === 'g' ? 100 : result === 'y' ? 50 : 0; if (result !== 'r') done++; }
    if (next < 0 && (!result || result === 'r')) next = i;
  });
  return { n: rows.length, done, tried, sum, pct: rows.length ? Math.round(sum / rows.length) : 0, next: next < 0 ? 0 : next };
}
