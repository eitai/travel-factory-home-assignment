<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  addMonths,
  firstDayOfMonth,
  formatMonth,
  lastDayOfMonth,
  todayIsoDate,
  VacationRequestStatus,
} from '@vacation-manager/shared';
import DataState from '../components/DataState.vue';
import PageHeading from '../components/PageHeading.vue';
import TeamCalendarGrid from '../components/TeamCalendarGrid.vue';
import { statusLabels, vacationBarClasses } from '../services/presentationService';
import { readQueryText } from '../services/routeQueryService';
import { useAppStore } from '../store';

const legendStatuses = [VacationRequestStatus.Approved, VacationRequestStatus.Pending];

const store = useAppStore();
const route = useRoute();
const router = useRouter();

const today = todayIsoDate();
const currentMonthKey = today.slice(0, 7);

const members = computed(() => store.state.teamCalendar.members);
const hasLoaded = computed(() => store.state.teamCalendar.hasLoaded);
const isLoading = computed(() => store.state.teamCalendar.isLoading);
const errorMessage = computed(() => store.state.teamCalendar.errorMessage);

const shownMonth = computed(() => {
  const monthKey = readQueryText(route.query, 'month') ?? '';
  const validMonthKey = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey) ? monthKey : currentMonthKey;
  const [yearText, monthText] = validMonthKey.split('-');
  return { year: Number(yearText), monthIndex: Number(monthText) - 1 };
});

const firstDay = computed(() =>
  firstDayOfMonth(shownMonth.value.year, shownMonth.value.monthIndex),
);
const lastDay = computed(() => lastDayOfMonth(shownMonth.value.year, shownMonth.value.monthIndex));
const monthName = computed(() => formatMonth(shownMonth.value.year, shownMonth.value.monthIndex));
const isCurrentMonth = computed(() => firstDay.value.slice(0, 7) === currentMonthKey);

function loadCalendar(): void {
  void store.dispatch('teamCalendar/load', { from: firstDay.value, to: lastDay.value });
}

watch([firstDay, lastDay], loadCalendar, { immediate: true });

function showNeighbouringMonth(monthOffset: number): void {
  const monthKey = addMonths(firstDay.value, monthOffset).slice(0, 7);
  void router.push({ query: monthKey === currentMonthKey ? {} : { month: monthKey } });
}

function showCurrentMonth(): void {
  void router.push({ query: {} });
}
</script>

<template>
  <PageHeading lead="Approved and pending vacations of the whole team, one month at a time.">
    Who is away, <em>and when.</em>
  </PageHeading>

  <div class="mt-9 flex flex-wrap items-center justify-between gap-3">
    <h2 class="section-title" aria-live="polite">{{ monthName }}</h2>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="button" @click="showNeighbouringMonth(-1)">
        Previous month
      </button>
      <button type="button" class="button" :disabled="isCurrentMonth" @click="showCurrentMonth">
        This month
      </button>
      <button type="button" class="button" @click="showNeighbouringMonth(1)">Next month</button>
    </div>
  </div>

  <ul
    class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] text-ink-muted"
    aria-label="Legend"
  >
    <li v-for="status in legendStatuses" :key="status" class="flex items-center gap-2">
      <span
        class="vacation-bar vacation-bar-start vacation-bar-end ml-0 h-4 w-8"
        :class="vacationBarClasses[status]"
        aria-hidden="true"
      ></span>
      {{ statusLabels[status] }}
    </li>
  </ul>

  <div class="mt-4" :aria-busy="isLoading">
    <DataState
      :is-loading="isLoading && !hasLoaded"
      :error-message="errorMessage"
      :is-empty="hasLoaded && members.length === 0"
      loading-label="Loading the team calendar"
      @retry="loadCalendar"
    >
      <template #empty>
        <p>
          There are no team members to show yet. Requesters appear here once they have accounts.
        </p>
      </template>

      <TeamCalendarGrid
        :members="members"
        :first-day="firstDay"
        :last-day="lastDay"
        :today="today"
        :label="`Team vacations in ${monthName}`"
      />
    </DataState>
  </div>
</template>
