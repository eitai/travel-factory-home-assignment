<script setup lang="ts">
import { useAbility } from '@casl/vue';
import { computed } from 'vue';
import type { AppAbility } from '@vacation-manager/shared';
import { getInitials, roleLabels } from '../services/presentationService';
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
    class="sr-only rounded-xl bg-accent px-4 py-3 font-semibold text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
  >
    Skip to content
  </a>

  <header class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-7 gap-y-3 px-4 pt-5 sm:px-6">
    <p class="font-display text-[1.625rem] font-medium text-accent-strong italic">
      Vacation Manager
    </p>

    <nav aria-label="Main">
      <ul class="navigation">
        <li v-for="navigationItem in navigationItems" :key="navigationItem.routeName">
          <RouterLink :to="{ name: navigationItem.routeName }" class="navigation-link">
            {{ navigationItem.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div v-if="currentUser" class="flex items-center gap-3 sm:ml-auto">
      <span
        class="grid size-11 shrink-0 place-items-center rounded-full bg-sun font-bold text-ink"
        aria-hidden="true"
      >
        {{ getInitials(currentUser.name) }}
      </span>
      <p class="leading-tight font-semibold">
        {{ currentUser.name }}
        <span class="block text-sm font-normal text-ink-muted">
          {{ roleLabels[currentUser.role] }}
        </span>
      </p>
      <button type="button" class="button" @click="signOut">Sign out</button>
    </div>
  </header>

  <main
    id="main-content"
    tabindex="-1"
    class="mx-auto max-w-6xl px-4 pt-9 pb-20 focus:outline-none sm:px-6"
  >
    <slot />
  </main>
</template>
