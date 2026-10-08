/**
 * Spoiler-free share text, in the spirit of Wordle's emoji grids, plus a
 * clipboard helper that copes with older browsers and insecure contexts.
 */

import { SITE_NAME } from '../config.ts';

export interface ShareInput {
  /** Game name, e.g. "Price Tag". */
  game: string;
  puzzleNumber: number;
  /** Lines describing the result; must not give away any answer. */
  lines: string[];
  /** Link to the game, usually location.origin + path. */
  url: string;
}

export function buildShareText({ game, puzzleNumber, lines, url }: ShareInput): string {
  return [`${SITE_NAME} · ${game} #${puzzleNumber}`, ...lines, url].join('\n');
}

/**
 * A five-cell meter of how close the player got to the optimum, e.g. 🟩🟩🟩🟩⬜.
 * Pass `lowerIsBetter` for games where the target is a minimum (shortest word,
 * fewest words). Always pair it with the numbers so meaning isn't colour-only.
 */
export function scoreMeter(score: number, best: number, lowerIsBetter = false, cells = 5): string {
  let ratio: number;
  if (score <= 0 || best <= 0) ratio = 0;
  else ratio = lowerIsBetter ? best / score : score / best;
  const filled = Math.max(0, Math.min(cells, Math.round(ratio * cells)));
  // Never show a full meter unless it really was the optimum.
  const shown = ratio < 1 && filled === cells ? cells - 1 : filled;
  return '🟩'.repeat(shown) + '⬜'.repeat(cells - shown);
}

/** Copy text to the clipboard. Resolves to false if every method failed. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without the async clipboard API.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
