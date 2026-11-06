// Armas, munición, skins de armas y modelos laterales.
import { S } from "../core/store.js";
import { mk } from "../core/config.js";
import { upg } from "../core/profile.js";
import { ITEM_SPR, dark } from "../gfx/sprites.js";

const WEAPONS = [
  { id: "wrench",  name: "LLAVE INGLESA",        ammo: null, rate: .5, melee: true, dmg: [16, 26], snd: "wrench" },
  { id: "pistol",  name: "BLÁSTER",              ammo: "bullets", mag: 12, reload: 1.1, rate: .3,  pellets: 1, spread: .012, dmg: [10, 16], style: "mag", snd: "pistol", kick: .12 },
  { id: "shotgun", name: "ESCOPETA DE PULSOS",   ammo: "shells",  mag: 6,  reload: 1.6, rate: .8,  pellets: 7, spread: .1, dmg: [6, 11], style: "shell", snd: "shotgun", kick: .35 },
  { id: "smg",     name: "SUBFUSIL RÁFAGA",      ammo: "bullets", mag: 32, reload: 1.4, rate: .075, pellets: 1, spread: .045, dmg: [6, 10], style: "mag", snd: "smg", kick: .08 },
  { id: "plasma",  name: "RIFLE DE PLASMA",      ammo: "cells",   mag: 40, reload: 1.8, rate: .1,  proj: "plasma", pspeed: 14, dmg: [14, 22], style: "cell", snd: "plasma", kick: .06 },
  { id: "rocket",  name: "LANZACOHETES MARTILLO", ammo: "rockets", mag: 4, reload: 2.2, rate: .9,  proj: "prock", pspeed: 10, dmg: [60, 80], style: "rocket", snd: "rocketfire", kick: .45 },
  { id: "rail",    name: "RIEL AGUJA",           ammo: "cells", per: 5,  mag: 5,  reload: 2.0, rate: 1.1, rail: true, dmg: [90, 120], style: "cell", snd: "rail", kick: .4, shop: 1400,
    desc: "Rayo perforante que atraviesa a todos los enemigos en línea recta." },
  { id: "tesla",   name: "CAÑÓN TESLA ARCO",     ammo: "cells", mag: 60, reload: 1.9, rate: .12, tesla: true, chains: 4, dmg: [9, 14], style: "cell", snd: "tesla", kick: .05, shop: 1100,
    desc: "Descargas eléctricas que saltan entre hasta 4 enemigos cercanos." },
  { id: "void",    name: "DISRUPTOR DE VACÍO",   ammo: "cells", per: 20, mag: 3, reload: 2.6, rate: 1.6, proj: "void", pspeed: 6, dmg: [25, 35], style: "cell", snd: "voidfire", kick: .5, shop: 2600,
    desc: "Lanza una singularidad que atrae a los enemigos y explota." },
];
const WI = id => WEAPONS.findIndex(w => w.id === id);
const WD = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
const MAX_SLOTS = 4, INSPECT_T = 2.4;
const PICKUP_ID = { S: "shotgun", M: "smg", L: "plasma", Q: "rocket" };
// Paleta de fábrica de cada arma
const WPAL = {
  wrench:  { body: "#9aa3b5", dark: "#7a8394", accent: "#c5ccd8", glow: "#3fc1ff" },
  pistol:  { body: "#2d3748", dark: "#1a202c", accent: "#4a5568", glow: "#3fc1ff" },
  shotgun: { body: "#2b2f3a", dark: "#4a505b", accent: "#ff7a1a", glow: "#ffb703" },
  smg:     { body: "#2b2f3a", dark: "#15171d", accent: "#ff7a1a", glow: "#ffb703" },
  plasma:  { body: "#3b4a7a", dark: "#1b2238", accent: "#2a355c", glow: "#3fc1ff" },
  rocket:  { body: "#4a5a3a", dark: "#2b2f3a", accent: "#d62828", glow: "#ff7a1a" },
  rail:    { body: "#8892b0", dark: "#2b2f3a", accent: "#596275", glow: "#9ff3ff" },
  tesla:   { body: "#5a3b2a", dark: "#3a2418", accent: "#b87333", glow: "#c9a7ff" },
  void:    { body: "#2a1840", dark: "#1a0d2a", accent: "#4a2a6a", glow: "#b36bff" },
};
// Skins de armas (se compran una vez y se equipan por arma)
const WSKINS = [
  { id: "estandar", name: "ESTÁNDAR",          cost: 0,    desc: "Acabado de fábrica." },
  { id: "carbono",  name: "CARBONO",           cost: 300,  body: "#2a2d35", dark: "#15171c", accent: "#ff7a1a", pat: "stripes", desc: "Fibra de carbono con detalles naranjas." },
  { id: "camo",     name: "CAMUFLAJE DIGITAL", cost: 400,  body: "#3d5a3a", dark: "#24361f", accent: "#8fa86a", pat: "camo", desc: "Patrón pixelado militar." },
  { id: "artico",   name: "ÁRTICO",            cost: 400,  body: "#dfe9f5", dark: "#9fb3c8", accent: "#3fc1ff", pat: "camo", desc: "Camuflaje de nieve." },
  { id: "magma",    name: "MAGMA",             cost: 700,  body: "#2a0d05", dark: "#120502", accent: "#ff5a1a", glow: "#ff7a1a", pat: "veins", desc: "Grietas de lava incandescente." },
  { id: "neon",     name: "NEÓN",              cost: 700,  body: "#14061f", dark: "#0a0310", accent: "#ff2e88", glow: "#ff2e88", pat: "lines", desc: "Líneas de neón rosa." },
  { id: "oro",      name: "ORO",               cost: 1200, body: "#e6b800", dark: "#9c7400", accent: "#fff3b0", glow: "#ffd700", desc: "Bañada en oro de 24 quilates." },
  { id: "holo",     name: "HOLOGRÁFICA",       cost: 2000, anim: true, pat: "lines", desc: "Color cambiante en tiempo real." },
];
function wpal(id, t = 0, skinId) {
  const sid = skinId || (S.profile.wskinOf || {})[id] || "estandar";
  const s = WSKINS.find(k => k.id === sid) || WSKINS[0], base = WPAL[id];
  if (s.anim) { const h = (t * 90) % 360; return { body: `hsl(${h},70%,45%)`, dark: `hsl(${(h + 30) % 360},70%,25%)`, accent: `hsl(${(h + 180) % 360},90%,65%)`, glow: `hsl(${(h + 120) % 360},100%,70%)`, pat: s.pat, sid }; }
  return { body: s.body || base.body, dark: s.dark || base.dark, accent: s.accent || base.accent, glow: s.glow || base.glow, pat: s.pat, sid };
}
// Pinta una pieza del arma; si es la pieza principal aplica el patrón de la skin
function part(g, x, y, w, h, col, pal) {
  g.fillStyle = col; g.fillRect(x, y, w, h);
  if (!pal || !pal.pat || col !== pal.body) return;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (pal.pat === "camo") {
    g.globalAlpha = .55;
    for (let i = 0; i < Math.max(4, w * h / 28); i++) { g.fillStyle = i % 2 ? pal.dark : pal.accent; g.fillRect(x + Math.floor(((i * 37) % Math.max(1, w)) / 4) * 4, y + Math.floor(((i * 53) % Math.max(1, h)) / 4) * 4, 4, 4); }
  } else if (pal.pat === "stripes") {
    g.strokeStyle = pal.dark; g.globalAlpha = .55; g.lineWidth = 2;
    for (let k = -h; k < w; k += 5) { g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + h, y); g.stroke(); }
  } else if (pal.pat === "lines") {
    g.fillStyle = pal.glow; g.globalAlpha = .85; g.fillRect(x, y + Math.floor(h * .3), w, 1); g.fillRect(x, y + Math.floor(h * .7), w, 1);
  } else if (pal.pat === "veins") {
    g.strokeStyle = pal.glow; g.globalAlpha = .9; g.lineWidth = 1; g.beginPath();
    for (let k = 0; k < 3; k++) { let cx = x + (k + .5) * w / 3, cy = y; g.moveTo(cx, cy); while (cy < y + h) { cx += ((Math.floor(cx) * 7 + Math.floor(cy) * 13) % 7) - 3; cy += 5; g.lineTo(cx, cy); } }
    g.stroke();
  }
  g.restore();
}
function glowBar(g, x, y, w, h, col) { g.save(); g.shadowColor = col; g.shadowBlur = 6; g.fillStyle = col; g.fillRect(x, y, w, h); g.restore(); }
function glowDot(g, x, y, r, col) { g.save(); g.shadowColor = col; g.shadowBlur = 8; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore(); }
// Modelo lateral de cada arma (128x48): se usa en la tienda, el arsenal, el HUD, los objetos del mapa y al inspeccionar
function drawModel(g, id, P) {
  const p = (x, y, w, h, c) => part(g, x, y, w, h, c, P);
  switch (id) {
    case "wrench": p(10, 21, 80, 7, P.body); p(12, 22, 76, 2, P.accent); p(88, 10, 24, 8, P.dark); p(88, 30, 24, 8, P.dark); p(86, 10, 8, 28, P.dark); p(2, 19, 12, 11, P.dark); break;
    case "pistol": p(30, 14, 64, 14, P.body); p(30, 11, 62, 4, P.accent); p(92, 17, 12, 7, P.dark); p(42, 28, 16, 19, P.dark); p(36, 26, 10, 5, P.body); glowBar(g, 50, 19, 36, 3, P.glow); break;
    case "shotgun": p(28, 15, 96, 6, P.body); p(28, 22, 96, 5, P.body); p(6, 17, 34, 13, P.dark); p(0, 22, 14, 16, P.dark); p(60, 27, 36, 8, P.accent); p(36, 29, 10, 12, P.dark); g.fillStyle = "#111"; g.fillRect(122, 15, 3, 12); break;
    case "smg": p(28, 14, 60, 14, P.body); p(86, 18, 26, 6, P.dark); p(48, 28, 9, 20, P.dark); p(68, 28, 8, 12, P.body); p(10, 16, 20, 8, P.dark); p(28, 20, 60, 2, P.accent); break;
    case "plasma": p(20, 12, 82, 22, P.body); p(100, 17, 18, 10, P.dark); p(30, 34, 12, 13, P.dark); p(6, 16, 16, 14, P.accent); for (let i = 0; i < 3; i++) glowBar(g, 44 + i * 18, 16, 10, 12, P.glow); break;
    case "rocket": p(6, 12, 112, 20, P.body); p(112, 9, 12, 26, P.dark); p(50, 32, 10, 15, P.dark); p(34, 3, 24, 9, P.dark); p(8, 18, 102, 3, P.accent); glowDot(g, 40, 7, 2, P.glow); break;
    case "rail": p(30, 12, 96, 5, P.body); p(30, 27, 96, 5, P.body); p(10, 14, 34, 18, P.dark); p(30, 32, 10, 15, P.dark); for (let i = 0; i < 5; i++) p(50 + i * 15, 9, 4, 26, P.accent); glowBar(g, 44, 20, 82, 3, P.glow); break;
    case "tesla": p(12, 16, 76, 20, P.body); for (let i = 0; i < 6; i++) p(16 + i * 12, 16, 4, 20, P.accent); p(30, 36, 10, 11, P.dark); for (const x of [94, 106, 118]) { p(x - 2, 22, 4, 12, P.dark); glowDot(g, x, 19, 4, P.glow); } break;
    case "void": p(8, 12, 72, 26, P.body); p(30, 38, 12, 10, P.dark); p(78, 15, 22, 20, P.dark); p(12, 18, 62, 2, P.accent); glowDot(g, 106, 25, 12, P.glow); g.fillStyle = "#000"; g.beginPath(); g.arc(106, 25, 5, 0, Math.PI * 2); g.fill(); break;
  }
}
const MODEL_CACHE = {};
function modelCanvas(id, sid) {
  sid = sid || (S.profile.wskinOf || {})[id] || "estandar";
  const k = id + "|" + sid;
  return MODEL_CACHE[k] || (MODEL_CACHE[k] = mk(128, 48, g => drawModel(g, id, wpal(id, 0, sid))));
}
function modelURL(id, sid) { try { return modelCanvas(id, sid).toDataURL(); } catch (e) { return ""; } }
// Los objetos de armas del mapa muestran el modelo real flotando con un halo
for (const k in PICKUP_ID) {
  const m = mk(128, 48, g => drawModel(g, PICKUP_ID[k], wpal(PICKUP_ID[k], 0, "estandar")));
  const c = mk(64, 64, g => {
    const gr = g.createRadialGradient(32, 50, 2, 32, 50, 28); gr.addColorStop(0, "rgba(255,183,3,.45)"); gr.addColorStop(1, "rgba(255,183,3,0)");
    g.fillStyle = gr; g.fillRect(0, 24, 64, 40); g.drawImage(m, 2, 36, 60, 22.5);
  });
  ITEM_SPR[k] = [c, c, dark(c, .35)];
}
const AMMO_CAP = { bullets: 300, shells: 60, cells: 400, rockets: 20 };
const FOUND_WEAPONS = [["S", "shotgun", 2], ["M", "smg", 3], ["L", "plasma", 4], ["Q", "rocket", 6]];
const magSize = w => Math.round(w.mag * (1 + .25 * upg("mag")));

export { WEAPONS, WI, WD, MAX_SLOTS, INSPECT_T, PICKUP_ID, WPAL, WSKINS, wpal, part, glowBar, glowDot, drawModel, MODEL_CACHE, modelCanvas, modelURL, AMMO_CAP, FOUND_WEAPONS, magSize };
