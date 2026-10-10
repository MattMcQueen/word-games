/**
 * A game's How to play page, laid out like card-kit's HowToPlayPage: a hero
 * panel with the game's name, a one-line intro and a button to play, then the
 * rules as short cards. Each game supplies only its words (rules.ts).
 */

import { gameInfo, gamePath } from '../games/catalogue.ts';
import { type Child, h } from './dom.ts';
import { gameNav, type PageOptions } from './frame.ts';

export interface RuleSection {
  title: string;
  body: Child[];
  /** Span both columns on wide screens. */
  wide?: boolean;
}

export interface HowToPlay {
  /** One or two sentences under the title. */
  intro: string;
  sections: RuleSection[];
}

/** Every game has an archive, so every How to play page ends by explaining it. */
const ARCHIVE_SECTION: RuleSection = {
  title: 'Missed a day?',
  wide: true,
  body: [
    h(
      'p',
      null,
      'Every past puzzle is in the archive (the Archive button on the game page). Archive games count towards your stats but not your streak.',
    ),
  ],
};

/** The page for renderPage, or for the build to pre-render (scripts/prerender.ts). */
export function howToPlayPage(slug: string, rules: HowToPlay): PageOptions {
  const { name } = gameInfo(slug);
  const sections = [...rules.sections, ARCHIVE_SECTION];
  return {
    title: `How to play ${name}`,
    nav: gameNav(slug, 'how-to-play'),
    width: 'page',
    content: h(
      'div',
      { class: 'page' },
      h(
        'section',
        { class: 'hero' },
        h('span', { class: 'kicker' }, 'How to play'),
        h('h1', null, name),
        h('p', null, rules.intro),
        h('a', { class: 'btn primary', href: gamePath(slug) }, "Play today's puzzle"),
      ),
      h(
        'ul',
        { class: 'facts' },
        sections.map((s) =>
          h('li', { class: s.wide ? 'wide' : null }, h('h2', null, s.title), s.body),
        ),
      ),
    ),
  };
}
