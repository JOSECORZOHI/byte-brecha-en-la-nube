// Efectos de sonido sintetizados con Web Audio.
import { S } from "../core/store.js";
import { rr } from "../core/config.js";

S.AC = null; S.noiseBuf = null;
function audioInit() { if (!S.AC) { try { S.AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { S.AC = null; } } if (S.AC && S.AC.state === "suspended") S.AC.resume(); }
function tone(f, dur, type = "square", vol = .2, f2 = null, delay = 0) {
  if (!S.AC) return;
  const t = S.AC.currentTime + delay, o = S.AC.createOscillator(), g = S.AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(S.AC.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .3, freq = 1200, delay = 0) {
  if (!S.AC) return;
  if (!S.noiseBuf) { S.noiseBuf = S.AC.createBuffer(1, S.AC.sampleRate * 1.5, S.AC.sampleRate); const d = S.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = S.AC.currentTime + delay, s = S.AC.createBufferSource(), fl = S.AC.createBiquadFilter(), g = S.AC.createGain();
  s.buffer = S.noiseBuf; fl.type = "lowpass"; fl.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(fl).connect(g).connect(S.AC.destination); s.start(t); s.stop(t + dur + .05);
}
function sfx(name, dist = 0) {
  const v = 1 / (1 + dist * .25);
  switch (name) {
    case "pistol": tone(880, .12, "square", .12 * v, 220); noise(.08, .15 * v, 3000); break;
    case "smg": tone(1000, .05, "square", .07, 300); noise(.05, .12, 3500); break;
    case "shotgun": noise(.35, .4 * v, 1400); tone(120, .25, "sawtooth", .2 * v, 40); break;
    case "plasma": tone(1400, .09, "sawtooth", .08 * v, 500); break;
    case "rocketfire": noise(.4, .3, 600); tone(150, .4, "sawtooth", .15, 50); break;
    case "rail": tone(300, .25, "sawtooth", .12, 3000); noise(.3, .25, 6000); break;
    case "tesla": noise(.08, .12, 8000); tone(rr(800, 1400), .06, "square", .06); break;
    case "voidfire": tone(120, .5, "sine", .25, 40); tone(60, .6, "sawtooth", .08, 30); break;
    case "void": tone(80, 1.2, "sine", .3, 30); break;
    case "wrench": noise(.12, .12, 600); break;
    case "hitwall": noise(.05, .06 * v, 4000); break;
    case "door": tone(70, .5, "sawtooth", .1 * v, 50); noise(.5, .06 * v, 400); break;
    case "locked": tone(200, .12, "square", .15); tone(150, .2, "square", .15, null, .13); break;
    case "pickup": tone(660, .07, "square", .1); tone(990, .1, "square", .1, null, .07); break;
    case "coin": tone(1400, .05, "square", .05); tone(2100, .06, "square", .05, null, .04); break;
    case "weapon": [440, 660, 880, 1320].forEach((f, i) => tone(f, .1, "square", .1, null, i * .07)); break;
    case "key": [523, 784, 1046].forEach((f, i) => tone(f, .15, "triangle", .2, null, i * .1)); break;
    case "buy": [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, .1, "square", .08, null, i * .05)); break;
    case "deny": tone(150, .15, "square", .1); break;
    case "alert": tone(300, .15, "square", .12 * v, 600); tone(600, .15, "square", .12 * v, 300, .15); break;
    case "eshoot": tone(500, .2, "sawtooth", .12 * v, 120); break;
    case "laser": tone(1800, .08, "square", .05 * v, 900); break;
    case "rocket": noise(.3, .25 * v, 800); tone(200, .3, "sawtooth", .12 * v, 60); break;
    case "snipe": noise(.15, .35 * v, 5000); tone(2200, .15, "sawtooth", .12 * v, 400); break;
    case "charge": tone(300, 1.1, "sine", .08 * v, 1600); break;
    case "blink": tone(1500, .2, "sine", .1 * v, 200); break;
    case "roar": tone(70, .9, "sawtooth", .25, 40); noise(.8, .2, 500); break;
    case "split": tone(400, .15, "square", .1 * v, 900); break;
    case "slash": noise(.1, .2 * v, 2000); tone(300, .1, "square", .1 * v, 100); break;
    case "epain": tone(400, .1, "square", .12 * v, 250); break;
    case "edeath": tone(600, .4, "sawtooth", .15 * v, 60); noise(.3, .1 * v, 1500); break;
    case "boom": noise(.8, .55 * v, 700); tone(90, .6, "sine", .4 * v, 30); break;
    case "hurt": tone(220, .15, "square", .18, 110); break;
    case "death": tone(400, 1.2, "sawtooth", .2, 40); noise(1, .2, 800); break;
    case "exit": [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, .18, "square", .12, null, i * .1)); break;
    case "empty": tone(120, .06, "square", .1); break;
    case "magout": tone(320, .06, "square", .1, 160); noise(.05, .12, 3000); break;
    case "magin": noise(.04, .16, 5000); tone(520, .05, "square", .1); break;
    case "cock": noise(.04, .18, 4500); tone(900, .04, "square", .08, null, .06); noise(.04, .14, 4500, .07); break;
    case "shell": tone(700, .04, "triangle", .12); noise(.03, .12, 5000); break;
    case "cellout": tone(1200, .25, "sine", .1, 180); break;
    case "cellin": tone(180, .3, "sine", .12, 1400); break;
    case "rockin": tone(200, .2, "square", .1, 120); noise(.1, .1, 2000); break;
    case "regen": tone(660, .12, "sine", .08); tone(990, .16, "sine", .08, null, .1); break;
    case "hit": tone(1700, .03, "square", .04); break;
    case "kill": tone(900, .06, "square", .07); tone(1400, .08, "square", .07, null, .05); break;
    case "ui": tone(1200, .04, "square", .05); break;
  }
}

export { audioInit, tone, noise, sfx };
