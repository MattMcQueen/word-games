/**
 * Pure helpers for building the Gutenberg Gap sentence bank, kept apart from
 * the downloading in build-gutenberg.ts so they can be unit tested.
 *
 * The steps: strip Project Gutenberg's header and footer, tidy the text, split
 * it into paragraphs and sentences, keep sentences that read well on their own,
 * and choose one gap word in each.
 */

/** The part of a Project Gutenberg file between its START and END markers. */
export function stripGutenberg(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG/i.test(l));
  const end = lines.findIndex((l) => /^\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i.test(l));
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n');
}

/** Straight quotes, no _italic_ marks, and "--" as a spaced en dash (UK style). */
export function tidy(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/_/g, '')
    .replace(/\s*--\s*/g, ' – ');
}

/** Paragraphs as single lines, skipping headings (no lowercase letters, or CHAPTER etc.). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => /[a-z]/.test(p) && !/^(CHAPTER|BOOK|VOLUME|PART|STAVE)\b/i.test(p));
}

/** Words that end in a full stop without ending a sentence. */
const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'dr',
  'st',
  'messrs',
  'mme',
  'mlle',
  'capt',
  'col',
  'gen',
  'lt',
  'no',
  'vol',
  'viz',
  'etc',
]);

/** Split a paragraph into sentences at . ! or ? followed by a capital letter. */
export function sentences(paragraph: string): string[] {
  const out: string[] = [];
  let start = 0;
  const boundary = /[.!?]["')]*(?=\s+["'(]*[A-Z])/g;
  for (const match of paragraph.matchAll(boundary)) {
    const end = (match.index ?? 0) + match[0].length;
    const before = paragraph.slice(start, match.index).match(/([A-Za-z]+)$/)?.[1] ?? '';
    // "Mr. Darcy" and initials such as "H. G." don't end sentences.
    if (
      match[0][0] === '.' &&
      (ABBREVIATIONS.has(before.toLowerCase()) || /^[A-Z]$/.test(before))
    ) {
      continue;
    }
    out.push(paragraph.slice(start, end).trim());
    start = end;
  }
  const rest = paragraph.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}

const MIN_WORDS = 8;
const MAX_WORDS = 30;

const TOKEN = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

/** All word tokens, lowercased. */
export const tokens = (sentence: string) =>
  [...sentence.matchAll(TOKEN)].map((m) => m[0].toLowerCase());

/**
 * True if a sentence reads well on its own: 8–30 words, starts with a capital
 * (or quote), ends with . ! or ?, plain ASCII letters and punctuation only,
 * balanced quotes and brackets, and nothing on the blocklist.
 */
export function usableSentence(sentence: string, blocked: ReadonlySet<string>): boolean {
  const words = sentence.split(' ').length;
  if (words < MIN_WORDS || words > MAX_WORDS) return false;
  if (!/^["']?[A-Z]/.test(sentence) || !/[.!?]["']?$/.test(sentence)) return false;
  if (!/^[A-Za-z ,.;:!?'"()–-]+$/.test(sentence)) return false;
  if ((sentence.match(/"/g)?.length ?? 0) % 2 !== 0) return false;
  if ((sentence.match(/\(/g)?.length ?? 0) !== (sentence.match(/\)/g)?.length ?? 0)) return false;
  return !tokens(sentence).some((t) => blocked.has(t) || blocked.has(t.replace(/'s$/, '')));
}

export interface Gap {
  /** Index of the gap word in the sentence. */
  start: number;
  word: string;
}

const MIN_GAP = 5;
const MAX_GAP = 10;

/**
 * Words that could be the gap: written in lowercase (so not names or the first
 * word), 5–10 letters, in the dictionary, not too common, used only once in
 * the sentence, and not part of a hyphenated word or a contraction.
 */
export function gapCandidates(
  sentence: string,
  isWord: (w: string) => boolean,
  tooCommon: ReadonlySet<string>,
): Gap[] {
  const all = tokens(sentence);
  const gaps: Gap[] = [];
  for (const m of sentence.matchAll(TOKEN)) {
    const word = m[0];
    const start = m.index ?? 0;
    const before = sentence[start - 1] ?? ' ';
    const after = sentence[start + word.length] ?? ' ';
    if (!/^[a-z]+$/.test(word) || word.length < MIN_GAP || word.length > MAX_GAP) continue;
    if (before === '-' || after === '-' || after === "'") continue;
    if (!isWord(word) || tooCommon.has(word)) continue;
    if (all.filter((t) => t === word).length !== 1) continue;
    gaps.push({ start, word });
  }
  return gaps;
}

/** The most frequent words across all the books, which make poor gaps. */
export function commonWords(allTokens: Iterable<string>, count: number): Set<string> {
  const freq = new Map<string, number>();
  for (const t of allTokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return new Set(
    [...freq]
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([w]) => w),
  );
}
