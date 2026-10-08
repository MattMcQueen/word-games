/** Entry point for /clean-sweep/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { cleanSweepRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, cleanSweepRules);
