import { describe, expect, it } from 'vitest';
import { GAMES } from '../../src/games/catalogue.ts';
import { toHtml, withFakeDom } from './dom-shim.ts';
import { prerenderPages } from './prerender.ts';

describe('prerenderPages', () => {
  it('writes every How to play page and the About page, with their words', async () => {
    const pages = await prerenderPages();
    expect([...pages.keys()].sort()).toEqual(
      ['about', ...GAMES.map((g) => `${g.slug}/how-to-play`)].sort(),
    );
    for (const { slug, name } of GAMES) {
      const html = pages.get(`${slug}/how-to-play`) ?? '';
      expect(html).toContain(`<h1>${name}</h1>`);
      expect(html).toContain('<h2>The goal</h2>');
      expect(html).toContain('<h2>Missed a day?</h2>');
      expect(html).toContain(`<a href="/${slug}/how-to-play/" aria-current="page">`);
      expect(html).toMatch(/^<a class="skip" href="#main">.*<\/footer>$/);
    }
    expect(pages.get('about')).toContain('<h2>Privacy</h2>');
  });

  it('puts the browser globals back afterwards', async () => {
    await prerenderPages();
    expect(typeof document).toBe('undefined');
    expect(typeof Node).toBe('undefined');
  });
});

describe('the fake DOM', () => {
  it('escapes text and attributes, and writes empty and void elements as HTML does', async () => {
    const html = await withFakeDom(async () => {
      const p = document.createElement('p');
      p.setAttribute('title', 'Fish & "chips"');
      p.setAttribute('hidden', '');
      p.append('a < b', document.createElement('br'));
      p.classList.add('one', 'two');
      p.classList.add('one');
      return toHtml([p]);
    });
    expect(html).toBe(
      '<p title="Fish &amp; &quot;chips&quot;" hidden class="one two">a &lt; b<br></p>',
    );
  });
});
