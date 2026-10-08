/**
 * Price Tag's board: budget panel, word entry with a live running cost, an
 * on-screen keyboard showing each letter's price, and the list of words found.
 * The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { h, replaceChildren } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { createKeyboard } from '../../ui/keyboard.ts';
import { confirmModal } from '../../ui/modal.ts';
import { answersSummary } from '../../ui/results.ts';
import { createWordInput } from '../../ui/word-input.ts';
import { gameUrl } from '../catalogue.ts';
import { priceTagLogic } from './logic.ts';
import {
  bestOf,
  describeOutcome,
  pence,
  resultFor,
  type ScoredWord,
  shareLines,
  wordProblem,
} from './scoring.ts';
import {
  compareScores,
  letters,
  NAME,
  type PriceTagPuzzle,
  type PriceTagSolution,
  SLUG,
  wordCost,
} from './spec.ts';
import './price-tag.css';

interface PriceTagData {
  /** Valid, affordable words the player has found, in the order found. */
  words: string[];
}

type Ctx = GameContext<PriceTagPuzzle, PriceTagSolution, PriceTagData>;

/** "Cost: 14p · 6p left" line shown under the word box while typing. */
function costText(word: string, puzzle: PriceTagPuzzle): { text: string; over: boolean } {
  if (!word) return { text: 'Type a word to see its price', over: false };
  const cost = wordCost(word, puzzle.prices);
  const left = puzzle.budget - cost;
  return left >= 0
    ? { text: `${pence(cost)} · ${pence(left)} left`, over: false }
    : { text: `${pence(cost)} · ${pence(-left)} over budget`, over: true };
}

function foundItem(word: string, puzzle: PriceTagPuzzle, isBest: boolean) {
  return h(
    'li',
    { class: isBest ? 'pt-is-best' : null },
    h('span', { class: 'pt-word' }, word),
    h(
      'span',
      { class: 'pt-word-meta' },
      `${letters(word.length)}, ${pence(wordCost(word, puzzle.prices))}`,
    ),
    isBest ? h('span', { class: 'pt-best-tag' }, '★ Best') : null,
  );
}

function mount(ctx: Ctx) {
  const { root, puzzle, solution, dict } = ctx;
  const data: PriceTagData = { words: [...ctx.data.words] };
  let finished = ctx.finished;
  const score = (w: string) => ({ length: w.length, cost: wordCost(w, puzzle.prices) });

  const bestLine = h('p', { class: 'pt-best' });
  const costLine = h('p', { class: 'pt-cost', 'aria-hidden': 'true' });
  const foundHeading = h('h2', { class: 'pt-found-heading' });
  const foundList = h('ul', { class: 'pt-found' });
  const actions = h('div', { class: 'pt-actions' });

  const input = createWordInput({
    label: 'Your word',
    onChange: (word) => {
      const { text, over } = costText(word, puzzle);
      costLine.textContent = text;
      costLine.dataset.over = String(over);
    },
    onSubmit: submit,
  });

  const keyboard = createKeyboard(input.keyboardHandlers);
  puzzle.prices.forEach((price, i) => {
    keyboard.setKey(String.fromCharCode(97 + i), { hint: pence(price) });
  });

  const finishButton = h(
    'button',
    { class: 'btn', type: 'button', onclick: confirmFinish },
    'Finish',
  );
  const resultsButton = h(
    'button',
    { class: 'btn primary', type: 'button', onclick: () => ctx.showResults() },
    'See results',
  );

  function render() {
    const best = bestOf(data.words, puzzle.prices);
    bestLine.textContent = best
      ? `Your best: ${best.word.toUpperCase()} · ${letters(best.length)} · ${pence(best.cost)}`
      : 'No words yet';

    foundHeading.textContent = `Words found: ${data.words.length}`;
    const sorted = [...data.words].sort(
      (a, b) => compareScores(score(b), score(a)) || a.localeCompare(b),
    );
    replaceChildren(
      foundList,
      sorted.map((w) => foundItem(w, puzzle, w === best?.word)),
    );

    input.setDisabled(finished);
    for (const el of [keyboard.el, input.el, costLine]) el.hidden = finished;
    replaceChildren(actions, finished ? resultsButton : finishButton);
  }

  function end(gaveUp: boolean) {
    finished = true;
    render();
    ctx.finish(data, resultFor(data.words, puzzle, solution, gaveUp));
  }

  function submit(word: string) {
    if (!word) return;
    const problem = wordProblem(word, puzzle, dict, data.words);
    if (problem) return input.feedback(problem, 'bad');

    const previousBest = bestOf(data.words, puzzle.prices);
    data.words.push(word);
    input.setValue('');
    const isNewBest = !previousBest || compareScores(score(word), previousBest) > 0;
    const { cost } = score(word);
    input.feedback(
      `${word.toUpperCase()}: ${letters(word.length)} for ${pence(cost)}.${isNewBest ? ' New best!' : ''}`,
      'good',
    );

    if (resultFor(data.words, puzzle, solution, false).perfect) return end(false);
    ctx.save(data);
    render();
  }

  function confirmFinish() {
    confirmModal({
      title: 'Finish now?',
      message: "You'll see the best possible answer and won't be able to add more words.",
      confirmLabel: 'Finish and see answers',
      cancelLabel: 'Keep playing',
      onConfirm: () => end(true),
    });
  }

  root.append(
    h(
      'section',
      { class: 'panel pt-budget', 'aria-label': 'Budget' },
      h('p', { class: 'pt-budget-label' }, 'Budget'),
      h('p', { class: 'pt-budget-value' }, pence(puzzle.budget)),
      bestLine,
    ),
    input.el,
    costLine,
    keyboard.el,
    actions,
    h(
      'section',
      { class: 'pt-found-section', 'aria-label': 'Words found' },
      foundHeading,
      foundList,
    ),
  );
  costLine.textContent = costText('', puzzle).text;
  render();
  if (!finished) input.focus();
}

export const priceTagGame: GameModule<PriceTagPuzzle, PriceTagSolution, PriceTagData> = {
  logic: priceTagLogic,
  name: NAME,
  initialData: () => ({ words: [] }),
  mount,

  summarise({ puzzle, solution, data, result, date }) {
    const best: ScoredWord | null = bestOf(data.words, puzzle.prices);
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
