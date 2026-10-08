/**
 * The shared page shell every game runs inside. It handles everything that
 * isn't specific to one game:
 *   - the page frame (header, Support me button) and the game's title bar
 *   - picking the date (today, or ?date=YYYY-MM-DD for the archive)
 *   - loading the puzzle and dictionary, with an error state and retry
 *   - restoring and saving progress, recording stats
 *   - archive and stats buttons, a pointer to How to play on a first visit,
 *     and a notice when midnight passes
 *
 * A game provides a GameModule; its mount() only has to draw the board.
 */

import { LAUNCH_DATE } from '../config.ts';
import {
  formatLongDate,
  isDateKey,
  msUntilMidnight,
  puzzleNumber,
  todayKey,
} from '../core/date.ts';
import { type Dictionary, loadDictionary } from '../core/dictionary.ts';
import type { GameLogic } from '../core/game.ts';
import { finishDay, type GameResult, loadDay, loadStats, saveDay } from '../core/progress.ts';
import { loadDailyPuzzle } from '../core/puzzle-loader.ts';
import { readJson, writeJson } from '../core/storage.ts';
import { gamePath, howToPlayPath } from '../games/catalogue.ts';
import { openArchive } from './archive.ts';
import { h, type IconName, icon, replaceChildren } from './dom.ts';
import { openModal } from './modal.ts';
import { gameNav, renderPage } from './page.ts';
import { type ResultSummary, showResults, statsGrid } from './results.ts';
import { toast } from './toast.ts';

import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';

/** What the shell hands to a game's mount(). */
export interface GameContext<P, S, D> {
  /** Element to draw the board into. */
  root: HTMLElement;
  puzzle: P;
  solution: S;
  dict: Dictionary;
  date: string;
  /** Saved state from a previous visit, or the game's initial state. */
  data: D;
  /** True if this puzzle was already finished on a previous visit. */
  finished: boolean;
  /** Persist in-progress state. Call after every meaningful change. */
  save(data: D): void;
  /** End the puzzle: saves, updates stats and opens the results panel. */
  finish(data: D, result: GameResult): void;
  /** Reopen the results panel (for a "See results" button). */
  showResults(): void;
}

export interface GameModule<P, S, D> {
  logic: GameLogic<P, S>;
  name: string;
  /** Fresh state for a puzzle nobody has started. */
  initialData(puzzle: P): D;
  mount(ctx: GameContext<P, S, D>): void;
  /** Describe the outcome for the results panel and share text. */
  summarise(args: {
    puzzle: P;
    solution: S;
    data: D;
    result: GameResult;
    date: string;
  }): ResultSummary;
}

/** The date to show: ?date= if it's a valid past puzzle, otherwise today. */
function chooseDate(today: string): string {
  const requested = new URLSearchParams(location.search).get('date');
  if (requested === null) return today;
  if (isDateKey(requested) && requested >= LAUNCH_DATE && requested <= today) return requested;
  toast("That date isn't in the archive, so here's today's puzzle.");
  history.replaceState(null, '', location.pathname);
  return today;
}

export function startGame<P, S, D>(game: GameModule<P, S, D>): void {
  const { slug } = game.logic;
  const path = gamePath(slug);
  const today = todayKey();
  const date = chooseDate(today);
  const isToday = date === today;

  // Set once the puzzle has loaded; the stats button behaves differently before and after.
  let openResults: (() => void) | undefined;

  const showArchive = () => openArchive({ slug, path, today, current: date });
  const showStats = () => {
    if (openResults) return openResults();
    openModal({ title: `${game.name} stats`, content: statsGrid(loadStats(slug, today)) });
  };
  // On phones these shrink to round icon buttons (the label stays for screen readers).
  const toolButton = (iconName: IconName, label: string, onclick: () => void) =>
    h(
      'button',
      { class: 'btn quiet tool-btn', type: 'button', title: label, onclick },
      icon(iconName),
      h('span', { class: 'tool-label' }, label),
    );

  const main = renderPage({ title: game.name, nav: gameNav(slug, 'play'), width: 'game' });
  main.append(
    h(
      'div',
      { class: 'game-bar' },
      h(
        'div',
        { class: 'game-title' },
        h('h1', null, game.name),
        h('p', { class: 'date-line' }, `#${puzzleNumber(date)} · ${formatLongDate(date)}`),
      ),
      h(
        'div',
        { class: 'game-tools' },
        toolButton('calendar', 'Archive', showArchive),
        toolButton('chart', 'Stats', showStats),
      ),
    ),
  );
  if (!isToday) {
    main.append(
      h(
        'p',
        { class: 'notice' },
        "You're playing a puzzle from the archive. ",
        h('a', { href: path }, "Go to today's puzzle"),
      ),
    );
  }

  const board = h(
    'div',
    { class: 'board', 'aria-busy': 'true' },
    h('p', { class: 'muted' }, 'Loading puzzle…'),
  );
  main.append(board);

  async function load() {
    try {
      const [{ puzzle, solution }, dict] = await Promise.all([
        loadDailyPuzzle(game.logic, date),
        loadDictionary(),
      ]);
      const saved = loadDay<D>(slug, date);
      const finished = saved?.status === 'finished';

      openResults = () => {
        const record = loadDay<D>(slug, date);
        if (record?.status !== 'finished' || !record.result) {
          openModal({ title: `${game.name} stats`, content: statsGrid(loadStats(slug, today)) });
          return;
        }
        showResults({
          result: record.result,
          summary: game.summarise({
            puzzle,
            solution,
            data: record.data,
            result: record.result,
            date,
          }),
          stats: loadStats(slug, today),
          isToday,
          onArchive: showArchive,
        });
      };

      board.removeAttribute('aria-busy');
      board.replaceChildren();
      game.mount({
        root: board,
        puzzle,
        solution,
        dict,
        date,
        data: saved?.data ?? game.initialData(puzzle),
        finished,
        save: (data) => {
          if (loadDay(slug, date)?.status !== 'finished')
            saveDay(slug, date, { status: 'playing', data });
        },
        finish: (data, result) => {
          finishDay(slug, date, today, data, result);
          openResults?.();
        },
        showResults: () => openResults?.(),
      });
    } catch (err) {
      console.error(err);
      board.removeAttribute('aria-busy');
      replaceChildren(
        board,
        h(
          'p',
          { role: 'alert' },
          "Sorry, the puzzle couldn't be loaded. Check your connection and try again.",
        ),
        h('button', { class: 'btn', type: 'button', onclick: () => void load() }, 'Try again'),
      );
    }
  }

  void load();

  // First visit to this game: point to the rules.
  if (!readJson<boolean>(`${slug}:seen-help`, false)) {
    writeJson(`${slug}:seen-help`, true);
    board.before(
      h(
        'p',
        { class: 'notice' },
        `New to ${game.name}? `,
        h('a', { href: howToPlayPath(slug) }, 'Read how to play'),
        ' first.',
      ),
    );
  }

  // If the page is left open past midnight, offer the new puzzle.
  if (isToday) {
    setTimeout(() => {
      main
        .querySelector('.game-bar')
        ?.after(
          h(
            'p',
            { class: 'notice', role: 'status' },
            "It's past midnight, so there's a new puzzle. ",
            h('a', { href: path }, 'Play it now'),
          ),
        );
    }, msUntilMidnight() + 1000);
  }
}
