/**
 * The Ko-fi "Support me" button, ported from card-kit's SupportMe.svelte.
 *
 * It sits bottom-left and opens a panel holding Ko-fi's donation form. Nothing
 * is fetched from Ko-fi until the panel is first opened, so visitors who never
 * press it never contact Ko-fi. On phones, Ko-fi's page opens in a new tab
 * instead, because its phone layout doesn't fit in a panel.
 *
 * Whenever the button would cover a button or link (the on-screen keyboard,
 * say), it slides out of the way.
 */

import kofiLogo from '../assets/kofi-logo.png';
import { KOFI_URL, SITE_NAME } from '../config.ts';
import { h, icon } from './dom.ts';

export function renderSupportMe(): HTMLElement {
  const panel = h(
    'div',
    { class: 'support-panel', id: 'kofi-panel', popover: 'auto' },
    h(
      'div',
      { class: 'support-head' },
      h('p', null, h('strong', null, `Support ${SITE_NAME}`)),
      h(
        'button',
        {
          class: 'icon-btn',
          type: 'button',
          title: 'Close',
          'aria-label': 'Close',
          onclick: () => panel.hidePopover(),
        },
        icon('close'),
      ),
    ),
    h('div', { class: 'support-frame' }),
    h(
      'p',
      { class: 'support-foot' },
      h(
        'a',
        { href: KOFI_URL, rel: 'noopener', target: '_blank' },
        'Open ko-fi.com/mattrarelywrites in a new tab',
      ),
    ),
  );

  const button = h(
    'button',
    {
      type: 'button',
      class: 'support-btn',
      popovertarget: 'kofi-panel',
      title: `Support ${SITE_NAME} on Ko-fi`,
      'aria-label': 'Support me on Ko-fi',
      onclick: (event) => {
        if (matchMedia('(max-width: 600px)').matches) {
          event.preventDefault(); // stops the panel opening
          window.open(KOFI_URL, '_blank', 'noopener');
          return;
        }
        loadForm(panel);
      },
    },
    h('img', { src: kofiLogo, width: 39, height: 31, alt: '' }),
    h('span', null, 'Support me'),
  );

  keepOutOfTheWay(button, panel);
  return h('aside', { class: 'support', 'aria-label': `Support ${SITE_NAME}` }, button, panel);
}

/** Add Ko-fi's form to the panel the first time it's opened. */
function loadForm(panel: HTMLElement) {
  const frame = panel.querySelector('.support-frame');
  if (!frame || frame.hasChildNodes()) return;
  frame.append(
    h('iframe', {
      title: `Support ${SITE_NAME} on Ko-fi`,
      src: `${KOFI_URL}/?hidefeed=true&widget=true&embed=true`,
      referrerpolicy: 'no-referrer',
    }),
  );
}

/**
 * Slide the button away while a small control is underneath it. Big targets
 * don't count, since covering a corner of one doesn't stop you pressing it.
 */
function keepOutOfTheWay(button: HTMLElement, panel: HTMLElement) {
  function coversControl(): boolean {
    // Measure where the button rests, not where it is while slid away.
    const left = button.offsetLeft;
    const top = button.offsetTop;
    const right = left + button.offsetWidth;
    const bottom = top + button.offsetHeight;
    const limit = button.offsetWidth * button.offsetHeight * 4;
    const points: [number, number][] = [
      [left + 2, top + 2],
      [right - 2, top + 2],
      [left + 2, bottom - 2],
      [right - 2, bottom - 2],
      [(left + right) / 2, (top + bottom) / 2],
    ];
    return points.some(([x, y]) =>
      document.elementsFromPoint(x, y).some((el) => {
        if (button.contains(el) || panel.contains(el)) return false;
        const control = el.closest('a, button, input, select, textarea, summary');
        if (!control) return false;
        const box = control.getBoundingClientRect();
        return box.width * box.height < limit;
      }),
    );
  }

  let queued = false;
  const update = () => {
    queued = false;
    button.classList.toggle('is-tucked', !panel.matches(':popover-open') && coversControl());
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  // The page changes shape as a game goes on, so look again whenever it does.
  new ResizeObserver(queue).observe(document.body);
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  addEventListener('load', queue);
  panel.addEventListener('toggle', queue);
  void document.fonts?.ready.then(queue);
}
