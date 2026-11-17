<script setup lang="ts">
import { ref, watch } from 'vue';
import { formatDateTime, type VacationRequestHistoryEntryDto } from '@vacation-manager/shared';
import { readApiError } from '../services/errorService';
import { describeHistoryEntry } from '../services/presentationService';
import { fetchVacationRequestHistory } from '../services/vacationRequestService';
import DataState from './DataState.vue';

const props = defineProps<{ vacationRequestId: number; lastChangedAt: string }>();

const historyEntries = ref<VacationRequestHistoryEntryDto[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

async function loadHistory(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    historyEntries.value = await fetchVacationRequestHistory(props.vacationRequestId);
  } catch (error) {
    errorMessage.value = readApiError(error).message;
  } finally {
    isLoading.value = false;
  }
}

watch(() => [props.vacationRequestId, props.lastChangedAt], loadHistory, { immediate: true });
</script>

<template>
  <DataState
    :is-loading="isLoading && historyEntries.length === 0"
    :error-message="errorMessage"
    :is-empty="historyEntries.length === 0"
    loading-label="Loading the history of this request"
    @retry="loadHistory"
  >
    <template #empty>
      <p>Nothing has been recorded for this request yet.</p>
    </template>

    <ol class="space-y-2 border-l-2 border-line pl-4">
      <li v-for="historyEntry in historyEntries" :key="historyEntry.id" class="text-sm">
        <p>{{ describeHistoryEntry(historyEntry) }}</p>
        <p class="text-ink-muted">{{ formatDateTime(historyEntry.occurredAt) }}</p>
      </li>
    </ol>
  </DataState>
</template>
