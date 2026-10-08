import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJson, writeJson } from './storage.ts';

afterEach(() => vi.unstubAllGlobals());

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe('storage', () => {
  it('round-trips JSON through localStorage with a prefix', () => {
    const store = fakeStorage();
    vi.stubGlobal('localStorage', store);
    writeJson('a', { x: 1 });
    expect(store.getItem('wg:a')).toBe('{"x":1}');
    expect(readJson('a', null)).toEqual({ x: 1 });
  });

  it('returns the fallback for missing or corrupted entries', () => {
    const store = fakeStorage();
    vi.stubGlobal('localStorage', store);
    expect(readJson('missing', 42)).toBe(42);
    store.setItem('wg:bad', '{not json');
    expect(readJson('bad', 'fallback')).toBe('fallback');
  });

  it('keeps working in memory when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => writeJson('b', [1, 2])).not.toThrow();
    expect(readJson('b', null)).toEqual([1, 2]);
  });

  it('keeps working when localStorage is missing entirely', () => {
    vi.stubGlobal('localStorage', undefined);
    writeJson('c', 'hello');
    expect(readJson('c', null)).toBe('hello');
  });
});
