/**
 * The site header: a link home, the page title and icon buttons for the
 * current page's actions (help, archive, stats), plus the theme toggle,
 * which every page gets.
 */

import { SITE_NAME } from '../config.ts';
import { h, type IconName, icon } from './dom.ts';
import { cycleTheme, themeLabel } from './theme.ts';

export interface HeaderAction {
  icon: IconName;
  label: string;
  onClick: () => void;
}

export interface HeaderOptions {
  /** Page title shown in the header; omit on the home page. */
  title?: string;
  actions?: HeaderAction[];
}

const iconButton = (iconName: IconName, label: string, onClick: (b: HTMLButtonElement) => void) => {
  const button: HTMLButtonElement = h(
    'button',
    {
      class: 'icon-btn',
      type: 'button',
      'aria-label': label,
      title: label,
      onclick: () => onClick(button),
    },
    icon(iconName),
  );
  return button;
};

export function renderHeader({ title, actions = [] }: HeaderOptions = {}): HTMLElement {
  const themeButton = iconButton('theme', themeLabel(), (button) => {
    const label = cycleTheme();
    button.setAttribute('aria-label', label);
    button.title = label;
  });

  return h(
    'header',
    { class: 'site-header' },
    h(
      'nav',
      { class: 'site-nav', 'aria-label': 'Site' },
      title
        ? h('a', { class: 'home-link', href: '/' }, icon('back'), h('span', null, SITE_NAME))
        : h('a', { class: 'home-link', href: '/', 'aria-current': 'page' }, SITE_NAME),
    ),
    title ? h('h1', { class: 'page-title' }, title) : null,
    h(
      'div',
      { class: 'header-actions' },
      actions.map((a) => iconButton(a.icon, a.label, a.onClick)),
      themeButton,
    ),
  );
}
