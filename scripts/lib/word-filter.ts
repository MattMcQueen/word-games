/**
 * Pure helpers for building the dictionary, kept separate from the download
 * and file handling in build-dictionary.ts so they can be unit tested.
 */

/** Lowercase a–z only, at least three letters. Excludes proper nouns, apostrophes and accents. */
const VALID_WORD = /^[a-z]{3,}$/;

/** Parse blocklist text: one word per line, # comments and blank lines ignored. */
export function parseBlocklist(text: string): Set<string> {
  const words = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const word = line.replace(/#.*/, '').trim().toLowerCase();
    if (word) words.add(word);
  }
  return words;
}

/** Filter raw word-list lines down to the site's dictionary, sorted and de-duplicated. */
export function filterWords(raw: Iterable<string>, blocklist: ReadonlySet<string>): string[] {
  const kept = new Set<string>();
  for (const line of raw) {
    const word = line.trim();
    if (VALID_WORD.test(word) && !blocklist.has(word)) kept.add(word);
  }
  return [...kept].sort();
}
