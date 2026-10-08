/** Price Tag's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const priceTagRules: HowToPlay = {
  intro:
    "Every letter has a price and you have a budget. Find the longest word you can afford. There's a new puzzle every day at midnight.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          'Each letter costs between 1p and 9p; the prices are shown on the keyboard. ',
          h(
            'strong',
            null,
            'Find the longest word whose letters add up to no more than the budget.',
          ),
        ),
        h(
          'p',
          null,
          'If two words are the same length, the one that spends closer to the budget wins.',
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
          h('li', null, "As you type, the running cost and what's left of the budget are shown."),
          h('li', null, 'Enter as many words as you like: only your best one counts.'),
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
          'The game ends when you find the best possible word, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see how close you got and the best answer.",
        ),
        h(
          'p',
          null,
          'Share your result without giving the answer away, and come back tomorrow to keep your streak going.',
        ),
      ],
    },
    {
      title: 'An example',
      body: [
        h(
          'p',
          null,
          'With a budget of 20p, if C costs 4p, A costs 2p and T costs 5p, then ',
          h('strong', null, 'CAT'),
          ' costs 11p and leaves 9p to spare. A longer word that still fits would beat it.',
        ),
      ],
    },
    {
      title: 'Missed a day?',
      wide: true,
      body: [
        h(
          'p',
          null,
          'Every past puzzle is in the archive (the Archive button on the game page). Archive games count towards your stats but not your streak.',
        ),
      ],
    },
  ],
};
