/** Entry point for /matryoshka/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { matryoshkaRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, matryoshkaRules);
