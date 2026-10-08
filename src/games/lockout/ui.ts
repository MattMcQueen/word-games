/**
 * Lockout's board: the required letter and the eight locked-out letters, with
 * the locked keys switched off on the keyboard, on the shared word-hunt board.
 */

import { puzzleNumber } from '../../core/date.ts';
import {
  describeLongest,
  longerWins,
  longestOf,
  longestResult,
  shareLongest,
} from '../../core/longest.ts';
import { buildShareText } from '../../core/share.ts';
import { letters } from '../../core/text.ts';
import { h } from '../../ui/dom.ts';
import type { GameModule } from '../../ui/game-shell.ts';
import { answersSummary } from '../../ui/results.ts';
import { mountWordHunt, type WordHuntData } from '../../ui/word-hunt.ts';
import { gameUrl } from '../catalogue.ts';
import { lockoutLogic } from './logic.ts';
import { lockoutProblem } from './scoring.ts';
import { type LockoutPuzzle, type LockoutSolution, NAME, SLUG } from './spec.ts';
import './lockout.css';

export const lockoutGame: GameModule<LockoutPuzzle, LockoutSolution, WordHuntData> = {
  logic: lockoutLogic,
  name: NAME,
  initialData: () => ({ words: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const R = puzzle.required.toUpperCase();
    const bestLine = h('p', { class: 'best-line' });
    const needLine = h('p', { class: 'live-line', 'aria-hidden': 'true' });
    const showNeed = (word: string) => {
      if (!word) needLine.textContent = `Every word needs ${R}`;
      else if (word.includes(puzzle.required)) needLine.textContent = `✓ Has ${R}`;
      else needLine.textContent = `Still needs ${R}`;
      needLine.dataset.warn = 'false';
    };
    showNeed('');

    const { keyboard } = mountWordHunt({
      ctx,
      top: [
        h(
          'section',
          { class: 'panel lo-panel', 'aria-label': "Today's letters" },
          h(
            'div',
            { class: 'lo-group' },
            h('p', { class: 'lo-label' }, 'Must use'),
            h('p', { class: 'lo-tiles' }, h('span', { class: 'lo-tile lo-required' }, R)),
          ),
          h(
            'div',
            { class: 'lo-group' },
            h('p', { class: 'lo-label' }, 'Locked out'),
            h(
              'p',
              { class: 'lo-tiles' },
              [...puzzle.banned.toUpperCase()].map((ch) =>
                h('span', { class: 'lo-tile lo-banned' }, ch),
              ),
            ),
          ),
          bestLine,
        ),
      ],
      belowInput: [needLine],
      allowLetter: (_typed, letter) => !puzzle.banned.includes(letter),
      onType: showNeed,
      problem: (word, found) => lockoutProblem(word, puzzle, dict, found),
      compare: longerWins,
      describe: (w) => letters(w.length),
      accepted: (w, isNewBest) =>
        `${w.toUpperCase()}: ${letters(w.length)}.${isNewBest ? ' Your longest yet!' : ''}`,
      result: (words, gaveUp) => longestResult(words, solution.bestLength, gaveUp),
      onRender: (best) => {
        bestLine.textContent = best
          ? `Your longest: ${best.toUpperCase()} · ${letters(best.length)}`
          : 'No words yet';
      },
    });

    keyboard.setKey(puzzle.required, { highlight: true, hint: 'must' });
    for (const ch of puzzle.banned) keyboard.setKey(ch, { disabled: true, hint: 'out' });
  },

  summarise({ puzzle, solution, data, date }) {
    return {
      detail: describeLongest(
        longestOf(data.words),
        solution.bestLength,
        `with ${puzzle.required.toUpperCase()} and none of the locked-out letters`,
      ),
      ...answersSummary(solution.answers),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLongest('🔒', data.words, solution.bestLength),
        url: gameUrl(SLUG),
      }),
    };
  },
};
