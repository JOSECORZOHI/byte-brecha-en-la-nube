// Banda sonora sintetizada: temas, secuenciador y capas por intensidad.
import { S } from "../core/store.js";
import { mulberry32, ov } from "../core/config.js";
import { saveProfile } from "../core/profile.js";
import { biomeFor, biomeIdx, chapterOf } from "../world/chapters.js";
import { EDEF, bossFor } from "../data/enemies.js";
import { audioInit } from "./sfx.js";
import { msg, player } from "../game/world.js";

// Cada tema define tempo, tonalidad, progresión de acordes y patrones de 16 pasos.
// Capas: pad, bajo, batería, hi-hat, arpegio y melodía. La intensidad del combate
// sube/baja las capas de batería, hi-hat y melodía.
const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], lydian: [0, 2, 4, 6, 7, 9, 11], aeolianb5: [0, 2, 3, 5, 6, 8, 10] };
const TRACKS = {
  menu:   { name: "Señal Perdida",      bpm: 92,  root: 45, scale: "minor",    prog: [0, 5, 2, 6], kick: "x.......x.......", snare: "................", hat: "....x.......x...", bass: "x.......x...o...", arp: 2, arpOct: 2, lead: .7, seed: 11, padVol: 1.3, wave: "triangle" },
  biome0: { name: "Turno de Noche",     bpm: 110, root: 38, scale: "dorian",   prog: [0, 3, 0, 6], kick: "x...x...x...x...", snare: "....x.......x...", hat: "..x...x...x...x.", bass: "x.x...x.x.o...x.", arp: 1, arpOct: 2, lead: 1, seed: 21 },
  biome1: { name: "Ventiladores",       bpm: 118, root: 40, scale: "minor",    prog: [0, 5, 6, 0], kick: "x...x...x...x...", snare: "....x.......x..x", hat: "xxxxxxxxxxxxxxxx", bass: "xx.xx.xxxx.xx.x.", arp: 1, arpOct: 3, lead: 1, seed: 33 },
  biome2: { name: "Escarcha Digital",   bpm: 100, root: 42, scale: "minor",    prog: [0, 4, 5, 3], kick: "x.........x.....", snare: "........x.......", hat: "..x...x...x...x.", bass: "x.......x.....5.", arp: 2, arpOct: 3, lead: .8, seed: 45, wave: "sine", padVol: 1.2 },
  biome3: { name: "Metal Fundido",      bpm: 126, root: 36, scale: "phrygian", prog: [0, 1, 0, 6], kick: "x..x..x.x..x..x.", snare: "....X.......X...", hat: "x.x.x.x.x.x.x.x.", bass: "xxo.xxo.xxo.x5o.", arp: 1, arpOct: 2, lead: 1, seed: 57, wave: "sawtooth" },
  biome4: { name: "Corazón del Núcleo", bpm: 132, root: 47, scale: "harmonic", prog: [0, 5, 3, 4], kick: "x...x...x...x...", snare: "....x.......x.x.", hat: "x.xxx.xxx.xxx.xx", bass: "x.xox.xox.xox.xo", arp: 1, arpOct: 2, lead: 1, seed: 69 },
  biome5: { name: "Abismo",             bpm: 105, root: 43, scale: "phrygian", prog: [0, 1, 4, 0], kick: "x.....x...x.....", snare: "........x.......", hat: "x...x...x...x..x", bass: "x.....x...5.....", arp: 2, arpOct: 3, lead: .8, seed: 81, wave: "sine", padVol: 1.3 },
  boss:   { name: "Protocolo KERNEL",   bpm: 148, root: 45, scale: "harmonic", prog: [0, 5, 6, 4], kick: "x.x.x.x.x.x.x.x.", snare: "....X..x....X.x.", hat: "xxxxxxxxxxxxxxxx", bass: "xoxoxoxoxoxoxoxo", arp: 1, arpOct: 2, lead: 1.2, seed: 99, wave: "sawtooth", boss: true },
};
// Temas de los capítulos 2 en adelante: se componen a partir de una semilla (tempo, escala, progresión, patrones y timbres)
const PAT = {
  kick: ["x...x...x...x...", "x.......x.......", "x..x..x.x..x..x.", "x...x...x...x.x.", "x.....x...x.....", "x.x...x.x.x...x."],
  bossKick: ["x.x.x.x.x.x.x.x.", "x..xx..xx..xx..x", "xxx.x.x.xxx.x.x."],
  snare: ["....x.......x...", "....x.......x..x", "........x.......", "....x..x....x...", "....X.......X.x."],
  hat: ["..x...x...x...x.", "xxxxxxxxxxxxxxxx", "x.x.x.x.x.x.x.x.", "x.xxx.xxx.xxx.xx", "x...x...x...x..x", "..xx..xx..xx..xx"],
  bass: ["x.x...x.x.o...x.", "xx.xx.xxxx.xx.x.", "x.......x.....5.", "xxo.xxo.xxo.x5o.", "x.xox.xox.xox.xo", "x.....x...5.....", "x..x..x.o..x..5.", "xoxoxoxoxoxoxoxo"],
  prog: [[0, 5, 2, 6], [0, 3, 0, 6], [0, 5, 6, 0], [0, 4, 5, 3], [0, 1, 0, 6], [0, 5, 3, 4], [0, 1, 4, 0], [0, 6, 5, 4], [0, 2, 5, 4], [0, 3, 4, 3]],
};
// Nombres de los temas: sustantivo con género [nombre, 0=masc 1=fem] + adjetivo [masc, fem]
const TN_A = [["Eco", 0], ["Pulso", 0], ["Latido", 0], ["Señal", 1], ["Ruido", 0], ["Ritmo", 0], ["Frecuencia", 1], ["Onda", 1], ["Código", 0], ["Corriente", 1], ["Deriva", 1], ["Interferencia", 1]];
const TN_B = [["de Fibra", "de Fibra"], ["Estático", "Estática"], ["Satelital", "Satelital"], ["de Ceniza", "de Ceniza"], ["Helado", "Helada"], ["del Vacío", "del Vacío"],
  ["de Neón", "de Neón"], ["de Cobalto", "de Cobalto"], ["Ámbar", "Ámbar"], ["de Plasma", "de Plasma"], ["Fantasma", "Fantasma"], ["Profundo", "Profunda"]];
