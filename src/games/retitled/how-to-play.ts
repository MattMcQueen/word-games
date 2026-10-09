/** Entry point for /retitled/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { retitledRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, retitledRules);
