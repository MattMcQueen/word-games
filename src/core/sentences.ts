/**
 * The Gutenberg sentence bank (public/data/sentences.json), built once by
 * scripts/build-gutenberg.ts. Daily puzzles carry their own sentence, so the
 * site only fetches the bank when it has to generate a puzzle itself.
 */

import { SENTENCES_URL } from '../config.ts';

export interface SentenceBook {
  /** Project Gutenberg ebook number. */
  id: number;
  title: string;
  author: string;
}

export interface SentenceEntry {
  /** Index into `books`. */
  b: number;
  /** The sentence is before + word + after. */
  before: string;
  word: string;
  after: string;
}

export interface SentenceBank {
  books: SentenceBook[];
  entries: SentenceEntry[];
}

let cached: Promise<SentenceBank> | undefined;

/** Fetch the sentence bank once per page. */
export function loadSentences(): Promise<SentenceBank> {
  cached ??= fetch(SENTENCES_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Could not load the sentences (HTTP ${res.status})`);
      return res.json() as Promise<SentenceBank>;
    })
    .catch((err: unknown) => {
      cached = undefined;
      throw err;
    });
  return cached;
}