function genTrack(sd, boss, bossName) {
  const R = mulberry32(sd), pick = a => a[Math.floor(R() * a.length)];
  const [tn, tg] = pick(TN_A);
  return { name: boss ? `Protocolo ${bossName}` : `${tn} ${pick(TN_B)[tg]}`, bpm: boss ? 140 + Math.floor(R() * 20) : 96 + Math.floor(R() * 40),
    root: 36 + Math.floor(R() * 12), scale: pick(boss ? ["harmonic", "phrygian", "minor", "aeolianb5"] : ["minor", "dorian", "phrygian", "harmonic", "lydian", "aeolianb5"]),
    prog: pick(PAT.prog), kick: pick(boss ? PAT.bossKick : PAT.kick), snare: pick(PAT.snare), hat: pick(PAT.hat), bass: pick(PAT.bass),
    arp: pick([1, 2, 2, 4]), arpOct: pick([2, 3]), lead: boss ? 1.2 : .8 + R() * .4, seed: sd, wave: pick(["sawtooth", "square", "triangle", "sine"]),
    leadWave: pick(["square", "sawtooth", "triangle"]), padVol: .9 + R() * .5, swing: R() < .3 ? .22 : 0, boss };
}
function getTrack(id) {
  if (TRACKS[id]) return TRACKS[id];
  const m = /^c(\d+)(?:b(\d+)|(boss))$/.exec(id), ch = +m[1];
  return (TRACKS[id] = m[3] ? genTrack(ch * 1000 + 999, true, bossFor(ch).name) : genTrack(ch * 1000 + (+m[2]) * 77 + 5, false));
}
function trackFor(n, boss) {
  const ch = chapterOf(n), bi = biomeIdx(n), b = biomeFor(n);
  if (boss) return ch === 0 ? "boss" : `c${ch}boss`;
  return b.track || `c${ch}b${bi}`;
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function degToMidi(tr, deg, oct) { const sc = SCALES[tr.scale], n = sc.length, o = Math.floor(deg / n); return tr.root + 12 * (oct + o) + sc[((deg % n) + n) % n]; }
// Melodía procedural pero determinista por tema: motivo A, variación, motivo B, variación
function makeMelody(tr) {
  const R = mulberry32(tr.seed);
  const motif = () => { const out = []; for (let st = 0; st < 16; st += 2) if (st === 0 || R() < .55) out.push({ s: st, deg: Math.floor(R() * 6) - 1, len: R() < .3 ? 4 : 2 }); return out; };
  const vary = m => m.map(nt => ({ ...nt, deg: nt.deg + (R() < .35 ? (R() < .5 ? 1 : -1) : 0) }));
  const A = motif(), B = motif();
  return [A, vary(A), B, vary(A)];
}
function getNoise() {
  if (!S.noiseBuf) { S.noiseBuf = S.AC.createBuffer(1, S.AC.sampleRate * 1.5, S.AC.sampleRate); const d = S.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return S.noiseBuf;
}
function mOsc(dest, t, f, dur, type, vol, o = {}) {
  const osc = S.AC.createOscillator(), g = S.AC.createGain();
  osc.type = type; osc.frequency.setValueAtTime(f, t);
  if (o.detune) osc.detune.setValueAtTime(o.detune, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
  const a = o.attack || .005, r = Math.max(a + .02, o.release || dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + r);
  let node = osc;
  if (o.lp) { const fl = S.AC.createBiquadFilter(); fl.type = "lowpass"; fl.Q.value = o.q || 1; fl.frequency.setValueAtTime(o.lp, t); if (o.lpEnv) fl.frequency.exponentialRampToValueAtTime(o.lpEnv, t + dur); osc.connect(fl); node = fl; }
  node.connect(g); g.connect(dest); osc.start(t); osc.stop(t + r + .05);
}
function mNoise(dest, t, dur, vol, type, freq) {
  const src = S.AC.createBufferSource(), fl = S.AC.createBiquadFilter(), g = S.AC.createGain();
  src.buffer = getNoise(); fl.type = type; fl.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  src.connect(fl); fl.connect(g); g.connect(dest); src.start(t, Math.random()); src.stop(t + dur + .05);
}
const MUSIC = { cur: null, want: undefined, inten: 0, bus: null, last: {} };
function startTrack(id) {
  const tr = getTrack(id), now = S.AC.currentTime, out = S.AC.createGain();
  out.gain.setValueAtTime(0, now); out.gain.linearRampToValueAtTime(1, now + 1.5); out.connect(MUSIC.bus);
  const Ly = {};
  for (const k of ["pad", "bass", "drums", "hat", "arp", "lead"]) { Ly[k] = S.AC.createGain(); Ly[k].connect(out); }
  const sd = 60 / tr.bpm / 4;
  // Eco rítmico (corchea con puntillo) para el arpegio y la melodía
  const echo = S.AC.createDelay(1), fb = S.AC.createGain(), wet = S.AC.createGain();
  echo.delayTime.value = sd * 3; fb.gain.value = .32; wet.gain.value = .3;
  echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(out);
  Ly.arp.connect(echo); Ly.lead.connect(echo);
  MUSIC.last = {};
  return { id, tr, out, L: Ly, sd, step: 0, next: now + .1, mel: makeMelody(tr) };
}
function scheduleTrack(T) {
  const tr = T.tr, sd = T.sd;
  while (T.next < S.AC.currentTime + .2) {
    const st = T.step % 16, t = T.next + (st % 2 && tr.swing ? tr.swing * sd : 0), bar = Math.floor(T.step / 16), deg = tr.prog[bar % tr.prog.length];
    const chord = k => degToMidi(tr, deg + k, 0);
    // Pad: acorde sostenido con dos sierras desafinadas
    if (st === 0) for (const k of [0, 2, 4]) for (const dt of [-7, 7])
      mOsc(T.L.pad, t, mtof(chord(k) + 24), sd * 16, "sawtooth", .028 * (tr.padVol || 1), { detune: dt, attack: sd * 5, release: sd * 17, lp: 1300 });
    // Bajo
    const b = tr.bass[st];
    if (b !== ".") mOsc(T.L.bass, t, mtof(chord(b === "5" ? 4 : 0) + (b === "o" ? 12 : 0)), sd * 1.7, tr.wave === "sine" ? "triangle" : "sawtooth", .2, { lp: 820, lpEnv: 180, q: 5 });
    // Batería
    if (tr.kick[st] !== ".") mOsc(T.L.drums, t, 150, .3, "sine", .85, { slide: 40 });
    const fill = bar % 8 === 7 && st >= 12;
    if (tr.snare[st] !== "." || fill) {
      const acc = tr.snare[st] === "X" ? 1.25 : fill ? .7 : 1;
      mNoise(T.L.drums, t, .18, .3 * acc, "highpass", 1400); mOsc(T.L.drums, t, 190, .1, "triangle", .18 * acc, { slide: 120 });
    }
    if (tr.hat[st] !== ".") mNoise(T.L.hat, t, st % 4 === 2 ? .09 : .04, .1, "highpass", 7000);
    // Arpegio
    if (st % tr.arp === 0) {
      const tones = [0, 2, 4, 7, 4, 2], i = (st / tr.arp) % tones.length;
      mOsc(T.L.arp, t, mtof(degToMidi(tr, deg + tones[i], tr.arpOct)), sd * 1.4, tr.wave === "sine" ? "triangle" : "square", .04, { lp: 2600, lpEnv: 700 });
    }
    // Melodía principal
    for (const nt of T.mel[bar % 4]) if (nt.s === st) {
      const f = mtof(degToMidi(tr, deg + nt.deg, 3));
      mOsc(T.L.lead, t, f, sd * nt.len, tr.leadWave || "square", .055 * tr.lead, { lp: 3200, attack: .01, release: sd * nt.len });
      if (tr.boss) mOsc(T.L.lead, t, f, sd * nt.len, "sawtooth", .035, { detune: 9, lp: 2400, attack: .01, release: sd * nt.len });
    }
    T.step++; T.next += sd;
    if (T.next < S.AC.currentTime) T.next = S.AC.currentTime + .05; // si la pestaña estuvo en segundo plano
  }
}
function musicVolume() { const m = S.profile.music || {}; return m.on === false ? 0 : (m.vol ?? .55); }
function desiredTrack() {
  if (S.state === "dead") return null;
  if ((S.state === "playing" || S.state === "paused") && S.LV) return trackFor(S.sector, S.LV.boss);
  return "menu";
}
function setLayer(T, k, v) {
  if (Math.abs((MUSIC.last[k] ?? -1) - v) < .02) return;
  MUSIC.last[k] = v; T.L[k].gain.setTargetAtTime(v, S.AC.currentTime, .3);
}
function musicUpdate(dt) {
  if (!S.AC) return;
  if (!MUSIC.bus) { MUSIC.bus = S.AC.createGain(); MUSIC.bus.gain.value = 0; MUSIC.bus.connect(S.AC.destination); MUSIC.busV = -1; }
  const want = desiredTrack();
  if (want !== MUSIC.want) {
    MUSIC.want = want;
    if (MUSIC.cur) {
      const old = MUSIC.cur.out;
      old.gain.cancelScheduledValues(S.AC.currentTime); old.gain.setTargetAtTime(0, S.AC.currentTime, .35);
      setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 4000);
    }
    MUSIC.cur = want ? startTrack(want) : null;
    if (want && want !== "menu" && S.state === "playing") msg(`♪ ${getTrack(want).name}`, "#c9a7ff");
  }
  const busV = musicVolume() * (S.state === "paused" || S.state === "shop" ? .45 : 1) * .9;
  if (Math.abs(busV - MUSIC.busV) > .01) { MUSIC.busV = busV; MUSIC.bus.gain.setTargetAtTime(busV, S.AC.currentTime, .15); }
  const T = MUSIC.cur;
  if (!T) return;
  const combat = S.state === "playing" && player.combatT < 3;
  const bossOn = S.enemies.some(e => EDEF[e.type].boss && e.alert && !e.dead);
  const target = T.tr.boss ? (bossOn ? 1 : .45) : T.id === "menu" ? .5 : combat ? 1 : .2;
  MUSIC.inten += (target - MUSIC.inten) * Math.min(1, dt * 1.5);
  const i = MUSIC.inten;
  setLayer(T, "drums", .35 + .65 * i); setLayer(T, "hat", i); setLayer(T, "lead", Math.max(0, i * 1.3 - .3));
  setLayer(T, "pad", 1 - .35 * i); setLayer(T, "bass", .6 + .4 * i); setLayer(T, "arp", .7 + .3 * i);
  scheduleTrack(T);
}
function toggleMusic() {
  S.profile.music = S.profile.music || { vol: .55, on: true };
  S.profile.music.on = S.profile.music.on === false; saveProfile(); audioInit();
  if (S.state === "playing") msg(S.profile.music.on ? "Música activada" : "Música silenciada", "#c9a7ff");
  ov.querySelectorAll("[data-act=mute]").forEach(b => b.textContent = S.profile.music.on ? "SILENCIAR" : "ACTIVAR");
}
const AUDIO_HTML = () => `<div class="row audio"><span class="sub">♪ MÚSICA</span>
  <input type="range" min="0" max="100" value="${Math.round(((S.profile.music || {}).vol ?? .55) * 100)}" data-vol aria-label="Volumen de la música">
  <button class="btn ghost sm" data-act="mute">${(S.profile.music || {}).on === false ? "ACTIVAR" : "SILENCIAR"}</button></div>`;

export { SCALES, TRACKS, PAT, TN_A, TN_B, genTrack, getTrack, trackFor, mtof, degToMidi, makeMelody, getNoise, mOsc, mNoise, MUSIC, startTrack, scheduleTrack, musicVolume, desiredTrack, setLayer, musicUpdate, toggleMusic, AUDIO_HTML };
