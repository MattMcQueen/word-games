/**
 * Calendar helpers. Puzzles are keyed by a "date key": the player's local date
 * as YYYY-MM-DD. All arithmetic is done on those keys via UTC so daylight
 * saving changes can never skip or repeat a day.
 */

import { LAUNCH_DATE } from '../config.ts';

const DAY_MS = 86_400_000;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date key in the player's own time zone, so the day rolls over at local midnight. */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** True if the string is a real calendar date in YYYY-MM-DD form. */
export function isDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false;
  return toUtcDate(value).toISOString().slice(0, 10) === value;
}

function toUtcDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

/** The date key `days` after `key` (negative to go back). */
export function addDays(key: string, days: number): string {
  return new Date(toUtcDate(key).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / DAY_MS);
}

/** The YYYY-MM month a date key falls in, used to name puzzle files. */
export const monthOf = (key: string) => key.slice(0, 7);

/** Puzzle number shown to players: the launch date is #1. */
export const puzzleNumber = (key: string) => daysBetween(LAUNCH_DATE, key) + 1;

/** Human-friendly UK date, e.g. "Thursday 8 October 2026" (no comma, whatever the ICU version). */
export function formatLongDate(key: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(toUtcDate(key));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part('weekday')} ${part('day')} ${part('month')} ${part('year')}`;
}

/** Short UK date, e.g. "8 Oct 2026". */
export function formatShortDate(key: string): string {
  return toUtcDate(key).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Milliseconds until the player's next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
