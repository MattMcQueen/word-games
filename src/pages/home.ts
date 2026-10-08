/**
 * The home page: a short introduction, then a card for each game with today's
 * status and links to play it or read how to play.
 */

import { todayKey } from '../core/date.ts';
import { loadDay } from '../core/progress.ts';
import { GAMES, type GameInfo, gamePath, howToPlayPath } from '../games/catalogue.ts';
import { h } from '../ui/dom.ts';
import { renderPage, siteNav } from '../ui/page.ts';

/** Today's status for a game, in words with a symbol (never colour alone). */
function todayStatus(slug: string): { text: string; state: string } {
  const day = loadDay(slug, todayKey());
  if (!day) return { text: 'Not played today', state: 'new' };
  if (day.status === 'playing') return { text: '… In progress', state: 'playing' };
  return day.result?.perfect
    ? { text: '★ Perfect today', state: 'perfect' }
    : { text: '✓ Played today', state: 'done' };
}

function gameCard(game: GameInfo) {
  const status = todayStatus(game.slug);
  const headingId = `game-${game.slug}`;
  return h(
    'li',
    { class: 'game-card', 'aria-labelledby': headingId },
    h('h2', { id: headingId }, game.name),
    h('p', { class: 'game-card-tagline' }, game.tagline),
    h('p', { class: 'game-card-status', 'data-state': status.state }, status.text),
    h(
      'div',
      { class: 'game-card-actions' },
      h(
        'a',
        { class: 'btn primary', href: gamePath(game.slug), 'aria-describedby': headingId },
        status.state === 'new' ? 'Play' : 'Continue',
      ),
      h(
        'a',
        { class: 'btn quiet', href: howToPlayPath(game.slug), 'aria-describedby': headingId },
        'How to play',
      ),
    ),
  );
}

renderPage({
  nav: siteNav('home'),
  width: 'page',
  content: h(
    'div',
    { class: 'page' },
    h(
      'section',
      { class: 'hero' },
      h('span', { class: 'kicker' }, 'A new puzzle every day'),
      h('h1', null, 'Daily word games'),
      h(
        'p',
        null,
        'Original word puzzles to play in your browser. Each game has one puzzle a day, the same for everyone, and an archive of every day you missed.',
      ),
      h('p', null, 'Free, with no ads, no accounts and no cookies.'),
    ),
    h('ul', { class: 'game-grid', 'aria-label': 'Games' }, GAMES.map(gameCard)),
  ),
});
