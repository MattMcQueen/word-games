/** Entry point for /threader/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { threaderRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, threaderRules);
