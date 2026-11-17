<script setup lang="ts">
import { useAbility } from '@casl/vue';
import { computed } from 'vue';
import type { AppAbility } from '@vacation-manager/shared';
import { roleLabels } from '../services/presentationService';
import { endSession } from '../services/sessionService';
import { useAppStore } from '../store';

const store = useAppStore();
const ability = useAbility<AppAbility>();

const currentUser = computed(() => store.state.auth.user);

const navigationItems = computed(() =>
  [
    {
      routeName: 'myRequests',
      label: 'My requests',
      isAllowed: ability.can('read', 'VacationRequest'),
    },
    {
      routeName: 'review',
      label: 'Review requests',
      isAllowed: ability.can('readAll', 'VacationRequest'),
    },
    {
      routeName: 'teamCalendar',
      label: 'Team calendar',
      isAllowed: ability.can('read', 'TeamCalendar'),
    },
  ].filter((navigationItem) => navigationItem.isAllowed),
);

function signOut(): void {
  endSession();
}
</script>

<template>
  <a
    href="#main-content"
    class="sr-only rounded-md bg-accent px-4 py-3 font-semibold text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
  >
    Skip to content
  </a>

  <header class="border-b border-line bg-panel">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-1 px-4 pt-3 sm:pb-0">
      <p class="text-lg font-semibold tracking-tight">Vacation Manager</p>

      <div v-if="currentUser" class="ml-auto flex items-center gap-3 sm:order-last">
        <p class="text-sm leading-tight">
          <span class="block font-medium">{{ currentUser.name }}</span>
          <span class="block text-ink-muted">{{ roleLabels[currentUser.role] }}</span>
        </p>
        <button type="button" class="button button-secondary" @click="signOut">Sign out</button>
      </div>

      <nav aria-label="Main" class="w-full sm:w-auto">
        <ul class="flex gap-1">
          <li v-for="navigationItem in navigationItems" :key="navigationItem.routeName">
            <RouterLink :to="{ name: navigationItem.routeName }" class="navigation-link">
              {{ navigationItem.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="main-content" tabindex="-1" class="mx-auto max-w-6xl px-4 py-6 focus:outline-none">
    <slot />
  </main>
</template>
