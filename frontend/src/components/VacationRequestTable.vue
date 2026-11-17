<script setup lang="ts">
import { computed, ref } from 'vue';
import type { VacationRequestDto } from '@vacation-manager/shared';
import { formatDateRange, formatVacationLength } from '../services/presentationService';
import { useIsWideScreen } from '../services/screenService';
import RequestHistory from './RequestHistory.vue';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{
  vacationRequests: VacationRequestDto[];
  showsRequester: boolean;
  caption: string;
}>();

defineSlots<{ actions(slotProps: { vacationRequest: VacationRequestDto }): unknown }>();

const isWideScreen = useIsWideScreen();
const requestIdWithOpenHistory = ref<number | null>(null);
const columnCount = computed(() => (props.showsRequester ? 6 : 5));

function isHistoryOpen(vacationRequest: VacationRequestDto): boolean {
  return requestIdWithOpenHistory.value === vacationRequest.id;
}

function toggleHistory(vacationRequest: VacationRequestDto): void {
  requestIdWithOpenHistory.value = isHistoryOpen(vacationRequest) ? null : vacationRequest.id;
}
</script>

<template>
  <div v-if="isWideScreen" class="panel overflow-hidden">
    <table class="w-full text-left text-sm">
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead class="border-b border-line bg-surface text-ink-muted">
        <tr>
          <th v-if="showsRequester" scope="col" class="px-4 py-3 font-medium">Requester</th>
          <th scope="col" class="px-4 py-3 font-medium">Dates</th>
          <th scope="col" class="px-4 py-3 font-medium">Length</th>
          <th scope="col" class="px-4 py-3 font-medium">Reason</th>
          <th scope="col" class="px-4 py-3 font-medium">Status</th>
          <th scope="col" class="px-4 py-3 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="vacationRequest in vacationRequests" :key="vacationRequest.id">
          <tr class="border-b border-line align-top last:border-b-0">
            <td v-if="showsRequester" class="px-4 py-3 font-medium">
              {{ vacationRequest.userName }}
            </td>
            <td class="px-4 py-3 font-medium tabular-nums">
              {{ formatDateRange(vacationRequest.startDate, vacationRequest.endDate) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap tabular-nums">
              {{ formatVacationLength(vacationRequest.startDate, vacationRequest.endDate) }}
            </td>
            <td class="max-w-xs px-4 py-3 break-words">{{ vacationRequest.reason }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="vacationRequest.status" />
              <p v-if="vacationRequest.comments" class="mt-1 max-w-xs break-words">
                <span class="font-medium">Validator's comment:</span>
                {{ vacationRequest.comments }}
              </p>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <slot name="actions" :vacation-request="vacationRequest" />
                <button
                  type="button"
                  class="button button-secondary"
                  :aria-expanded="isHistoryOpen(vacationRequest)"
                  @click="toggleHistory(vacationRequest)"
                >
                  History
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="isHistoryOpen(vacationRequest)" class="border-b border-line bg-surface">
            <td :colspan="columnCount" class="px-4 py-4">
              <RequestHistory
                :vacation-request-id="vacationRequest.id"
                :last-changed-at="vacationRequest.updatedAt"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <ul v-else class="space-y-3" :aria-label="caption">
    <li v-for="vacationRequest in vacationRequests" :key="vacationRequest.id" class="panel p-4">
      <p v-if="showsRequester" class="font-semibold">{{ vacationRequest.userName }}</p>
      <p class="font-medium tabular-nums">
        {{ formatDateRange(vacationRequest.startDate, vacationRequest.endDate) }}
      </p>
      <p class="text-sm text-ink-muted tabular-nums">
        {{ formatVacationLength(vacationRequest.startDate, vacationRequest.endDate) }}
      </p>
      <p v-if="vacationRequest.reason" class="mt-2 text-sm break-words">
        {{ vacationRequest.reason }}
      </p>
      <div class="mt-2">
        <StatusBadge :status="vacationRequest.status" />
      </div>
      <p v-if="vacationRequest.comments" class="mt-2 text-sm break-words">
        <span class="font-medium">Validator's comment:</span>
        {{ vacationRequest.comments }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <slot name="actions" :vacation-request="vacationRequest" />
        <button
          type="button"
          class="button button-secondary"
          :aria-expanded="isHistoryOpen(vacationRequest)"
          @click="toggleHistory(vacationRequest)"
        >
          History
        </button>
      </div>
      <div v-if="isHistoryOpen(vacationRequest)" class="mt-4">
        <RequestHistory
          :vacation-request-id="vacationRequest.id"
          :last-changed-at="vacationRequest.updatedAt"
        />
      </div>
    </li>
  </ul>
</template>
