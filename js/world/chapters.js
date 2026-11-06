// Capítulos y escenarios (fijos y procedurales).
import { CAMPAIGN, mulberry32 } from "../core/config.js";

// Cada capítulo (10 sectores) tiene 5 escenarios (uno cada 2 sectores), su jefe,
// su música y su forma de generar mapas. A partir del capítulo 5 todo se genera de forma procedural.
const CHAPTERS = [
  { name: "El Data Center", boss: 0, gen: { S: 10, rMin: 4, rMax: 7, loop: .3, pillar: .6 }, biomes: [
    { name: "Recepción",          pal: ["#4a5568", "#2d3748", "#718096"], ceil: ["#141826", "#2e3446"], floor: ["#3b3f4c", "#101218"], fog: 14, fogCol: "0,0,0", wall: "panel", pillar: "rack", track: "biome0" },
    { name: "Sala de Servidores", pal: ["#2f5d62", "#1b3a3e", "#5e9ea0"], ceil: ["#081316", "#1d3437"], floor: ["#2a3a3c", "#070d0e"], fog: 12, fogCol: "0,8,10", wall: "panel", pillar: "rack", track: "biome1" },
    { name: "Refrigeración",      pal: ["#4a6b8a", "#2a4560", "#9cc4e8"], ceil: ["#0a1a2a", "#1d3b55"], floor: ["#2a4055", "#081320"], fog: 13, fogCol: "10,25,40", wall: "crystal", pillar: "pipe", track: "biome2" },
    { name: "Fundición de Datos", pal: ["#6b4a2b", "#3a2615", "#b07a48"], ceil: ["#1a0d05", "#3a2010"], floor: ["#3a2a1a", "#0d0805"], fog: 11, fogCol: "25,8,0", wall: "brick", pillar: "pipe", track: "biome3" },
    { name: "El Núcleo",          pal: ["#6b2b2b", "#3a1515", "#a14848"], ceil: ["#140505", "#3a1414"], floor: ["#2d1a1a", "#080303"], fog: 11, fogCol: "20,0,0", wall: "circuit", pillar: "core", track: "biome4" },
  ] },
  { name: "La Red Exterior", boss: 1, gen: { S: 12, rMin: 5, rMax: 9, loop: .2, pillar: .45 }, biomes: [
    { name: "Troncal de Fibra",     pal: ["#3a2a6b", "#1e1440", "#7a5ad0"], ceil: ["#07041a", "#1c1240"], floor: ["#1c1638", "#05030f"], fog: 12, fogCol: "12,0,30", wall: "cables", pillar: "crystal" },
    { name: "Estación Satelital",   pal: ["#5a6474", "#353c48", "#9aa6b8"], ceil: ["#000004", "#05081a"], floor: ["#2a2f3a", "#0a0c12"], fog: 16, fogCol: "0,0,6", wall: "hex", pillar: "pipe", sky: true },
    { name: "Bosque de Antenas",    pal: ["#2b5a4a", "#16332a", "#5aa88a"], ceil: ["#03120c", "#0f2a20"], floor: ["#1a3328", "#040c08"], fog: 12, fogCol: "0,14,8", wall: "circuit", pillar: "pipe" },
    { name: "Tormenta de Paquetes", pal: ["#5a5420", "#302c0e", "#d8c84a"], ceil: ["#0d0b02", "#262008"], floor: ["#2e2a12", "#080702"], fog: 11, fogCol: "28,24,0", wall: "hex", pillar: "core" },
    { name: "Nido de la Araña",     pal: ["#1e3550", "#0f1c2c", "#3fc1ff"], ceil: ["#02060c", "#0c1a2a"], floor: ["#122030", "#02050a"], fog: 10, fogCol: "0,10,22", wall: "cables", pillar: "crystal" },
  ] },
  { name: "La Nube Profunda", boss: 2, gen: { S: 10, rMin: 3, rMax: 7, loop: .55, pillar: .5 }, biomes: [
    { name: "Archivo Olvidado",      pal: ["#6b5a3e", "#3e3322", "#a8916a"], ceil: ["#140f06", "#2e2414"], floor: ["#3a3020", "#0e0b06"], fog: 12, fogCol: "20,14,4", wall: "brick", pillar: "rack" },
    { name: "Memoria Corrupta",      pal: ["#1f4a1f", "#0f2a0f", "#39ff88"], ceil: ["#010a01", "#082008"], floor: ["#0f2a12", "#020803"], fog: 11, fogCol: "0,22,4", wall: "circuit", pillar: "core" },
    { name: "Papelera de Reciclaje", pal: ["#555a60", "#33373c", "#8a9096"], ceil: ["#0c0d0f", "#1e2124"], floor: ["#2c2f33", "#08090a"], fog: 13, fogCol: "8,8,8", wall: "brick", pillar: "pipe" },
    { name: "Abismo de Datos",       pal: ["#4b2b6b", "#28153a", "#8a5ab0"], ceil: ["#0a0514", "#24123a"], floor: ["#1e1430", "#05030a"], fog: 10, fogCol: "10,0,22", wall: "crystal", pillar: "crystal", sky: true, track: "biome5" },
    { name: "Cripta Root",           pal: ["#3a1f4a", "#1e0f28", "#b36bff"], ceil: ["#06020a", "#180a24"], floor: ["#1a0f24", "#040208"], fog: 9, fogCol: "14,0,22", wall: "hex", pillar: "core" },
  ] },
  { name: "El Firewall", boss: 3, gen: { S: 11, rMin: 4, rMax: 8, loop: .35, pillar: .85 }, biomes: [
    { name: "Muralla Ígnea",       pal: ["#7a3a14", "#43200a", "#ff8a3a"], ceil: ["#1a0802", "#3a1406"], floor: ["#3a1c0a", "#0e0502"], fog: 11, fogCol: "40,10,0", wall: "brick", pillar: "core" },
    { name: "Aduana de Paquetes",  pal: ["#3a4a5e", "#212b38", "#7a90aa"], ceil: ["#060a10", "#141c28"], floor: ["#202a36", "#05070a"], fog: 14, fogCol: "4,6,10", wall: "panel", pillar: "rack" },
    { name: "Cuarentena",          pal: ["#5a5a1a", "#33330c", "#c8d83a"], ceil: ["#0c0c02", "#22220a"], floor: ["#2a2a0e", "#080802"], fog: 10, fogCol: "20,26,0", wall: "hex", pillar: "pipe" },
    { name: "La Forja",            pal: ["#4a1414", "#280808", "#ff4a2a"], ceil: ["#100202", "#2a0606"], floor: ["#2a0c0c", "#080202"], fog: 10, fogCol: "34,4,0", wall: "brick", pillar: "pipe" },
    { name: "Puerta del Firewall", pal: ["#6b3a10", "#3a1e06", "#ffb703"], ceil: ["#140a02", "#301a06"], floor: ["#30200c", "#0a0602"], fog: 10, fogCol: "36,18,0", wall: "circuit", pillar: "core" },
  ] },
];
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return [f(0), f(8), f(4)];
}
const PROC_CH = {};
// Capítulos procedurales (5 en adelante): paleta, nombres, estilos y parámetros de mapa a partir de una semilla
function procChapter(ch) {
  if (PROC_CH[ch]) return PROC_CH[ch];
  const R = mulberry32(ch * 7777 + 13), pick = a => a[Math.floor(R() * a.length)];
  // Adjetivos [masculino, femenino] y sustantivos con su género para que los nombres concuerden
  const ADJ = [["Fractal", "Fractal"], ["Cuántico", "Cuántica"], ["Espectral", "Espectral"], ["Binario", "Binaria"], ["Carmesí", "Carmesí"], ["Esmeralda", "Esmeralda"],
    ["Ámbar", "Ámbar"], ["Hueco", "Hueca"], ["Infinito", "Infinita"], ["Fantasma", "Fantasma"], ["Cobalto", "Cobalto"], ["Prismático", "Prismática"]];
  const NOUN = [["Bóveda", 1], ["Laberinto", 0], ["Cámara", 1], ["Archivo", 0], ["Túnel", 0], ["Santuario", 0], ["Matriz", 1], ["Colmena", 1], ["Ruina", 1], ["Espiral", 1]];
  const used = new Set();
  const uniqueName = () => { for (let k = 0; k < 50; k++) { const [nn, f] = pick(NOUN), nm = `${nn} ${pick(ADJ)[f]}`; if (!used.has(nm)) { used.add(nm); return nm; } } return "Sector " + used.size; };
  const hsl = (h, sa, l) => `hsl(${h},${sa}%,${l}%)`;
  const biomes = [];
  for (let i = 0; i < 5; i++) {
    const h = Math.floor(R() * 360), sat = 25 + Math.floor(R() * 30);
    const fog = hslToRgb(h, 60, 6);
    biomes.push({ name: uniqueName(), pal: [hsl(h, sat, 32), hsl(h, sat, 18), hsl(h, sat + 15, 55)],
      ceil: [hsl(h, 40, 3), hsl(h, 35, 10)], floor: [hsl(h, 25, 14), hsl(h, 30, 3)], fog: 9 + Math.floor(R() * 6), fogCol: fog.join(","),
      wall: pick(["panel", "circuit", "hex", "brick", "crystal", "cables"]), pillar: pick(["rack", "pipe", "crystal", "core"]), sky: R() < .25 });
  }
  const rMax = 6 + Math.floor(R() * 4);
  return (PROC_CH[ch] = { name: `La Dimensión ${pick(ADJ)[1]}`, boss: -1, biomes,
    gen: { S: rMax + 3, rMin: 3 + Math.floor(R() * 2), rMax, loop: .15 + R() * .45, pillar: .3 + R() * .6 } });
}
const chapterOf = n => Math.floor((n - 1) / CAMPAIGN);
const chapterData = ch => CHAPTERS[ch] || procChapter(ch);
const biomeIdx = n => Math.floor(((n - 1) % CAMPAIGN) / 2);
const biomeFor = n => chapterData(chapterOf(n)).biomes[biomeIdx(n)];
const BIOMES = CHAPTERS[0].biomes;

export { CHAPTERS, hslToRgb, PROC_CH, procChapter, chapterOf, chapterData, biomeIdx, biomeFor, BIOMES };
