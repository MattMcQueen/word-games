/** Clean Sweep's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const cleanSweepRules: HowToPlay = {
  intro:
    "Fifteen jumbled letters. Use every one of them in as few words as you can. There's a new puzzle every day at midnight.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h(
            'strong',
            null,
            'Sweep up every letter, each exactly once, in as few words as possible.',
          ),
          ' Long words are your friend: fewer, longer words beat lots of short ones.',
        ),
      ],
    },
    {
      title: 'Playing',
      body: [
        h(
          'ul',
          { class: 'points' },
          h(
            'li',
            null,
            'Type a word made from the letters that are left, and press Enter. Its letters are crossed off.',
          ),
          h(
            'li',
            null,
            "The keyboard only offers letters you still have, and shows how many when there's more than one.",
          ),
          h('li', null, 'Changed your mind? Take a word back and its letters return.'),
          h('li', null, 'Shuffle the tiles if it helps you see new words.'),
          h('li', null, 'Words need at least 3 letters and must be in the word list.'),
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'Once every letter is used, the game ends if you matched the fewest words possible. If not, you can take words back and try again, or press ',
          h('strong', null, 'Finish'),
          '. Your best complete sweep counts.',
        ),
      ],
    },
    {
      title: 'An example',
      body: [
        h(
          'p',
          null,
          'The letters of ',
          h('strong', null, 'BOOTH, DECOY and WHICH'),
          ' could be swept in three words. If two longer words used them all, two would be the best.',
        ),
      ],
    },
  ],
};
