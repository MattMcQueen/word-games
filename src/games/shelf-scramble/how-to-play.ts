/** Entry point for /shelf-scramble/how-to-play/. */

import { howToPlayPage } from '../../ui/how-to-play.ts';
import { renderPage } from '../../ui/page.ts';
import { shelfScrambleRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderPage(howToPlayPage(SLUG, shelfScrambleRules));
