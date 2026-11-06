// Acciones del jugador: usar, disparar, recargar y gestionar armas.
import { S } from "../core/store.js";
import { angDiff, ri, rr } from "../core/config.js";
import { dmgMul, reloadMul } from "../core/profile.js";
import { EDEF } from "../data/enemies.js";
import { AMMO_CAP, PICKUP_ID, WD, magSize } from "../data/weapons.js";
import { sfx } from "../audio/sfx.js";
import { cell, inSlots, isDoor, isWall, msg, player } from "./world.js";
import { cast, lineOfSight } from "../engine/raycast.js";
import { wake } from "./ai.js";
import { damageEnemy, explodeBarrel } from "./combat.js";
import { levelDone } from "../ui/screens.js";

function useAction() {
  if (player.swapOffer) { swapWeapon(player.swapOffer); return; }
  const dx = Math.cos(player.a), dy = Math.sin(player.a);
  for (let t = .4; t <= 1.6; t += .2) {
    const cx = Math.floor(player.x + dx * t), cy = Math.floor(player.y + dy * t), ch = cell(cx, cy);
    if (ch === "X") {
      if (S.LV.boss && S.enemies.some(e => e.type === "boss" && !e.dead)) { msg(`${EDEF.boss.name} bloquea la salida`, "#ff2e55"); sfx("locked"); return; }
      levelDone(); return;
    }
    if (isDoor(ch)) {
      const d = S.doors[cx + "," + cy];
      if (d.lock && !player.keys[d.lock]) { msg(`Necesitas la tarjeta ${d.lock === "r" ? "ROJA" : "AZUL"}`, d.lock === "r" ? "#ff5d5d" : "#6f9fff"); sfx("locked"); return; }
      d.dir = d.open >= 1 || d.dir === 1 ? -1 : 1;
      if (d.dir === -1 && cellOccupied(cx, cy)) d.dir = 1;
      d.timer = 0; sfx("door"); return;
    }
    if (isWall(ch)) return;
  }
}
function cellOccupied(cx, cy) {
  if (Math.floor(player.x) === cx && Math.floor(player.y) === cy) return true;
  return S.enemies.some(e => !e.dead && Math.floor(e.x) === cx && Math.floor(e.y) === cy);
}
const curWeapon = () => WD[player.weapon];
const canReload = w => !!w.ammo && player.ammo[w.ammo] >= (w.per || 1);
const hasAmmo = w => !w.ammo || player.mag[w.id] > 0 || canReload(w);
function equipWeapon(id) { player.weapon = id; player.raise = 1; player.reloadT = 0; player.inspectT = 0; }
function selectSlot(i) {
  const id = player.slots[i];
  if (!id || id === player.weapon) return;
  if (!hasAmmo(WD[id])) { msg(`${WD[id].name}: sin munición`, "#ff5d5d"); return; }
  equipWeapon(id); player.slot = i;
}
function selectMelee() { if (player.weapon !== "wrench") equipWeapon("wrench"); }
function autoSwitch() {
  for (const id of ["tesla", "plasma", "smg", "shotgun", "rail", "pistol", "rocket", "void"]) {
    if (inSlots(id) && hasAmmo(WD[id])) { if (id !== player.weapon) { equipWeapon(id); player.slot = player.slots.indexOf(id); } return; }
  }
  if (player.weapon !== "wrench") equipWeapon("wrench");
}
// Con las 4 ranuras llenas, recoger un arma la cambia por la activa (la vieja va al arsenal)
function swapWeapon(it) {
  const p = player, id = PICKUP_ID[it.kind], w = WD[id], i = p.slot, old = p.slots[i];
  if (old && !S.profile.shopW.includes(old) && !p.stash.includes(old)) p.stash.push(old);
  p.slots[i] = id; p.stash = p.stash.filter(x => x !== id);
  p.ammo[w.ammo] = Math.min(AMMO_CAP[w.ammo], p.ammo[w.ammo] + (w.ammo === "rockets" ? 4 : w.ammo === "shells" ? 8 : 32));
  p.mag[id] = magSize(w);
  it.taken = true; if (!it.drop) S.stats.items++;
  equipWeapon(id); p.swapOffer = null;
  msg(`${w.name} equipada${old ? ` · ${WD[old].name} al arsenal` : ""}`); sfx("weapon"); S.pickFlash = .25;
}
const RELOAD_SFX = {
  mag: [[.18, "magout"], [.62, "magin"], [.86, "cock"]],
  shell: [[.2, "shell"], [.35, "shell"], [.5, "shell"], [.65, "shell"], [.86, "cock"]],
  cell: [[.18, "cellout"], [.6, "cellin"], [.86, "cock"]],
  rocket: [[.25, "rockin"], [.6, "rockin"], [.86, "cock"]],
};
function startReload() {
  const w = curWeapon(), p = player;
  if (!w.ammo || p.reloadT > 0 || p.raise > .3 || p.mag[w.id] >= magSize(w) || !canReload(w)) return false;
  p.reloadT = p.reloadDur = w.reload * reloadMul(); p.reloadStage = 0; p.inspectT = 0;
  return true;
}
function updateReload(dt) {
  const p = player;
  if (p.reloadT <= 0) return;
  const w = curWeapon(), st = RELOAD_SFX[w.style];
  p.reloadT -= dt;
  const prog = 1 - Math.max(0, p.reloadT) / p.reloadDur;
  while (p.reloadStage < st.length && prog >= st[p.reloadStage][0]) { sfx(st[p.reloadStage][1]); p.reloadStage++; }
  if (p.reloadT <= 0) {
    p.reloadT = 0;
    const per = w.per || 1, shots = Math.min(magSize(w) - p.mag[w.id], Math.floor(p.ammo[w.ammo] / per));
    p.mag[w.id] += shots; p.ammo[w.ammo] -= shots * per;
  }
}
function makeNoise() {
  for (const e of S.enemies) {
    if (e.dead || e.alert) continue;
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < 6 || (d < 11 && lineOfSight(e.x, e.y, player.x, player.y))) wake(e);
  }
}
function fire() {
  const w = curWeapon(), p = player;
  if (p.cooldown > 0 || p.raise > .3 || p.reloadT > 0) return;
  p.inspectT = 0;
  if (w.ammo && p.mag[w.id] <= 0) { if (canReload(w)) startReload(); else { sfx("empty"); p.cooldown = .3; autoSwitch(); } return; }
  p.cooldown = w.rate; p.fireAnim = 1;
  if (w.ammo) p.mag[w.id]--;
  const dm = dmgMul();
  sfx(w.snd);
  if (w.melee) { const t = hitscanTarget(p.a, 1.25); if (t) { damageTarget(t.target, ri(...w.dmg) * dm); sfx("slash"); } return; }
  makeNoise();
  p.shake = Math.max(p.shake, w.kick || .1);
  if (w.proj) {
    const a = p.a + rr(-.015, .015);
    S.projectiles.push({ x: p.x + Math.cos(a) * .35, y: p.y + Math.sin(a) * .35, vx: Math.cos(a) * w.pspeed, vy: Math.sin(a) * w.pspeed, dmg: ri(...w.dmg) * dm, from: "player", kind: w.proj, life: w.proj === "void" ? 1.6 : 5 });
  } else if (w.rail) fireRail(w, dm);
  else if (w.tesla) fireTesla(w, dm);
  else {
    for (let k = 0; k < w.pellets; k++) {
      const a = p.a + rr(-w.spread, w.spread), t = hitscanTarget(a, 40);
      if (t) damageTarget(t.target, ri(...w.dmg) * dm);
      else { const h = cast(p.x, p.y, Math.cos(a), Math.sin(a)), d = Math.max(.1, h.dist - .05); S.effects.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, kind: "spark", t: 0, life: .15 }); }
    }
  }
  if (w.ammo && p.mag[w.id] === 0 && !canReload(w)) setTimeout(() => { if (!hasAmmo(curWeapon())) autoSwitch(); }, 300);
}
function fireRail(w, dm) {
  const p = player, ca = Math.cos(p.a), sa = Math.sin(p.a), wall = cast(p.x, p.y, ca, sa).dist, dmg = ri(...w.dmg) * dm;
  for (const e of S.enemies.slice()) {
    if (e.dead) continue;
    const dx = e.x - p.x, dy = e.y - p.y, along = dx * ca + dy * sa;
    if (along > 0 && along < wall && Math.abs(-dx * sa + dy * ca) < EDEF[e.type].hitR + .1) damageEnemy(e, dmg);
  }
  for (const b of S.decor) { if (b.kind !== "o" || b.hp <= 0) continue; const dx = b.x - p.x, dy = b.y - p.y, along = dx * ca + dy * sa; if (along > 0 && along < wall && Math.abs(-dx * sa + dy * ca) < .3) damageTarget(b, dmg); }
  S.bolts.push({ pts: [null, [p.x + ca * wall, p.y + sa * wall, .5]], t: 0, life: .3, col: "#9ff3ff", w: 4, straight: true });
  S.effects.push({ x: p.x + ca * (wall - .05), y: p.y + sa * (wall - .05), kind: "spark", t: 0, life: .2 });
}
function fireTesla(w, dm) {
  const p = player;
  let cur = null, best = 1e9;
  for (const e of S.enemies) {
    if (e.dead) continue;
    const dx = e.x - p.x, dy = e.y - p.y, dist = Math.hypot(dx, dy); if (dist > 14) continue;
    const ad = Math.abs(angDiff(Math.atan2(dy, dx), p.a)); if (ad > .22) continue;
    if (!lineOfSight(p.x, p.y, e.x, e.y)) continue;
    const sc = ad * 10 + dist * .1; if (sc < best) { best = sc; cur = e; }
  }
  const pts = [null];
  if (!cur) { const d = Math.min(cast(p.x, p.y, Math.cos(p.a), Math.sin(p.a)).dist, 6); pts.push([p.x + Math.cos(p.a) * d, p.y + Math.sin(p.a) * d, .5]); S.bolts.push({ pts, t: 0, life: .08, col: "#c9a7ff", w: 2 }); return; }
  const hit = new Set();
  for (let k = 0; k < w.chains && cur; k++) {
    hit.add(cur); pts.push([cur.x, cur.y, .5]);
    const from = cur;
    damageEnemy(cur, ri(...w.dmg) * dm * (k === 0 ? 1 : .75));
    let next = null, nd = 4.5;
    for (const e of S.enemies) { if (e.dead || hit.has(e)) continue; const dd = Math.hypot(e.x - from.x, e.y - from.y); if (dd < nd && lineOfSight(from.x, from.y, e.x, e.y)) { nd = dd; next = e; } }
    cur = next;
  }
  S.bolts.push({ pts, t: 0, life: .1, col: "#c9a7ff", w: 2 });
}
function hitscanTarget(a, maxRange) {
  const ca = Math.cos(a), sa = Math.sin(a), wall = cast(player.x, player.y, ca, sa).dist;
  let best = null;
  const consider = (obj, r) => {
    const dx = obj.x - player.x, dy = obj.y - player.y, along = dx * ca + dy * sa;
    if (along <= 0 || along > wall || along > maxRange) return;
    if (Math.abs(-dx * sa + dy * ca) < r && (!best || along < best.dist)) best = { target: obj, dist: along };
  };
  for (const e of S.enemies) if (!e.dead) consider(e, EDEF[e.type].hitR);
  for (const d of S.decor) if (d.kind === "o" && d.hp > 0) consider(d, .3);
  return best;
}
function damageTarget(t, amount) {
  if (t.kind === "o") { t.hp -= amount; if (t.hp <= 0 && !t.exploding) { t.exploding = true; setTimeout(() => explodeBarrel(t), 120); } return; }
  damageEnemy(t, amount);
}

export { useAction, cellOccupied, curWeapon, canReload, hasAmmo, equipWeapon, selectSlot, selectMelee, autoSwitch, swapWeapon, RELOAD_SFX, startReload, updateReload, makeNoise, fire, fireRail, fireTesla, hitscanTarget, damageTarget };
