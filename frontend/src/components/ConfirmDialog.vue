<script setup lang="ts">
import { ref } from 'vue';
import { keepDialogInSync } from '../services/dialogService';

const props = defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDangerous?: boolean;
  isBusy?: boolean;
}>();

defineEmits<{ confirm: []; cancel: [] }>();

const dialogElement = ref<HTMLDialogElement | null>(null);
keepDialogInSync(dialogElement, () => props.isOpen);
</script>

<template>
  <dialog
    ref="dialogElement"
    class="dialog-panel"
    aria-labelledby="confirm-dialog-title"
    @cancel.prevent="$emit('cancel')"
  >
    <h2 id="confirm-dialog-title" class="text-lg font-semibold">{{ title }}</h2>
    <p class="mt-2">{{ message }}</p>
    <div class="mt-6 flex flex-wrap justify-end gap-3">
      <button
        type="button"
        class="button button-secondary"
        :disabled="isBusy"
        @click="$emit('cancel')"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        class="button"
        :class="isDangerous ? 'button-danger' : 'button-primary'"
        :disabled="isBusy"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </dialog>
</template>
