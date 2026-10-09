/** Entry point for /cipher/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { cipherRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, cipherRules);
