/**
 * Theme button behaviour (delegated on document; the header is swapped on every ClientRouter navigation).
 *
 * A single click toggles the theme instantly. If the next click lands less than COMBO_GAP ms later, the sequence
 * becomes a combo: that second click undoes the first flip (theme, localStorage "theme" and the theme-color metas go
 * back to what they were before the sequence began) and no later click in the combo toggles. The combo lasts until
 * COMBO_RESET ms pass without a click. Once the theme is (back to) night:
 *   combo length 3 (and 12, 21, ...)  -> three green slashes cut the moon into crescents, which then heal (~1.75 s)
 *   combo length 9 (and 18, 27, ...)  -> "rain:palette" event: the star rain flips between white and nine colours
 * So from night, three fast clicks cut the moon after one brief flash of day; from day nothing fires (eggs are night-only).
 * Keyboard activation (Enter/Space) produces the same click events, so it counts too; a held Enter does not auto-repeat.
 */
import { PALETTE_EVENT } from './rain';

const COMBO_GAP = 500; // max gap between the first and second click for a combo
const COMBO_RESET = 1500; // silence that ends a combo
const THEME_KEY = 'theme';

// Slice offsets in SVG user units: along the cut (u = up-right) and across it (n = down-right).
// The two middle slices move together, so the moon falls into three crescents: two horns and the middle
// (the centre slash leaves only a hairline there). Neighbours slide opposite ways along the cut, like a clean slice.
const U = [0.7071, -0.7071];
const N = [0.7071, 0.7071];
const SPLIT: Array<[number, number]> = [
  [3.4, -1.1],
  [-1.6, 0],
  [-1.6, 0],
  [3.4, 1.1],
];

let started = false;

export function initThemeToggle() {
  if (started) return;
  started = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let count = 0; // clicks in the current sequence
  let lastClick = -Infinity;
  // what the first click of the sequence changed, so the second click can put it back exactly
  let before: { theme: 'day' | 'night'; stored: string | null } | null = null;
  let running: Animation[] = [];

  const theme = () => (document.documentElement.dataset.theme === 'night' ? 'night' : 'day');

  function readStored(): string | null {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  function writeStored(value: string | null) {
    try {
      if (value === null) localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, value);
    } catch {
      /* storage blocked */
    }
  }

  function label() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const text = theme() === 'night' ? 'Switch to day mode' : 'Switch to night mode';
    btn.setAttribute('aria-label', text);
    btn.setAttribute('title', text);
  }

  function cut(btn: HTMLElement) {
    running.forEach((a) => a.cancel());
    running = [];
    btn.dataset.cut = '';

    const slashes = btn.querySelectorAll<SVGLineElement>('.moon-slash');
    const slices = btn.querySelectorAll<SVGGElement>('.moon-slice');

    if (reduceMotion.matches) {
      // no movement: the slashes appear in place and fade
      slashes.forEach((line) => {
        running.push(
          line.animate(
            [
              { strokeDashoffset: 0, opacity: 0 },
              { strokeDashoffset: 0, opacity: 1, offset: 0.2 },
              { strokeDashoffset: 0, opacity: 0 },
            ],
            { duration: 700, easing: 'ease-out' },
          ),
        );
      });
    } else {
      slashes.forEach((line, i) => {
        running.push(
          line.animate(
            [
              { strokeDashoffset: 1, opacity: 1 },
              { strokeDashoffset: 0, opacity: 1, offset: 0.45 },
              { strokeDashoffset: -1, opacity: 0.6 },
            ],
            { duration: 300, delay: i * 80, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' },
          ),
        );
      });
      slices.forEach((g, i) => {
        const [along, across] = SPLIT[i] ?? [0, 0];
        const x = (U[0] * along + N[0] * across).toFixed(2);
        const y = (U[1] * along + N[1] * across).toFixed(2);
        const apart = `translate(${x}px, ${y}px)`;
        const whole = 'translate(0px, 0px)';
        running.push(
          g.animate(
            [
              { transform: whole, offset: 0 },
              { transform: whole, offset: 0.08, easing: 'cubic-bezier(.2,.9,.3,1)' },
              { transform: apart, offset: 0.15 },
              { transform: apart, offset: 0.3, easing: 'cubic-bezier(.65,0,.35,1)' },
              { transform: whole, offset: 1 },
            ],
            { duration: 1750 },
          ),
        );
      });
    }

    const mine = running;
    Promise.all(mine.map((a) => a.finished))
      .then(() => {
        if (running === mine) delete btn.dataset.cut;
      })
      .catch(() => {
        /* cancelled by a newer cut */
      });
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    const btn = target instanceof Element ? target.closest<HTMLElement>('#theme-toggle') : null;
    if (!btn) return;

    const now = event.timeStamp;
    const gap = now - lastClick;
    lastClick = now;

    if (count >= 2 && gap < COMBO_RESET) {
      // inside a combo: never toggles
      count += 1;
    } else if (count === 1 && gap < COMBO_GAP) {
      // second rapid click: this is a combo, so undo the first click's flip
      count = 2;
      if (before) {
        if (theme() !== before.theme) window.__theme?.set(before.theme);
        writeStored(before.stored);
      }
    } else {
      // a new sequence: toggle now, remember what to restore if it turns into a combo
      count = 1;
      before = { theme: theme(), stored: readStored() };
      window.__theme?.set(before.theme === 'night' ? 'day' : 'night');
    }

    if (count < 3 || theme() !== 'night') return;
    if (count % 9 === 3) cut(btn);
    if (count % 9 === 0) document.dispatchEvent(new CustomEvent(PALETTE_EVENT));
  });

  // A held Enter would auto-repeat clicks into a combo; only real presses count.
  document.addEventListener('keydown', (event) => {
    if (!event.repeat || event.key !== 'Enter') return;
    const target = event.target;
    if (target instanceof Element && target.closest('#theme-toggle')) event.preventDefault();
  });

  label();
  document.addEventListener('themechange', label);
  document.addEventListener('astro:page-load', label);
}
