/**
 * The list of games shown in navigation and on the home page, in the order
 * they appear (the most approachable first). This is UI
 * metadata only, so importing it doesn't pull any game logic into a page.
 */

export interface GameInfo {
  slug: string;
  name: string;
  /** One-line description for the home page. */
  tagline: string;
}

export const GAMES: readonly GameInfo[] = [
  {
    slug: 'price-tag',
    name: 'Price Tag',
    tagline: 'Every letter has a price. Find the longest word within budget.',
  },
  {
    slug: 'hinge',
    name: 'Hinge',
    tagline: 'Find the word that finishes one word and starts another.',
  },
  {
    slug: 'threader',
    name: 'Threader',
    tagline: 'Find the shortest word containing three or four letters in order.',
  },
  {
    slug: 'lost-for-words',
    name: 'Lost for Words',
    tagline: 'A line from a classic novel, with one word missing.',
  },
  {
    slug: 'swap-shop',
    name: 'Swap Shop',
    tagline: 'Two letters swap places. Find the words that survive the swap.',
  },
  {
    slug: 'matryoshka',
    name: 'Matryoshka',
    tagline: 'Grow a chain of words, one letter at a time.',
  },
  {
    slug: 'lockout',
    name: 'Lockout',
    tagline: 'Eight letters are locked out. Find the longest word without them.',
  },
  {
    slug: 'clean-sweep',
    name: 'Clean Sweep',
    tagline: 'Use every letter in as few words as you can.',
  },
  {
    slug: 'shelf-scramble',
    name: 'Shelf Scramble',
    tagline: "A well-known book's title, jumbled. Put it back together.",
  },
  {
    slug: 'halves',
    name: 'Halves',
    tagline: 'Join the halves in pairs to make six words.',
  },
  {
    slug: 'retitled',
    name: 'Retitled',
    tagline: "A famous book's title, reworded. What's it really called?",
  },
  {
    slug: 'cipher',
    name: 'Cipher',
    tagline: 'Crack the code to read a line from a classic novel.',
  },
];

/** Look a game up by slug; throws for an unknown one, which is a programming error. */
export function gameInfo(slug: string): GameInfo {
  const info = GAMES.find((g) => g.slug === slug);
  if (!info) throw new Error(`Unknown game: ${slug}`);
  return info;
}

export const gamePath = (slug: string) => `/${slug}/`;
export const howToPlayPath = (slug: string) => `/${slug}/how-to-play/`;

/** Absolute link to a game, for share text. */
export const gameUrl = (slug: string) => `${location.origin}${gamePath(slug)}`;
