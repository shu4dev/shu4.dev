/**
 * Theme button behaviour (delegated on document; the header is swapped on every ClientRouter navigation).
 *
 * A click (or Enter/Space, which the browser turns into a click) toggles the theme at once, every time.
 * Egg: every toggle adds 1 to sessionStorage "toggle-count" (survives navigation and reload in this tab only).
 * When a toggle lands on night with the count >= 9, sessionStorage "rain-palette" = "nine" and window gets
 * "rain:palette" { palette: 'nine' }, so that night's meteors use the nine colours. When the theme leaves night
 * while the palette is nine, the palette goes back to white and the count to 0.
 */
const PALETTE_EVENT = 'rain:palette';
const PALETTE_KEY = 'rain-palette';
const COUNT_KEY = 'toggle-count';
const EGG_AT = 9;

let started = false;

function session(key: string, value?: string | null): string | null {
  try {
    if (value === undefined) return sessionStorage.getItem(key);
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* storage blocked: the egg just never fires */
  }
  return null;
}

function palette(p: 'nine' | 'white') {
  session(PALETTE_KEY, p === 'nine' ? 'nine' : null);
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: { palette: p } }));
}

const theme = () => (document.documentElement.dataset.theme === 'night' ? 'night' : 'day');

export function initThemeToggle() {
  if (started) return;
  started = true;

  function label() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const text = theme() === 'night' ? 'Switch to day mode' : 'Switch to night mode';
    btn.setAttribute('aria-label', text);
    btn.setAttribute('title', text);
  }

  // Leaving night ends the egg; via themechange so a system-theme flip ends it too.
  function onTheme() {
    label();
    if (theme() === 'day' && session(PALETTE_KEY) === 'nine') {
      palette('white');
      session(COUNT_KEY, '0');
    }
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('#theme-toggle')) return;
    const next = theme() === 'night' ? 'day' : 'night';
    const count = (Number(session(COUNT_KEY)) || 0) + 1;
    session(COUNT_KEY, String(count));
    window.__theme?.set(next); // fires themechange -> onTheme (resets the count when leaving a nine night)
    if (next === 'night' && count >= EGG_AT) palette('nine');
  });

  // A held Enter auto-repeats clicks and would strobe the page; only real presses count.
  document.addEventListener('keydown', (event) => {
    if (!event.repeat || event.key !== 'Enter') return;
    const target = event.target;
    if (target instanceof Element && target.closest('#theme-toggle')) event.preventDefault();
  });

  document.addEventListener('themechange', onTheme);
  document.addEventListener('astro:page-load', () => {
    label();
    if (session(PALETTE_KEY) !== 'nine') return;
    if (theme() === 'night') palette('nine');
    else onTheme();
  });
  label();
}
