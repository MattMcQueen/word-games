import { describe, expect, it } from 'vitest';
import {
  cipherCandidate,
  commonWords,
  gapCandidates,
  paragraphs,
  sentences,
  stripGutenberg,
  tidy,
  usableSentence,
} from './sentences.ts';

describe('preparing the text', () => {
  it('keeps only the text between the Gutenberg markers', () => {
    const file =
      'Licence\r\n*** START OF THE PROJECT GUTENBERG EBOOK X ***\r\nStory.\r\n*** END OF THE PROJECT GUTENBERG EBOOK X ***\r\nMore licence';
    expect(stripGutenberg(file)).toBe('Story.');
  });

  it('tidies quotes, italics and dashes', () => {
    expect(tidy('“It’s _very_ odd--quite odd,” she said.')).toBe(
      `"It's very odd – quite odd," she said.`,
    );
  });

  it('joins paragraph lines and skips headings', () => {
    expect(paragraphs('CHAPTER I\n\nIt is a truth\nuniversally acknowledged.\n\nTHE END')).toEqual([
      'It is a truth universally acknowledged.',
    ]);
  });

  it('splits sentences but not after Mr. or initials', () => {
    expect(sentences('Mr. Darcy bowed. "Indeed!" said H. G. Wells. Was it so? Yes.')).toEqual([
      'Mr. Darcy bowed.',
      '"Indeed!" said H. G. Wells.',
      'Was it so?',
      'Yes.',
    ]);
  });
});

describe('choosing sentences', () => {
  const blocked = new Set(['wicked']);

  it('keeps tidy sentences of a sensible length', () => {
    expect(usableSentence('The old house stood alone at the end of the lane.', blocked)).toBe(true);
  });

  it('rejects ones that are too short, too long, odd or offensive', () => {
    expect(usableSentence('It rained all day.', blocked)).toBe(false);
    expect(usableSentence(`${'word '.repeat(31)}end.`, blocked)).toBe(false);
    expect(usableSentence('In 1812 the old house stood alone at the end.', blocked)).toBe(false);
    expect(usableSentence('"The old house stood alone at the end of the lane.', blocked)).toBe(
      false,
    );
    expect(
      usableSentence('The wicked old house stood alone at the end of the lane.', blocked),
    ).toBe(false);
  });
});

describe('choosing the gap', () => {
  const isWord = (w: string) => ['house', 'stood', 'alone', 'lantern', 'gentle'].includes(w);
  const common = new Set(['stood']);

  it('offers lowercase dictionary words that are not too common', () => {
    const gaps = gapCandidates('Jane stood alone by the house with a lantern.', isWord, common);
    expect(gaps.map((g) => g.word)).toEqual(['alone', 'house', 'lantern']);
    expect(gaps[0]?.start).toBe('Jane stood '.length);
  });

  it('skips repeated words, hyphenated words and contractions', () => {
    const gaps = gapCandidates(
      "The house, the gentle-house and the lantern's glow.",
      isWord,
      common,
    );
    expect(gaps).toEqual([]);
  });

  it('finds the most common words', () => {
    expect([...commonWords(['a', 'b', 'a', 'c', 'a', 'b'], 2)]).toEqual(['a', 'b']);
  });
});

describe('Cipher lines', () => {
  it('keeps lines of 45–85 letters with enough different letters, and no word too wide', () => {
    expect(
      cipherCandidate(
        'It was the best of times, it was the worst of times, it was the age of wisdom.',
      ),
    ).toBe(true);
    expect(cipherCandidate('It was a dark and stormy night.')).toBe(false); // too short
    expect(
      cipherCandidate('Nananananananananana nananananananananana nananananananananana nanananana.'),
    ).toBe(false); // too few different letters
    expect(
      cipherCandidate(
        'The extraordinarily unsympathetic gentleman considered the matter for a long while.',
      ),
    ).toBe(false); // a word too wide for a phone
  });
});
