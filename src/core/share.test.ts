import { describe, expect, it } from 'vitest';
import { buildDayShareText, buildShareText, scoreMeter } from './share.ts';

describe('share text', () => {
  it('builds a header, result lines and a link', () => {
    const text = buildShareText({
      game: 'Price Tag',
      puzzleNumber: 8,
      lines: ['7/9 letters', '🟩🟩🟩🟩⬜'],
      url: 'https://example.org/price-tag/',
    });
    expect(text).toBe(
      'Word Games · Price Tag #8\n7/9 letters\n🟩🟩🟩🟩⬜\nhttps://example.org/price-tag/',
    );
  });

  it('draws a meter relative to the optimum', () => {
    expect(scoreMeter(9, 9)).toBe('🟩🟩🟩🟩🟩');
    expect(scoreMeter(0, 9)).toBe('⬜⬜⬜⬜⬜');
    expect(scoreMeter(5, 10)).toBe('🟩🟩🟩⬜⬜');
  });

  it('never shows a full meter short of the optimum', () => {
    expect(scoreMeter(19, 20)).toBe('🟩🟩🟩🟩⬜');
  });

  it('supports games where lower is better', () => {
    expect(scoreMeter(3, 3, true)).toBe('🟩🟩🟩🟩🟩');
    expect(scoreMeter(6, 3, true)).toBe('🟩🟩🟩⬜⬜');
  });
});

describe('buildDayShareText', () => {
  it('lists the games finished today, starring the perfect ones', () => {
    const text = buildDayShareText(
      8,
      [
        { name: 'Price Tag', finished: true, perfect: true },
        { name: 'Hinge', finished: true, perfect: false },
        { name: 'Threader', finished: false },
      ],
      'https://example.com/',
    );
    expect(text).toBe(
      'Word Games #8: 2 of 3 today, 1 perfect\n⭐ Price Tag\n✅ Hinge\nhttps://example.com/',
    );
  });
});
