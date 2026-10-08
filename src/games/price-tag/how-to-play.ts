/** Entry point for /price-tag/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { priceTagRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, priceTagRules);
