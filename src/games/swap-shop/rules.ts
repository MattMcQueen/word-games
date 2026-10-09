/** Swap Shop's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const swapShopRules: HowToPlay = {
  intro:
    "Two letters swap places for the day. Find words that are still words after the swap. There's a new puzzle every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          'Each day two letters swap, say A and E. ',
          h(
            'strong',
            null,
            'Find words that are still words when every A becomes E and every E becomes A.',
          ),
        ),
        h(
          'p',
          null,
          'A word and its swapped twin count as one pair, so typing either one finds both. Try to find every pair of everyday words. Pairs of rarer words, like PONDS ↔ PONES, count as bonuses: welcome, but not needed for a perfect day.',
        ),
      ],
    },
    {
      title: 'Playing',
      body: [
        h(
          'ul',
          { class: 'points' },
          h('li', null, 'Type with your keyboard or tap the letters, then press Enter.'),
          h('li', null, 'As you type, you can see what your word turns into.'),
          h(
            'li',
            null,
            'Some days only words of one length count; the puzzle says so under the swap.',
          ),
          h('li', null, 'Words need at least 3 letters, and both words must be in the word list.'),
          h(
            'li',
            null,
            'Plurals and other forms go with their pair: with A ↔ E, BATS ↔ BETS counts as BAT ↔ BET, not as a new pair.',
          ),
          h(
            'li',
            null,
            'Stuck? Reveal a letter shows how a word of a pair you haven’t found starts. Finding every pair still ends the game, but a perfect day needs no hints.',
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
          'With A ↔ E, ',
          h('strong', null, 'BAT ↔ BET'),
          ' is a pair, and so is ',
          h('strong', null, 'PANEL ↔ PENAL'),
          ": both letters swap at once. BEAN doesn't work, because BAEN isn't a word.",
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The counter shows how many everyday pairs there are. The game ends when you find them all, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see the pairs you missed.",
        ),
      ],
    },
  ],
};
