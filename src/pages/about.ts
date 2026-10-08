/** The About page: privacy, where the words come from, credits. Modelled on card-kit's AboutPage. */

import books from '../../data/gutenberg-sources.json';
import { h } from '../ui/dom.ts';
import { renderPage, siteNav } from '../ui/page.ts';

const link = (href: string, text: string) =>
  h('a', { href, rel: 'noopener', target: '_blank' }, text);

renderPage({
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
            'No accounts, no cookies, no adverts and no analytics. Your progress, stats and streaks are kept in your own browser (its local storage) and never leave your device. Clearing your browsing data clears them.',
          ),
          h(
            'li',
            null,
            'The "Support me" button shows Ko-fi\'s donation form, but only when you press it. Until then nothing is loaded from Ko-fi, and once you open it ',
            link('https://more.ko-fi.com/privacy', "Ko-fi's privacy policy"),
            ' applies to that form.',
          ),
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
        { class: 'wide', id: 'books' },
        h('h2', null, 'The books in Gutenberg Gap'),
        h(
          'p',
          null,
          "Gutenberg Gap's sentences come from these novels, all in the public domain and free to read at ",
          link('https://www.gutenberg.org/', 'Project Gutenberg'),
          '. Thank you to its volunteers.',
        ),
        h(
          'ul',
          { class: 'points book-list' },
          books.map((b) =>
            h(
              'li',
              null,
              link(`https://www.gutenberg.org/ebooks/${b.id}`, b.title),
              ` by ${b.author}`,
            ),
          ),
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
          'Fonts: Figtree, Young Serif and DM Sans, all under the SIL Open Font License. Word list: SCOWL, © Kevin Atkinson, used under its permissive licence. Sentences: Project Gutenberg.',
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
          link('https://blackjack.matt-rarely-writes.co.uk/', 'card games'),
          '.',
        ),
      ),
    ),
  ),
});
