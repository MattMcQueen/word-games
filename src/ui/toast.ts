/**
 * Brief pop-up messages ("Copied to clipboard"). One shared live region
 * announces them to screen readers as well.
 *
 * The region is a manual popover so it sits in the browser's top layer;
 * otherwise an open <dialog> (e.g. the results panel) would cover it.
 */

import { h } from './dom.ts';

let region: HTMLElement | undefined;

export function toast(message: string, durationMs = 2500) {
  region ??= document.body.appendChild(
    h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite', popover: 'manual' }),
  );
  // Re-showing moves the popover above any dialog opened since.
  if (region.matches(':popover-open')) region.hidePopover();
  region.showPopover();

  const item = h('div', { class: 'toast' }, message);
  region.append(item);
  setTimeout(() => {
    item.remove();
    if (region && !region.hasChildNodes()) region.hidePopover();
  }, durationMs);
}
