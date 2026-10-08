/**
 * The list of games shown in navigation and on the home page. This is UI
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
    slug: 'threader',
    name: 'Threader',
    tagline: 'Find the shortest word containing three or four letters in order.',
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
