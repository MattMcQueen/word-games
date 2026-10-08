/**
 * Home page. For now just links to each game; Phase 4 adds today's
 * completion status, and the help and about pages.
 */

import { GAMES, gamePath } from '../games/catalogue.ts';
import { h } from '../ui/dom.ts';
import { renderHeader } from '../ui/header.ts';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';

document.body.replaceChildren(
  renderHeader(),
  h(
    'main',
    { id: 'main' },
    h('h1', null, 'Daily word games'),
    h(
      'ul',
      null,
      GAMES.map((g) =>
        h('li', null, h('a', { href: gamePath(g.slug) }, g.name), ` – ${g.tagline}`),
      ),
    ),
  ),
);
