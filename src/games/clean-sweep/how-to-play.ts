/** Entry point for /clean-sweep/how-to-play/. */

import { howToPlayPage } from '../../ui/how-to-play.ts';
import { renderPage } from '../../ui/page.ts';
import { cleanSweepRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderPage(howToPlayPage(SLUG, cleanSweepRules));
