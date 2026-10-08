import { afterEach, describe, expect, it, vi } from 'vitest';
import { toyGame } from '../test/toy-game.ts';
import { createDictionary } from './dictionary.ts';
import { contextFor, generateDaily } from './game.ts';
import { loadDailyPuzzle } from './puzzle-loader.ts';

const dict = createDictionary('ant\nbee\ncat\ndog\nemu');
const getDict = { dictionary: async () => dict };

afterEach(() => vi.unstubAllGlobals());

describe('loadDailyPuzzle', () => {
  it('uses the pre-generated file when it has the date', async () => {
    const day = { puzzle: { word: 'zzz' }, solution: { length: 3 } };
    const fetchMock = vi.fn(async () =>
      Response.json({ game: 'toy', month: '2030-01', days: { '2030-01-05': day } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const loaded = await loadDailyPuzzle({ ...toyGame, slug: 'toy-a' }, '2030-01-05', getDict);
    expect(loaded).toEqual({ ...day, source: 'file' });
    expect(fetchMock).toHaveBeenCalledWith('/puzzles/toy-a/2030-01.json');
  });

  it('generates the puzzle itself when the file is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Not found', { status: 404 })),
    );
    const game = { ...toyGame, slug: 'toy-b' };
    const loaded = await loadDailyPuzzle(game, '2040-06-01', getDict);
    expect(loaded.source).toBe('generated');
    // Must match what the generator script would have written for that date.
    const expected = generateDaily(game, contextFor(dict, '2040-06-01'));
    expect(loaded.puzzle).toEqual(expected.puzzle);
  });

  it('generates the puzzle itself when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    );
    const loaded = await loadDailyPuzzle({ ...toyGame, slug: 'toy-c' }, '2040-06-01', getDict);
    expect(loaded.source).toBe('generated');
  });

  it('generates the puzzle itself when the file lacks that date', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ game: 'toy', month: '2040-06', days: {} })),
    );
    const loaded = await loadDailyPuzzle({ ...toyGame, slug: 'toy-d' }, '2040-06-02', getDict);
    expect(loaded.source).toBe('generated');
  });

  it('fetches the sentence bank only for games that need it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Not found', { status: 404 })),
    );
    const bank = { books: [], entries: [] };
    const getSentences = vi.fn(async () => bank);
    const needy = {
      ...toyGame,
      slug: 'toy-e',
      needs: ['sentences'] as const,
      generate: vi.fn(toyGame.generate),
    };
    await loadDailyPuzzle(needy, '2040-06-03', { ...getDict, sentences: getSentences });
    expect(getSentences).toHaveBeenCalledOnce();
    expect(needy.generate.mock.calls[0]?.[1].sentences).toBe(bank);

    getSentences.mockClear();
    await loadDailyPuzzle({ ...toyGame, slug: 'toy-f' }, '2040-06-03', {
      ...getDict,
      sentences: getSentences,
    });
    expect(getSentences).not.toHaveBeenCalled();
  });
});
