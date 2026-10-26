/**
 * Star rain on the fixed canvas#rain (night theme only).
 *
 * Two fields share one canvas:
 *  - panel field: full density, in the coordinates of the current page's #panel (so on phones it scrolls with it),
 *    clipped to the whole #panel rect, not the media: at night the media sits inset inside the panel, so the rain
 *    fills the margin around it and shows faintly through the media (--media-opacity).
 *  - page field: PAGE_DENSITY of that, in viewport coordinates, clipped to everything outside the panel.
 * Streaks fall from top-left to bottom-right; a bright head with a fading tail, 1-2 px wide.
 * Intensity 0-100 (slider #rain-slider, localStorage "rain", default 50) scales count (x2 at 100) and speed together.
 * Palette: white, or the nine-colour mix after the "rain:palette" event (flips; sessionStorage "rain-palette").
 */

export const NINE_COLOURS = [
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
const WHITE = ['#FFFFFF'];

export const PALETTE_EVENT = 'rain:palette';
const RAIN_KEY = 'rain';
const PALETTE_KEY = 'rain-palette';
const DEFAULT_INTENSITY = 50;

const ANGLE = (60 * Math.PI) / 180; // below the horizontal
const DX = Math.cos(ANGLE);
const DY = Math.sin(ANGLE);

const AREA_PER_STAR = 4200; // CSS px² per streak inside the panel at intensity 50
const PAGE_DENSITY = 0.15; // page background density relative to the panel
const PAGE_ALPHA = 0.6; // page streaks are dimmer so text over them stays easy to read
const SPRITE_LEN = 40; // CSS px, the longest streak; each star draws it at scale k (0.45..1)
const SPRITE_WIDTH = 2; // CSS px line width at k = 1, so streaks are 0.9-2 px wide
const SPRITE_PAD = 4;

type Palette = 'white' | 'nine';

interface Star {
  x: number; // head position, field coordinates
  y: number;
  k: number; // size 0.45..1 (length, width, speed and brightness follow it)
  v: number; // base speed, CSS px/s
  a: number; // alpha
}

function makeStar(w: number, h: number, inside: boolean): Star {
  const k = 0.45 + 0.55 * Math.random() ** 1.7;
  const star: Star = { x: 0, y: 0, k, v: 240 + 420 * k, a: Math.min(1, 0.28 + 0.62 * k + 0.1 * Math.random()) };
  if (inside) {
    star.x = Math.random() * w;
    star.y = Math.random() * h;
  } else {
    enter(star, w, h);
  }
  return star;
}

/** Put a star just outside the top or left edge, weighted by the flux through each edge so density stays even. */
function enter(star: Star, w: number, h: number) {
  const top = w * DY;
  const left = h * DX;
  if (Math.random() * (top + left) < top) {
    star.x = Math.random() * w;
    star.y = -1;
  } else {
    star.x = -1;
    star.y = Math.random() * h;
  }
}

class Field {
  w = 0;
  h = 0;
  stars: Star[] = [];

  constructor(
    readonly density: number,
    readonly alpha = 1,
  ) {}

  resize(w: number, h: number) {
    if (w === this.w && h === this.h) return;
    if (this.w > 0 && this.h > 0) {
      const sx = w / this.w;
      const sy = h / this.h;
      for (const s of this.stars) {
        s.x *= sx;
        s.y *= sy;
      }
    }
    this.w = w;
    this.h = h;
  }

  sync(intensity: number) {
    const n = Math.round(((this.w * this.h) / AREA_PER_STAR) * this.density * (intensity / 50));
    while (this.stars.length < n) this.stars.push(makeStar(this.w, this.h, true));
    if (this.stars.length > n) this.stars.length = n;
  }

  step(dt: number, speed: number, len: number) {
    for (const s of this.stars) {
      const d = s.v * speed * dt;
      s.x += DX * d;
      s.y += DY * d;
      const tail = SPRITE_LEN * s.k * len;
      if (s.x - tail * DX > this.w || s.y - tail * DY > this.h) enter(s, this.w, this.h);
    }
  }

  draw(ctx: CanvasRenderingContext2D, ox: number, oy: number, sprites: HTMLCanvasElement[], len: number) {
    const n = sprites.length;
    // head position inside the sprite, in CSS px at scale 1
    const hx = SPRITE_PAD + SPRITE_LEN * DX;
    const hy = SPRITE_PAD + SPRITE_LEN * DY;
    const sw = SPRITE_LEN * DX + SPRITE_PAD * 2;
    const sh = SPRITE_LEN * DY + SPRITE_PAD * 2;
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const k = s.k * len;
      ctx.globalAlpha = s.a * this.alpha;
      // index-based colour: an exactly even mix, stable for each star
      ctx.drawImage(sprites[i % n], ox + s.x - hx * k, oy + s.y - hy * k, sw * k, sh * k);
    }
    ctx.globalAlpha = 1;
  }
}

