/**
 * The shared page shell every game runs inside. It handles everything that
 * isn't specific to one game:
 *   - picking the date (today, or ?date=YYYY-MM-DD for the archive)
 *   - loading the puzzle and dictionary, with an error state and retry
 *   - restoring and saving progress, recording stats
 *   - header buttons for help, archive and stats/results
 *   - showing help on a first visit, and a notice when midnight passes
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
import { gamePath } from '../games/catalogue.ts';
import { openArchive } from './archive.ts';
import { type Child, h, replaceChildren } from './dom.ts';
import { renderHeader } from './header.ts';
import { openModal } from './modal.ts';
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
  /** Rules shown in the help dialog. */
  help(): Child;
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

  const showHelp = () => openModal({ title: `How to play ${game.name}`, content: game.help() });
  const showArchive = () => openArchive({ slug, path, today, current: date });
  const showStats = () => {
    if (openResults) return openResults();
    openModal({ title: `${game.name} stats`, content: statsGrid(loadStats(slug, today)) });
  };

  const main = h('main', { id: 'main' });
  document.title = `${game.name} – ${document.title}`;
  document.body.replaceChildren(
    h('a', { class: 'skip-link', href: '#main' }, 'Skip to game'),
    renderHeader({
      title: game.name,
      actions: [
        { icon: 'help', label: 'How to play', onClick: showHelp },
        { icon: 'calendar', label: 'Archive', onClick: showArchive },
        { icon: 'chart', label: 'Stats and results', onClick: showStats },
      ],
    }),
    main,
  );

  const dateLine = h(
    'p',
    { class: 'date-line' },
    h('span', null, `#${puzzleNumber(date)} · ${formatLongDate(date)}`),
    isToday ? null : h('a', { href: path }, "Go to today's puzzle"),
  );
  const board = h(
    'div',
    { class: 'board', 'aria-busy': 'true' },
    h('p', { class: 'muted' }, 'Loading puzzle…'),
  );
  main.append(dateLine, board);

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

  // First visit to this game: explain the rules.
  if (!readJson<boolean>(`${slug}:seen-help`, false)) {
    writeJson(`${slug}:seen-help`, true);
    showHelp();
  }

  // If the page is left open past midnight, offer the new puzzle.
  if (isToday) {
    setTimeout(() => {
      main.prepend(
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
