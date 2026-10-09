/**
 * How to play sections shared by the games where you hunt for the best answer
 * (Price Tag, Threader, Lockout, Matryoshka, Clean Sweep), so their rules stay
 * in step with each other and with the generators.
 */

import { h } from '../ui/dom.ts';
import type { HowToPlay } from '../ui/how-to-play.ts';

type Section = HowToPlay['sections'][number];

/** The best answer never depends on an obscure word (see hasEverydayAnswer in core/dictionary.ts). */
export const everydaySection = (best: string): Section => ({
  title: 'Fair answers',
  body: [
    h(
      'p',
      null,
      `${best} can always be made from everyday words, so you never need to know an obscure one. Any word in the list counts, though, and a rarer word can tie with it.`,
    ),
  ],
});

/** The word hunts' hint button (src/ui/word-hunt.ts). */
export const huntHintsSection: Section = {
  title: 'Hints',
  body: [
    h(
      'p',
      null,
      'Stuck? ',
      h('strong', null, 'Reveal a letter'),
      ' shows how a best answer starts, one letter at a time. Finding it still ends the game, but a perfect day needs no hints.',
    ),
  ],
};
