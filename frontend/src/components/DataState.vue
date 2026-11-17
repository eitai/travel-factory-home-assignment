<script setup lang="ts">
defineProps<{
  isLoading: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
  loadingLabel: string;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <p v-if="isLoading" role="status" class="card p-6 text-ink-muted">{{ loadingLabel }}</p>

  <div v-else-if="errorMessage" role="alert" class="card border-rejected p-6">
    <p class="font-semibold">{{ errorMessage }}</p>
    <button type="button" class="button mt-4" @click="$emit('retry')">Try again</button>
  </div>

  <div v-else-if="isEmpty" class="card p-6 text-ink-muted">
    <slot name="empty" />
  </div>

  <slot v-else />
</template>
