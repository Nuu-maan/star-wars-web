gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const acts = [...document.querySelectorAll('.act')];
const veil = document.getElementById('veil');
const isStatic = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isStatic) root.classList.add('static');

function parseKeys(s) {
  const keys = [];
  s.split(';').forEach(chunk => {
    const k = { ...keys[keys.length - 1] };
    chunk.trim().split(/\s+/).forEach(pair => { const [n, v] = pair.split(':'); k[n] = +v; });
    keys.push(k);
  });
  return keys;
}

function keyframes(tl, el, keys, vars) {
  keys.forEach((k, i) => {
    const next = keys[i + 1];
    if (next) tl.fromTo(el, vars(k), { ...vars(next), duration: next.t - k.t, ease: 'sine.inOut' }, k.t);
    else if (!i) tl.set(el, vars(k), k.t);
  });
}

const camVars = k => ({ scale: k.s, xPercent: (50 - k.fx) * (k.s - 1), yPercent: (50 - k.fy) * (k.s - 1) });

const layerVars = stage => k => {
  const v = {};
  if ('o' in k) v.opacity = k.o;
  if ('s' in k) v.scale = k.s;
  if ('x' in k) v.x = () => k.x / 100 * stage.clientWidth;
  if ('y' in k) v.y = () => k.y / 100 * stage.clientHeight;
  return v;
};

function preload(act) {
  if (!act) return;
  act.querySelectorAll('img[data-src]').forEach(img => {
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.decode().catch(() => {});
  });
}

function beat(tl, el, start, end) {
  if (start <= 0) tl.set(el, { opacity: 1, y: 0 }, 0);
  else tl.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .012, ease: 'power2.out' }, start);
  if (end < 1) tl.fromTo(el, { opacity: 1, y: 0 }, { opacity: 0, y: -10, duration: .01, ease: 'power2.in', immediateRender: false }, end);
}

function build(act, i) {
  const stage = act.querySelector('.stage');
  const range = +act.dataset.range || 0;
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  keyframes(tl, act.querySelector('.camera'), parseKeys(act.dataset.cam), camVars);

  act.querySelectorAll('.layer').forEach(layer => {
    const keys = layer.dataset.key && parseKeys(layer.dataset.key);
    if (keys) keyframes(tl, layer, keys, layerVars(stage));
    if (!keys || !('y' in keys[0])) {
      tl.fromTo(layer, { y: 0 }, { y: () => -(+layer.dataset.depth || 0) * range / 100 * stage.clientHeight, duration: 1 }, 0);
    }
  });

  act.querySelectorAll('.scene').forEach(scene => {
    const from = +scene.dataset.from, span = +scene.dataset.to - from;
    scene.querySelectorAll('[data-in]').forEach(el => {
      const out = +el.dataset.out;
      beat(tl, el, from + span * +el.dataset.in, out >= 1 ? 1 : from + span * out);
    });
    if ('resolve' in scene.dataset) tl.call(() => reveal(act, true), [], from);
  });
  tl.set({}, {}, 1);

  ScrollTrigger.create({
    trigger: act,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    animation: tl,
    invalidateOnRefresh: true,
    onEnter: () => preload(acts[i + 1]),
    onToggle: self => act.classList.toggle('is-active', self.isActive),
  });

  if (i) {
    const chapter = veil.querySelector(`[data-chapter="${i + 1}"]`);
    gsap.timeline({ scrollTrigger: { trigger: act, start: 'top bottom+=70%', end: 'top top-=70%', scrub: true } })
      .fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 70, ease: 'none' }, 0)
      .fromTo(chapter, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 60, ease: 'power2.out' }, 30)
      .fromTo(chapter, { opacity: 1, y: 0 }, { opacity: 0, y: -30, duration: 50, ease: 'power2.in', immediateRender: false }, 150)
      .fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 70, ease: 'none', immediateRender: false }, 170);
  }
}

function reveal(act, instant) {
  const btn = act.querySelector('[data-reveal]');
  if (!btn || act.classList.contains('is-played')) return;
  act.classList.add('is-played');
  btn.setAttribute('aria-expanded', 'true');
  const holo = act.querySelector('.holo');
  const lines = [...act.querySelectorAll('.fragment')];
  if (instant || isStatic) return lines.forEach(l => l.classList.add('is-shown'));

  const tl = gsap.timeline();
  if (holo) {
    tl.fromTo(holo, { opacity: 0, scaleY: .15, y: 30 }, { opacity: .9, scaleY: 1, y: 0, duration: .5, ease: 'power3.out' })
      .fromTo(holo, { opacity: .9 }, { opacity: .3, duration: .06, repeat: 7, yoyo: true, ease: 'steps(1)' })
      .to(holo, { opacity: 1, duration: .5 })
      .add(() => gsap.to(holo, { opacity: .82, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
  }
  let at = holo ? 1.4 : .1;
  lines.forEach(line => {
    tl.add(() => {
      line.classList.add('is-shown');
      gsap.from(line, { opacity: 0, y: 14, duration: .5, ease: 'power2.out' });
    }, at);
    at += 1.9;
  });
}

document.querySelectorAll('[data-reveal]').forEach(btn =>
  btn.addEventListener('click', () => reveal(btn.closest('.act'), false)));

document.querySelector('.skip').addEventListener('click', () => {
  root.classList.add('static');
  ScrollTrigger.getAll().forEach(t => t.kill());
  gsap.globalTimeline.clear();
  gsap.set('.camera, .layer, .holo, [data-in], #veil, .chapter', { clearProps: 'all' });
  acts.forEach(preload);
});

if (isStatic) {
  acts.forEach(preload);
} else {
  acts.forEach(build);
  gsap.fromTo('#progress', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: true } });
  gsap.to('.l-dust', { xPercent: -3, duration: 40, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.l-suns', { opacity: .85, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

const first = [...acts[0].querySelectorAll('img')];
Promise.all(first.map(img => img.decode().catch(() => {}))).then(() => {
  root.classList.add('is-ready');
  if (!isStatic) ScrollTrigger.refresh();
  preload(acts[1]);
});
