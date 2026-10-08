/** Small wording helpers shared by the games' messages. */

/** "1 word", "3 words"; pass the plural for irregular nouns. */
export const plural = (n: number, singular: string, pluralForm = `${singular}s`) =>
  `${n} ${n === 1 ? singular : pluralForm}`;

/** "1 letter", "7 letters" */
export const letters = (n: number) => plural(n, 'letter');
