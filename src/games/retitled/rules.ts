/** Retitled's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';
import { finishingSection, hintsSection, typingSection } from '../title-rules.ts';

export const retitledRules: HowToPlay = {
  intro:
    "The title of a famous book, with its words swapped for others that mean much the same. Work out what it's really called. There's a new book every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Find every word of the real title.'),
          ' Below the reworded title there are boxes for each word of the real one, so you can see how long they are. Words the new title kept, such as THE or AND, are filled in.',
        ),
      ],
    },
    typingSection('the real title'),
    hintsSection('you have not found'),
    {
      title: 'Some examples',
      body: [
        h(
          'ul',
          { class: 'points' },
          h('li', null, h('strong', null, 'Battle and Calm'), ' is WAR AND PEACE, by Leo Tolstoy.'),
          h(
            'li',
            null,
            h('strong', null, 'Huge Hopes'),
            ' is GREAT EXPECTATIONS, by Charles Dickens.',
          ),
          h(
            'li',
            null,
            'Some are playful: ',
            h('strong', null, 'Small Village'),
            ' is HAMLET, by William Shakespeare.',
          ),
        ),
      ],
    },
    finishingSection,
  ],
};
