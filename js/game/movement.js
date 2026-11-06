// Movimiento y colisiones de entidades.
import { S } from "../core/store.js";
import { EDEF } from "../data/enemies.js";
import { sfx } from "../audio/sfx.js";
import { isSolid, player } from "./world.js";

function blockedAt(x, y, r, self) {
  if (isSolid(Math.floor(x - r), Math.floor(y - r)) || isSolid(Math.floor(x + r), Math.floor(y - r)) || isSolid(Math.floor(x - r), Math.floor(y + r)) || isSolid(Math.floor(x + r), Math.floor(y + r))) return true;
  for (const d of S.decor) if (d.solid && Math.hypot(d.x - x, d.y - y) < r + .28) return true;
  if (self !== player) {
    if (Math.hypot(player.x - x, player.y - y) < r + .25) return true;
    for (const e of S.enemies) if (e !== self && !e.dead && Math.hypot(e.x - x, e.y - y) < r + EDEF[e.type].r * .8) return true;
  }
  return false;
}
function moveEnt(ent, mx, my, r) {
  let moved = false;
  if (!blockedAt(ent.x + mx, ent.y, r, ent)) { ent.x += mx; moved = true; } else if (ent !== player) tryEnemyDoor(Math.floor(ent.x + Math.sign(mx) * (r + .1)), Math.floor(ent.y));
  if (!blockedAt(ent.x, ent.y + my, r, ent)) { ent.y += my; moved = true; } else if (ent !== player) tryEnemyDoor(Math.floor(ent.x), Math.floor(ent.y + Math.sign(my) * (r + .1)));
  return moved;
}
function moveToward(e, tx, ty, s, r) {
  const dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy);
  if (l < .02) return false;
  const st = Math.min(s, l);
  return moveEnt(e, dx / l * st, dy / l * st, r);
}
function tryEnemyDoor(cx, cy) {
  const d = S.doors[cx + "," + cy];
  if (d && !d.lock && d.open < 1 && d.dir !== 1) { d.dir = 1; sfx("door", Math.hypot(cx - player.x, cy - player.y)); }
}

export { blockedAt, moveEnt, moveToward, tryEnemyDoor };
