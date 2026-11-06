// Recogida de objetos y puertas.
import { S } from "../core/store.js";
import { clamp } from "../core/config.js";
import { magnetR, maxHealth } from "../core/profile.js";
import { AMMO_CAP, PICKUP_ID, WD, magSize } from "../data/weapons.js";
import { sfx } from "../audio/sfx.js";
import { inSlots, isSolid, msg, player } from "./world.js";
import { cellOccupied, equipWeapon } from "./player.js";

function updateItems(dt) {
  const p = player, A = p.ammo, mr = magnetR();
  p.swapOffer = null;
  for (const it of S.items) {
    if (it.vx) { // botín que sale despedido
      const nx = it.x + it.vx * dt, ny = it.y + it.vy * dt;
      if (!isSolid(Math.floor(nx), Math.floor(it.y))) it.x = nx; else it.vx *= -.4;
      if (!isSolid(Math.floor(it.x), Math.floor(ny))) it.y = ny; else it.vy *= -.4;
      it.vx *= Math.pow(.05, dt); it.vy *= Math.pow(.05, dt);
      if (Math.abs(it.vx) + Math.abs(it.vy) < .05) it.vx = it.vy = 0;
    }
    const dist = Math.hypot(it.x - p.x, it.y - p.y);
    if (it.kind === "bit" && dist < mr && dist > .05) { const s = Math.min(dist, 7 * dt); it.x += (p.x - it.x) / dist * s; it.y += (p.y - it.y) / dist * s; }
    if (it.taken || dist > .55) continue;
    let ok = true, text = "", snd = "pickup", quiet = false;
    const mh = maxHealth();
    switch (it.kind) {
      case "bit": S.sectorBits += it.value; snd = "coin"; quiet = true; S.bitPulse = .3; break;
      case "h": if (p.health >= mh) ok = false; else { p.health = Math.min(mh, p.health + 15); text = "Nanoparche +15"; } break;
      case "H": if (p.health >= mh) ok = false; else { p.health = Math.min(mh, p.health + 40); text = "Kit de reparación +40"; } break;
      case "a": if (p.armor >= 100) ok = false; else { p.armor = 100; text = "Blindaje firewall 100"; } break;
      case "i": if (A.bullets >= AMMO_CAP.bullets) ok = false; else { A.bullets = Math.min(AMMO_CAP.bullets, A.bullets + 20); text = "Balas +20"; } break;
      case "k": if (A.shells >= AMMO_CAP.shells) ok = false; else { A.shells = Math.min(AMMO_CAP.shells, A.shells + 8); text = "Cartuchos +8"; } break;
      case "c": if (A.cells >= AMMO_CAP.cells) ok = false; else { A.cells = Math.min(AMMO_CAP.cells, A.cells + 40); text = "Celdas +40"; } break;
      case "q": if (A.rockets >= AMMO_CAP.rockets) ok = false; else { A.rockets = Math.min(AMMO_CAP.rockets, A.rockets + 3); text = "Cohetes +3"; } break;
      case "r": p.keys.r = true; text = "¡Tarjeta de acceso ROJA!"; snd = "key"; break;
      case "u": p.keys.u = true; text = "¡Tarjeta de acceso AZUL!"; snd = "key"; break;
      default: {
        const id = PICKUP_ID[it.kind];
        if (!id) { ok = false; break; }
        const w = WD[id], addAmmo = () => { A[w.ammo] = Math.min(AMMO_CAP[w.ammo], A[w.ammo] + (w.ammo === "rockets" ? 4 : w.ammo === "shells" ? 8 : 32)); };
        if (inSlots(id) || p.stash.includes(id)) { addAmmo(); text = `Munición para ${w.name}`; break; }
        const free = p.slots.indexOf(null);
        if (free < 0) { p.swapOffer = it; ok = false; break; }   // ranuras llenas: ofrecer intercambio
        p.slots[free] = id; addAmmo(); p.mag[id] = magSize(w);
        text = `¡${w.name}! [${free + 1}]`; snd = "weapon"; equipWeapon(id); p.slot = free;
      }
    }
    if (!ok) continue;
    it.taken = true; if (!it.drop) S.stats.items++;
    sfx(snd); if (!quiet) { msg(text); S.pickFlash = .25; }
  }
  S.items = S.items.filter(i => !i.taken);
}
function updateDoors(dt) {
  for (const k in S.doors) {
    const d = S.doors[k];
    if (d.dir !== 0) {
      d.open = clamp(d.open + d.dir * dt * 1.6, 0, 1);
      if (d.open === 1 && d.dir === 1) { d.dir = 0; d.timer = 0; }
      if (d.dir === -1 && cellOccupied(d.x, d.y)) d.dir = 1;
      if (d.open === 0 && d.dir === -1) d.dir = 0;
    } else if (d.open === 1) {
      d.timer += dt;
      if (d.timer > 4 && !cellOccupied(d.x, d.y)) { d.dir = -1; sfx("door", Math.hypot(d.x + .5 - player.x, d.y + .5 - player.y)); }
    }
  }
}

export { updateItems, updateDoors };
