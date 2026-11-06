// Perfil persistente en localStorage: bits, mejoras y skins de Byte.
import { S } from "./store.js";

const PKEY = "byte.profile.v2";
const defProfile = () => ({ bits: 0, up: {}, skins: ["clasico"], skin: "clasico", shopW: [], best: 0, run: null, wskins: ["estandar"], wskinOf: {}, music: { vol: .55, on: true } });
function loadProfile() { try { const p = JSON.parse(localStorage.getItem(PKEY)); if (p) return Object.assign(defProfile(), p); } catch (e) {} return defProfile(); }
S.profile = loadProfile();
function saveProfile() { try { localStorage.setItem(PKEY, JSON.stringify(S.profile)); } catch (e) {} }
const upg = k => S.profile.up[k] || 0;
const UPGRADES = [
  { id: "hp",     name: "CHASIS REFORZADO",     desc: "+20 de integridad máxima por nivel.", max: 3, cost: [250, 500, 900] },
  { id: "armor",  name: "FIREWALL INICIAL",     desc: "Empiezas cada sector con +25 de blindaje por nivel.", max: 3, cost: [200, 420, 800] },
  { id: "dmg",    name: "OVERCLOCK DE DAÑO",    desc: "+10% de daño con todas las armas por nivel.", max: 5, cost: [300, 550, 850, 1250, 1800] },
  { id: "reload", name: "SERVOS RÁPIDOS",       desc: "Recargas un 15% más rápido por nivel.", max: 3, cost: [220, 450, 800] },
  { id: "mag",    name: "CARGADORES AMPLIADOS", desc: "+25% de capacidad de cargador por nivel.", max: 3, cost: [260, 520, 900] },
  { id: "regen",  name: "NANOREPARACIÓN",       desc: "Regeneras 1 s antes y +3 puntos/s más rápido por nivel.", max: 3, cost: [300, 600, 1000] },
  { id: "speed",  name: "ACTUADORES",           desc: "+8% de velocidad de movimiento por nivel.", max: 3, cost: [200, 400, 700] },
  { id: "magnet", name: "IMÁN DE BITS",         desc: "Atraes el botín desde más lejos.", max: 2, cost: [150, 400] },
  { id: "loot",   name: "MINERÍA DE DATOS",     desc: "+15% de bits por cada enemigo por nivel.", max: 3, cost: [350, 700, 1200] },
];
const maxHealth = () => 100 + 20 * upg("hp");
const dmgMul = () => 1 + .1 * upg("dmg");
const reloadMul = () => 1 - .15 * upg("reload");
const regenDelay = () => 4.5 - upg("regen");
const regenRate = () => 6 + 3 * upg("regen");
const moveMul = () => 1 + .08 * upg("speed");
const magnetR = () => 1.3 + 1.4 * upg("magnet");
const lootMul = () => 1 + .15 * upg("loot");
const SKINS = [
  { id: "clasico", name: "CLÁSICO",    cost: 0,    body: "#ffb703", dark: "#d98e00", visor: "#1b2a5c", cross: "#3fc1ff", desc: "El Byte de siempre." },
  { id: "neon",    name: "NEÓN ROSA",  cost: 350,  body: "#ff2e88", dark: "#b81d62", visor: "#1a0820", cross: "#ff2e88", desc: "Para brillar en la oscuridad del data center." },
  { id: "artico",  name: "CIAN ÁRTICO", cost: 350, body: "#8fe3ff", dark: "#4fb0d6", visor: "#0b2238", cross: "#ffffff", desc: "Refrigerado por líquido." },
  { id: "toxico",  name: "TÓXICO",     cost: 600,  body: "#7dff3b", dark: "#4fb81d", visor: "#0f2a08", cross: "#b6ff3b", desc: "Un chasis con residuos radiactivos." },
  { id: "carbono", name: "CARBONO",    cost: 800,  body: "#3a3f4b", dark: "#23262e", visor: "#2a0505", cross: "#ff7a1a", desc: "Fibra de carbono táctica." },
  { id: "oro",     name: "ORO ÉLITE",  cost: 1200, body: "#ffd700", dark: "#b8860b", visor: "#1b1300", cross: "#ffd700", desc: "Solo para quienes purgaron muchos sectores." },
  { id: "glitch",  name: "GLITCH",     cost: 2000, anim: true, body: "#ff2e88", dark: "#3fc1ff", visor: "#05050a", cross: "#ffffff", desc: "Color cambiante en tiempo real." },
];
S.SK = SKINS[0];
function skinCols(t) {
  const s = SKINS.find(k => k.id === S.profile.skin) || SKINS[0];
  if (!s.anim) return s;
  const h = (t * 120) % 360;
  return { body: `hsl(${h},90%,60%)`, dark: `hsl(${(h + 40) % 360},90%,38%)`, visor: s.visor, cross: `hsl(${(h + 180) % 360},90%,72%)` };
}

export { PKEY, defProfile, loadProfile, saveProfile, upg, UPGRADES, maxHealth, dmgMul, reloadMul, regenDelay, regenRate, moveMul, magnetR, lootMul, SKINS, skinCols };
