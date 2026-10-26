/**
 * Meteor shower on the fixed, full-viewport canvas#rain (night theme only).
 *
 * Each meteor starts at a point A on the top or left edge (picked in proportion to the flux through each edge, so
 * the sky fills evenly), heads lower-right at 25-40 degrees below the horizontal and ends at B, where its head
 * leaves the viewport. A crossing takes 8-14 s. The tail is 15-30 % of the viewport diagonal, tapered, fading from
 * a bright head (2 px core, soft glow) to transparent; it grows out from A, so a meteor lit mid-sky starts short.
 * A meteor fades in over its first FADE_IN s (its head glow a little larger in the first second) and fades out over
 * the last 15 % of its path.
 * Intensity 0-100 (slider #rain-slider, localStorage "rain", default 50) sets how many fly at once, not their speed:
 * 0 none (loop stopped, canvas cleared), 10 two or three, 50 a steady shower, 100 a sky covered in streaks.
 * Streaks behind the content column (<main>'s horizontal extent) draw at COLUMN_ALPHA so text stays readable.
 * Palette: white, or the nine colours after window "rain:palette" { palette: 'nine' } (sessionStorage
 * "rain-palette" is read on load; ThemeToggle owns it). Colours go by spawn index, so the mix is exactly even.
 */

const NINE_COLOURS = [
  '#87CEEB', // sky blue
  '#9ACD32', // yellow-green
  '#FFB7C5', // pink
  '#B57EDC', // purple
  '#FBCEB1', // apricot
  '#98FF98', // mint green
  '#FFFFFF', // white
  '#E53935', // red
  '#1E6FD9', // blue
];

const PALETTE_EVENT = 'rain:palette';
const RAIN_KEY = 'rain';
const PALETTE_KEY = 'rain-palette';
const DEFAULT_INTENSITY = 50;

const MAX_METEORS = 80; // concurrent cap; at 100 a 1440x900 viewport asks for about 54
const PER_DIAGONAL = 0.032; // meteors at intensity 100 per CSS px of viewport diagonal; 100 now equals the former 50 (Brian: the old default was too much)
const COLUMN_ALPHA = 0.55;
const COLUMN_RAMP = 48; // CSS px soft edge outside the column
const FADE_IN = 0.6; // s
const FADE_OUT = 0.15; // fraction of the path
const DYING = 0.4; // s: excess meteors fade out this fast when the slider drops

// Sprites hold SCALE device px per CSS px (enough for DPR 2 at the thickest meteor), so they never rebuild.
const SCALE = 4;
const TAIL_SPRITE_LEN = 512; // device px, stretched to the tail length
const TAIL_THICK = 4; // CSS px sprite height: 2 px core + soft halo
const HEAD_R = 5; // CSS px glow radius

type Palette = 'white' | 'nine';

interface Meteor {
  x: number; // A, CSS px, viewport coordinates
  y: number;
  dx: number; // unit direction
  dy: number;
  d: number; // distance travelled from A
  d0: number; // d when lit (the tail grows from there)
  path: number; // |AB|
  v: number; // CSS px/s
  tail: number; // full tail length, CSS px
  w: number; // thickness scale
  a: number; // brightness
  ci: number; // colour index into NINE_COLOURS
  age: number; // s since lit
  die: number; // s left of a fast fade-out, or 0
}

