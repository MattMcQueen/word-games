/**
 * The site header, as in card-kit's SiteHeader: the logo (a link home), the
 * page links, and the light/dark button. On phones the links drop onto a
 * second row under the logo.
 */

import { SITE_NAME } from '../config.ts';
import { h } from './dom.ts';
import { themeToggle } from './theme.ts';

export interface NavLink {
  label: string;
  href: string;
  /** True for the page being shown. */
  current?: boolean;
}

/**
 * The logo mark, the same as the favicon: a terracotta sticker, like the card
 * games' and Brand New's, with a letter tile on it. A fixed string, never user data.
 */
const LOGO_SVG = `<svg class="logo-mark" viewBox="0 0 32 32" width="44" height="44" aria-hidden="true" focusable="false"><polygon points="16.0,0.5 18.8,3.7 22.7,2.0 23.9,6.1 28.1,6.3 27.4,10.5 31.1,12.6 28.6,16.0 31.1,19.4 27.4,21.5 28.1,25.7 23.9,25.9 22.7,30.0 18.8,28.3 16.0,31.5 13.2,28.3 9.3,30.0 8.1,25.9 3.9,25.7 4.6,21.5 0.9,19.4 3.4,16.0 0.9,12.6 4.6,10.5 3.9,6.3 8.1,6.1 9.3,2.0 13.2,3.7" fill="#c2410c"/><rect x="8.5" y="8.5" width="15" height="15" rx="2.2" fill="#fff"/><path fill="#c2410c" d="M10.6 12.2h1.9l1.3 5.3 1.4-5.3h1.6l1.4 5.3 1.3-5.3h1.9l-2.3 7.6h-1.7L16 14.6l-1.4 5.2h-1.7z"/></svg>`;

function logoMark(): Node {
  const template = document.createElement('template');
  template.innerHTML = LOGO_SVG;
  return template.content.firstChild as Node;
}

export function renderHeader(nav: readonly NavLink[]): HTMLElement {
  return h(
    'header',
    { class: 'site-header' },
    h(
      'div',
      { class: 'wrap bar' },
      h('a', { class: 'logo', href: '/' }, logoMark(), SITE_NAME),
      h(
        'nav',
        { class: 'nav', 'aria-label': 'Sections' },
        nav.map((link) =>
          h('a', { href: link.href, 'aria-current': link.current ? 'page' : null }, link.label),
        ),
      ),
      h('div', { class: 'tools' }, themeToggle()),
    ),
  );
}
