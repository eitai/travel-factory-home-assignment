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
  <p v-if="isLoading" role="status" class="panel p-6 text-ink-muted">{{ loadingLabel }}</p>

  <div v-else-if="errorMessage" role="alert" class="panel border-danger p-6">
    <p class="font-medium">{{ errorMessage }}</p>
    <button type="button" class="button button-secondary mt-3" @click="$emit('retry')">
      Try again
    </button>
  </div>

  <div v-else-if="isEmpty" class="panel p-6">
    <slot name="empty" />
  </div>

  <slot v-else />
</template>