function rgba(hex: string, a: number) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${a})`;
}

/** Tail: a tapered wedge along +x, transparent at the left end, brightest at the right (the head). */
function makeTail(colour: string) {
  const c = document.createElement('canvas');
  c.width = TAIL_SPRITE_LEN;
  c.height = TAIL_THICK * SCALE;
  const g = c.getContext('2d');
  if (!g) return c;
  const mid = c.height / 2;
  const wedge = (half: number, a: number) => {
    const grad = g.createLinearGradient(0, 0, c.width, 0);
    grad.addColorStop(0, rgba(colour, 0));
    grad.addColorStop(0.5, rgba(colour, 0.22 * a));
    grad.addColorStop(0.85, rgba(colour, 0.6 * a));
    grad.addColorStop(1, rgba(colour, a));
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, mid);
    g.lineTo(c.width, mid - half);
    g.lineTo(c.width, mid + half);
    g.closePath();
    g.fill();
  };
  wedge(mid, 0.22); // halo: the full sprite height at the head
  wedge(SCALE, 0.95); // core: 2 CSS px at the head
  return c;
}

/** Head: a 2 px hot core (the colour pushed towards white) inside a soft glow of the colour. */
function makeHead(colour: string) {
  const size = HEAD_R * 2 * SCALE;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;
  const r = size / 2;
  const v = parseInt(colour.slice(1), 16);
  const hot = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((ch) => Math.round(ch + (255 - ch) * 0.6)).join(', ');
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, `rgba(${hot}, 1)`);
  grad.addColorStop(1 / HEAD_R, `rgba(${hot}, 0.95)`); // 1 CSS px radius: the 2 px core
  grad.addColorStop(2 / HEAD_R, rgba(colour, 0.4));
  grad.addColorStop(1, rgba(colour, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

const sprites = new Map<string, { tail: HTMLCanvasElement; head: HTMLCanvasElement }>();
function spriteFor(colour: string) {
  let s = sprites.get(colour);
  if (!s) {
    s = { tail: makeTail(colour), head: makeHead(colour) };
    sprites.set(colour, s);
  }
  return s;
}

/** Concurrent meteors for an intensity: a convex ramp scaled by the diagonal, at least ceil(s/4), capped. */
function targetCount(intensity: number, diag: number) {
  if (intensity <= 0) return 0;
  const full = Math.min(MAX_METEORS, Math.round(diag * PER_DIAGONAL));
  return Math.min(MAX_METEORS, Math.max(Math.ceil(intensity / 4), Math.round(full * (intensity / 100) ** 1.8)));
}

function readIntensity(): number {
  try {
    const raw = localStorage.getItem(RAIN_KEY);
    const v = raw === null ? NaN : Number(raw);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : DEFAULT_INTENSITY;
  } catch {
    return DEFAULT_INTENSITY;
  }
}

function readPalette(): Palette {
  try {
    return sessionStorage.getItem(PALETTE_KEY) === 'nine' ? 'nine' : 'white';
  } catch {
    return 'white';
  }
}

let started = false;

export function startRain() {
  if (started) return;
  started = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let intensity = readIntensity();
  let palette: Palette = readPalette();
  let ctx: CanvasRenderingContext2D | null = null;
  let dpr = 1;
  let vw = 0;
  let vh = 0;
  let diag = 0;
  let dim: CanvasGradient | null = null; // destination-out mask over the content column, or none
  let raf = 0;
  let last = 0;
  let spawned = 0;
  const live: Meteor[] = [];
  const spare: Meteor[] = []; // finished meteors, reused

  /** Light a meteor at A on an edge, or (mid) somewhere along its path so a fresh sky does not arrive as a wave. */
  function launch(m: Meteor, mid: boolean) {
    const angle = ((25 + 15 * Math.random()) * Math.PI) / 180;
    m.dx = Math.cos(angle);
    m.dy = Math.sin(angle);
    if (Math.random() * (vw * m.dy + vh * m.dx) < vw * m.dy) {
      m.x = Math.random() * vw;
      m.y = 0;
    } else {
      m.x = 0;
      m.y = Math.random() * vh;
    }
    m.path = Math.max(1, Math.min((vw - m.x) / m.dx, (vh - m.y) / m.dy));
    m.d = mid ? Math.random() * m.path * (1 - FADE_OUT) : 0;
    m.d0 = m.d;
    m.v = diag / (8 + 6 * Math.random());
    m.tail = diag * (0.15 + 0.15 * Math.random());
    m.w = 0.8 + 0.45 * Math.random() ** 3; // mostly even, now and then a thicker one
    m.a = Math.random() < 0.2 ? 0.55 + 0.3 * Math.random() : 0.9 + 0.1 * Math.random();
    m.ci = spawned++ % NINE_COLOURS.length;
    m.age = 0;
    m.die = 0;
    return m;
  }

  function measure() {
    if (!ctx) return;
    const canvas = ctx.canvas;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    diag = Math.hypot(vw, vh);
    const w = Math.round(vw * dpr);
    const h = Math.round(vh * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; // resizing also clears the bitmap
      canvas.height = h;
    }
    dim = null;
    const r = document.querySelector('main')?.getBoundingClientRect();
    if (r && r.width > 0) {
      const cut = `rgba(0, 0, 0, ${1 - COLUMN_ALPHA})`;
      const at = (x: number) => Math.min(1, Math.max(0, x / vw));
      dim = ctx.createLinearGradient(0, 0, vw, 0);
      dim.addColorStop(at(r.left - COLUMN_RAMP), 'rgba(0, 0, 0, 0)');
      dim.addColorStop(at(r.left), cut);
      dim.addColorStop(at(r.right), cut);
      dim.addColorStop(at(r.right + COLUMN_RAMP), 'rgba(0, 0, 0, 0)');
    }
  }

  function shouldRun() {
    return (
      !!ctx &&
      document.documentElement.dataset.theme === 'night' &&
      intensity > 0 &&
      !reduceMotion.matches &&
      document.visibilityState === 'visible'
    );
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    spare.push(...live);
    live.length = 0;
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }

  function retire(i: number) {
    spare.push(live[i]);
    live[i] = live[live.length - 1];
    live.pop();
  }

  function frame(now: number) {
    raf = 0;
    if (!shouldRun() || !ctx) return stop();
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    // Keep `target` meteors alive: light new ones mid-sky, fade out the excess quickly.
    const target = targetCount(intensity, diag);
    let alive = 0;
    for (const m of live) if (!m.die) alive++;
    for (let i = live.length - 1; i >= 0 && alive > target; i--) {
      if (!live[i].die) {
        live[i].die = DYING;
        alive--;
      }
    }
    for (; alive < target; alive++) live.push(launch(spare.pop() ?? ({} as Meteor), true));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = live.length - 1; i >= 0; i--) {
      const m = live[i];
      m.age += dt;
      m.d += m.v * dt;
      if (m.die && (m.die -= dt) <= 0) {
        retire(i);
        continue;
      }
      if (m.d >= m.path) {
        if (m.die) retire(i);
        else launch(m, false); // reached B: relight it at a new A
        continue;
      }

      const alpha =
        m.a *
        Math.min(1, m.age / FADE_IN) *
        Math.min(1, (1 - m.d / m.path) / FADE_OUT) *
        (m.die ? m.die / DYING : 1);
      if (alpha < 0.01) continue;

      const s = spriteFor(palette === 'nine' ? NINE_COLOURS[m.ci] : '#FFFFFF');
      const hx = m.x + m.dx * m.d;
      const hy = m.y + m.dy * m.d;
      // local frame: +x along the flight, the head at the origin
      ctx.setTransform(dpr * m.dx, dpr * m.dy, -dpr * m.dy, dpr * m.dx, dpr * hx, dpr * hy);
      ctx.globalAlpha = alpha;
      const tail = Math.min(m.tail, m.d - m.d0);
      if (tail > 1) {
        const thick = TAIL_THICK * m.w;
        ctx.drawImage(s.tail, -tail, -thick / 2, tail, thick);
      }
      const r = HEAD_R * m.w * (1 + 0.35 * Math.max(0, 1 - m.age)); // a touch brighter in the first second
      ctx.drawImage(s.head, -r, -r, r * 2, r * 2);
    }

    ctx.globalAlpha = 1;
    if (dim) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = dim;
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalCompositeOperation = 'source-over';
    }

    raf = requestAnimationFrame(frame);
  }

  function update() {
    if (!shouldRun()) return stop();
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  function paintSlider(slider: HTMLInputElement) {
    slider.style.setProperty('--rain-fill', `${slider.value}%`);
    slider.setAttribute('aria-valuetext', slider.value === '0' ? 'off' : `${slider.value} of 100`);
  }

  function bindPage() {
    const el = document.getElementById('rain');
    const canvas = el instanceof HTMLCanvasElement ? el : null;
    if (canvas !== ctx?.canvas) {
      stop();
      ctx = canvas?.getContext('2d') ?? null;
    }
    palette = readPalette();
    measure();
    const slider = document.getElementById('rain-slider');
    if (slider instanceof HTMLInputElement) {
      slider.value = String(intensity);
      paintSlider(slider);
    }
    update();
  }

  document.addEventListener('input', (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || el.id !== 'rain-slider') return;
    intensity = Math.min(100, Math.max(0, Math.round(Number(el.value)) || 0));
    paintSlider(el);
    try {
      localStorage.setItem(RAIN_KEY, String(intensity));
    } catch {
      /* storage blocked: keep the in-page value */
    }
    update();
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== RAIN_KEY) return;
    intensity = readIntensity();
    bindPage();
  });

  window.addEventListener(PALETTE_EVENT, (event) => {
    const want = (event as CustomEvent<{ palette?: Palette } | null>).detail?.palette;
    if (want === 'nine' || want === 'white') palette = want;
  });

  document.addEventListener('themechange', update);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener('change', update);
  window.addEventListener('resize', measure);

  // ClientRouter: the canvas persists (transition:persist) and meteors fly on through a swap. <main> and the header
  // are replaced, so the column mask is dropped before the swap; after it the mask is remeasured and the slider synced.
  document.addEventListener('astro:before-swap', () => {
    dim = null;
  });
  document.addEventListener('astro:after-swap', bindPage);
  document.addEventListener('astro:page-load', bindPage);

  bindPage();
}
