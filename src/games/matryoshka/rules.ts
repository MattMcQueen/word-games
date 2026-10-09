/** Matryoshka's How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';
import { everydaySection } from '../hunt-rules.ts';

export const matryoshkaRules: HowToPlay = {
  intro:
    "Start from two or three letters and grow them into a chain of words, one letter at a time. There's a new puzzle every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Build the longest chain you can.'),
          ' Each word must be the one before it with exactly one letter added, anywhere: at the start, the end or in the middle. The letters already there stay in the same order.',
        ),
        h(
          'p',
          null,
          "The starting letters don't have to be a word, but everything after them does.",
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
            'Type the next word and press Enter. The new letter is underlined in the chain.',
          ),
          h(
            'li',
            null,
            'Stuck? Press Undo last word to step back and try another way. Your longest chain is kept.',
          ),
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
          'From ',
          h('strong', null, 'AT'),
          ": AT → CAT → CHAT → CHATS → CHANTS is a chain of four words. CAT → ACTS wouldn't count: the letters already there have to stay in order.",
        ),
      ],
    },
    everydaySection('The longest chain'),
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when your chain is as long as the longest possible, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see some of the longest chains.",
        ),
      ],
    },
  ],
};
