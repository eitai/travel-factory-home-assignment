<script setup lang="ts">
import type { VacationRequestStatus } from '@vacation-manager/shared';
import {
  statusBadgeClasses,
  statusLabels,
  statusMarkerClasses,
} from '../services/presentationService';

defineProps<{ status: VacationRequestStatus }>();
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-sm font-medium whitespace-nowrap"
    :class="statusBadgeClasses[status]"
  >
    <span class="status-marker" :class="statusMarkerClasses[status]" aria-hidden="true"></span>
    {{ statusLabels[status] }}
  </span>
</template>
