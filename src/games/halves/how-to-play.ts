/** Entry point for /halves/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { halvesRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, halvesRules);
