/** Entry point for /lockout/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { lockoutRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, lockoutRules);
