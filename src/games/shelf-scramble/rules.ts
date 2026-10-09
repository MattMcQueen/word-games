/** Shelf Scramble's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

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
    {
      title: 'Playing',
      body: [
        h(
          'ul',
          { class: 'points' },
          h('li', null, 'Type any word of the title and press Enter to put it in place.'),
          h(
            'li',
            null,
            'If you know the whole title, type it all as one (no spaces) and press Enter.',
          ),
          h(
            'li',
            null,
            'Names and unusual words count: the title is the answer, whether or not it is in the word list.',
          ),
        ),
      ],
    },
    {
      title: 'Hints',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Show the author'),
          ' if the title rings no bells, or ',
          h('strong', null, 'reveal a letter'),
          ' of the next word you have not solved. A perfect day needs no hints.',
        ),
      ],
    },
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
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when the whole title is in place, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see the book, with a link to find a copy.",
        ),
      ],
    },
  ],
};
