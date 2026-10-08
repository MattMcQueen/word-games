/** Lost for Words' How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const lostForWordsRules: HowToPlay = {
  intro:
    "A sentence from a classic novel, with one word missing. Can you fill the gap? There's a new sentence every day at midnight.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Guess the missing word'),
          ' in as few tries as you can. The boxes show how many letters it has.',
        ),
      ],
    },
    {
      title: 'Playing',
      body: [
        h(
          'ul',
          { class: 'points' },
          h('li', null, 'Type a word of the right length and press Enter.'),
          h('li', null, 'Each wrong guess reveals one more letter of the missing word.'),
          h('li', null, 'Guesses must be words of the right length, from the word list.'),
          h(
            'li',
            null,
            'You get as many guesses as the word has letters. Getting it first time is perfect.',
          ),
        ),
      ],
    },
    {
      title: 'The books',
      body: [
        h(
          'p',
          null,
          'Every sentence comes from a classic novel in the public domain, from Jane Austen to H. G. Wells. Once you have finished, you will see which book it came from, with a link to find a copy.',
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when you guess the word, run out of guesses, or press ',
          h('strong', null, 'Finish'),
          ' to see the answer.',
        ),
      ],
    },
  ],
};
