// Arma en primera persona, animaciones de recarga e inspección.
// Perspectiva 3/4 a la derecha estilo Duke Nukem / Half-Life con siluetas mecánicas detalladas.
import { S } from "../core/store.js";
import { RW, VH, clamp, ctx, rr } from "../core/config.js";
import { circ } from "../gfx/sprites.js";
import { INSPECT_T, WSKINS, drawModel, part, wpal } from "../data/weapons.js";
import { player } from "../game/world.js";
import { curWeapon } from "../game/player.js";
import { glowText } from "./renderer.js";

// ---------- Utilidades de animación y dibujo 3D ----------
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

// Dibuja un polígono coloreado
function poly(pts, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

// Dibuja una cara poligonal aplicando la skin activa si es la pieza principal
function pPoly(pts, col, pal) {
  poly(pts, col);
  if (!pal || !pal.pat || col !== pal.body) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();
  let minX = pts[0][0], maxX = pts[0][0], minY = pts[0][1], maxY = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][0] < minX) minX = pts[i][0];
    if (pts[i][0] > maxX) maxX = pts[i][0];
    if (pts[i][1] < minY) minY = pts[i][1];
    if (pts[i][1] > maxY) maxY = pts[i][1];
  }
  const w = maxX - minX, h = maxY - minY;
  if (pal.pat === "camo") {
    ctx.globalAlpha = .55;
    for (let i = 0; i < Math.max(4, w * h / 28); i++) {
      ctx.fillStyle = i % 2 ? pal.dark : pal.accent;
      ctx.fillRect(minX + Math.floor(((i * 37) % Math.max(1, w)) / 4) * 4, minY + Math.floor(((i * 53) % Math.max(1, h)) / 4) * 4, 4, 4);
    }
  } else if (pal.pat === "stripes") {
    ctx.strokeStyle = pal.dark; ctx.globalAlpha = .55; ctx.lineWidth = 2;
    for (let k = -h; k < w; k += 5) { ctx.beginPath(); ctx.moveTo(minX + k, minY + h); ctx.lineTo(minX + k + h, minY); ctx.stroke(); }
  } else if (pal.pat === "lines") {
    ctx.fillStyle = pal.glow; ctx.globalAlpha = .85;
    ctx.fillRect(minX, minY + Math.floor(h * .3), w, 1);
    ctx.fillRect(minX, minY + Math.floor(h * .7), w, 1);
  } else if (pal.pat === "veins") {
    ctx.strokeStyle = pal.glow; ctx.globalAlpha = .9; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      let cx = minX + (k + .5) * w / 3, cy = minY;
      ctx.moveTo(cx, cy);
      while (cy < minY + h) { cx += ((Math.floor(cx) * 7 + Math.floor(cy) * 13) % 7) - 3; cy += 5; ctx.lineTo(cx, cy); }
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Bloque rectangular con volumen 3D: cara superior y bisel lateral en sombra
function box3D(x, y, w, h, depth, colTop, colSide, pal) {
  if (depth > 0) {
    pPoly([[x + w, y], [x + w + depth, y - depth * .5], [x + w + depth, y + h - depth * .5], [x + w, y + h]], colSide, pal);
    pPoly([[x, y], [x + depth, y - depth * .5], [x + w + depth, y - depth * .5], [x + w, y]], colTop, pal);
  }
  pPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], colTop, pal);
}

// Cañón trapezoidal cónico que se estrecha hacia la punta (perspectiva 3D auténtica)
function taperedBarrel(x1, y1, w1, x2, y2, w2, depth, colTop, colSide, pal) {
  if (depth > 0) {
    pPoly([[x1 + w1 / 2, y1], [x1 + w1 / 2 + depth, y1 - depth * .4], [x2 + w2 / 2 + depth, y2 - depth * .4], [x2 + w2 / 2, y2]], colSide, pal);
  }
  pPoly([[x1 - w1 / 2, y1], [x1 + w1 / 2, y1], [x2 + w2 / 2, y2], [x2 - w2 / 2, y2]], colTop, pal);
}

// Mira frontal (iron sight) con punto de tritio brillante
function ironSight(x, y, w, h, col, glowCol) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fill();
  if (glowCol) {
    ctx.save();
    ctx.shadowColor = glowCol; ctx.shadowBlur = 6;
    ctx.fillStyle = glowCol;
    ctx.fillRect(x - 1, y - h - 1, 2, 2.5);
    ctx.restore();
  }
}

