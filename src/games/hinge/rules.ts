/** Hinge's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const hingeRules: HowToPlay = {
  intro:
    "Five pairs of words, each missing the word that joins them. Find all five hinges. There's a new puzzle every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Find the hinge for each pair:'),
          ' a word that finishes the first word and starts the second. The boxes show how many letters it has.',
        ),
        h('p', null, 'Every pair has exactly one answer in the word list.'),
      ],
    },
    {
      title: 'An example',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'BLUE … CAGE'),
          ' is BIRD: BLUEBIRD and BIRDCAGE. Some hinges are sneakier: ',
          h('strong', null, 'CAR … ROL'),
          ' is PET, for CARPET and PETROL.',
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
            "Type a word and press Enter. It's tried against every pair you haven't solved yet.",
          ),
          h(
            'li',
            null,
            "Stuck? Reveal a letter of that pair's hinge. It still counts, but a perfect day needs no hints.",
          ),
          h('li', null, 'Hinges and the words either side all have at least 3 letters.'),
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when you find all five, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see every hinge.",
        ),
      ],
    },
  ],
};
