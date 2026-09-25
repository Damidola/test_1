/* Маленькі картинки суперників для вибору (shared/opponents/thumbs/*.webp):
   мультяшний персонаж разом зі своєю сценою — один растровий файл, тож у списку нічого не домальовується й не блимає.
   Запуск (з кореня сайту, сервер на :8777): node tools/opp-thumbs.cjs
   Потрібен playwright (npm i -g playwright). Після зміни персонажа чи сцени — запустити знову. */
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
(async () => {
  const src = fs.readFileSync('shared/opponent.js', 'utf8');
  const list = [...src.matchAll(/\['([^']+)', \d, '([^']+)', '([^']+)'(?:, '([^']+)')?\]/g)].map(m => ({ file: m[2], bg: m[3], pos: m[4] || 'center' }));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 200, height: 200 }, deviceScaleFactor: 1 });
  for (const o of list) {
    const toon = o.file.endsWith('.svg');
    await p.goto('http://localhost:8777/tools/');
    await p.setContent(`<body style="margin:0"><div style="width:200px;height:200px;${toon ? `background:url('http://localhost:8777/shared/bg/${o.bg}.svg') center/cover` : ''}">
      <img src="http://localhost:8777/shared/opponents/${o.file}" style="width:200px;height:200px;object-fit:cover;object-position:${o.pos};display:block"></div></body>`);
    await p.waitForLoadState('networkidle'); await p.waitForTimeout(150);
    const out = 'shared/opponents/thumbs/' + o.file.replace(/\.\w+$/, '.webp');
    const png = await p.screenshot({ type: 'png' });
    fs.writeFileSync('/tmp/thumb.png', png);
    require('child_process').execSync(`python3 -c "from PIL import Image; Image.open('/tmp/thumb.png').convert('RGB').save('${out}', 'WEBP', quality=82)"`);
    console.log(out, fs.statSync(out).size);
  }
  await b.close();
})();
