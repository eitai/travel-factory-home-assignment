<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}>();

defineEmits<{ changePage: [page: number] }>();

const firstItemNumber = computed(() => (props.page - 1) * props.pageSize + 1);
const lastItemNumber = computed(() => Math.min(props.page * props.pageSize, props.totalItems));
</script>

<template>
  <nav aria-label="Pages" class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-ink-muted tabular-nums">
      Showing {{ firstItemNumber }} to {{ lastItemNumber }} of {{ totalItems }}
    </p>
    <div v-if="totalPages > 1" class="flex items-center gap-3">
      <button
        type="button"
        class="button button-secondary"
        :disabled="page <= 1"
        @click="$emit('changePage', page - 1)"
      >
        Previous page
      </button>
      <p class="text-sm font-medium tabular-nums">Page {{ page }} of {{ totalPages }}</p>
      <button
        type="button"
        class="button button-secondary"
        :disabled="page >= totalPages"
        @click="$emit('changePage', page + 1)"
      >
        Next page
      </button>
    </div>
  </nav>
</template>
