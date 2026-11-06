// Teclado, ratón y bloqueo del puntero.
import { S } from "../core/store.js";
import { cv } from "../core/config.js";
import { INSPECT_T, MAX_SLOTS, WD } from "../data/weapons.js";
import { audioInit } from "../audio/sfx.js";
import { toggleMusic } from "../audio/music.js";
import { input, player } from "../game/world.js";
import { hasAmmo, selectMelee, selectSlot, startReload, useAction } from "../game/player.js";
import { hideOv, showPause } from "./screens.js";

function requestLock() { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
document.addEventListener("pointerlockchange", () => {
  const was = S.locked; S.locked = document.pointerLockElement === cv;
  if (was && !S.locked && S.state === "playing") { S.state = "paused"; input.fire = false; showPause(); }
});
cv.addEventListener("mousedown", e => { audioInit(); if (S.state !== "playing") return; if (!S.locked) requestLock(); if (e.button === 0) input.fire = true; });
window.addEventListener("mouseup", e => { if (e.button === 0) input.fire = false; });
window.addEventListener("mousemove", e => { if (S.locked && S.state === "playing") input.mouseDX += e.movementX; });
window.addEventListener("wheel", e => {
  if (S.state !== "playing") return;
  const dir = e.deltaY > 0 ? 1 : -1, cur = Math.max(0, player.slots.indexOf(player.weapon));
  for (let k = 1; k <= MAX_SLOTS; k++) { const i = (cur + dir * k + MAX_SLOTS * 2) % MAX_SLOTS, id = player.slots[i]; if (id && hasAmmo(WD[id])) { selectSlot(i); break; } }
}, { passive: true });
window.addEventListener("keydown", e => {
  if (["Space", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  input.keys[e.code] = true;
  if (S.state === "playing") {
    if ((e.code === "KeyE" || e.code === "Space") && !e.repeat) useAction();
    if (e.code === "KeyR" && !e.repeat) startReload();
    if (e.code === "Tab" && !e.repeat) S.showMap = !S.showMap;
    if (/^Digit[1-4]$/.test(e.code)) selectSlot(+e.code.slice(5) - 1);
    if (e.code === "KeyV" && !e.repeat) selectMelee();
    if (e.code === "KeyI" && !e.repeat && player.reloadT <= 0 && player.raise < .3) player.inspectT = player.inspectT > 0 ? 0 : INSPECT_T;
    if (e.code === "Escape" && !S.locked) { S.state = "paused"; showPause(); }
  } else if (S.state === "paused" && e.code === "Escape" && !e.repeat) { S.state = "playing"; hideOv(); requestLock(); }
});
window.addEventListener("keyup", e => { input.keys[e.code] = false; });
// Los navegadores solo permiten sonido tras una interacción: la primera tecla o clic arranca la música
window.addEventListener("pointerdown", audioInit);
window.addEventListener("keydown", e => { audioInit(); if (e.code === "KeyM" && !e.repeat) toggleMusic(); });
window.addEventListener("blur", () => { input.keys = {}; input.fire = false; });

export { requestLock };
