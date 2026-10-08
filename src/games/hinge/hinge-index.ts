/**
 * The word index behind Hinge's generator: every way an everyday word splits
 * into two shorter everyday words (CARPET = CAR + PET). Built once per
 * dictionary (about 30 ms) and cached.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import { MAX_CLUE, MAX_HINGE, MIN_PART } from './spec.ts';

export interface HingeIndex {
  /** Good hinge words, alphabetically: those with everyday words on both sides. */
  hinges: string[];
  /** For each good hinge, the everyday words that can come before / after it. */
  before: Map<string, string[]>;
  after: Map<string, string[]>;
}

/** Plurals and other inflections make dull clues and answers (HOGS, BIRTHS, TONES). */
const INFLECTIONS = ['s', 'es', 'ed', 'd', 'ing', 'est', 'ly'];

function isInflected(word: string, dict: Dictionary): boolean {
  return INFLECTIONS.some((suffix) => {
    const stem = word.slice(0, -suffix.length);
    return (
      word.endsWith(suffix) && stem.length >= MIN_PART && (dict.has(stem) || dict.has(`${stem}e`))
    );
  });
}

const cache = new WeakMap<Dictionary, WeakMap<ReadonlySet<string>, HingeIndex>>();

export function hingeIndex(dict: Dictionary, common: ReadonlySet<string>): HingeIndex {
  const known = cache.get(dict)?.get(common);
  if (known) return known;

  const before = new Map<string, string[]>();
  const after = new Map<string, string[]>();
  const add = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };
  const everyday = (w: string) => common.has(w) && !isInflected(w, dict);

  for (const word of dict.words) {
    if (!everyday(word)) continue;
    for (let i = MIN_PART; i <= word.length - MIN_PART; i++) {
      const head = word.slice(0, i);
      const tail = word.slice(i);
      if (!everyday(head) || !everyday(tail)) continue;
      // head + tail = word, so head can come before the hinge "tail", and tail after the hinge "head".
      if (tail.length <= MAX_HINGE && head.length <= MAX_CLUE) add(before, tail, head);
      if (head.length <= MAX_HINGE && tail.length <= MAX_CLUE) add(after, head, tail);
    }
  }

  const index: HingeIndex = {
    hinges: [...before.keys()].filter((h) => after.has(h)).sort(),
    before,
    after,
  };
  const byCommon = cache.get(dict) ?? new WeakMap();
  byCommon.set(common, index);
  cache.set(dict, byCommon);
  return index;
}
