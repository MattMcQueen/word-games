/**
 * Light/dark mode. The default follows the system; the toggle cycles
 * system → light → dark. The choice is stored as "wg:theme" and applied early
 * by public/theme-init.js to avoid a flash on load.
 */

import { readJson, writeJson } from '../core/storage.ts';

type Theme = 'system' | 'light' | 'dark';
const ORDER: Theme[] = ['system', 'light', 'dark'];
const LABELS: Record<Theme, string> = {
  system: 'Theme: matching your device',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

const current = (): Theme => {
  const saved = readJson<Theme>('theme', 'system');
  return ORDER.includes(saved) ? saved : 'system';
};

function apply(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

/** Label describing the current theme, for the toggle button. */
export const themeLabel = () => LABELS[current()];

/** Move to the next theme and return its label. */
export function cycleTheme(): string {
  const next = ORDER[(ORDER.indexOf(current()) + 1) % ORDER.length] as Theme;
  writeJson('theme', next);
  apply(next);
  return LABELS[next];
}
