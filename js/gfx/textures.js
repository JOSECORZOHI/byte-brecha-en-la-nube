// Texturas de paredes, pilares, puertas y salida generadas por código.
import { S } from "../core/store.js";
import { TS, mk, srnd } from "../core/config.js";
import { BIOMES } from "../world/chapters.js";

function wallTex(pal, s, style = "panel") {
  S.seed = s;
  if (style !== "panel") return styledWall(pal, style);
  return mk(TS, TS, g => {
    g.fillStyle = pal[0]; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 320; i++) { g.fillStyle = srnd() < .5 ? "rgba(0,0,0,.13)" : "rgba(255,255,255,.06)"; g.fillRect(srnd() * 64 | 0, srnd() * 64 | 0, 1, 1); }
    g.fillStyle = pal[1];
    g.fillRect(0, 31, 64, 2); g.fillRect(31, 0, 2, 64); g.fillRect(0, 0, 64, 1); g.fillRect(0, 63, 64, 1); g.fillRect(0, 0, 1, 64); g.fillRect(63, 0, 1, 64);
    g.fillStyle = pal[2]; g.fillRect(1, 1, 62, 1); g.fillRect(1, 33, 62, 1); g.fillRect(1, 1, 1, 62); g.fillRect(33, 1, 1, 62);
    g.fillStyle = pal[1]; for (const x of [5, 26, 37, 58]) for (const y of [5, 26, 37, 58]) g.fillRect(x, y, 2, 2);
    for (let y = 41; y < 56; y += 4) g.fillRect(40, y, 16, 2);
    g.fillStyle = "rgba(255,183,3,.7)"; g.fillRect(8, 44, 14, 2);
  });
}
// Estilos de pared alternativos para que cada escenario se vea distinto
function styledWall(pal, style) {
  return mk(TS, TS, g => {
    g.fillStyle = pal[0]; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 200; i++) { g.fillStyle = srnd() < .5 ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.05)"; g.fillRect(srnd() * 64 | 0, srnd() * 64 | 0, 1, 1); }
    if (style === "circuit") {
      g.strokeStyle = pal[2]; g.lineWidth = 1;
      for (let k = 0; k < 9; k++) {
        let x = (srnd() * 16 | 0) * 4, y = (srnd() * 16 | 0) * 4; g.beginPath(); g.moveTo(x, y);
        for (let st = 0; st < 5; st++) { if (srnd() < .5) x += (srnd() < .5 ? -1 : 1) * 8; else y += (srnd() < .5 ? -1 : 1) * 8; g.lineTo(x, y); }
        g.stroke(); g.fillStyle = pal[2]; g.fillRect(x - 1, y - 1, 3, 3);
      }
      g.fillStyle = pal[1]; g.fillRect(20, 22, 22, 16); g.fillStyle = pal[2]; for (let i = 0; i < 5; i++) { g.fillRect(22 + i * 4, 20, 2, 2); g.fillRect(22 + i * 4, 38, 2, 2); }
    } else if (style === "hex") {
      g.strokeStyle = pal[1]; g.lineWidth = 2;
      for (let row = -1; row < 5; row++) for (let col = -1; col < 4; col++) {
        const cx = col * 21 + (row % 2 ? 10.5 : 0), cy = row * 18 + 4;
        g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11); } g.closePath(); g.stroke();
        if (srnd() < .15) { g.fillStyle = pal[2]; g.globalAlpha = .5; g.fill(); g.globalAlpha = 1; }
      }
    } else if (style === "brick") {
      for (let row = 0; row < 8; row++) {
        const off = row % 2 ? 8 : 0;
        for (let col = -1; col < 4; col++) {
          const x = col * 16 + off, y = row * 8;
          g.fillStyle = srnd() < .5 ? pal[0] : pal[1]; g.fillRect(x + 1, y + 1, 14, 6);
          if (srnd() < .12) { g.fillStyle = pal[2]; g.fillRect(x + 4, y + 3, 2, 2); }
        }
      }
      g.fillStyle = "rgba(0,0,0,.35)"; for (let row = 0; row < 8; row++) g.fillRect(0, row * 8, 64, 1);
    } else if (style === "crystal") {
      for (let k = 0; k < 7; k++) {
        const x = srnd() * 64, w = 8 + srnd() * 14, h = 20 + srnd() * 44;
        g.fillStyle = srnd() < .5 ? pal[2] : pal[1]; g.globalAlpha = .55;
        g.beginPath(); g.moveTo(x, 64); g.lineTo(x + w / 2, 64 - h); g.lineTo(x + w, 64); g.fill();
        g.globalAlpha = .9; g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x + w / 2 - 1, 64 - h + 4, 1, h * .6);
      }
      g.globalAlpha = 1;
    } else if (style === "cables") {
      g.fillStyle = pal[1]; g.fillRect(0, 0, 64, 64);
      for (let x = 1; x < 64; x += 5) {
        g.fillStyle = srnd() < .3 ? pal[2] : srnd() < .5 ? pal[0] : "#15171d"; g.fillRect(x, 0, 4, 64);
        g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x + 1, 0, 1, 64);
      }
      g.fillStyle = pal[1]; g.fillRect(0, 20, 64, 4); g.fillRect(0, 44, 64, 4);
      g.fillStyle = pal[2]; for (let i = 0; i < 6; i++) g.fillRect(srnd() * 60, srnd() * 60, 2, 2);
    }
    g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(0, 0, 64, 1); g.fillRect(0, 63, 64, 1);
  });
}
function pillarTex(style, pal, s) {
  if (style === "rack") return TEX_RACK;
  S.seed = s;
  return mk(64, 64, g => {
    if (style === "pipe") {
      const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, pal[1]); gr.addColorStop(.45, pal[2]); gr.addColorStop(1, pal[1]);
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      g.fillStyle = "rgba(0,0,0,.45)"; for (let y = 6; y < 64; y += 20) { g.fillRect(0, y, 64, 4); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, y + 4, 64, 1); g.fillStyle = "rgba(0,0,0,.45)"; }
      g.fillStyle = "#ffb703"; g.fillRect(28, 30, 8, 3);
    } else if (style === "crystal") {
      g.fillStyle = pal[1]; g.fillRect(0, 0, 64, 64);
      for (let k = 0; k < 6; k++) { g.fillStyle = srnd() < .5 ? pal[2] : "rgba(255,255,255,.5)"; g.globalAlpha = .7; g.beginPath(); const x = srnd() * 64; g.moveTo(x, 64); g.lineTo(x + 6, 0); g.lineTo(x + 14, 64); g.fill(); }
      g.globalAlpha = 1;
    } else { // core: columna de energía
      g.fillStyle = "#0a0a12"; g.fillRect(0, 0, 64, 64);
      const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(.5, pal[2]); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(16, 0, 32, 64); g.fillStyle = "#ffffff"; g.fillRect(31, 0, 2, 64);
      g.fillStyle = pal[1]; g.fillRect(0, 0, 10, 64); g.fillRect(54, 0, 10, 64);
      for (let y = 4; y < 64; y += 12) { g.fillStyle = pal[2]; g.fillRect(2, y, 6, 2); g.fillRect(56, y, 6, 2); }
    }
  });
}
function rackTex(s) {
  S.seed = s;
  return mk(64, 64, g => {
    g.fillStyle = "#161b28"; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#2b3245"; g.fillRect(0, 0, 4, 64); g.fillRect(60, 0, 4, 64);
    const cols = ["#39ff88", "#3fc1ff", "#ffb703", "#ff3b3b"];
    for (let y = 2; y < 64; y += 8) {
      g.fillStyle = "#232a3b"; g.fillRect(4, y, 56, 6); g.fillStyle = "#0b0e16"; g.fillRect(4, y + 6, 56, 2);
      g.fillStyle = "#10141f"; for (let x = 8; x < 40; x += 3) g.fillRect(x, y + 1, 2, 4);
      for (let k = 0; k < 3; k++) if (srnd() < .75) { g.fillStyle = cols[(srnd() * 4) | 0]; g.fillRect(44 + k * 5, y + 2, 2, 2); }
    }
  });
}
function doorTex(color) {
  return mk(64, 64, g => {
    g.fillStyle = "#7d8491"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#5a606b"; g.fillRect(31, 0, 2, 64);
    for (const y0 of [0, 54]) {
      g.save(); g.beginPath(); g.rect(0, y0, 64, 10); g.clip(); g.fillStyle = "#111"; g.fillRect(0, y0, 64, 10); g.fillStyle = "#ffb703";
      for (let x = -20; x < 70; x += 10) { g.beginPath(); g.moveTo(x, y0 + 10); g.lineTo(x + 5, y0 + 10); g.lineTo(x + 15, y0); g.lineTo(x + 10, y0); g.fill(); }
      g.restore();
    }
    g.fillStyle = "#4a505b"; g.fillRect(8, 16, 18, 32); g.fillRect(38, 16, 18, 32);
    g.fillStyle = "#9aa1ad"; g.fillRect(9, 17, 16, 1); g.fillRect(39, 17, 16, 1);
    if (color) { g.fillStyle = color; g.fillRect(0, 26, 64, 8); g.fillStyle = "#fff"; g.fillRect(28, 27, 8, 6); g.fillStyle = color; g.fillRect(30, 29, 4, 2); }
    else { g.fillStyle = "#3fc1ff"; g.fillRect(12, 22, 10, 5); g.fillRect(42, 22, 10, 5); }
  });
}
function exitTex() {
  return mk(64, 64, g => {
    g.fillStyle = "#1d3b2a"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#0f2418"; g.fillRect(4, 4, 56, 56);
    g.fillStyle = "#39ff88"; g.font = "bold 11px monospace"; g.textAlign = "center"; g.fillText("SALIDA", 32, 17);
    g.fillStyle = "#2b2f3a"; g.fillRect(22, 24, 20, 32); g.fillStyle = "#ff3b3b"; g.fillRect(28, 28, 8, 16); g.fillStyle = "#ffb3b3"; g.fillRect(29, 29, 6, 3);
    g.fillStyle = "#39ff88"; g.fillRect(8, 26, 8, 2); g.fillRect(48, 26, 8, 2); g.fillRect(8, 50, 8, 2); g.fillRect(48, 50, 8, 2);
  });
}
const TEX_DOOR = doorTex(null), TEX_RED = doorTex("#ff3b3b"), TEX_BLUE = doorTex("#3f7fff"), TEX_EXIT = exitTex(), TEX_RACK = rackTex(42);
S.TEX_WALL = wallTex(BIOMES[0].pal, 1); S.TEX_PILLAR = TEX_RACK;

export { wallTex, styledWall, pillarTex, rackTex, doorTex, exitTex, TEX_DOOR, TEX_RED, TEX_BLUE, TEX_EXIT, TEX_RACK };
