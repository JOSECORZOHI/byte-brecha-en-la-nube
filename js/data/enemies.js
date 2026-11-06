// Definiciones de enemigos, jefes por capítulo y composición de oleadas.
import { CAMPAIGN, mulberry32 } from "../core/config.js";
import { chapterOf, hslToRgb } from "../world/chapters.js";
import { drawBrute, drawDrone, drawFirewall, drawGlitch, drawKernel, drawPylon, drawReplicator, drawRoot, drawSentinel, drawSniper, drawSpecter, drawSpider, enemySprites, tint } from "../gfx/sprites.js";

const EDEF = {
  glitch:     { name: "Glitch",        hp: 35,   speed: 2.6,  r: .3,  hitR: .4,  scale: .7,  zoff: .18, melee: true, range: 1.05, dmg: [6, 12],  cd: .9,  pain: .7, atkTime: .32, sight: 14, loot: [3, 6], draw: drawGlitch },
  sentinel:   { name: "Centinela",     hp: 55,   speed: 1.7,  r: .3,  hitR: .38, scale: .92, zoff: 0,   range: 13, dmg: [8, 14],  cd: 1.7, pain: .5, atkTime: .45, sight: 15, proj: "orb", pspeed: 7, pref: [4, 8], loot: [5, 9], draw: drawSentinel },
  drone:      { name: "Dron",          hp: 24,   speed: 3.1,  r: .25, hitR: .34, scale: .55, zoff: .45, range: 10, dmg: [4, 8],   cd: .8,  pain: .8, atkTime: .22, sight: 14, proj: "laser", pspeed: 12, pref: [3, 6], loot: [4, 7], draw: drawDrone },
  brute:      { name: "Bruto",         hp: 260,  speed: 1.25, r: .45, hitR: .55, scale: 1.2, zoff: 0,   range: 14, dmg: [16, 26], cd: 2.3, pain: .15, atkTime: .6, sight: 16, proj: "rocket", pspeed: 8, burst: 3, pref: [5, 9], loot: [20, 32], draw: drawBrute },
  specter:    { name: "Espectro",      hp: 60,   speed: 2.3,  r: .3,  hitR: .4,  scale: .95, zoff: .05, melee: true, range: 1.1, dmg: [12, 20], cd: 1.1, pain: .4, atkTime: .35, sight: 15, blink: true, loot: [10, 16], draw: drawSpecter },
  replicator: { name: "Replicador",    hp: 80,   speed: 1.8,  r: .35, hitR: .45, scale: .85, zoff: 0,   range: 9,  dmg: [6, 10],  cd: 1.2, pain: .4, atkTime: .4, sight: 14, proj: "orb", pspeed: 6, burst: 2, pref: [3, 6], split: true, loot: [8, 13], draw: drawReplicator },
  sniper:     { name: "Francotirador", hp: 45,   speed: 1.3,  r: .3,  hitR: .36, scale: .95, zoff: 0,   range: 24, dmg: [22, 32], cd: 3.2, pain: .5, atkTime: 1.25, sight: 24, snipe: true, pref: [9, 16], loot: [12, 18], draw: drawSniper },
  pylon:      { name: "Pilón de escudo", hp: 140, speed: 0, r: .35, hitR: .42, scale: 1, zoff: 0, range: 0, dmg: [0, 0], cd: 99, pain: 0, atkTime: 1, sight: 0, static: true, loot: [6, 10], draw: drawPylon },
  kernel:     { name: "KERNEL",        hp: 2600, speed: 1.0,  r: .7,  hitR: .9,  scale: 1.8, zoff: 0,   range: 30, dmg: [10, 16], cd: 1,   pain: 0,  atkTime: .5, sight: 40, boss: true, loot: [300, 300], draw: drawKernel },
};
for (const k in EDEF) EDEF[k].spr = enemySprites(EDEF[k].draw);
// ---------- Jefes: uno distinto por capítulo, cada uno con su combinación de módulos de ataque por fase ----------
const BOSSES = [
  { name: "KERNEL", title: "El corazón infectado", hp: 2600, speed: 1.0, scale: 1.8, color: "#ff2e55", draw: drawKernel, arena: "core",
    phases: [["ring", "rockets"], ["ring", "rockets", "summon"], ["ring", "rockets", "summon", "spiral"]], summon: ["glitch", "drone"] },
  { name: "ARAÑA DE RED", title: "La tejedora de la red exterior", hp: 2400, speed: 1.7, scale: 1.7, color: "#3fc1ff", draw: drawSpider, arena: "web",
    phases: [["fan", "mines"], ["fan", "mines", "dash"], ["fan", "mines", "dash", "summon"]], summon: ["drone"] },
  { name: "FANTASMA ROOT", title: "El administrador corrupto", hp: 2200, speed: 1.4, scale: 1.6, color: "#b36bff", draw: drawRoot, arena: "crypt", ghost: true,
    phases: [["blink", "homing"], ["blink", "homing", "clones"], ["blink", "homing", "clones", "ring"]], summon: ["specter"] },
  { name: "CORTAFUEGOS", title: "El muro que arde", hp: 3000, speed: .8, scale: 2.0, color: "#ff7a1a", draw: drawFirewall, arena: "hall",
    phases: [["wall", "rockets"], ["wall", "rockets", "shield"], ["wall", "homing", "shield", "spiral"]], summon: ["brute"] },
];
const BOSS_MODS = ["ring", "rockets", "spiral", "summon", "fan", "mines", "dash", "blink", "homing", "clones", "wall", "shield"];
const PROC_BOSS = {};
// A partir del capítulo 5: jefe procedural (forma, color, nombre y ataques a partir de una semilla)
function bossFor(ch) {
  if (ch < BOSSES.length) return BOSSES[ch];
  if (PROC_BOSS[ch]) return PROC_BOSS[ch];
  const R = mulberry32(ch * 31337 + 7), pick = a => a[Math.floor(R() * a.length)];
  const base = pick(BOSSES), hue = Math.floor(R() * 360), mods = [];
  while (mods.length < 4) { const m = pick(BOSS_MODS); if (!mods.includes(m)) mods.push(m); }
  const [r, g2, b] = hslToRgb(hue, 90, 60);
  return (PROC_BOSS[ch] = { name: `ANOMALÍA-${(ch * 2749 % 4096).toString(16).toUpperCase().padStart(3, "0")}`, title: "Una forma de vida digital desconocida",
    hp: 2400 + Math.floor(R() * 800), speed: .9 + R() * .8, scale: 1.6 + R() * .4, color: `rgb(${r},${g2},${b})`, draw: base.draw, tintCol: `rgba(${r},${g2},${b},.45)`,
    arena: pick(["core", "web", "crypt", "hall"]), ghost: R() < .3,
    phases: [mods.slice(0, 2), mods.slice(0, 3), mods], summon: [pick(["glitch", "drone", "specter", "sentinel"]), pick(["glitch", "drone", "brute"])] });
}
function bossSprites(B) {
  if (B.spr) return B.spr;
  const set = enemySprites(B.draw);
  if (B.tintCol) for (const k of ["normal", "elite"]) for (const pose in set[k]) set[k][pose] = set[k][pose].map(c => tint(c, B.tintCol));
  return (B.spr = set);
}
function setupBoss(n) {
  const ch = chapterOf(n), B = bossFor(ch), spr = bossSprites(B);
  EDEF.boss = { name: B.name, hp: B.hp * (1 + .35 * ch), speed: B.speed, r: .7, hitR: .9, scale: B.scale, zoff: 0, range: 30, dmg: [10, 16], cd: 1, pain: 0, atkTime: .5,
    sight: 40, boss: true, loot: [300 + ch * 150, 300 + ch * 150], spr, bdef: B };
  EDEF.decoy = { name: "Clon", hp: 30, speed: 2.2, r: .35, hitR: .5, scale: B.scale * .6, zoff: 0, range: 12, dmg: [5, 8], cd: 1.3, pain: 0, atkTime: .4, sight: 30,
    proj: "orb", pspeed: 7, pref: [3, 7], loot: [1, 2], spr, decoy: true };
}
const INTRO = { 2: "drone", 3: "brute", 4: "specter", 5: "replicator", 6: "sniper" };
function enemyPool(n) {
  if (n > CAMPAIGN) n = Math.max(6, n);
  const p = [["glitch", n >= 5 ? 2 : 4], ["sentinel", n >= 5 ? 3 : 4]];
  if (n >= 2) p.push(["drone", 3]);
  if (n >= 3) p.push(["brute", n >= 7 ? 2 : 1]);
  if (n >= 4) p.push(["specter", 2]);
  if (n >= 5) p.push(["replicator", 2]);
  if (n >= 6) p.push(["sniper", 2]);
  return p;
}
const weighted = (pool, R) => { let r = R() * pool.reduce((s, [, w]) => s + w, 0); for (const [k, w] of pool) if ((r -= w) <= 0) return k; return pool[0][0]; };

export { EDEF, BOSSES, BOSS_MODS, PROC_BOSS, bossFor, bossSprites, setupBoss, INTRO, enemyPool, weighted };
