/**
 * The home page: today's date and how many of today's puzzles you've played,
 * then a card for each game with a small picture of it, today's status and
 * links to play it or read how to play.
 */

import { formatLongDate, puzzleNumber, todayKey } from '../core/date.ts';
import { loadDay } from '../core/progress.ts';
import { GAMES, type GameInfo, gamePath, howToPlayPath } from '../games/catalogue.ts';
import { h } from '../ui/dom.ts';
import { renderPage, siteNav } from '../ui/page.ts';
import { gamePreview } from './previews.ts';

type State = 'new' | 'playing' | 'done' | 'perfect';

/** Today's status for a game, in words with a symbol (never colour alone). */
function todayStatus(slug: string): { text: string; state: State; action: string } {
  const day = loadDay(slug, todayKey());
  if (!day) return { text: 'Not played yet', state: 'new', action: 'Play' };
  if (day.status === 'playing')
    return { text: '… In progress', state: 'playing', action: 'Continue' };
  return day.result?.perfect
    ? { text: '★ Perfect', state: 'perfect', action: 'See results' }
    : { text: '✓ Done', state: 'done', action: 'See results' };
}

function gameCard(game: GameInfo) {
  const status = todayStatus(game.slug);
  const headingId = `game-${game.slug}`;
  return h(
    'li',
    { class: 'game-card', 'data-state': status.state, 'aria-labelledby': headingId },
    gamePreview(game.slug),
    h(
      'div',
      { class: 'game-card-head' },
      h('h2', { id: headingId }, game.name),
      h('span', { class: 'game-card-status', 'data-state': status.state }, status.text),
    ),
    h('p', { class: 'game-card-tagline' }, game.tagline),
    h(
      'div',
      { class: 'game-card-actions' },
      h(
        'a',
        { class: 'btn primary', href: gamePath(game.slug), 'aria-describedby': headingId },
        status.action,
      ),
      h(
        'a',
        { class: 'btn quiet', href: howToPlayPath(game.slug), 'aria-describedby': headingId },
        'How to play',
      ),
    ),
  );
}

const today = todayKey();
const played = GAMES.filter((g) => loadDay(g.slug, today)?.status === 'finished').length;

renderPage({
  nav: siteNav('home'),
  width: 'page',
  content: h(
    'div',
    { class: 'page home-page' },
    h(
      'section',
      { class: 'hero home-hero' },
      h('span', { class: 'kicker' }, `${formatLongDate(today)} · No. ${puzzleNumber(today)}`),
      h('h1', null, 'Daily word games'),
      h(
        'p',
        null,
        `${GAMES.length} original word puzzles, new every day at midnight and the same for everyone. Free, with no ads, no accounts and no cookies.`,
      ),
      h(
        'p',
        { class: 'home-progress' },
        played === GAMES.length
          ? `You've done all ${GAMES.length} today. See you tomorrow!`
          : played
            ? `You've done ${played} of ${GAMES.length} today.`
            : 'Pick a game to start. Each takes a few minutes.',
      ),
    ),
    h('ul', { class: 'game-grid', 'aria-label': 'Games' }, GAMES.map(gameCard)),
  ),
});
