/** Entry point for /hinge/how-to-play/. */

import { howToPlayPage } from '../../ui/how-to-play.ts';
import { renderPage } from '../../ui/page.ts';
import { hingeRules } from './rules.ts';
import { SLUG } from './spec.ts';

renderPage(howToPlayPage(SLUG, hingeRules));
