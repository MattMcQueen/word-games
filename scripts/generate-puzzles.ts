/**
 * Pre-generates daily puzzles into public/puzzles/<slug>/<yyyy-mm>.json.
 *
 *   npm run generate                       all games, launch date → 3 years from today
 *   npm run generate -- --game price-tag   one game only
 *   npm run generate -- --to 2030-12-31    a custom end date
 *   npm run generate -- --force            regenerate dates that already exist
 *
 * Existing dates are kept unless --force is given, so re-running only extends
 * the range. Generation is deterministic (seeded by game + date), so even a
 * forced run reproduces the same puzzles unless the dictionary or a game's
 * generator has changed.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { GENERATE_YEARS_AHEAD, LAUNCH_DATE } from '../src/config.ts';
import { addDays, isDateKey, monthOf, todayKey } from '../src/core/date.ts';
import { createDictionary } from '../src/core/dictionary.ts';
import {
  contextFor,
  type DailyPuzzle,
  type GameLogic,
  generateDaily,
  type PuzzleMonthFile,
  type Resources,
} from '../src/core/game.ts';
import type { LineBank, SentenceBank } from '../src/core/sentences.ts';
import { ALL_GAMES } from '../src/games/registry.ts';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'puzzles');

const { values: args } = parseArgs({
  options: {
    game: { type: 'string' },
    from: { type: 'string', default: LAUNCH_DATE },
    to: { type: 'string', default: addDays(todayKey(), Math.round(365.25 * GENERATE_YEARS_AHEAD)) },
    force: { type: 'boolean', default: false },
  },
});

for (const date of [args.from, args.to]) {
  if (!isDateKey(date)) throw new Error(`Not a valid date (YYYY-MM-DD): ${date}`);
}

const games = args.game ? ALL_GAMES.filter((g) => g.slug === args.game) : ALL_GAMES;
if (games.length === 0) throw new Error(`Unknown game: ${args.game}`);

const dict = createDictionary(readFileSync(join(ROOT, 'public', 'data', 'words.txt'), 'utf8'));
/** Extra data, read once and handed only to the games that ask for it. */
const resources: Required<Resources> = {
  sentences: JSON.parse(
    readFileSync(join(ROOT, 'public', 'data', 'sentences.json'), 'utf8'),
  ) as SentenceBank,
  common: new Set(
    createDictionary(readFileSync(join(ROOT, 'public', 'data', 'common.txt'), 'utf8')).words,
  ),
  lines: JSON.parse(
    readFileSync(join(ROOT, 'public', 'data', 'cipher-lines.json'), 'utf8'),
  ) as LineBank,
};
const resourcesFor = (game: GameLogic<unknown, unknown>): Resources =>
  Object.fromEntries((game.needs ?? []).map((name) => [name, resources[name]]));

/**
 * Write a month file with one day per line, so diffs stay readable when the
 * range is extended or a day is regenerated.
 */
function writeMonth(path: string, file: PuzzleMonthFile<unknown, unknown>) {
  const dates = Object.keys(file.days).sort();
  const lines = dates.map((d) => `    ${JSON.stringify(d)}: ${JSON.stringify(file.days[d])}`);
  const json = `{\n  "game": ${JSON.stringify(file.game)},\n  "month": ${JSON.stringify(file.month)},\n  "days": {\n${lines.join(',\n')}\n  }\n}\n`;
  writeFileSync(path, json);
}

function readMonth(path: string, game: string, month: string): PuzzleMonthFile<unknown, unknown> {
  if (!existsSync(path)) return { game, month, days: {} };
  return JSON.parse(readFileSync(path, 'utf8')) as PuzzleMonthFile<unknown, unknown>;
}

function generateGame(game: GameLogic<unknown, unknown>) {
  const started = performance.now();
  const dir = join(OUT_DIR, game.slug);
  mkdirSync(dir, { recursive: true });

  let created = 0;
  let file: PuzzleMonthFile<unknown, unknown> | undefined;
  let path = '';

  for (let date = args.from; date <= args.to; date = addDays(date, 1)) {
    const month = monthOf(date);
    if (file?.month !== month) {
      if (file) writeMonth(path, file);
      path = join(dir, `${month}.json`);
      file = readMonth(path, game.slug, month);
    }
    if (!args.force && file.days[date]) continue;
    file.days[date] = generateDaily(
      game,
      contextFor(dict, date, resourcesFor(game)),
    ) as DailyPuzzle<unknown, unknown>;
    created++;
  }
  if (file) writeMonth(path, file);

  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`${game.slug}: ${created} new puzzles (${args.from} → ${args.to}) in ${seconds}s`);
}

for (const game of games) generateGame(game);
