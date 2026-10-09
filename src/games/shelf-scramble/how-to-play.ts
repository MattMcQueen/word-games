/** Entry point for /shelf-scramble/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { shelfScrambleRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, shelfScrambleRules);
