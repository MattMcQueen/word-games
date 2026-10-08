/**
 * A thin, crash-proof wrapper around localStorage. Storage can be missing or
 * throw (private browsing, disabled cookies, quota full), so every access is
 * wrapped in try/catch and falls back to an in-memory copy for this page.
 * The site keeps working either way; progress just won't survive a reload.
 */

const PREFIX = 'wg:';
const memory = new Map<string, string>();

function backend(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // some browsers throw just for touching localStorage
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const fullKey = PREFIX + key;
  let raw: string | null = null;
  try {
    raw = backend()?.getItem(fullKey) ?? null;
  } catch {
    /* fall through to memory */
  }
  raw ??= memory.get(fullKey) ?? null;
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback; // corrupted entry: start afresh rather than crash
  }
}

export function writeJson(key: string, value: unknown): void {
  const fullKey = PREFIX + key;
  const raw = JSON.stringify(value);
  memory.set(fullKey, raw);
  try {
    backend()?.setItem(fullKey, raw);
  } catch {
    /* memory copy is enough for this session */
  }
}
