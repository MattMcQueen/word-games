/** Shelf Scramble's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';
import { finishingSection, hintsSection, typingSection } from '../title-rules.ts';

export const shelfScrambleRules: HowToPlay = {
  intro:
    "The title of a well-known book, with each word's letters jumbled. Put it back together. There's a new book every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Unjumble every word of the title.'),
          ' The words stay in order; only the letters inside each word are mixed up. Words of one or two letters are given.',
        ),
      ],
    },
    typingSection('the title'),
    hintsSection('you have not solved'),
    {
      title: 'An example',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'EDPRI DAN EJUPCIRDE'),
          ' is PRIDE AND PREJUDICE, by Jane Austen.',
        ),
      ],
    },
    finishingSection,
  ],
};
