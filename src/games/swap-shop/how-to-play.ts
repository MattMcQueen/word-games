/** Entry point for /swap-shop/how-to-play/. */

import { howToPlayPage } from '../../ui/how-to-play.ts';
import { renderPage } from '../../ui/page.ts';
import { swapShopRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderPage(howToPlayPage(SLUG, swapShopRules));
