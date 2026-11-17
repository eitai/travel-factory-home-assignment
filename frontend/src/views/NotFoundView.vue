<script setup lang="ts">
import { computed } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import { getHomeRoute } from '../router';
import { useAppStore } from '../store';

const store = useAppStore();
const isSignedIn = computed(() => store.getters['auth/isSignedIn'] as boolean);
</script>

<template>
  <component :is="isSignedIn ? 'div' : 'main'" class="mx-auto max-w-2xl px-4 py-16">
    <PageHeading lead="The address may be mistyped, or the page may have moved.">
      This page <em>does not exist.</em>
    </PageHeading>
    <RouterLink
      :to="isSignedIn ? getHomeRoute() : { name: 'login' }"
      class="button button-primary mt-8"
    >
      {{ isSignedIn ? 'Go to your requests' : 'Go to sign in' }}
    </RouterLink>
  </component>
</template>
