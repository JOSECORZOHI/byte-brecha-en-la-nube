// Constantes de pantalla, lienzo, utilidades matemáticas, RNG y dificultades.
import { S } from "./store.js";

const RW = 480, RH = 300, VH = 300, TS = 64, CAMPAIGN = 10;
const cv = document.getElementById("c"), ctx = cv.getContext("2d");
ctx.imageSmoothingEnabled = false;
const ov = document.getElementById("ov");
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rr = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
S.seed = 1;
const srnd = () => { S.seed = (S.seed * 16807) % 2147483647; return (S.seed - 1) / 2147483646; };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h, fn) { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); fn(g, w, h); return c; }
const DIFFS = {
  facil:   { name: "Recluta",   dmg: 0.55, ehp: 0.8 },
  normal:  { name: "Operador",  dmg: 1.0,  ehp: 1.0 },
  dificil: { name: "Pesadilla", dmg: 1.5,  ehp: 1.25 },
};
S.diff = DIFFS.normal;

export { RW, RH, VH, TS, CAMPAIGN, cv, ctx, ov, clamp, rr, ri, DIR4, angDiff, srnd, mulberry32, mk, DIFFS };
