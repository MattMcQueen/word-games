import { describe, expect, it } from 'vitest';
import { LAUNCH_DATE } from '../config.ts';
import {
  addDays,
  daysBetween,
  formatLongDate,
  isDateKey,
  monthOf,
  msUntilMidnight,
  puzzleNumber,
  todayKey,
} from './date.ts';

describe('date helpers', () => {
  it('uses the local calendar date for today', () => {
    expect(todayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 0, 6, 0, 0))).toBe('2026-01-06');
  });

  it('validates date keys', () => {
    expect(isDateKey('2028-02-29')).toBe(true);
    expect(isDateKey('2027-02-29')).toBe(false);
    expect(isDateKey('2026-13-01')).toBe(false);
    expect(isDateKey('2026-1-01')).toBe(false);
    expect(isDateKey('nonsense')).toBe(false);
  });

  it('adds days across month, year, leap-day and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30'); // UK clocks go forward
    expect(addDays('2026-10-25', -1)).toBe('2026-10-24'); // UK clocks go back
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7);
    expect(daysBetween('2026-10-08', '2026-10-01')).toBe(-7);
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('numbers puzzles from the launch date', () => {
    expect(puzzleNumber(LAUNCH_DATE)).toBe(1);
    expect(puzzleNumber(addDays(LAUNCH_DATE, 9))).toBe(10);
  });

  it('formats dates the UK way', () => {
    expect(formatLongDate('2026-10-08')).toBe('Thursday 8 October 2026');
    expect(monthOf('2026-10-08')).toBe('2026-10');
  });

  it('measures time to local midnight', () => {
    expect(msUntilMidnight(new Date(2026, 5, 1, 23, 0, 0))).toBe(3_600_000);
  });
});
