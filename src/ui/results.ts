/**
 * The results panel shown when a puzzle is finished: how the player did
 * against the optimum, the best answer(s) (each word a link to look it up),
 * their stats, a share button, the next game to play and a countdown to the
 * next puzzle.
 */

import { msUntilMidnight } from '../core/date.ts';
import type { DayMark, GameResult, GameStats } from '../core/progress.ts';
import { copyText } from '../core/share.ts';
import { type Child, h, icon } from './dom.ts';
import { openModal } from './modal.ts';
import { toast } from './toast.ts';

export interface ResultSummary {
  /** e.g. "You found 7 letters; the best possible was 9." */
  detail: string;
  /** Heading for the answers list, e.g. "Best answers". */
  answersLabel: string;
  /** The optimal answer(s), formatted for display; words can be lookUp() links. */
  answers: Child[];
  /** Show the answers as a line of prose (a sentence or a title) rather than as word chips. */
  prose?: boolean;
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

const MARKS: Record<DayMark, { symbol: string; word: string }> = {
  perfect: { symbol: '★', word: 'perfect' },
  done: { symbol: '✓', word: 'finished' },
  missed: { symbol: '·', word: 'not finished' },
};

/** The last fortnight at a glance: a tile per day, ★ perfect, ✓ finished, · not finished. */
export function recentDaysStrip(marks: readonly DayMark[]): HTMLElement | null {
  if (marks.length === 0) return null;
  const count = (mark: DayMark) => marks.filter((m) => m === mark).length;
  const spoken = (['perfect', 'done', 'missed'] as const)
    .map((m) => `${count(m)} ${MARKS[m].word}`)
    .join(', ');
  return h(
    'div',
    { class: 'recent' },
    h(
      'p',
      { class: 'recent-label' },
      `Your last ${marks.length === 1 ? 'day' : `${marks.length} days`}`,
    ),
    h(
      'p',
      { class: 'recent-days', role: 'img', 'aria-label': spoken },
      marks.map((m) => h('span', { class: `recent-day recent-${m}` }, MARKS[m].symbol)),
    ),
  );
}

/** Another of today's games, to offer once one is finished. */
export interface NextGame {
  name: string;
  tagline: string;
  href: string;
}

/** "Next up" with a link to play it, or a well done once every game is finished today. */
function nextUp(next: NextGame | null): HTMLElement {
  if (!next) {
    return h(
      'p',
      { class: 'next-up next-up-done' },
      "That's every game done for today. Well played!",
    );
  }
  return h(
    'div',
    { class: 'next-up' },
    h(
      'p',
      null,
      h('span', { class: 'next-up-label' }, 'Next up'),
      h('strong', null, next.name),
      h('span', { class: 'next-up-tagline' }, next.tagline),
    ),
    h('a', { class: 'btn primary', href: next.href }, `Play ${next.name}`),
  );
}

export function showResults(opts: {
  result: GameResult;
  summary: ResultSummary;
  stats: GameStats;
  isToday: boolean;
  onArchive: () => void;
  /** Today's next unfinished game (null when they're all done); left out for archive puzzles. */
  next?: NextGame | null;
  /** How the recent days went, for the strip under the stats. */
  recent?: readonly DayMark[];
}) {
  const { result, summary, stats, isToday, onArchive, next, recent = [] } = opts;

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

  const { dialog } = openModal({
    title: headline(result),
    content: [
      h('p', { class: 'result-detail' }, summary.detail),
      answersSection(summary),
      summary.credit ? h('div', { class: 'result-credit lw-credit' }, summary.credit) : null,
      h('h3', null, 'Your stats'),
      statsGrid(stats),
      recentDaysStrip(recent),
      h(
        'div',
        { class: 'result-actions' },
        share,
        h('button', { class: 'btn', type: 'button', onclick: onArchive }, 'Play the archive'),
      ),
      next === undefined ? null : nextUp(next),
      isToday ? countdown() : null,
    ],
  });
  if (result.perfect) celebrate(dialog);
}

/** A short shower of letter tiles over the results of a perfect game, unless motion is turned down. */
function celebrate(dialog: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = h('div', { class: 'celebrate', 'aria-hidden': 'true' });
  const letters = 'PERFECT★WORD★';
  for (let i = 0; i < 26; i++) {
    const tile = h('span', null, letters[i % letters.length]);
    tile.style.setProperty('--x', `${Math.round(Math.random() * 94)}%`);
    tile.style.setProperty('--delay', `${(Math.random() * 0.5).toFixed(2)}s`);
    tile.style.setProperty('--spin', `${Math.round(Math.random() * 540 - 270)}deg`);
    layer.append(tile);
  }
  dialog.append(layer);
  setTimeout(() => layer.remove(), 3000);
}

/** The answers, as word chips (or a line of prose), with a note when the words can be looked up. */
function answersSection(summary: ResultSummary): HTMLElement {
  const list = h(
    'ul',
    { class: summary.prose ? 'prose' : null },
    summary.answers.map((a) => h('li', null, a)),
  );
  return h(
    'section',
    { class: 'best-answers', 'aria-label': summary.answersLabel },
    h('h3', null, summary.answersLabel),
    list,
    list.querySelector('a.lookup')
      ? h('p', { class: 'lookup-note' }, 'Tap a word to look it up in Wiktionary.')
      : null,
  );
}

/** Label and list for the best answers, capped so a long list stays readable. */
export function answersSummary(
  answers: readonly string[],
  max = 12,
): Pick<ResultSummary, 'answersLabel' | 'answers'> {
  const shown = answers.slice(0, max).map(lookUp);
  const extra = answers.length - shown.length;
  return {
    answersLabel: answers.length === 1 ? 'Best answer' : 'Best answers',
    answers: extra > 0 ? [...shown, `and ${extra} more`] : shown,
  };
}

/** A word as a link to its Wiktionary entry, opening in a new tab. (The chips show it in capitals.) */
export const lookUp = (word: string): HTMLElement =>
  h(
    'a',
    {
      class: 'lookup',
      href: `https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}#English`,
      target: '_blank',
      rel: 'noopener',
      title: `Look up ${word.toUpperCase()} in Wiktionary`,
    },
    word,
  );

/** Text with every word of three or more letters made a lookUp() link: "BAT ↔ BET". */
export const lookUpAll = (text: string): Child[] =>
  text.split(/([A-Za-z]{3,})/).map((part, i) => (i % 2 ? lookUp(part) : part));
