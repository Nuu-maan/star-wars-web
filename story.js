gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const acts = [...document.querySelectorAll('.act')];
const veil = document.getElementById('veil');
const clamp = gsap.utils.clamp;
const isStatic = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isStatic) root.classList.add('static');

/* ---------------------------------------------------------------- keyframes */

function parseKeys(s) {
  const keys = [];
  s.split(';').forEach(chunk => {
    const k = { ...keys[keys.length - 1] };
    chunk.trim().split(/\s+/).forEach(pair => { const [n, v] = pair.split(':'); k[n] = +v; });
    keys.push(k);
  });
  return keys;
}

// stacked fromTo tweens on one property: only the first may render immediately,
// otherwise the last tween's start values win before the first scrub.
function keyframes(tl, el, keys, vars, ease) {
  keys.forEach((k, i) => {
    const next = keys[i + 1];
    if (next) tl.fromTo(el, vars(k),
      { ...vars(next), duration: next.t - k.t, ease, immediateRender: i === 0 }, k.t);
    else if (!i) tl.set(el, vars(k), k.t);
  });
}

/* ------------------------------------------------------------------- camera */

// fx/fy are the point of the plate we want under the middle of the frame.
// `lead` is where the un-scaled plate starts inside the frame, which is not the
// same on both axes: the plate is centred horizontally but hangs from the top,
// so a symmetric clamp would let an edge slide into shot on a tall plate.
function pan(focus, s, size, lead, view) {
  const centre = lead + size / 2;
  const ideal = view / 2 - centre - s * size * (focus / 100 - .5);
  const forward = s * size / 2 - centre;          // leading edge flush with the frame
  const back = view - centre - s * size / 2;      // trailing edge flush with the frame
  return clamp(Math.min(forward, back), Math.max(forward, back), ideal) / size * 100;
}

const camVars = (stage, view) => k => ({
  scale: k.s,
  xPercent: () => pan(k.fx, k.s, stage.clientWidth,
    (view.clientWidth - stage.clientWidth) / 2, view.clientWidth),
  yPercent: () => pan(k.fy, k.s, stage.clientHeight, 0, view.clientHeight),
});

const layerVars = stage => k => {
  const v = {};
  if ('o' in k) v.opacity = k.o;
  if ('s' in k) v.scale = k.s;
  if ('x' in k) v.x = () => k.x / 100 * stage.clientWidth;
  if ('y' in k) v.y = () => k.y / 100 * stage.clientHeight;
  return v;
};

/* -------------------------------------------------------------------- plates */

function preload(act) {
  if (!act) return;
  act.querySelectorAll('img[data-src]').forEach(img => {
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.decode().catch(() => {});
  });
}

/* ----------------------------------------------------------------- lettering */

const ORIGIN = { tl: '0% 0%', tr: '100% 0%', bl: '0% 100%', br: '100% 100%', tc: '50% 0%', bc: '50% 100%' };
const POP = '.caption, .balloon, .sfx, .inset, .play, .fragments';

// one panel of lettering: snaps in on its cue, lifts away on its cut.
function beat(tl, el, start, end) {
  const cue = Math.max(.008, end - start);
  const d = Math.min(.034, cue * .3);
  const pop = el.matches(POP);
  const hidden = { autoAlpha: 0, y: pop ? 26 : 14, scale: pop ? .92 : 1, rotation: pop ? -1.4 : 0 };
  const shown = { autoAlpha: 1, y: 0, scale: 1, rotation: 0 };

  gsap.set(el, { transformOrigin: ORIGIN[[...el.classList].find(c => ORIGIN[c])] || '50% 50%' });

  if (start <= 0) {
    gsap.set(el, shown);          // visible before the first scrub ever renders
    tl.set(el, shown, 0);
  } else {
    tl.fromTo(el, hidden, { ...shown, duration: d, ease: 'back.out(1.5)' }, start);
  }

  if (end < 1) {
    tl.fromTo(el, shown,
      { autoAlpha: 0, y: -16, scale: .97, duration: d * .8, ease: 'power2.in', immediateRender: false }, end);
  }
}

