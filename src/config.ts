/** Site-wide settings. Change these here rather than hunting through the code. */

export const SITE_NAME = 'Word Games';

/** The live site (see README, Hosting), for links in share previews and the sitemap. */
export const SITE_URL = 'https://words.matt-rarely-writes.co.uk';

/** The source code, linked from the About page and the footer. */
export const SOURCE_URL = 'https://github.com/MattMcQueen/word-games';

/** Amazon Associates UK tracking ID for book links (public: it's in every link). Empty hides them. */
export const AMAZON_TAG = 'matsbasblo-21';

/** Where the Support me button and links go. */
export const KOFI_URL = 'https://ko-fi.com/mattrarelywrites';

/**
 * This site's token in Cloudflare Web Analytics (public: it's in every page).
 * Leave empty to count nothing. See src/core/analytics.ts.
 */
export const ANALYTICS_TOKEN = 'f526949ae1544ec7bd8d304f18779860';

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
export const COMMON_URL = '/data/common.txt';
export const LINES_URL = '/data/cipher-lines.json';
export const puzzleMonthUrl = (slug: string, month: string) => `/puzzles/${slug}/${month}.json`;
