/** Halves' How to play page: the words only; the layout is src/ui/how-to-play.ts. */

import { h } from '../../ui/dom.ts';
import type { HowToPlay } from '../../ui/how-to-play.ts';

export const halvesRules: HowToPlay = {
  intro:
    "Twelve halves of words, all mixed up. Join them in pairs to make six words. There's a new set every day at midnight, your time.",
  sections: [
    {
      title: 'The goal',
      body: [
        h(
          'p',
          null,
          h('strong', null, 'Join every half to its partner.'),
          ' Each word is two halves put together, like SUN + DAY = SUNDAY. Every half is used exactly once.',
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
            'Pick a half, then pick the half that goes with it. Either order works: DAY then SUN still makes SUNDAY.',
          ),
          h('li', null, 'Pick the same half again to put it back.'),
          h(
            'li',
            null,
            'Stuck? Shuffle moves the halves round, and Join a pair joins one for you (a perfect day needs no hints).',
          ),
          h('li', null, 'Using a keyboard? Tab to a half and press Enter or Space to pick it.'),
          h(
            'li',
            null,
            'When only two halves are left, they join on their own: they can only go together.',
          ),
        ),
      ],
    },
    {
      title: 'Mistakes',
      body: [
        h(
          'p',
          null,
          "Joining two halves that aren't one of the six counts as a mistake. Watch out for decoys: two halves might make a real word that isn't one of today's six, and then the other halves won't all pair up. Trying the same wrong pair twice only counts once. ",
          h('strong', null, 'A perfect day has no mistakes.'),
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
          h('strong', null, 'BOARD · CAKE · CUP · PAN'),
          ' you could join CUP + CAKE, but then PAN and BOARD don’t make a word. The pairs are CUP + BOARD and PAN + CAKE: CUPBOARD and PANCAKE.',
        ),
      ],
    },
    {
      title: 'Finishing',
      body: [
        h(
          'p',
          null,
          'The game ends when all six words are joined, or when you press ',
          h('strong', null, 'Finish'),
          ". You'll then see all six words.",
        ),
      ],
    },
  ],
};
