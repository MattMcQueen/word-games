/**
 * The one shared dictionary. "If it's not in the list, it's not a word."
 *
 * The word list (public/data/words.txt) is built by scripts/build-dictionary.ts:
 * one lowercase a–z word per line, already filtered and blocklisted. This module
 * turns that text into lookups, and is used unchanged by the site and the Node
 * scripts. Indexes are built lazily the first time a game asks for them.
 */

import { COMMON_URL, WORDS_URL } from '../config.ts';
import { sortedLetters } from '../solvers/letters.ts';

export interface Dictionary {
  /** Every word, in alphabetical order. */
  readonly words: readonly string[];
  /** Fast membership test. Expects lowercase input. */
  has(word: string): boolean;
  /** All words with exactly `length` letters. */
  ofLength(length: number): readonly string[];
  /** All words that are anagrams of the given letters (any order, same counts). */
  anagramsOf(letters: string): readonly string[];
}

export function createDictionary(text: string): Dictionary {
  const words = text
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  const set = new Set(words);

  let byLength: Map<number, string[]> | undefined;
  let byAnagram: Map<string, string[]> | undefined;

  const groupBy = (keyOf: (w: string) => string | number) => {
    const map = new Map<string | number, string[]>();
    for (const w of words) {
      const key = keyOf(w);
      const group = map.get(key);
      if (group) group.push(w);
      else map.set(key, [w]);
    }
    return map;
  };

  return {
    words,
    has: (word) => set.has(word),
    ofLength(length) {
      byLength ??= groupBy((w) => w.length) as Map<number, string[]>;
      return byLength.get(length) ?? [];
    },
    anagramsOf(letters) {
      byAnagram ??= groupBy(sortedLetters) as Map<string, string[]>;
      return byAnagram.get(sortedLetters(letters)) ?? [];
    },
  };
}

let cached: Promise<Dictionary> | undefined;

/** Fetch and parse the word list once per page; later calls reuse the same promise. */
export function loadDictionary(): Promise<Dictionary> {
  cached ??= fetch(WORDS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Could not load the word list (HTTP ${res.status})`);
      return res.text();
    })
    .then(createDictionary)
    .catch((err: unknown) => {
      cached = undefined; // allow a retry after a network blip
      throw err;
    });
  return cached;
}

let commonCached: Promise<ReadonlySet<string>> | undefined;

/**
 * Everyday words (SCOWL size 35, a subset of the dictionary), for generators
 * that want their clues to be familiar. Fetched only for in-browser generation.
 */
export function loadCommonWords(): Promise<ReadonlySet<string>> {
  commonCached ??= fetch(COMMON_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Could not load the common words (HTTP ${res.status})`);
      return res.text();
    })
    .then((text) => new Set(createDictionary(text).words))
    .catch((err: unknown) => {
      commonCached = undefined;
      throw err;
    });
  return commonCached;
}
