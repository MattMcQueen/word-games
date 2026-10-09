/**
 * Halves' board: the twelve halves as buttons. Pick one, then another, to join
 * them; a right pair leaves the board and joins the list below. Unlike the
 * other games there's no word box, since every move is a pair of taps (or,
 * with a keyboard, Tab and Enter). The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { createRng } from '../../core/rng.ts';
import { buildShareText } from '../../core/share.ts';
import { plural } from '../../core/text.ts';
import { h, replaceChildren } from '../../ui/dom.ts';
import type { GameModule } from '../../ui/game-shell.ts';
import { confirmModal } from '../../ui/modal.ts';
import { lookUp } from '../../ui/results.ts';
import { finishOrResults, foundItem } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { halvesLogic } from './logic.ts';
import {
  allJoined,
  describeOutcome,
  emptyData,
  type HalvesData,
  halvesLeft,
  joined,
  mistakeCount,
  resultFor,
  shareLines,
  tryJoin,
} from './scoring.ts';
import { type HalvesPuzzle, type HalvesSolution, NAME, SLUG } from './spec.ts';
import './halves.css';

/** SUN + DAY, for the joined list and the answers. */
const sum = ([a, b]: readonly string[]) => `${a?.toUpperCase()} + ${b?.toUpperCase()}`;

export const halvesGame: GameModule<HalvesPuzzle, HalvesSolution, HalvesData> = {
  logic: halvesLogic,
  name: NAME,
  initialData: emptyData,

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const data: HalvesData = { tries: ctx.data.tries.map(([a, b]) => [a, b]) };
    let finished = ctx.finished;
    /** The first half of a join in progress. */
    let picked: string | null = null;

    // One button per half, kept for the whole game so keyboard focus survives redraws.
    const tiles = new Map(
      puzzle.halves.map((half) => [
        half,
        h(
          'button',
          { class: 'hv-tile', type: 'button', onclick: () => pick(half) },
          half.toUpperCase(),
        ),
      ]),
    );
    const grid = h('div', { class: 'hv-grid', role: 'group', 'aria-label': 'Halves to join' }, [
      ...tiles.values(),
    ]);
    const progress = h('p', { class: 'hv-progress' });
    // Moving the tiles round can make a pair jump out. Only the picture changes, so it isn't saved.
    const shuffle = h(
      'button',
      {
        class: 'btn quiet hv-shuffle',
        type: 'button',
        onclick: () => {
          const order = createRng(String(Math.random())).shuffle([...tiles.values()]);
          grid.append(...order);
          say('Shuffled the halves.');
        },
      },
      'Shuffle',
    );
    const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
    const actions = h('div', { class: 'board-actions' });
    const joinedHeading = h('h2', { class: 'found-heading' });
    const joinedList = h('ul', { class: 'found-list' });

    const say = (message: string, kind: 'info' | 'good' | 'bad' = 'info') => {
      feedback.textContent = message;
      feedback.dataset.kind = kind;
    };

    function pick(half: string) {
      if (finished) return;
      if (picked === null || picked === half) {
        picked = picked === half ? null : half;
        say(picked ? `${half.toUpperCase()} picked. Now pick the half to join it to.` : '');
        return render();
      }
      join(picked, half);
    }

    function join(a: string, b: string) {
      picked = null;
      const outcome = tryJoin(a, b, solution, data, dict);
      if (outcome.kind === 'repeat') {
        say(outcome.message);
        return render();
      }
      if (outcome.kind === 'mistake') {
        data.tries.push([a, b]);
        say(outcome.message, 'bad');
        shake(a, b);
        return commit();
      }
      data.tries.push(outcome.pair);
      let message = `${outcome.pair.join('').toUpperCase()}: ${sum(outcome.pair)}.`;
      // The last two halves can only go together, so join them too.
      const left = halvesLeft(puzzle.halves, data, solution);
      if (left.length === 2) {
        const last = solution.words.find((w) => left.includes(w[0])) as [string, string];
        data.tries.push(last);
        message += ` That leaves ${last.join('').toUpperCase()}.`;
      }
      say(message, 'good');
      commit();
    }

    function shake(...halves: string[]) {
      for (const half of halves) {
        const tile = tiles.get(half);
        tile?.classList.remove('shake');
        void tile?.offsetWidth; // restart the animation
        tile?.classList.add('shake');
      }
    }

    function commit() {
      if (allJoined(data, solution)) return end(false);
      ctx.save(data);
      render();
    }

    function end(gaveUp: boolean) {
      finished = true;
      picked = null;
      render();
      ctx.finish(data, resultFor(solution, data, gaveUp));
    }

    function confirmFinish() {
      confirmModal({
        title: 'Finish now?',
        message: [
          "You'll see the answers and won't be able to join any more halves.",
          'To join two halves, choose Keep playing and pick one, then the other.',
        ],
        confirmLabel: 'Finish and see answers',
        cancelLabel: 'Keep playing',
        onConfirm: () => end(true),
      });
    }

    function render() {
      const left = new Set(halvesLeft(puzzle.halves, data, solution));
      const focused = document.activeElement;
      for (const [half, tile] of tiles) {
        tile.hidden = !left.has(half);
        tile.setAttribute('aria-pressed', String(half === picked));
      }
      // If the focused tile has just been joined, move on to the first one left.
      if (focused instanceof HTMLElement && focused.hidden && grid.contains(focused)) {
        [...tiles.values()].find((t) => !t.hidden)?.focus();
      }
      grid.hidden = finished;
      shuffle.hidden = finished;
      feedback.hidden = finished;

      const done = joined(data, solution);
      const mistakes = mistakeCount(data, solution);
      progress.textContent = finished
        ? describeOutcome(solution, data)
        : `${plural(solution.words.length - done.length, 'word')} to go · ${plural(mistakes, 'mistake')}`;

      joinedHeading.textContent = `Joined: ${done.length} of ${solution.words.length}`;
      const missed = finished ? solution.words.filter((w) => !done.some((d) => d[0] === w[0])) : [];
      replaceChildren(joinedList, [
        ...done.map((pair) => foundItem(pair.join(''), sum(pair))),
        ...missed.map((pair) => foundItem(pair.join(''), sum(pair), 'Missed')),
      ]);
      replaceChildren(actions, finishOrResults(finished, confirmFinish, ctx.showResults));
    }

    ctx.root.append(
      h(
        'section',
        { class: 'panel hv-panel', 'aria-label': 'The halves' },
        h('p', { class: 'hv-label' }, 'Join the halves in pairs to make six words.'),
        grid,
        h('div', { class: 'hv-bar' }, progress, shuffle),
      ),
      feedback,
      actions,
      h(
        'section',
        { class: 'found-section', 'aria-label': 'Joined so far' },
        joinedHeading,
        joinedList,
      ),
    );
    render();
  },

  summarise({ solution, data, date }) {
    return {
      detail: describeOutcome(solution, data),
      answersLabel: "Today's six words",
      answers: solution.words.map((pair) => [lookUp(pair.join('')), ` (${sum(pair)})`]),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(solution, data),
        url: gameUrl(SLUG),
      }),
    };
  },
};
