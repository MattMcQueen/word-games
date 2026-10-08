/** Entry point for /gutenberg-gap/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { gutenbergGapRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, gutenbergGapRules);
