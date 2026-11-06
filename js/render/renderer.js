// Render 3D del mundo, sprites, efectos de pantalla y retícula.
import { S } from "../core/store.js";
import { RH, RW, TS, VH, clamp, ctx, rr } from "../core/config.js";
import { maxHealth, skinCols } from "../core/profile.js";
import { FX_BLINK, FX_BOOM, FX_SPARK, FX_VOID, ITEM_SPR, PROJ_SPR } from "../gfx/sprites.js";
import { EDEF } from "../data/enemies.js";
import { PICKUP_ID } from "../data/weapons.js";
import { player, zbuf } from "../game/world.js";
import { cast } from "../engine/raycast.js";
import { drawWeapon } from "./weapon-view.js";
import { drawAutomap, drawBossBar, drawHUD, drawMessages, drawRadar } from "./hud.js";

function glowText(t, x, y, size, col, align = "left", glowR = 6) {
  ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.shadowColor = col; ctx.shadowBlur = glowR; ctx.fillStyle = col;
  ctx.fillText(t, x, y); ctx.shadowBlur = 0; ctx.textAlign = "left";
}
function panel(x, y, w, h, col) {
  const c = 8;
  ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + c); ctx.closePath();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(12,18,40,.8)"); g.addColorStop(1, "rgba(4,6,16,.9)");
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = col; ctx.fillRect(x + c + 3, y - 1, 22, 2);
}
function segBar(x, y, w, h, frac, col, segs, pulse) {
  const sw = w / segs;
  for (let i = 0; i < segs; i++) {
    const on = i / segs < frac - 1e-6;
    ctx.fillStyle = on ? col : "rgba(255,255,255,.08)";
    if (on) { ctx.shadowColor = col; ctx.shadowBlur = pulse ? 5 + 4 * Math.sin(S.stats.time * 8) : 4; }
    ctx.fillRect(x + i * sw, y, sw - 1.5, h); ctx.shadowBlur = 0;
  }
}
function hexIcon(x, y, r, col) {
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.fill(); ctx.shadowBlur = 0;
}
function project(wx, wy, z) {
  const c = S.CAM, dx = wx - player.x, dy = wy - player.y;
  const tx = c.inv * (c.dy * dx - c.dx * dy), ty = c.inv * (-c.ply * dx + c.plx * dy);
  if (ty < .1) return null;
  return [(RW / 2) * (1 + tx / ty), VH / 2 + (.5 - z) * VH / ty, ty];
}
function render(hud = true) {
  const p = player, dirX = Math.cos(p.a), dirY = Math.sin(p.a), plX = -dirY * .66, plY = dirX * .66;
  S.CAM = { dx: dirX, dy: dirY, plx: plX, ply: plY, inv: 1 / (plX * dirY - dirX * plY) };
  S.SK = skinCols(S.stats.time);
  ctx.save();
  if (hud && p.shake > 0) ctx.translate(rr(-1, 1) * p.shake * 6, rr(-1, 1) * p.shake * 6);
  ctx.fillStyle = S.ceilGrad; ctx.fillRect(-8, -8, RW + 16, VH / 2 + 8);
  ctx.fillStyle = S.floorGrad; ctx.fillRect(-8, VH / 2, RW + 16, VH / 2 + 8);
  if (S.L.sky) { // cielo estrellado con paralaje según la orientación
    for (let i = 0; i < 90; i++) {
      const sx = (((i * 97.3 - p.a * 260) % (RW * 2)) + RW * 2) % (RW * 2) - RW * .5, sy = (i * 53.7) % (VH * .45);
      ctx.fillStyle = `rgba(255,255,255,${(.3 + .5 * Math.abs(Math.sin(S.stats.time * 1.3 + i))).toFixed(2)})`; ctx.fillRect(sx, sy, i % 7 ? 1 : 2, i % 7 ? 1 : 2);
    }
  }
  for (let x = 0; x < RW; x++) {
    const cam = 2 * x / RW - 1, h = cast(p.x, p.y, dirX + plX * cam, dirY + plY * cam, true), dist = Math.max(.05, h.dist);
    zbuf[x] = dist;
    const lh = VH / dist, top = VH / 2 - lh / 2;
    ctx.drawImage(h.tex, h.texX, 0, 1, TS, x, top, 1, lh);
    const a = Math.min(.9, dist / S.L.fog + (h.side ? .18 : 0));
    if (a > .02) { ctx.fillStyle = `rgba(${S.L.fogCol},${a.toFixed(2)})`; ctx.fillRect(x, top, 1, lh); }
  }
  // Sprites
  const sprites = [];
  for (const e of S.enemies) {
    const d = EDEF[e.type], set = e.elite ? d.spr.elite : d.spr.normal;
    let pose;
    if (e.dead) pose = "dead";
    else if (e.state === "pain") pose = "pain";
    else if (d.boss) pose = e.atkFlash > 0 ? "atk" : Math.floor(e.anim * 3) % 2 ? "walk1" : "walk0";
    else if (e.state === "attack") pose = e.t < d.atkTime * .6 ? "atk" : "walk0";
    else pose = Math.floor(e.anim * 5) % 2 ? "walk1" : "walk0";
    const bobZ = e.type === "glitch" ? Math.sin(e.anim * 6) * .03 : e.type === "drone" ? Math.sin(S.stats.time * 5 + e.x) * .04 : 0;
    const ghost = !e.dead && ((d.boss && d.bdef.ghost) || d.decoy) ? .55 + .2 * Math.sin(S.stats.time * 6 + e.x) : null;
    sprites.push({ x: e.x, y: e.y, imgs: set[pose], scale: e.dead ? (d.boss ? 1.6 : 1) : d.scale, zoff: e.dead ? 0 : d.zoff + bobZ, alpha: e.dead ? 1 : ghost ?? e.alpha });
    if (d.boss && e.shielded && !e.dead) { const dx = player.x - e.x, dy = player.y - e.y, dl = Math.hypot(dx, dy) || 1; sprites.push({ x: e.x + dx / dl * .08, y: e.y + dy / dl * .08, img: PROJ_SPR.plasma, scale: d.scale * 1.1, zoff: -.05, alpha: .35 + .1 * Math.sin(S.stats.time * 8) }); }
  }
  for (const it of S.items) {
    const isBit = it.kind === "bit", key = it.kind === "r" || it.kind === "u" || !!PICKUP_ID[it.kind];
    sprites.push({ x: it.x, y: it.y, imgs: ITEM_SPR[it.kind], scale: isBit ? .7 : 1, zoff: key ? .05 + Math.sin(S.stats.time * 4) * .03 : isBit ? .05 + Math.abs(Math.sin(S.stats.time * 5 + it.x * 3)) * .06 : 0 });
  }
  for (const d of S.decor) sprites.push({ x: d.x, y: d.y, imgs: ITEM_SPR[d.kind], scale: 1, zoff: 0 });
  for (const pr of S.projectiles) {
    if (pr.kind === "mine") { sprites.push({ x: pr.x, y: pr.y, img: PROJ_SPR.mine, scale: .3 + (pr.arm <= 0 && Math.sin(S.stats.time * 12) > 0 ? .08 : 0), zoff: 0 }); continue; }
    sprites.push({ x: pr.x, y: pr.y, img: PROJ_SPR[pr.kind], scale: pr.kind === "void" ? .45 : pr.kind === "fire" ? .45 : pr.kind === "rocket" || pr.kind === "prock" ? .3 : pr.kind === "laser" ? .16 : .22, zoff: pr.kind === "fire" ? .25 : .4 });
  }
  for (const v of S.voids) { const sc = .6 + v.t / v.life * 1.4; sprites.push({ x: v.x, y: v.y, img: FX_VOID, scale: sc, zoff: .5 - sc / 2 }); }
  for (const fx of S.effects) {
    if (fx.kind === "spark") sprites.push({ x: fx.x, y: fx.y, img: FX_SPARK, scale: .2, zoff: fx.z ?? .4 });
    else if (fx.kind === "blink") sprites.push({ x: fx.x, y: fx.y, img: FX_BLINK, scale: .5 * (1 - fx.t / fx.life) + .1, zoff: fx.z });
    else sprites.push({ x: fx.x, y: fx.y, img: FX_BOOM[Math.min(2, Math.floor(fx.t / fx.life * 3))], scale: 1.1, zoff: -.05 });
  }
  for (const s of sprites) { const dx = s.x - p.x, dy = s.y - p.y; s.tx = S.CAM.inv * (dirY * dx - dirX * dy); s.ty = S.CAM.inv * (-plY * dx + plX * dy); }
  sprites.sort((a, b) => b.ty - a.ty);
  for (const s of sprites) {
    if (s.ty <= .15) continue;
    const img = s.img || s.imgs[s.ty < 4 ? 0 : s.ty < 8 ? 1 : 2];
    const sx = (RW / 2) * (1 + s.tx / s.ty), wallH = VH / s.ty, h = wallH * s.scale, w = h * img.width / img.height;
    const top = VH / 2 + wallH / 2 - h - s.zoff * wallH, left = sx - w / 2;
    const x0 = Math.max(0, Math.floor(left)), x1 = Math.min(RW - 1, Math.floor(left + w));
    if (s.alpha !== undefined && s.alpha < 1) ctx.globalAlpha = s.alpha;
    for (let x = x0; x <= x1; x++) {
      if (s.ty >= zbuf[x]) continue;
      const tx = Math.floor((x - left) / w * img.width);
      if (tx >= 0 && tx < img.width) ctx.drawImage(img, tx, 0, 1, img.height, x, top, 1, h);
    }
    ctx.globalAlpha = 1;
  }
  if (hud) { drawSniperLasers(); drawBolts(); drawPopups(); drawWeapon(); }
  ctx.restore();
  if (!hud) { ctx.fillStyle = "rgba(3,4,10,.25)"; ctx.fillRect(0, 0, RW, RH); return; }
  drawCrosshair(); drawScreenFX();
  if (S.showMap) drawAutomap();
  drawHUD(); drawRadar(); drawBossBar(); drawMessages();
}
function drawSniperLasers() {
  for (const e of S.enemies) {
    if (e.dead || e.type !== "sniper" || e.state !== "attack" || e.fired) continue;
    const a = project(e.x, e.y, .62); if (!a || a[2] >= zbuf[clamp(Math.floor(a[0]), 0, RW - 1)] + .5) continue;
    const prog = 1 - e.t / EDEF.sniper.atkTime;
    ctx.strokeStyle = `rgba(255,46,85,${(.2 + prog * .7).toFixed(2)})`; ctx.lineWidth = 1 + prog * 1.5; ctx.shadowColor = "#ff2e55"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(RW / 2 + rr(-6, 6) * (1 - prog), VH / 2 + 30 + rr(-6, 6) * (1 - prog)); ctx.stroke(); ctx.shadowBlur = 0;
  }
}
function drawBolts() {
  for (const b of S.bolts) {
    const pts = b.pts.map(pt => pt === null ? S.muzzleXY : project(pt[0], pt[1], pt[2]));
    if (pts.some(q => !q)) continue;
    const a = 1 - b.t / b.life;
    ctx.strokeStyle = b.col; ctx.globalAlpha = a; ctx.lineWidth = b.w; ctx.shadowColor = b.col; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      if (b.straight) { ctx.lineTo(x1, y1); continue; }
      const segs = 6, nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
      for (let k = 1; k <= segs; k++) { const t = k / segs, j = k === segs ? 0 : rr(-7, 7); ctx.lineTo(x0 + (x1 - x0) * t + nx / nl * j, y0 + (y1 - y0) * t + ny / nl * j); }
    }
    ctx.stroke();
    if (b.straight && b.w > 3) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
}
function drawPopups() {
  for (const q of S.popups) {
    const s = project(q.x + q.ox, q.y, q.z + q.t * .7); if (!s) continue;
    const col = clamp(Math.floor(s[0]), 0, RW - 1); if (s[2] > zbuf[col] + .3) continue;
    ctx.globalAlpha = 1 - q.t / .8;
    glowText(q.text, s[0], s[1], clamp(Math.round(22 / s[2]) + 6, 7, 14), q.col, "center", 4);
    ctx.globalAlpha = 1;
  }
}
function drawScreenFX() {
  const p = player, t = S.stats.time, mh = maxHealth();
  if (S.hurtFlash > 0) { ctx.fillStyle = `rgba(255,0,30,${(S.hurtFlash * .8).toFixed(2)})`; ctx.fillRect(0, 0, RW, RH); }
  if (S.pickFlash > 0) { ctx.fillStyle = `rgba(255,214,102,${(S.pickFlash * .5).toFixed(2)})`; ctx.fillRect(0, 0, RW, RH); }
  const low = p.health < mh * .35;
  if (p.health > 0 && (low || p.regen)) {
    const pulse = .5 + .5 * Math.sin(t * (p.regen ? 4 : 7)), col = p.regen ? "57,255,136" : "255,0,40";
    const a = p.regen ? .1 + .1 * pulse : (.2 + .25 * pulse) * (1 - p.health / (mh * .35)) + .12;
    const g = ctx.createRadialGradient(RW / 2, VH / 2, VH * .32, RW / 2, VH / 2, VH * .85);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a.toFixed(2)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, RW, RH);
  }
  for (const h of p.hurtDirs) {
    const ang = h.a - p.a - Math.PI / 2;
    ctx.strokeStyle = `rgba(255,40,70,${Math.min(1, h.t).toFixed(2)})`; ctx.lineWidth = 5; ctx.shadowColor = "#ff2e55"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(RW / 2, VH / 2, 64, ang - .35, ang + .35); ctx.stroke(); ctx.shadowBlur = 0;
  }
  if (S.state === "dead") { ctx.fillStyle = "rgba(120,0,20,.45)"; ctx.fillRect(0, 0, RW, RH); }
}
function drawCrosshair() {
  const p = player, cx = RW / 2, cy = VH / 2, gap = 3 + p.fireAnim * 7 + (p.moving ? 2 : 0), col = S.SK.cross;
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 4;
  ctx.fillRect(cx - 1, cy - gap - 5, 2, 5); ctx.fillRect(cx - 1, cy + gap, 2, 5); ctx.fillRect(cx - gap - 5, cy - 1, 5, 2); ctx.fillRect(cx + gap, cy - 1, 5, 2);
  ctx.fillRect(cx - .5, cy - .5, 1, 1); ctx.shadowBlur = 0;
  if (p.hitT > 0 || p.killT > 0) {
    const k = p.killT > 0; ctx.strokeStyle = k ? "#ff2e55" : "#ffffff"; ctx.lineWidth = k ? 2 : 1.5;
    const r1 = 5, r2 = k ? 13 : 9;
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { ctx.beginPath(); ctx.moveTo(cx + sx * r1, cy + sy * r1); ctx.lineTo(cx + sx * r2, cy + sy * r2); ctx.stroke(); }
  }
  if (p.reloadT > 0) {
    const prog = 1 - p.reloadT / p.reloadDur;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#ffb703"; ctx.shadowColor = "#ffb703"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(cx, cy, 17, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    glowText("RECARGANDO", cx, cy + 32, 8, "#ffb703", "center", 6);
  }
}

export { glowText, panel, segBar, hexIcon, project, render, drawSniperLasers, drawBolts, drawPopups, drawScreenFX, drawCrosshair };
