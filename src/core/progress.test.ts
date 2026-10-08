import { beforeEach, describe, expect, it, vi } from 'vitest';
import { finishDay, type GameResult, loadDay, loadStats, saveDay } from './progress.ts';

const perfect: GameResult = { score: 9, best: 9, perfect: true, gaveUp: false };
const partial: GameResult = { score: 6, best: 9, perfect: false, gaveUp: true };

// Each test gets a unique game slug, because storage keeps an in-memory copy.
let slug = '';
let n = 0;
beforeEach(() => {
  vi.stubGlobal('localStorage', undefined);
  slug = `test-game-${++n}`;
});

describe('progress', () => {
  it('saves and loads in-progress state', () => {
    saveDay(slug, '2026-10-08', { status: 'playing', data: { guesses: ['cat'] } });
    expect(loadDay(slug, '2026-10-08')).toEqual({ status: 'playing', data: { guesses: ['cat'] } });
  });

  it('starts a streak and extends it on consecutive days', () => {
    finishDay(slug, '2026-10-08', '2026-10-08', {}, perfect);
    const stats = finishDay(slug, '2026-10-09', '2026-10-09', {}, partial);
    expect(stats).toMatchObject({ played: 2, perfect: 1, currentStreak: 2, maxStreak: 2 });
  });

  it('resets the streak after a missed day', () => {
    finishDay(slug, '2026-10-08', '2026-10-08', {}, perfect);
    expect(loadStats(slug, '2026-10-10').currentStreak).toBe(0);
    const stats = finishDay(slug, '2026-10-10', '2026-10-10', {}, perfect);
    expect(stats).toMatchObject({ currentStreak: 1, maxStreak: 1 });
  });

  it('counts archive plays but not towards the streak', () => {
    const stats = finishDay(slug, '2026-10-01', '2026-10-08', {}, perfect);
    expect(stats).toMatchObject({ played: 1, perfect: 1, currentStreak: 0 });
  });

  it('ignores finishing the same day twice', () => {
    finishDay(slug, '2026-10-08', '2026-10-08', { a: 1 }, perfect);
    const stats = finishDay(slug, '2026-10-08', '2026-10-08', { a: 2 }, partial);
    expect(stats.played).toBe(1);
    expect(loadDay(slug, '2026-10-08')).toMatchObject({ status: 'finished', data: { a: 1 } });
  });
});
