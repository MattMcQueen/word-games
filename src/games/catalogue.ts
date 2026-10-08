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
];

export const gamePath = (slug: string) => `/${slug}/`;

/** Absolute link to a game, for share text. */
export const gameUrl = (slug: string) => `${location.origin}${gamePath(slug)}`;
