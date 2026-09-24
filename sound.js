const soundRoot = document.documentElement;
const soundBtn = document.querySelector('.auto__sound');
const soundOn = () => soundRoot.classList.contains('sound');

const BEDS = [
  { wind: .9, cutoff: 900, hum: 0 },
  { wind: .49, cutoff: 500, hum: .11 },
  { wind: .69, cutoff: 1300, hum: 0 },
  { wind: .97, cutoff: 700, hum: .15 },
  { wind: .18, cutoff: 300, hum: .21 },
  { wind: 1, cutoff: 1600, hum: 0 },
  { wind: .85, cutoff: 1100, hum: .05 },
  { wind: .13, cutoff: 300, hum: .16 },
  { wind: .6, cutoff: 1300, hum: .06 },
  { wind: .14, cutoff: 300, hum: .21 },
  { wind: .18, cutoff: 400, hum: .23 },
  { wind: .12, cutoff: 300, hum: .16 },
];
const target = { wind: 0, cutoff: 400, hum: 0, engine: 0, engineTone: 0 };

let ctx, master, windGain, windFilter, humGain, engineGain, engineFilter, engineOsc, brownBuf, whiteBuf;

function chain(...nodes) { nodes.reduce((a, b) => (a.connect(b), b)); }

function buffer(brown) {
  const buf = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const white = Math.random() * 2 - 1;
      d[i] = brown ? (last = (last + .02 * white) / 1.02) * 3.5 : white;
    }
  }
  return buf;
}

function noise(brown = true) {
  const buf = brown ? (brownBuf ||= buffer(true)) : (whiteBuf ||= buffer(false));
  const src = new AudioBufferSourceNode(ctx, { buffer: buf, loop: true });
  src.start();
  return src;
}

function lfo(frequency, depth, param) {
  const o = new OscillatorNode(ctx, { frequency });
  chain(o, new GainNode(ctx, { gain: depth }), param);
  o.start();
}

function boot() {
  ctx = new AudioContext();
  master = new GainNode(ctx, { gain: 0 });
  chain(master, new DynamicsCompressorNode(ctx, { threshold: -24, knee: 12, ratio: 3 }), ctx.destination);
  soundRoot.classList.add('sound-live');

  const gust = new GainNode(ctx, { gain: 1 });
  lfo(.07, .3, gust.gain);
  lfo(.19, .12, gust.gain);
  windFilter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 400, Q: .5 });
  lfo(.05, 90, windFilter.frequency);
  windGain = new GainNode(ctx, { gain: 0 });
  chain(noise(), new BiquadFilterNode(ctx, { type: 'highpass', frequency: 60 }), windFilter, gust, windGain, master);

  humGain = new GainNode(ctx, { gain: 0 });
  humGain.connect(master);
  [[55, .5], [110, .35], [165, .15]].forEach(([frequency, level]) => {
    const o = new OscillatorNode(ctx, { frequency });
    chain(o, new GainNode(ctx, { gain: level }), humGain);
    o.start();
  });

  engineGain = new GainNode(ctx, { gain: 0 });
  engineGain.connect(master);
  engineFilter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 120, Q: .8 });
  chain(noise(), engineFilter, new GainNode(ctx, { gain: 1.6 }), engineGain);
  engineOsc = new OscillatorNode(ctx, { frequency: 45 });
  chain(engineOsc, new GainNode(ctx, { gain: .5 }), engineGain);
  engineOsc.start();

  gsap.ticker.add(tick);
}

// scheduling every frame piles automation events onto the params (and crackles in Firefox),
// so a param is only re-aimed when its target actually moves
function glide(param, value, time) {
  value = Math.round(value * 1000) / 1000;
  if (param.aim === value) return;
  param.aim = value;
  param.setTargetAtTime(value, ctx.currentTime, time);
}

function tick() {
  const boost = lenis ? Math.round(gsap.utils.clamp(0, 1, Math.abs(lenis.velocity) / 60) * 10) / 10 : 0;
  glide(windGain.gain, target.wind * .7 * (1 + .4 * boost), .5);
  glide(windFilter.frequency, target.cutoff * .7 * (1 + .5 * boost), .5);
  glide(humGain.gain, target.hum, .3);
  glide(engineGain.gain, target.engine, .15);
  glide(engineFilter.frequency, 120 + 500 * target.engineTone, .15);
  glide(engineOsc.frequency, 45 + 25 * target.engineTone, .15);
}

