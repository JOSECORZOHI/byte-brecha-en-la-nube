// Sprites de enemigos, jefes, objetos, proyectiles y efectos.
import { S } from "../core/store.js";
import { mk, srnd } from "../core/config.js";

function dark(c, a) { return mk(c.width, c.height, g => { g.drawImage(c, 0, 0); g.globalCompositeOperation = "source-atop"; g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, c.width, c.height); }); }
function tint(c, col) { return mk(c.width, c.height, g => { g.drawImage(c, 0, 0); g.globalCompositeOperation = "source-atop"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); }); }
const shades = c => [c, dark(c, .35), dark(c, .6)];
const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
function drawGlitch(g, pose, f) {
  if (pose === "dead") { S.seed = 7; for (let i = 0; i < 45; i++) { g.fillStyle = srnd() < .5 ? "#c2187f" : "#33e6ff"; g.fillRect(6 + srnd() * 52 | 0, 52 + srnd() * 11 | 0, 3, 3); } return; }
  const o = f ? 3 : -3;
  const body = (dx, col) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(12 + dx, 12);
    for (let x = 12; x <= 52; x += 8) g.lineTo(x + dx, 12 - ((x / 8) % 2 ? 5 : 0));
    g.lineTo(52 + dx, 46); for (let x = 52; x >= 12; x -= 8) g.lineTo(x + dx, 46 + ((x / 8) % 2 ? 5 : 0));
    g.closePath(); g.fill();
  };
  body(o, "rgba(51,230,255,.6)"); body(-o, "rgba(255,40,40,.35)"); body(0, "#c2187f");
  g.fillStyle = "#e0409f"; g.fillRect(16, 15, 32, 4);
  g.fillStyle = "#fff"; circ(g, 32, 25, 9);
  g.fillStyle = pose === "atk" ? "#ffea00" : "#ff1f1f"; circ(g, 32 + (f ? 1 : -1), 25, pose === "atk" ? 5 : 4);
  const mh = pose === "atk" ? 12 : 6;
  g.fillStyle = "#1a0010"; g.fillRect(19, 35, 26, mh); g.fillStyle = "#fff";
  for (let x = 19; x < 44; x += 5) { g.beginPath(); g.moveTo(x, 35); g.lineTo(x + 2.5, 39); g.lineTo(x + 5, 35); g.fill(); if (pose === "atk") { g.beginPath(); g.moveTo(x, 35 + mh); g.lineTo(x + 2.5, 31 + mh); g.lineTo(x + 5, 35 + mh); g.fill(); } }
  const slice = g.getImageData(0, 20, 64, 4); g.putImageData(slice, o * 2, 20);
}
function drawSentinel(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "#3d4452"; g.fillRect(12, 55, 38, 9); g.fillStyle = "#5a6270"; g.fillRect(18, 50, 22, 8); g.fillStyle = "#ff7a1a"; g.fillRect(20, 53, 18, 2); g.fillStyle = "#2b2f3a"; g.fillRect(6, 59, 8, 5); g.fillRect(52, 60, 8, 4); return; }
  const l = f ? 3 : 0;
  g.fillStyle = "#2b2f3a"; g.fillRect(22, 44, 7, 17 - l); g.fillRect(35, 44, 7, 14 + l);
  g.fillStyle = "#1b1e26"; g.fillRect(20, 61 - l, 11, 3); g.fillRect(33, 58 + l, 11, 3);
  g.fillStyle = "#5a6270"; g.fillRect(18, 22, 28, 24); g.fillStyle = "#ff7a1a"; g.fillRect(18, 29, 28, 3);
  g.fillStyle = "#454c59"; g.fillRect(24, 35, 16, 8); g.fillStyle = "#3d4452"; g.fillRect(24, 8, 16, 13);
  g.fillStyle = "#9aa6c8"; g.fillRect(31, 3, 2, 5); g.fillStyle = pose === "atk" ? "#ffea00" : "#ff3b3b"; g.fillRect(26, 12, 12, 4);
  g.fillStyle = "#454c59"; g.fillRect(11, 23, 7, 18); g.fillStyle = "#2b2f3a"; g.fillRect(46, 23, 9, 18);
  g.fillStyle = "#111"; circ(g, 50, 42, 4);
  if (pose === "atk") { g.fillStyle = "#ffd60a"; circ(g, 50, 42, 8); g.fillStyle = "#fff"; circ(g, 50, 42, 4); }
}
function drawBrute(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "#2e5e2a"; g.fillRect(4, 50, 56, 14); g.fillStyle = "#3f7d3a"; g.fillRect(12, 43, 32, 10); g.fillStyle = "#222"; g.fillRect(44, 45, 16, 9); return; }
  const l = f ? 3 : 0;
  g.fillStyle = "#2e5e2a"; g.fillRect(15, 46, 12, 16 - l); g.fillRect(37, 46, 12, 13 + l);
  g.fillStyle = "#1d3b1a"; g.fillRect(13, 61 - l, 16, 3); g.fillRect(35, 58 + l, 16, 3);
  g.fillStyle = "#3f7d3a"; g.beginPath(); g.moveTo(10, 18); g.lineTo(54, 18); g.lineTo(48, 48); g.lineTo(16, 48); g.fill();
  g.fillStyle = "#2e5e2a"; g.fillRect(20, 24, 24, 18); g.fillStyle = pose === "atk" ? "#ffffff" : "#b6ff3b"; circ(g, 32, 33, 5);
  g.fillStyle = "#2e5e2a"; g.fillRect(26, 7, 12, 12); g.fillStyle = "#ffd60a"; g.fillRect(28, 11, 3, 2); g.fillRect(33, 11, 3, 2);
  g.fillStyle = "#3f7d3a"; g.fillRect(4, 26, 8, 16); g.fillRect(52, 26, 8, 16);
  g.fillStyle = "#222"; g.fillRect(0, 11, 13, 14); g.fillRect(51, 11, 13, 14); g.fillStyle = "#000"; circ(g, 6, 18, 3); circ(g, 57, 18, 3);
  if (pose === "atk") { g.fillStyle = "#ff7a1a"; circ(g, 6, 18, 7); circ(g, 57, 18, 7); g.fillStyle = "#fff3b0"; circ(g, 6, 18, 3); circ(g, 57, 18, 3); }
}
function drawDrone(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "#3d4452"; g.fillRect(16, 56, 30, 8); g.fillStyle = "#596275"; g.fillRect(24, 52, 14, 6); g.fillStyle = "#661515"; g.fillRect(28, 54, 5, 3); return; }
  g.fillStyle = "#3d4452"; g.fillRect(8, 22, 48, 4);
  const sp = f ? 12 : 6;
  g.fillStyle = "rgba(220,230,255,.8)"; g.fillRect(10 - sp / 2, 18, sp + 4, 2); g.fillRect(54 - sp / 2, 18, sp + 4, 2);
  g.fillStyle = "#596275"; circ(g, 32, 32, 13); g.fillStyle = "#3d4452"; circ(g, 32, 32, 9);
  g.fillStyle = pose === "atk" ? "#ffffff" : "#ff3b3b"; circ(g, 32, 32, pose === "atk" ? 6 : 4);
  g.fillStyle = "#2b2f3a"; g.fillRect(29, 44, 6, 8); g.fillStyle = "#ffd60a"; g.fillRect(30, 50, 4, 3);
}
function drawSpecter(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "rgba(160,90,255,.6)"; for (let i = 0; i < 6; i++) g.fillRect(14 + i * 7, 54 + (i % 2) * 4, 5, 6); return; }
  const gr = g.createLinearGradient(0, 6, 0, 60); gr.addColorStop(0, "#c9a7ff"); gr.addColorStop(1, "rgba(80,30,160,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(32, 6); g.quadraticCurveTo(54, 12, 52, 40);
  for (let x = 52; x >= 12; x -= 8) g.lineTo(x - 4, 58 + ((x / 8 + f) % 2 ? 4 : -2));
  g.quadraticCurveTo(10, 12, 32, 6); g.fill();
  g.fillStyle = "#14002a"; g.beginPath(); g.ellipse(32, 22, 11, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = pose === "atk" ? "#ff2e88" : "#3fc1ff"; g.fillRect(26, 20, 4, 4); g.fillRect(34, 20, 4, 4);
  if (pose === "atk") { g.strokeStyle = "#e6d4ff"; g.lineWidth = 2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(32 + s * 14, 34); g.lineTo(32 + s * 24, 30); g.moveTo(32 + s * 14, 38); g.lineTo(32 + s * 24, 40); g.stroke(); } }
}
function drawReplicator(g, pose, f) {
  if (pose === "dead") { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#1fb8a0" : "#0e6b5c"; g.fillRect(8 + i * 6, 54 + (i % 3) * 3, 6, 6); } return; }
  const o = f ? 2 : 0;
  const cubes = [[18, 26], [34, 24], [24, 12], [26, 38], [42, 38], [10, 40], [38, 10]];
  cubes.forEach(([x, y], i) => { g.fillStyle = i % 2 ? "#1fb8a0" : "#0e6b5c"; g.fillRect(x + (i % 2 ? o : -o), y, 14, 14); g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(x + (i % 2 ? o : -o), y, 14, 2); });
  g.fillStyle = "#e8fff9"; circ(g, 31, 31, 7); g.fillStyle = pose === "atk" ? "#ffb703" : "#0a3d35"; circ(g, 31, 31, 3);
  g.fillStyle = "#0e6b5c"; g.fillRect(20, 52, 8, 12); g.fillRect(36, 52, 8, 12);
}
function drawSniper(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "#2b2f3a"; g.fillRect(10, 56, 44, 8); g.fillStyle = "#454c59"; g.fillRect(6, 52, 30, 4); return; }
  const l = f ? 2 : 0;
  g.fillStyle = "#23262e"; g.fillRect(25, 40, 5, 22 - l); g.fillRect(34, 40, 5, 20 + l);
  g.fillStyle = "#33384a"; g.fillRect(23, 18, 18, 24); g.fillStyle = "#454c59"; g.fillRect(26, 6, 12, 12);
  g.fillStyle = pose === "atk" ? "#ff2e55" : "#3fc1ff"; circ(g, 32, 12, 3);
  g.save(); g.translate(32, 30); g.rotate(-.5); g.fillStyle = "#15171d"; g.fillRect(-4, -3, 34, 5); g.fillStyle = "#596275"; g.fillRect(6, -6, 10, 3); g.restore();
  if (pose === "atk") { g.fillStyle = "rgba(255,46,85,.7)"; circ(g, 58, 16, 4); }
}
function drawKernel(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "#3a0d14"; g.fillRect(4, 48, 56, 16); g.fillStyle = "#6b1a26"; g.fillRect(14, 42, 36, 8); g.fillStyle = "#ff2e55"; g.fillRect(28, 46, 8, 3); return; }
  g.strokeStyle = "#4a1020"; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(32, 34); g.quadraticCurveTo(10 + i * 9, 50 + (f ? 4 : 0), 6 + i * 10, 63); g.stroke(); }
  g.fillStyle = "#2b0a12"; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.lineTo(32 + Math.cos(a) * 24, 30 + Math.sin(a) * 24); }
  g.fill();
  g.fillStyle = "#6b1a26"; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.lineTo(32 + Math.cos(a) * 18, 30 + Math.sin(a) * 18); } g.fill();
  g.fillStyle = pose === "atk" ? "#ffffff" : "#ff2e55"; circ(g, 32, 30, 8); g.fillStyle = "#ffb703"; circ(g, 20, 22, 3); circ(g, 44, 22, 3); circ(g, 32, 44, 3);
  g.fillStyle = "#15060a"; g.fillRect(0, 22, 10, 14); g.fillRect(54, 22, 10, 14);
  if (pose === "atk") { g.fillStyle = "#ff7a1a"; circ(g, 5, 29, 6); circ(g, 59, 29, 6); }
}
function drawSpider(g, pose, f) {
  if (pose === "dead") { g.strokeStyle = "#1e3550"; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(32, 56); g.lineTo(4 + i * 8, 62 - (i % 2) * 4); g.stroke(); } g.fillStyle = "#0f1c2c"; g.fillRect(18, 50, 28, 12); return; }
  g.strokeStyle = "#0f1c2c"; g.lineWidth = 3;
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
    const lift = (i + (f ? 1 : 0)) % 2 ? 4 : 0;
    g.beginPath(); g.moveTo(32 + sd * 8, 30 + i * 3); g.lineTo(32 + sd * (18 + i * 2), 16 + i * 6 - lift); g.lineTo(32 + sd * (26 + i), 50 + i * 3 - lift); g.stroke();
  }
  g.fillStyle = "#1e3550"; circ(g, 32, 34, 15); g.fillStyle = "#0f1c2c"; circ(g, 32, 18, 9);
  g.strokeStyle = "#3fc1ff"; g.lineWidth = 1; g.beginPath(); g.moveTo(32, 22); g.lineTo(32, 46); g.moveTo(22, 34); g.lineTo(42, 34); g.arc(32, 34, 8, 0, Math.PI * 2); g.stroke();
  g.fillStyle = pose === "atk" ? "#ff2e55" : "#3fc1ff";
  for (const [x, y] of [[27, 15], [32, 13], [37, 15], [29, 20], [35, 20], [32, 18]]) g.fillRect(x - 1, y - 1, 3, 3);
  if (pose === "atk") { g.fillStyle = "rgba(63,193,255,.6)"; circ(g, 32, 34, 6); }
}
function drawRoot(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "rgba(90,40,140,.8)"; g.fillRect(12, 54, 40, 10); g.fillStyle = "#ffd700"; g.fillRect(24, 50, 16, 4); return; }
  const gr = g.createLinearGradient(0, 10, 0, 64); gr.addColorStop(0, "#5a2a8a"); gr.addColorStop(1, "rgba(40,10,70,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(32, 12); g.lineTo(54, 30); for (let x = 54; x >= 10; x -= 8) g.lineTo(x, 60 + ((x / 8 + f) % 2 ? 3 : -2)); g.lineTo(10, 30); g.fill();
  g.fillStyle = "#1a0a2a"; circ(g, 32, 20, 9);
  g.fillStyle = "#ffd700"; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(22 + i * 5, 12); g.lineTo(24.5 + i * 5, 4 - (i % 2) * 3); g.lineTo(27 + i * 5, 12); g.fill(); }
  g.fillStyle = pose === "atk" ? "#ffffff" : "#b36bff"; g.fillRect(27, 18, 4, 4); g.fillRect(34, 18, 4, 4);
  g.fillStyle = "#b36bff"; g.font = "bold 9px monospace"; g.textAlign = "center"; g.fillText("#", 32, 40);
  if (pose === "atk") { g.fillStyle = "rgba(179,107,255,.7)"; circ(g, 8, 34, 6); circ(g, 56, 34, 6); }
}
function drawFirewall(g, pose, f) {
  if (pose === "dead") { for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? "#7a3a14" : "#43200a"; g.fillRect(6 + i * 6, 52 + (i % 3) * 3, 7, 8); } return; }
  for (let row = 0; row < 6; row++) for (let col = 0; col < 4; col++) { g.fillStyle = (row + col) % 2 ? "#7a3a14" : "#5a2a0e"; g.fillRect(10 + col * 11 + (row % 2) * 5, 18 + row * 7, 10, 6); }
  g.fillStyle = "#2b1206"; g.fillRect(4, 24, 8, 22); g.fillRect(52, 24, 8, 22);
  const fl = f ? 4 : 0;
  g.fillStyle = "#ff7a1a"; for (let x = 10; x < 54; x += 8) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x + 4, 6 + ((x / 8) % 2 ? fl : 4 - fl)); g.lineTo(x + 8, 18); g.fill(); }
  g.fillStyle = "#ffd166"; for (let x = 12; x < 52; x += 8) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x + 2, 12); g.lineTo(x + 4, 18); g.fill(); }
  g.fillStyle = "#1a0802"; g.fillRect(24, 30, 16, 12); g.fillStyle = pose === "atk" ? "#ffffff" : "#ff5a1a"; g.fillRect(27, 33, 10, 6);
  g.fillStyle = "#43200a"; g.fillRect(16, 60, 10, 4); g.fillRect(38, 60, 10, 4);
  if (pose === "atk") { g.fillStyle = "#ffb703"; circ(g, 8, 46, 5); circ(g, 56, 46, 5); }
}
function drawPylon(g, pose, f) {
  if (pose === "dead") { g.fillStyle = "#2b2f3a"; g.fillRect(22, 54, 20, 10); g.fillStyle = "#3f7fff"; g.fillRect(28, 56, 8, 2); return; }
  g.fillStyle = "#2b2f3a"; g.fillRect(26, 18, 12, 44); g.fillRect(18, 58, 28, 6);
  g.fillStyle = "#596275"; g.fillRect(24, 26, 16, 3); g.fillRect(24, 40, 16, 3);
  const gr = g.createRadialGradient(32, 12, 1, 32, 12, 11); gr.addColorStop(0, "#ffffff"); gr.addColorStop(.4, "#6fb4ff"); gr.addColorStop(1, "rgba(63,127,255,0)");
  g.fillStyle = gr; circ(g, 32, 12, 11 + (f ? 1 : 0));
}
function enemySprites(drawFn) {
  const out = {}, elite = {};
  for (const pose of ["walk0", "walk1", "atk", "dead"]) {
    const c = mk(64, 64, g => drawFn(g, pose.startsWith("walk") ? "walk" : pose, pose === "walk1" ? 1 : 0));
    out[pose] = shades(c);
    elite[pose] = shades(tint(c, "rgba(255,196,30,.38)"));
  }
  out.pain = shades(tint(out.walk0[0], "rgba(255,255,255,.55)"));
  elite.pain = out.pain;
  return { normal: out, elite };
}
const ITEM_DRAW = {
  h: g => { g.fillStyle = "#e8ecf8"; g.fillRect(24, 50, 16, 13); g.fillStyle = "#39d98a"; g.fillRect(30, 52, 4, 9); g.fillRect(27, 55, 10, 3); },
  H: g => { g.fillStyle = "#e8ecf8"; g.fillRect(16, 42, 32, 22); g.fillStyle = "#b8c0d6"; g.fillRect(16, 42, 32, 3); g.fillStyle = "#39d98a"; g.fillRect(29, 47, 6, 14); g.fillRect(25, 51, 14, 6); },
  a: g => { g.fillStyle = "#3f7fff"; g.beginPath(); g.moveTo(20, 38); g.lineTo(44, 38); g.lineTo(44, 50); g.lineTo(32, 63); g.lineTo(20, 50); g.fill(); g.fillStyle = "#9cc4ff"; g.fillRect(24, 42, 16, 3); g.fillStyle = "#ffb703"; g.fillRect(30, 46, 4, 10); },
  i: g => { g.fillStyle = "#ffb703"; g.fillRect(25, 47, 14, 16); g.fillStyle = "#8a5a00"; g.fillRect(29, 44, 6, 3); g.fillStyle = "#1b1300"; g.fillRect(28, 52, 8, 2); },
  k: g => { g.fillStyle = "#5a3b1a"; g.fillRect(18, 50, 28, 13); for (let i = 0; i < 4; i++) { g.fillStyle = "#d62828"; g.fillRect(20 + i * 6, 44, 4, 8); g.fillStyle = "#ffd166"; g.fillRect(20 + i * 6, 50, 4, 2); } },
  c: g => { g.fillStyle = "#1b2a5c"; g.fillRect(22, 42, 20, 21); g.fillStyle = "#3fc1ff"; g.fillRect(25, 45, 14, 15); g.fillStyle = "#c8f1ff"; g.fillRect(28, 48, 8, 3); },
  q: g => { for (const x of [22, 34]) { g.fillStyle = "#6b7a4a"; g.fillRect(x, 44, 8, 19); g.fillStyle = "#d62828"; g.beginPath(); g.moveTo(x, 44); g.lineTo(x + 4, 37); g.lineTo(x + 8, 44); g.fill(); g.fillStyle = "#ffb703"; g.fillRect(x, 58, 8, 2); } },
  r: g => { g.fillStyle = "#ff3b3b"; g.fillRect(23, 46, 18, 13); g.fillStyle = "#fff"; g.fillRect(25, 48, 8, 2); g.fillStyle = "#ffd60a"; g.fillRect(34, 52, 5, 4); },
  u: g => { g.fillStyle = "#3f7fff"; g.fillRect(23, 46, 18, 13); g.fillStyle = "#fff"; g.fillRect(25, 48, 8, 2); g.fillStyle = "#ffd60a"; g.fillRect(34, 52, 5, 4); },
  S: g => { g.fillStyle = "#2b2f3a"; g.fillRect(6, 52, 44, 5); g.fillRect(6, 57, 44, 3); g.fillStyle = "#a8703f"; g.fillRect(40, 51, 18, 9); g.fillStyle = "#ff7a1a"; g.fillRect(20, 50, 12, 3); },
  M: g => { g.fillStyle = "#2b2f3a"; g.fillRect(10, 50, 40, 7); g.fillRect(26, 57, 6, 7); g.fillStyle = "#ff7a1a"; g.fillRect(14, 51, 16, 2); g.fillStyle = "#15171d"; g.fillRect(4, 52, 8, 3); },
  L: g => { g.fillStyle = "#3b4a7a"; g.fillRect(6, 49, 52, 12); g.fillStyle = "#3fc1ff"; g.fillRect(14, 52, 4, 6); g.fillRect(22, 52, 4, 6); g.fillRect(30, 52, 4, 6); g.fillStyle = "#1b2238"; g.fillRect(48, 46, 8, 4); },
  Q: g => { g.fillStyle = "#4a5a3a"; g.fillRect(4, 48, 54, 12); g.fillStyle = "#2b2f3a"; g.beginPath(); g.ellipse(6, 54, 4, 6, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#ffb703"; g.fillRect(30, 46, 10, 3); },
  bit: g => {
    const gr = g.createRadialGradient(32, 50, 1, 32, 50, 12); gr.addColorStop(0, "#fff6b0"); gr.addColorStop(.5, "#ffb703"); gr.addColorStop(1, "#ff7a1a");
    g.fillStyle = gr; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2; g.lineTo(32 + Math.cos(a) * 10, 50 + Math.sin(a) * 10); } g.fill();
    g.fillStyle = "#7a3d00"; g.fillRect(30, 45, 4, 10);
  },
  o: g => {
    g.fillStyle = "#2f7d32"; g.fillRect(18, 24, 28, 40); g.fillStyle = "#1f5a22"; g.fillRect(18, 32, 28, 3); g.fillRect(18, 54, 28, 3);
    g.fillStyle = "#b6ff3b"; g.beginPath(); g.ellipse(32, 25, 14, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffd60a"; g.beginPath(); g.moveTo(32, 38); g.lineTo(39, 50); g.lineTo(25, 50); g.fill(); g.fillStyle = "#111"; g.fillRect(31, 42, 2, 5);
  },
  l: g => { g.fillStyle = "#2b2f3a"; g.fillRect(30, 12, 4, 50); g.fillRect(22, 60, 20, 4); g.fillStyle = "#fff6b0"; g.fillRect(24, 2, 16, 11); g.fillStyle = "rgba(255,246,176,.35)"; g.fillRect(20, 0, 24, 15); },
};
const ITEM_SPR = {};
for (const k in ITEM_DRAW) ITEM_SPR[k] = shades(mk(64, 64, ITEM_DRAW[k]));
ITEM_SPR.l = [ITEM_SPR.l[0], ITEM_SPR.l[0], ITEM_SPR.l[0]];
ITEM_SPR.bit = [ITEM_SPR.bit[0], ITEM_SPR.bit[0], ITEM_SPR.bit[1]];
const glow = (c1, c2, s = 16) => mk(s, s, g => { const h = s / 2, gr = g.createRadialGradient(h, h, 1, h, h, h); gr.addColorStop(0, "#fff"); gr.addColorStop(.35, c1); gr.addColorStop(1, c2); g.fillStyle = gr; circ(g, h, h, h); });
const PROJ_SPR = {
  orb: glow("#ff3b3b", "rgba(255,0,0,0)"), rocket: glow("#ff9f1a", "rgba(255,80,0,0)"), plasma: glow("#3fc1ff", "rgba(0,120,255,0)"),
  laser: glow("#ff2e55", "rgba(255,0,60,0)"), prock: glow("#ffd166", "rgba(255,120,0,0)"), void: glow("#b36bff", "rgba(60,0,120,0)", 32),
  homing: glow("#b36bff", "rgba(120,0,255,0)"), fire: glow("#ff7a1a", "rgba(255,40,0,0)", 24), mine: glow("#ff2e55", "rgba(80,0,0,0)", 24),
};
const FX_SPARK = mk(16, 16, g => { g.fillStyle = "#fff"; g.fillRect(7, 2, 2, 12); g.fillRect(2, 7, 12, 2); g.fillStyle = "#3fc1ff"; g.fillRect(5, 5, 6, 6); });
const FX_BLINK = mk(16, 16, g => { g.fillStyle = "#c9a7ff"; g.fillRect(7, 0, 2, 16); g.fillRect(0, 7, 16, 2); g.fillStyle = "#fff"; g.fillRect(6, 6, 4, 4); });
const FX_BOOM = [14, 24, 31].map((r, i) => mk(64, 64, g => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, r); gr.addColorStop(0, i < 2 ? "#fff6b0" : "#ffb703"); gr.addColorStop(.5, "#ff7a1a"); gr.addColorStop(1, "rgba(120,20,0,0)"); g.fillStyle = gr; circ(g, 32, 32, r); }));
const FX_VOID = mk(64, 64, g => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, "#000"); gr.addColorStop(.45, "#12002a"); gr.addColorStop(.7, "#b36bff"); gr.addColorStop(1, "rgba(80,0,160,0)"); g.fillStyle = gr; circ(g, 32, 32, 31); });

export { dark, tint, shades, circ, drawGlitch, drawSentinel, drawBrute, drawDrone, drawSpecter, drawReplicator, drawSniper, drawKernel, drawSpider, drawRoot, drawFirewall, drawPylon, enemySprites, ITEM_DRAW, ITEM_SPR, glow, PROJ_SPR, FX_SPARK, FX_BLINK, FX_BOOM, FX_VOID };
