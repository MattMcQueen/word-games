/**
 * The parts of the page frame that need no browser: the skip link, header,
 * main column and footer, and the nav links. Kept apart from page.ts (which
 * loads the styles, the Support me button and analytics) so the build can
 * run it in Node to pre-render pages as plain HTML (scripts/prerender.ts).
 */

import { KOFI_URL, SITE_NAME, SOURCE_URL } from '../config.ts';
import { AMAZON_DISCLOSURE } from '../core/amazon.ts';
import { gamePath, howToPlayPath } from '../games/catalogue.ts';
import { type Child, h } from './dom.ts';
import { type NavLink, renderHeader } from './header.ts';

export interface PageOptions {
  /** Tab title; the site name is added after it. Omit on the home page. */
  title?: string;
  nav: readonly NavLink[];
  /** 'game' is a narrow column for a game board; 'page' is the wide one. */
  width: 'game' | 'page';
  content?: Child;
}

/** The page's skip link, header, <main> and footer, in order, and the <main> itself. */
export function pageFrame({ nav, width, content }: PageOptions): {
  nodes: HTMLElement[];
  main: HTMLElement;
} {
  const main = h('main', { id: 'main', class: `wrap ${width}-width`, tabindex: -1 }, content);
  return {
    nodes: [
      h('a', { class: 'skip', href: '#main' }, 'Skip to content'),
      renderHeader(nav),
      main,
      renderFooter(),
    ],
    main,
  };
}

/** The footer every page shares: the site's links and credits. */
function renderFooter(): HTMLElement {
  const external = (href: string, text: string) =>
    h('a', { href, rel: 'noopener', target: '_blank' }, text);
  return h(
    'footer',
    { class: 'site-footer' },
    h(
      'div',
      { class: 'wrap footer-inner' },
      h(
        'div',
        { class: 'footer-brand' },
        h('p', { class: 'footer-name' }, SITE_NAME),
        h(
          'p',
          null,
          'Original word puzzles, a new one every day. Free, with no ads and no cookies.',
        ),
      ),
      h(
        'nav',
        { class: 'footer-nav', 'aria-label': 'Footer' },
        h('a', { href: '/' }, 'All games'),
        h('a', { href: '/about/' }, 'About and privacy'),
        external(SOURCE_URL, 'Source code on GitHub'),
        external(KOFI_URL, 'Support me on Ko-fi'),
      ),
      h(
        'p',
        { class: 'footer-small' },
        `© ${new Date().getFullYear()} Matt McQueen. Words from SCOWL; sentences from public-domain novels. ${AMAZON_DISCLOSURE}`,
      ),
    ),
  );
}

/** Links for the site's own pages (home and About). */
export function siteNav(current: 'home' | 'about'): NavLink[] {
  return [
    { label: 'Games', href: '/', current: current === 'home' },
    { label: 'About', href: '/about/', current: current === 'about' },
  ];
}

/** Links for a game's pages: back to all games, the game itself and its rules. */
export function gameNav(slug: string, current: 'play' | 'how-to-play'): NavLink[] {
  return [
    { label: 'All games', href: '/' },
    { label: 'Play', href: gamePath(slug), current: current === 'play' },
    { label: 'How to play', href: howToPlayPath(slug), current: current === 'how-to-play' },
  ];
}
