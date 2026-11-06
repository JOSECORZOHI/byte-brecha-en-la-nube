// Jugador, entrada y consultas sobre el mapa.
import { S } from "../core/store.js";
import { RW, VH } from "../core/config.js";

S.state = "title"; // title | playing | paused | dead | inter | victory | shop
S.sector = 1; S.LV = null; S.L = null; S.map = []; S.MW = 0; S.MH = 0;
S.doors = {}; S.enemies = []; S.items = []; S.decor = []; S.projectiles = []; S.effects = []; S.voids = []; S.bolts = []; S.popups = [];
S.seen = new Uint8Array(1); S.flow = new Int16Array(1); S.flowTimer = 0;
S.stats = { kills: 0, totalKills: 0, items: 0, totalItems: 0, time: 0 };
S.messages = []; S.hurtFlash = 0; S.pickFlash = 0; S.introT = 0; S.showMap = false; S.sectorBits = 0; S.bitPulse = 0;
S.ceilGrad = undefined; S.floorGrad = undefined; S.CAM = null; S.muzzleXY = [RW / 2, VH - 80]; S.interData = null; S.shopReturn = "title"; S.shopTab = "armas";
const zbuf = new Float32Array(RW);
S.run = null; // { seed, sector, diff, has, ammo, mag, health, armor, weapon }
const freshSlots = () => ["pistol", null, null, null];
const player = {
  x: 0, y: 0, a: 0, vx: 0, vy: 0, health: 100, armor: 0,
  ammo: { bullets: 48, shells: 0, cells: 0, rockets: 0 }, mag: {}, slots: freshSlots(), stash: [], slot: 0, inspectT: 0, swapOffer: null,
  weapon: "pistol", cooldown: 0, fireAnim: 0, raise: 0, bob: 0, keys: { r: false, u: false },
  faceLook: 0, faceT: 0, hurtT: 0, moving: false, reloadT: 0, reloadDur: 1, reloadStage: 0,
  combatT: 99, regen: false, hitT: 0, killT: 0, shake: 0, hurtDirs: [],
};
const input = { keys: {}, fire: false, mouseDX: 0 };
const inSlots = id => player.slots.includes(id);
S.locked = false;
const cell = (x, y) => (x < 0 || y < 0 || x >= S.MW || y >= S.MH) ? "#" : S.map[y][x];
const isWall = ch => ch === "#" || ch === "%" || ch === "X";
const isDoor = ch => ch === "D" || ch === "R" || ch === "B";
function isSolid(cx, cy) { const ch = cell(cx, cy); if (isWall(ch)) return true; if (isDoor(ch)) return S.doors[cx + "," + cy].open < .9; return false; }
function msg(t, col = "#ffb703") { S.messages.unshift({ t, col, life: 3 }); if (S.messages.length > 4) S.messages.pop(); }

export { zbuf, freshSlots, player, input, inSlots, cell, isWall, isDoor, isSolid, msg };
