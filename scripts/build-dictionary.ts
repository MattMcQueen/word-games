/**
 * Builds public/data/words.txt, the single dictionary shared by every game.
 *
 *   npm run build:dictionary
 *
 * Source: SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson,
 * release 2020.12.07, British English (-ise spellings), size 50. That means the
 * english-words.* and british-words.* lists at sizes 10–50. Proper nouns,
 * abbreviations and contractions live in separate SCOWL lists that we don't
 * read. The filter also drops anything that isn't lowercase a–z with three or
 * more letters. Finally, data/blocklist.txt is applied.
 *
 * The download is pinned by URL and SHA-256 and cached in .cache/, so the
 * output only changes when this script or the blocklist does.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { filterWords, parseBlocklist } from './lib/word-filter.ts';

const ROOT = resolve(import.meta.dirname, '..');
const CACHE_DIR = join(ROOT, '.cache', 'scowl');
const TARBALL = 'scowl-2020.12.07.tar.gz';
const URL =
  'https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz';
const SHA256 = '5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc';
const SIZES = [10, 20, 35, 40, 50];
const LISTS = ['english-words', 'british-words'];
const OUTPUT = join(ROOT, 'public', 'data', 'words.txt');

async function ensureSource(): Promise<string> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const tarPath = join(CACHE_DIR, TARBALL);
  if (!existsSync(tarPath)) {
    console.log(`Downloading ${URL}`);
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    writeFileSync(tarPath, Buffer.from(await res.arrayBuffer()));
  }
  const hash = createHash('sha256').update(readFileSync(tarPath)).digest('hex');
  if (hash !== SHA256) throw new Error(`Checksum mismatch for ${tarPath}; delete it and retry.`);

  const finalDir = join(CACHE_DIR, 'scowl-2020.12.07', 'final');
  if (!existsSync(finalDir)) {
    // `tar` ships with Windows 10+, macOS and Linux. Run it inside the cache
    // folder with a relative path so Windows drive letters don't confuse it.
    execFileSync('tar', ['-xzf', TARBALL], { cwd: CACHE_DIR, stdio: 'inherit' });
  }
  return finalDir;
}

async function main() {
  const finalDir = await ensureSource();
  const raw: string[] = [];
  for (const list of LISTS) {
    for (const size of SIZES) {
      // SCOWL files are ISO-8859-1; accented words are filtered out anyway.
      raw.push(...readFileSync(join(finalDir, `${list}.${size}`), 'latin1').split(/\r?\n/));
    }
  }

  const blocklist = parseBlocklist(readFileSync(join(ROOT, 'data', 'blocklist.txt'), 'utf8'));
  const words = filterWords(raw, blocklist);

  mkdirSync(join(ROOT, 'public', 'data'), { recursive: true });
  writeFileSync(OUTPUT, `${words.join('\n')}\n`);
  console.log(`Wrote ${words.length} words to public/data/words.txt`);
}

await main();
