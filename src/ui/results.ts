/**
 * The results panel shown when a puzzle is finished: how the player did
 * against the optimum, the best answer(s), their stats, a share button and a
 * countdown to the next puzzle.
 */

import { msUntilMidnight } from '../core/date.ts';
import type { GameResult, GameStats } from '../core/progress.ts';
import { copyText } from '../core/share.ts';
import { type Child, h, icon } from './dom.ts';
import { openModal } from './modal.ts';
import { toast } from './toast.ts';

export interface ResultSummary {
  /** e.g. "You found 7 letters; the best possible was 9." */
  detail: string;
  /** Heading for the answers list, e.g. "Best answers". */
  answersLabel: string;
  /** The optimal answer(s), already formatted for display. */
  answers: string[];
  /** Full spoiler-free share text. */
  shareText: string;
  /** Optional credit shown under the answers, e.g. the book a sentence came from. */
  credit?: Child;
}

export function statsGrid(stats: GameStats): HTMLElement {
  const item = (value: number, label: string) =>
    h(
      'div',
      { class: 'stat' },
      h('span', { class: 'stat-value' }, value),
      h('span', { class: 'stat-label' }, label),
    );
  return h(
    'div',
    { class: 'stats-grid' },
    item(stats.played, 'Played'),
    item(stats.perfect, 'Perfect'),
    item(stats.currentStreak, 'Streak'),
    item(stats.maxStreak, 'Best streak'),
  );
}

function headline(result: GameResult): string {
  if (result.perfect) return 'Perfect!';
  if (result.score <= 0) return 'Better luck next time';
  return result.gaveUp ? 'Nice try' : 'Well played';
}

function countdown(): HTMLElement {
  const el = h('p', { class: 'countdown muted' });
  let started = false;
  const tick = () => {
    // Stop ticking once the dialog has been closed and removed.
    if (started && !el.isConnected) return clearInterval(timer);
    started = true;
    const s = Math.ceil(msUntilMidnight() / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    el.textContent = `Next puzzle in ${hh} h ${String(mm).padStart(2, '0')} min`;
  };
  const timer = setInterval(tick, 30_000);
  tick();
  return el;
}

export function showResults(opts: {
  result: GameResult;
  summary: ResultSummary;
  stats: GameStats;
  isToday: boolean;
  onArchive: () => void;
}) {
  const { result, summary, stats, isToday, onArchive } = opts;

  const share = h(
    'button',
    {
      class: 'btn primary',
      type: 'button',
      onclick: async () => {
        toast(
          (await copyText(summary.shareText))
            ? 'Result copied to clipboard'
            : 'Sorry, copying failed',
        );
      },
    },
    icon('share'),
    'Share result',
  );

  openModal({
    title: headline(result),
    content: [
      h('p', { class: 'result-detail' }, summary.detail),
      h(
        'section',
        { class: 'best-answers', 'aria-label': summary.answersLabel },
        h('h3', null, summary.answersLabel),
        h(
          'ul',
          null,
          summary.answers.map((a) => h('li', null, a)),
        ),
      ),
      summary.credit ? h('p', { class: 'result-credit' }, summary.credit) : null,
      h('h3', null, 'Your stats'),
      statsGrid(stats),
      h(
        'div',
        { class: 'result-actions' },
        share,
        h('button', { class: 'btn', type: 'button', onclick: onArchive }, 'Play the archive'),
      ),
      isToday ? countdown() : null,
    ],
  });
}

/** Label and list for the best answers, capped so a long list stays readable. */
export function answersSummary(
  answers: readonly string[],
  max = 12,
): Pick<ResultSummary, 'answersLabel' | 'answers'> {
  const shown = answers.slice(0, max);
  const extra = answers.length - shown.length;
  return {
    answersLabel: answers.length === 1 ? 'Best answer' : 'Best answers',
    answers: extra > 0 ? [...shown, `and ${extra} more`] : shown,
  };
}