/* -------------------------------------------------------------------- acts */

function build(act, i) {
  const view = act.querySelector('.act__sticky');
  const stage = act.querySelector('.stage');
  const range = +act.dataset.range || 0;
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  keyframes(tl, act.querySelector('.camera'), parseKeys(act.dataset.cam), camVars(stage, view), 'power1.inOut');

  const drift = [];
  act.querySelectorAll('.layer').forEach(layer => {
    const keys = layer.dataset.key && parseKeys(layer.dataset.key);
    if (keys) keyframes(tl, layer, keys, layerVars(stage), 'sine.inOut');
    if (!keys || !('y' in keys[0])) {
      tl.fromTo(layer, { y: 0 },
        { y: () => -(+layer.dataset.depth || 0) * range / 100 * stage.clientHeight, duration: 1 }, 0);
    }
    if (+layer.dataset.depth >= 1.5) drift.push(layer);
  });

  act.querySelectorAll('.scene').forEach(scene => {
    const from = +scene.dataset.from, span = +scene.dataset.to - from;
    scene.querySelectorAll('[data-in]').forEach(el => {
      const out = +el.dataset.out;
      beat(tl, el, from + span * +el.dataset.in, out >= 1 ? 1 : from + span * out);
    });
    if ('resolve' in scene.dataset) {
      const at = parseFloat(scene.dataset.resolve) || 0;
      tl.call(() => reveal(act, at ? 'fast' : 'instant'), [], from + span * at);
    }
  });
  tl.set({}, {}, 1);

  // foreground rock and arch layers lag a touch behind a fast scroll
  const lag = drift.length ? gsap.quickTo(drift, 'yPercent', { duration: .5, ease: 'power2' }) : null;

  ScrollTrigger.create({
    trigger: act,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    animation: tl,
    invalidateOnRefresh: true,
    onEnter: () => preload(acts[i + 1]),
    onUpdate: self => lag && lag(clamp(-2, 2, self.getVelocity() / 1400)),
    onToggle: self => act.classList.toggle('is-active', self.isActive),
  });

  if (i) chapterCard(act, i + 1);
}

// the black between acts, with its title card
function chapterCard(act, n) {
  const chapter = veil.querySelector(`[data-chapter="${n}"]`);
  const eyebrow = chapter.querySelector('.chapter__eyebrow');
  const chars = SplitText.create(chapter.querySelector('.chapter__title'), { type: 'chars' }).chars;

  gsap.timeline({ scrollTrigger: { trigger: act, start: 'top bottom+=70%', end: 'top top-=70%', scrub: .8 } })
    .fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 70, ease: 'power1.in' }, 0)
    .fromTo(chapter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 10, ease: 'none' }, 45)
    .fromTo(eyebrow, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 40, ease: 'power2.out' }, 45)
    .fromTo(chars, { autoAlpha: 0, yPercent: 110, rotation: -10 },
      { autoAlpha: 1, yPercent: 0, rotation: 0, duration: 45, ease: 'back.out(2)', stagger: { amount: 42 } }, 58)
    .fromTo(chapter, { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: -26, duration: 45, ease: 'power2.in', immediateRender: false }, 168)
    .fromTo(veil, { autoAlpha: 1 }, { autoAlpha: 0, duration: 70, ease: 'power1.out', immediateRender: false }, 178);
}

/* -------------------------------------------------------------- transmission */

