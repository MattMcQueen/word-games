/** Entry point for /hinge/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { hingeRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, hingeRules);
