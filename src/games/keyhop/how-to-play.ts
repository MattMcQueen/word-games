/** Entry point for /keyhop/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { keyhopRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, keyhopRules);
