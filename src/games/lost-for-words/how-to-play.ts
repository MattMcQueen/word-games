/** Entry point for /lost-for-words/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { lostForWordsRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, lostForWordsRules);
