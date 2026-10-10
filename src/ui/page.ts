/**
 * The frame every page sits in, as in card-kit's Site.svelte: a skip link,
 * the header, the main column and the Support me button. Also loads the
 * site-wide styles, so every page entry point gets them by importing this.
 */

import { ANALYTICS_TOKEN, SITE_NAME } from '../config.ts';
import { countVisits } from '../core/analytics.ts';
import { type PageOptions, pageFrame } from './frame.ts';
import { renderSupportMe } from './support-me.ts';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/pages.css';

/**
 * Draw the page frame and return its <main>, to which callers may add more.
 * Pages pre-rendered at build time are replaced by the same markup, so nothing moves.
 */
export function renderPage(options: PageOptions): HTMLElement {
  const { title } = options;
  document.title = title ? `${title} – ${SITE_NAME}` : document.title;
  const { nodes, main } = pageFrame(options);
  document.body.replaceChildren(...nodes, renderSupportMe());
  countVisits(ANALYTICS_TOKEN);
  return main;
}
