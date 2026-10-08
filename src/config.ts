/** Site-wide settings. Change these here rather than hunting through the code. */

export const SITE_NAME = 'Word Games';

/**
 * The first day with a puzzle. Puzzle numbers count from here (this date is #1),
 * and the archive never goes back further.
 */
export const LAUNCH_DATE = '2026-10-01';

/** How many years ahead `npm run generate` fills by default. */
export const GENERATE_YEARS_AHEAD = 3;

/** Paths of the static data files, relative to the site root. */
export const WORDS_URL = '/data/words.txt';
export const SENTENCES_URL = '/data/sentences.json';
export const puzzleMonthUrl = (slug: string, month: string) => `/puzzles/${slug}/${month}.json`;
