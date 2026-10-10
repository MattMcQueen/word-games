/**
 * The About page: privacy, where the words come from, credits. Modelled on
 * card-kit's AboutPage. The entry point is about.ts; this holds the page so the
 * build can pre-render it too (scripts/prerender.ts).
 */

import books from '../../data/gutenberg-sources.json' with { type: 'json' };
import { SOURCE_URL } from '../config.ts';
import { AMAZON_DISCLOSURE } from '../core/amazon.ts';
import { h } from '../ui/dom.ts';
import { type PageOptions, siteNav } from '../ui/frame.ts';

const link = (href: string, text: string) =>
  h('a', { href, rel: 'noopener', target: '_blank' }, text);

export const aboutPage = (): PageOptions => ({
  title: 'About and privacy',
  nav: siteNav('about'),
  width: 'page',
  content: h(
    'div',
    { class: 'page' },
    h(
      'section',
      { class: 'hero' },
      h('span', { class: 'kicker' }, 'About and privacy'),
      h('h1', null, 'Just for fun, and nothing sent anywhere'),
      h(
        'p',
        null,
        'Free daily word games, made to be played in a spare five minutes. Everything happens in your browser.',
      ),
      h('a', { class: 'btn primary', href: '/' }, 'Back to the games'),
    ),
    h(
      'ul',
      { class: 'facts' },
      h(
        'li',
        { class: 'wide', id: 'privacy' },
        h('h2', null, 'Privacy'),
        h(
          'ul',
          { class: 'points' },
          h(
            'li',
            null,
            'No accounts, no cookies and no adverts. Your progress, stats and streaks are kept in your own browser (its local storage) and never leave your device. Clearing your browsing data clears them.',
          ),
          h(
            'li',
            null,
            'Visits are counted with Cloudflare Web Analytics, which uses no cookies and does not follow you from site to site: it sees which page was opened, the browser and roughly which country, not who you are (',
            link('https://www.cloudflare.com/web-analytics/', 'how it works'),
            ').',
          ),
          h(
            'li',
            null,
            'The "Support me" button shows Ko-fi\'s donation form, but only when you press it. Until then nothing is loaded from Ko-fi, and once you open it ',
            link('https://more.ko-fi.com/privacy', "Ko-fi's privacy policy"),
            ' applies to that form.',
          ),
          h(
            'li',
            null,
            'After a Lost for Words, Shelf Scramble, Retitled or Cipher puzzle there is a link to buy the book on Amazon. It is an ordinary link: nothing is loaded from Amazon unless you follow it. ',
            h('strong', null, AMAZON_DISCLOSURE),
          ),
          h(
            'li',
            null,
            'The answers at the end of a puzzle link to their entries in ',
            link('https://en.wiktionary.org/', 'Wiktionary'),
            ', the free dictionary. Again, nothing is loaded from it unless you follow a link.',
          ),
        ),
      ),
      h(
        'li',
        { class: 'wide', id: 'books' },
        h('h2', null, 'The books in Lost for Words and Cipher'),
        h(
          'p',
          null,
          'The lines in Lost for Words and Cipher come from these novels, all in the public domain. The texts were taken from ',
          link('https://www.gutenberg.org/', 'Project Gutenberg'),
          '; thank you to its volunteers.',
        ),
        h(
          'ul',
          { class: 'points book-list' },
          books.map((b) => h('li', null, h('cite', null, b.title), ` by ${b.author}`)),
        ),
      ),
      h(
        'li',
        null,
        h('h2', null, 'The word list'),
        h(
          'p',
          null,
          "If it's not in the list, it's not a word. Every game uses the same list: British English words from ",
          link('http://wordlist.aspell.net/', 'SCOWL'),
          ' (Spell Checker Oriented Word Lists) by Kevin Atkinson, at size 50, without proper nouns, abbreviations or offensive words.',
        ),
      ),
      h(
        'li',
        null,
        h('h2', null, 'Keyboard'),
        h(
          'p',
          null,
          'Just start typing: letters go straight into the word box. ',
          h('kbd', null, 'Enter'),
          ' submits a word and ',
          h('kbd', null, 'Backspace'),
          ' deletes a letter. The on-screen keyboard works too.',
        ),
      ),
      h(
        'li',
        null,
        h('h2', null, 'Supporting the site'),
        h(
          'p',
          null,
          'The site is free and has no ads. If you enjoy it, you can buy me a coffee with the "Support me" button. Thank you!',
        ),
      ),
      h(
        'li',
        null,
        h('h2', null, 'Credits'),
        h(
          'p',
          null,
          'Fonts: Figtree, Young Serif and DM Sans, all under the SIL Open Font License. Word list: SCOWL, © Kevin Atkinson, used under its permissive licence. Sentences: public-domain texts from Project Gutenberg.',
        ),
      ),
      h(
        'li',
        { class: 'wide' },
        h('h2', null, 'Made by'),
        h(
          'p',
          null,
          'Matt McQueen, who also writes the ',
          link('https://www.matt-rarely-writes.co.uk/', 'Matt Rarely Writes'),
          ' blog and makes the ',
          link('https://www.matt-rarely-writes.co.uk/post/deal-me-in', 'card games'),
          '.',
        ),
        h(
          'p',
          null,
          'The code is open source under the MIT licence: ',
          link(SOURCE_URL, 'see it on GitHub'),
          '. Suggestions and bug reports are welcome there.',
        ),
      ),
    ),
  ),
});
