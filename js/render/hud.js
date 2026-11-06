// Interfaz en partida: paneles, radar, mapa, barra de jefe y mensajes.
import { S } from "../core/store.js";
import { RH, RW, VH, ctx } from "../core/config.js";
import { maxHealth } from "../core/profile.js";
import { EDEF } from "../data/enemies.js";
import { MAX_SLOTS, PICKUP_ID, WD, magSize, modelCanvas } from "../data/weapons.js";
import { isDoor, isWall, player } from "../game/world.js";
import { canReload, curWeapon } from "../game/player.js";
import { glowText, hexIcon, panel, segBar } from "./renderer.js";

function drawAutomap() {
  const sc = Math.min((RW - 40) / S.MW, (VH - 90) / S.MH), ox = (RW - S.MW * sc) / 2, oy = 24;
  ctx.fillStyle = "rgba(3,5,14,.85)"; ctx.fillRect(0, 0, RW, RH);
  for (let y = 0; y < S.MH; y++) for (let x = 0; x < S.MW; x++) {
    if (!S.seen[y * S.MW + x]) continue;
    const ch = S.map[y][x];
    ctx.fillStyle = isWall(ch) ? (ch === "X" ? "#39ff88" : "#34406a") : ch === "R" ? "#ff3b3b" : ch === "B" ? "#3f7fff" : ch === "D" ? "#ffb703" : "#121933";
    ctx.fillRect(ox + x * sc, oy + y * sc, sc - .5, sc - .5);
  }
  const px = ox + player.x * sc, py = oy + player.y * sc;
  ctx.fillStyle = S.SK.cross; ctx.shadowColor = S.SK.cross; ctx.shadowBlur = 8; ctx.beginPath();
  ctx.moveTo(px + Math.cos(player.a) * sc * .9, py + Math.sin(player.a) * sc * .9);
  ctx.lineTo(px + Math.cos(player.a + 2.5) * sc * .6, py + Math.sin(player.a + 2.5) * sc * .6);
  ctx.lineTo(px + Math.cos(player.a - 2.5) * sc * .6, py + Math.sin(player.a - 2.5) * sc * .6); ctx.fill(); ctx.shadowBlur = 0;
  glowText(`MAPA · ${S.L.name}   [TAB] CERRAR`, RW / 2, 16, 8, "#3fc1ff", "center", 6);
}
function drawRadar() {
  const p = player, cx = RW - 42, cy = 42, R = 32, range = 11, sc = R / range, ca = Math.cos(p.a), sa = Math.sin(p.a);
  const toR = (wx, wy) => { const dx = wx - p.x, dy = wy - p.y; return [cx + (-dx * sa + dy * ca) * sc, cy - (dx * ca + dy * sa) * sc]; };
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = "rgba(4,8,22,.78)"; ctx.fill();
  ctx.strokeStyle = "#3fc1ff"; ctx.shadowColor = "#3fc1ff"; ctx.shadowBlur = 8; ctx.lineWidth = 1; ctx.stroke(); ctx.shadowBlur = 0; ctx.clip();
  const px = Math.floor(p.x), py = Math.floor(p.y);
  for (let y = py - range; y <= py + range; y++) for (let x = px - range; x <= px + range; x++) {
    if (x < 0 || y < 0 || x >= S.MW || y >= S.MH || !S.seen[y * S.MW + x]) continue;
    const ch = S.map[y][x]; if (!isWall(ch) && !isDoor(ch)) continue;
    const [rx, ry] = toR(x + .5, y + .5);
    ctx.fillStyle = isDoor(ch) ? "rgba(255,183,3,.7)" : ch === "X" ? "rgba(57,255,136,.8)" : "rgba(63,193,255,.3)"; ctx.fillRect(rx - sc / 2, ry - sc / 2, sc, sc);
  }
  const sw = S.stats.time * 2.5;
  ctx.strokeStyle = "rgba(63,193,255,.35)"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R); ctx.stroke();
  for (const e of S.enemies) {
    if (e.dead || Math.hypot(e.x - p.x, e.y - p.y) > range * 1.4) continue;
    const [rx, ry] = toR(e.x, e.y), big = EDEF[e.type].boss || e.elite;
    ctx.fillStyle = e.elite ? "#ffd60a" : e.alert ? (Math.sin(S.stats.time * 10) > 0 ? "#ff2e55" : "#ff8a9e") : "rgba(255,46,85,.55)";
    ctx.fillRect(rx - (big ? 2.5 : 1.5), ry - (big ? 2.5 : 1.5), big ? 5 : 3, big ? 5 : 3);
  }
  for (const it of S.items) { if (it.kind !== "r" && it.kind !== "u") continue; const [rx, ry] = toR(it.x, it.y); ctx.fillStyle = it.kind === "r" ? "#ff3b3b" : "#3f7fff"; ctx.fillRect(rx - 2, ry - 2, 4, 4); }
  ctx.fillStyle = "#e8ecf8"; ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + 3, cy + 3); ctx.lineTo(cx - 3, cy + 3); ctx.fill();
  ctx.restore();
  glowText(`AMENAZAS ${S.stats.totalKills - S.stats.kills}`, cx, cy + R + 11, 7, "#ff2e88", "center", 5);
  hexIcon(cx - 24, cy + R + 21, 4 + S.bitPulse * 6, "#ffb703");
  glowText(`${S.profile.bits + S.sectorBits}`, cx - 17, cy + R + 24, 8, "#ffb703", "left", 4);
}
function drawBossBar() {
  const b = S.enemies.find(e => EDEF[e.type].boss && !e.dead && e.alert);
  if (!b) return;
  const B = EDEF.boss.bdef, col = B.color;
  const w = 220, x = RW / 2 - w / 2, y = 14;
  panel(x - 6, y - 8, w + 12, 24, col);
  glowText(`${B.name} · FASE ${b.phase}${b.shielded ? " · ESCUDO" : ""}`, RW / 2, y, 7, col, "center", 6);
  ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(x, y + 4, w, 6);
  ctx.fillStyle = b.shielded ? "#6fb4ff" : col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillRect(x, y + 4, w * b.hp / b.maxHp, 6); ctx.shadowBlur = 0;
}
function drawMessages() {
  glowText(S.L.name, 8, 13, 7, "#3fc1ff", "left", 4);
  ctx.font = "bold 9px monospace";
  S.messages.forEach((m, i) => {
    const y = 20 + i * 14, w = ctx.measureText(m.t).width + 14;
    ctx.globalAlpha = Math.min(1, m.life);
    ctx.fillStyle = "rgba(4,6,16,.75)"; ctx.fillRect(6, y, w, 12); ctx.fillStyle = m.col; ctx.fillRect(6, y, 2, 12); ctx.fillText(m.t, 12, y + 9);
    ctx.globalAlpha = 1;
  });
  if (S.introT > 0) {
    const a = Math.min(1, S.introT), slide = (1 - Math.min(1, (3.5 - S.introT) * 3)) * 60, y = VH * .3;
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, 0, RW, 0); g.addColorStop(0, "rgba(255,46,136,0)"); g.addColorStop(.5, "rgba(10,6,30,.88)"); g.addColorStop(1, "rgba(63,193,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, y - 28, RW, 50);
    ctx.fillStyle = "#ff2e88"; ctx.fillRect(RW / 2 - 130 - slide, y - 28, 260, 1); ctx.fillStyle = "#3fc1ff"; ctx.fillRect(RW / 2 - 130 + slide, y + 21, 260, 1);
    glowText(`— ${S.L.chapter} · SECTOR ${S.sector} —`, RW / 2, y - 14, 8, "#ff2e88", "center", 6);
    glowText(S.L.name.split("·").slice(1).join("·").trim(), RW / 2 + slide * .3, y + 4, 15, "#ffffff", "center", 12);
    glowText(S.L.brief, RW / 2, y + 16, 7, "#c3cbe6", "center", 0);
    ctx.globalAlpha = 1;
  }
}
function drawFace(x, y, s) {
  const p = player, t = S.stats.time, mh = maxHealth();
  ctx.fillStyle = "#060912"; ctx.fillRect(x, y, s, s); ctx.strokeStyle = "rgba(63,193,255,.6)"; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, s - 1, s - 1);
  const hx = x + 5, hy = y + 9, hw = s - 10, hh = s - 13;
  ctx.fillStyle = "#9aa6c8"; ctx.fillRect(x + s / 2 - 1, y + 4, 2, 5);
  ctx.fillStyle = p.health <= 0 ? "#555" : p.regen && Math.sin(t * 8) > 0 ? "#39ff88" : "#ff5d8f"; ctx.fillRect(x + s / 2 - 2, y + 2, 4, 3);
  ctx.fillStyle = p.hurtT > 0 ? "#ff7a5a" : S.SK.body; ctx.fillRect(hx, hy, hw, hh);
  ctx.fillStyle = S.SK.dark; ctx.fillRect(hx, hy + hh - 3, hw, 3);
  ctx.fillStyle = S.SK.visor; ctx.fillRect(hx + 3, hy + 4, hw - 6, 11);
  const col = p.health > mh * .6 ? "#39ff88" : p.health > mh * .3 ? "#ffd60a" : "#ff3b3b";
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 4;
  if (p.health <= 0) glowText("x  x", x + s / 2, hy + 13, 9, "#ff3b3b", "center", 4);
  else if (p.hurtT > 0) { ctx.fillRect(hx + 6, hy + 9, 6, 2); ctx.fillRect(hx + hw - 12, hy + 9, 6, 2); }
  else { const o = p.faceLook * 2; ctx.fillRect(hx + 7 + o, hy + 6, 4, 7); ctx.fillRect(hx + hw - 11 + o, hy + 6, 4, 7); }
  ctx.shadowBlur = 0;
  if (p.health < mh * .4) { ctx.strokeStyle = "#3a2600"; ctx.beginPath(); ctx.moveTo(hx + 2, hy + 1); ctx.lineTo(hx + 7, hy + 6); ctx.lineTo(hx + 4, hy + 10); ctx.stroke(); }
  if (p.health > 0 && p.health < mh * .3 && Math.random() < .3) { ctx.fillStyle = "rgba(255,46,136,.5)"; ctx.fillRect(x, y + Math.random() * s, s, 2); }
}
function drawHUD() {
  const p = player, w = curWeapon(), t = S.stats.time, mh = maxHealth();
  const lx = 6, ly = RH - 52, hcol = p.health > mh * .6 ? "#39ff88" : p.health > mh * .3 ? "#ffd60a" : "#ff2e55";
  panel(lx, ly, 178, 46, p.regen ? "#39ff88" : p.health > mh * .3 ? "#3fc1ff" : "#ff2e55");
  drawFace(lx + 5, ly + 4, 38);
  glowText(String(Math.ceil(p.health)), lx + 66, ly + 23, 18, hcol, "center", 8);
  glowText("INTEGRIDAD", lx + 88, ly + 12, 7, "#9aa6c8", "left", 0);
  if (p.regen) glowText("▲ REGEN", lx + 138, ly + 12, 7, "#39ff88", "left", 4 + 4 * Math.sin(t * 8));
  segBar(lx + 88, ly + 15, 84, 7, p.health / mh, hcol, 14, p.regen);
  glowText(String(Math.ceil(p.armor)), lx + 66, ly + 40, 10, "#6f9fff", "center", 5);
  glowText("BLINDAJE", lx + 88, ly + 31, 7, "#9aa6c8", "left", 0);
  segBar(lx + 88, ly + 34, 84, 5, p.armor / 100, "#6f9fff", 14, false);

  // El panel deja libre el centro (x 184–290) para que no tape la mano ni el arma
  const rx = RW - 190, ry = RH - 52;
  panel(rx, ry, 184, 46, "#ffb703");
  glowText(w.name, rx + 8, ry + 12, 7, "#ffb703", "left", 4);
  if (w.ammo) {
    const mag = p.mag[w.id] || 0, ms = magSize(w), res = p.ammo[w.ammo], low = mag <= Math.ceil(ms * .25);
    glowText(String(mag).padStart(2, "0"), rx + 8, ry + 36, 20, mag === 0 ? "#ff2e55" : low ? "#ffd60a" : "#ffffff", "left", 8);
    glowText("/" + res, rx + 36, ry + 36, 9, "#9aa6c8", "left", 0);
    if (ms <= 12) for (let i = 0; i < ms; i++) { ctx.fillStyle = i < mag ? "#ffb703" : "rgba(255,183,3,.15)"; ctx.fillRect(rx + 8 + i * 6, ry + 40, 4, 3); }
    else { ctx.fillStyle = "rgba(63,193,255,.15)"; ctx.fillRect(rx + 8, ry + 40, 70, 3); ctx.fillStyle = "#3fc1ff"; ctx.fillRect(rx + 8, ry + 40, 70 * mag / ms, 3); }
    if (p.reloadT <= 0 && low && canReload(w) && Math.sin(t * 8) > 0) glowText("[R] RECARGAR", rx + 80, ry + 22, 7, "#ffd60a", "left", 5);
    else if (mag === 0 && !canReload(w)) glowText("SIN MUNICIÓN", rx + 80, ry + 22, 7, "#ff2e55", "left", 5);
  } else { glowText("∞", rx + 8, ry + 34, 18, "#ffffff", "left", 8); glowText("CUERPO A CUERPO", rx + 8, ry + 43, 6, "#9aa6c8", "left", 0); }
  for (let i = 0; i < MAX_SLOTS; i++) {
    const id = p.slots[i], bx = rx + 80 + i * 24, by = ry + 26, cur = id && id === p.weapon;
    ctx.fillStyle = cur ? "rgba(255,183,3,.22)" : "rgba(255,255,255,.04)"; ctx.fillRect(bx, by, 22, 15);
    ctx.strokeStyle = cur ? "#ffb703" : id ? (S.profile.shopW.includes(id) ? "#ff2e88" : "rgba(232,236,248,.45)") : "rgba(255,255,255,.1)";
    if (cur) { ctx.shadowColor = "#ffb703"; ctx.shadowBlur = 6; }
    ctx.strokeRect(bx + .5, by + .5, 21, 14); ctx.shadowBlur = 0;
    if (id) ctx.drawImage(modelCanvas(id), bx + 1, by + 4, 20, 7.5);
    glowText(String(i + 1), bx + 2, by + 6, 6, cur ? "#ffb703" : "#9aa6c8", "left", 0);
  }
  for (const [k, col, xx] of [["r", "#ff3b3b", rx + 156], ["u", "#3f7fff", rx + 170]]) {
    ctx.fillStyle = p.keys[k] ? col : "rgba(255,255,255,.06)"; if (p.keys[k]) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
    ctx.fillRect(xx, ry - 18, 10, 14); ctx.shadowBlur = 0;
    if (p.keys[k]) { ctx.fillStyle = "#fff"; ctx.fillRect(xx + 2, ry - 16, 4, 2); }
  }
  if (p.swapOffer) {
    const nw = WD[PICKUP_ID[p.swapOffer.kind]], old = WD[p.slots[p.slot]];
    panel(RW / 2 - 120, VH / 2 + 34, 240, 34, "#ffb703");
    ctx.drawImage(modelCanvas(nw.id), RW / 2 - 114, VH / 2 + 42, 52, 19.5);
    glowText(`[E] CAMBIAR ${old ? old.name : "ARMA"}`, RW / 2 - 56, VH / 2 + 48, 7, "#ffb703", "left", 4);
    glowText(`POR ${nw.name}`, RW / 2 - 56, VH / 2 + 60, 7, "#ffffff", "left", 4);
  }
}

export { drawAutomap, drawRadar, drawBossBar, drawMessages, drawFace, drawHUD };
