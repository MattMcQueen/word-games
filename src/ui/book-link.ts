/**
 * "Buy <title> on Amazon", with the Associates disclosure beside it, for games
 * that end on a book (Lost for Words, Shelf Scramble, Retitled, Cipher).
 * Nothing is shown if no Associates tag is set in src/config.ts.
 */

import { AFFILIATE_REL, AMAZON_DISCLOSURE, bookSearchUrl } from '../core/amazon.ts';
import { type Child, h } from './dom.ts';

export function buyBookLink(title: string, author: string): HTMLElement | null {
  const href = bookSearchUrl(title, author);
  if (!href) return null;
  return h(
    'span',
    { class: 'buy-book' },
    h(
      'a',
      { class: 'btn quiet', href, rel: AFFILIATE_REL, target: '_blank' },
      `Buy ${title} on Amazon`,
    ),
    h('small', { class: 'buy-disclosure' }, AMAZON_DISCLOSURE),
  );
}

/** "From Pride and Prejudice by Jane Austen." (with `lead` "From "), then the link to buy it. */
export const bookCredit = (title: string, author: string, lead = ''): Child[] => [
  h('span', null, lead, h('cite', null, title), ` by ${author}.`),
  buyBookLink(title, author),
];
