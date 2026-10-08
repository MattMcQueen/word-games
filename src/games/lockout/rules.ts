/** Lockout's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const lockoutRules: HowToPlay = {
  intro:
    "Eight letters are locked out and one is a must. Find the longest word that plays by the rules. There's a new puzzle every day at midnight.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Find the longest word that uses the required letter'),
          ' and none of the eight locked-out letters. Other letters can be used as often as you like.',
        ),
      ],
    },
    {
      title: 'Playing',
      body: [
        h(
          'ul',
          { class: 'points' },
          h('li', null, 'The locked-out keys are switched off on the keyboard.'),
          h('li', null, 'Enter as many words as you like: only your longest one counts.'),
          h('li', null, 'Words need at least 3 letters and must be in the word list.'),
        ),
      ],
    },
    {
      title: 'An example',
      body: [
        h(
          'p',
          null,
          'If R is required and A, E, I, L, N, S, T and U are locked out, ',
          h('strong', null, 'WORD'),
          ' works but ',
          h('strong', null, 'WORDS'),
          " doesn't, because S is locked out.",
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when you find a word of the longest possible length, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see every longest answer.",
        ),
      ],
    },
  ],
};
