<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  fieldId: string;
  label: string;
  errorMessage?: string;
  hint?: string;
  isOptional?: boolean;
}>();

const hintId = computed(() => `${props.fieldId}-hint`);
const errorId = computed(() => `${props.fieldId}-error`);

const describedBy = computed(() => {
  const descriptionIds = [
    props.hint ? hintId.value : '',
    props.errorMessage ? errorId.value : '',
  ].filter(Boolean);
  return descriptionIds.length > 0 ? descriptionIds.join(' ') : undefined;
});
</script>

<template>
  <div>
    <label :for="fieldId" class="mb-1 block text-sm font-medium">
      {{ label }}
      <span v-if="isOptional" class="font-normal text-ink-muted">(optional)</span>
    </label>
    <slot :described-by="describedBy" :is-invalid="Boolean(errorMessage)" />
    <p v-if="hint" :id="hintId" class="mt-1 text-sm text-ink-muted">{{ hint }}</p>
    <p v-if="errorMessage" :id="errorId" class="mt-1 text-sm font-medium text-danger">
      {{ errorMessage }}
    </p>
  </div>
</template>
