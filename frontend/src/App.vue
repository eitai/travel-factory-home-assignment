<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './components/AppLayout.vue';
import ToastList from './components/ToastList.vue';
import { useAppStore } from './store';

const store = useAppStore();
const route = useRoute();

const showsAppLayout = computed(
  () => (store.getters['auth/isSignedIn'] as boolean) && route.name !== 'login',
);
</script>

<template>
  <AppLayout v-if="showsAppLayout">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
  <ToastList />
</template>
