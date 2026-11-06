// Pantallas HTML: menú, pausa, derrota y fin de sector/capítulo.
import { S } from "../core/store.js";
import { CAMPAIGN, DIFFS, ov } from "../core/config.js";
import { PKEY, loadProfile, maxHealth, saveProfile } from "../core/profile.js";
import { biomeFor, chapterData, chapterOf } from "../world/chapters.js";
import { EDEF, INTRO, bossFor } from "../data/enemies.js";
import { audioInit, sfx } from "../audio/sfx.js";
import { AUDIO_HTML, toggleMusic } from "../audio/music.js";
import { generateSector } from "../world/generator.js";
import { player } from "../game/world.js";
import { loadLevel, newRun, retrySector, snapshotRun, startSector } from "../game/session.js";
import { armWeapon, buy, showShop, unarmSlot } from "./shop.js";
import { requestLock } from "./input.js";

function showOv(html, full = false) { ov.innerHTML = html; ov.classList.toggle("full", full); ov.classList.remove("hidden"); bindOv(); }
function hideOv() { ov.classList.add("hidden"); }
const bitsHTML = v => `<span class="bits"><i class="hex"></i>${v} BITS</span>`;
function bindOv() {
  ov.querySelectorAll("[data-vol]").forEach(el => el.oninput = () => {
    audioInit(); S.profile.music = S.profile.music || {}; S.profile.music.vol = el.value / 100; S.profile.music.on = true; saveProfile();
    ov.querySelectorAll("[data-act=mute]").forEach(b => b.textContent = "SILENCIAR");
  });
  ov.querySelectorAll("[data-act]").forEach(b => b.onclick = ev => {
    ev.stopPropagation(); audioInit(); sfx("ui");
    const [a, x, y] = b.dataset.act.split(":");
    switch (a) {
      case "new": newRun(x); break;
      case "newmenu": showNewMenu(); break;
      case "continue": S.run = { ...S.profile.run }; startSector(S.run.sector); break;
      case "resume": S.state = "playing"; hideOv(); requestLock(); break;
      case "retry": retrySector(); break;
      case "next": S.run = { ...S.profile.run }; startSector(S.run.sector); break;
      case "title": showTitle(); break;
      case "shop": S.shopReturn = x || "title"; showShop(x === "inter" ? "arsenal" : S.shopTab); break;
      case "tab": showShop(x); break;
      case "shopback": S.shopReturn === "inter" ? showInter() : showTitle(); break;
      case "buy": buy(x, y); break;
      case "equip": S.profile.skin = x; saveProfile(); sfx("pickup"); showShop("skins"); break;
      case "wsel": S.wskinW = x; showShop("wskins"); break;
      case "wequip": S.profile.wskinOf[S.wskinW] = x; saveProfile(); sfx("pickup"); showShop("wskins"); break;
      case "slot": S.arsenalSel = +x; showShop("arsenal"); break;
      case "arm": armWeapon(x); break;
      case "unarm": unarmSlot(+x); break;
      case "mute": toggleMusic(); break;
      case "reset": if (confirm("¿Borrar todo el progreso (bits, mejoras, skins y partida)?")) { localStorage.removeItem(PKEY); S.profile = loadProfile(); showTitle(); } break;
    }
  });
}
const fmtTime = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const KEYS_HTML = `<div class="keys">
  <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> moverse</span><span><kbd>Ratón</kbd> apuntar · <kbd>Clic</kbd> disparar</span>
  <span><kbd>R</kbd> recargar</span><span><kbd>E</kbd>/<kbd>Espacio</kbd> usar</span><span><kbd>Shift</kbd> correr</span>
  <span><kbd>1</kbd>–<kbd>4</kbd> armas</span><span><kbd>V</kbd> llave</span><span><kbd>I</kbd> inspeccionar</span><span><kbd>Tab</kbd> mapa</span><span><kbd>M</kbd> música</span><span><kbd>Esc</kbd> pausa</span></div>`;
