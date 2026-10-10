/**
 * Pre-rendering: the How to play and About pages written out as plain HTML at
 * build time (by the prerender plugin in vite.config.ts), so search engines,
 * link previews and anyone without JavaScript see the words without running
 * the page's script. The script then draws the same markup over it, so
 * nothing moves.
 *
 * The rules modules build their content as soon as they are imported, so they
 * are imported here, inside the fake DOM, rather than at the top of the file.
 */

import type { HowToPlay } from '../../src/ui/how-to-play.ts';
import { toHtml, withFakeDom } from './dom-shim.ts';

/** Each pre-rendered page's skip link, header, main and footer, by page address ('about', 'halves/how-to-play'…). */
export function prerenderPages(): Promise<Map<string, string>> {
  return withFakeDom(async () => {
    const { pageFrame } = await import('../../src/ui/frame.ts');
    const { howToPlayPage } = await import('../../src/ui/how-to-play.ts');
    const { aboutPage } = await import('../../src/pages/about-page.ts');
    const { GAMES } = await import('../../src/games/catalogue.ts');

    const pages = new Map([['about', aboutPage()]]);
    for (const { slug } of GAMES) {
      // Each game's rules.ts exports its rules under its own name (cipherRules…).
      const module = (await import(`../../src/games/${slug}/rules.ts`)) as Record<
        string,
        HowToPlay
      >;
      const [rules] = Object.values(module);
      if (!rules) throw new Error(`src/games/${slug}/rules.ts exports no rules`);
      pages.set(`${slug}/how-to-play`, howToPlayPage(slug, rules));
    }
    return new Map([...pages].map(([key, page]) => [key, toHtml(pageFrame(page).nodes)]));
  });
}
