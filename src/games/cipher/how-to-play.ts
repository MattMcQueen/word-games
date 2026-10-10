/** Entry point for /cipher/how-to-play/. */

import { howToPlayPage } from '../../ui/how-to-play.ts';
import { renderPage } from '../../ui/page.ts';
import { cipherRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderPage(howToPlayPage(SLUG, cipherRules));
