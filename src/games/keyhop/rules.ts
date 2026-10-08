/** Keyhop's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const keyhopRules: HowToPlay = {
  intro:
    "Hop across the keyboard to spell the longest word you can. There's a new puzzle every day at midnight.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          'Each day sets a starting key, a minimum length and a reach of two or three keys. ',
          h('strong', null, 'Find the longest word'),
          ' that starts on that key, where every letter is within reach of the one before it on the keyboard.',
        ),
      ],
    },
    {
      title: 'Hopping',
      body: [
        h(
          'ul',
          { class: 'points' },
          h(
            'li',
            null,
            'One hop moves to a touching key: left, right, or one of the two keys above or below.',
          ),
          h('li', null, 'Pressing the same key twice is allowed (the SS in DRESS).'),
          h(
            'li',
            null,
            'After each letter the keys you can reach light up and the others switch off, so you always know your options.',
          ),
        ),
      ],
    },
    {
      title: 'An example',
      body: [
        h(
          'p',
          null,
          'With a reach of 2 keys, ',
          h('strong', null, 'DRESS'),
          " works: D to R is one hop up, R to E one hop left, E to S one hop down, and S to S is the same key. DREAM doesn't: from A, M is more than two keys away.",
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'Enter as many words as you like; your longest counts. The game ends when you find a word of the longest possible length, or when you press ',
          h('strong', null, 'Finish'),
          '.',
        ),
      ],
    },
  ],
};
