/**
 * Just enough of the browser's DOM for the page builders (h() in
 * src/ui/dom.ts, the header, the footer, the rules pages) to run in Node at
 * build time, and a way to write what they build out as HTML.
 *
 * It isn't a general DOM. If a page builder starts using something it lacks,
 * the build fails with a TypeError, and the prerender test fails too; add the
 * missing piece here.
 */

/** Elements that never have children or a closing tag. */
const VOID_TAGS = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'source', 'wbr']);

const escapeText = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeAttr = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/** Stands in for the browser's Node, so `child instanceof Node` works in h(). */
class FakeNode {
  toHtml(): string {
    return '';
  }
}

class FakeText extends FakeNode {
  readonly text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
  override toHtml() {
    return escapeText(this.text);
  }
}

/** Markup given to a <template>, written out as it is. Only fixed strings go there (the logo). */
class FakeMarkup extends FakeNode {
  readonly markup: string;
  constructor(markup: string) {
    super();
    this.markup = markup;
  }
  override toHtml() {
    return this.markup;
  }
}

class FakeElement extends FakeNode {
  readonly attributes = new Map<string, string>();
  childNodes: FakeNode[] = [];
  /** A <template>'s content; see innerHTML. */
  readonly content: { firstChild: FakeNode | null } = { firstChild: null };
  readonly classList = {
    add: (...names: string[]) => {
      const classes = new Set((this.attributes.get('class') ?? '').split(' ').filter(Boolean));
      for (const name of names) classes.add(name);
      this.setAttribute('class', [...classes].join(' '));
    },
  };

  readonly tagName: string;
  constructor(tagName: string) {
    super();
    this.tagName = tagName;
  }

  setAttribute(name: string, value: unknown) {
    this.attributes.set(name, String(value));
  }

  set title(value: string) {
    this.setAttribute('title', value);
  }

  /** Only templates use this, with fixed markup, so it isn't parsed. */
  set innerHTML(markup: string) {
    this.content.firstChild = new FakeMarkup(markup);
  }

  /** Nothing happens at build time, so listeners are dropped. */
  addEventListener() {}

  appendChild(child: FakeNode) {
    this.childNodes.push(child);
    return child;
  }

  append(...children: (FakeNode | string)[]) {
    for (const child of children) {
      this.appendChild(typeof child === 'string' ? new FakeText(child) : child);
    }
  }

  replaceChildren(...children: (FakeNode | string)[]) {
    this.childNodes = [];
    this.append(...children);
  }

  override toHtml() {
    const attrs = [...this.attributes]
      .map(([name, value]) => (value === '' ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`))
      .join('');
    if (VOID_TAGS.has(this.tagName)) return `<${this.tagName}${attrs}>`;
    const inner = this.childNodes.map((child) => child.toHtml()).join('');
    return `<${this.tagName}${attrs}>${inner}</${this.tagName}>`;
  }
}

const fakeDocument = {
  documentElement: { dataset: {} },
  createElement: (tag: string) => new FakeElement(tag),
  createElementNS: (_namespace: string, tag: string) => new FakeElement(tag),
  createTextNode: (text: string) => new FakeText(text),
};

/** The device's colour scheme is unknown at build time, so pages are drawn light. */
const fakeMatchMedia = () => ({ matches: false, addEventListener() {} });

/**
 * Run `build` with the fake DOM in place of the browser's (document, Node and
 * matchMedia), putting back whatever was there afterwards.
 */
export async function withFakeDom<T>(build: () => Promise<T>): Promise<T> {
  const global = globalThis as Record<string, unknown>;
  const saved = { document: global.document, Node: global.Node, matchMedia: global.matchMedia };
  Object.assign(global, { document: fakeDocument, Node: FakeNode, matchMedia: fakeMatchMedia });
  try {
    return await build();
  } finally {
    Object.assign(global, saved);
  }
}

/** The HTML for nodes built inside withFakeDom. */
export const toHtml = (nodes: readonly unknown[]) =>
  nodes.map((node) => (node as FakeNode).toHtml()).join('');
