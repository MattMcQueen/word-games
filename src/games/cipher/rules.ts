/** Cipher's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const cipherRules: HowToPlay = {
  intro:
    "A line from a classic novel in code: every letter has been swapped for another, the same way all through the line. Crack the code to read it. There's a new line every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Work out what every code letter stands for.'),
          ' The small letters are the code. If Q stands for E, every Q in the line is an E. No letter stands for itself.',
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
            'Tap a letter in the line to choose it, then type the letter you think it stands for. Every copy fills in at once.',
          ),
          h(
            'li',
            null,
            'Using a keyboard? Tab to the line and use the arrow keys to move, then type. ',
            h('kbd', null, 'Backspace'),
            ' takes a letter off again.',
          ),
          h(
            'li',
            null,
            'Each letter can stand for only one code letter, so placing it again moves it. Letters already in use are ticked on the on-screen keyboard.',
          ),
          h(
            'li',
            null,
            "You won't be told a letter is wrong until every one is placed. Then you'll be told how many aren't right yet.",
          ),
        ),
      ],
    },
    {
      title: 'Getting started',
      body: [
        h(
          'p',
          null,
          'Look for short words: a code letter on its own is probably A or I, and a common three-letter word is often THE or AND. An apostrophe is usually followed by S or T. E, T and A are the commonest letters in English.',
        ),
      ],
    },
    {
      title: 'Hints',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Reveal a letter'),
          ' gives away the code letter you have chosen (or, if that one is right, the next one that isn’t). Letters given away are underlined with dots and can’t be changed. A perfect day needs no hints.',
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when the code is cracked, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see the whole line and the book it comes from, with a link to find a copy.",
        ),
      ],
    },
  ],
};
