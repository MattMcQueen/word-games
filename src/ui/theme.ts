/**
 * The light/dark mode button, as in card-kit's ThemeToggle: it follows the
 * device until pressed, then switches between light and dark. Unlike the card
 * games, the choice is remembered (as "wg:theme"), and public/theme-init.js
 * applies it before the page paints so there's no flash of the other theme.
 */

import { writeJson } from '../core/storage.ts';
import { h } from './dom.ts';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A sun (offered in dark mode) or a moon (offered in light mode). */
function themeIcon(theme: Theme): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24',
    width: '20',
    height: '20',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  })) {
    svg.setAttribute(k, v);
  }
  if (theme === 'dark') {
    const sun = document.createElementNS(SVG_NS, 'circle');
    sun.setAttribute('cx', '12');
    sun.setAttribute('cy', '12');
    sun.setAttribute('r', '4');
    const rays = document.createElementNS(SVG_NS, 'path');
    rays.setAttribute(
      'd',
      'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    );
    svg.append(sun, rays);
  } else {
    const moon = document.createElementNS(SVG_NS, 'path');
    moon.setAttribute('d', 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z');
    svg.append(moon);
  }
  return svg;
}

/** The theme button for the header. */
export function themeToggle(): HTMLButtonElement {
  const button = h('button', { type: 'button', class: 'icon-btn' });
  const show = () => {
    const theme = currentTheme();
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.replaceChildren(themeIcon(theme));
  };
  button.addEventListener('click', () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    writeJson('theme', next);
    show();
  });
  // Keep the icon right if the device switches while no choice has been made.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', show);
  show();
  return button;
}
