/**
 * A tiny helper for building DOM trees without a framework:
 *
 *   h('button', { class: 'btn', onclick: go, 'aria-label': 'Start' }, 'Go')
 *
 * Attribute rules:
 *   - on<event> functions become event listeners
 *   - true sets an empty attribute, false/null/undefined leave it out
 *   - everything else is set as a string attribute
 * Children may be nodes, strings, numbers, nested arrays, or null/false (skipped).
 */

type AttrValue = string | number | boolean | null | undefined | ((event: Event) => void);
export type Attrs = Record<string, AttrValue>;
export type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (typeof value === 'function') {
      el.addEventListener(name.slice(2), value);
    } else if (value === true) {
      el.setAttribute(name, '');
    } else if (value !== false && value !== null && value !== undefined) {
      el.setAttribute(name, String(value));
    }
  }
  append(el, children);
  return el;
}

function append(parent: Node, children: Child[]) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Replace all of an element's children. */
export function replaceChildren(el: Element, ...children: Child[]) {
  el.replaceChildren();
  append(el, children);
}

/** Inline SVG icons (24×24, stroke-based). Decorative: always pair with a text label. */
const ICON_PATHS = {
  calendar:
    'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  close: 'M18 6 6 18M6 6l12 12',
  backspace: 'M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1ZM17 9l-6 6M11 9l6 6',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13',
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function icon(name: IconName): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.append(path);
  return svg;
}

/** The day's target, shown in a game's panel so players know what they're aiming for. */
export function targetLine(text: string): HTMLElement {
  return h('p', { class: 'target-line' }, h('span', { class: 'target-label' }, 'Target'), text);
}
