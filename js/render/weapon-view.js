// Arma en primera persona, animaciones de recarga e inspección.
import { S } from "../core/store.js";
import { RW, VH, clamp, ctx, rr } from "../core/config.js";
import { circ } from "../gfx/sprites.js";
import { INSPECT_T, WSKINS, drawModel, part, wpal } from "../data/weapons.js";
import { player } from "../game/world.js";
import { curWeapon } from "../game/player.js";
import { glowText } from "./renderer.js";

// ---------- Armas en primera persona ----------
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
function robotHand(x, y, w = 34) {
  ctx.fillStyle = S.SK.body; ctx.fillRect(x, y, w, 26);
  ctx.fillStyle = S.SK.dark; ctx.fillRect(x, y + 8, w, 2); ctx.fillRect(x, y + 16, w, 2);
  ctx.fillStyle = "#2b2d42"; ctx.fillRect(x + 4, y + 22, w - 8, 4);
}
function muzzle(x, y, r, inner) { const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, "#fff"); g.addColorStop(.4, inner); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
// Animación genérica de cargador: sale (0.15–0.45) y entra (0.5–0.8)
function magAnim(rl) {
  if (rl < 0) return { off: 0, show: true, hand: false };
  if (rl < .45) return { off: ease((rl - .15) / .3), show: true, hand: false };
  if (rl < .5) return { off: 1, show: false, hand: false };
  return { off: 1 - ease((rl - .5) / .3), show: true, hand: true };
}
const MUZZLE = { wrench: [0, -60], pistol: [0, -86], shotgun: [0, -98], smg: [0, -100], plasma: [0, -96], rocket: [0, -112], rail: [0, -124], tesla: [0, -96], void: [0, -88] };
function drawWeapon() {
  const p = player, w = curWeapon(), t = S.stats.time, P = wpal(w.id, t);
  const bx = p.moving ? Math.cos(p.bob) * 7 : 0, by = p.moving ? Math.abs(Math.sin(p.bob)) * 6 : 0;
  if (p.inspectT > 0) { drawInspect(w, P, t, bx, by); return; }
  const rl = p.reloadT > 0 ? 1 - p.reloadT / p.reloadDur : -1, dip = rl >= 0 ? Math.sin(ease(rl) * Math.PI) : 0;
  const flash = p.fireAnim > .65 && !w.melee;
  const ox = RW / 2 + bx - dip * 14, oy = VH + by + p.fireAnim * 10 + p.raise * 90 + dip * 30, rot = -dip * .5;
  const [mx, my] = MUZZLE[w.id];
  S.muzzleXY = [ox + Math.cos(rot) * mx - Math.sin(rot) * my, oy + Math.sin(rot) * mx + Math.cos(rot) * my];
  ctx.save(); ctx.translate(ox, oy); ctx.rotate(rot);
  const m = magAnim(rl), mo = m.off * 80;
  const pp = (x, y, ww, hh, c) => part(ctx, x, y, ww, hh, c, P);
  const glowA = (a, fn) => { ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = P.glow; ctx.strokeStyle = P.glow; ctx.shadowColor = P.glow; ctx.shadowBlur = 8; fn(); ctx.shadowBlur = 0; ctx.globalAlpha = 1; };
  switch (w.id) {
    case "wrench":
      ctx.save(); ctx.translate(36, -10); ctx.rotate(-.45 - p.fireAnim * .9);
      pp(-6, -110, 12, 100, P.body); pp(-4, -108, 3, 96, P.accent); pp(-18, -132, 36, 24, P.dark); ctx.fillStyle = "#2b2d42"; ctx.fillRect(-6, -132, 12, 14);
      ctx.restore(); robotHand(14, -28); break;
    case "pistol": {
      if (flash) muzzle(0, -86, 26, P.glow);
      if (m.show) { pp(-9, -40 + mo, 18, 42, P.dark); glowA(1, () => ctx.fillRect(-6, -36 + mo, 12, 4)); ctx.fillStyle = S.SK.body; ctx.fillRect(-9, mo, 18, 4); }
      pp(-13, -80, 26, 50, P.body); pp(-9, -84, 18, 8, P.dark);
      glowA(p.mag.pistol > 0 && rl < 0 ? 1 : .2, () => ctx.fillRect(-3, -74, 6, 34));
      const slide = rl > .82 ? Math.sin((rl - .82) / .18 * Math.PI) * 8 : 0;
      pp(-13, -50, 26, 4, P.accent); pp(-13, -80 + slide, 26, 6, P.accent);
      robotHand(-17, -28); if (m.hand) robotHand(-30, 4 + mo, 30); break;
    }
    case "smg": {
      if (flash) muzzle(0, -100, 24, P.glow);
      if (m.show) { pp(-7, -44 + mo, 14, 56, P.dark); pp(-7, -40 + mo, 14, 3, P.accent); }
      pp(-16, -80, 32, 44, P.body); pp(-5, -100, 10, 22, P.dark); pp(-16, -66, 32, 3, P.accent); pp(-12, -76, 24, 6, P.dark);
      const slide = rl > .82 ? Math.sin((rl - .82) / .18 * Math.PI) * 6 : p.fireAnim * 3;
      ctx.fillStyle = "#596275"; ctx.fillRect(10, -74 + slide, 8, 4);
      robotHand(-17, -30); if (m.hand) robotHand(-30, 8 + mo, 30); else robotHand(-44, -58, 28); break;
    }
    case "shotgun": {
      if (flash) muzzle(0, -98, 40, P.glow);
      pp(-24, -94, 20, 80, P.body); pp(4, -94, 20, 80, P.body);
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.ellipse(-14, -94, 7, 4, 0, 0, 7); ctx.ellipse(14, -94, 7, 4, 0, 0, 7); ctx.fill();
      pp(-24, -70, 48, 4, P.dark); ctx.fillStyle = "#0d0f14"; ctx.fillRect(-10, -36, 20, 8);
      const pump = rl > .82 ? Math.sin((rl - .82) / .18 * Math.PI) * 14 : p.fireAnim * 8;
      pp(-30, -54 + pump, 60, 16, P.accent); for (let i = 0; i < 5; i++) pp(-26 + i * 12, -50 + pump, 6, 8, P.dark);
      robotHand(8, -26);
      if (rl >= .12 && rl < .78) {
        const c = ((rl - .12) / .66 * 4) % 1, sy = -32 + (1 - ease(c * 1.6)) * 46;
        ctx.fillStyle = "#d62828"; ctx.fillRect(-5, sy, 10, 16); ctx.fillStyle = "#ffd166"; ctx.fillRect(-5, sy + 12, 10, 4); robotHand(-17, sy + 14, 34);
      } else robotHand(-40, -30 + pump);
      break;
    }
    case "rocket": {
      if (flash) muzzle(0, -112, 46, P.glow);
      pp(-28, -108, 56, 100, P.body); pp(-28, -60, 56, 6, P.dark);
      ctx.fillStyle = "#15171d"; ctx.beginPath(); ctx.ellipse(0, -108, 28, 9, 0, 0, Math.PI * 2); ctx.fill();
      pp(22, -90, 14, 22, P.dark); glowA(1, () => ctx.fillRect(26, -86, 6, 4));
      if (p.mag.rocket > 0 && rl < 0) { ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(-10, -106); ctx.lineTo(0, -118 + p.fireAnim * 12); ctx.lineTo(10, -106); ctx.fill(); }
      if (rl >= .2 && rl < .8) {
        const k = ease((rl - .2) / .6), ry = -10 - k * 96;
        ctx.fillStyle = "#6b7a4a"; ctx.fillRect(-9, ry, 18, 40); ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(-9, ry); ctx.lineTo(0, ry - 14); ctx.lineTo(9, ry); ctx.fill();
        robotHand(-20, ry + 30, 40);
      } else robotHand(-46, -40);
      robotHand(14, -26); break;
    }
    default: { // armas de energía: plasma, riel, tesla, vacío
      const charged = rl < 0 ? 1 : rl > .8 ? (rl - .8) / .2 * (Math.random() < .5 ? 1 : .4) : .12, pulse = .5 + .5 * Math.sin(t * 10);
      const ca = a => (.6 + .4 * pulse) * charged * a;
      if (w.id === "plasma") {
        if (flash) muzzle(0, -96, 30, P.glow);
        pp(-30, -84, 60, 84, P.body); pp(-12, -96, 24, 14, P.dark);
        glowA(ca(1), () => { for (let i = 0; i < 3; i++) ctx.fillRect(-22 + i * 17, -70, 10, 26); });
        pp(-30, -38, 60, 6, P.accent);
      } else if (w.id === "rail") {
        const cdk = clamp(1 - p.cooldown / w.rate, 0, 1);
        pp(-20, -124, 8, 110, P.body); pp(12, -124, 8, 110, P.body); pp(-26, -50, 52, 50, P.dark);
        glowA(ca(cdk), () => ctx.fillRect(-3, -122, 6, 100));
        for (let i = 0; i < 5; i++) pp(-22, -116 + i * 18, 44, 4, P.accent);
        if (flash) muzzle(0, -124, 34, P.glow);
      } else if (w.id === "tesla") {
        pp(-28, -72, 56, 72, P.body); for (let i = 0; i < 6; i++) pp(-28, -68 + i * 9, 56, 3, P.accent);
        for (const x of [-16, 0, 16]) { pp(x - 3, -88, 6, 16, P.dark); glowA(ca(1), () => circ(ctx, x, -92, 6)); }
        if (flash || Math.random() < .08 * charged) glowA(1, () => { ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-16, -92); ctx.lineTo(-8, -98 + rr(-4, 4)); ctx.lineTo(0, -92); ctx.lineTo(8, -98 + rr(-4, 4)); ctx.lineTo(16, -92); ctx.stroke(); });
      } else {
        pp(-32, -76, 64, 76, P.body); pp(-20, -90, 40, 16, P.dark);
        glowA(ca(1), () => circ(ctx, 0, -66, 18)); ctx.fillStyle = "#000"; circ(ctx, 0, -66, 9);
        glowA(ca(.8), () => { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -66, 14, t * 4, t * 4 + 4); ctx.stroke(); });
        if (flash) muzzle(0, -88, 36, P.glow);
      }
      // Célula de energía lateral: sale y entra durante la recarga
      if (m.show) {
        ctx.globalAlpha = rl >= 0 && rl < .45 ? 1 - m.off * .7 : 1;
        ctx.fillStyle = P.dark; ctx.fillRect(-46 - m.off * 70, -64 + m.off * 60, 14, 30); ctx.globalAlpha = 1;
        glowA(rl >= 0 && rl < .45 ? 1 - m.off * .7 : 1, () => ctx.fillRect(-43 - m.off * 70, -60 + m.off * 60, 8, 22));
      }
      robotHand(10, -24);
      if (m.hand) robotHand(-66 - m.off * 70, -40 + m.off * 60, 30); else robotHand(-46, -26);
    }
  }
  ctx.restore();
}
// Inspeccionar el arma: Byte la levanta y la gira para ver el modelo y su skin
function drawInspect(w, P, t, bx, by) {
  const p = player, k = p.inspectT / INSPECT_T, e2 = Math.min(1, (1 - k) * 5, k * 5), ph = (1 - k) * Math.PI * 2;
  const cx = RW / 2 + bx, cy = VH - 112 + by + (1 - e2) * 150;  // por encima de los paneles
  S.muzzleXY = [cx, cy];
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.28 + Math.sin(ph) * .16);
  ctx.scale(2.2, 2.2 * (.78 + .22 * Math.cos(ph)));
  ctx.translate(-64, -24); drawModel(ctx, w.id, P); ctx.restore();
  robotHand(cx - 46, cy + 10, 40);
  ctx.globalAlpha = e2;
  glowText(w.name, RW / 2, VH / 2 + 36, 10, "#ffb703", "center", 8);
  glowText(`SKIN · ${(WSKINS.find(s => s.id === P.sid) || WSKINS[0]).name}`, RW / 2, VH / 2 + 48, 7, P.glow, "center", 6);
  ctx.globalAlpha = 1;
}

export { ease, robotHand, muzzle, magAnim, MUZZLE, drawWeapon, drawInspect };
