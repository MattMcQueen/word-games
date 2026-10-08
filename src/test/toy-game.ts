/** A toy game for testing the shared machinery: pick a random word, reject vowel starts. */

import type { GameLogic } from '../core/game.ts';

export const toyGame: GameLogic<{ word: string }, { length: number }> = {
  slug: 'toy',
  generate: (rng, { dict }) => {
    const word = rng.pick(dict.words);
    return 'aeiou'.includes(word[0] ?? '') ? null : { word };
  },
  solve: (p) => ({ length: p.word.length }),
  accept: (_p, s) => s.length === 3,
};