// Ranuras de ventilación / refrigeración sobre la cubierta del cañón
function ventSlots(x, y, count, w, h, step, col) {
  ctx.fillStyle = col;
  for (let i = 0; i < count; i++) {
    ctx.fillRect(x, y + i * step, w, h);
  }
}

// Mano robótica de Byte con dedos articulados y nudillos metálicos
function robotHand(x, y, w = 30, isLeft = false, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  const bodyCol = S.SK.body || "#4361ee", darkCol = S.SK.dark || "#2b2d42";
  // Antebrazo / muñeca blindada
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.moveTo(0, 8); ctx.lineTo(w, 8); ctx.lineTo(w - 3, 28); ctx.lineTo(3, 28);
  ctx.closePath();
  ctx.fill();

  // Juntas de articulación y placas mecánicas
  ctx.fillStyle = darkCol;
  ctx.fillRect(2, 13, w - 4, 3);
  ctx.fillRect(4, 21, w - 8, 2);

  // Diodo de estado luminoso en la muñeca
  ctx.fillStyle = S.SK.visor || "#3fc1ff";
  ctx.fillRect(w / 2 - 3, 9, 6, 2);

  // Cuatro dedos articulados con nudillos
  const nFingers = 4, fW = (w - 4) / nFingers;
  for (let i = 0; i < nFingers; i++) {
    const fx = 2 + i * fW;
    ctx.fillStyle = bodyCol;
    ctx.fillRect(fx, 0, fW - 1, 9);
    ctx.fillStyle = darkCol;
    ctx.fillRect(fx, 3, fW - 1, 2);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(fx + 1, 0, fW - 3, 1.5);
    ctx.fillStyle = "#161922";
    ctx.fillRect(fx + 1, -3, fW - 2, 4);
  }
  // Pulgar opuesto
  ctx.fillStyle = darkCol;
  ctx.fillRect(isLeft ? w - 2 : -4, 2, 5, 8);
  ctx.fillStyle = bodyCol;
  ctx.fillRect(isLeft ? w - 3 : -3, 3, 4, 6);
  ctx.restore();
}

