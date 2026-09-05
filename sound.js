const soundRoot = document.documentElement;
const soundBtn = document.querySelector('.auto__sound');
const soundOn = () => soundRoot.classList.contains('sound');

const BEDS = [
  { wind: .9, cutoff: 900, hum: 0 },
  { wind: .35, cutoff: 500, hum: .08 },
  { wind: 1, cutoff: 1300, hum: 0 },
];
const target = { wind: 0, cutoff: 400, hum: 0, engine: 0, engineTone: 0 };

let ctx, master, windGain, windFilter, humGain, engineGain, engineFilter, engineOsc, noiseBuf;

function chain(...nodes) { nodes.reduce((a, b) => (a.connect(b), b)); }

function noise() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = new AudioBufferSourceNode(ctx, { buffer: noiseBuf, loop: true });
  src.start();
  return src;
}

function boot() {
  ctx = new AudioContext();
  master = new GainNode(ctx, { gain: 0 });
  chain(master, new DynamicsCompressorNode(ctx, { threshold: -18, ratio: 6 }), ctx.destination);
  soundRoot.classList.add('sound-live');

  windFilter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 400, Q: .7 });
  windGain = new GainNode(ctx, { gain: 0 });
  chain(noise(), new BiquadFilterNode(ctx, { type: 'highpass', frequency: 140 }), windFilter, windGain, master);
  const gust = new OscillatorNode(ctx, { frequency: .07 });
  chain(gust, new GainNode(ctx, { gain: 300 }), windFilter.frequency);
  gust.start();

  humGain = new GainNode(ctx, { gain: 0 });
  humGain.connect(master);
  [110, 165.5].forEach(f => {
    const o = new OscillatorNode(ctx, { type: 'triangle', frequency: f });
    o.connect(humGain);
    o.start();
  });

  engineOsc = new OscillatorNode(ctx, { type: 'sawtooth', frequency: 70 });
  engineFilter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 200, Q: 2 });
  engineGain = new GainNode(ctx, { gain: 0 });
  chain(engineOsc, engineFilter, engineGain, master);
  engineOsc.start();

  gsap.ticker.add(tick);
}

function tick() {
  const t = ctx.currentTime;
  const boost = window.lenis ? gsap.utils.clamp(0, 1, Math.abs(lenis.velocity) / 60) : 0;
  windGain.gain.setTargetAtTime(target.wind * (1 + boost), t, .3);
  windFilter.frequency.setTargetAtTime(target.cutoff * (1 + 1.5 * boost), t, .3);
  humGain.gain.setTargetAtTime(target.hum, t, .3);
  engineGain.gain.setTargetAtTime(target.engine, t, .15);
  engineFilter.frequency.setTargetAtTime(200 + 700 * target.engineTone, t, .15);
  engineOsc.frequency.setTargetAtTime(70 + 20 * target.engineTone, t, .15);
}

function holo() {
  const t = ctx.currentTime;
  const g = new GainNode(ctx, { gain: 0 });
  g.connect(master);
  const trem = new OscillatorNode(ctx, { frequency: 9 });
  chain(trem, new GainNode(ctx, { gain: .025 }), g.gain);
  trem.start();
  trem.stop(t + 9);
  [196, 198.5, 392].forEach(f => {
    const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: f });
    chain(o, new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 700 }), g);
    o.start();
    o.stop(t + 9);
  });
  g.gain.linearRampToValueAtTime(.1, t + 1.5);
  g.gain.setValueAtTime(.1, t + 6);
  g.gain.linearRampToValueAtTime(0, t + 8.5);
}

function click() {
  const t = ctx.currentTime;
  const src = noise();
  const g = new GainNode(ctx, { gain: .1 });
  chain(src, new BiquadFilterNode(ctx, { type: 'highpass', frequency: 2500 }), g, master);
  g.gain.exponentialRampToValueAtTime(.001, t + .04);
  src.stop(t + .05);
}

function setSound(on) {
  soundRoot.classList.toggle('sound', on);
  soundBtn.setAttribute('aria-pressed', on);
  try { localStorage.sound = on ? '1' : ''; } catch {}
  if (!ctx) { if (!on) return; boot(); }
  if (on) ctx.resume();
  master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, .4);
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
      if (i === 2) {
        target.engineTone = p < .48 ? Math.sin(Math.PI * p / .48) : 0;
        target.engine = .18 * target.engineTone;
      }
    },
  }));
  Object.assign(target, BEDS[0]);

  new MutationObserver(() => ctx && soundOn() && acts[1].classList.contains('is-played') && holo())
    .observe(acts[1], { attributeFilter: ['class'] });

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
