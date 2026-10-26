type ThemeName = 'day' | 'night';

interface ThemeApi {
  /** Theme currently on <html data-theme>. */
  get(): ThemeName;
  /** Apply a theme, persist it (localStorage "theme"; removed when it equals the system theme) and fire "themechange". */
  set(theme: ThemeName): void;
}

interface Window {
  /** Defined by the inline boot script in Base.astro before first paint. */
  __theme?: ThemeApi;
}

interface DocumentEventMap {
  themechange: CustomEvent<{ theme: ThemeName }>;
}