function showTitle() {
  S.state = "title";
  if (document.pointerLockElement) document.exitPointerLock();
  S.diff = DIFFS.normal;
  loadLevel(generateSector(3, 4242, []), 3); S.introT = 0;
  const r = S.profile.run;
  showOv(`
    <div class="logo" data-t="BYTE">BYTE</div>
    <div class="tag">BRECHA EN LA NUBE</div>
    <p class="story">Un virus ha tomado el data center más grande de la Nube. Cada sector se genera de forma procedural
      y sus defensas evolucionan. Cada <b>${CAMPAIGN} sectores</b> empieza un capítulo nuevo con otros escenarios, otra música y otro jefe.
      Gasta tu botín en el mercado negro.</p>
    <div class="row">${bitsHTML(S.profile.bits)}<span class="sub">RÉCORD: SECTOR ${S.profile.best || 0}</span></div>
    <div class="menu">
      ${r ? `<button class="btn" data-act="continue">▶ CONTINUAR · SECTOR ${r.sector}</button>` : ""}
      <button class="btn ${r ? "alt" : ""}" data-act="newmenu">NUEVA PARTIDA</button>
      <button class="btn pink" data-act="shop:title">MERCADO NEGRO</button>
    </div>
    ${AUDIO_HTML()}
    ${KEYS_HTML}
    <button class="link" data-act="reset">Borrar progreso</button>`);
}
function showNewMenu() {
  showOv(`
    <div class="logo" data-t="NUEVA PARTIDA" style="font-size:clamp(1.6rem,6vw,3.4rem)">NUEVA PARTIDA</div>
    <p class="story">Se generará una nueva semilla de sectores. Conservas tus <b>bits, mejoras, skins y armas del mercado</b>.</p>
    <div class="cards">
      <button class="card e" data-act="new:facil"><span class="lvl">I</span><b>RECLUTA</b><small>Recibes menos daño. Ideal para aprender.</small></button>
      <button class="card n" data-act="new:normal"><span class="lvl">II</span><b>OPERADOR</b><small>La experiencia equilibrada.</small></button>
      <button class="card h" data-act="new:dificil"><span class="lvl">III</span><b>PESADILLA</b><small>Enemigos más duros y letales.</small></button>
    </div>
    <button class="btn ghost sm" data-act="title">VOLVER</button>`);
}
function showPause() {
  showOv(`
    <div class="logo" data-t="PAUSA" style="font-size:clamp(2rem,7vw,4rem)">PAUSA</div>
    <p class="sub">${S.L.name} · ${fmtTime(S.stats.time)} · BOTÍN DEL SECTOR: ${S.sectorBits}</p>
    <div class="row">
      <button class="btn" data-act="resume">CONTINUAR</button>
      <button class="btn ghost" data-act="retry">REINICIAR SECTOR</button>
      <button class="btn ghost" data-act="title">MENÚ PRINCIPAL</button>
    </div>${AUDIO_HTML()}${KEYS_HTML}`);
}
function showDead() {
  if (document.pointerLockElement) document.exitPointerLock();
  const kept = Math.floor(S.sectorBits * .5);
  S.profile.bits += kept; saveProfile();
  showOv(`
    <div class="logo red" data-t="SISTEMA FORMATEADO">SISTEMA FORMATEADO</div>
    <p class="sub">BYTE CAYÓ EN ${S.L.name}</p>
    ${statsHTML()}
    <p class="story">Recuperaste el 50% del botín del sector: <b>+${kept} bits</b>.</p>
    <div class="row">
      <button class="btn" data-act="retry">↻ REINTENTAR SECTOR</button>
      <button class="btn pink" data-act="shop:title">MERCADO</button>
      <button class="btn ghost" data-act="title">MENÚ</button>
    </div>`);
}
function statsHTML(extra = "") {
  const row = (label, a, b) => { const pct = b ? Math.round(a / b * 100) : 100; return `<div class="stat"><span>${label}</span><div class="bar"><i style="--w:${pct}%"></i></div><b>${pct}%</b></div>`; };
  return `<div class="stats">
    ${row(`ENEMIGOS ${S.stats.kills}/${S.stats.totalKills}`, S.stats.kills, S.stats.totalKills)}
    ${row(`OBJETOS ${S.stats.items}/${S.stats.totalItems}`, S.stats.items, S.stats.totalItems)}
    <div class="stat"><span>TIEMPO</span><span></span><b>${fmtTime(S.stats.time)}</b></div>
    <div class="stat"><span>DIFICULTAD</span><span></span><b>${S.diff.name}</b></div>${extra}</div>`;
}
function levelDone() {
  sfx("exit");
  if (document.pointerLockElement) document.exitPointerLock();
  const killPct = S.stats.totalKills ? S.stats.kills / S.stats.totalKills : 1;
  const bonus = Math.round(killPct * 20 * S.sector);
  S.profile.bits += S.sectorBits + bonus;
  S.profile.best = Math.max(S.profile.best || 0, S.sector);
  player.health = Math.min(maxHealth(), player.health + maxHealth() * .25);
  S.profile.run = snapshotRun(S.sector + 1); S.run = { ...S.profile.run }; saveProfile();
  S.interData = { sector: S.sector, name: S.L.name, statsH: statsHTML(`<div class="stat"><span>BOTÍN</span><span></span><b>+${S.sectorBits}</b></div><div class="stat"><span>BONUS LIMPIEZA</span><span></span><b>+${bonus}</b></div>`) };
  S.state = S.sector % CAMPAIGN === 0 ? "victory" : "inter";
  showInter();
}
function showInter() {
  S.state = S.interData.sector % CAMPAIGN === 0 ? "victory" : "inter";
  const d = S.interData, next = d.sector + 1;
  const chDone = d.sector % CAMPAIGN === 0, nch = chapterOf(next), NCH = chapterData(nch);
  const head = chDone
    ? `<div class="logo gold" data-t="CAPÍTULO ${nch} COMPLETADO">CAPÍTULO ${nch} COMPLETADO</div><div class="tag">${bossFor(nch - 1).name} HA CAÍDO</div>
       <p class="story">Se abre el <b>Capítulo ${nch + 1}: ${NCH.name}</b>. Nuevos escenarios (${NCH.biomes.map(b => b.name).join(", ")}),
       nueva música y un nuevo jefe te espera en el sector ${nch * CAMPAIGN + CAMPAIGN}: <b>${bossFor(nch).name}</b>.</p>`
    : `<div class="logo gold" data-t="SECTOR PURGADO">SECTOR PURGADO</div><p class="sub">${d.name}</p>`;
  showOv(`${head}${d.statsH}
    <div class="row">${bitsHTML(S.profile.bits)}</div>
    <p class="story">Siguiente: <b>SECTOR ${next}${next % CAMPAIGN === 0 ? ` · JEFE: ${bossFor(chapterOf(next)).name}` : ""} · ${biomeFor(next).name.toUpperCase()}</b>${INTRO[next] ? ` — nueva amenaza: <b>${EDEF[INTRO[next]].name}</b>` : ""}</p>
    <div class="row">
      <button class="btn" data-act="next">▶ ${chDone ? `CAPÍTULO ${nch + 1}` : "CONTINUAR"}</button>
      <button class="btn pink" data-act="shop:inter">MERCADO NEGRO</button>
      <button class="btn ghost" data-act="title">MENÚ</button>
    </div>`);
}

export { showOv, hideOv, bitsHTML, bindOv, fmtTime, KEYS_HTML, showTitle, showNewMenu, showPause, showDead, statsHTML, levelDone, showInter };
