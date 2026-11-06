// Mercado negro: arsenal, armas, skins, mejoras y suministros.
import { S } from "../core/store.js";
import { SKINS, UPGRADES, maxHealth, saveProfile, upg } from "../core/profile.js";
import { AMMO_CAP, WD, WEAPONS, WI, WSKINS, magSize, modelURL } from "../data/weapons.js";
import { sfx } from "../audio/sfx.js";
import { freshSlots } from "../game/world.js";
import { bitsHTML, showOv } from "./screens.js";

// ---------- Tienda ----------
const SUPPLIES = [
  { id: "ammo", name: "PAQUETE DE MUNICIÓN", cost: 120, desc: "Llena la mitad de cada tipo de munición para el próximo sector.",
    apply: r => { for (const k in AMMO_CAP) r.ammo[k] = Math.max(r.ammo[k] || 0, Math.round(AMMO_CAP[k] / 2)); } },
  { id: "heal", name: "REPARACIÓN COMPLETA", cost: 90, desc: "Empiezas el próximo sector con la integridad al máximo.", apply: r => { r.health = maxHealth(); } },
  { id: "armor", name: "BLINDAJE PESADO", cost: 110, desc: "Empiezas el próximo sector con 100 de blindaje.", apply: r => { r.armor = 100; } },
];
function buy(kind, id) {
  let cost = 0, ok = false;
  if (kind === "w") {
    const w = WEAPONS[WI(id)]; cost = w.shop;
    if (!S.profile.shopW.includes(id) && S.profile.bits >= cost) {
      S.profile.shopW.push(id); ok = true;
      if (S.profile.run) {
        const r = S.profile.run; r.slots = r.slots || freshSlots(); const free = r.slots.indexOf(null);
        if (free >= 0) r.slots[free] = id;
        r.ammo.cells = Math.max(r.ammo.cells || 0, 80); r.mag[id] = magSize(w);
      }
    }
  } else if (kind === "u") {
    const u = UPGRADES.find(x => x.id === id), lv = upg(id); cost = u.cost[lv];
    if (lv < u.max && S.profile.bits >= cost) { S.profile.up[id] = lv + 1; ok = true; }
  } else if (kind === "s") {
    const s = SKINS.find(x => x.id === id); cost = s.cost;
    if (!S.profile.skins.includes(id) && S.profile.bits >= cost) { S.profile.skins.push(id); S.profile.skin = id; ok = true; }
  } else if (kind === "ws") {
    const s = WSKINS.find(x => x.id === id); cost = s.cost;
    if (!S.profile.wskins.includes(id) && S.profile.bits >= cost) { S.profile.wskins.push(id); S.profile.wskinOf[S.wskinW] = id; ok = true; }
  } else if (kind === "c" && S.profile.run) {
    const c = SUPPLIES.find(x => x.id === id); cost = c.cost;
    if (S.profile.bits >= cost) { c.apply(S.profile.run); ok = true; }
  }
  if (ok) { S.profile.bits -= cost; saveProfile(); sfx("buy"); } else sfx("deny");
  showShop(S.shopTab);
}
S.arsenalSel = 0; S.wskinW = "pistol";
function armWeapon(id) {
  const r = S.profile.run; if (!r) return;
  r.slots = r.slots || freshSlots(); r.stash = r.stash || [];
  const old = r.slots[S.arsenalSel];
  r.slots[S.arsenalSel] = id; r.stash = r.stash.filter(x => x !== id);
  if (old && !S.profile.shopW.includes(old) && !r.stash.includes(old)) r.stash.push(old);
  if (r.mag[id] === undefined) r.mag[id] = magSize(WD[id]);
  if (!r.slots.includes(r.weapon)) r.weapon = id;
  saveProfile(); sfx("weapon"); showShop("arsenal");
}
function unarmSlot(i) {
  const r = S.profile.run; if (!r) return;
  const old = r.slots[i]; if (!old) return;
  r.slots[i] = null;
  if (!S.profile.shopW.includes(old) && !r.stash.includes(old)) r.stash.push(old);
  if (r.weapon === old) r.weapon = r.slots.find(Boolean) || "wrench";
  S.arsenalSel = i; saveProfile(); sfx("ui"); showShop("arsenal");
}
function showShop(tab) {
  S.state = "shop"; S.shopTab = tab;
  if (document.pointerLockElement) document.exitPointerLock();
  const B = S.profile.bits;
  const tabs = [["arsenal", "ARSENAL"], ["armas", "ARMAS EXCLUSIVAS"], ["wskins", "SKINS DE ARMAS"], ["mejoras", "MEJORAS"], ["skins", "SKINS DE BYTE"], ["suministros", "SUMINISTROS"]]
    .map(([k, n]) => `<button class="tab ${k === tab ? "on" : ""}" data-act="tab:${k}">${n}</button>`).join("");
  let body = "";
  if (tab === "armas") {
    body = WEAPONS.filter(w => w.shop).map(w => {
      const own = S.profile.shopW.includes(w.id);
      return `<div class="item ${own ? "own" : "excl"}">
        <span class="tagx">EXCLUSIVA DEL MERCADO</span>
        <img class="wimg" src="${modelURL(w.id)}" alt="">
        <h4>${w.name}</h4><p>${w.desc}</p>
        <div class="st">Daño <b>${w.dmg[0]}–${w.dmg[1]}</b> · Cargador <b>${w.mag}</b> · Munición <b>celdas${w.per ? " ×" + w.per : ""}</b></div>
        ${own ? `<button class="btn sm ghost" disabled>EN TU ARSENAL</button>` : `<button class="btn sm pink" data-act="buy:w:${w.id}" ${B < w.shop ? "disabled" : ""}>COMPRAR · ${w.shop}</button>`}
      </div>`;
    }).join("");
  } else if (tab === "arsenal") {
    const r = S.profile.run;
    if (!r) body = `<div class="item"><h4>SIN PARTIDA ACTIVA</h4><p>Empieza una partida para organizar tus 4 ranuras de armas.</p></div>`;
    else {
      const slots = r.slots || freshSlots();
      const avail = [...new Set([...(r.stash || []), ...S.profile.shopW])].filter(id => WD[id] && !slots.includes(id));
      body = `<div style="grid-column:1/-1" class="hint">Solo puedes llevar <b>4 armas</b> a la vez. Elige una ranura y luego el arma que quieres poner en ella.
        La <b>llave inglesa</b> siempre está disponible con <kbd>V</kbd>. Las armas que cambies en combate se guardan aquí.</div>
        <div style="grid-column:1/-1" class="loadout">${slots.map((id, i) => `
          <div class="slot ${id ? "full" : ""} ${i === S.arsenalSel ? "sel" : ""}" data-act="slot:${i}">
            <b>RANURA ${i + 1}</b>
            ${id ? `<img class="wimg" src="${modelURL(id)}" alt=""><span>${WD[id].name}</span><button class="btn sm ghost" data-act="unarm:${i}">QUITAR</button>` : `<span>VACÍA</span>`}
          </div>`).join("")}</div>
        <div style="grid-column:1/-1" class="sub">ARMAS DISPONIBLES</div>
        ${avail.length ? avail.map(id => `<div class="item ${S.profile.shopW.includes(id) ? "excl" : ""}">
          <span class="tagx">${S.profile.shopW.includes(id) ? "EXCLUSIVA DEL MERCADO" : "ENCONTRADA EN COMBATE"}</span>
          <img class="wimg" src="${modelURL(id)}" alt=""><h4>${WD[id].name}</h4>
          <button class="btn sm alt" data-act="arm:${id}">EQUIPAR EN RANURA ${S.arsenalSel + 1}</button></div>`).join("")
          : `<div class="item"><h4>NADA EN RESERVA</h4><p>Encuentra armas en los sectores o cómpralas en el mercado.</p></div>`}`;
    }
  } else if (tab === "wskins") {
    const cur = (S.profile.wskinOf || {})[S.wskinW] || "estandar";
    body = `<div style="grid-column:1/-1" class="chips">${WEAPONS.map(w => `<button class="chip ${w.id === S.wskinW ? "on" : ""}" data-act="wsel:${w.id}"><img src="${modelURL(w.id)}" alt="">${w.name}</button>`).join("")}</div>
      <div style="grid-column:1/-1" class="wprev"><img src="${modelURL(S.wskinW, cur)}" alt="">
        <div class="sub">${WD[S.wskinW].name}<br>SKIN ACTUAL: <b style="color:var(--yl)">${WSKINS.find(s => s.id === cur).name}</b><br>Pulsa <kbd>I</kbd> en partida para inspeccionarla.</div></div>
      ${WSKINS.map(s => {
        const own = S.profile.wskins.includes(s.id), eq = cur === s.id;
        return `<div class="item ${eq ? "own" : ""}"><img class="wimg" src="${modelURL(S.wskinW, s.id)}" alt=""><h4>${s.name}</h4><p>${s.desc}</p>
          ${eq ? `<button class="btn sm ghost" disabled>EQUIPADA</button>` : own ? `<button class="btn sm alt" data-act="wequip:${s.id}">EQUIPAR</button>` :
            `<button class="btn sm" data-act="buy:ws:${s.id}" ${B < s.cost ? "disabled" : ""}>COMPRAR · ${s.cost}</button>`}</div>`;
      }).join("")}`;
  } else if (tab === "mejoras") {
    body = UPGRADES.map(u => {
      const lv = upg(u.id), maxed = lv >= u.max, cost = u.cost[lv];
      return `<div class="item ${maxed ? "own" : ""}"><h4>${u.name}</h4>
        <div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="pip ${i < lv ? "on" : ""}"></i>`).join("")}</div>
        <p>${u.desc}</p>
        ${maxed ? `<button class="btn sm ghost" disabled>NIVEL MÁXIMO</button>` : `<button class="btn sm alt" data-act="buy:u:${u.id}" ${B < cost ? "disabled" : ""}>MEJORAR · ${cost}</button>`}
      </div>`;
    }).join("");
  } else if (tab === "skins") {
    body = SKINS.map(s => {
      const own = S.profile.skins.includes(s.id), eq = S.profile.skin === s.id;
      return `<div class="item ${eq ? "own" : ""}">
        <div class="skinprev ${s.anim ? "anim" : ""}" style="--b:${s.body};--d:${s.dark};--v:${s.visor}"></div>
        <h4>${s.name}</h4><p>${s.desc}</p>
        ${eq ? `<button class="btn sm ghost" disabled>EQUIPADA</button>` : own ? `<button class="btn sm alt" data-act="equip:${s.id}">EQUIPAR</button>` :
          `<button class="btn sm" data-act="buy:s:${s.id}" ${B < s.cost ? "disabled" : ""}>COMPRAR · ${s.cost}</button>`}
      </div>`;
    }).join("");
  } else {
    body = S.profile.run ? SUPPLIES.map(c => `<div class="item"><h4>${c.name}</h4><p>${c.desc}</p>
      <button class="btn sm" data-act="buy:c:${c.id}" ${B < c.cost ? "disabled" : ""}>COMPRAR · ${c.cost}</button></div>`).join("")
      : `<div class="item"><h4>SIN PARTIDA ACTIVA</h4><p>Los suministros se aplican al próximo sector de una partida en curso.</p></div>`;
  }
  showOv(`<div class="shop">
    <div class="shop-head"><h2>MERCADO NEGRO</h2>${bitsHTML(B)}<button class="btn ghost sm" data-act="shopback">← VOLVER</button></div>
    <div class="tabs">${tabs}</div>
    <div class="grid">${body}</div></div>`, true);
}

export { SUPPLIES, buy, armWeapon, unarmSlot, showShop };
