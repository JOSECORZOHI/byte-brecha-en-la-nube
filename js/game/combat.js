// Daño, botín, proyectiles y explosiones.
import { S } from "../core/store.js";
import { angDiff, clamp, rr } from "../core/config.js";
import { dmgMul, lootMul } from "../core/profile.js";
import { EDEF } from "../data/enemies.js";
import { WD } from "../data/weapons.js";
import { sfx } from "../audio/sfx.js";
import { isSolid, msg, player } from "./world.js";
import { lineOfSight } from "../engine/raycast.js";
import { moveEnt } from "./movement.js";
import { damageTarget } from "./player.js";
import { spawnMinion, wake } from "./ai.js";
import { showDead } from "../ui/screens.js";

function damageEnemy(e, amount, byPlayer = true, silent = false) {
  if (e.dead) return;
  if (EDEF[e.type].boss && e.shielded) amount *= .1;
  e.hp -= amount;
  if (byPlayer && !silent) {
    player.hitT = .12;
    S.popups.push({ x: e.x, y: e.y, z: .75 + Math.random() * .2, text: String(Math.round(amount)), col: amount >= 40 ? "#ffb703" : "#ffffff", t: 0, ox: rr(-.25, .25) });
    if (S.popups.length > 40) S.popups.shift();
    S.effects.push({ x: e.x, y: e.y, kind: "spark", t: 0, life: .12, z: .3 });
  }
  const dist = Math.hypot(e.x - player.x, e.y - player.y);
  if (e.hp <= 0) { killEnemy(e, dist); return; }
  wake(e);
  if (!silent) sfx("hit");
  if (Math.random() < EDEF[e.type].pain && e.state !== "attack" && !silent) { e.state = "pain"; e.t = .22; sfx("epain", dist); }
}
function killEnemy(e, dist) {
  const d = EDEF[e.type];
  e.dead = true; e.state = "dead"; S.stats.kills++;
  sfx("edeath", dist); sfx("kill"); player.killT = .35;
  dropLoot(e, d);
  if (d.split) { spawnMinion("glitch", e.x, e.y); spawnMinion("glitch", e.x, e.y); sfx("split", dist); }
  if (d.boss) {
    msg(`${d.name} DESTRUIDO · la salida está abierta`, "#39ff88");
    for (const o of S.enemies) if (!o.dead && (o.type === "decoy" || o.type === "pylon")) { o.dead = true; o.state = "dead"; S.stats.kills++; }
    for (let i = 0; i < 6; i++) setTimeout(() => explosion(e.x + rr(-1, 1), e.y + rr(-1, 1), 1.2, 0), i * 150);
  }
}
function dropLoot(e, d) {
  const total = Math.max(1, Math.round(rr(d.loot[0], d.loot[1]) * (e.elite ? 2.5 : 1) * (1 + S.sector * .05) * lootMul()));
  const coins = Math.min(5, 1 + Math.floor(total / 8)), each = Math.floor(total / coins);
  for (let i = 0; i < coins; i++) dropItem(e, "bit", i === coins - 1 ? total - each * (coins - 1) : each);
  if (Math.random() < .28) dropItem(e, pickAmmoKind());
  if (e.elite) dropItem(e, Math.random() < .5 ? "H" : "a");
  else if (Math.random() < .1) dropItem(e, "h");
}
function dropItem(e, kind, value) {
  const a = Math.random() * Math.PI * 2, s = rr(.6, 1.8);
  S.items.push({ x: e.x, y: e.y, kind, value, drop: true, vx: Math.cos(a) * s, vy: Math.sin(a) * s });
}
function pickAmmoKind() {
  const o = ["i"], sl = player.slots;
  if (sl.includes("shotgun")) o.push("k");
  if (sl.some(id => id && WD[id].ammo === "cells")) o.push("c");
  if (sl.includes("rocket")) o.push("q");
  return o[Math.floor(Math.random() * o.length)];
}
function updateProjectiles(dt) {
  for (const p of S.projectiles) {
    if (p.dead) continue;
    if (p.kind === "mine") {
      p.life -= dt; p.arm -= dt;
      if (p.life <= 0) { p.dead = true; S.effects.push({ x: p.x, y: p.y, kind: "spark", t: 0, life: .2, z: .1 }); continue; }
      if (p.arm <= 0 && Math.hypot(p.x - player.x, p.y - player.y) < 1) { p.dead = true; explosion(p.x, p.y, 1.6, p.dmg, { fromEnemy: true }); }
      continue;
    }
    if (p.kind === "homing") { // gira hacia el jugador con velocidad angular limitada
      const sp = Math.hypot(p.vx, p.vy), cur = Math.atan2(p.vy, p.vx), want = Math.atan2(player.y - p.y, player.x - p.x);
      const na = cur + clamp(angDiff(want, cur), -2.2 * dt, 2.2 * dt); p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
    }
    if (p.life !== undefined) { p.life -= dt; if (p.life <= 0) { impact(p, p.x, p.y); continue; } }
    const steps = Math.ceil(Math.hypot(p.vx, p.vy) * dt / .1);
    for (let s = 0; s < steps && !p.dead; s++) {
      const ox = p.x, oy = p.y;
      p.x += p.vx * dt / steps; p.y += p.vy * dt / steps;
      if (isSolid(Math.floor(p.x), Math.floor(p.y))) { impact(p, ox, oy); break; }
      if (p.from === "enemy") {
        if (Math.hypot(p.x - player.x, p.y - player.y) < .35) { if (p.kind !== "rocket") damagePlayer(p.dmg, p.x - p.vx, p.y - p.vy); impact(p, p.x, p.y); }
      } else {
        for (const e of S.enemies) if (!e.dead && Math.hypot(p.x - e.x, p.y - e.y) < EDEF[e.type].hitR) { if (p.kind === "plasma") damageEnemy(e, p.dmg); impact(p, p.x, p.y); break; }
      }
      if (!p.dead) for (const b of S.decor) if (b.kind === "o" && b.hp > 0 && Math.hypot(p.x - b.x, p.y - b.y) < .3) { damageTarget(b, p.dmg); impact(p, p.x, p.y); break; }
    }
  }
  S.projectiles = S.projectiles.filter(p => !p.dead);
}
function impact(p, x, y) {
  p.dead = true;
  if (p.kind === "rocket") explosion(x, y, 1.7, p.dmg * 1.4, { fromEnemy: true });
  else if (p.kind === "prock") explosion(x, y, 2.2, p.dmg, { byPlayer: true, selfMul: .35 });
  else if (p.kind === "void") { S.voids.push({ x, y, t: 0, life: 1.3, dmg: p.dmg }); sfx("void"); }
  else { S.effects.push({ x, y, kind: "spark", t: 0, life: .15, z: .3 }); sfx("hitwall", Math.hypot(x - player.x, y - player.y)); }
}
function updateVoids(dt) {
  for (const v of S.voids) {
    v.t += dt;
    for (const e of S.enemies) {
      if (e.dead) continue;
      const dx = v.x - e.x, dy = v.y - e.y, d = Math.hypot(dx, dy);
      if (d > 5 || d < .05) continue;
      const pull = (3.5 * (1 - d / 5) + 1) * dt;
      moveEnt(e, dx / d * Math.min(pull, d), dy / d * Math.min(pull, d), EDEF[e.type].r);
      damageEnemy(e, 40 * dt * dmgMul(), true, true);
    }
    if (v.t >= v.life) { v.done = true; explosion(v.x, v.y, 3.2, 160 * dmgMul() * (v.dmg / 30), { byPlayer: true, selfMul: .3 }); }
  }
  S.voids = S.voids.filter(v => !v.done);
}
function explodeBarrel(b) { b.hp = 0; b.solid = false; b.gone = true; explosion(b.x, b.y, 2.3, 70, { byPlayer: true }); }
function explosion(x, y, radius, dmg, o = {}) {
  S.effects.push({ x, y, kind: "boom", t: 0, life: .45 });
  const pd = Math.hypot(player.x - x, player.y - y);
  sfx("boom", pd);
  if (pd < radius + 2) player.shake = Math.max(player.shake, .5);
  if (dmg <= 0) return;
  if (pd < radius && lineOfSight(x, y, player.x, player.y)) damagePlayer(dmg * (1 - pd / radius) * (o.selfMul ?? (o.fromEnemy ? 1 : .8)), x, y);
  for (const e of S.enemies.slice()) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - x, e.y - y), def = EDEF[e.type];
    if (d < radius && lineOfSight(x, y, e.x, e.y)) damageEnemy(e, dmg * (1 - d / radius) * (o.fromEnemy ? (e.type === "brute" ? .2 : def.boss ? 0 : 1) : 1), !!o.byPlayer);
  }
  for (const b of S.decor) { if (b.kind !== "o" || b.hp <= 0 || b.exploding) continue; if (Math.hypot(b.x - x, b.y - y) < radius) { b.exploding = true; setTimeout(() => explodeBarrel(b), 150); } }
}
function damagePlayer(amount, sx, sy) {
  if (player.health <= 0 || S.state !== "playing") return;
  amount *= S.diff.dmg;
  player.combatT = 0; player.regen = false; player.shake = Math.max(player.shake, .25);
  if (sx !== undefined) player.hurtDirs.push({ a: Math.atan2(sy - player.y, sx - player.x), t: 1 });
  if (player.armor > 0) { const absorbed = Math.min(player.armor, amount / 3); player.armor -= absorbed; amount -= absorbed; }
  player.health -= amount; player.hurtT = .4;
  S.hurtFlash = Math.min(.6, S.hurtFlash + amount / 40);
  if (player.health <= 0) { player.health = 0; sfx("death"); S.state = "dead"; setTimeout(showDead, 900); }
  else sfx("hurt");
}

export { damageEnemy, killEnemy, dropLoot, dropItem, pickAmmoKind, updateProjectiles, impact, updateVoids, explodeBarrel, explosion, damagePlayer };
