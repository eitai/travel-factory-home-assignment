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
    class="inline-flex items-center gap-2 rounded-full py-1 pr-3.5 pl-2.5 text-sm font-bold whitespace-nowrap"
    :class="statusBadgeClasses[status]"
  >
    <span class="status-marker" :class="statusMarkerClasses[status]" aria-hidden="true"></span>
    {{ statusLabels[status] }}
  </span>
</template>
