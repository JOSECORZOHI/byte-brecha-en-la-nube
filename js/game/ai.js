// IA de enemigos con personalidad procedural y jefes por módulos.
import { S } from "../core/store.js";
import { DIR4, angDiff, ri, rr } from "../core/config.js";
import { EDEF } from "../data/enemies.js";
import { sfx } from "../audio/sfx.js";
import { isSolid, msg, player } from "./world.js";
import { makeEnemy } from "./session.js";
import { lineOfSight } from "../engine/raycast.js";
import { blockedAt, moveEnt, moveToward } from "./movement.js";
import { damagePlayer } from "./combat.js";

function wake(e) {
  if (e.alert || e.dead) return;
  e.alert = true; e.state = "chase"; e.spotT = 0;
  sfx("alert", Math.hypot(e.x - player.x, e.y - player.y));
}
function alertAllies(src) {
  for (const o of S.enemies) {
    if (o.dead || o.alert || o === src || o.wakeDelay > 0) continue;
    const d = Math.hypot(o.x - src.x, o.y - src.y);
    if (d < 9 && (d < 5 || lineOfSight(o.x, o.y, src.x, src.y))) o.wakeDelay = rr(.2, .9);
  }
}
function flowStep(e, sign) {
  const cx = Math.floor(e.x), cy = Math.floor(e.y), cur = S.flow[cx + cy * S.MW];
  if (cur < 0) return null;
  let best = null, bv = cur;
  for (const [ox, oy] of DIR4) {
    const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= S.MW || ny >= S.MH) continue;
    const v = S.flow[nx + ny * S.MW]; if (v < 0) continue;
    if (sign < 0 ? v < bv : v > bv) { bv = v; best = [nx + .5, ny + .5]; }
  }
  return best;
}
function patrol(e, d, dt) {
  const room = S.LV.rooms[e.room];
  if (!room) return;
  if (e.wait > 0) { e.wait -= dt; return; }
  const dx = e.ptx - e.x, dy = e.pty - e.y, l = Math.hypot(dx, dy);
  if (l < .2) {
    e.wait = rr(1, 3);
    const tx = room.x0 + Math.floor(Math.random() * room.w), ty = room.y0 + Math.floor(Math.random() * room.h);
    if (!isSolid(tx, ty)) { e.ptx = tx + .5; e.pty = ty + .5; }
    return;
  }
  e.fa = Math.atan2(dy, dx);
  if (moveToward(e, e.ptx, e.pty, e.spd * .4 * dt, d.r)) e.anim += dt * .6; else { e.ptx = e.x; e.pty = e.y; }
}
function blink(e) {
  for (let k = 0; k < 14; k++) {
    const a = rr(0, Math.PI * 2), r = rr(1.4, 2.4), x = player.x + Math.cos(a) * r, y = player.y + Math.sin(a) * r;
    if (blockedAt(x, y, .3, e) || !lineOfSight(x, y, player.x, player.y)) continue;
    S.effects.push({ x: e.x, y: e.y, kind: "blink", t: 0, life: .3, z: .4 });
    e.x = x; e.y = y;
    S.effects.push({ x, y, kind: "blink", t: 0, life: .3, z: .4 });
    sfx("blink", r); e.blinkCd = rr(4, 7); e.cd = Math.min(e.cd, .35);
    return;
  }
  e.blinkCd = 1;
}
function startAttack(e, d, dist) {
  e.state = "attack"; e.t = d.atkTime; e.fired = false; e.burst = (d.burst || 1) - 1;
  if (d.snipe) sfx("charge", dist);
}
function updateEnemies(dt) {
  for (const e of S.enemies) {
    if (e.dead) continue;
    const d = EDEF[e.type];
    const dx = player.x - e.x, dy = player.y - e.y, dist = Math.hypot(dx, dy) || .01;
    const los = dist < 26 && lineOfSight(e.x, e.y, player.x, player.y);
    e.cd -= dt; e.blinkCd -= dt;
    if (e.type === "specter") e.alpha = e.state === "attack" ? .9 : .3 + .12 * Math.sin(S.stats.time * 7 + e.x);
    if (d.boss) { updateBoss(e, d, dt, dx, dy, dist, los); continue; }
    if (d.static) { if (!e.alert && dist < 20) e.alert = true; e.anim += dt; continue; }

    if (!e.alert) {
      if (e.wakeDelay > 0) { e.wakeDelay -= dt; if (e.wakeDelay <= 0) wake(e); continue; }
      patrol(e, d, dt);
      const facing = Math.abs(angDiff(Math.atan2(dy, dx), e.fa));
      if (los && dist < d.sight && (facing < 1.2 || dist < 4)) { e.spotT += dt; if (e.spotT > e.pers.react) { wake(e); alertAllies(e); } }
      else if (dist < 1.6) wake(e);
      else e.spotT = Math.max(0, e.spotT - dt);
      continue;
    }
    if (player.health <= 0) continue;
    if (los && dist < d.sight) player.combatT = 0;
    e.fa = Math.atan2(dy, dx);

    if (e.state === "pain") { e.t -= dt; if (e.t <= 0) e.state = "chase"; continue; }
    if (e.state === "attack") {
      e.t -= dt;
      if (!e.fired && e.t <= d.atkTime * (d.snipe ? .05 : .4)) { e.fired = true; enemyAttack(e, d, dist); }
      if (e.t <= 0) {
        if (e.burst > 0 && los) { e.burst--; e.t = .3; e.fired = false; }
        else { e.state = "chase"; e.cd = d.cd * rr(.8, 1.3); }
      }
      continue;
    }
    // Retirada cuando está muy herido (según su "valentía")
    if (e.type !== "glitch" && !e.retreated && e.hp < e.maxHp * e.pers.courage) { e.retreated = true; e.retreatT = rr(2, 3.5); }
    if (e.retreatT > 0) {
      e.retreatT -= dt;
      const n = flowStep(e, 1);
      if (n && moveToward(e, n[0], n[1], e.spd * 1.1 * dt, d.r)) e.anim += dt;
      if (los && e.cd <= 0 && !d.melee && Math.random() < .02) startAttack(e, d, dist);
      continue;
    }
    if (los && e.cd <= 0 && dist < d.range) { startAttack(e, d, dist); continue; }
    // Esquiva cuando el jugador le apunta y dispara
    if (e.dodgeT > 0) {
      e.dodgeT -= dt;
      if (moveEnt(e, -dy / dist * e.dodgeDir * e.spd * 2.2 * dt, dx / dist * e.dodgeDir * e.spd * 2.2 * dt, d.r)) e.anim += dt;
      continue;
    }
    if (los && player.fireAnim > .95 && dist > 2 && Math.abs(angDiff(player.a, Math.atan2(-dy, -dx))) < .2 && Math.random() < e.pers.dodge * .5) {
      e.dodgeT = .28; e.dodgeDir = Math.random() < .5 ? 1 : -1; continue;
    }
    if (!los) { const n = flowStep(e, -1); if (n && moveToward(e, n[0], n[1], e.spd * dt, d.r)) e.anim += dt; continue; }
    // Con línea de visión: cada tipo y personalidad se mueve distinto
    const ux = dx / dist, uy = dy / dist, px = -uy, py = ux;
    e.strafeT -= dt; if (e.strafeT <= 0) { e.strafeDir *= -1; e.strafeT = rr(.7, 2.2); }
    let mx = 0, my = 0;
    if (d.melee) {
      if (d.blink && e.blinkCd <= 0 && dist > 3 && dist < 10) { blink(e); continue; }
      const zig = Math.sin(S.stats.time * 4 + e.x * 3) * e.pers.aggr * .8;
      if (dist > .75) { mx = ux + px * zig; my = uy + py * zig; }
    } else {
      const lo = d.pref[0] * e.pers.pref, hi = d.pref[1] * e.pers.pref;
      const fwd = dist > hi ? 1 : dist < lo ? -.8 : 0;
      const side = e.pers.flank ? e.strafeDir * 1.3 : e.pers.strafe > .3 ? e.strafeDir * (.5 + e.pers.strafe) : 0;
      mx = ux * fwd + px * side; my = uy * fwd + py * side;
    }
    const ml = Math.hypot(mx, my);
    if (ml > .01) {
      const s = e.spd * dt / Math.max(1, ml);
      if (moveEnt(e, mx * s, my * s, d.r)) e.anim += dt; else e.strafeDir *= -1;
    }
  }
}
function enemyAttack(e, d, dist) {
  if (d.melee) { if (dist < d.range + .25) { damagePlayer(ri(...d.dmg) * e.dmgMul, e.x, e.y); sfx("slash"); } return; }
  if (!lineOfSight(e.x, e.y, player.x, player.y)) return;
  if (d.snipe) {
    sfx("snipe", dist);
    S.bolts.push({ pts: [[e.x, e.y, .62], [player.x, player.y, .45]], t: 0, life: .15, col: "#ff2e55", w: 2, straight: true });
    if (Math.random() < e.pers.acc * (player.moving ? .55 : .95)) damagePlayer(ri(...d.dmg) * e.dmgMul, e.x, e.y);
    return;
  }
  // Disparo con predicción: los más precisos anticipan tu movimiento
  const lead = e.pers.acc > .8 ? 1 : e.pers.acc > .65 ? .5 : 0, tt = dist / d.pspeed;
  const tx = player.x + player.vx * tt * lead, ty = player.y + player.vy * tt * lead, spread = (1 - e.pers.acc) * .12;
  spawnEnemyProj(e, Math.atan2(ty - e.y, tx - e.x) + rr(-spread, spread), d.proj, d.pspeed, ri(...d.dmg) * e.dmgMul);
  sfx(d.proj === "rocket" ? "rocket" : d.proj === "laser" ? "laser" : "eshoot", dist);
}
function spawnEnemyProj(e, a, kind, sp, dmg) {
  S.projectiles.push({ x: e.x + Math.cos(a) * .5, y: e.y + Math.sin(a) * .5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, from: "enemy", kind });
}
function spawnMinion(type, x, y) {
  for (let k = 0; k < 10; k++) {
    const nx = x + rr(-1.2, 1.2), ny = y + rr(-1.2, 1.2);
    if (blockedAt(nx, ny, .3, null)) continue;
    const m = makeEnemy({ type, x: nx, y: ny, room: -1 }, S.sector);
    m.alert = true; m.state = "chase"; m.cd = rr(.6, 1.2);
    S.enemies.push(m); S.stats.totalKills++;
    S.effects.push({ x: nx, y: ny, kind: "blink", t: 0, life: .3, z: .3 });
    return m;
  }
  return null;
}
const MOD_CD = { ring: 3.2, rockets: 4, spiral: .12, summon: 9, fan: 1.8, mines: 6.5, dash: 5, blink: 4.5, homing: 3.6, clones: 12, wall: 4.2, shield: 22 };
function updateBoss(e, d, dt, dx, dy, dist, los) {
  const B = d.bdef;
  if (!e.alert) { if (los && dist < 18) { wake(e); msg(`ALERTA · ${B.name}`, B.color); sfx("roar"); } else return; }
  player.combatT = 0;
  const frac = e.hp / e.maxHp, phase = frac > .66 ? 1 : frac > .33 ? 2 : 3;
  if (phase !== e.phase) { e.phase = phase; msg(`${B.name} · FASE ${phase}`, B.color); sfx("roar"); player.shake = .8; }
  e.shielded = S.enemies.some(o => o.type === "pylon" && !o.dead);
  e.atkFlash -= dt;
  // Embestida en curso
  if (e.dashT > 0) {
    e.dashT -= dt; e.anim += dt * 3;
    if (!moveEnt(e, e.dvx * dt, e.dvy * dt, d.r)) e.dashT = 0;
    if (!e.dashHit && Math.hypot(player.x - e.x, player.y - e.y) < 1.3) { e.dashHit = true; damagePlayer(25 * e.dmgMul, e.x, e.y); player.shake = .9; }
    return;
  }
  if (e.teleT > 0) { e.teleT -= dt; e.atkFlash = .2; if (e.teleT <= 0) { e.dvx = dx / dist * 9; e.dvy = dy / dist * 9; e.dashT = .7; e.dashHit = false; sfx("rocket", dist); } return; }
  const sp = e.spd * (phase === 3 ? 1.5 : 1);
  e.strafeT -= dt; if (e.strafeT <= 0) { e.strafeDir *= -1; e.strafeT = rr(1.5, 3); }
  if (los) {
    const fwd = dist > 6 ? 1 : dist < 4 ? -1 : 0, ux = dx / dist, uy = dy / dist;
    if (moveEnt(e, (ux * fwd - uy * e.strafeDir * .6) * sp * dt, (uy * fwd + ux * e.strafeDir * .6) * sp * dt, d.r)) e.anim += dt;
  } else { const n = flowStep(e, -1); if (n && moveToward(e, n[0], n[1], sp * dt, d.r)) e.anim += dt; }
  e.mod = e.mod || {};
  const cdm = [1, .85, .7][phase - 1];
  for (const m of B.phases[phase - 1]) {
    e.mod[m] = (e.mod[m] ?? rr(1, 3)) - dt;
    if (e.mod[m] > 0) continue;
    e.mod[m] = MOD_CD[m] * cdm * (m === "spiral" ? 1 : rr(.85, 1.2));
    bossAttack(e, d, B, m, phase, dx, dy, dist, los);
  }
}
function freeSpotNear(cx, cy, rMin, rMax, needLos) {
  for (let k = 0; k < 20; k++) {
    const a = rr(0, Math.PI * 2), r = rr(rMin, rMax), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (!blockedAt(x, y, .35, null) && (!needLos || lineOfSight(x, y, player.x, player.y))) return [x, y];
  }
  return null;
}
function bossAttack(e, d, B, m, phase, dx, dy, dist, los) {
  const mul = e.dmgMul, ang = Math.atan2(dy, dx);
  switch (m) {
    case "ring": { const N = [12, 16, 20][phase - 1]; e.spin += .3; for (let i = 0; i < N; i++) spawnEnemyProj(e, e.spin + i * Math.PI * 2 / N, "orb", 5, 10 * mul); e.atkFlash = .4; sfx("eshoot", dist); break; }
    case "rockets": if (!los) { e.mod[m] = .5; break; } for (let i = -1; i <= 1; i++) spawnEnemyProj(e, ang + i * .15, "rocket", 8, 22 * mul); e.atkFlash = .4; sfx("rocket", dist); break;
    case "spiral": e.spin2 += .45; spawnEnemyProj(e, e.spin2, "laser", 7, 6 * mul); spawnEnemyProj(e, e.spin2 + Math.PI, "laser", 7, 6 * mul); break;
    case "summon": if (S.enemies.filter(o => !o.dead && o.room === -1).length < 6) { for (let i = 0; i < 2; i++) spawnMinion(B.summon[Math.floor(Math.random() * B.summon.length)], e.x, e.y); sfx("split", dist); } break;
    case "fan": if (!los) { e.mod[m] = .5; break; } for (let k = -3; k <= 3; k++) spawnEnemyProj(e, ang + k * .12, "laser", 10, 7 * mul); e.atkFlash = .3; sfx("laser", dist); break;
    case "mines":
      for (let k = 0; k < 2 + phase; k++) { const s2 = freeSpotNear(player.x, player.y, 1.2, 3.5, false); if (s2) S.projectiles.push({ x: s2[0], y: s2[1], vx: 0, vy: 0, dmg: 28 * mul, from: "enemy", kind: "mine", life: 9, arm: .8 }); }
      msg("¡Minas de red desplegadas!", B.color); sfx("split", dist); break;
    case "dash": if (!los || dist < 2) { e.mod[m] = 1; break; } e.teleT = .6; sfx("charge", dist); break;
    case "blink": { const s2 = freeSpotNear(player.x, player.y, 5, 8, true); if (s2) { S.effects.push({ x: e.x, y: e.y, kind: "blink", t: 0, life: .4, z: .5 }); e.x = s2[0]; e.y = s2[1]; S.effects.push({ x: e.x, y: e.y, kind: "blink", t: 0, life: .4, z: .5 }); sfx("blink", dist); } break; }
    case "homing": for (let k = 0; k < 1 + phase; k++) spawnEnemyProj(e, ang + (k - phase / 2) * .5, "homing", 4.5, 12 * mul); S.projectiles.slice(-(1 + phase)).forEach(p => p.life = 6); e.atkFlash = .3; sfx("cellout", dist); break;
    case "clones": if (S.enemies.filter(o => !o.dead && o.type === "decoy").length < 3) { for (let i = 0; i < 2; i++) spawnMinion("decoy", e.x, e.y); msg("¡Clones del jefe!", B.color); sfx("blink", dist); } break;
    case "wall": {
      const px = -Math.sin(ang), py = Math.cos(ang), gap = ri(1, 8);
      for (let i = 0; i < 11; i++) {
        if (i === gap || i === gap + 1) continue;
        const o = (i - 5) * .55;
        S.projectiles.push({ x: e.x + px * o + Math.cos(ang) * .6, y: e.y + py * o + Math.sin(ang) * .6, vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4, dmg: 18 * mul, from: "enemy", kind: "fire" });
      }
      e.atkFlash = .4; sfx("rocketfire", dist); break;
    }
    case "shield":
      if (!S.enemies.some(o => o.type === "pylon" && !o.dead)) {
        for (let k = 0; k < 3; k++) { const s2 = freeSpotNear(e.x, e.y, 4, 9, false); if (s2) { const py2 = makeEnemy({ type: "pylon", x: s2[0], y: s2[1], room: -2 }, S.sector); py2.alert = true; S.enemies.push(py2); S.stats.totalKills++; } }
        msg("¡ESCUDO ACTIVO! Destruye los pilones azules", "#6fb4ff"); sfx("cellin", dist);
      }
      break;
  }
}

export { wake, alertAllies, flowStep, patrol, blink, startAttack, updateEnemies, enemyAttack, spawnEnemyProj, spawnMinion, MOD_CD, updateBoss, freeSpotNear, bossAttack };
