// Punto de entrada: bucle principal del juego.
import { S } from "./core/store.js";
import { musicUpdate } from "./audio/music.js";
import { player } from "./game/world.js";
import { updateProjectiles } from "./game/combat.js";
import { tickFx, update } from "./game/update.js";
import { render } from "./render/renderer.js";
import { showTitle } from "./ui/screens.js";

S.last = performance.now();
function frame(t) {
  const dt = Math.min((t - S.last) / 1000, .05); S.last = t;
  if (S.state === "playing") update(dt);
  else if (S.state === "dead") { S.hurtFlash = Math.max(.3, S.hurtFlash - dt); updateProjectiles(dt); tickFx(dt); }
  else if (S.state === "title" || S.state === "shop") { player.a += dt * .18; S.stats.time += dt; for (const e of S.enemies) e.anim += dt * .5; }
  musicUpdate(dt);
  if (S.L) render(S.state !== "title" && S.state !== "shop");
  requestAnimationFrame(frame);
}
showTitle();
requestAnimationFrame(frame);
