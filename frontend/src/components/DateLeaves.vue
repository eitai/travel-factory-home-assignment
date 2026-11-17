<script setup lang="ts">
import { computed } from 'vue';
import { formatMonthShort, getDayOfMonth, type IsoDate } from '@vacation-manager/shared';

const props = defineProps<{ startDate: IsoDate; endDate: IsoDate }>();

const leaves = computed(() => {
  const dates =
    props.startDate === props.endDate ? [props.startDate] : [props.startDate, props.endDate];
  return dates.map((date) => ({
    date,
    month: formatMonthShort(date),
    dayOfMonth: getDayOfMonth(date),
  }));
});
</script>

<template>
  <div class="flex items-center gap-2 font-semibold text-ink-muted" aria-hidden="true">
    <template v-for="(leaf, leafIndex) in leaves" :key="leaf.date">
      <span v-if="leafIndex > 0">to</span>
      <span
        class="block w-[4.25rem] overflow-hidden rounded-[0.875rem] border border-line bg-white text-center shadow-[0_6px_14px_-10px_rgb(29_43_42/0.5)]"
      >
        <span
          class="block bg-accent py-0.5 text-xs font-bold tracking-[0.08em] text-white uppercase"
        >
          {{ leaf.month }}
        </span>
        <span class="block font-display text-3xl leading-tight font-semibold text-ink tabular-nums">
          {{ leaf.dayOfMonth }}
        </span>
      </span>
    </template>
  </div>
</template>
