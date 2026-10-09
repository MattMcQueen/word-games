/**
 * Per-game saved progress and statistics, stored via ./storage.ts.
 *
 * Keys:
 *   <slug>:day:<date>  → DayRecord: in-progress or finished state for one puzzle
 *   <slug>:stats       → GameStats
 *   site:streak        → SiteStreak: days in a row with any puzzle finished
 *
 * Streaks count consecutive days on which the player finished that day's
 * puzzle on the day itself. Archive plays count towards "played" and
 * "perfect" but never towards streaks. The site streak is the same, for
 * finishing at least one of the day's puzzles.
 */

import { addDays } from './date.ts';
import { readJson, writeJson } from './storage.ts';

/** How a finished puzzle went, in game-neutral terms. */
export interface GameResult {
  /** The player's score in the game's own unit (letters, words, pence…). */
  score: number;
  /** The solver's optimum in the same unit. */
  best: number;
  /** True if the player matched the optimum. */
  perfect: boolean;
  /** True if the player pressed "give up" / "I'm done" before reaching the optimum. */
  gaveUp: boolean;
}

export interface DayRecord<D> {
  status: 'playing' | 'finished';
  /** Game-specific state, e.g. the words found so far. */
  data: D;
  result?: GameResult;
}

export interface GameStats {
  played: number;
  perfect: number;
  currentStreak: number;
  maxStreak: number;
  /** The last date whose daily puzzle was finished on the day, for streak tracking. */
  lastStreakDate: string | null;
}

const EMPTY_STATS: GameStats = {
  played: 0,
  perfect: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastStreakDate: null,
};

/** Days in a row on which at least one of the day's puzzles was finished on the day. */
export interface SiteStreak {
  current: number;
  best: number;
  lastDate: string | null;
}

const SITE_STREAK_KEY = 'site:streak';

const dayKey = (slug: string, date: string) => `${slug}:day:${date}`;
const statsKey = (slug: string) => `${slug}:stats`;

export const loadDay = <D>(slug: string, date: string) =>
  readJson<DayRecord<D> | null>(dayKey(slug, date), null);

export const saveDay = <D>(slug: string, date: string, record: DayRecord<D>) =>
  writeJson(dayKey(slug, date), record);

/** Stats as they stand today: a streak not continued yesterday or today is shown as broken. */
export function loadStats(slug: string, today: string): GameStats {
  const stats = { ...EMPTY_STATS, ...readJson<Partial<GameStats>>(statsKey(slug), {}) };
  const last = stats.lastStreakDate;
  if (last !== today && last !== addDays(today, -1)) stats.currentStreak = 0;
  return stats;
}

/** The site streak as it stands today: one not continued yesterday or today is shown as broken. */
export function loadSiteStreak(today: string): SiteStreak {
  const streak = readJson<SiteStreak>(SITE_STREAK_KEY, { current: 0, best: 0, lastDate: null });
  if (streak.lastDate !== today && streak.lastDate !== addDays(today, -1)) streak.current = 0;
  return streak;
}

/** Count today towards the site streak (once). */
function extendSiteStreak(today: string) {
  const streak = loadSiteStreak(today);
  if (streak.lastDate === today) return;
  streak.current = streak.lastDate === addDays(today, -1) ? streak.current + 1 : 1;
  streak.best = Math.max(streak.best, streak.current);
  streak.lastDate = today;
  writeJson(SITE_STREAK_KEY, streak);
}

/**
 * Mark a puzzle finished: saves the final state and updates the stats.
 * Finishing a date that's already finished changes nothing, so it's safe
 * to call again (e.g. after a reload).
 */
export function finishDay<D>(
  slug: string,
  date: string,
  today: string,
  data: D,
  result: GameResult,
): GameStats {
  const stats = loadStats(slug, today);
  if (loadDay(slug, date)?.status === 'finished') return stats;
  saveDay<D>(slug, date, { status: 'finished', data, result });

  stats.played++;
  if (result.perfect) stats.perfect++;
  if (date === today) extendSiteStreak(today);
  if (date === today && stats.lastStreakDate !== today) {
    stats.currentStreak = stats.lastStreakDate === addDays(today, -1) ? stats.currentStreak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastStreakDate = today;
  }
  writeJson(statsKey(slug), stats);
  return stats;
}

/** How one day's puzzle went, for the recent-days strip. */
export type DayMark = 'perfect' | 'done' | 'missed';

/**
 * How the last `count` daily puzzles went, oldest first, starting no earlier
 * than `first` (launch day). Archive plays count: it's a picture of which
 * puzzles are done, not a streak.
 */
export function recentDays(slug: string, today: string, first: string, count = 14): DayMark[] {
  const marks: DayMark[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    if (date < first) continue;
    const day = loadDay(slug, date);
    marks.push(day?.status !== 'finished' ? 'missed' : day.result?.perfect ? 'perfect' : 'done');
  }
  return marks;
}