function rgba(hex: string, a: number) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${a})`;
}

/** One pre-rendered streak per colour (all streaks share an angle, so drawImage replaces per-star gradients). */
function makeSprite(colour: string, dpr: number) {
  const w = SPRITE_LEN * DX + SPRITE_PAD * 2;
  const h = SPRITE_LEN * DY + SPRITE_PAD * 2;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const g = c.getContext('2d');
  if (!g) return c;
  g.scale(dpr, dpr);
  const x0 = SPRITE_PAD;
  const y0 = SPRITE_PAD;
  const x1 = SPRITE_PAD + SPRITE_LEN * DX;
  const y1 = SPRITE_PAD + SPRITE_LEN * DY;
  const tail = g.createLinearGradient(x0, y0, x1, y1);
  tail.addColorStop(0, rgba(colour, 0));
  tail.addColorStop(0.65, rgba(colour, 0.28));
  tail.addColorStop(1, rgba(colour, 0.95));
  g.strokeStyle = tail;
  g.lineWidth = SPRITE_WIDTH;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
  const glow = g.createRadialGradient(x1, y1, 0, x1, y1, SPRITE_WIDTH * 2);
  glow.addColorStop(0, rgba(colour, 1));
  glow.addColorStop(0.45, rgba(colour, 0.55));
  glow.addColorStop(1, rgba(colour, 0));
  g.fillStyle = glow;
  g.beginPath();
  g.arc(x1, y1, SPRITE_WIDTH * 2, 0, Math.PI * 2);
  g.fill();
  return c;
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
  const page = new Field(PAGE_DENSITY, PAGE_ALPHA);
  const panelField = new Field(1);

  let intensity = readIntensity();
  let palette: Palette = readPalette();
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let panel: HTMLElement | null = null;
  let dpr = 1;
  let vw = 0;
  let vh = 0;
  let sprites: HTMLCanvasElement[] = [];
  let spriteKey = '';
  let raf = 0;
  let last = 0;
  let dirty = false; // canvas holds a frame that must be cleared when rain stops

  const observer = new ResizeObserver(() => measure());

  function bindCanvas() {
    const el = document.getElementById('rain');
    if (!(el instanceof HTMLCanvasElement)) {
      canvas = null;
      ctx = null;
      return;
    }
    if (el === canvas) return;
    if (canvas) observer.unobserve(canvas);
    canvas = el;
    ctx = el.getContext('2d');
    observer.observe(el);
    measure();
  }

  function measure() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    const w = Math.round(vw * dpr);
    const h = Math.round(vh * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; // resizing also clears the bitmap
      canvas.height = h;
    }
    page.resize(vw, vh);
  }

  function ensureSprites() {
    const colours = palette === 'nine' ? NINE_COLOURS : WHITE;
    const key = `${palette}@${dpr}`;
    if (key === spriteKey) return;
    sprites = colours.map((c) => makeSprite(c, dpr));
    spriteKey = key;
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

  function clear() {
    if (ctx && canvas && dirty) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    dirty = false;
  }

  function frame(now: number) {
    raf = 0;
    if (!shouldRun() || !ctx) {
      clear();
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    const s = intensity / 100;
    const speed = 0.45 + 1.1 * s; // 50 -> 1, 100 -> 1.55
    const len = 0.8 + 0.2 * speed; // faster rain draws slightly longer streaks
    ensureSprites();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    dirty = true;

    let r: DOMRect | null = null;
    if (panel?.isConnected) {
      const rect = panel.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) r = rect;
    }
    const panelVisible = !!r && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;

    // page field: everywhere except the panel
    page.sync(intensity);
    page.step(dt, speed, len);
    ctx.save();
    if (r && panelVisible) {
      ctx.beginPath();
      ctx.rect(0, 0, vw, vh);
      ctx.rect(r.left, r.top, r.width, r.height);
      ctx.clip('evenodd');
    }
    page.draw(ctx, 0, 0, sprites, len);
    ctx.restore();

    // panel field: full density inside the panel (frozen while the panel is scrolled out of view)
    if (r) {
      panelField.resize(r.width, r.height);
      panelField.sync(intensity);
      if (panelVisible) {
        panelField.step(dt, speed, len);
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.left, r.top, r.width, r.height);
        ctx.clip();
        panelField.draw(ctx, r.left, r.top, sprites, len);
        ctx.restore();
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function update() {
    if (shouldRun()) {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    } else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clear();
    }
  }

  function syncSlider() {
    const slider = document.getElementById('rain-slider');
    if (!(slider instanceof HTMLInputElement)) return;
    slider.value = String(intensity);
    paintSlider(slider);
  }

  function paintSlider(slider: HTMLInputElement) {
    slider.style.setProperty('--rain-fill', `${slider.value}%`);
    slider.setAttribute('aria-valuetext', slider.value === '0' ? 'off' : `${slider.value} of 100`);
  }

  function bindPage() {
    bindCanvas();
    // the outer #panel itself (never an inner media box), so the full-density field covers the inset margin too
    panel = document.getElementById('panel') ?? document.querySelector<HTMLElement>('[data-panel]');
    syncSlider();
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
    syncSlider();
    update();
  });

  document.addEventListener(PALETTE_EVENT, (event) => {
    const want = (event as CustomEvent<{ palette?: Palette } | null>).detail?.palette;
    palette = want === 'nine' || want === 'white' ? want : palette === 'nine' ? 'white' : 'nine';
    try {
      if (palette === 'nine') sessionStorage.setItem(PALETTE_KEY, 'nine');
      else sessionStorage.removeItem(PALETTE_KEY);
    } catch {
      /* storage blocked: the mode lasts for this page view */
    }
  });

  document.addEventListener('themechange', update);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener('change', update);
  window.addEventListener('resize', measure);

  // ClientRouter: the canvas persists across swaps, the panel does not.
  document.addEventListener('astro:before-swap', () => {
    panel = null;
  });
  document.addEventListener('astro:after-swap', bindPage);
  document.addEventListener('astro:page-load', bindPage);

  bindPage();
}
