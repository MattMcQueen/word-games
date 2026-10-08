/**
 * The on-screen QWERTY keyboard. Games can disable keys, highlight them, or
 * add a small hint beneath the letter (Price Tag shows each letter's price).
 *
 * Keys aren't tab stops (tabindex=-1): keyboard users type directly into the
 * word input, and the keys stay reachable for touch and screen readers.
 * Pressing a key keeps focus in the word input so typing can continue.
 */

import { h, icon } from './dom.ts';

const QWERTY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;

export interface KeyState {
  disabled?: boolean;
  /** Visually emphasised; the hint or label should explain why. */
  highlight?: boolean;
  /** Small text under the letter, also read out after it, e.g. "3p". */
  hint?: string;
}

export interface KeyboardHandlers {
  onLetter(letter: string): void;
  onEnter(): void;
  onBackspace(): void;
}

export interface Keyboard {
  el: HTMLElement;
  /** Update one key's appearance. Unspecified fields are reset. */
  setKey(letter: string, state: KeyState): void;
}

export function createKeyboard(handlers: KeyboardHandlers): Keyboard {
  const keys = new Map<string, HTMLButtonElement>();

  const keyButton = (label: Node | string, ariaLabel: string, onPress: () => void, extra = '') =>
    h(
      'button',
      {
        type: 'button',
        class: `key ${extra}`.trim(),
        tabindex: -1,
        'aria-label': ariaLabel,
        // Stop the button taking focus away from the word input.
        onmousedown: (e) => e.preventDefault(),
        onclick: onPress,
      },
      label,
    );

  const rows = QWERTY_ROWS.map((row, i) => {
    const letters = [...row].map((letter) => {
      const button = keyButton(
        h('span', { class: 'key-letter' }, letter.toUpperCase()),
        letter.toUpperCase(),
        () => handlers.onLetter(letter),
      );
      keys.set(letter, button);
      return button;
    });
    if (i === QWERTY_ROWS.length - 1) {
      letters.unshift(keyButton('Enter', 'Enter', handlers.onEnter, 'key-wide'));
      letters.push(keyButton(icon('backspace'), 'Backspace', handlers.onBackspace, 'key-wide'));
    }
    return h('div', { class: 'keyboard-row' }, letters);
  });

  return {
    el: h('div', { class: 'keyboard', role: 'group', 'aria-label': 'On-screen keyboard' }, rows),
    setKey(letter, { disabled = false, highlight = false, hint }) {
      const button = keys.get(letter);
      if (!button) return;
      button.disabled = disabled;
      button.classList.toggle('key-highlight', highlight);
      button.querySelector('.key-hint')?.remove();
      if (hint) button.append(h('span', { class: 'key-hint' }, hint));
      button.setAttribute('aria-label', [letter.toUpperCase(), hint].filter(Boolean).join(', '));
    },
  };
}
