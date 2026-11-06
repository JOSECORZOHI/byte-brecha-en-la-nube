// Actualización por fotograma del mundo.
import { S } from "../core/store.js";
import { ri, rr } from "../core/config.js";
import { maxHealth, moveMul, regenDelay, regenRate } from "../core/profile.js";
import { sfx } from "../audio/sfx.js";
import { input, msg, player } from "./world.js";
import { computeFlow } from "../engine/raycast.js";
import { moveEnt } from "./movement.js";
import { canReload, curWeapon, fire, startReload, updateReload } from "./player.js";
import { updateEnemies } from "./ai.js";
import { updateProjectiles, updateVoids } from "./combat.js";
import { updateDoors, updateItems } from "./items.js";

function update(dt) {
  S.stats.time += dt;
  const K = input.keys, p = player, ox = p.x, oy = p.y;
  p.a += input.mouseDX * .0028; input.mouseDX = 0;
  if (K.ArrowLeft) p.a -= 2.6 * dt;
  if (K.ArrowRight) p.a += 2.6 * dt;
  let f = 0, s = 0;
  if (K.KeyW || K.ArrowUp) f++;
  if (K.KeyS || K.ArrowDown) f--;
  if (K.KeyA) s--;
  if (K.KeyD) s++;
  const len = Math.hypot(f, s);
  p.moving = len > 0;
  if (len > 0) {
    const fast = K.ShiftLeft || K.ShiftRight, sp = (fast ? 5.4 : 3.4) * moveMul() * dt / len, ca = Math.cos(p.a), sa = Math.sin(p.a);
    moveEnt(p, (ca * f - sa * s) * sp, (sa * f + ca * s) * sp, .24);
    p.bob += dt * (fast ? 13 : 10);
  }
  p.vx = (p.x - ox) / Math.max(dt, 1e-3); p.vy = (p.y - oy) / Math.max(dt, 1e-3);
  p.cooldown -= dt; p.fireAnim = Math.max(0, p.fireAnim - dt * 4); p.raise = Math.max(0, p.raise - dt * 4);
  p.inspectT = Math.max(0, p.inspectT - dt);
  updateReload(dt);
  const w = curWeapon();
  if (w.ammo && p.mag[w.id] === 0 && canReload(w) && p.reloadT <= 0 && p.cooldown <= 0) startReload();
  if (input.fire || K.KeyF) fire();
  // Regeneración fuera de combate
  p.combatT += dt;
  const wasRegen = p.regen, mh = maxHealth();
  p.regen = p.combatT > regenDelay() && p.health > 0 && p.health < mh;
  if (p.regen) p.health = Math.min(mh, p.health + regenRate() * dt);
  if (p.regen && !wasRegen) { msg("Fuera de combate · regenerando integridad", "#39ff88"); sfx("regen"); }
  // Mundo
  S.flowTimer -= dt; if (S.flowTimer <= 0) { computeFlow(); S.flowTimer = .35; }
  updateDoors(dt); updateEnemies(dt); updateProjectiles(dt); updateVoids(dt); updateItems(dt);
  tickFx(dt);
  for (const m of S.messages) m.life -= dt;
  S.messages = S.messages.filter(m => m.life > 0);
  S.hurtFlash = Math.max(0, S.hurtFlash - dt * 1.2); S.pickFlash = Math.max(0, S.pickFlash - dt); S.introT = Math.max(0, S.introT - dt);
  S.bitPulse = Math.max(0, S.bitPulse - dt);
  p.hurtT = Math.max(0, p.hurtT - dt); p.hitT = Math.max(0, p.hitT - dt); p.killT = Math.max(0, p.killT - dt); p.shake = Math.max(0, p.shake - dt * 2.5);
  for (const h of p.hurtDirs) h.t -= dt * 1.2;
  p.hurtDirs = p.hurtDirs.filter(h => h.t > 0);
  p.faceT -= dt; if (p.faceT <= 0) { p.faceLook = ri(-1, 1); p.faceT = rr(.6, 2); }
}
function tickFx(dt) {
  for (const e of S.effects) e.t += dt;
  S.effects = S.effects.filter(e => e.t < e.life);
  for (const b of S.bolts) b.t += dt;
  S.bolts = S.bolts.filter(b => b.t < b.life);
  for (const q of S.popups) q.t += dt;
  S.popups = S.popups.filter(q => q.t < .8);
  S.decor = S.decor.filter(d => !d.gone);
}

export { update, tickFx };
