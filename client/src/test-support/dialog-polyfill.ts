/**
 * jsdom has no `showModal` or `close` on `dialog`. This gives it the parts the app relies on: the
 * `open` attribute, the `close` event and Escape. It is used in tests only.
 */
export function installDialogPolyfill(): void {
  const prototype = HTMLDialogElement.prototype;
  prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype.close = function close(this: HTMLDialogElement) {
    if (this.hasAttribute('open')) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    }
  };
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelector<HTMLDialogElement>('dialog[open]')?.close();
    }
  });
}
