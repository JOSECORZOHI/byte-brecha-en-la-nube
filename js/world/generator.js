// Generación procedural de sectores y arenas de jefe.
import { CAMPAIGN, DIR4, clamp, mulberry32 } from "../core/config.js";
import { chapterData, chapterOf } from "./chapters.js";
import { bossFor, enemyPool, weighted } from "../data/enemies.js";

function connect(g, a, b, doorRoom, type, R, S) {
  const RI = (x, y) => x + Math.floor(R() * (y - x + 1));
  const cells = []; let wa, wb, A, B;
  if (a.gy === b.gy) {
    [A, B] = a.gx < b.gx ? [a, b] : [b, a];
    const xa = A.x0 + A.w, xb = B.x0 - 1;
    const lo = Math.max(A.y0, B.y0), hi = Math.min(A.y0 + A.h - 1, B.y0 + B.h - 1);
    if (lo <= hi) { const y = RI(lo, hi); for (let x = xa; x <= xb; x++) cells.push([x, y]); wa = [xa, y]; wb = [xb, y]; }
    else {
      const ya = RI(A.y0, A.y0 + A.h - 1), yb = RI(B.y0, B.y0 + B.h - 1), m = B.gx * S;
      for (let x = xa; x <= m; x++) cells.push([x, ya]);
      for (let y = Math.min(ya, yb); y <= Math.max(ya, yb); y++) cells.push([m, y]);
      for (let x = m; x <= xb; x++) cells.push([x, yb]);
      wa = [xa, ya]; wb = [xb, yb];
    }
  } else {
    [A, B] = a.gy < b.gy ? [a, b] : [b, a];
    const ya = A.y0 + A.h, yb = B.y0 - 1;
    const lo = Math.max(A.x0, B.x0), hi = Math.min(A.x0 + A.w - 1, B.x0 + B.w - 1);
    if (lo <= hi) { const x = RI(lo, hi); for (let y = ya; y <= yb; y++) cells.push([x, y]); wa = [x, ya]; wb = [x, yb]; }
    else {
      const xa = RI(A.x0, A.x0 + A.w - 1), xb = RI(B.x0, B.x0 + B.w - 1), m = B.gy * S;
      for (let y = ya; y <= m; y++) cells.push([xa, y]);
      for (let x = Math.min(xa, xb); x <= Math.max(xa, xb); x++) cells.push([x, m]);
      for (let y = m; y <= yb; y++) cells.push([xb, y]);
      wa = [xa, ya]; wb = [xb, yb];
    }
  }
  for (const [x, y] of cells) if (g[y][x] === "#") g[y][x] = ".";
  const [dx, dy] = doorRoom === A ? wa : wb;
  if (type) g[dy][dx] = type;
  return [dx, dy];
}
function genSector(n, sd, wantW) {
  const R = mulberry32(sd), RI = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)];
  const GP = chapterData(chapterOf(n)).gen, li = (n - 1) % CAMPAIGN + 1;
  const GW = Math.min(5, 3 + Math.floor((li - 1) / 3)), GH = Math.min(4, 2 + Math.floor(li / 3)), S = GP.S;
  const W = GW * S + 1, H = GH * S + 1;
  const g = Array.from({ length: H }, () => Array(W).fill("#"));
  const rooms = [];
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const w = RI(GP.rMin, GP.rMax), h = RI(GP.rMin, GP.rMax);
    const x0 = gx * S + RI(2, S - 1 - w), y0 = gy * S + RI(2, S - 1 - h);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) g[y][x] = ".";
    rooms.push({ id: rooms.length, gx, gy, x0, y0, w, h, adj: [] });
  }
  const at = (gx, gy) => rooms[gy * GW + gx];
  // Árbol de expansión aleatorio (laberinto de habitaciones)
  const start = at(0, RI(0, GH - 1)), edges = [], visited = new Set([start.id]), stack = [start];
  while (stack.length) {
    const r = stack[stack.length - 1];
    const nb = DIR4.map(([dx, dy]) => [r.gx + dx, r.gy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < GW && y < GH).map(([x, y]) => at(x, y)).filter(o => !visited.has(o.id));
    if (!nb.length) { stack.pop(); continue; }
    const o = pick(nb); visited.add(o.id); edges.push([r, o]); r.adj.push(o); o.adj.push(r); stack.push(o);
  }
  const depth = new Map([[start.id, 0]]), q = [start];
  while (q.length) { const r = q.shift(); for (const o of r.adj) if (!depth.has(o.id)) { depth.set(o.id, depth.get(r.id) + 1); q.push(o); } }
  const leaves = rooms.filter(r => r !== start && r.adj.length === 1).sort((a, b) => depth.get(b.id) - depth.get(a.id));
  const exitRoom = leaves[0];
  const useRed = n >= 2, useBlue = n >= 4 && leaves.length >= 2;
  const blueRoom = useBlue ? leaves[1 + Math.floor(R() * (leaves.length - 1))] : null;
  const locked = new Set([exitRoom.id]); if (blueRoom) locked.add(blueRoom.id);
  // Bucles extra para que haya rutas alternativas
  for (const a of rooms) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    if (a.gx + dx >= GW || a.gy + dy >= GH) continue;
    const b = at(a.gx + dx, a.gy + dy);
    if (a.adj.includes(b) || locked.has(a.id) || locked.has(b.id) || R() > GP.loop) continue;
    edges.push([a, b]); a.adj.push(b); b.adj.push(a);
  }
  let exitDoor = null;
  for (const [a, b] of edges) {
    let doorRoom = R() < .5 ? a : b, type = R() < .8 ? "D" : null;
    const lk = locked.has(b.id) ? b : locked.has(a.id) ? a : null;
    if (lk) { doorRoom = lk; type = lk === exitRoom ? (useRed ? "R" : "D") : "B"; }
    const pos = connect(g, a, b, doorRoom, type, R, S);
    if (lk === exitRoom) exitDoor = pos;
  }
  // Pilares interiores
  for (const r of rooms) {
    if (r.w >= 6 && r.h >= 6 && R() < GP.pillar) {
      const ch = R() < .5 ? "%" : "#";
      if (R() < .5) { for (const x of [r.x0 + 2, r.x0 + r.w - 3]) for (const y of [r.y0 + 2, r.y0 + r.h - 3]) g[y][x] = ch; }
      else g[Math.floor(r.y0 + r.h / 2)][Math.floor(r.x0 + r.w / 2)] = ch;
    }
  }
  // Interruptor de salida en la pared más lejana a la puerta
  let best = null, bd = -1;
  const ring = [];
  for (let x = exitRoom.x0; x < exitRoom.x0 + exitRoom.w; x++) ring.push([x, exitRoom.y0 - 1], [x, exitRoom.y0 + exitRoom.h]);
  for (let y = exitRoom.y0; y < exitRoom.y0 + exitRoom.h; y++) ring.push([exitRoom.x0 - 1, y], [exitRoom.x0 + exitRoom.w, y]);
  for (const [x, y] of ring) { if (g[y][x] !== "#") continue; const d = exitDoor ? Math.hypot(x - exitDoor[0], y - exitDoor[1]) : R(); if (d > bd) { bd = d; best = [x, y]; } }
  g[best[1]][best[0]] = "X";

  const lv = { map: g, W, H, rooms, enemies: [], items: [], decor: [], boss: false, red: useRed, blue: !!blueRoom };
  const freeCells = r => { const out = []; for (let y = r.y0; y < r.y0 + r.h; y++) for (let x = r.x0; x < r.x0 + r.w; x++) if (g[y][x] === ".") out.push([x, y]); return out; };
  const take = list => list.splice(Math.floor(R() * list.length), 1)[0];
  const pool = enemyPool(n), eliteP = n >= 3 ? Math.min(.3, (n - 2) * .04) : 0;
  const free = new Map(rooms.map(r => [r.id, freeCells(r)]));
  for (const r of rooms) {
    const cells = free.get(r.id);
    if (r === start) { if (cells.length) { const [x, y] = take(cells); lv.items.push({ kind: "i", x: x + .5, y: y + .5 }); } continue; }
    const cnt = clamp(Math.round(r.w * r.h / Math.max(11, 19 - n) * (.6 + R() * .6)), 1, 7);
    for (let i = 0; i < cnt && cells.length > 2; i++) {
      const [x, y] = take(cells);
      lv.enemies.push({ type: weighted(pool, R), x: x + .5, y: y + .5, elite: R() < eliteP, room: r.id });
    }
    const loot = [["h", .35], ["i", .4], ["k", n >= 2 ? .3 : .1], ["c", n >= 3 ? .3 : .08], ["q", n >= 5 ? .2 : 0], ["a", .12], ["H", .1]];
    for (const [k, p] of loot) if (R() < p && cells.length) { const [x, y] = take(cells); lv.items.push({ kind: k, x: x + .5, y: y + .5 }); }
    if (R() < .45 && cells.length > 3) { const [x, y] = take(cells); lv.decor.push({ kind: "o", x: x + .5, y: y + .5 }); }
    if (R() < .35 && cells.length > 3) { const [x, y] = take(cells); lv.decor.push({ kind: "l", x: x + .5, y: y + .5 }); }
  }
  const placeIn = (r, kind) => { const cells = free.get(r.id); if (!cells.length) return false; const [x, y] = take(cells); lv.items.push({ kind, x: x + .5, y: y + .5 }); return true; };
  const others = rooms.filter(r => r !== start && r !== exitRoom && r !== blueRoom).sort((a, b) => depth.get(b.id) - depth.get(a.id));
  if (blueRoom) { placeIn(blueRoom, "r"); placeIn(pick(others.length ? others : [start]), "u"); }
  else if (useRed) placeIn(pick(others.slice(0, Math.max(1, Math.ceil(others.length / 2)))), "r");
  for (const k of wantW) placeIn(pick(others.length ? others : [start]), k);
  lv.start = { x: start.x0 + start.w / 2, y: start.y0 + start.h / 2, a: 0 };
  if (g[Math.floor(lv.start.y)][Math.floor(lv.start.x)] !== ".") { lv.start.x = start.x0 + .5; lv.start.y = start.y0 + .5; }
  return lv;
}
function genBoss(n, sd, wantW) {
  const R = mulberry32(sd), RI = (a, b) => a + Math.floor(R() * (b - a + 1)), B = bossFor(chapterOf(n));
  const W = 36, H = 24, g = Array.from({ length: H }, () => Array(W).fill("#"));
  const carve = (x0, y0, w, h, ch = ".") => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) g[y][x] = ch; };
  carve(2, 9, 7, 6); carve(9, 11, 4, 1);
  // Arena distinta según el jefe
  if (B.arena === "hall") carve(13, 6, 21, 12); else carve(13, 2, 21, 20);
  const pil = (x, y, ch = "%") => { if (g[y] && g[y][x] === ".") g[y][x] = ch; };
  if (B.arena === "core") {
    for (let k = 0, n2 = RI(3, 5); k < n2; k++) { const px = RI(16, 24), py = RI(4, 8); for (const yy of [py, H - 2 - py]) for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) pil(px + ox, yy + oy); }
  } else if (B.arena === "web") {
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + R() * .2; pil(Math.round(23 + Math.cos(a) * 7.5), Math.round(11.5 + Math.sin(a) * 7.5), "#"); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; pil(Math.round(23 + Math.cos(a) * 3.5), Math.round(11.5 + Math.sin(a) * 3.5)); }
  } else if (B.arena === "crypt") {
    for (let x = 16; x <= 31; x += 3) for (let y = 4; y <= 19; y += 3) if (R() < .7) pil(x, y, R() < .5 ? "#" : "%");
  } else {
    for (const x of [18, 23, 28]) for (const y of [8, 15]) { pil(x, y); pil(x + 1, y); }
  }
  carve(13, 9, 3, 6); carve(26, 8, 7, 8); carve(31, 11, 3, 1);
  g[11][9] = "D"; g[11][34] = "X";
  const ay0 = B.arena === "hall" ? 6 : 2, ah = B.arena === "hall" ? 12 : 20;
  const lv = { map: g, W, H, boss: true, red: false, blue: false,
    rooms: [{ id: 0, x0: 2, y0: 9, w: 7, h: 6 }, { id: 1, x0: 13, y0: ay0, w: 21, h: ah }],
    enemies: [{ type: "boss", x: 29.5, y: 11.5, room: 1 }], items: [], decor: [], start: { x: 5.5, y: 11.5, a: 0 } };
  const pool = enemyPool(n).filter(([k]) => k !== "sniper");
  const corners = [[18.5, ay0 + 1.5], [18.5, ay0 + ah - 1.5], [30.5, ay0 + 1.5], [30.5, ay0 + ah - 1.5]];
  for (const [x, y] of corners) if (g[Math.floor(y)][Math.floor(x)] === ".") lv.enemies.push({ type: weighted(pool, R), x, y, room: 1, elite: R() < .3 });
  for (const [k, x, y] of [["H", 3.5, 10.5], ["a", 3.5, 13.5], ["c", 7.5, 10.5], ["k", 7.5, 13.5], ["q", 5.5, 9.5], ["i", 5.5, 14.5],
    ["h", 14.5, ay0 + 1.5], ["c", 14.5, ay0 + ah - 1.5], ["i", 32.5, ay0 + 1.5], ["q", 32.5, ay0 + ah - 1.5]]) if (g[Math.floor(y)][Math.floor(x)] === ".") lv.items.push({ kind: k, x, y });
  wantW.forEach((k, i) => lv.items.push({ kind: k, x: 3.5 + i, y: 12.5 }));
  return lv;
}
function solvable(lv) {
  const g = lv.map, keys = new Set();
  const keyAt = new Map(lv.items.filter(i => i.kind === "r" || i.kind === "u").map(i => [Math.floor(i.x) + "," + Math.floor(i.y), i.kind]));
  const sx = Math.floor(lv.start.x), sy = Math.floor(lv.start.y);
  if (g[sy][sx] !== ".") return false;
  for (let iter = 0; iter < 3; iter++) {
    const seenC = new Set([sx + "," + sy]), qq = [[sx, sy]];
    let exitOk = false;
    while (qq.length) {
      const [x, y] = qq.pop();
      const k = keyAt.get(x + "," + y); if (k) keys.add(k);
      for (const [dx, dy] of DIR4) {
        const nx = x + dx, ny = y + dy, id = nx + "," + ny, c = g[ny] && g[ny][nx];
        if (c === "X") exitOk = true;
        if (!c || seenC.has(id) || c === "#" || c === "%" || c === "X") continue;
        if ((c === "R" && !keys.has("r")) || (c === "B" && !keys.has("u"))) continue;
        seenC.add(id); qq.push([nx, ny]);
      }
    }
    if (exitOk) return true;
  }
  return false;
}
function generateSector(n, runSeed, wantW) {
  for (let k = 0; k < 80; k++) {
    const sd = (runSeed + n * 7919 + k * 104729) >>> 0;
    const lv = n % CAMPAIGN === 0 ? genBoss(n, sd, wantW) : genSector(n, sd, wantW);
    if (solvable(lv)) return lv;
  }
  throw new Error("No se pudo generar el sector " + n);
}

export { connect, genSector, genBoss, solvable, generateSector };
