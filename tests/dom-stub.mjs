// Entorno de navegador mínimo para ejecutar los módulos del juego en Node (sin DOM real).
// El canvas acepta cualquier llamada de dibujo sin hacer nada; el bucle se avanza a mano con step().
const grad = { addColorStop() {} };
function fakeContext() {
  return new Proxy({}, {
    get: (o, k) => k in o ? o[k]
      : (k === "createLinearGradient" || k === "createRadialGradient") ? () => grad
      : k === "getImageData" ? () => ({})
      : k === "measureText" ? () => ({ width: 10 })
      : () => {},
    set: (o, k, v) => (o[k] = v, true),
  });
}
export const dom = { overlayHTML: "", listeners: {}, raf: null, time: 0 };
function fakeElement() {
  return {
    width: 0, height: 0, getContext: fakeContext, toDataURL: () => "data:image/png;base64,",
    addEventListener() {}, requestPointerLock() {}, querySelectorAll: () => [],
    classList: { add() {}, remove() {}, toggle() {} },
    set innerHTML(v) { dom.overlayHTML = v; }, get innerHTML() { return dom.overlayHTML; },
  };
}
const storage = {};
Object.assign(globalThis, {
  document: { getElementById: fakeElement, createElement: fakeElement, addEventListener() {}, pointerLockElement: null, exitPointerLock() {} },
  window: { addEventListener: (n, f) => (dom.listeners[n] ||= []).push(f) },
  localStorage: { getItem: k => storage[k] ?? null, setItem: (k, v) => (storage[k] = String(v)), removeItem: k => delete storage[k] },
  performance: { now: () => dom.time },
  requestAnimationFrame: f => (dom.raf = f),
  setTimeout: f => f(),   // las demoras se ejecutan al instante para que las pruebas sean deterministas
  confirm: () => true,
});

/** Avanza n fotogramas de ~60 FPS. */
export function step(n = 1) { for (let i = 0; i < n; i++) { dom.time += 16.67; dom.raf(dom.time); } }
/** Simula pulsar (y soltar) una tecla por su código, p. ej. "KeyE". */
export function press(code) {
  const ev = { code, repeat: false, preventDefault() {} };
  for (const f of dom.listeners.keydown || []) f(ev);
  for (const f of dom.listeners.keyup || []) f(ev);
}
/** Arranca el juego (pantalla de título). */
export async function boot() { await import("../js/main.js"); step(2); }
