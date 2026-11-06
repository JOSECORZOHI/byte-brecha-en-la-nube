// Pruebas automáticas del juego. Ejecutar con:  npm test   (o  node --test tests/)
import test from "node:test";
import assert from "node:assert/strict";
import { boot, step, press, dom } from "./dom-stub.mjs";

await boot();
const { S } = await import("../js/core/store.js");
const { player } = await import("../js/game/world.js");
const { generateSector, solvable } = await import("../js/world/generator.js");
const { newRun, retrySector, startSector } = await import("../js/game/session.js");
const { fire, startReload, useAction } = await import("../js/game/player.js");
const { buy } = await import("../js/ui/shop.js");
const { levelDone } = await import("../js/ui/screens.js");
const { bossFor, EDEF } = await import("../js/data/enemies.js");
const { getTrack, trackFor } = await import("../js/audio/music.js");

const goTo = n => { S.profile.run.sector = n; retrySector(); step(5); player.health = 1e9; };
const pickup = kind => { S.items.push({ kind, x: player.x, y: player.y }); step(2); };

test("arranca en la pantalla de título", () => {
  assert.equal(S.state, "title");
  assert.match(dom.overlayHTML, /NUEVA PARTIDA/);
});

test("todos los sectores generados se pueden completar", () => {
  for (let seed = 0; seed < 12; seed++) for (let n = 1; n <= 45; n++) {
    const lv = generateSector(n, seed * 7919 + 3, []);
    assert.ok(solvable(lv), `sector ${n}, semilla ${seed}`);
    for (const e of [...lv.enemies, ...lv.items]) assert.equal(lv.map[Math.floor(e.y)][Math.floor(e.x)], ".", `objeto dentro de un muro en sector ${n}`);
  }
});

test("nueva partida: sector 1 con bláster", () => {
  newRun("normal"); step(5);
  assert.equal(S.state, "playing");
  assert.deepEqual(player.slots, ["pistol", null, null, null]);
  assert.ok(S.enemies.length > 0);
});

test("recarga: vacía el cargador y lo rellena desde la reserva", () => {
  player.mag.pistol = 0; player.ammo.bullets = 30; player.reloadT = 0; player.raise = 0;
  startReload(); step(120);
  assert.equal(player.mag.pistol, 12);
  assert.equal(player.ammo.bullets, 18);
});

test("solo 4 armas: la quinta se intercambia con E y la vieja va al arsenal", () => {
  goTo(2);
  pickup("S"); pickup("M"); pickup("L");
  assert.equal(player.slots.filter(Boolean).length, 4);
  pickup("Q");
  assert.ok(player.swapOffer, "debe ofrecer intercambio");
  press("Digit2"); step(20);
  const old = player.weapon;
  useAction(); step(2);
  assert.ok(player.slots.includes("rocket"));
  assert.ok(player.stash.includes(old));
  assert.equal(player.slots.length, 4);
});

test("tienda: comprar arma exclusiva, skin de arma y mejora descuenta bits", () => {
  S.profile.bits = 10000;
  buy("w", "rail"); buy("u", "dmg"); buy("ws", "oro");
  assert.ok(S.profile.shopW.includes("rail"));
  assert.equal(S.profile.up.dmg, 1);
  assert.ok(S.profile.wskins.includes("oro"));
  assert.equal(S.profile.bits, 10000 - 1400 - 300 - 1200);
  const before = S.profile.bits; buy("w", "rail");
  assert.equal(S.profile.bits, before, "no se puede comprar dos veces");
});

test("cada capítulo tiene su jefe, y sus ataques se ejecutan en las 3 fases", () => {
  const names = new Set();
  for (let ch = 0; ch < 5; ch++) {
    goTo(ch * 10 + 10);
    const boss = S.enemies.find(e => e.type === "boss");
    assert.ok(boss, `jefe del capítulo ${ch + 1}`);
    assert.equal(EDEF.boss.name, bossFor(ch).name);
    names.add(bossFor(ch).name);
    player.x = 22.5; player.y = 11.5;
    let maxPhase = 1;
    for (let i = 0; i < 60 * 40; i++) {
      step(1);
      if (i % 60 === 0) { boss.hp -= boss.maxHp * .03; for (const p of S.enemies) if (p.type === "pylon") p.hp = 1; }
      maxPhase = Math.max(maxPhase, boss.phase || 1);
    }
    assert.equal(maxPhase, 3, `el jefe ${bossFor(ch).name} llega a la fase 3`);
  }
  assert.equal(names.size, 5, "5 jefes distintos");
});

test("salida bloqueada con el jefe vivo; al vencerlo termina el capítulo", () => {
  goTo(20);
  player.x = 33.5; player.y = 11.5; player.a = 0; useAction();
  assert.equal(S.state, "playing");
  S.enemies.find(e => e.type === "boss").dead = true;
  useAction();
  assert.equal(S.state, "victory");
  assert.match(dom.overlayHTML, /CAPÍTULO 2 COMPLETADO/);
});

test("la música cambia de tema por escenario, jefe y capítulo", () => {
  assert.equal(trackFor(1, false), "biome0");
  assert.equal(trackFor(10, true), "boss");
  assert.equal(trackFor(20, true), "c1boss");
  assert.notEqual(getTrack("c1b0").bpm + getTrack("c1b0").scale, getTrack("c2b0").bpm + getTrack("c2b0").scale);
});

test("el progreso se guarda en localStorage", () => {
  const saved = JSON.parse(localStorage.getItem("byte.profile.v2"));
  assert.ok(saved.shopW.includes("rail"));
  assert.ok(saved.run && saved.run.sector >= 1);
});
