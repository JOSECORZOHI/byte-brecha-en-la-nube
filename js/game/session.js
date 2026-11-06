// Partidas, carga de sectores y creación de enemigos.
import { S } from "../core/store.js";
import { DIFFS, VH, ctx, rr } from "../core/config.js";
import { maxHealth, saveProfile, upg } from "../core/profile.js";
import { biomeFor, chapterData, chapterOf } from "../world/chapters.js";
import { pillarTex, wallTex } from "../gfx/textures.js";
import { EDEF, INTRO, bossFor, setupBoss } from "../data/enemies.js";
import { FOUND_WEAPONS, MAX_SLOTS, WD, WEAPONS, magSize } from "../data/weapons.js";
import { generateSector } from "../world/generator.js";
import { cell, freshSlots, inSlots, isDoor, isWall, player } from "./world.js";
import { computeFlow } from "../engine/raycast.js";
import { hideOv } from "../ui/screens.js";
import { requestLock } from "../ui/input.js";

function snapshotRun(nextSector) {
  return { seed: S.run.seed, sector: nextSector, diff: S.run.diff,
    slots: [...player.slots], stash: [...player.stash], ammo: { ...player.ammo }, mag: { ...player.mag },
    health: player.health, armor: player.armor, weapon: player.weapon };
}
function applyRun(r) {
  S.diff = DIFFS[r.diff] || DIFFS.normal;
  // Partidas guardadas con la versión anterior (inventario ilimitado): las 4 primeras armas a ranuras, el resto al arsenal
  const legacy = !Array.isArray(r.slots) && r.has ? Object.keys(r.has).filter(id => r.has[id] && WD[id] && id !== "wrench" && !S.profile.shopW.includes(id)) : null;
  player.slots = (Array.isArray(r.slots) ? r.slots : legacy ? legacy.slice(0, MAX_SLOTS) : freshSlots()).slice(0, MAX_SLOTS).map(id => WD[id] ? id : null);
  while (player.slots.length < MAX_SLOTS) player.slots.push(null);
  player.stash = (r.stash || (legacy ? legacy.slice(MAX_SLOTS) : [])).filter(id => WD[id] && !player.slots.includes(id));
  player.ammo = { bullets: 0, shells: 0, cells: 0, rockets: 0, ...r.ammo };
  player.mag = { ...r.mag };
  for (const w of WEAPONS) if (w.ammo && player.mag[w.id] === undefined) player.mag[w.id] = magSize(w);
  player.health = Math.min(maxHealth(), r.health); player.armor = r.armor;
  player.weapon = typeof r.weapon === "string" && (inSlots(r.weapon) || r.weapon === "wrench") ? r.weapon : (player.slots.find(Boolean) || "wrench");
  player.slot = Math.max(0, player.slots.indexOf(player.weapon)); player.inspectT = 0; player.swapOffer = null;
}
function newRun(d) {
  S.run = { seed: (Math.random() * 1e9) | 0, sector: 1, diff: d, slots: freshSlots(), stash: [], ammo: { bullets: 48, shells: 0, cells: 0, rockets: 0 }, mag: {}, health: maxHealth(), armor: 0, weapon: "pistol" };
  for (const id of S.profile.shopW) { const i = S.run.slots.indexOf(null); if (i >= 0) S.run.slots[i] = id; S.run.ammo.cells = Math.max(S.run.ammo.cells, 80); }
  S.profile.run = S.run; saveProfile();
  startSector(1);
}
function startSector(n) {
  S.run.sector = n;
  applyRun(S.run);
  player.armor = Math.max(player.armor, 25 * upg("armor"));
  S.profile.run = snapshotRun(n); saveProfile();
  const wantW = FOUND_WEAPONS.filter(([, id, from]) => n >= from && !inSlots(id) && !player.stash.includes(id)).map(([k]) => k);
  loadLevel(generateSector(n, S.run.seed, wantW), n);
  S.state = "playing"; hideOv(); requestLock();
}
function retrySector() { S.run = { ...S.profile.run }; startSector(S.run.sector); }
function loadLevel(lv, n) {
  S.LV = lv; S.sector = n;
  const biome = biomeFor(n), ch = chapterOf(n), CH = chapterData(ch);
  if (lv.boss) setupBoss(n);
  const intro = INTRO[n] ? ` Nueva amenaza: ${EDEF[INTRO[n]].name.toUpperCase()}.` : "";
  S.L = {
    name: `SECTOR ${n} · ${biome.name.toUpperCase()}${lv.boss ? " · JEFE" : ""}`,
    chapter: `CAPÍTULO ${ch + 1} · ${CH.name.toUpperCase()}`, fogCol: biome.fogCol || "0,0,0", sky: !!biome.sky,
    brief: lv.boss ? `¡${EDEF.boss.name}, ${bossFor(ch).title.toLowerCase()}, protege la salida! Destrúyelo para escapar.` :
      (lv.blue ? "Consigue la tarjeta AZUL, luego la ROJA y llega a la SALIDA." :
       lv.red ? "La SALIDA está tras una puerta ROJA: encuentra la tarjeta." : "Encuentra el interruptor de SALIDA.") + intro,
    fog: biome.fog,
  };
  S.map = lv.map.map(r => r.slice()); S.MH = S.map.length; S.MW = S.map[0].length;
  S.doors = {}; S.projectiles = []; S.effects = []; S.voids = []; S.bolts = []; S.popups = []; S.messages = [];
  S.seen = new Uint8Array(S.MW * S.MH); S.flow = new Int16Array(S.MW * S.MH);
  S.TEX_WALL = wallTex(biome.pal, 1234 + n * 77, biome.wall);
  S.TEX_PILLAR = pillarTex(biome.pillar || "rack", biome.pal, 99 + n);
  for (let y = 0; y < S.MH; y++) for (let x = 0; x < S.MW; x++) if (isDoor(S.map[y][x])) S.doors[x + "," + y] = { x, y, open: 0, dir: 0, timer: 0, lock: S.map[y][x] === "R" ? "r" : S.map[y][x] === "B" ? "u" : null };
  S.enemies = lv.enemies.map(s => makeEnemy(s, n));
  S.items = lv.items.map(i => ({ ...i }));
  S.decor = lv.decor.map(d => ({ ...d, hp: 20, solid: d.kind === "o" }));
  S.stats = { kills: 0, totalKills: S.enemies.length, items: 0, totalItems: S.items.length, time: 0 };
  player.x = lv.start.x; player.y = lv.start.y;
  const px = Math.floor(player.x), py = Math.floor(player.y);
  for (const [dx, dy, a] of [[1, 0, 0], [0, 1, Math.PI / 2], [-1, 0, Math.PI], [0, -1, -Math.PI / 2]]) if (!isWall(cell(px + dx, py + dy)) && !isWall(cell(px + 2 * dx, py + 2 * dy))) { player.a = a; break; }
  Object.assign(player, { keys: { r: false, u: false }, cooldown: 0, fireAnim: 0, raise: 1, reloadT: 0, combatT: 99, regen: false, hurtDirs: [], shake: 0, hitT: 0, killT: 0, vx: 0, vy: 0 });
  S.ceilGrad = ctx.createLinearGradient(0, 0, 0, VH / 2); S.ceilGrad.addColorStop(0, biome.ceil[0]); S.ceilGrad.addColorStop(1, biome.ceil[1]);
  S.floorGrad = ctx.createLinearGradient(0, VH / 2, 0, VH); S.floorGrad.addColorStop(0, biome.floor[1]); S.floorGrad.addColorStop(1, biome.floor[0]);
  S.introT = 3.5; S.hurtFlash = 0; S.pickFlash = 0; S.sectorBits = 0;
  computeFlow();
}
function makeEnemy(s, n) {
  const d = EDEF[s.type], R = Math.random;
  const hp = d.boss ? d.hp * S.diff.ehp : d.hp * (1 + .1 * (n - 1)) * S.diff.ehp * (s.elite ? 2 : 1);
  return {
    type: s.type, x: s.x, y: s.y, hp, maxHp: hp, elite: !!s.elite, room: s.room,
    dmgMul: (1 + .06 * (n - 1)) * (s.elite ? 1.3 : 1), spd: d.speed * (s.elite ? 1.15 : 1) * (.9 + R() * .2),
    state: "patrol", t: 0, cd: rr(.5, 1.5), anim: rr(0, 1), alert: false, burst: 0, fired: false, dead: false,
    fa: rr(0, Math.PI * 2), spotT: 0, wakeDelay: 0, ptx: s.x, pty: s.y, wait: rr(0, 2),
    // Personalidad procedural: cada enemigo se comporta distinto
    pers: { aggr: R(), strafe: R(), flank: R() < .3, courage: .15 + R() * .3, react: .15 + R() * .5, acc: .55 + R() * .45, pref: .8 + R() * .5, dodge: R() * .7 },
    strafeDir: R() < .5 ? 1 : -1, strafeT: rr(.8, 2), retreatT: 0, retreated: false, blinkCd: rr(2, 4), dodgeT: 0, dodgeDir: 1, alpha: 1,
    t1: 2, t2: 3, t3: 6, t4: 0, spin: 0, spin2: 0, phase: 1, atkFlash: 0,
  };
}

export { snapshotRun, applyRun, newRun, startSector, retrySector, loadLevel, makeEnemy };