// mode: 'full' (the button was pressed) | 'fast' (scrolled past it) | 'instant'
function reveal(act, mode) {
  const btn = act.querySelector('[data-reveal]');
  if (!btn || act.classList.contains('is-played')) return;
  act.classList.add('is-played');
  btn.setAttribute('aria-expanded', 'true');

  const holo = act.querySelector('.holo');
  const lines = [...act.querySelectorAll('.fragment')];
  if (mode === 'instant' || isStatic) return lines.forEach(l => l.classList.add('is-shown'));

  const gap = mode === 'fast' ? .34 : 1.9;
  const tl = gsap.timeline();

  if (holo) {
    tl.fromTo(holo, { autoAlpha: 0, scaleX: .55, scaleY: .06, y: 44 },
      { autoAlpha: .9, scaleX: 1, scaleY: 1, y: 0, duration: .55, ease: 'power3.out' })
      .fromTo(holo, { autoAlpha: .95 }, { autoAlpha: .3, duration: .05, repeat: 9, yoyo: true, ease: 'steps(1)' })
      .to(holo, { autoAlpha: 1, duration: .45 })
      .add(() => gsap.to(holo, { opacity: .84, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
  }

  let at = holo ? (mode === 'fast' ? .5 : 1.4) : .15;
  lines.forEach(line => {
    tl.add(() => {
      line.classList.add('is-shown');
      const split = SplitText.create(line, { type: 'words' });
      gsap.timeline({ onComplete: () => split.revert() })
        .from(line, { autoAlpha: 0, y: 18, scale: .94, duration: .4, ease: 'back.out(1.7)' })
        .from(split.words, { autoAlpha: 0, y: 9, duration: .3, stagger: .03, ease: 'power2.out' }, .12);
    }, at);
    at += gap;
  });
}

document.querySelectorAll('[data-reveal]').forEach(btn =>
  btn.addEventListener('click', () => reveal(btn.closest('.act'), 'full')));

/* ------------------------------------------------------------------ chrome */

function ambient() {
  gsap.fromTo('#progress', { scaleX: 0 },
    { scaleX: 1, ease: 'none', scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: .4 } });

  gsap.to('.l-dust', { xPercent: -3, duration: 40, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.l-suns', { opacity: .86, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.l-suns', { scale: 1.035, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // the frame breathes a little under the pointer
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const x = gsap.quickTo('.stage', 'x', { duration: .9, ease: 'power3' });
    const y = gsap.quickTo('.stage', 'y', { duration: .9, ease: 'power3' });
    addEventListener('pointermove', e => {
      x((e.clientX / innerWidth - .5) * 22);
      y((e.clientY / innerHeight - .5) * 14);
    }, { passive: true });
  }
}

// the title card is the one piece of lettering that plays itself
function openOnTitle() {
  const title = document.querySelector('.title'), hint = document.querySelector('.hint');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo(title, { scale: 1.16, autoAlpha: 0, y: 24 }, { scale: 1, autoAlpha: 1, y: 0, duration: 1.2 })
    .fromTo(hint, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7 }, '-=.5');
}

document.querySelector('.skip').addEventListener('click', () => {
  root.classList.add('static');
  ScrollTrigger.getAll().forEach(t => t.kill());
  gsap.globalTimeline.clear();
  gsap.set('.camera, .layer, .holo, .stage, [data-in], #veil, .chapter', { clearProps: 'all' });
  acts.forEach(preload);
  acts.forEach(act => reveal(act, 'instant'));
  scrollTo(0, 0);
});

/* -------------------------------------------------------------------- boot */

const ready = { built: false, plates: false };
function open(which) {
  ready[which] = true;
  if (ready.built && ready.plates) openOnTitle();
}

function start() {
  acts.forEach(build);
  ambient();
  ScrollTrigger.refresh();
  open('built');
}

if (isStatic) {
  acts.forEach(preload);
  acts.forEach(act => reveal(act, 'instant'));
} else {
  // SplitText measures glyphs, so wait for the webfonts (but never forever)
  Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 2500)),
  ]).then(start);
}

const first = [...acts[0].querySelectorAll('img')];
Promise.all(first.map(img => img.decode().catch(() => {}))).then(() => {
  root.classList.add('is-ready');
  if (!isStatic) { ScrollTrigger.refresh(); open('plates'); }
  preload(acts[1]);
});