// Mano robótica de soporte secundario (guardamanos / corredera)
function robotSupportHand(x, y, w = 26, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  const bodyCol = S.SK.body || "#4361ee", darkCol = S.SK.dark || "#2b2d42";
  ctx.fillStyle = darkCol;
  ctx.fillRect(0, 4, w, 14);
  ctx.fillStyle = bodyCol;
  ctx.fillRect(2, 6, w - 4, 8);
  for (let i = 0; i < 3; i++) {
    const fx = 3 + i * ((w - 6) / 3);
    ctx.fillStyle = bodyCol; ctx.fillRect(fx, -2, 6, 8);
    ctx.fillStyle = darkCol; ctx.fillRect(fx, 1, 6, 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(fx + 1, -2, 4, 1.5);
  }
  ctx.restore();
}

// Fogonazo de disparo
function muzzle(x, y, r, inner) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(.35, inner);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// Animación de cargador (sale hacia abajo-derecha y entra desde abajo)
function magAnim(rl) {
  if (rl < 0) return { off: 0, show: true, hand: false };
  if (rl < .45) return { off: ease((rl - .15) / .3), show: true, hand: false };
  if (rl < .5) return { off: 1, show: false, hand: false };
  return { off: 1 - ease((rl - .5) / .3), show: true, hand: true };
}

// Puntos de salida de proyectiles y fogonazo según la punta del cañón en perspectiva 3/4
const MUZZLE = {
  wrench:  [16, -118],
  pistol:  [-2, -108],
  shotgun: [-2, -120],
  smg:     [-2, -118],
  plasma:  [-2, -116],
  rocket:  [-2, -126],
  rail:    [-2, -136],
  tesla:   [-2, -114],
  void:    [-2, -108],
};

// ---------- Renderizado del arma en primera persona ----------
function drawWeapon() {
  const p = player, w = curWeapon(), t = S.stats.time, P = wpal(w.id, t);
  const bx = p.moving ? Math.cos(p.bob) * 7 : 0, by = p.moving ? Math.abs(Math.sin(p.bob)) * 6 : 0;
  if (p.inspectT > 0) { drawInspect(w, P, t, bx, by); return; }

  const rl = p.reloadT > 0 ? 1 - p.reloadT / p.reloadDur : -1;
  const dip = rl >= 0 ? Math.sin(ease(rl) * Math.PI) : 0;
  const flash = p.fireAnim > .65 && !w.melee;

  // Perspectiva 3/4 a la derecha estilo Duke Nukem / Half-Life:
  // Base en x=252 (dentro del hueco 184-290 antes del panel derecho), inclinada -0.11 rad hacia la cruceta (240, 150)
  const isMelee = !!w.melee;
  const kick = (w.kick || .2) * p.fireAnim;
  const kickBack = kick * 20, kickUp = kick * 14, kickRot = kick * -0.06;

  const baseX = isMelee ? RW / 2 + 30 : RW / 2 + 18;
  const baseY = VH - 2; // base elevada para que el cuerpo del arma sea protagonista
  const baseRot = isMelee ? 0 : -0.11; // apunta de forma natural hacia el centro (240, 150)

  const ox = baseX + bx - dip * 12 + Math.sin(baseRot) * kickBack;
  const oy = baseY + by + kickBack + p.raise * 90 + dip * 26 - kickUp;
  const rot = baseRot - dip * 0.42 + kickRot;

  const [mx, my] = MUZZLE[w.id];
  S.muzzleXY = [
    ox + Math.cos(rot) * mx - Math.sin(rot) * my,
    oy + Math.sin(rot) * mx + Math.cos(rot) * my
  ];

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(rot);

  const m = magAnim(rl), mo = m.off * 75;
  const pp = (x, y, ww, hh, c) => part(ctx, x, y, ww, hh, c, P);
  const glowA = (a, fn) => {
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = P.glow;
    ctx.strokeStyle = P.glow;
    ctx.shadowColor = P.glow;
    ctx.shadowBlur = 8;
    fn();
    ctx.restore();
  };

  switch (w.id) {
    case "wrench": {
      // LLAVE INGLESA: Pesada herramienta cibernética con cabeza dentada, tornillo sin fin y mango blindado
      ctx.save();
      ctx.translate(24, -12);
      ctx.rotate(-.52 - p.fireAnim * 1.05);

      // Mango forjado con ranura antideslizante y biseles metálicos
      taperedBarrel(0, -124, 14, 0, -12, 18, 5, P.body, P.dark, P);
      pPoly([[-3, -120], [0, -120], [0, -16], [-3, -16]], P.accent, P);
      pp(-6, -66, 12, 28, "#2b2d42"); // empuñadura de goma estriada
      for (let i = 0; i < 5; i++) pp(-6, -64 + i * 6, 12, 2, P.dark);

      // Garganta y mecanismo de tornillo sin fin ajustable
      pp(-12, -126, 24, 14, P.dark);
      ctx.fillStyle = "#181a24"; ctx.fillRect(-5, -124, 10, 10);
      ctx.fillStyle = P.accent;
      for (let i = 0; i < 4; i++) ctx.fillRect(-4, -123 + i * 2.5, 8, 1.5); // rosca moleteada

      // Cabeza de la llave y mordaza fija con dientes
      pPoly([[-18, -148], [18, -148], [15, -126], [-15, -126]], P.dark, P);
      pPoly([[-14, -146], [-2, -146], [-2, -128], [-14, -128]], P.body, P);
      // Dientes de agarre en la mordaza
      ctx.fillStyle = "#181a24";
      for (let i = 0; i < 4; i++) ctx.fillRect(-7, -144 + i * 4, 5, 2.5);

      // Indicador de presión hidráulica luminiscente
      glowA(.85, () => ctx.fillRect(-1, -105, 2.5, 34));

      ctx.restore();
      robotHand(6, -30, 32);
      break;
    }

    case "pistol": {
      // BLÁSTER: Pistola pesada táctica de servicio con corredera biselada y miras de tritio
      if (flash) muzzle(-2, -108, 30, P.glow);

      // Cargador extraíble animado durante la recarga
      if (m.show) {
        pp(-8, -48 + mo, 16, 48, P.dark);
        glowA(1, () => ctx.fillRect(-5, -42 + mo, 10, 4));
        ctx.fillStyle = S.SK.body; ctx.fillRect(-8, -2 + mo, 16, 4);
      }

      // Corredera móvil (retroceso con el disparo)
      const slideRecoil = p.fireAnim > .3 ? p.fireAnim * 9 : (rl > .82 ? Math.sin((rl - .82) / .18 * Math.PI) * 9 : 0);

      // Armazón inferior (frame) y empuñadura
      box3D(-14, -64, 26, 46, 5, P.dark, "#111420", P);
      pp(-12, -60, 22, 6, P.accent);

      // Cañón y corredera biselada en 3/4
      const sy = -102 + slideRecoil;
      taperedBarrel(-2, sy, 24, -2, sy + 46, 28, 6, P.body, P.dark, P);

      // Ventana de expulsión de calor en el lomo derecho
      ctx.fillStyle = "#111420"; ctx.fillRect(4, sy + 22, 7, 14);
      if (p.fireAnim > .3) glowA(1, () => ctx.fillRect(5, sy + 24, 5, 10));

      // Serraciones de agarre traseras en la corredera
      ventSlots(-11, sy + 32, 5, 20, 1.5, 3, P.dark);

      // Riel inferior con haz de carga/diodo
      glowA(p.mag.pistol > 0 && rl < 0 ? 1 : .2, () => ctx.fillRect(-3, sy + 10, 4, 26));

      // Miras mecánicas (iron sights)
      ironSight(-2, sy - 2, 4, 5.5, P.dark, P.glow); // mira frontal con punto de tritio
      pp(-11, sy + 40, 4.5, 5, P.dark); pp(4.5, sy + 40, 4.5, 5, P.dark); // alza trasera U-notch

      // Bocacha compensadora
      pp(-9, sy - 6, 16, 6, P.dark);

      // Manos robóticas
      robotHand(-16, -28, 30);
      if (m.hand) robotHand(-28, 4 + mo, 26, true);
      break;
    }

    case "smg": {
      // SUBFUSIL RÁFAGA: PDW táctico con riel Picatinny superior, compensador ranurado y cerrojo ciclando
      if (flash) muzzle(-2, -118, 28, P.glow);

      // Cargador curvo extendido
      if (m.show) {
        pp(-7, -50 + mo, 14, 62, P.dark);
        pp(-7, -44 + mo, 14, 3, P.accent);
        glowA(p.mag.smg > 0 ? .85 : .1, () => ctx.fillRect(-2, -40 + mo, 4, 34));
      }

      // Cajón de mecanismos principal en 3/4
      taperedBarrel(-2, -88, 30, -2, -38, 34, 6, P.body, P.dark, P);

      // Cubierta ventilada del cañón (heat shroud con ranuras de ventilación)
      taperedBarrel(-2, -112, 18, -2, -88, 24, 5, P.dark, "#111420", P);
      ventSlots(-8, -108, 5, 12, 2, 4.5, "#0b0d13");
      pp(-2, -110, 1, 20, P.accent);

      // Freno de boca compensador tipo jaula (birdcage flash hider)
      pp(-8, -118, 14, 7, P.dark);
      ctx.fillStyle = "#0b0d13"; ctx.fillRect(-6, -116, 3, 3); ctx.fillRect(1, -116, 3, 3);

      // Riel Picatinny táctico superior
      pp(-13, -86, 26, 4, P.dark);
      for (let i = 0; i < 7; i++) pp(-12 + i * 3.8, -87, 2, 2, P.accent);

      // Diópter / anillo de mira frontal elevado
      ctx.fillStyle = P.dark;
      ctx.beginPath(); ctx.arc(-2, -113, 4.5, 0, Math.PI * 2); ctx.stroke();
      ironSight(-2, -111, 2, 3, P.dark, P.glow);

      // Cerrojo lateral ciclando a alta velocidad con la ráfaga
      const boltCycle = p.fireAnim * 6;
      ctx.fillStyle = "#596275"; ctx.fillRect(11, -78 + boltCycle, 6, 5);
      ctx.fillStyle = P.glow; ctx.fillRect(13, -76 + boltCycle, 3, 2);

      // Manos robóticas: derecha en gatillo, izquierda en guardamanos delantero
      robotHand(-16, -28, 30);
      if (m.hand) robotHand(-30, 8 + mo, 26, true);
      else robotSupportHand(-38, -66, 26, .1);
      break;
    }

    case "shotgun": {
      // ESCOPETA DE PULSOS: Pesada escopeta de combate con cañón doble biselado, escudo térmico y corredera
      if (flash) muzzle(-2, -120, 44, P.glow);

      // Ciclo del guardamanos corredero (bombeo / pump action)
      const pump = rl > .82 ? Math.sin((rl - .82) / .18 * Math.PI) * 18 : p.fireAnim * 12;

      // Doble cañón superpuesto pesado con perspectiva 3D
      taperedBarrel(-9, -116, 18, -9, -42, 22, 5, P.body, P.dark, P);
      taperedBarrel(9, -116, 18, 9, -42, 22, 5, P.body, P.dark, P);

      // Bocas de cañón con corona de acero y doble ánima oscura profunda
      ctx.fillStyle = "#0c0e14";
      ctx.beginPath();
      ctx.ellipse(-9, -116, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(9, -116, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = P.accent; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-9, -116, 8, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(9, -116, 8, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Punto de mira de latón / cuenta luminosa en la banda de mira central
      ironSight(0, -117, 4, 4.5, P.accent, "#ffd166");

      // Escudo térmico perforado sobre los cañones
      pp(-18, -104, 36, 22, P.dark);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          ctx.fillStyle = "#0c0e14";
          circ(ctx, -13 + col * 9, -99 + row * 9, 2.5);
        }
      }

      // Ventana de expulsión de cartuchos en el lateral derecho
      ctx.fillStyle = "#111420"; ctx.fillRect(17, -64, 7, 18);
      if (pump > 6) {
        ctx.fillStyle = "#d62828"; ctx.fillRect(22 + pump * .6, -62 - pump * .8, 9, 6);
        ctx.fillStyle = "#ffd166"; ctx.fillRect(22 + pump * .6, -62 - pump * .8, 2.5, 6);
      }

      // Guardamanos corredero estriado (pump forend)
      const py = -74 + pump;
      taperedBarrel(0, py, 44, 0, py + 26, 48, 6, P.accent, P.dark, P);
      for (let i = 0; i < 5; i++) pp(-18 + i * 9, py + 4, 4, 18, P.dark);

      // Manos robóticas
      robotHand(0, -28, 28);
      if (rl >= .12 && rl < .78) {
        const c = ((rl - .12) / .66 * 4) % 1, sy = -36 + (1 - ease(c * 1.6)) * 48;
        ctx.fillStyle = "#d62828"; ctx.fillRect(-5, sy, 10, 16);
        ctx.fillStyle = "#ffd166"; ctx.fillRect(-5, sy + 12, 10, 4);
        robotHand(-18, sy + 14, 30, true);
      } else {
        robotSupportHand(-36, py + 6, 28, -.1);
      }
      break;
    }

    case "rocket": {
      // LANZACOHETES MARTILLO: Colosal tubo de lanzamiento blindado, visor óptico lateral y ojiva visible
      if (flash) muzzle(-2, -126, 50, P.glow);

      // Tubo lanzador pesado octogonal con perspectiva cónica
      taperedBarrel(-2, -122, 54, -2, -36, 62, 8, P.body, P.dark, P);
      pp(-26, -68, 56, 7, P.dark); // anillo de refuerzo central

      // Boca masiva con interior oscuro y bisel
      ctx.fillStyle = "#111420";
      ctx.beginPath(); ctx.ellipse(-2, -122, 25, 9.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.accent; ctx.lineWidth = 1.5; ctx.stroke();

      // Franjas de peligro industrial en la boca
      for (let i = 0; i < 4; i++) {
        pPoly([[-22 + i * 12, -120], [-17 + i * 12, -120], [-20 + i * 12, -113], [-25 + i * 12, -113]], P.accent, P);
      }

      // Ojiva del cohete cargado asomando por la boca
      if (p.mag.rocket > 0 && rl < 0) {
        const rk = p.fireAnim * 14;
        ctx.fillStyle = "#606f47";
        ctx.beginPath();
        ctx.moveTo(-11, -120 + rk); ctx.lineTo(-2, -136 + rk); ctx.lineTo(7, -120 + rk);
        ctx.closePath(); ctx.fill();
        glowA(1, () => ctx.fillRect(-3, -137 + rk, 2, 3));
      }

      // Módulo de puntería / sensor óptico lateral en el lado izquierdo
      box3D(-38, -102, 16, 26, 4, P.dark, "#0d0f14", P);
      glowA(1, () => {
        ctx.fillStyle = P.glow;
        ctx.fillRect(-35, -98, 11, 9);
        ctx.fillRect(-31, -84, 2, 4);
      });

      // Recarga: nuevo cohete introducido por el brazo robótico
      if (rl >= .2 && rl < .8) {
        const k = ease((rl - .2) / .6), ry = -14 - k * 104;
        ctx.fillStyle = "#606f47"; ctx.fillRect(-11, ry, 20, 42);
        ctx.fillStyle = P.accent;
        ctx.beginPath(); ctx.moveTo(-11, ry); ctx.lineTo(-1, ry - 16); ctx.lineTo(9, ry); ctx.fill();
        robotHand(-24, ry + 30, 34, true);
      } else {
        robotSupportHand(-44, -50, 28, .15);
      }
      robotHand(0, -28, 28);
      break;
    }

    default: {
      // Armas de energía avanzada: Plasma, Riel, Tesla y Vacío
      const charged = rl < 0 ? 1 : rl > .8 ? (rl - .8) / .2 * (Math.random() < .5 ? 1 : .4) : .12;
      const pulse = .5 + .5 * Math.sin(t * 10);
      const ca = a => (.6 + .4 * pulse) * charged * a;

      if (w.id === "plasma") {
        // RIFLE DE PLASMA: Chasis angulado con bobinas de plasma pulsantes y emisor de doble punta
        if (flash) muzzle(-2, -116, 36, P.glow);

        // Chasis principal angulado
        taperedBarrel(-2, -98, 54, -2, -36, 62, 6, P.body, P.dark, P);
        pp(-28, -48, 56, 7, P.accent);

        // Bobinas de plasma superiores que laten con luz cian/azul
        ctx.fillStyle = P.dark; ctx.fillRect(-20, -92, 38, 38);
        glowA(ca(1), () => {
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(-17 + i * 13, -88, 9, 30);
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
            ctx.strokeRect(-17 + i * 13, -88, 9, 30);
          }
        });

        // Puntas aceleradoras dobles (twin emitter forks) en la boca
        pp(-20, -118, 9, 22, P.dark); pp(9, -118, 9, 22, P.dark);
        pPoly([[-20, -118], [-11, -118], [-15, -125]], P.accent, P);
        pPoly([[9, -118], [18, -118], [14, -125]], P.accent, P);
        // Arco de plasma entre las puntas
        glowA(ca(.85), () => {
          ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(-11, -114); ctx.lineTo(-2, -116 + rr(-2, 2)); ctx.lineTo(9, -114);
          ctx.stroke();
        });

      } else if (w.id === "rail") {
        // RIEL AGUJA: Acelerador electromagnético con rieles gemelos y 5 bobinas de inducción
        const cdk = clamp(1 - p.cooldown / w.rate, 0, 1);
        if (flash) muzzle(-2, -136, 40, P.glow);

        // Rieles magnéticos gemelos extendiéndose al frente
        taperedBarrel(-17, -134, 9, -19, -46, 11, 4, P.body, P.dark, P);
        taperedBarrel(15, -134, 9, 17, -46, 11, 4, P.body, P.dark, P);
        box3D(-26, -50, 52, 48, 6, P.dark, "#0d0f14", P);

        // Haz de plasma central que se carga según el cooldown
        glowA(ca(cdk), () => {
          ctx.fillRect(-4, -132, 6, 102);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-2, -132, 2, 102);
        });

        // 5 anillos de inducción electromagnética
        for (let i = 0; i < 5; i++) {
          const ry = -126 + i * 18;
          pp(-22, ry, 44, 5.5, P.accent);
          ctx.fillStyle = "#111420"; ctx.fillRect(-13, ry + 1, 24, 3.5);
        }

        // Visor prismático de francotirador elevado
        box3D(-11, -44, 20, 15, 3, P.accent, P.dark, P);
        glowA(1, () => circ(ctx, -1, -36, 3));

      } else if (w.id === "tesla") {
        // CAÑÓN TESLA ARCO: Trío de electrodos de cobre con esferas terminales y arcos voltaicos dinámicos
        taperedBarrel(-2, -84, 54, -2, -36, 60, 6, P.body, P.dark, P);
        for (let i = 0; i < 5; i++) pp(-26, -78 + i * 10, 52, 3.5, P.accent);

        // Núcleo de vacío de vidrio central con filamento de plasma
        ctx.fillStyle = "#111420"; ctx.fillRect(-13, -70, 24, 24);
        glowA(ca(.9), () => circ(ctx, -1, -58, 9));

        // Trío de electrodos con esferas conductoras en la punta
        for (const x of [-18, 0, 18]) {
          taperedBarrel(x - 2, -106, 5, x - 2, -84, 7, 2, P.dark, "#111420", P);
          glowA(ca(1), () => circ(ctx, x - 2, -108, 5.5));
        }

        // Arcos voltaicos aleatorios saltando entre electrodos
        if (flash || Math.random() < .15 * charged) {
          glowA(1, () => {
            ctx.lineWidth = 1.5; ctx.beginPath();
            ctx.moveTo(-20, -108);
            ctx.lineTo(-10, -112 + rr(-5, 5));
            ctx.lineTo(-2, -108);
            ctx.lineTo(8, -112 + rr(-5, 5));
            ctx.lineTo(16, -108);
            ctx.stroke();
          });
        }

      } else {
        // DISRUPTOR DE VACÍO: Garfas de confinamiento alrededor de un micro-agujero negro giratorio
        if (flash) muzzle(-2, -108, 42, P.glow);

        taperedBarrel(-2, -86, 58, -2, -34, 66, 6, P.body, P.dark, P);
        pp(-22, -98, 42, 18, P.dark);

        // 4 garfas de confinamiento gravitatorio curvadas
        pPoly([[-26, -96], [-30, -74], [-24, -74], [-20, -96]], P.accent, P);
        pPoly([[24, -96], [28, -74], [22, -74], [18, -96]], P.accent, P);

        // Micro-agujero negro: disco de acreción exterior y esfera negra interior
        glowA(ca(1), () => circ(ctx, -1, -74, 20));
        ctx.fillStyle = "#030308"; circ(ctx, -1, -74, 10);
        // Anillo de distorsión orbital giratorio
        glowA(ca(.85), () => {
          ctx.lineWidth = 2.5; ctx.beginPath();
          ctx.arc(-1, -74, 16, t * 4, t * 4 + 4.2);
          ctx.stroke();
        });
      }

      // Célula de energía lateral: sale y entra durante la recarga
      if (m.show) {
        ctx.globalAlpha = rl >= 0 && rl < .45 ? 1 - m.off * .7 : 1;
        ctx.fillStyle = P.dark; ctx.fillRect(-46 - m.off * 65, -68 + m.off * 55, 15, 30);
        glowA(rl >= 0 && rl < .45 ? 1 - m.off * .7 : 1, () => ctx.fillRect(-43 - m.off * 65, -64 + m.off * 55, 9, 22));
        ctx.globalAlpha = 1;
      }

      // Manos robóticas
      robotHand(0, -28, 28);
      if (m.hand) robotHand(-64 - m.off * 65, -42 + m.off * 55, 26, true);
      else robotSupportHand(-44, -34, 26, -.1);
    }
  }

  ctx.restore();
}

// Inspeccionar el arma: Byte la levanta y la gira para ver el modelo y su skin en 3D
function drawInspect(w, P, t, bx, by) {
  const p = player, k = p.inspectT / INSPECT_T, e2 = Math.min(1, (1 - k) * 5, k * 5), ph = (1 - k) * Math.PI * 2;
  const cx = RW / 2 + bx, cy = VH - 112 + by + (1 - e2) * 150;
  S.muzzleXY = [cx, cy];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-.28 + Math.sin(ph) * .16);
  ctx.scale(2.2, 2.2 * (.78 + .22 * Math.cos(ph)));
  ctx.translate(-64, -24);
  drawModel(ctx, w.id, P);
  ctx.restore();
  robotHand(cx - 46, cy + 10, 36);
  ctx.globalAlpha = e2;
  glowText(w.name, RW / 2, VH / 2 + 36, 10, "#ffb703", "center", 8);
  glowText(`SKIN · ${(WSKINS.find(s => s.id === P.sid) || WSKINS[0]).name}`, RW / 2, VH / 2 + 48, 7, P.glow, "center", 6);
  ctx.globalAlpha = 1;
}

export { ease, poly, pPoly, box3D, taperedBarrel, ironSight, ventSlots, robotHand, robotSupportHand, muzzle, magAnim, MUZZLE, drawWeapon, drawInspect };
