/**
 * The banks of lines from public-domain novels, built once by
 * scripts/build-gutenberg.ts:
 *   - public/data/sentences.json, sentences with a gap word, for Lost for Words
 *   - public/data/cipher-lines.json, whole lines for Cipher (never the same
 *     sentences as Lost for Words)
 * Daily puzzles carry their own line, so the site only fetches a bank when it
 * has to generate a puzzle itself.
 */

import { LINES_URL, SENTENCES_URL } from '../config.ts';

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

export interface LineEntry {
  /** Index into `books`. */
  b: number;
  text: string;
}

export interface LineBank {
  books: SentenceBook[];
  lines: LineEntry[];
}

const cache = new Map<string, Promise<unknown>>();

/** Fetch a JSON file once per page; a failure is forgotten so the next call tries again. */
function loadOnce<T>(url: string, what: string): Promise<T> {
  let pending = cache.get(url) as Promise<T> | undefined;
  if (!pending) {
    pending = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${what} (HTTP ${res.status})`);
        return res.json() as Promise<T>;
      })
      .catch((err: unknown) => {
        cache.delete(url);
        throw err;
      });
    cache.set(url, pending);
  }
  return pending;
}

export const loadSentences = () => loadOnce<SentenceBank>(SENTENCES_URL, 'the sentences');
export const loadLines = () => loadOnce<LineBank>(LINES_URL, 'the Cipher lines');
