<script setup lang="ts">
import { computed } from 'vue';
import { getHomeRoute } from '../router';
import { useAppStore } from '../store';

const store = useAppStore();
const isSignedIn = computed(() => store.getters['auth/isSignedIn'] as boolean);
</script>

<template>
  <component :is="isSignedIn ? 'div' : 'main'" class="mx-auto max-w-xl px-4 py-16">
    <h1 class="text-2xl font-semibold tracking-tight">This page does not exist</h1>
    <p class="mt-2 text-ink-muted">The address may be mistyped, or the page may have moved.</p>
    <RouterLink
      :to="isSignedIn ? getHomeRoute() : { name: 'login' }"
      class="button button-primary mt-6"
    >
      {{ isSignedIn ? 'Go to your requests' : 'Go to sign in' }}
    </RouterLink>
  </component>
</template>
