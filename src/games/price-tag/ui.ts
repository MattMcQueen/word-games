/**
 * Price Tag's board: the budget panel and a live running cost, on top of the
 * shared word-hunt board (word box, keyboard with each letter's price, words
 * found). The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { letters } from '../../core/text.ts';
import { h, targetLine } from '../../ui/dom.ts';
import type { GameModule } from '../../ui/game-shell.ts';
import { answersSummary } from '../../ui/results.ts';
import { mountWordHunt, type WordHuntData } from '../../ui/word-hunt.ts';
import { gameUrl } from '../catalogue.ts';
import { priceTagLogic } from './logic.ts';
import { bestOf, describeOutcome, pence, resultFor, shareLines, wordProblem } from './scoring.ts';
import {
  compareScores,
  NAME,
  type PriceTagPuzzle,
  type PriceTagSolution,
  SLUG,
  wordCost,
} from './spec.ts';
import './price-tag.css';

/** "14p · 6p left" line shown under the word box while typing. */
function costText(word: string, puzzle: PriceTagPuzzle): { text: string; over: boolean } {
  if (!word) return { text: 'Type a word to see its price', over: false };
  const cost = wordCost(word, puzzle.prices);
  const left = puzzle.budget - cost;
  return left >= 0
    ? { text: `${pence(cost)} · ${pence(left)} left`, over: false }
    : { text: `${pence(cost)} · ${pence(-left)} over budget`, over: true };
}

export const priceTagGame: GameModule<PriceTagPuzzle, PriceTagSolution, WordHuntData> = {
  logic: priceTagLogic,
  name: NAME,
  initialData: () => ({ words: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const cost = (w: string) => wordCost(w, puzzle.prices);
    const score = (w: string) => ({ length: w.length, cost: cost(w) });

    const bestLine = h('p', { class: 'best-line' });
    const costLine = h('p', { class: 'live-line', 'aria-hidden': 'true' });
    const showCost = (word: string) => {
      const { text, over } = costText(word, puzzle);
      costLine.textContent = text;
      costLine.dataset.warn = String(over);
    };
    showCost('');

    const { keyboard } = mountWordHunt({
      ctx,
      top: [
        h(
          'section',
          { class: 'panel pt-budget', 'aria-label': 'Budget' },
          h('p', { class: 'pt-budget-label' }, 'Budget'),
          h('p', { class: 'pt-budget-value' }, pence(puzzle.budget)),
          targetLine(`${letters(solution.bestLength)} for up to ${pence(puzzle.budget)}`),
          bestLine,
        ),
      ],
      belowInput: [costLine],
      onType: showCost,
      problem: (word, found) => wordProblem(word, puzzle, dict, found),
      compare: (a, b) => compareScores(score(a), score(b)),
      describe: (w) => `${letters(w.length)}, ${pence(cost(w))}`,
      accepted: (w, isNewBest) =>
        `${w.toUpperCase()}: ${letters(w.length)} for ${pence(cost(w))}.${isNewBest ? ' New best!' : ''}`,
      result: (words, gaveUp) => resultFor(words, puzzle, solution, gaveUp),
      onRender: (best) => {
        bestLine.textContent = best
          ? `Your best: ${best.toUpperCase()} · ${letters(best.length)} · ${pence(cost(best))}`
          : 'No words yet';
      },
    });

    puzzle.prices.forEach((price, i) => {
      keyboard.setKey(String.fromCharCode(97 + i), { hint: pence(price) });
    });
  },

  summarise({ puzzle, solution, data, result, date }) {
    const best = bestOf(data.words, puzzle.prices);
    return {
      detail: describeOutcome(best, solution),
      ...answersSummary(solution.answers),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(best, puzzle, solution, result.perfect),
        url: gameUrl(SLUG),
      }),
    };
  },
};
