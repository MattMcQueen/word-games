/**
 * How to play sections shared by the two games where you find a book's title
 * word by word (Shelf Scramble and Retitled), so their rules stay in step.
 */

import { h } from '../ui/dom.ts';
import type { HowToPlay } from '../ui/how-to-play.ts';

type Section = HowToPlay['sections'][number];

/** Typing words, or the whole title, to put them in place. `which` is e.g. "the title" or "the real title". */
export const typingSection = (which: string): Section => ({
  title: 'Playing',
  body: [
    h(
      'ul',
      { class: 'points' },
      h('li', null, `Type any word of ${which} and press Enter to put it in place.`),
      h('li', null, 'If you know the whole title, type it all as one (no spaces) and press Enter.'),
      h(
        'li',
        null,
        'Names and unusual words count: the title is the answer, whether or not it is in the word list.',
      ),
    ),
  ],
});

/** The two hints. `notDone` says which words they help with, e.g. "you have not solved". */
export const hintsSection = (notDone: string): Section => ({
  title: 'Hints',
  body: [
    h(
      'p',
      null,
      h('strong', null, 'Show the author'),
      ' if the title rings no bells, or ',
      h('strong', null, 'reveal a letter'),
      ` of the next word ${notDone}. A perfect day needs no hints.`,
    ),
  ],
});

/** How it ends, with the link to the book. */
export const finishingSection: Section = {
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
};
