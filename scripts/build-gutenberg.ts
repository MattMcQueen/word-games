/**
 * Builds the two banks of lines from public-domain novels:
 *   - public/data/sentences.json, sentences with a gap word, for Lost for Words
 *   - public/data/cipher-lines.json, whole lines for Cipher
 *
 *   npm run build:sentences
 *
 * The books are listed in data/gutenberg-sources.json. Each is downloaded once
 * from Project Gutenberg into .cache/gutenberg/ (delete a file to fetch it
 * again). Run after build:dictionary, since gap words must be in the word list.
 *
 * For each book: strip the Gutenberg header and footer, split into sentences,
 * keep the ones that read well alone (scripts/lib/sentences.ts), drop any with
 * a blocked word, choose a gap word, and keep up to PER_BOOK of them. Then,
 * from the sentences Lost for Words didn't take, keep up to CIPHER_PER_BOOK
 * that make a good code to crack. Each bank has its own seed, so changing one
 * never changes the other.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createDictionary } from '../src/core/dictionary.ts';
import { createRng } from '../src/core/rng.ts';
import type {
  LineBank,
  LineEntry,
  SentenceBank,
  SentenceBook,
  SentenceEntry,
} from '../src/core/sentences.ts';
import {
  cipherCandidate,
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
const CIPHER_PER_BOOK = 60;
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

/** Write a bank as one line of JSON. */
function writeBank(file: string, bank: SentenceBank | LineBank, count: number, what: string) {
  writeFileSync(join(ROOT, 'public', 'data', file), `${JSON.stringify(bank)}\n`);
  console.log(`Wrote ${count} ${what} to public/data/${file}`);
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
  writeBank('sentences.json', { books, entries }, entries.length, 'sentences');

  // Cipher's lines: never a sentence Lost for Words uses.
  const taken = new Set(entries.map((e) => e.before + e.word + e.after));
  const lines: LineEntry[] = [];
  books.forEach((book, b) => {
    const rng = createRng(`cipher:${book.id}`);
    const candidates = (sentenceLists[b] ?? []).filter(
      (s) => usableSentence(s, blocked) && cipherCandidate(s) && !taken.has(s),
    );
    for (const text of rng.shuffle(candidates).slice(0, CIPHER_PER_BOOK)) lines.push({ b, text });
  });
  writeBank('cipher-lines.json', { books, lines }, lines.length, 'lines');
}

await main();
