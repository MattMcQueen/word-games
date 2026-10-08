/**
 * Modal dialogs built on the native <dialog> element, which gives us focus
 * trapping, Escape to close and correct screen-reader semantics for free.
 * Used for help, results, stats and the archive.
 */

import { type Child, h, icon } from './dom.ts';

export interface ModalOptions {
  title: string;
  content: Child;
  /** Called after the dialog closes, however it was closed. */
  onClose?: () => void;
}

export interface Modal {
  dialog: HTMLDialogElement;
  close(): void;
}

let counter = 0;

export function openModal({ title, content, onClose }: ModalOptions): Modal {
  const titleId = `modal-title-${++counter}`;
  const dialog = h(
    'dialog',
    { class: 'modal', 'aria-labelledby': titleId },
    h(
      'div',
      { class: 'modal-header' },
      h('h2', { id: titleId }, title),
      h(
        'button',
        { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: () => dialog.close() },
        icon('close'),
      ),
    ),
    h('div', { class: 'modal-body' }, content),
  );

  // Clicking the backdrop (outside the dialog box) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    onClose?.();
  });

  document.body.append(dialog);
  dialog.showModal();
  return { dialog, close: () => dialog.close() };
}

/** A yes/no confirmation, e.g. "Finish now?". The confirm button is the primary action. */
export function confirmModal(opts: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}) {
  const button = (label: string, primary: boolean, onClick: () => void) =>
    h(
      'button',
      { class: primary ? 'btn btn-primary' : 'btn', type: 'button', onclick: onClick },
      label,
    );
  const modal = openModal({
    title: opts.title,
    content: [
      h('p', null, opts.message),
      h(
        'div',
        { class: 'result-actions' },
        button(opts.confirmLabel, true, () => {
          modal.close();
          opts.onConfirm();
        }),
        button(opts.cancelLabel, false, () => modal.close()),
      ),
    ],
  });
}
