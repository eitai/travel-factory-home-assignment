<script setup lang="ts">
import { ref, watch } from 'vue';
import { formatDateTime, type VacationRequestHistoryEntryDto } from '@vacation-manager/shared';
import { readApiError } from '../services/errorService';
import { describeHistoryEntry } from '../services/presentationService';
import { fetchVacationRequestHistory } from '../services/vacationRequestService';

const props = defineProps<{ vacationRequestId: number; lastChangedAt: string }>();

const historyEntries = ref<VacationRequestHistoryEntryDto[]>([]);
const hasLoaded = ref(false);
const errorMessage = ref<string | null>(null);

async function loadHistory(): Promise<void> {
  errorMessage.value = null;
  try {
    historyEntries.value = await fetchVacationRequestHistory(props.vacationRequestId);
  } catch (error) {
    errorMessage.value = readApiError(error).message;
  } finally {
    hasLoaded.value = true;
  }
}

watch(() => [props.vacationRequestId, props.lastChangedAt], loadHistory, { immediate: true });
</script>

<template>
  <p v-if="!hasLoaded" role="status" class="text-ink-muted">Loading the history of this request</p>

  <div v-else-if="errorMessage" role="alert">
    <p class="font-semibold">{{ errorMessage }}</p>
    <button type="button" class="button mt-3" @click="loadHistory">Try again</button>
  </div>

  <p v-else-if="historyEntries.length === 0" class="text-ink-muted">
    Nothing has been recorded for this request yet.
  </p>

  <ol v-else class="space-y-3 border-l-2 border-accent-soft pl-4">
    <li v-for="historyEntry in historyEntries" :key="historyEntry.id" class="text-[0.9375rem]">
      <p class="font-medium break-words">{{ describeHistoryEntry(historyEntry) }}</p>
      <p class="text-sm text-ink-muted">{{ formatDateTime(historyEntry.occurredAt) }}</p>
    </li>
  </ol>
</template>
