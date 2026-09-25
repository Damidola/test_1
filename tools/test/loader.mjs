// Для node --test: модулі сайту імпортують chessops/chessground з CDN — підставляємо локальні пакети (npm install)
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('https://cdn.jsdelivr.net/npm/chessops')) return next('chessops', ctx);
  if (spec.startsWith('https://cdn.jsdelivr.net/npm/@lichess-org/chessground')) return { url: 'data:text/javascript,export const Chessground=()=>({});', shortCircuit: true };
  return next(spec, ctx);
}
