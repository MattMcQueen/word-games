/**
 * A small picture of each game for its card on the home page, drawn with the
 * same letter tiles as the games themselves. Decorative: the card's text
 * describes the game, so these are hidden from screen readers.
 */

import { type Child, h } from '../ui/dom.ts';

type Tile = string | { t: string; note?: string; kind?: 'accent' | 'soft' | 'struck' | 'gap' };

const tile = (spec: Tile) => {
  const { t, note, kind = 'soft' } = typeof spec === 'string' ? { t: spec } : spec;
  return h('span', { class: `pv-tile pv-${kind}` }, t, note ? h('small', null, note) : null);
};
const sep = (text: string) => h('span', { class: 'pv-sep' }, text);
const word = (text: string) => h('span', { class: 'pv-word' }, text);

const PREVIEWS: Record<string, () => Child[]> = {
  'price-tag': () => [
    tile({ t: 'C', note: '4p' }),
    tile({ t: 'A', note: '2p' }),
    tile({ t: 'T', note: '5p' }),
    sep('='),
    tile({ t: '11p', kind: 'accent' }),
  ],
  hinge: () => [
    word('CAR'),
    tile({ t: 'P', kind: 'accent' }),
    tile({ t: 'E', kind: 'accent' }),
    tile({ t: 'T', kind: 'accent' }),
    word('ROL'),
  ],
  threader: () => [
    tile({ t: 'R', kind: 'accent' }),
    sep('→'),
    tile({ t: 'N', kind: 'accent' }),
    sep('→'),
    tile({ t: 'T', kind: 'accent' }),
  ],
  'lost-for-words': () => [
    word('…the'),
    tile({ t: '', kind: 'gap' }),
    tile({ t: 'A', kind: 'gap' }),
    tile({ t: '', kind: 'gap' }),
    tile({ t: '', kind: 'gap' }),
    word('of…'),
  ],
  'swap-shop': () => [tile({ t: 'A', kind: 'accent' }), sep('⇄'), tile({ t: 'E', kind: 'accent' })],
  matryoshka: () => [
    word('AT'),
    sep('›'),
    word('CAT'),
    sep('›'),
    word('CHAT'),
    sep('›'),
    word('CHATS'),
  ],
  lockout: () => [
    tile({ t: 'J', kind: 'accent' }),
    tile({ t: 'A', kind: 'struck' }),
    tile({ t: 'E', kind: 'struck' }),
    tile({ t: 'N', kind: 'struck' }),
  ],
  'clean-sweep': () => [
    tile({ t: 'G', kind: 'struck' }),
    tile({ t: 'U', kind: 'struck' }),
    tile({ t: 'S', kind: 'struck' }),
    tile({ t: 'H', kind: 'accent' }),
    tile({ t: 'E', kind: 'accent' }),
    tile({ t: 'L', kind: 'accent' }),
  ],
};

export function gamePreview(slug: string): HTMLElement | null {
  const draw = PREVIEWS[slug];
  return draw ? h('div', { class: 'pv', 'aria-hidden': 'true' }, draw()) : null;
}