function holo() {
  const t = ctx.currentTime;
  const g = new GainNode(ctx, { gain: 0 });
  g.connect(master);
  const trem = new OscillatorNode(ctx, { frequency: 7 });
  chain(trem, new GainNode(ctx, { gain: .02 }), g.gain);
  trem.start();
  trem.stop(t + 9);
  [196, 198.5, 294].forEach(f => {
    const o = new OscillatorNode(ctx, { type: 'triangle', frequency: f });
    chain(o, new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 900 }), g);
    o.start();
    o.stop(t + 9);
  });
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(.08, t + 1.5);
  g.gain.setValueAtTime(.08, t + 6);
  g.gain.linearRampToValueAtTime(0, t + 8.5);
}

function click() {
  const t = ctx.currentTime;
  const src = noise(false);
  const g = new GainNode(ctx, { gain: .1 });
  chain(src, new BiquadFilterNode(ctx, { type: 'highpass', frequency: 2500 }), g, master);
  g.gain.setValueAtTime(.1, t);
  g.gain.exponentialRampToValueAtTime(.001, t + .04);
  src.stop(t + .05);
}

function setSound(on) {
  soundRoot.classList.toggle('sound', on);
  soundBtn.setAttribute('aria-pressed', on);
  try { localStorage.sound = on ? '1' : ''; } catch {}
  if (!ctx) { if (!on) return; boot(); }
  if (on) ctx.resume();
  master.gain.setTargetAtTime(on ? .3 : 0, ctx.currentTime, .6);
}

if (!soundRoot.classList.contains('static')) {
  acts.forEach((act, i) => ScrollTrigger.create({
    trigger: act, start: 'top top', end: 'bottom bottom',
    onUpdate: self => {
      const p = self.progress;
      const edge = Math.min(1, i ? p / DIP : 1, i < acts.length - 1 ? (1 - p) / DIP : 1);
      target.wind = BEDS[i].wind * edge;
      target.cutoff = BEDS[i].cutoff;
      target.hum = BEDS[i].hum * edge;
      target.engineTone = i === 2 ? (p < .48 ? Math.sin(Math.PI * p / .48) : 0)
        : i === 4 ? clamp(0, 1, (p - .6) / .35) * edge
        : i === 6 ? clamp(0, 1, (.5 - p) / .4) * edge
        : i === 8 ? clamp(0, 1, (p - .44) / .14) * edge
        : i === 9 ? (p < .64 ? .5 : 0) * edge
        : i === 11 ? clamp(0, 1, (p - .6) / .16) * edge : 0;
      target.engine = (i === 4 ? .24 : .18) * target.engineTone;
      if (i === 4) target.wind += .8 * clamp(0, 1, (p - .85) / .12) * edge;
    },
  }));
  Object.assign(target, BEDS[0]);

  [acts[1], acts[5], acts[7]].forEach(act => {
    new MutationObserver(() => {
      if (!act.classList.contains('is-played') || act.dataset.sounded) return;
      act.dataset.sounded = 1;
      ctx && soundOn() && holo();
    }).observe(act, { attributeFilter: ['class'] });
  });

  document.querySelector('.auto').addEventListener('click', e => {
    if (ctx && soundOn() && e.target.closest('button') && !e.target.closest('.auto__sound')) click();
  });
  soundBtn.addEventListener('click', () => setSound(!soundOn()));
  document.querySelector('.skip').addEventListener('click', () => ctx && setSound(false));
  document.addEventListener('visibilitychange', () => {
    if (ctx) document.hidden ? ctx.suspend() : soundOn() && ctx.resume();
  });

  let wanted = true;
  try { wanted = localStorage.sound !== ''; } catch {}
  if (wanted) {
    soundBtn.setAttribute('aria-pressed', true);
    soundRoot.classList.add('sound');
    const resume = () => soundOn() && setSound(true);
    addEventListener('pointerup', resume, { once: true });
    addEventListener('keydown', resume, { once: true });
  }
}
