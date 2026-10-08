/**
 * The frame every page sits in, as in card-kit's Site.svelte: a skip link,
 * the header, the main column and the Support me button. Also loads the
 * site-wide styles, so every page entry point gets them by importing this.
 */

import { gamePath, howToPlayPath } from '../games/catalogue.ts';
import { type Child, h } from './dom.ts';
import { type NavLink, renderHeader } from './header.ts';
import { renderSupportMe } from './support-me.ts';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/pages.css';

export interface PageOptions {
  /** Tab title; the site name is added after it. Omit on the home page. */
  title?: string;
  nav: readonly NavLink[];
  /** 'game' is a narrow column for a game board; 'page' is the wide one. */
  width: 'game' | 'page';
  content?: Child;
}

/** Draw the page frame and return its <main>, to which callers may add more. */
export function renderPage({ title, nav, width, content }: PageOptions): HTMLElement {
  if (title) document.title = `${title} – ${document.title}`;
  const main = h('main', { id: 'main', class: `wrap ${width}-width`, tabindex: -1 }, content);
  document.body.replaceChildren(
    h('a', { class: 'skip', href: '#main' }, 'Skip to content'),
    renderHeader(nav),
    main,
    renderSupportMe(),
  );
  return main;
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
