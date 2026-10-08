/** Entry point for /swap-shop/how-to-play/. */

import { renderHowToPlay } from '../../ui/how-to-play.ts';
import { swapShopRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderHowToPlay(SLUG, swapShopRules);
