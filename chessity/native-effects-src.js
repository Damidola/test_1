import lottie from 'lottie-web/build/player/lottie_light.js';

// APK: widgets/scores.dart StarDisplay/_StarWidgetState and animations/star.json.
const root = new URL('./assets/original/', import.meta.url);
let starData, context;
const buffers = new Map(), voices = new Set();
const settings = () => window.LG;

export function unlockAudio() {
  if (!context || context.state === 'closed') {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context = new Audio();
  }
  if (context.state !== 'running') return context.resume().catch(() => {});
}

export async function playSound(file) {
  if (settings()?.muted || settings()?.volume <= 0) return;
  try {
    await unlockAudio();
    if (!context) return;
    const active = context;
    if (!buffers.has(file)) buffers.set(file, fetch(new URL('sounds/' + file + '.mp3', root))
      .then(r => { if (!r.ok) throw Error('APK sound: ' + file); return r.arrayBuffer(); })
      .then(data => active.decodeAudioData(data)).catch(error => { buffers.delete(file); throw error; }));
    const buffer = await buffers.get(file);
    if (settings()?.muted || settings()?.volume <= 0) return;
    await unlockAudio();
    while (voices.size >= 8) voices.values().next().value.stop();
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = settings()?.volume ?? 1;
    source.connect(gain); gain.connect(context.destination);
    const voice = {stop() { voices.delete(voice); try { source.stop(); } catch {} }};
    voices.add(voice);
    source.onended = () => { voices.delete(voice); source.disconnect(); gain.disconnect(); };
    source.start();
    dispatchEvent(new CustomEvent('chessity:sound', {detail: {file, state: context.state}}));
  } catch (error) {
    // Keep the original sample on failures; never substitute a synthetic tone.
    dispatchEvent(new CustomEvent('chessity:sound-error', {detail: {file, message: error.message}}));
  }
}

for (const event of ['pointerdown', 'touchend', 'keydown']) addEventListener(event, () => {
  if (document.querySelector('#view-chessity:not([hidden])')) unlockAudio();
}, {passive: true});
for (const event of ['pageshow', 'focus', 'visibilitychange']) addEventListener(event, () => {
  if (context && !document.hidden) unlockAudio();
});

export function mountStars(element, count, animate = false) {
  let disposed = false;
  const timers = [], players = [];
  element.classList.add('ct-native-stars');
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', `Зірки: ${count} із 3`);
  element.innerHTML = Array.from({length: 3}, (_, i) => `<span class="ct-native-star-slot"><span class="ct-native-star ${i < count ? 'earned' : ''}" data-star-delay="${animate ? i * 780 : 0}"><span class="ct-icon" aria-hidden="true">&#xf01d4;</span>${i < count ? '<span class="ct-star-animation" aria-hidden="true"></span>' : ''}</span></span>`).join('');
  const fit = () => element.style.setProperty('--ct-star-lift', element.clientWidth * .16 + 'px');
  const observer = new ResizeObserver(fit); observer.observe(element); fit();
  starData ||= fetch(new URL('animations/star.json', root)).then(r => {
    if (!r.ok) throw Error('APK star animation'); return r.json();
  }).catch(error => { starData = null; throw error; });
  starData.then(data => {
    if (disposed) return;
    element.querySelectorAll('.ct-star-animation').forEach((container, i) => {
      const player = lottie.loadAnimation({container, renderer: 'svg', loop: false, autoplay: false, animationData: structuredClone(data)});
      players.push(player);
      player.addEventListener('DOMLoaded', () => {
        if (disposed) return;
        if (!animate) player.goToAndStop(player.totalFrames - 1, true);
        else timers.push(setTimeout(() => {
          if (!disposed) { container.classList.add('playing'); player.goToAndPlay(0, true); }
        }, i * 780));
      });
      if (!animate) container.classList.add('playing');
    });
  }).catch(() => {});
  return () => { disposed = true; observer.disconnect(); timers.forEach(clearTimeout); players.forEach(p => p.destroy()); };
}
