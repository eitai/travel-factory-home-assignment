<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  firstDayOfMonth,
  formatMonth,
  lastDayOfMonth,
  todayIsoDate,
  VacationRequestStatus,
} from '@vacation-manager/shared';
import DataState from '../components/DataState.vue';
import TeamCalendarGrid from '../components/TeamCalendarGrid.vue';
import { statusLabels, statusMarkerClasses } from '../services/presentationService';
import { readQueryText } from '../services/routeQueryService';
import { useAppStore } from '../store';

const MONTHS_PER_YEAR = 12;
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
  const [yearText, monthText] = (
    /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey) ? monthKey : currentMonthKey
  ).split('-');
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

function showMonth(year: number, monthIndex: number): void {
  const monthKey = firstDayOfMonth(year, monthIndex).slice(0, 7);
  void router.push({ query: monthKey === currentMonthKey ? {} : { month: monthKey } });
}

function showNeighbouringMonth(monthOffset: number): void {
  const monthsSinceYearZero =
    shownMonth.value.year * MONTHS_PER_YEAR + shownMonth.value.monthIndex + monthOffset;
  showMonth(
    Math.floor(monthsSinceYearZero / MONTHS_PER_YEAR),
    monthsSinceYearZero % MONTHS_PER_YEAR,
  );
}

function showCurrentMonth(): void {
  void router.push({ query: {} });
}
</script>

<template>
  <h1 class="text-2xl font-semibold tracking-tight">Team calendar</h1>

  <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
    <h2 class="text-lg font-semibold" aria-live="polite">{{ monthName }}</h2>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="button button-secondary" @click="showNeighbouringMonth(-1)">
        Previous month
      </button>
      <button
        type="button"
        class="button button-secondary"
        :disabled="isCurrentMonth"
        @click="showCurrentMonth"
      >
        This month
      </button>
      <button type="button" class="button button-secondary" @click="showNeighbouringMonth(1)">
        Next month
      </button>
    </div>
  </div>

  <ul class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Legend">
    <li v-for="status in legendStatuses" :key="status" class="flex items-center gap-2">
      <span
        class="status-marker size-4"
        :class="statusMarkerClasses[status]"
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
