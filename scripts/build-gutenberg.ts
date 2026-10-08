/**
 * Builds public/data/sentences.json, the sentence bank for Gutenberg Gap.
 *
 *   npm run build:sentences
 *
 * The books are listed in data/gutenberg-sources.json. Each is downloaded once
 * from Project Gutenberg into .cache/gutenberg/ (delete a file to fetch it
 * again). Run after build:dictionary, since gap words must be in the word list.
 *
 * For each book: strip the Gutenberg header and footer, split into sentences,
 * keep the ones that read well alone (scripts/lib/sentences.ts), drop any with
 * a blocked word, choose a gap word, and keep up to PER_BOOK of them.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createDictionary } from '../src/core/dictionary.ts';
import { createRng } from '../src/core/rng.ts';
import type { SentenceBank, SentenceBook, SentenceEntry } from '../src/core/sentences.ts';
import {
  commonWords,
  gapCandidates,
  paragraphs,
  sentences,
  stripGutenberg,
  tidy,
  tokens,
  usableSentence,
} from './lib/sentences.ts';
import { parseBlocklist } from './lib/word-filter.ts';

const ROOT = resolve(import.meta.dirname, '..');
const CACHE = join(ROOT, '.cache', 'gutenberg');
const PER_BOOK = 80;
/** The most frequent words across the books are too easy to be gaps. */
const COMMON_COUNT = 600;

const books = JSON.parse(
  readFileSync(join(ROOT, 'data', 'gutenberg-sources.json'), 'utf8'),
) as SentenceBook[];
const dict = createDictionary(readFileSync(join(ROOT, 'public', 'data', 'words.txt'), 'utf8'));
const blocked = new Set([
  ...parseBlocklist(readFileSync(join(ROOT, 'data', 'blocklist.txt'), 'utf8')),
  ...parseBlocklist(readFileSync(join(ROOT, 'data', 'gutenberg-exclude.txt'), 'utf8')),
]);

async function bookText(book: SentenceBook): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, `pg${book.id}.txt`);
  if (!existsSync(path)) {
    const url = `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`;
    console.log(`Downloading ${url}`);
    const res = await fetch(url, { headers: { 'User-Agent': 'word-games sentence bank builder' } });
    if (!res.ok) throw new Error(`Download failed for ${book.title}: HTTP ${res.status}`);
    writeFileSync(path, await res.text());
    await new Promise((r) => setTimeout(r, 1000)); // be polite to Gutenberg's servers
  }
  const text = readFileSync(path, 'utf8');
  const title = text.match(/^Title: (.*)$/m)?.[1] ?? '';
  if (!title.toLowerCase().startsWith(book.title.toLowerCase().slice(0, 12))) {
    console.warn(`Warning: ebook ${book.id} is titled "${title.trim()}", expected "${book.title}"`);
  }
  return tidy(stripGutenberg(text));
}

async function main() {
  const texts = await Promise.all(books.map(bookText));
  const sentenceLists = texts.map((t) => paragraphs(t).flatMap(sentences));
  const tooCommon = commonWords(
    sentenceLists.flat().flatMap((s) => tokens(s)),
    COMMON_COUNT,
  );

  const entries: SentenceEntry[] = [];
  books.forEach((book, b) => {
    const rng = createRng(`gutenberg:${book.id}`);
    const usable = (sentenceLists[b] ?? []).filter((s) => usableSentence(s, blocked));
    let kept = 0;
    for (const sentence of rng.shuffle(usable)) {
      if (kept >= PER_BOOK) break;
      const gaps = gapCandidates(sentence, (w) => dict.has(w), tooCommon);
      if (gaps.length === 0) continue;
      const gap = rng.pick(gaps);
      entries.push({
        b,
        before: sentence.slice(0, gap.start),
        word: gap.word,
        after: sentence.slice(gap.start + gap.word.length),
      });
      kept++;
    }
    console.log(`${book.title}: ${usable.length} usable sentences, kept ${kept}`);
  });

  const bank: SentenceBank = { books, entries };
  writeFileSync(join(ROOT, 'public', 'data', 'sentences.json'), `${JSON.stringify(bank)}\n`);
  console.log(`Wrote ${entries.length} sentences to public/data/sentences.json`);
}

await main();
