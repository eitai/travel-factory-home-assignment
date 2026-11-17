<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../store';

const store = useAppStore();
const notifications = computed(() => store.state.notifications.notifications);

function dismiss(notificationId: number): void {
  void store.dispatch('notifications/dismiss', notificationId);
}
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex flex-col items-end gap-2 sm:left-auto sm:w-96"
  >
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="card pointer-events-auto flex w-full items-center gap-3 rounded-2xl p-3 pl-4"
      :class="notification.kind === 'error' ? 'border-rejected' : 'border-accent'"
    >
      <p class="flex-1 text-[0.9375rem]">
        <span class="font-bold">{{ notification.kind === 'error' ? 'Error: ' : 'Done: ' }}</span>
        {{ notification.message }}
      </p>
      <button type="button" class="button" @click="dismiss(notification.id)">Dismiss</button>
    </div>
  </div>
</template>
