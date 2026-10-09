/** Threader's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const threaderRules: HowToPlay = {
  intro:
    "You're given three or four letters in order. Find the shortest word that contains them, in that order. There's a new puzzle every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Find the shortest word containing the letters in the order shown.'),
          " They don't have to be next to each other: other letters can go before, between and after them.",
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
          h(
            'li',
            null,
            "As you type, the thread's letters are underlined in your word, so you can see what's still needed.",
          ),
          h('li', null, 'Enter as many words as you like: only your shortest one counts.'),
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
          'With ',
          h('strong', null, 'R → N → T'),
          ', RETURN is no good (the T comes before the N), and RUNNER has no T. ',
          h('strong', null, 'RUNT'),
          ' works, and at 4 letters it would be hard to beat.',
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when you find a word of the shortest possible length, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see how close you got and every shortest answer.",
        ),
      ],
    },
  ],
};
