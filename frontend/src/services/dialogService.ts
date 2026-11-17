import { watch, type Ref } from 'vue';

export function keepDialogInSync(
  dialogElement: Ref<HTMLDialogElement | null>,
  isOpen: () => boolean,
): void {
  watch(
    isOpen,
    (shouldBeOpen) => {
      const dialog = dialogElement.value;
      if (!dialog) {
        return;
      }
      if (shouldBeOpen && !dialog.open) {
        dialog.showModal();
      }
      if (!shouldBeOpen && dialog.open) {
        dialog.close();
      }
    },
    { flush: 'post' },
  );
}
