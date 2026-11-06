// Raycasting, línea de visión y campo de flujo para la IA.
import { S } from "../core/store.js";
import { DIR4, TS } from "../core/config.js";
import { TEX_BLUE, TEX_DOOR, TEX_EXIT, TEX_RED } from "../gfx/textures.js";
import { cell, isDoor, isSolid, isWall, player } from "../game/world.js";

function cast(px, py, rdx, rdy, mark) {
  let mx = Math.floor(px), my = Math.floor(py);
  const ddx = rdx === 0 ? 1e30 : Math.abs(1 / rdx), ddy = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
  const sx = rdx < 0 ? -1 : 1, sy = rdy < 0 ? -1 : 1;
  let sdx = rdx < 0 ? (px - mx) * ddx : (mx + 1 - px) * ddx, sdy = rdy < 0 ? (py - my) * ddy : (my + 1 - py) * ddy, side = 0;
  for (let i = 0; i < 120; i++) {
    if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
    if (mx < 0 || my < 0 || mx >= S.MW || my >= S.MH) return { dist: 60, side, tex: S.TEX_WALL, texX: 0 };
    if (mark) S.seen[my * S.MW + mx] = 1;
    const ch = S.map[my][mx];
    if (isWall(ch)) {
      const dist = side === 0 ? sdx - ddx : sdy - ddy;
      let wx = side === 0 ? py + dist * rdy : px + dist * rdx; wx -= Math.floor(wx);
      let texX = Math.floor(wx * TS); if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) texX = TS - 1 - texX;
      return { dist, side, tex: ch === "%" ? S.TEX_PILLAR : ch === "X" ? TEX_EXIT : S.TEX_WALL, texX };
    }
    if (isDoor(ch)) {
      const d = S.doors[mx + "," + my], dist = side === 0 ? sdx - ddx / 2 : sdy - ddy / 2, other = side === 0 ? sdy : sdx;
      if (dist < other) {
        let wx = side === 0 ? py + dist * rdy : px + dist * rdx; wx -= Math.floor(wx);
        if (wx >= d.open) return { dist, side, tex: ch === "R" ? TEX_RED : ch === "B" ? TEX_BLUE : TEX_DOOR, texX: Math.floor((wx - d.open) * TS) };
      }
    }
  }
  return { dist: 60, side: 0, tex: S.TEX_WALL, texX: 0 };
}
function lineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, steps = Math.ceil(Math.hypot(dx, dy) / .15);
  for (let i = 1; i < steps; i++) { const t = i / steps; if (isSolid(Math.floor(x0 + dx * t), Math.floor(y0 + dy * t))) return false; }
  return true;
}
function computeFlow() {
  S.flow.fill(-1);
  const sx = Math.floor(player.x), sy = Math.floor(player.y), q = [sx + sy * S.MW]; S.flow[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], x = c % S.MW, y = (c / S.MW) | 0;
    for (const [dx, dy] of DIR4) {
      const nx = x + dx, ny = y + dy, n = nx + ny * S.MW, ch = cell(nx, ny);
      if (nx < 0 || ny < 0 || nx >= S.MW || ny >= S.MH || S.flow[n] !== -1 || isWall(ch)) continue;
      if (isDoor(ch)) { const d = S.doors[nx + "," + ny]; if (d.lock && d.open < .9) continue; }
      S.flow[n] = S.flow[c] + 1; q.push(n);
    }
  }
}

export { cast, lineOfSight, computeFlow };
