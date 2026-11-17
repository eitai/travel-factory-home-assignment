<script setup lang="ts">
import { ref } from 'vue';
import type { VacationRequestDto } from '@vacation-manager/shared';
import {
  describeVacationPeriod,
  formatDateRangeWithWeekdays,
  formatVacationLength,
} from '../services/presentationService';
import DateLeaves from './DateLeaves.vue';
import RequestHistory from './RequestHistory.vue';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{
  vacationRequests: VacationRequestDto[];
  showsRequester: boolean;
  label: string;
}>();

defineSlots<{ actions(slotProps: { vacationRequest: VacationRequestDto }): unknown }>();

const requestIdWithOpenHistory = ref<number | null>(null);

function isHistoryOpen(vacationRequest: VacationRequestDto): boolean {
  return requestIdWithOpenHistory.value === vacationRequest.id;
}

function toggleHistory(vacationRequest: VacationRequestDto): void {
  requestIdWithOpenHistory.value = isHistoryOpen(vacationRequest) ? null : vacationRequest.id;
}

function describeRequest(vacationRequest: VacationRequestDto): string {
  const { startDate, endDate, userName } = vacationRequest;
  return props.showsRequester
    ? `${userName} · ${formatVacationLength(startDate, endDate)}`
    : describeVacationPeriod(startDate, endDate);
}
</script>

<template>
  <ul class="space-y-3.5" :aria-label="label">
    <li
      v-for="vacationRequest in vacationRequests"
      :key="vacationRequest.id"
      class="card @container p-5"
    >
      <div
        class="grid gap-4 @md:grid-cols-[auto_1fr] @md:items-center @md:gap-x-5 @3xl:grid-cols-[auto_1fr_auto]"
      >
        <DateLeaves :start-date="vacationRequest.startDate" :end-date="vacationRequest.endDate" />

        <div class="min-w-0">
          <p class="text-lg leading-snug font-bold">{{ describeRequest(vacationRequest) }}</p>
          <p class="break-words text-ink-muted">
            {{ formatDateRangeWithWeekdays(vacationRequest.startDate, vacationRequest.endDate) }}
            <template v-if="vacationRequest.reason"> · {{ vacationRequest.reason }}</template>
          </p>
          <p
            v-if="vacationRequest.comments"
            class="mt-2 rounded-xl bg-rejected-soft px-3.5 py-2.5 text-[0.9375rem] break-words text-rejected-ink"
          >
            <strong>Validator's comment:</strong>
            {{ vacationRequest.comments }}
          </p>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-3 @md:col-span-2 @3xl:col-span-1 @3xl:flex-col @3xl:items-end @3xl:justify-center"
        >
          <StatusBadge :status="vacationRequest.status" />
          <div class="flex flex-wrap gap-2 @3xl:justify-end">
            <slot name="actions" :vacation-request="vacationRequest" />
            <button
              type="button"
              class="button"
              :aria-expanded="isHistoryOpen(vacationRequest)"
              @click="toggleHistory(vacationRequest)"
            >
              History
            </button>
          </div>
        </div>
      </div>

      <div v-if="isHistoryOpen(vacationRequest)" class="mt-4 border-t border-line pt-4">
        <RequestHistory
          :vacation-request-id="vacationRequest.id"
          :last-changed-at="vacationRequest.updatedAt"
        />
      </div>
    </li>
  </ul>
</template>
