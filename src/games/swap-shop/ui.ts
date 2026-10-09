/**
 * Swap Shop's board: the day's swap and length rule, a found/total counter,
 * and a live preview of what the typed word becomes, on the common word
 * board. The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { letters } from '../../core/text.ts';
import { h } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { lookUpAll } from '../../ui/results.ts';
import { foundItem, mountWordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { swapShopLogic } from './logic.ts';
import { describeOutcome, missedPairs, resultFor, shareLines, swapProblem } from './scoring.ts';
import {
  familyHead,
  isBonus,
  lengthRule,
  NAME,
  pairKey,
  pairLabel,
  SLUG,
  type SwapShopPuzzle,
  type SwapShopSolution,
  swapLetters,
} from './spec.ts';
import './swap-shop.css';

interface SwapShopData {
  /** Pair keys ("bat/bet") in the order found: the pairs to find. */
  pairs: string[];
  /** Bonus pairs found (rarer words). Missing from games saved before bonuses existed. */
  bonus?: string[];
}

export const swapShopGame: GameModule<SwapShopPuzzle, SwapShopSolution, SwapShopData> = {
  logic: swapShopLogic,
  name: NAME,
  initialData: () => ({ pairs: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const [a = '', b = ''] = puzzle.letters;
    const [A, B] = [a.toUpperCase(), b.toUpperCase()];
    const data: SwapShopData = { pairs: [...ctx.data.pairs], bonus: [...(ctx.data.bonus ?? [])] };
    const bonus = data.bonus ?? [];
    const total = solution.pairs.length;

    const counter = h('p', { class: 'ss-counter' });
    const meter = h('div', { class: 'ss-meter', 'aria-hidden': 'true' }, h('span'));
    const previewLine = h('p', { class: 'live-line', 'aria-hidden': 'true' });
    const showPreview = (word: string) => {
      previewLine.textContent = word
        ? `${word.toUpperCase()} → ${swapLetters(word, a, b).toUpperCase()}`
        : `Every ${A} becomes ${B}, and every ${B} becomes ${A}`;
    };
    showPreview('');

    const board = mountWordBoard({
      ctx: ctx as GameContext<unknown, unknown, SwapShopData>,
      data,
      top: [
        h(
          'section',
          { class: 'panel ss-panel', 'aria-label': "Today's swap" },
          h(
            'p',
            { class: 'ss-swap' },
            h('span', { class: 'sr-only' }, `${A} swaps with ${B}`),
            h('span', { class: 'ss-tile', 'aria-hidden': 'true' }, A),
            h('span', { class: 'ss-arrows', 'aria-hidden': 'true' }, '⇄'),
            h('span', { class: 'ss-tile', 'aria-hidden': 'true' }, B),
          ),
          h('p', { class: 'ss-rule' }, lengthRule(puzzle.length)),
          counter,
          meter,
        ),
      ],
      belowInput: [previewLine],
      onType: showPreview,
      submit(word, { input, commit }) {
        const problem = swapProblem(word, puzzle, solution, dict, [...data.pairs, ...bonus]);
        if (problem) return input.feedback(problem, 'bad');
        const typed = pairKey(word, swapLetters(word, a, b));
        const key = familyHead(typed, solution);
        const extra = isBonus(key, solution);
        (extra ? bonus : data.pairs).push(key);
        input.setValue('');
        const found =
          key === typed ? pairLabel(key) : `${pairLabel(typed)} counts as ${pairLabel(key)}`;
        input.feedback(
          extra
            ? `${found}: a bonus pair! Rarer words don't count towards the ${total}.`
            : `${found}: a pair!`,
          'good',
        );
        commit();
      },
      found: () => ({
        heading: `Pairs found: ${data.pairs.length}${bonus.length ? ` + ${bonus.length} bonus` : ''}`,
        items: [...data.pairs, ...bonus].sort().map((key) => {
          const more = solution.also[key]?.length ?? 0;
          const meta = more
            ? `${letters(key.indexOf('/'))}, and ${more} more forms`
            : letters(key.indexOf('/'));
          return foundItem(pairLabel(key), meta, bonus.includes(key) ? 'Bonus' : undefined);
        }),
      }),
      result: (gaveUp) => resultFor(data.pairs, solution, gaveUp),
      onRender() {
        counter.textContent = `Found ${data.pairs.length} of ${total} pairs${bonus.length ? ` · ${bonus.length} bonus` : ''}`;
        (meter.firstChild as HTMLElement).style.width = `${(100 * data.pairs.length) / total}%`;
      },
    });

    board.keyboard.setKey(a, { highlight: true, hint: `↔${B}` });
    board.keyboard.setKey(b, { highlight: true, hint: `↔${A}` });
  },

  summarise({ puzzle, solution, data, date }) {
    const missed = missedPairs(data.pairs, solution);
    const bonus = data.bonus?.length ?? 0;
    return {
      detail: describeOutcome(data.pairs.length, solution.pairs.length, bonus),
      answersLabel: missed.length > 0 ? 'Pairs you missed' : 'Every pair',
      answers: (missed.length > 0 ? missed : solution.pairs).map((key) =>
        lookUpAll(pairLabel(key)),
      ),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(data.pairs.length, puzzle, solution, bonus),
        url: gameUrl(SLUG),
      }),
    };
  },
};
